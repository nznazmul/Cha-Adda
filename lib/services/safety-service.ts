import { createClient } from "@/lib/supabase/client";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { ReportCategory } from "@/types/database";

export async function blockMember(
  blockerId: string,
  blockedId: string
): Promise<boolean> {
  if (blockerId === blockedId) throw new Error("Cannot block yourself.");

  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    devStore.blockUser(blockerId, blockedId);
    return true;
  }

  const supabase = createClient();
  const { error } = await supabase.from("blocks").insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });

  if (error) {
    console.error("Error creating block record:", error);
    devStore.blockUser(blockerId, blockedId);
  }

  return true;
}

export async function submitReport(params: {
  reporterId: string;
  reportedUserId: string;
  category: ReportCategory;
  description?: string;
  messageId?: string;
}): Promise<boolean> {
  if (params.reporterId === params.reportedUserId) {
    throw new Error("Cannot report yourself.");
  }

  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    devStore.reportUser({
      reporter_id: params.reporterId,
      reported_user_id: params.reportedUserId,
      category: params.category,
      description: params.description || null,
      message_id: params.messageId || null,
      status: "pending",
    });
    return true;
  }

  const supabase = createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: params.reporterId,
    reported_user_id: params.reportedUserId,
    category: params.category,
    description: params.description || null,
    message_id: params.messageId || null,
    status: "pending",
  });

  if (error) {
    console.error("Error creating report:", error);
    devStore.reportUser({
      reporter_id: params.reporterId,
      reported_user_id: params.reportedUserId,
      category: params.category,
      description: params.description || null,
      message_id: params.messageId || null,
      status: "pending",
    });
  }

  return true;
}
