import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { MeetingSpot } from "@/types/database";


async function verifyAdminAuth() {
  const { isSupabaseConfigured } = getAppEnv();
  if (!isSupabaseConfigured) {
    return { isAuthorized: true, adminId: "admin-dev" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const adminClient = createAdminClient();

    if (authUser) {
      const { data: adminProfile } = await adminClient
        .from("profiles")
        .select("id, role")
        .eq("id", authUser.id)
        .maybeSingle();

      if (adminProfile && (adminProfile.role === "admin" || adminProfile.role === "moderator")) {
        return { isAuthorized: true, adminId: adminProfile.id };
      }
    }

    if (process.env.NODE_ENV !== "production") {
      return { isAuthorized: true, adminId: authUser?.id || "admin-dev" };
    }

    return { isAuthorized: false, adminId: null };
  } catch (err) {
    console.warn("verifyAdminAuth error in spots API:", err);
    if (process.env.NODE_ENV !== "production") {
      return { isAuthorized: true, adminId: "admin-dev" };
    }
    return { isAuthorized: false, adminId: null };
  }
}

export async function GET(request: Request) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Administrator or Moderator role required." },
        { status: 403 }
      );
    }

    const { isSupabaseConfigured } = getAppEnv();
    if (!isSupabaseConfigured) {
      return NextResponse.json({ spots: devStore.getMeetingSpots(false) });
    }

    const adminClient = createAdminClient();

    // 1. Try querying meeting_spots table
    try {
      const { data, error } = await adminClient
        .from("meeting_spots")
        .select("*")
        .order("display_order", { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return NextResponse.json({ spots: data as MeetingSpot[] });
      }
    } catch {
      // Table may not exist yet
    }

    return NextResponse.json({ spots: devStore.getMeetingSpots(false) });
  } catch (err: unknown) {
    console.error("GET /api/admin/spots error:", err);
    return NextResponse.json({ spots: devStore.getMeetingSpots(false) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Administrator or Moderator role required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, area, city, address, tip, google_maps_url, image_url, is_active, display_order } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Spot Name (ক্যাফে/স্পটের নাম) is required." }, { status: 400 });
    }

    if (!area || !area.trim()) {
      return NextResponse.json({ error: "Area / Location (এলাকা/স্থান) is required." }, { status: 400 });
    }

    const spotPayload: Omit<MeetingSpot, "id" | "created_at" | "updated_at"> = {
      name: name.trim(),
      area: area.trim(),
      city: (city || "Dhaka").trim(),
      address: address ? address.trim() : null,
      tip: tip ? tip.trim() : null,
      google_maps_url: google_maps_url ? google_maps_url.trim() : null,
      image_url: image_url ? image_url.trim() : null,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      display_order: typeof display_order === "number" ? display_order : 0,
    };

    let savedSpot: MeetingSpot | null = null;
    const { isSupabaseConfigured } = getAppEnv();

    if (isSupabaseConfigured) {
      const adminClient = createAdminClient();
      try {
        const { data, error } = await adminClient
          .from("meeting_spots")
          .insert(spotPayload)
          .select()
          .maybeSingle();

        if (!error && data) {
          savedSpot = data as MeetingSpot;
        }
      } catch {
        // Table may not exist yet
      }

      // Record audit log
      await adminClient.from("admin_audit_logs").insert({
        admin_id: auth.adminId || "0d0de632-0625-4f13-bf55-769547a7fd8d",
        action_type: "MEETING_SPOT_CREATED",
        target_type: "meeting_spot",
        target_id: savedSpot?.id || `spot-${Date.now()}`,
        reason: `Admin created safe meeting spot: ${spotPayload.name} (${spotPayload.area})`,
        metadata: spotPayload as Record<string, unknown>,
      });
    }

    // Always update devStore
    const localSpot = devStore.saveMeetingSpot(savedSpot || spotPayload);

    return NextResponse.json({
      success: true,
      spot: savedSpot || localSpot,
    });
  } catch (err: unknown) {
    console.error("POST /api/admin/spots error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create meeting spot." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Administrator or Moderator role required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const id = body.id;
    const updates = body.updates && typeof body.updates === "object" 
      ? body.updates 
      : { ...body };
    delete updates.id;

    if (!id || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Spot ID and updates are required." }, { status: 400 });
    }

    let updatedSpot: MeetingSpot | null = null;
    const { isSupabaseConfigured } = getAppEnv();

    if (isSupabaseConfigured) {
      const adminClient = createAdminClient();
      try {
        const { data, error } = await adminClient
          .from("meeting_spots")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .maybeSingle();

        if (!error && data) {
          updatedSpot = data as MeetingSpot;
        }
      } catch {
        // Table may not exist yet
      }

      // Record audit log
      await adminClient.from("admin_audit_logs").insert({
        admin_id: auth.adminId || "0d0de632-0625-4f13-bf55-769547a7fd8d",
        action_type: "MEETING_SPOT_UPDATED",
        target_type: "meeting_spot",
        target_id: id,
        reason: `Admin updated safe meeting spot: ${updates.name || id}`,
        metadata: updates as Record<string, unknown>,
      });
    }

    // Update devStore
    const existing = devStore.getMeetingSpot(id);
    if (existing) {
      const localUpdated = devStore.saveMeetingSpot({
        ...existing,
        ...updates,
        id,
      });
      if (!updatedSpot) updatedSpot = localUpdated;
    }

    return NextResponse.json({
      success: true,
      spot: updatedSpot,
    });
  } catch (err: unknown) {
    console.error("PATCH /api/admin/spots error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update meeting spot." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth.isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Administrator or Moderator role required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Spot ID is required for deletion." }, { status: 400 });
    }

    const { isSupabaseConfigured } = getAppEnv();
    if (isSupabaseConfigured) {
      const adminClient = createAdminClient();
      try {
        await adminClient.from("meeting_spots").delete().eq("id", id);
      } catch {
        // Ignore table missing
      }

      await adminClient.from("admin_audit_logs").insert({
        admin_id: auth.adminId || "0d0de632-0625-4f13-bf55-769547a7fd8d",
        action_type: "MEETING_SPOT_DELETED",
        target_type: "meeting_spot",
        target_id: id,
        reason: `Admin deleted safe meeting spot ${id}`,
      });
    }

    devStore.deleteMeetingSpot(id);

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    console.error("DELETE /api/admin/spots error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete meeting spot." },
      { status: 500 }
    );
  }
}
