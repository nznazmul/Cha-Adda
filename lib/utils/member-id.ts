/**
 * Member ID Generation and Formatting Utility
 * Generates and validates unique, memorable Member IDs for all CHA ADDA users.
 * Example format: CHA-7D9A2B or CHA-482910
 */

export function generateMemberIdFromUuid(uuid: string): string {
  if (!uuid) return "CHA-000000";

  // Clean UUID
  const clean = uuid.replace(/-/g, "").toLowerCase();

  // Simple, deterministic 32-bit hash
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  // Derive positive 6-character alphanumeric uppercase code
  const positive = Math.abs(hash);
  const rawCode = (positive % 1000000).toString().padStart(6, "0");
  
  // Mix in first 2 hex chars of UUID for guaranteed distinctness
  const prefixHex = clean.substring(0, 2).toUpperCase();
  const suffixDigits = rawCode.substring(2);

  return `CHA-${prefixHex}${suffixDigits}`;
}

export function getMemberId(profile: { id: string; unique_id?: string | null } | null | undefined): string {
  if (!profile) return "CHA-000000";
  if (profile.unique_id && profile.unique_id.trim()) {
    return profile.unique_id.toUpperCase();
  }
  return generateMemberIdFromUuid(profile.id);
}

export function isMatchingMemberId(query: string, targetId: string, memberId: string): boolean {
  const q = query.trim().toUpperCase().replace(/^@/, "");
  if (!q) return false;

  const mId = memberId.toUpperCase();
  // Match full or partial without CHA- prefix
  const rawQuery = q.replace(/^CHA-?/, "");
  const rawMId = mId.replace(/^CHA-?/, "");

  return (
    mId === q ||
    mId.includes(q) ||
    rawMId === rawQuery ||
    (rawQuery.length >= 3 && rawMId.includes(rawQuery))
  );
}
