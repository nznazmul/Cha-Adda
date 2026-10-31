import { createClient } from "@/lib/supabase/client";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { fetchPlatformSettings } from "@/lib/services/platform-settings-service";
import { PublicProfile, Match, SwipeAction, Profile, ProfilePhoto } from "@/types/database";
import { getMemberId, isMatchingMemberId } from "@/lib/utils/member-id";
import { calculateAge } from "@/lib/utils";
import { decryptMessage } from "@/lib/security/e2ee";
import { calculateDistanceBetween } from "@/lib/services/geo-service";
import { fetchUserPreferences } from "@/lib/services/preferences-service";

export interface DiscoveryCandidateOptions {
  cityFilter?: string;
  maxDistanceKm?: number;
  minAge?: number;
  maxAge?: number;
  genders?: string[];
  interest?: string;
  intention?: string;
}

export async function fetchDiscoveryCandidates(
  currentUserId: string,
  options?: DiscoveryCandidateOptions | string
): Promise<PublicProfile[]> {
  const cityFilter = typeof options === "string" ? options : options?.cityFilter;
  const opts = typeof options === "object" ? options : {};
  let maxDistanceKm = opts.maxDistanceKm;

  // Resolve user's distance preference if not explicitly provided
  let userPrefs = null;
  try {
    userPrefs = await fetchUserPreferences(currentUserId);
    if (typeof maxDistanceKm !== "number") {
      maxDistanceKm = userPrefs.max_distance_km;
    }
  } catch {
    if (typeof maxDistanceKm !== "number") {
      maxDistanceKm = 50;
    }
  }

  const effectiveMinAge = opts.minAge ?? userPrefs?.min_age ?? 18;
  const effectiveMaxAge = opts.maxAge ?? userPrefs?.max_age ?? 100;
  const effectiveGenders = opts.genders ?? userPrefs?.preferred_genders;
  const effectiveInterest = opts.interest?.trim().toLowerCase();
  const effectiveIntention = opts.intention?.trim().toLowerCase();

  const filterPayload = {
    maxDistanceKm,
    minAge: effectiveMinAge,
    maxAge: effectiveMaxAge,
    genders: effectiveGenders,
    interest: effectiveInterest,
    intention: effectiveIntention,
  };

  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return devStore.getDiscoveryCandidates(currentUserId, filterPayload);
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_discovery_candidates", {
    p_limit: 50,
    p_city_filter: cityFilter || null,
  });

  if (error) {
    console.error("Error calling get_discovery_candidates RPC:", error);
    // Graceful fallback to devStore so UI does not freeze
    return devStore.getDiscoveryCandidates(currentUserId, filterPayload);
  }

  // Fetch current user's location to compute accurate distances
  let currentUserLocation: { id?: string; city?: string | null; latitude?: number | null; longitude?: number | null } = {
    id: currentUserId,
    city: "Dhaka",
  };
  try {
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("id, city, latitude, longitude")
      .eq("id", currentUserId)
      .maybeSingle();
    if (currentProfile) {
      currentUserLocation = currentProfile;
    }
  } catch (err) {
    console.warn("Could not load current user location for distance:", err);
  }

  const candidates = ((data as PublicProfile[]) || []).map((row) => {
    const dist = calculateDistanceBetween(currentUserLocation, {
      id: row.id,
      city: row.city,
    });

    return {
      id: row.id,
      display_name: row.display_name,
      age: row.age,
      gender: row.gender,
      orientation: row.orientation,
      bio: row.bio,
      city: row.city,
      approx_distance_km: dist,
      job_title: row.job_title,
      education: row.education,
      height_cm: row.height_cm,
      dating_intentions: row.dating_intentions || [],
      interests: row.interests || [],
      languages: row.languages || [],
      photos: row.photos || [],
      primary_photo_url: row.photos?.[0]?.url,
    };
  });

  const settings = await fetchPlatformSettings();
  let pool = candidates.length > 0 ? candidates : devStore.getDiscoveryCandidates(currentUserId, filterPayload);

  if (settings.require_photo_to_discover) {
    pool = pool.filter((c) => Boolean(c.primary_photo_url || (c.photos && c.photos.length > 0)));
  }

  // Filter candidates by maximum distance radius if radius < 300 (not "whole country")
  if (typeof maxDistanceKm === "number" && maxDistanceKm < 300) {
    pool = pool.filter((c) => {
      if (typeof c.approx_distance_km === "number") {
        return c.approx_distance_km <= maxDistanceKm;
      }
      return true;
    });
  }

  // Filter candidates by age range
  pool = pool.filter((c) => c.age >= effectiveMinAge && c.age <= effectiveMaxAge);

  // Filter candidates by gender
  if (Array.isArray(effectiveGenders) && effectiveGenders.length > 0) {
    pool = pool.filter((c) => effectiveGenders.includes(c.gender));
  }

  // Filter by shared interests
  if (effectiveInterest) {
    pool = pool.filter(
      (c) => c.interests && c.interests.some((i) => i.toLowerCase().includes(effectiveInterest))
    );
  }

  // Filter by dating intentions
  if (effectiveIntention) {
    pool = pool.filter(
      (c) =>
        c.dating_intentions &&
        c.dating_intentions.some((d) => d.toLowerCase().includes(effectiveIntention))
    );
  }

  // Sort by closest distance first
  pool.sort((a, b) => (a.approx_distance_km ?? 999) - (b.approx_distance_km ?? 999));

  return pool;
}

