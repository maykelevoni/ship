import { EmailConfig } from "next-auth/providers/email";

import { env } from "@/env.mjs";
import { siteConfig } from "@/config/site";

import { getUserByEmail } from "./user";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const sendVerificationRequest: EmailConfig["sendVerificationRequest"] =
  async ({ identifier, url, provider }) => {
    const user = await getUserByEmail(identifier);
    if (!user || !user.name) return;

    const userVerified = user?.emailVerified ? true : false;
    const authSubject = userVerified
      ? `Sign-in link for ${siteConfig.name}`
      : "Activate your account";

    const html = `<!DOCTYPE html>
<html>
<head></head>
<body style="font-family:sans-serif;background:#fff;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <p style="font-size:16px;">Hi ${user.name},</p>
    <p style="font-size:16px;">${userVerified ? `Click the link below to sign in to ${siteConfig.name}.` : `Welcome to ${siteConfig.name}! Click the link below to activate your account.`}</p>
    <p style="margin:24px 0;">
      <a href="${url}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:15px;">
        ${userVerified ? "Sign in" : "Activate Account"}
      </a>
    </p>
    <p style="font-size:14px;color:#666;">This link expires in 24 hours and can only be used once.</p>
    ${userVerified ? '<p style="font-size:14px;color:#666;">If you did not try to log in, you can safely ignore this email.</p>' : ""}
  </div>
</body>
</html>`;

    if (!env.BREVO_API_KEY) {
      throw new Error(
        "BREVO_API_KEY is not set. Add it to your environment variables.",
      );
    }

    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: siteConfig.name, email: provider.from },
        to: [
          {
            email:
              process.env.NODE_ENV === "development"
                ? "delivered@example.com"
                : identifier,
          },
        ],
        subject: authSubject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to send verification email.");
    }
  };
