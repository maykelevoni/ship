import crypto from "crypto";

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const hash = await new Promise<string>((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, SCRYPT_PARAMS, (err, key) => {
      if (err) reject(err);
      else resolve(key.toString("hex"));
    });
  });
  return `${salt}:${hash}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = await new Promise<string>((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, SCRYPT_PARAMS, (err, key) => {
      if (err) reject(err);
      else resolve(key.toString("hex"));
    });
  });
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"));
}
