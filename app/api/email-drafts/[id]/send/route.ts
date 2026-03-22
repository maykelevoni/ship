import { auth } from "@/auth";
import { db } from "@/lib/db";

const RESEND_API_URL = "https://api.resend.com";

export const POST = auth(async (req, context) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = await (context as { params: Promise<{ id: string }> }).params;

    // Find the draft
    const draft = await db.emailDraft.findUnique({ where: { id } });
    if (!draft) {
      return new Response("Email draft not found", { status: 404 });
    }

    // Prevent double-sending
    if (draft.status === "sent") {
      return new Response("Email draft has already been sent", { status: 400 });
    }

    // Load Resend settings from db
    const settingRows = await db.setting.findMany({
      where: { key: { in: ["resend_api_key", "resend_from_email", "resend_list_id"] } },
    });
    const settings = Object.fromEntries(settingRows.map((s) => [s.key, s.value]));

    const apiKey = settings["resend_api_key"];
    const fromEmail = settings["resend_from_email"];
    const listId = settings["resend_list_id"];

    if (!apiKey || !fromEmail) {
      return new Response(
        "Missing Resend configuration: resend_api_key and resend_from_email are required",
        { status: 400 }
      );
    }

    const authHeader = `Bearer ${apiKey}`;

    if (listId) {
      // Production path: create a Resend broadcast to the audience list, then send it.
      // This matches the pattern in worker/posting/resend.ts.
      const broadcastPayload = {
        audience_id: listId,
        from: fromEmail,
        subject: draft.subject,
        html: draft.body,
      };

      const broadcastRes = await fetch(`${RESEND_API_URL}/broadcasts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(broadcastPayload),
      });

      if (!broadcastRes.ok) {
        const text = await broadcastRes.text();
        return new Response(
          `Resend broadcast creation failed (${broadcastRes.status}): ${text}`,
          { status: 502 }
        );
      }

      const broadcastData = (await broadcastRes.json()) as { id: string };
      const broadcastId = broadcastData.id;

      const sendRes = await fetch(`${RESEND_API_URL}/broadcasts/${broadcastId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      });

      if (!sendRes.ok) {
        const text = await sendRes.text();
        return new Response(
          `Resend broadcast send failed (${sendRes.status}): ${text}`,
          { status: 502 }
        );
      }
    } else {
      // Fallback: no list configured — send a test email to the sender address.
      // NOTE: In production, set resend_list_id to use audience broadcasting.
      const emailPayload = {
        from: fromEmail,
        to: [fromEmail],
        subject: draft.subject,
        html: draft.body,
      };

      const emailRes = await fetch(`${RESEND_API_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(emailPayload),
      });

      if (!emailRes.ok) {
        const text = await emailRes.text();
        return new Response(
          `Resend email send failed (${emailRes.status}): ${text}`,
          { status: 502 }
        );
      }
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
