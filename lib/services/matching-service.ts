import { createClient } from "@/lib/supabase/client";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { fetchPlatformSettings } from "@/lib/services/platform-settings-service";
import { PublicProfile, Match, SwipeAction, Profile, ProfilePhoto } from "@/types/database";
import { getMemberId, isMatchingMemberId } from "@/lib/utils/member-id";
import { calculateAge } from "@/lib/utils";
import { decryptMessage } from "@/lib/security/e2ee";

export async function fetchDiscoveryCandidates(
  currentUserId: string,
  cityFilter?: string
): Promise<PublicProfile[]> {
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return devStore.getDiscoveryCandidates(currentUserId);
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_discovery_candidates", {
    p_limit: 25,
    p_city_filter: cityFilter || null,
  });

  if (error) {
    console.error("Error calling get_discovery_candidates RPC:", error);
    // Graceful fallback to devStore so UI does not freeze
    return devStore.getDiscoveryCandidates(currentUserId);
  }

  const candidates = ((data as PublicProfile[]) || []).map((row) => ({
    id: row.id,
    display_name: row.display_name,
    age: row.age,
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
    photos: row.photos || [],
    primary_photo_url: row.photos?.[0]?.url,
  }));

  const settings = await fetchPlatformSettings();
  let pool = candidates.length > 0 ? candidates : devStore.getDiscoveryCandidates(currentUserId);

  if (settings.require_photo_to_discover) {
    pool = pool.filter((c) => Boolean(c.primary_photo_url || (c.photos && c.photos.length > 0)));
  }

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

export async function fetchUserMatches(currentUserId: string): Promise<Match[]> {
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

