/**
 * Verification & Blue Tick Utility Module
 * Handles verification expiry checks, duration calculations (1mo, 2mo, 6mo, lifetime),
 * and status formatting for user profiles and the admin panel.
 */

export type VerificationDurationPreset =
  | "1_month"
  | "2_months"
  | "3_months"
  | "6_months"
  | "1_year"
  | "lifetime";

export interface VerificationProfileLike {
  verified?: boolean;
  verified_until?: string | null;
}

export interface VerificationDetails {
  isVerified: boolean;
  isExpired: boolean;
  isLifetime: boolean;
  expiresAt: Date | null;
  remainingDays: number;
  formattedExpiry: string;
  badgeText: string;
  badgeTextBengali: string;
}

/**
 * Checks whether a user profile is currently verified (has valid active Blue Tick).
 * Returns false if verified is false or if verified_until is in the past.
 */
export function isProfileVerified(
  profile?: VerificationProfileLike | null
): boolean {
  if (!profile || !profile.verified) return false;
  if (!profile.verified_until) return true; // Lifetime / permanent badge

  const expiryTimestamp = new Date(profile.verified_until).getTime();
  if (isNaN(expiryTimestamp)) return false;

  return expiryTimestamp > Date.now();
}

/**
 * Returns structured details about a profile's verification status.
 */
export function getVerificationDetails(
  profile?: VerificationProfileLike | null
): VerificationDetails {
  if (!profile || !profile.verified) {
    return {
      isVerified: false,
      isExpired: false,
      isLifetime: false,
      expiresAt: null,
      remainingDays: 0,
      formattedExpiry: "অযাচাইকৃত",
      badgeText: "Not Verified",
      badgeTextBengali: "ভেরিফাইড নয়",
    };
  }

  if (!profile.verified_until) {
    return {
      isVerified: true,
      isExpired: false,
      isLifetime: true,
      expiresAt: null,
      remainingDays: Infinity,
      formattedExpiry: "স্থায়ী (Lifetime)",
      badgeText: "Lifetime Verified",
      badgeTextBengali: "আজীবন ভেরিফাইড",
    };
  }

  const expiry = new Date(profile.verified_until);
  const expiryTimestamp = expiry.getTime();
  const now = Date.now();

  if (isNaN(expiryTimestamp) || expiryTimestamp <= now) {
    return {
      isVerified: false,
      isExpired: true,
      isLifetime: false,
      expiresAt: isNaN(expiryTimestamp) ? null : expiry,
      remainingDays: 0,
      formattedExpiry: "মেয়াদোত্তীর্ণ (Expired)",
      badgeText: "Expired",
      badgeTextBengali: "মেয়াদ শেষ",
    };
  }

  const diffMs = expiryTimestamp - now;
  const remainingDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const formattedDate = expiry.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    isVerified: true,
    isExpired: false,
    isLifetime: false,
    expiresAt: expiry,
    remainingDays,
    formattedExpiry: `${formattedDate} পর্যন্ত`,
    badgeText: `${remainingDays}d remaining`,
    badgeTextBengali: `${remainingDays} দিন বাকি`,
  };
}

/**
 * Computes the verified_until ISO timestamp for a selected duration preset.
 * Passing "lifetime" returns null (no expiration).
 */
export function calculateVerificationExpiry(
  preset: VerificationDurationPreset
): string | null {
  const now = new Date();

  switch (preset) {
    case "1_month": {
      const d = new Date(now);
      d.setDate(d.getDate() + 30);
      return d.toISOString();
    }
    case "2_months": {
      const d = new Date(now);
      d.setDate(d.getDate() + 60);
      return d.toISOString();
    }
    case "3_months": {
      const d = new Date(now);
      d.setDate(d.getDate() + 90);
      return d.toISOString();
    }
    case "6_months": {
      const d = new Date(now);
      d.setDate(d.getDate() + 180);
      return d.toISOString();
    }
    case "1_year": {
      const d = new Date(now);
      d.setDate(d.getDate() + 365);
      return d.toISOString();
    }
    case "lifetime":
    default:
      return null;
  }
}
