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

    // In dev store we maintain all active verification requests
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
