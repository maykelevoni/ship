import { auth } from "@/auth";
import { db } from "@/lib/db";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const POST = auth(async (req, context) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = await (context as unknown as { params: Promise<{ id: string }> }).params;

    // Find the draft
    const draft = await db.emailDraft.findUnique({ where: { id } });
    if (!draft) {
      return new Response("Email draft not found", { status: 404 });
    }

    // Prevent double-sending
    if (draft.status === "sent") {
      return new Response("Email draft has already been sent", { status: 400 });
    }

    // Load Brevo settings from db
    const settingRows = await db.setting.findMany({
      where: {
        key: {
          in: ["brevo_api_key", "brevo_sender_email", "brevo_sender_name", "brevo_to_email"],
        },
      },
    });
    const settings = Object.fromEntries(settingRows.map((s) => [s.key, s.value]));

    const brevoApiKey = settings["brevo_api_key"];
    const senderEmail = settings["brevo_sender_email"];
    const senderName = settings["brevo_sender_name"];
    const toEmail = settings["brevo_to_email"];

    if (!brevoApiKey || !senderEmail || !toEmail) {
      return new Response(
        "Missing Brevo configuration: brevo_api_key, brevo_sender_email, and brevo_to_email are required",
        { status: 400 }
      );
    }

    const emailPayload = {
      sender: { name: senderName || "PostForge", email: senderEmail },
      to: [{ email: toEmail }],
      subject: draft.subject,
      htmlContent: draft.body,
    };

    const brevoRes = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!brevoRes.ok) {
      const text = await brevoRes.text();
      return new Response(`Brevo email send failed (${brevoRes.status}): ${text}`, {
        status: 502,
      });
    }

    // Mark draft as sent
    await db.emailDraft.update({
      where: { id },
      data: { status: "sent", sentAt: new Date() },
    });

    return Response.json({ ok: true });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
