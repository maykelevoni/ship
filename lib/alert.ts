import { db } from "@/lib/db";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Sends a worker failure alert via Brevo.
 * Reads Brevo credentials from DB settings — silently no-ops if not configured.
 */
export async function sendWorkerAlert(
  jobName: string,
  error: unknown,
): Promise<void> {
  try {
    const rows = await db.setting.findMany({
      where: {
        key: { in: ["brevo_api_key", "brevo_sender_email", "brevo_to_email"] },
      },
    });
    const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    if (!s.brevo_api_key || !s.brevo_sender_email || !s.brevo_to_email) return;

    const message =
      error instanceof Error ? error.message : String(error);

    await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": s.brevo_api_key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "PostForge Worker", email: s.brevo_sender_email },
        to: [{ email: s.brevo_to_email }],
        subject: `[PostForge] Worker job failed: ${jobName}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#f87171;margin-top:0;">Worker job failed: ${jobName}</h2>
            <p>The following error occurred at ${new Date().toISOString()}:</p>
            <pre style="background:#1a1a1a;color:#e4e4e7;padding:12px 16px;border-radius:6px;font-size:13px;overflow:auto;">${message}</pre>
            <p style="color:#a1a1aa;font-size:13px;">Check your server logs for the full stack trace.</p>
          </div>`,
      }),
    });
  } catch {
    // Never let alert failures surface — worker should continue regardless
  }
}
