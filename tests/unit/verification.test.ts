import { describe, it, expect } from "vitest";
import {
  isProfileVerified,
  getVerificationDetails,
  calculateVerificationExpiry,
} from "@/lib/utils/verification";

describe("Blue Tick Verification & Expiry System", () => {
  it("returns false if profile is null, undefined, or verified is false", () => {
    expect(isProfileVerified(null)).toBe(false);
    expect(isProfileVerified(undefined)).toBe(false);
    expect(isProfileVerified({ verified: false })).toBe(false);
    expect(isProfileVerified({})).toBe(false);
  });

  it("returns true for permanent / lifetime verified profiles (no expiry)", () => {
    const profile = { verified: true, verified_until: null };
    expect(isProfileVerified(profile)).toBe(true);

    const details = getVerificationDetails(profile);
    expect(details.isVerified).toBe(true);
    expect(details.isLifetime).toBe(true);
    expect(details.isExpired).toBe(false);
    expect(details.badgeTextBengali).toBe("আজীবন ভেরিফাইড");
  });

  it("returns true for active verified profile within expiration period (e.g. 30 days)", () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const profile = { verified: true, verified_until: futureDate };

    expect(isProfileVerified(profile)).toBe(true);

    const details = getVerificationDetails(profile);
    expect(details.isVerified).toBe(true);
    expect(details.isExpired).toBe(false);
    expect(details.remainingDays).toBeGreaterThanOrEqual(29);
    expect(details.badgeTextBengali).toContain("দিন বাকি");
  });

  it("returns false and marks expired when verified_until is in the past", () => {
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const profile = { verified: true, verified_until: pastDate };

    expect(isProfileVerified(profile)).toBe(false);

    const details = getVerificationDetails(profile);
    expect(details.isVerified).toBe(false);
    expect(details.isExpired).toBe(true);
    expect(details.badgeTextBengali).toBe("মেয়াদ শেষ");
  });

  it("calculates accurate expiration timestamps for duration presets", () => {
    const oneMonth = calculateVerificationExpiry("1_month");
    expect(oneMonth).not.toBeNull();
    const diffDays1 = Math.round(
      (new Date(oneMonth!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays1).toBe(30);

    const sixMonths = calculateVerificationExpiry("6_months");
    expect(sixMonths).not.toBeNull();
    const diffDays6 = Math.round(
      (new Date(sixMonths!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays6).toBe(180);

    const lifetime = calculateVerificationExpiry("lifetime");
    expect(lifetime).toBeNull();
  });
});