export async function submitSwipe(
  actorId: string,
  targetId: string,
  action: SwipeAction,
  inviteNote?: string,
  inviteVenue?: string
): Promise<{ isMatch: boolean; matchId?: string }> {
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return devStore.recordSwipe(actorId, targetId, action, inviteNote, inviteVenue);
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("record_swipe", {
    p_target_id: targetId,
    p_action: action === "tea_invite" ? "like" : action,
  });

  if (error) {
    console.error("Error recording swipe via RPC:", error);
    return devStore.recordSwipe(actorId, targetId, action, inviteNote, inviteVenue);
  }

  return {
    isMatch: Boolean(data?.is_match),
    matchId: data?.match_id,
  };
}

export async function ensureUserMatch(
  targetUserId: string
): Promise<{ success: boolean; matchId: string }> {
  try {
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId, createIfMissing: true }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.matchId) {
        return { success: true, matchId: data.matchId };
      }
    }
  } catch (err) {
    console.warn("ensureUserMatch API failed, using fallback:", err);
  }

  // Fallback to devStore
  const currentId = devStore.getCurrentUserId();
  devStore.recordSwipe(targetUserId, currentId, "like");
  const devRes = devStore.recordSwipe(currentId, targetUserId, "like");
  return {
    success: true,
    matchId:
      devRes.matchId ||
      `match-${currentId < targetUserId ? currentId + "-" + targetUserId : targetUserId + "-" + currentId}`,
  };
}

