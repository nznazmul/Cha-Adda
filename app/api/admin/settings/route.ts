import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { PlatformSettings } from "@/types/database";

const DEFAULT_SETTINGS: PlatformSettings = {
  min_age: 18,
  max_photos: 6,
  require_photo_to_discover: true,
  maintenance_mode: false,
};

export async function GET() {
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return NextResponse.json({ settings: devStore.getPlatformSettings() });
  }

  const supabase = createAdminClient();

  try {
    // 1. Try platform_settings
    const { data: directData } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", "current")
      .maybeSingle();

    if (directData) {
      return NextResponse.json({
        settings: {
          min_age: directData.min_age ?? DEFAULT_SETTINGS.min_age,
          max_photos: directData.max_photos ?? DEFAULT_SETTINGS.max_photos,
          require_photo_to_discover: directData.require_photo_to_discover ?? DEFAULT_SETTINGS.require_photo_to_discover,
          maintenance_mode: Boolean(directData.maintenance_mode),
          updated_at: directData.updated_at,
          updated_by: directData.updated_by,
        },
      });
    }

    // 2. Try admin_audit_logs
    const { data: auditData } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .eq("action_type", "PLATFORM_SETTINGS")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (auditData?.metadata) {
      const meta = auditData.metadata as Record<string, unknown>;
      return NextResponse.json({
        settings: {
          min_age: typeof meta.min_age === "number" ? meta.min_age : DEFAULT_SETTINGS.min_age,
          max_photos: typeof meta.max_photos === "number" ? meta.max_photos : DEFAULT_SETTINGS.max_photos,
          require_photo_to_discover: meta.require_photo_to_discover !== undefined ? Boolean(meta.require_photo_to_discover) : DEFAULT_SETTINGS.require_photo_to_discover,
          maintenance_mode: Boolean(meta.maintenance_mode),
          updated_at: auditData.created_at,
          updated_by: auditData.admin_id,
        },
      });
    }
  } catch (err) {
    console.error("API Error fetching system settings:", err);
  }

  return NextResponse.json({ settings: devStore.getPlatformSettings() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Invalid payload: updates required." }, { status: 400 });
    }

    const { isSupabaseConfigured } = getAppEnv();

    if (!isSupabaseConfigured) {
      const updated = devStore.savePlatformSettings(updates);
      return NextResponse.json({ success: true, settings: updated });
    }

    // 1. Verify caller session
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify caller has admin role
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id, role, account_status")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only Platform Administrators can alter system settings." },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();

    const merged: PlatformSettings = {
      min_age: Math.max(18, updates.min_age ?? DEFAULT_SETTINGS.min_age),
      max_photos: Math.max(1, Math.min(12, updates.max_photos ?? DEFAULT_SETTINGS.max_photos)),
      require_photo_to_discover: updates.require_photo_to_discover !== undefined
        ? Boolean(updates.require_photo_to_discover)
        : DEFAULT_SETTINGS.require_photo_to_discover,
      maintenance_mode: Boolean(updates.maintenance_mode),
      updated_at: new Date().toISOString(),
      updated_by: adminProfile.id,
    };

    // 1. Try platform_settings table
    try {
      await adminClient
        .from("platform_settings")
        .upsert({
          id: "current",
          min_age: merged.min_age,
          max_photos: merged.max_photos,
          require_photo_to_discover: merged.require_photo_to_discover,
          maintenance_mode: merged.maintenance_mode,
          updated_at: merged.updated_at,
          updated_by: adminProfile.id,
        });
    } catch {
      // platform_settings table may not exist yet; audit log persists it
    }

    // 2. Record in admin_audit_logs
    const { error: logErr } = await adminClient.from("admin_audit_logs").insert({
      admin_id: adminProfile.id,
      action_type: "PLATFORM_SETTINGS",
      target_type: "system",
      target_id: adminProfile.id,
      reason: `System settings updated: maintenance=${merged.maintenance_mode}, max_photos=${merged.max_photos}`,
      metadata: {
        min_age: merged.min_age,
        max_photos: merged.max_photos,
        require_photo_to_discover: merged.require_photo_to_discover,
        maintenance_mode: merged.maintenance_mode,
      },
    });

    if (logErr) {
      console.error("API: Failed to insert audit log for settings:", logErr);
    }

    // Update local devStore in sync
    devStore.savePlatformSettings(merged);

    return NextResponse.json({ success: true, settings: merged });
  } catch (err) {
    console.error("API error in admin settings POST:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
