import { createClient } from "@/lib/supabase/client";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { PlatformSettings } from "@/types/database";

const DEFAULT_SETTINGS: PlatformSettings = {
  min_age: 18,
  max_photos: 6,
  require_photo_to_discover: true,
  maintenance_mode: false,
};

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return devStore.getPlatformSettings();
  }

  const supabase = createClient();

  try {
    // 1. Try platform_settings table if it exists
    const { data: directData, error: directErr } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", "current")
      .maybeSingle();

    if (!directErr && directData) {
      return {
        min_age: directData.min_age ?? DEFAULT_SETTINGS.min_age,
        max_photos: directData.max_photos ?? DEFAULT_SETTINGS.max_photos,
        require_photo_to_discover: directData.require_photo_to_discover ?? DEFAULT_SETTINGS.require_photo_to_discover,
        maintenance_mode: Boolean(directData.maintenance_mode),
        updated_at: directData.updated_at,
        updated_by: directData.updated_by,
      };
    }

    // 2. Query admin_audit_logs where action_type = 'PLATFORM_SETTINGS'
    const { data: auditData, error: auditErr } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .eq("action_type", "PLATFORM_SETTINGS")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!auditErr && auditData && auditData.metadata) {
      const meta = auditData.metadata as Record<string, unknown>;
      return {
        min_age: typeof meta.min_age === "number" ? meta.min_age : DEFAULT_SETTINGS.min_age,
        max_photos: typeof meta.max_photos === "number" ? meta.max_photos : DEFAULT_SETTINGS.max_photos,
        require_photo_to_discover: meta.require_photo_to_discover !== undefined ? Boolean(meta.require_photo_to_discover) : DEFAULT_SETTINGS.require_photo_to_discover,
        maintenance_mode: Boolean(meta.maintenance_mode),
        updated_at: auditData.created_at,
        updated_by: auditData.admin_id,
      };
    }
  } catch (err) {
    console.error("Error fetching platform settings:", err);
  }

  return devStore.getPlatformSettings();
}

export async function savePlatformSettings(
  settings: Partial<PlatformSettings>,
  adminUserId: string
): Promise<{ success: boolean; data: PlatformSettings; error?: string }> {
  const current = await fetchPlatformSettings();
  const merged: PlatformSettings = {
    min_age: Math.max(18, settings.min_age ?? current.min_age),
    max_photos: Math.max(1, Math.min(12, settings.max_photos ?? current.max_photos)),
    require_photo_to_discover: settings.require_photo_to_discover !== undefined
      ? Boolean(settings.require_photo_to_discover)
      : current.require_photo_to_discover,
    maintenance_mode: settings.maintenance_mode !== undefined
      ? Boolean(settings.maintenance_mode)
      : current.maintenance_mode,
    updated_at: new Date().toISOString(),
    updated_by: adminUserId,
  };

  // Always keep devStore in sync
  devStore.savePlatformSettings(merged);

  // If running in browser, delegate to secure API route
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: merged }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return {
          success: false,
          data: merged,
          error: resData.error || "Failed to save settings via API.",
        };
      }

      // Trigger client-side event for instant local tab sync
      window.dispatchEvent(
        new CustomEvent("cha_adda_settings_updated", { detail: resData.settings || merged })
      );

      return { success: true, data: resData.settings || merged };
    } catch (err) {
      console.error("API call to save settings failed:", err);
      return { success: false, data: merged, error: (err as Error).message };
    }
  }

  return { success: true, data: merged };
}
