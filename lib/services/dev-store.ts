import { Profile, PublicProfile, ProfilePhoto, Swipe, Match, Message, Report, Notification, AdminAuditLog } from "@/types/database";
import { bengaliFemaleProfiles, bengaliFemalePhotos } from "@/lib/data/bengali-bots";

// Seed development profiles
const initialProfiles: Profile[] = [
  ...bengaliFemaleProfiles,
  {
    id: "usr-aria-01",
    display_name: "Aria Vance",
    date_of_birth: "1998-05-14",
    gender: "woman",
    orientation: "Straight",
    bio: "Architect by day, rooftop barista and vinyl collector by night. Let's find the best coffee in the city.",
    city: "Dhaka",
    job_title: "Architect",
    education: "Dhaka University",
    height_cm: 168,
    dating_intentions: ["Long-term relationship", "Serious dating"],
    interests: ["Architecture", "Music", "Coffee", "Travel", "Art"],
    languages: ["English", "Bengali"],
    is_discoverable: true,
    profile_complete: true,
    account_status: "active",
    role: "user",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "usr-julian-02",
    display_name: "Julian Ross",
    date_of_birth: "1996-09-22",
    gender: "man",
    orientation: "Straight",
    bio: "Product designer, amateur photographer, and weekend trekker. Looking for someone who enjoys spontaneous weekend trips.",
    city: "Dhaka",
    job_title: "Product Designer",
    education: "BUET",
    height_cm: 182,
    dating_intentions: ["Long-term relationship"],
    interests: ["Technology", "Photography", "Outdoor activities", "Fitness"],
    languages: ["English", "Bengali"],
    is_discoverable: true,
    profile_complete: true,
    account_status: "active",
    role: "user",
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "usr-maya-03",
    display_name: "Maya Lin",
    date_of_birth: "2000-02-18",
    gender: "woman",
    orientation: "Bisexual",
    bio: "Art curator and avid book lover. Let’s explore independent bookstores and late-night noodle spots.",
    city: "Dhaka",
    job_title: "Art Curator",
    education: "Chittagong University",
    height_cm: 164,
    dating_intentions: ["Casual dating", "Friendship"],
    interests: ["Art", "Books", "Food", "Movies"],
    languages: ["English", "Bengali", "French"],
    is_discoverable: true,
    profile_complete: true,
    account_status: "active",
    role: "user",
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "usr-kaelen-04",
    display_name: "Kaelen Miller",
    date_of_birth: "1995-11-04",
    gender: "man",
    orientation: "Straight",
    bio: "Culinary explorer and jazz enthusiast. Big fan of street food markets and indie films.",
    city: "Dhaka",
    job_title: "Chef & Restaurateur",
    education: "Culinary Arts",
    height_cm: 178,
    dating_intentions: ["Serious dating"],
    interests: ["Food", "Cooking", "Music", "Travel", "Pets"],
    languages: ["English"],
    is_discoverable: true,
    profile_complete: true,
    account_status: "active",
    role: "user",
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "usr-zara-05",
    display_name: "Zara Karim",
    date_of_birth: "1997-07-30",
    gender: "woman",
    orientation: "Straight",
    bio: "Tech entrepreneur, yoga practitioner, and dog mom. Looking for an ambitious partner who appreciates deep conversations over matcha.",
    city: "Dhaka",
    job_title: "Founder",
    education: "North South University",
    height_cm: 170,
    dating_intentions: ["Long-term relationship"],
    interests: ["Technology", "Fitness", "Pets", "Books", "Music"],
    languages: ["English", "Bengali"],
    is_discoverable: true,
    profile_complete: true,
    account_status: "active",
    role: "user",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "usr-admin-lead",
    display_name: "Admin Lead",
    date_of_birth: "1990-01-01",
    gender: "nonbinary",
    orientation: "Queer",
    bio: "Platform trust, safety, and community lead for CHA ADDA.",
    city: "Dhaka",
    job_title: "Head of Safety",
    education: "Master of Cyberlaw",
    height_cm: 175,
    dating_intentions: ["Friendship"],
    interests: ["Technology", "Books"],
    languages: ["English"],
    is_discoverable: false,
    profile_complete: true,
    account_status: "active",
    role: "admin",
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const initialPhotos: Record<string, ProfilePhoto[]> = {
  ...bengaliFemalePhotos,
  "usr-aria-01": [
    {
      id: "ph-1",
      user_id: "usr-aria-01",
      storage_path: "aria-1.jpg",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      display_order: 0,
      is_primary: true,
      moderation_status: "approved",
      created_at: new Date().toISOString(),
    },
    {
      id: "ph-2",
      user_id: "usr-aria-01",
      storage_path: "aria-2.jpg",
      url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      display_order: 1,
      is_primary: false,
      moderation_status: "approved",
      created_at: new Date().toISOString(),
    }
  ],
  "usr-julian-02": [
    {
      id: "ph-3",
      user_id: "usr-julian-02",
      storage_path: "julian-1.jpg",
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
      display_order: 0,
      is_primary: true,
      moderation_status: "approved",
      created_at: new Date().toISOString(),
    },
    {
      id: "ph-4",
      user_id: "usr-julian-02",
      storage_path: "julian-2.jpg",
      url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
      display_order: 1,
      is_primary: false,
      moderation_status: "approved",
      created_at: new Date().toISOString(),
    }
  ],
  "usr-maya-03": [
    {
      id: "ph-5",
      user_id: "usr-maya-03",
      storage_path: "maya-1.jpg",
      url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
      display_order: 0,
      is_primary: true,
      moderation_status: "approved",
      created_at: new Date().toISOString(),
    }
  ],
  "usr-kaelen-04": [
    {
      id: "ph-6",
      user_id: "usr-kaelen-04",
      storage_path: "kaelen-1.jpg",
      url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
      display_order: 0,
      is_primary: true,
      moderation_status: "approved",
      created_at: new Date().toISOString(),
    }
  ],
  "usr-zara-05": [
    {
      id: "ph-7",
      user_id: "usr-zara-05",
      storage_path: "zara-1.jpg",
      url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
      display_order: 0,
      is_primary: true,
      moderation_status: "approved",
      created_at: new Date().toISOString(),
    }
  ],
  "usr-admin-lead": [
    {
      id: "ph-8",
      user_id: "usr-admin-lead",
      storage_path: "admin-1.jpg",
      url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
      display_order: 0,
      is_primary: true,
      moderation_status: "approved",
      created_at: new Date().toISOString(),
    }
  ]
};

class DevDataStore {
  private profiles: Map<string, Profile> = new Map();
  private photos: Map<string, ProfilePhoto[]> = new Map();
  private swipes: Swipe[] = [];
  private matches: Match[] = [];
  private messages: Message[] = [];
  private blocks: { blocker_id: string; blocked_id: string }[] = [];
  private reports: Report[] = [];
  private notifications: Notification[] = [];
  private auditLogs: AdminAuditLog[] = [];
  private currentUserId: string = "usr-aria-01"; // Default dev actor

  constructor() {
    initialProfiles.forEach((p) => this.profiles.set(p.id, { ...p }));
    Object.entries(initialPhotos).forEach(([uid, phs]) =>
      this.photos.set(uid, [...phs])
    );

    // Initial pre-configured swipe: Julian already liked Aria!
    this.swipes.push({
      id: "swp-init-1",
      from_user_id: "usr-julian-02",
      to_user_id: "usr-aria-01",
      action: "like",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    });

    // Initial pre-configured match between Aria and Kaelen
    const matchId = "match-aria-kaelen";
    this.matches.push({
      id: matchId,
      user_a_id: "usr-aria-01",
      user_b_id: "usr-kaelen-04",
      status: "active",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    });

    this.messages.push(
      {
        id: "msg-1",
        match_id: matchId,
        sender_id: "usr-kaelen-04",
        content: "Hey Aria! I saw that you love vinyl. What’s currently on heavy rotation on your turntable?",
        created_at: new Date(Date.now() - 80000000).toISOString(),
      },
      {
        id: "msg-2",
        match_id: matchId,
        sender_id: "usr-aria-01",
        content: "Hey Kaelen! Miles Davis and some Japanese city pop! Have you tried that new cafe in Dhanmondi?",
        created_at: new Date(Date.now() - 75000000).toISOString(),
      }
    );
  }

  getCurrentUserId(): string {
    return this.currentUserId;
  }

  setCurrentUserId(id: string) {
    this.currentUserId = id;
  }

  getProfile(id: string): Profile | undefined {
    return this.profiles.get(id);
  }

  saveProfile(profile: Profile) {
    this.profiles.set(profile.id, { ...profile, updated_at: new Date().toISOString() });
  }

  getPhotos(userId: string): ProfilePhoto[] {
    return this.photos.get(userId) || [];
  }

  savePhotos(userId: string, photos: ProfilePhoto[]) {
    this.photos.set(userId, [...photos]);
  }

  toPublicProfile(profile: Profile): PublicProfile {
    const birthDate = new Date(profile.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const userPhotos = this.getPhotos(profile.id);
    const primary = userPhotos.find((p) => p.is_primary) || userPhotos[0];

    return {
      id: profile.id,
      display_name: profile.display_name,
      age: Math.max(18, age),
      gender: profile.gender,
      orientation: profile.orientation,
      bio: profile.bio,
      city: profile.city,
      approx_distance_km: 3,
      job_title: profile.job_title,
      education: profile.education,
      height_cm: profile.height_cm,
      dating_intentions: profile.dating_intentions || [],
      interests: profile.interests || [],
      languages: profile.languages || [],
      photos: userPhotos,
      primary_photo_url: primary ? primary.url : undefined,
    };
  }

  getDiscoveryCandidates(currentUserId: string): PublicProfile[] {
    // Exclude swiped profiles, blocked profiles, self, and undiscoverable profiles
    const swipedTargetIds = new Set(
      this.swipes
        .filter((s) => s.from_user_id === currentUserId)
        .map((s) => s.to_user_id)
    );

    const blockedIds = new Set(
      this.blocks
        .filter(
          (b) => b.blocker_id === currentUserId || b.blocked_id === currentUserId
        )
        .map((b) => (b.blocker_id === currentUserId ? b.blocked_id : b.blocker_id))
    );

    const candidates: PublicProfile[] = [];
    for (const [id, p] of this.profiles.entries()) {
      if (
        id !== currentUserId &&
        !swipedTargetIds.has(id) &&
        !blockedIds.has(id) &&
        p.is_discoverable &&
        p.profile_complete &&
        p.account_status === "active"
      ) {
        candidates.push(this.toPublicProfile(p));
      }
    }
    return candidates;
  }

  recordSwipe(actorId: string, targetId: string, action: "like" | "pass"): { isMatch: boolean; matchId?: string } {
    if (actorId === targetId) throw new Error("Cannot swipe on self");

    // Remove any previous swipe
    this.swipes = this.swipes.filter(
      (s) => !(s.from_user_id === actorId && s.to_user_id === targetId)
    );

    this.swipes.push({
      id: `swp-${Date.now()}`,
      from_user_id: actorId,
      to_user_id: targetId,
      action,
      created_at: new Date().toISOString(),
    });

    if (action === "pass") {
      return { isMatch: false };
    }

    // Check reciprocal like
    const reciprocal = this.swipes.find(
      (s) => s.from_user_id === targetId && s.to_user_id === actorId && s.action === "like"
    );

    if (reciprocal) {
      // Canonical order: a < b
      const user_a_id = actorId < targetId ? actorId : targetId;
      const user_b_id = actorId < targetId ? targetId : actorId;

      let match = this.matches.find(
        (m) => m.user_a_id === user_a_id && m.user_b_id === user_b_id
      );

      if (!match) {
        match = {
          id: `match-${Date.now()}`,
          user_a_id,
          user_b_id,
          status: "active",
          created_at: new Date().toISOString(),
        };
        this.matches.push(match);
      } else {
        match.status = "active";
        match.unmatched_at = undefined;
      }

      // Add notifications
      const actorProfile = this.getProfile(actorId);
      const targetProfile = this.getProfile(targetId);

      this.notifications.push(
        {
          id: `notif-${Date.now()}-1`,
          recipient_id: targetId,
          type: "match",
          title: "New Match!",
          body: `You matched with ${actorProfile?.display_name || "someone"}!`,
          reference_id: match.id,
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: `notif-${Date.now()}-2`,
          recipient_id: actorId,
          type: "match",
          title: "New Match!",
          body: `You matched with ${targetProfile?.display_name || "someone"}!`,
          reference_id: match.id,
          is_read: false,
          created_at: new Date().toISOString(),
        }
      );

      return { isMatch: true, matchId: match.id };
    }

    return { isMatch: false };
  }

  getMatches(currentUserId: string): Match[] {
    const userMatches = this.matches.filter(
      (m) => (m.user_a_id === currentUserId || m.user_b_id === currentUserId) && m.status === "active"
    );

    return userMatches.map((m) => {
      const otherId = m.user_a_id === currentUserId ? m.user_b_id : m.user_a_id;
      const otherProfile = this.getProfile(otherId);
      const matchMessages = this.messages
        .filter((msg) => msg.match_id === m.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return {
        ...m,
        other_user: otherProfile ? this.toPublicProfile(otherProfile) : undefined,
        last_message: matchMessages[0] || null,
        unread_count: 0,
      };
    });
  }

  getMatch(matchId: string, currentUserId: string): Match | undefined {
    const match = this.matches.find(
      (m) => m.id === matchId && (m.user_a_id === currentUserId || m.user_b_id === currentUserId)
    );
    if (!match) return undefined;

    const otherId = match.user_a_id === currentUserId ? match.user_b_id : match.user_a_id;
    const otherProfile = this.getProfile(otherId);
    return {
      ...match,
      other_user: otherProfile ? this.toPublicProfile(otherProfile) : undefined,
    };
  }

  getMessages(matchId: string): Message[] {
    return this.messages
      .filter((m) => m.match_id === matchId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  sendMessage(matchId: string, senderId: string, content: string): Message {
    const msg: Message = {
      id: `msg-${Date.now()}`,
      match_id: matchId,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString(),
    };
    this.messages.push(msg);
    return msg;
  }

  getIncomingLikes(currentUserId: string): PublicProfile[] {
    const likerIds = this.swipes
      .filter((s) => s.to_user_id === currentUserId && s.action === "like")
      .map((s) => s.from_user_id);

    return likerIds
      .map((id) => this.getProfile(id))
      .filter((p): p is Profile => Boolean(p && p.account_status === "active"))
      .map((p) => this.toPublicProfile(p));
  }

  blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) return;
    if (!this.blocks.some((b) => b.blocker_id === blockerId && b.blocked_id === blockedId)) {
      this.blocks.push({ blocker_id: blockerId, blocked_id: blockedId });
    }
    // Deactivate existing matches
    this.matches.forEach((m) => {
      if (
        (m.user_a_id === blockerId && m.user_b_id === blockedId) ||
        (m.user_b_id === blockerId && m.user_a_id === blockedId)
      ) {
        m.status = "blocked";
      }
    });
  }

  reportUser(report: Omit<Report, "id" | "created_at" | "updated_at">): Report {
    const newReport: Report = {
      ...report,
      id: `rep-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.reports.push(newReport);
    return newReport;
  }

  getReports(): Report[] {
    return this.reports.map((r) => {
      const reporter = this.getProfile(r.reporter_id);
      const reported = this.getProfile(r.reported_user_id);
      return {
        ...r,
        reporter: reporter ? { id: reporter.id, display_name: reporter.display_name } : undefined,
        reported_user: reported
          ? { id: reported.id, display_name: reported.display_name, account_status: reported.account_status }
          : undefined,
      };
    });
  }

  updateReportStatus(reportId: string, status: Report["status"], notes?: string) {
    const report = this.reports.find((r) => r.id === reportId);
    if (report) {
      report.status = status;
      if (notes) report.moderation_notes = notes;
      report.updated_at = new Date().toISOString();
    }
  }

  getAdminMetrics() {
    return {
      totalUsers: this.profiles.size,
      activeUsers: Array.from(this.profiles.values()).filter((p) => p.account_status === "active").length,
      completedProfiles: Array.from(this.profiles.values()).filter((p) => p.profile_complete).length,
      totalLikes: this.swipes.filter((s) => s.action === "like").length,
      totalMatches: this.matches.filter((m) => m.status === "active").length,
      totalMessages: this.messages.length,
      pendingReports: this.reports.filter((r) => r.status === "pending").length,
      suspendedUsers: Array.from(this.profiles.values()).filter((p) => p.account_status === "suspended").length,
      bannedUsers: Array.from(this.profiles.values()).filter((p) => p.account_status === "banned").length,
    };
  }

  getAllProfiles(): Profile[] {
    return Array.from(this.profiles.values());
  }

  updateUserStatus(userId: string, status: Profile["account_status"], adminId: string, reason?: string) {
    const p = this.profiles.get(userId);
    if (p) {
      p.account_status = status;
      this.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        admin_id: adminId,
        admin_name: "Admin",
        action_type: `account_${status}`,
        target_type: "user",
        target_id: userId,
        reason: reason || `Updated account status to ${status}`,
        created_at: new Date().toISOString(),
      });
    }
  }

  getAuditLogs(): AdminAuditLog[] {
    return this.auditLogs;
  }
}

// Global singleton for local dev state
const globalForDev = globalThis as unknown as { devDataStore?: DevDataStore };
export const devStore = globalForDev.devDataStore || new DevDataStore();
if (process.env.NODE_ENV !== "production") globalForDev.devDataStore = devStore;
