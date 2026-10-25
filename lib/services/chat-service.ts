import { createClient } from "@/lib/supabase/client";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { Message, Match, PublicProfile } from "@/types/database";

export async function fetchMatchDetails(
  matchId: string,
  currentUserId: string
): Promise<Match | null> {
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return devStore.getMatch(matchId, currentUserId) || null;
  }

  const supabase = createClient();
  const { data: match, error } = await supabase
    .from("matches")
    .select("id, user_a_id, user_b_id, status, created_at")
    .eq("id", matchId)
    .single();

  if (error || !match) {
    return devStore.getMatch(matchId, currentUserId) || null;
  }

  const otherId = match.user_a_id === currentUserId ? match.user_b_id : match.user_a_id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, date_of_birth, gender, bio, city, job_title, education, dating_intentions, interests, languages")
    .eq("id", otherId)
    .single();

  const { data: photos } = await supabase
    .from("profile_photos")
    .select("*")
    .eq("user_id", otherId)
    .order("is_primary", { ascending: false });

  if (!profile) {
    return devStore.getMatch(matchId, currentUserId) || null;
  }

  const birth = new Date(profile.date_of_birth);
  const age = Math.max(18, new Date().getFullYear() - birth.getFullYear());

  const otherUser: PublicProfile = {
    id: profile.id,
    display_name: profile.display_name,
    age,
    gender: profile.gender,
    bio: profile.bio,
    city: profile.city,
    job_title: profile.job_title,
    education: profile.education,
    dating_intentions: profile.dating_intentions || [],
    interests: profile.interests || [],
    languages: profile.languages || [],
    photos: photos || [],
    primary_photo_url: photos?.[0]?.url,
  };

  return {
    ...match,
    other_user: otherUser,
  };
}

export async function fetchConversationMessages(matchId: string): Promise<Message[]> {
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return devStore.getMessages(matchId);
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("Error fetching messages:", error);
    return devStore.getMessages(matchId);
  }

  return data;
}

export async function postChatMessage(
  matchId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message content cannot be empty.");
  if (trimmed.length > 2000) throw new Error("Message exceeds 2000 characters limit.");

  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return devStore.sendMessage(matchId, senderId, trimmed);
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      match_id: matchId,
      sender_id: senderId,
      content: trimmed,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to post message to Supabase:", error);
    return devStore.sendMessage(matchId, senderId, trimmed);
  }

  return data;
}

export function subscribeToMatchMessages(
  matchId: string,
  onNewMessage: (msg: Message) => void
) {
  const { isSupabaseConfigured } = getAppEnv();
  if (!isSupabaseConfigured) {
    // Return empty cleanup function
    return () => {};
  }

  const supabase = createClient();
  const channel = supabase
    .channel(`match:${matchId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `match_id=eq.${matchId}`,
      },
      (payload: { new: Message }) => {
        if (payload.new) {
          onNewMessage(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
