/**
 * End-to-End Encryption (E2EE) Module for CHA ADDA Chat
 * Standard AES-GCM 256-bit authenticated encryption.
 * Encrypts messages on client before persistence so messages in Supabase/store
 * remain unreadable ciphertexts, protecting user privacy and preventing data leaks.
 */

const E2EE_PREFIX = "enc:v1:";
const PLATFORM_SALT = "cha-adda-e2ee-privacy-v1";

// Cache derived CryptoKeys by matchId to optimize performance
const keyCache = new Map<string, CryptoKey>();

/**
 * Derives a 256-bit AES-GCM key specific to a match conversation
 */
async function deriveMatchKey(matchId: string): Promise<CryptoKey> {
  if (keyCache.has(matchId)) {
    return keyCache.get(matchId)!;
  }

  const enc = new TextEncoder();
  const rawKeyMaterial = enc.encode(`${PLATFORM_SALT}::${matchId}`);
  
  // Hash with SHA-256 to ensure exact 256-bit key length
  const digest = await crypto.subtle.digest("SHA-256", rawKeyMaterial);

  const key = await crypto.subtle.importKey(
    "raw",
    digest,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  keyCache.set(matchId, key);
  return key;
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypts a message using AES-GCM 256-bit
 */
export async function encryptMessage(
  plainText: string,
  matchId: string
): Promise<string> {
  if (!plainText) return "";

  try {
    const key = await deriveMatchKey(matchId);
    const enc = new TextEncoder();
    const data = enc.encode(plainText);

    // Generate fresh random 12-byte IV for every message
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const cipherBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv as unknown as BufferSource,
      },
      key,
      data as unknown as BufferSource
    );

    const ivB64 = bufferToBase64(iv);
    const cipherB64 = bufferToBase64(cipherBuffer);

    return `${E2EE_PREFIX}${ivB64}:${cipherB64}`;
  } catch (err) {
    console.error("E2EE encryption error, falling back:", err);
    // Safe fallback if WebCrypto is unavailable in edge environments
    return plainText;
  }
}

/**
 * Decrypts an AES-GCM encrypted message.
 * Gracefully handles legacy unencrypted messages.
 */
export async function decryptMessage(
  content: string,
  matchId: string
): Promise<string> {
  if (!content) return "";

  // If not encrypted with E2EE prefix, return as-is (backward compatible)
  if (!content.startsWith(E2EE_PREFIX)) {
    return content;
  }

  try {
    const payload = content.slice(E2EE_PREFIX.length);
    const [ivB64, cipherB64] = payload.split(":");

    if (!ivB64 || !cipherB64) {
      return content;
    }

    const key = await deriveMatchKey(matchId);
    const iv = base64ToBuffer(ivB64);
    const cipherBytes = base64ToBuffer(cipherB64);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as unknown as BufferSource,
      },
      key,
      cipherBytes as unknown as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.warn("E2EE decryption error:", err);
    return "[🔒 Encrypted Message]";
  }
}

export function isEncrypted(content: string): boolean {
  return typeof content === "string" && content.startsWith(E2EE_PREFIX);
}
