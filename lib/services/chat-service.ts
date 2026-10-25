import { createClient } from "@/lib/supabase/client";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { Message } from "@/types/database";

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
