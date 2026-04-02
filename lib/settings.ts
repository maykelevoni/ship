import { db } from "./db";

export async function getSetting(
  key: string,
  userId: string,
): Promise<string | null> {
  const setting = await db.setting.findUnique({
    where: { userId_key: { userId, key } },
  });
  return setting?.value ?? null;
}

export async function setSetting(
  key: string,
  value: string,
  userId: string,
): Promise<void> {
  await db.setting.upsert({
    where: { userId_key: { userId, key } },
    update: { value },
    create: { userId, key, value },
  });
}

export async function getSettings(
  keys: string[],
  userId: string,
): Promise<Record<string, string>> {
  const settings = await db.setting.findMany({
    where: { userId, key: { in: keys } },
  });
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}
