import { describe, it, expect } from "vitest";
import { encryptMessage, decryptMessage, isEncrypted } from "@/lib/security/e2ee";
import { generateMemberIdFromUuid, isMatchingMemberId } from "@/lib/utils/member-id";

describe("End-to-End Encryption (E2EE)", () => {
  it("encrypts and decrypts chat message correctly with AES-GCM", async () => {
    const matchId = "match-test-12345";
    const plainText = "চলো আজ বিকেলে গুলশানে এক কাপ চা খাই!";

    const encrypted = await encryptMessage(plainText, matchId);
    expect(encrypted).not.toBe(plainText);
    expect(isEncrypted(encrypted)).toBe(true);
    expect(encrypted.startsWith("enc:v1:")).toBe(true);

    const decrypted = await decryptMessage(encrypted, matchId);
    expect(decrypted).toBe(plainText);
  });

  it("gracefully returns legacy plaintext messages without error", async () => {
    const matchId = "match-test-12345";
    const legacyMsg = "Hello, how are you?";
    const result = await decryptMessage(legacyMsg, matchId);
    expect(result).toBe(legacyMsg);
  });

  it("does not decrypt when wrong matchId is provided", async () => {
    const matchIdA = "match-room-alpha";
    const matchIdB = "match-room-beta";
    const plain = "Top secret message!";

    const encrypted = await encryptMessage(plain, matchIdA);
    const decryptedWithWrongKey = await decryptMessage(encrypted, matchIdB);
    expect(decryptedWithWrongKey).toBe("[🔒 Encrypted Message]");
  });
});

describe("Member ID Utility", () => {
  it("generates deterministic and formatted member ID", () => {
    const uuid = "0d0de632-0625-4f13-bf55-769547a7fd8d";
    const memberId1 = generateMemberIdFromUuid(uuid);
    const memberId2 = generateMemberIdFromUuid(uuid);

    expect(memberId1).toBe(memberId2);
    expect(memberId1.startsWith("CHA-")).toBe(true);
  });

  it("matches search queries by full ID or partial code", () => {
    const id = "CHA-0D9421";
    expect(isMatchingMemberId("CHA-0D9421", "uuid-1", id)).toBe(true);
    expect(isMatchingMemberId("0D9421", "uuid-1", id)).toBe(true);
    expect(isMatchingMemberId("9421", "uuid-1", id)).toBe(true);
    expect(isMatchingMemberId("CHA-999999", "uuid-1", id)).toBe(false);
  });
});
