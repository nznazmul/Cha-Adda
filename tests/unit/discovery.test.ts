import { describe, it, expect } from "vitest";
import { devStore } from "@/lib/services/dev-store";

describe("Discovery Engine & Candidate Filtering", () => {
  it("should not return the current user in discovery feed", () => {
    const candidates = devStore.getDiscoveryCandidates("usr-aria-01");
    expect(candidates.some((c) => c.id === "usr-aria-01")).toBe(false);
  });

  it("should exclude candidate once swiped", () => {
    const targetId = "usr-maya-03";
    devStore.recordSwipe("usr-aria-01", targetId, "pass");

    const candidates = devStore.getDiscoveryCandidates("usr-aria-01");
    expect(candidates.some((c) => c.id === targetId)).toBe(false);
  });

  it("should exclude blocked members from discovery immediately", () => {
    const targetId = "usr-zara-05";
    devStore.blockUser("usr-aria-01", targetId);

    const candidates = devStore.getDiscoveryCandidates("usr-aria-01");
    expect(candidates.some((c) => c.id === targetId)).toBe(false);
  });

  it("should exclude undiscoverable profiles", () => {
    const adminProfile = devStore.getProfile("usr-admin-lead");
    expect(adminProfile?.is_discoverable).toBe(false);

    const candidates = devStore.getDiscoveryCandidates("usr-aria-01");
    expect(candidates.some((c) => c.id === "usr-admin-lead")).toBe(false);
  });
});
