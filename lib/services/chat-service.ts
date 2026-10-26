import { createClient } from "@/lib/supabase/client";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { Message, Match, PublicProfile, MatchStatus } from "@/types/database";
import { encryptMessage, decryptMessage } from "@/lib/security/e2ee";

import { calculateAge } from "@/lib/utils";

export async function fetchMatchDetails(
  matchId: string,
  currentUserId: string
): Promise<Match | null> {
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return devStore.getMatch(matchId, currentUserId) || null;
  }

  const supabase = createClient();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId);

  let match: { id: string; user_a_id: string; user_b_id: string; status: string; created_at: string } | null = null;

  if (isUUID) {
    // 1. Try finding match by match id
    const { data: matchById } = await supabase
      .from("matches")
      .select("id, user_a_id, user_b_id, status, created_at")
      .eq("id", matchId)
      .maybeSingle();

    if (matchById) {
      match = matchById;
    } else {
      // 2. Check if matchId is actually the other user's ID
      const userA = currentUserId < matchId ? currentUserId : matchId;
      const userB = currentUserId < matchId ? matchId : currentUserId;
      const { data: matchByPair } = await supabase
        .from("matches")
        .select("id, user_a_id, user_b_id, status, created_at")
        .eq("user_a_id", userA)
        .eq("user_b_id", userB)
        .maybeSingle();

      if (matchByPair) {
        match = matchByPair;
      }
    }
  }

  if (!match) {
    return devStore.getMatch(matchId, currentUserId) || null;
  }

  const otherId = match.user_a_id === currentUserId ? match.user_b_id : match.user_a_id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, date_of_birth, gender, bio, city, job_title, education, dating_intentions, interests, languages")
    .eq("id", otherId)
    .maybeSingle();

  const { data: photos } = await supabase
    .from("profile_photos")
    .select("*")
    .eq("user_id", otherId)
    .order("is_primary", { ascending: false });

  if (!profile) {
    return devStore.getMatch(matchId, currentUserId) || null;
  }

  const calculatedAge = calculateAge(profile.date_of_birth);
  const age = Math.max(18, isNaN(calculatedAge) ? 18 : calculatedAge);

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
    status: (match.status as MatchStatus) || "active",
    other_user: otherUser,
  };
}

export async function fetchConversationMessages(matchId: string): Promise<Message[]> {
  const { isSupabaseConfigured } = getAppEnv();

  let rawMessages: Message[] = [];
  if (!isSupabaseConfigured) {
    rawMessages = devStore.getMessages(matchId);
  } else {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      console.error("Error fetching messages:", error);
      rawMessages = devStore.getMessages(matchId);
    } else {
      rawMessages = data;
    }
  }

  // Decrypt all messages for the current conversation
  const decrypted = await Promise.all(
    rawMessages.map(async (msg) => ({
      ...msg,
      content: await decryptMessage(msg.content, matchId),
    }))
  );

  return decrypted;
}

export async function postChatMessage(
  matchId: string,
  senderId: string,
  content: string,
  messageType: "text" | "voice" | "tea_invite" = "text",
  voiceDuration?: number
): Promise<Message> {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message content cannot be empty.");
  if (trimmed.length > 2000) throw new Error("Message exceeds 2000 characters limit.");

  // Encrypt message before persistence with AES-GCM 256-bit
  const encryptedContent = await encryptMessage(trimmed, matchId);
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    const stored = devStore.sendMessage(matchId, senderId, encryptedContent, messageType, voiceDuration);
    return { ...stored, content: trimmed };
  }

  const supabase = createClient();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId);
  let resolvedMatchId = matchId;

  if (!isUUID && typeof window !== "undefined") {
    try {
      const ensureRes = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: matchId, createIfMissing: true }),
      });
      if (ensureRes.ok) {
        const ed = await ensureRes.json();
        if (ed.matchId) resolvedMatchId = ed.matchId;
      }
    } catch {
      // Continue with current ID
    }
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      match_id: resolvedMatchId,
      sender_id: senderId,
      content: encryptedContent,
      message_type: messageType,
      voice_duration: voiceDuration,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to post message to Supabase:", error);
    const stored = devStore.sendMessage(resolvedMatchId, senderId, encryptedContent, messageType, voiceDuration);
    return { ...stored, content: trimmed };
  }

  return { ...data, content: trimmed, message_type: messageType, voice_duration: voiceDuration };
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
      async (payload: { new: Message }) => {
        if (payload.new) {
          const decryptedContent = await decryptMessage(payload.new.content, matchId);
          onNewMessage({
            ...payload.new,
            content: decryptedContent,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
