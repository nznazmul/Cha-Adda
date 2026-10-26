import { NextRequest, NextResponse } from "next/server";
import { getAppEnv } from "@/lib/config/env";
import { createAdminClient } from "@/lib/supabase/server";
import { devStore } from "@/lib/services/dev-store";
import { PublicProfile } from "@/types/database";
import { calculateAge } from "@/lib/utils";
import { getMemberId } from "@/lib/utils/member-id";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    if (!userId || !userId.trim()) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const decodedId = decodeURIComponent(userId.trim());

    // 1. First check local devStore by id or memberId
    const devProfile = devStore.getProfile(decodedId);
    if (devProfile) {
      return NextResponse.json({ profile: devStore.toPublicProfile(devProfile) });
    }

    // 2. If Supabase is configured, search profiles table
    const { isSupabaseConfigured } = getAppEnv();
    if (isSupabaseConfigured) {
      try {
        const adminClient = createAdminClient();

        // Check if decodedId is UUID or unique_id
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);

        let query = adminClient
          .from("profiles")
          .select(`
            id,
            unique_id,
            display_name,
            date_of_birth,
            gender,
            orientation,
            bio,
            city,
            job_title,
            education,
            height_cm,
            dating_intentions,
            interests,
            languages,
            verified,
            verified_until,
            account_status,
            role
          `);

        if (isUUID) {
          query = query.eq("id", decodedId);
        } else {
          query = query.ilike("unique_id", decodedId);
        }

        const { data: profileRow, error } = await query.maybeSingle();

        if (!error && profileRow) {
          // Fetch user photos
          const { data: photos } = await adminClient
            .from("profile_photos")
            .select("*")
            .eq("user_id", profileRow.id)
            .order("is_primary", { ascending: false });

          const calculatedAge = calculateAge(profileRow.date_of_birth || "2000-01-01");
          const age = Math.max(18, isNaN(calculatedAge) ? 18 : calculatedAge);

          const publicProfile: PublicProfile = {
            id: profileRow.id,
            unique_id: profileRow.unique_id,
            display_name: profileRow.display_name,
            age,
            gender: profileRow.gender,
            orientation: profileRow.orientation,
            bio: profileRow.bio,
            city: profileRow.city,
            job_title: profileRow.job_title,
            education: profileRow.education,
            height_cm: profileRow.height_cm,
            dating_intentions: profileRow.dating_intentions || [],
            interests: profileRow.interests || [],
            languages: profileRow.languages || [],
            verified: profileRow.verified,
            verified_until: profileRow.verified_until,
            photos: photos || [],
            primary_photo_url: photos?.[0]?.url,
          };

          return NextResponse.json({ profile: publicProfile });
        }
      } catch (supaErr) {
        console.warn("Supabase profile fetch error in /api/users/[userId], falling back:", supaErr);
      }
    }

    // 3. Fallback: Search all devStore profiles by loose match (memberId or unique_id or id)
    const allProfiles = devStore.getAllProfiles();
    const matched = allProfiles.find(
      (c) =>
        c.id.toLowerCase() === decodedId.toLowerCase() ||
        (c.unique_id && c.unique_id.toLowerCase() === decodedId.toLowerCase()) ||
        getMemberId(c).toLowerCase() === decodedId.toLowerCase()
    );

    if (matched) {
      return NextResponse.json({ profile: devStore.toPublicProfile(matched) });
    }

    return NextResponse.json({ error: "User profile not found." }, { status: 404 });
  } catch (err: unknown) {
    console.error("GET /api/users/[userId] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load user profile." },
      { status: 500 }
    );
  }
}
