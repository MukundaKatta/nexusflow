import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

function getEncryptionKey(): string {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key) throw new Error("CREDENTIAL_ENCRYPTION_KEY is not set");
  return key;
}

export function encrypt(text: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const key = scryptSync(getEncryptionKey(), salt, 32);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return [
    salt.toString("hex"),
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted,
  ].join(":");
}

export function decrypt(encryptedText: string): string {
  const [saltHex, ivHex, tagHex, encrypted] = encryptedText.split(":");

  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const key = scryptSync(getEncryptionKey(), salt, 32);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function encryptCredentialData(data: Record<string, string>): string {
  return encrypt(JSON.stringify(data));
}

export function decryptCredentialData(encrypted: string): Record<string, string> {
  return JSON.parse(decrypt(encrypted));
}
