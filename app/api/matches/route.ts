import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { Match, PublicProfile } from "@/types/database";
import { calculateAge } from "@/lib/utils";
import { decryptMessage } from "@/lib/security/e2ee";

export async function GET(request: Request) {
  try {
    const { isSupabaseConfigured } = getAppEnv();

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const currentUserId = authUser?.id || devStore.getCurrentUserId();

    if (!isSupabaseConfigured || !authUser) {
      return NextResponse.json({ matches: devStore.getMatches(currentUserId) });
    }

    const adminClient = createAdminClient();

    // 1. Fetch all active matches for current user
    const { data: matchesData, error } = await adminClient
      .from("matches")
      .select("id, user_a_id, user_b_id, status, created_at")
      .or(`user_a_id.eq.${currentUserId},user_b_id.eq.${currentUserId}`)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error || !matchesData) {
      console.warn("Could not fetch matches from Supabase:", error);
      return NextResponse.json({ matches: devStore.getMatches(currentUserId) });
    }

    // 2. Hydrate partner profiles & latest messages
    const hydratedMatches: Match[] = [];

    for (const m of matchesData) {
      const otherId = m.user_a_id === currentUserId ? m.user_b_id : m.user_a_id;

      const { data: profile } = await adminClient
        .from("profiles")
        .select(`
          id,
          display_name,
          date_of_birth,
          gender,
          orientation,
          bio,
          city,
          job_title,
          education,
          dating_intentions,
          interests,
          languages
        `)
        .eq("id", otherId)
        .maybeSingle();

      const { data: photos } = await adminClient
        .from("profile_photos")
        .select("*")
        .eq("user_id", otherId)
        .order("is_primary", { ascending: false });

      const { data: msgs } = await adminClient
        .from("messages")
        .select("*")
        .eq("match_id", m.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (profile) {
        const calculatedAge = calculateAge(profile.date_of_birth || "2000-01-01");
        const age = Math.max(18, isNaN(calculatedAge) ? 18 : calculatedAge);

        let lastMsg = msgs?.[0] || null;
        if (lastMsg && lastMsg.content) {
          try {
            const decrypted = await decryptMessage(lastMsg.content, m.id);
            lastMsg = { ...lastMsg, content: decrypted };
          } catch {
            // keep raw content if already plaintext
          }
        }

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

        hydratedMatches.push({
          ...m,
          other_user: otherUser,
          last_message: lastMsg,
        });
      }
    }

    return NextResponse.json({ matches: hydratedMatches });
  } catch (err: unknown) {
    console.error("GET /api/matches error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load matches." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetUserId, createIfMissing = true } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      );
    }

    const { isSupabaseConfigured } = getAppEnv();

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const currentUserId = authUser?.id || devStore.getCurrentUserId();

    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: "Cannot create match with yourself" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured || !authUser) {
      devStore.recordSwipe(targetUserId, currentUserId, "like");
      const devRes = devStore.recordSwipe(currentUserId, targetUserId, "like");
      return NextResponse.json({
        success: true,
        matchId: devRes.matchId || `match-${currentUserId < targetUserId ? currentUserId + "-" + targetUserId : targetUserId + "-" + currentUserId}`,
      });
    }

    const adminClient = createAdminClient();
    const userA = currentUserId < targetUserId ? currentUserId : targetUserId;
    const userB = currentUserId < targetUserId ? targetUserId : currentUserId;

    // 1. Check for existing match
    const { data: existingMatch } = await adminClient
      .from("matches")
      .select("*")
      .eq("user_a_id", userA)
      .eq("user_b_id", userB)
      .maybeSingle();

    if (existingMatch) {
      if (existingMatch.status !== "active") {
        await adminClient
          .from("matches")
          .update({ status: "active", unmatched_at: null, unmatched_by: null })
          .eq("id", existingMatch.id);
      }
      return NextResponse.json({
        success: true,
        matchId: existingMatch.id,
        match: existingMatch,
      });
    }

    if (!createIfMissing) {
      return NextResponse.json({
        success: false,
        matchId: null,
      });
    }

    // 2. Record mutual likes in swipes table
    try {
      await adminClient.from("swipes").upsert([
        {
          from_user_id: currentUserId,
          to_user_id: targetUserId,
          action: "like",
        },
        {
          from_user_id: targetUserId,
          to_user_id: currentUserId,
          action: "like",
        },
      ]);
    } catch (swipeErr) {
      console.warn("Could not upsert reciprocal swipes:", swipeErr);
    }

    // 3. Insert real match into matches table
    const { data: newMatch, error: matchErr } = await adminClient
      .from("matches")
      .insert({
        user_a_id: userA,
        user_b_id: userB,
        status: "active",
      })
      .select()
      .single();

    if (matchErr || !newMatch) {
      console.error("Failed to insert match into Supabase:", matchErr);
      return NextResponse.json(
        { error: matchErr?.message || "Failed to create match" },
        { status: 500 }
      );
    }

    // 4. Also register in local devStore for instant local sync
    devStore.recordSwipe(targetUserId, currentUserId, "like");
    devStore.recordSwipe(currentUserId, targetUserId, "like");

    return NextResponse.json({
      success: true,
      matchId: newMatch.id,
      match: newMatch,
    });
  } catch (err: unknown) {
    console.error("POST /api/matches error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to ensure match" },
      { status: 500 }
    );
  }
}