export async function fetchUserMatches(currentUserId: string): Promise<Match[]> {
  // 1. In browser, query /api/matches which runs with service role and hydrates everything reliably
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.matches) && data.matches.length > 0) {
          return data.matches;
        }
      }
    } catch (apiErr) {
      console.warn("Could not fetch matches via /api/matches, falling back:", apiErr);
    }
  }

  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    const devMatches = devStore.getMatches(currentUserId);
    return Promise.all(
      devMatches.map(async (m) => {
        if (!m.last_message) return m;
        try {
          const decrypted = await decryptMessage(m.last_message.content, m.id);
          return {
            ...m,
            last_message: {
              ...m.last_message,
              content: decrypted,
            },
          };
        } catch {
          return m;
        }
      })
    );
  }

  const supabase = createClient();
  const { data: matchesData, error } = await supabase
    .from("matches")
    .select(`
      id,
      user_a_id,
      user_b_id,
      status,
      created_at
    `)
    .or(`user_a_id.eq.${currentUserId},user_b_id.eq.${currentUserId}`)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error || !matchesData) {
    console.error("Error fetching matches:", error);
    return devStore.getMatches(currentUserId);
  }

  // Hydrate other user public profile and decrypt last message
  const results: Match[] = [];
  for (const m of matchesData) {
    const otherId = m.user_a_id === currentUserId ? m.user_b_id : m.user_a_id;
    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        id,
        display_name,
        date_of_birth,
        gender,
        bio,
        city
      `)
      .eq("id", otherId)
      .single();

    const { data: photos } = await supabase
      .from("profile_photos")
      .select("*")
      .eq("user_id", otherId)
      .order("is_primary", { ascending: false });

    // Latest message
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", m.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (profile) {
      const age = calculateAge(profile.date_of_birth);
      let lastMsg = msgs?.[0] || null;

      if (lastMsg && lastMsg.content) {
        try {
          const decrypted = await decryptMessage(lastMsg.content, m.id);
          lastMsg = { ...lastMsg, content: decrypted };
        } catch {
          // Keep raw if decryption fails
        }
      }

      results.push({
        ...m,
        other_user: {
          id: profile.id,
          display_name: profile.display_name,
          age: Math.max(18, isNaN(age) ? 18 : age),
          gender: profile.gender,
          bio: profile.bio,
          city: profile.city,
          photos: photos || [],
          primary_photo_url: photos?.[0]?.url,
          dating_intentions: [],
          interests: [],
          languages: [],
        },
        last_message: lastMsg,
        unread_count: 0,
      });
    }
  }

  return results;
}

export async function fetchIncomingLikes(currentUserId: string): Promise<PublicProfile[]> {
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return devStore.getIncomingLikes(currentUserId);
  }

  const supabase = createClient();
  const { data: swipes, error } = await supabase
    .from("swipes")
    .select("from_user_id")
    .eq("to_user_id", currentUserId)
    .eq("action", "like");

  if (error || !swipes) {
    return devStore.getIncomingLikes(currentUserId);
  }

  const likers: PublicProfile[] = [];
  for (const s of swipes) {
    const { data: p } = await supabase
      .from("profiles")
      .select("id, display_name, date_of_birth, gender, bio, city")
      .eq("id", s.from_user_id)
      .eq("account_status", "active")
      .single();

    if (p) {
      const { data: photos } = await supabase
        .from("profile_photos")
        .select("*")
        .eq("user_id", p.id)
        .order("is_primary", { ascending: false });

      const age = calculateAge(p.date_of_birth);
      likers.push({
        id: p.id,
        display_name: p.display_name,
        age: Math.max(18, isNaN(age) ? 18 : age),
        gender: p.gender,
        bio: p.bio,
        city: p.city,
        dating_intentions: [],
        interests: [],
        languages: [],
        photos: photos || [],
        primary_photo_url: photos?.[0]?.url,
      });
    }
  }

  if (likers.length === 0) {
    return devStore.getIncomingLikes(currentUserId);
  }

  return likers;
}

export async function unmatchUser(matchId: string, currentUserId: string): Promise<boolean> {
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    const match = devStore.getMatch(matchId, currentUserId);
    if (match) {
      match.status = "unmatched";
      match.unmatched_at = new Date().toISOString();
      match.unmatched_by = currentUserId;
    }
    return true;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("matches")
    .update({
      status: "unmatched",
      unmatched_at: new Date().toISOString(),
      unmatched_by: currentUserId,
    })
    .eq("id", matchId)
    .or(`user_a_id.eq.${currentUserId},user_b_id.eq.${currentUserId}`);

  return !error;
}

export async function searchMembers(
  query: string,
  currentUserId: string
): Promise<PublicProfile[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return devStore.searchMembers(trimmed, currentUserId);
  }

  try {
    const supabase = createClient();
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, display_name, date_of_birth, gender, orientation, bio, city, job_title, education, height_cm, dating_intentions, interests, languages")
      .eq("is_discoverable", true)
      .neq("id", currentUserId)
      .limit(60);

    if (error || !profiles || profiles.length === 0) {
      return devStore.searchMembers(trimmed, currentUserId);
    }

    const qLower = trimmed.toLowerCase();
    const matchedRows = ((profiles as Profile[]) || []).filter((p: Profile) => {
      const mId = getMemberId(p);
      const nameMatch = p.display_name?.toLowerCase().includes(qLower);
      const cityMatch = p.city?.toLowerCase().includes(qLower);
      const idMatch = isMatchingMemberId(trimmed, p.id, mId);
      return Boolean(nameMatch || cityMatch || idMatch);
    });

    if (matchedRows.length === 0) {
      return devStore.searchMembers(trimmed, currentUserId);
    }

    const matchedIds = matchedRows.map((p: Profile) => p.id);
    const { data: photos } = await supabase
      .from("profile_photos")
      .select("*")
      .in("user_id", matchedIds)
      .order("is_primary", { ascending: false });

    const photoMap = new Map<string, ProfilePhoto[]>();
    (((photos as unknown as ProfilePhoto[]) || [])).forEach((ph: ProfilePhoto) => {
      const list = photoMap.get(ph.user_id) || [];
      list.push(ph);
      photoMap.set(ph.user_id, list);
    });

    const today = new Date();
    return matchedRows.map((row: Profile): PublicProfile => {
      const birth = new Date(row.date_of_birth || "2000-01-01");
      let age = today.getFullYear() - birth.getFullYear();
      if (
        today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
      ) {
        age--;
      }
      const userPhotos = photoMap.get(row.id) || [];

      return {
        id: row.id,
        unique_id: getMemberId(row),
        display_name: row.display_name,
        age: Math.max(18, age),
        gender: row.gender,
        orientation: row.orientation,
        bio: row.bio,
        city: row.city,
        job_title: row.job_title,
        education: row.education,
        height_cm: row.height_cm,
        dating_intentions: row.dating_intentions || [],
        interests: row.interests || [],
        languages: row.languages || [],
        photos: userPhotos,
        primary_photo_url: userPhotos[0]?.url,
      };
    });
  } catch (err) {
    console.error("Error in searchMembers:", err);
    return devStore.searchMembers(trimmed, currentUserId);
  }
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  const trimmed = (userId || "").trim();
  if (!trimmed) return null;

  try {
    const res = await fetch(`/api/users/${encodeURIComponent(trimmed)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.profile) {
        return data.profile;
      }
    }
  } catch {
    // API failed or running in non-fetch environment
  }

  // Resilient devStore fallback
  const local = devStore.getProfile(trimmed);
  if (local) {
    return devStore.toPublicProfile(local);
  }

  return null;
}

