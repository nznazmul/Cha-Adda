import { MeetingSpot } from "@/types/database";
import { devStore } from "@/lib/services/dev-store";

export async function fetchActiveSpots(): Promise<MeetingSpot[]> {
  try {
    const res = await fetch("/api/spots");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.spots)) {
        return data.spots;
      }
    }
  } catch (err) {
    console.warn("fetchActiveSpots error, falling back to local devStore:", err);
  }
  return devStore.getMeetingSpots(true);
}

export async function fetchAdminSpots(): Promise<MeetingSpot[]> {
  try {
    const res = await fetch("/api/admin/spots");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.spots)) {
        return data.spots;
      }
    }
  } catch (err) {
    console.warn("fetchAdminSpots error, falling back to local devStore:", err);
  }
  return devStore.getMeetingSpots(false);
}

export async function createMeetingSpot(
  spot: Omit<MeetingSpot, "id" | "created_at" | "updated_at">
): Promise<{ success: boolean; spot?: MeetingSpot; error?: string }> {
  try {
    const res = await fetch("/api/admin/spots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(spot),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to create spot." };
    }

    if (data.spot) {
      devStore.saveMeetingSpot(data.spot);
    }
    return { success: true, spot: data.spot };
  } catch (err: unknown) {
    console.error("createMeetingSpot error:", err);
    const local = devStore.saveMeetingSpot(spot);
    return { success: true, spot: local };
  }
}

export async function updateMeetingSpot(
  id: string,
  updates: Partial<MeetingSpot>
): Promise<{ success: boolean; spot?: MeetingSpot; error?: string }> {
  try {
    const res = await fetch("/api/admin/spots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, updates }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to update spot." };
    }

    if (data.spot) {
      devStore.saveMeetingSpot(data.spot);
    }
    return { success: true, spot: data.spot };
  } catch (err: unknown) {
    console.error("updateMeetingSpot error:", err);
    const existing = devStore.getMeetingSpot(id);
    if (existing) {
      const local = devStore.saveMeetingSpot({ ...existing, ...updates, id });
      return { success: true, spot: local };
    }
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function deleteMeetingSpot(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/spots?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to delete spot." };
    }

    devStore.deleteMeetingSpot(id);
    return { success: true };
  } catch (err: unknown) {
    console.error("deleteMeetingSpot error:", err);
    devStore.deleteMeetingSpot(id);
    return { success: true };
  }
}
