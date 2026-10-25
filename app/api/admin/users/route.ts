import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { Profile } from "@/types/database";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return NextResponse.json(
        { error: "userId and updates are required." },
        { status: 400 }
      );
    }

    const { isSupabaseConfigured } = getAppEnv();

    if (!isSupabaseConfigured) {
      if (updates.account_status) {
        devStore.updateUserStatus(
          userId,
          updates.account_status,
          "admin-dev",
          updates.reason
        );
      }
      const existing = devStore.getProfile(userId);
      if (existing) {
        devStore.saveProfile({ ...existing, ...updates } as Profile);
      }
      return NextResponse.json({ success: true });
    }

    // 1. Verify caller session
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify caller has admin/moderator role
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id, role, account_status")
      .eq("id", authUser.id)
      .maybeSingle();

    if (
      !adminProfile ||
      (adminProfile.role !== "admin" && adminProfile.role !== "moderator")
    ) {
      return NextResponse.json(
        { error: "Forbidden: Administrator or Moderator role required." },
        { status: 403 }
      );
    }

    // If caller is moderator, prevent promoting to admin
    if (adminProfile.role === "moderator" && updates.role === "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only Administrators can promote to Admin." },
        { status: 403 }
      );
    }

    // 3. Perform update using server admin client
    const adminClient = createAdminClient();
    const { reason, ...profileFields } = updates;

    const { data: updatedProfile, error: updateErr } = await adminClient
      .from("profiles")
      .update({
        ...profileFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (updateErr) {
      console.error("Failed to update user via admin endpoint:", updateErr);
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      );
    }

    // 4. Record immutable audit log
    await adminClient.from("admin_audit_logs").insert({
      admin_id: authUser.id,
      action_type: updates.role
        ? `role_${updates.role}`
        : updates.account_status
        ? `status_${updates.account_status}`
        : "user_updated",
      target_type: "user",
      target_id: userId,
      reason:
        reason ||
        `Admin updated user (role: ${updates.role ?? "unchanged"}, status: ${
          updates.account_status ?? "unchanged"
        })`,
      metadata: updates,
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: unknown) {
    console.error("Admin user update error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
