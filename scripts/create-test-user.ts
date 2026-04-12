import crypto from "crypto";
import { db } from "../lib/db";

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await new Promise<string>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => {
      if (err) reject(err);
      else resolve(key.toString("hex"));
    });
  });
  return `${salt}:${hash}`;
}

async function createTestUser() {
  const email = "test@example.com";
  const password = "password123";
  const hashedPassword = await hashPassword(password);

  const user = await db.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      onboardingDone: true,
    },
    create: {
      email,
      name: "Test User",
      password: hashedPassword,
      onboardingDone: true,
    },
  });

  console.log("Test user created/updated:");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Onboarding done:", user.onboardingDone);

  await db.$disconnect();
}

createTestUser().catch(console.error);
