import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { calculateVerificationExpiry, VerificationDurationPreset } from "@/lib/utils/verification";

export async function GET(request: Request) {
  try {
    const { isSupabaseConfigured } = getAppEnv();

    if (!isSupabaseConfigured) {
      return NextResponse.json({ requests: devStore.getVerificationRequests() });
    }

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", authUser.id)
      .maybeSingle();

    if (
      !adminProfile ||
      (adminProfile.role !== "admin" && adminProfile.role !== "moderator")
    ) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Moderator role required." },
        { status: 403 }
      );
    }

    // 1. Try querying verification_requests table in Supabase
    const adminClient = createAdminClient();
    try {
      const { data, error } = await adminClient
        .from("verification_requests")
        .select(`
          *,
          user:profiles!verification_requests_user_id_fkey(id, display_name, city, date_of_birth, gender)
        `)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return NextResponse.json({ requests: data });
      }
    } catch {
      // Table may not exist yet
    }

    // 2. Fallback: Query admin_audit_logs for selfie verification submissions
    try {
      const { data: logs } = await adminClient
        .from("admin_audit_logs")
        .select("*")
        .eq("action_type", "SELFIE_VERIFICATION_SUBMITTED")
        .order("created_at", { ascending: false });

      if (logs && logs.length > 0) {
        const userIds = logs.map((l) => (l.metadata as Record<string, unknown>)?.userId as string).filter(Boolean);
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, display_name, city, date_of_birth, gender")
          .in("id", userIds);

        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

        const auditRequests = logs.map((log) => {
          const meta = (log.metadata || {}) as Record<string, unknown>;
          const uId = String(meta.userId || log.admin_id);
          const p = profileMap.get(uId);
          return {
            id: String(meta.requestId || log.target_id || log.id),
            user_id: uId,
            selfie_url: String(meta.selfieUrl || ""),
            status: String(meta.status || "pending") as "pending" | "approved" | "rejected",
            created_at: log.created_at,
            updated_at: log.created_at,
            user: p ? {
              id: p.id,
              display_name: p.display_name,
              city: p.city,
              date_of_birth: p.date_of_birth,
              gender: p.gender,
            } : undefined,
          };
        });

        // Merge with seed devStore requests
        const devRequests = devStore.getVerificationRequests();
        const combined = [...auditRequests];
        for (const dr of devRequests) {
          if (!combined.some((r) => r.id === dr.id)) {
            combined.push(dr);
          }
        }
        return NextResponse.json({ requests: combined });
      }
    } catch (logErr) {
      console.warn("Could not read verification requests from audit logs:", logErr);
    }

    // Default fallback to dev store
    return NextResponse.json({ requests: devStore.getVerificationRequests() });
  } catch (err: unknown) {
    console.error("GET /api/admin/verification error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, action, durationPreset = "1_month", reason } = body;

    if (!requestId || !action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { error: "requestId and valid action ('approve' | 'reject') are required." },
        { status: 400 }
      );
    }

    const { isSupabaseConfigured } = getAppEnv();
    let adminId = "admin-dev";

    if (isSupabaseConfigured) {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", authUser.id)
        .maybeSingle();

      if (
        !adminProfile ||
        (adminProfile.role !== "admin" && adminProfile.role !== "moderator")
      ) {
        return NextResponse.json(
          { error: "Forbidden: Admin or Moderator role required." },
          { status: 403 }
        );
      }

      adminId = authUser.id;
    }

    // Process in devStore
    const result = devStore.reviewVerificationRequest(
      requestId,
      action === "approve" ? "approved" : "rejected",
      adminId,
      durationPreset as VerificationDurationPreset,
      reason
    );

    if (!result.success || !result.request) {
      return NextResponse.json(
        { error: "Verification request not found." },
        { status: 404 }
      );
    }

    const targetUserId = result.request.user_id;

    // If Supabase is configured, update auth metadata & audit logs
    if (isSupabaseConfigured) {
      try {
        const adminClient = createAdminClient();
        const verified = action === "approve";
        const verified_until = verified
          ? calculateVerificationExpiry(durationPreset as VerificationDurationPreset)
          : null;

        const { data: targetAuth } = await adminClient.auth.admin.getUserById(targetUserId);
        if (targetAuth?.user) {
          await adminClient.auth.admin.updateUserById(targetUserId, {
            user_metadata: {
              ...targetAuth.user.user_metadata,
              verified,
              verified_until,
            },
          });
        }

        // Try updating profiles table directly
        try {
          await adminClient
            .from("profiles")
            .update({
              verified,
              verified_until,
              updated_at: new Date().toISOString(),
            })
            .eq("id", targetUserId);
        } catch {
          // Safe if columns not yet migrated
        }

        await adminClient.from("admin_audit_logs").insert({
          admin_id: adminId,
          action_type: verified ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED",
          target_type: "user",
          target_id: targetUserId,
          reason:
            reason ||
            (verified
              ? `Approved Blue Tick for ${durationPreset}`
              : "Rejected selfie verification"),
          metadata: {
            requestId,
            durationPreset,
            verified,
            verified_until,
          },
        });
      } catch (err) {
        console.warn("Could not sync verification to Supabase backend:", err);
      }
    }

    return NextResponse.json({
      success: true,
      request: result.request,
    });
  } catch (err: unknown) {
    console.error("PATCH /api/admin/verification error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
