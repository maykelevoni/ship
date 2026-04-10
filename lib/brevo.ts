/**
 * brevo.ts
 *
 * Unified Brevo email client. Owns all Brevo API logic.
 * Both lib/email.ts (magic links) and worker/posting/brevo.ts (campaigns)
 * delegate to this module.
 */

import { siteConfig } from "@/config/site";

import { getSetting, getSettings } from "./settings";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// ---------------------------------------------------------------------------
// Low-level sender
// ---------------------------------------------------------------------------

export async function sendTransactional(params: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  fromEmail: string;
  fromName: string;
  apiKey: string;
}): Promise<{ id: string }> {
  const { to, subject, html, text, fromEmail, fromName, apiKey } = params;

  const payload: Record<string, unknown> = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: to }],
    subject,
    ...(html ? { htmlContent: html } : {}),
    ...(text ? { textContent: text } : {}),
  };

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text2 = await response.text();
    throw new Error(`Brevo send failed (${response.status}): ${text2}`);
  }

  const data = await response.json();
  return { id: data.messageId ?? "sent" };
}

// ---------------------------------------------------------------------------
// Magic link emails (called from NextAuth email provider)
// ---------------------------------------------------------------------------

export async function sendMagicLink(params: {
  to: string;
  url: string;
  name?: string;
  isNew: boolean;
}): Promise<void> {
  // Reads BREVO_API_KEY from process.env (required at NextAuth startup)
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY not set");
  }

  const { to, url, name, isNew } = params;

  const authSubject = isNew
    ? "Activate your account"
    : `Sign-in link for ${siteConfig.name}`;
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const bodyText = isNew
    ? `Welcome to ${siteConfig.name}! Click the link below to activate your account.`
    : `Click the link below to sign in to ${siteConfig.name}.`;

  const html = `<!DOCTYPE html>
<html>
  <head></head>
  <body style="font-family:sans-serif;background:#fff;margin:0;padding:0;">
    <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
      <p style="font-size:16px;">${greeting}</p>
      <p style="font-size:16px;">${bodyText}</p>
      <p style="margin:24px 0;">
        <a href="${url}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:15px;">
          ${isNew ? "Activate Account" : "Sign in"}
        </a>
      </p>
      <p style="font-size:14px;color:#666;">This link expires in 24 hours and can only be used once.</p>
      ${!isNew ? '<p style="font-size:14px;color:#666;">If you did not try to log in, you can safely ignore this email.</p>' : ""}
    </div>
  </body>
</html>`;

  // DEV: log the magic link for testing
  if (process.env.NODE_ENV === "development") {
    console.log("\n🔗 MAGIC LINK:", url, "\n");
  }

  // In development, send to a fake address to avoid real emails
  const toEmail =
    process.env.NODE_ENV === "development"
      ? "delivered@example.com"
      : to;

  await sendTransactional({
    to: toEmail,
    subject: authSubject,
    html,
    fromEmail: process.env.EMAIL_FROM ?? "noreply@postforge.com",
    fromName: siteConfig.name,
    apiKey,
  });
}

// ---------------------------------------------------------------------------
// Campaign emails (called from worker posting pipeline)
// ---------------------------------------------------------------------------

export async function sendCampaign(params: {
  subject: string;
  body: string;
  userId: string;
}): Promise<{ id: string }> {
  const { subject, body, userId } = params;

  // Batch-read all Brevo settings from DB
  const settings = await getSettings(
    ["brevo_api_key", "brevo_sender_email", "brevo_sender_name", "brevo_to_email"],
    userId,
  );

  const apiKey = settings.brevo_api_key;
  if (!apiKey) {
    throw new Error("brevo_api_key is not configured in settings");
  }

  const senderEmail = settings.brevo_sender_email;
  if (!senderEmail) {
    throw new Error("brevo_sender_email is not configured in settings");
  }

  const senderName = settings.brevo_sender_name ?? "PostForge";

  const toEmail = settings.brevo_to_email;
  if (!toEmail) {
    throw new Error("brevo_to_email is not configured in settings");
  }

  // Strip "BODY: " prefix if present
  const bodyText = body.startsWith("BODY: ")
    ? body.slice("BODY: ".length)
    : body;

  return sendTransactional({
    to: toEmail,
    subject,
    text: bodyText,
    fromEmail: senderEmail,
    fromName: senderName,
    apiKey,
  });
}
