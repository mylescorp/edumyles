const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKeyBytes() {
  const raw = process.env.SOCIAL_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("SOCIAL_ENCRYPTION_KEY is not configured");
  }

  const bytes = Uint8Array.from(Buffer.from(raw, "hex"));
  if (bytes.length !== 32) {
    throw new Error("SOCIAL_ENCRYPTION_KEY must be a 32-byte hex string");
  }

  return bytes;
}

async function importKey() {
  return await crypto.subtle.importKey(
    "raw",
    getKeyBytes(),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

function concatBytes(...arrays: Uint8Array[]) {
  const totalLength = arrays.reduce((sum, array) => sum + array.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}

export async function encrypt(plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await importKey();
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: AUTH_TAG_LENGTH * 8 },
    key,
    new TextEncoder().encode(plaintext)
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const ciphertext = encryptedBytes.subarray(0, encryptedBytes.length - AUTH_TAG_LENGTH);
  const authTag = encryptedBytes.subarray(encryptedBytes.length - AUTH_TAG_LENGTH);

  return Buffer.from(concatBytes(iv, authTag, ciphertext)).toString("base64");
}

export async function decrypt(ciphertext: string): Promise<string> {
  const decoded = Uint8Array.from(Buffer.from(ciphertext, "base64"));
  const iv = decoded.subarray(0, IV_LENGTH);
  const authTag = decoded.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = decoded.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const key = await importKey();

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: AUTH_TAG_LENGTH * 8 },
    key,
    concatBytes(encrypted, authTag)
  );

  return new TextDecoder().decode(plaintextBuffer);
}
