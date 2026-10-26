import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { MeetingSpot } from "@/types/database";


export async function GET(request: Request) {
  try {
    const { isSupabaseConfigured } = getAppEnv();

    if (!isSupabaseConfigured) {
      return NextResponse.json({ spots: devStore.getMeetingSpots(true) });
    }

    const adminClient = createAdminClient();

    // 1. Try querying meeting_spots table
    try {
      const { data, error } = await adminClient
        .from("meeting_spots")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return NextResponse.json({ spots: data as MeetingSpot[] });
      }
    } catch {
      // Table may not exist yet; fall back to devStore / audit logs
    }

    return NextResponse.json({ spots: devStore.getMeetingSpots(true) });
  } catch (err: unknown) {
    console.error("GET /api/spots error:", err);
    return NextResponse.json({ spots: devStore.getMeetingSpots(true) });
  }
}
