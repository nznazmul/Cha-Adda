import { createClient } from "@/lib/supabase/client";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";

export interface UserPreferences {
  user_id: string;
  min_age: number;
  max_age: number;
  preferred_genders: string[];
  max_distance_km: number;
  location_enabled: boolean;
  show_distance: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  user_id: "",
  min_age: 18,
  max_age: 100,
  preferred_genders: ["woman", "man", "nonbinary"],
  max_distance_km: 50,
  location_enabled: true,
  show_distance: true,
};

const STORAGE_PREFIX = "cha_adda_prefs_";

function getLocalPrefs(userId: string): UserPreferences | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PREFERENCES, ...parsed, user_id: userId };
    }
  } catch {
    // Ignore storage parse issues
  }
  return null;
}

function setLocalPrefs(userId: string, prefs: UserPreferences, notify: boolean = false) {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(prefs));
    if (notify) {
      // Dispatch custom browser event only when user explicitly saves preferences
      window.dispatchEvent(
        new CustomEvent("cha_adda_preferences_changed", {
          detail: prefs,
        })
      );
    }
  } catch {
    // Ignore storage quota
  }
}

/**
 * Fetch discovery preferences for a user
 */
export async function fetchUserPreferences(userId: string): Promise<UserPreferences> {
  if (!userId) return { ...DEFAULT_PREFERENCES };

  // Check localStorage first for instant UI response
  const cached = getLocalPrefs(userId);

  const { isSupabaseConfigured } = getAppEnv();
  if (!isSupabaseConfigured) {
    const devPrefs = devStore.getPreferences(userId);
    const merged = { ...DEFAULT_PREFERENCES, ...cached, ...devPrefs, user_id: userId };
    // Cache quietly without firing re-render events
    setLocalPrefs(userId, merged, false);
    return merged;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profile_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      const result: UserPreferences = {
        user_id: userId,
        min_age: data.min_age ?? DEFAULT_PREFERENCES.min_age,
        max_age: data.max_age ?? DEFAULT_PREFERENCES.max_age,
        preferred_genders: data.preferred_genders ?? DEFAULT_PREFERENCES.preferred_genders,
        max_distance_km: data.max_distance_km ?? DEFAULT_PREFERENCES.max_distance_km,
        location_enabled: data.location_enabled ?? DEFAULT_PREFERENCES.location_enabled,
        show_distance: cached?.show_distance ?? DEFAULT_PREFERENCES.show_distance,
      };
      setLocalPrefs(userId, result, false);
      return result;
    }
  } catch (err) {
    console.warn("Could not query Supabase profile_preferences:", err);
  }

  return cached || { ...DEFAULT_PREFERENCES, user_id: userId };
}

/**
 * Save updated discovery preferences for a user
 */
export async function saveUserPreferences(
  userId: string,
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  const current = await fetchUserPreferences(userId);
  const updated: UserPreferences = {
    ...current,
    ...updates,
    user_id: userId,
  };

  // 1. Immediately update localStorage & dispatch event across components
  setLocalPrefs(userId, updated, true);

  // 2. Update devStore
  devStore.savePreferences(userId, updated);

  // 3. Persist to Supabase if available
  const { isSupabaseConfigured } = getAppEnv();
  if (isSupabaseConfigured) {
    try {
      const supabase = createClient();
      await supabase.from("profile_preferences").upsert(
        {
          user_id: userId,
          min_age: updated.min_age,
          max_age: updated.max_age,
          preferred_genders: updated.preferred_genders,
          max_distance_km: updated.max_distance_km,
          location_enabled: updated.location_enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      // Sync show_distance to user_settings table if needed
      await supabase.from("user_settings").upsert(
        {
          user_id: userId,
          show_distance: updated.show_distance,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    } catch (err) {
      console.warn("Could not sync preferences to Supabase:", err);
    }
  }

  return updated;
}
