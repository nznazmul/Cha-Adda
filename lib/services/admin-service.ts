import { createClient } from "@/lib/supabase/client";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { AdminAnalyticsMetrics, Profile, Report, AdminAuditLog } from "@/types/database";

export async function fetchAdminMetrics(): Promise<AdminAnalyticsMetrics> {
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return devStore.getAdminMetrics();
  }

  const supabase = createClient();

  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: completedProfiles },
    { count: totalLikes },
    { count: totalMatches },
    { count: totalMessages },
    { count: pendingReports },
    { count: suspendedUsers },
    { count: bannedUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "active"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("profile_complete", true),
    supabase.from("swipes").select("*", { count: "exact", head: true }).eq("action", "like"),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "suspended"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "banned"),
  ]);

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    completedProfiles: completedProfiles || 0,
    totalLikes: totalLikes || 0,
    totalMatches: totalMatches || 0,
    totalMessages: totalMessages || 0,
    pendingReports: pendingReports || 0,
    suspendedUsers: suspendedUsers || 0,
    bannedUsers: bannedUsers || 0,
  };
}

export async function fetchAdminUsers(): Promise<Profile[]> {
  try {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.users)) {
        return json.users;
      }
    }
  } catch (err) {
    console.warn("fetchAdminUsers API call fallback:", err);
  }

  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return devStore.getAllProfiles();
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return devStore.getAllProfiles();
  }

  return data;
}

export async function setAccountStatus(
  userId: string,
  status: Profile["account_status"],
  adminId: string,
  reason?: string
): Promise<boolean> {
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    devStore.updateUserStatus(userId, status, adminId, reason);
    return true;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ account_status: status })
    .eq("id", userId);

  if (error) {
    console.error("Failed to update account status:", error);
    devStore.updateUserStatus(userId, status, adminId, reason);
  } else {
    // Record audit log
    await supabase.from("admin_audit_logs").insert({
      admin_id: adminId,
      action_type: `account_${status}`,
      target_type: "user",
      target_id: userId,
      reason: reason || `Updated status to ${status}`,
    });
  }

  return true;
}

export async function fetchModerationReports(): Promise<Report[]> {
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return devStore.getReports();
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(id, display_name),
      reported_user:profiles!reports_reported_user_id_fkey(id, display_name, account_status)
    `)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return devStore.getReports();
  }

  return data;
}

export async function resolveModerationReport(
  reportId: string,
  status: Report["status"],
  adminId: string,
  notes?: string
): Promise<boolean> {
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    devStore.updateReportStatus(reportId, status, notes);
    return true;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("reports")
    .update({
      status,
      moderator_id: adminId,
      moderation_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  return !error;
}

export async function fetchAuditLogs(): Promise<AdminAuditLog[]> {
  const { isSupabaseConfigured } = getAppEnv();

  if (!isSupabaseConfigured) {
    return devStore.getAuditLogs();
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("admin_audit_logs")
    .select(`
      *,
      admin:profiles!admin_audit_logs_admin_id_fkey(display_name)
    `)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return devStore.getAuditLogs();
  }

  return (data as (AdminAuditLog & { admin?: { display_name?: string } })[]).map((d) => ({
    ...d,
    admin_name: d.admin?.display_name || "Admin",
  }));
}

export async function updateUserByAdmin(
  userId: string,
  adminId: string,
  updates: {
    display_name?: string;
    city?: string;
    bio?: string;
    gender?: Profile["gender"];
    role?: Profile["role"];
    account_status?: Profile["account_status"];
    verified?: boolean;
    verified_until?: string | null;
    reason?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, updates }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to update user." };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("updateUserByAdmin error:", err);
    // Local fallback if running completely offline/dev
    const { isSupabaseConfigured } = getAppEnv();
    if (!isSupabaseConfigured) {
      if (updates.account_status) {
        devStore.updateUserStatus(userId, updates.account_status, adminId, updates.reason);
      }
      const existing = devStore.getProfile(userId);
      if (existing) {
        devStore.saveProfile({ ...existing, ...updates } as Profile);
      }
      return { success: true };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error during update.",
    };
  }
}

export async function setUserVerification(
  userId: string,
  adminId: string,
  verified: boolean,
  verified_until: string | null,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  return updateUserByAdmin(userId, adminId, {
    verified,
    verified_until,
    reason:
      reason ||
      `Admin updated Blue Tick (verified: ${verified}, until: ${verified_until || "lifetime"})`,
  });
}
