import { auth } from "@/auth";
import { db } from "@/lib/db";

/** All settings keys with their default values (null means no default — return null if not set). */
const SETTINGS_DEFAULTS: Record<string, string | null> = {
  anthropic_api_key: null,
  gemini_api_key: null,
  ai_fallback_enabled: "true",
  postbridge_api_key: null,
  enabled_platforms:
    '["twitter","linkedin","instagram","facebook","reddit","email","tiktok"]',
  resend_api_key: null,
  resend_from_email: null,
  resend_list_id: null,
  timezone: "America/New_York",
  gate_mode: "false",
  daily_run_hour: "6",
};

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const rows = await db.setting.findMany();
    const stored = Object.fromEntries(rows.map((s) => [s.key, s.value]));

    // Merge stored values with defaults — always return all known keys
    const result: Record<string, string | null> = {};
    for (const [key, defaultValue] of Object.entries(SETTINGS_DEFAULTS)) {
      result[key] = key in stored ? stored[key] : defaultValue;
    }

    // Also include any extra keys stored in DB that aren't in the defaults map
    for (const [key, value] of Object.entries(stored)) {
      if (!(key in result)) {
        result[key] = value;
      }
    }

    return Response.json(result);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const body = await req.json();

    if (typeof body !== "object" || body === null) {
      return new Response("Invalid body", { status: 400 });
    }

    const entries = Object.entries(body) as [string, string][];

    await Promise.all(
      entries.map(([key, value]) =>
        db.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    return Response.json({ ok: true });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
