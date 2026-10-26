import { VerificationRequest } from "@/types/database";
import { VerificationDurationPreset } from "@/lib/utils/verification";
import { devStore } from "@/lib/services/dev-store";

export async function submitSelfieVerification(
  userId: string,
  selfieUrl: string
): Promise<{ success: boolean; request?: VerificationRequest; error?: string }> {
  try {
    const res = await fetch("/api/verification/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, selfieUrl }),
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || "Failed to submit selfie" };
    }

    return { success: true, request: json.request };
  } catch (err: unknown) {
    console.warn("API submit failed, fallback to devStore:", err);
    const req = devStore.submitVerificationRequest(userId, selfieUrl);
    return { success: true, request: req };
  }
}

export async function fetchMyVerificationStatus(
  userId: string
): Promise<VerificationRequest | null> {
  try {
    const res = await fetch(`/api/verification/request?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const json = await res.json();
      return json.request || null;
    }
  } catch (err) {
    console.warn("API fetch status failed, fallback to devStore:", err);
  }

  return devStore.getVerificationRequestByUser(userId) || null;
}

export async function fetchAdminVerificationRequests(): Promise<VerificationRequest[]> {
  try {
    const res = await fetch("/api/admin/verification");
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.requests)) {
        return json.requests;
      }
    }
  } catch (err) {
    console.warn("fetchAdminVerificationRequests API error, falling back:", err);
  }

  return devStore.getVerificationRequests();
}

export async function reviewVerificationRequest(
  requestId: string,
  action: "approve" | "reject",
  durationPreset: VerificationDurationPreset = "1_month",
  reason?: string
): Promise<{ success: boolean; request?: VerificationRequest; error?: string }> {
  try {
    const res = await fetch("/api/admin/verification", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action, durationPreset, reason }),
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || "Failed to update review" };
    }

    return { success: true, request: json.request };
  } catch (err: unknown) {
    console.warn("reviewVerificationRequest API error, falling back:", err);
    const result = devStore.reviewVerificationRequest(
      requestId,
      action === "approve" ? "approved" : "rejected",
      "admin-dev",
      durationPreset,
      reason
    );
    return { success: result.success, request: result.request };
  }
}
