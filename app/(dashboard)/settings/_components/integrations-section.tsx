"use client";

import { useState } from "react";

import type { SectionProps } from "./types";
import {
  FieldRow,
  PasswordInput,
  SaveButton,
  SectionCard,
  TextInput,
} from "./ui";

export function IntegrationsSection({
  settings,
  saving,
  onSave,
}: SectionProps) {
  // Ghost
  const [ghostUrl, setGhostUrl] = useState(settings.ghost_url ?? "");
  const [ghostAdminKey, setGhostAdminKey] = useState(
    settings.ghost_admin_api_key ?? "",
  );

  // Brevo
  const [brevoKey, setBrevoKey] = useState(settings.brevo_api_key ?? "");
  const [brevoSenderEmail, setBrevoSenderEmail] = useState(
    settings.brevo_sender_email ?? "",
  );
  const [brevoSenderName, setBrevoSenderName] = useState(
    settings.brevo_sender_name ?? "",
  );
  const [brevoToEmail, setBrevoToEmail] = useState(
    settings.brevo_to_email ?? "",
  );
  const [brevoSmtpKey, setBrevoSmtpKey] = useState(
    settings.brevo_smtp_key ?? "",
  );

  // ElevenLabs
  const [elevenlabsKey, setElevenlabsKey] = useState(
    settings.elevenlabs_api_key ?? "",
  );
  const [elevenlabsVoiceId, setElevenlabsVoiceId] = useState(
    settings.elevenlabs_voice_id ?? "21m00Tcm4TlvDq8ikWAM",
  );

  // Stripe
  const [stripeSecretKey, setStripeSecretKey] = useState(
    settings.stripe_secret_key ?? "",
  );
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState(
    settings.stripe_webhook_secret ?? "",
  );

  const [ghostLoading, setGhostLoading] = useState(false);
  const [ghostFeedback, setGhostFeedback] = useState<"saved" | "error" | null>(
    null,
  );
  const [brevoLoading, setBrevoLoading] = useState(false);
  const [brevoFeedback, setBrevoFeedback] = useState<"saved" | "error" | null>(
    null,
  );
  const [elevenlabsLoading, setElevenlabsLoading] = useState(false);
  const [elevenlabsFeedback, setElevenlabsFeedback] = useState<
    "saved" | "error" | null
  >(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeFeedback, setStripeFeedback] = useState<
    "saved" | "error" | null
  >(null);

  async function handleSaveWithFeedback(
    patch: Parameters<typeof onSave>[0],
    setLoading: (v: boolean) => void,
    setFeedback: (v: "saved" | "error" | null) => void,
  ) {
    setLoading(true);
    setFeedback(null);
    try {
      await onSave(patch);
      setFeedback("saved");
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      setFeedback("error");
    } finally {
      setLoading(false);
    }
  }

  function saveGhost() {
    handleSaveWithFeedback(
      { ghost_url: ghostUrl, ghost_admin_api_key: ghostAdminKey },
      setGhostLoading,
      setGhostFeedback,
    );
  }

  function saveBrevo() {
    handleSaveWithFeedback(
      {
        brevo_api_key: brevoKey,
        brevo_sender_email: brevoSenderEmail,
        brevo_sender_name: brevoSenderName,
        brevo_to_email: brevoToEmail,
        brevo_smtp_key: brevoSmtpKey,
      },
      setBrevoLoading,
      setBrevoFeedback,
    );
  }

  function saveElevenLabs() {
    handleSaveWithFeedback(
      {
        elevenlabs_api_key: elevenlabsKey,
        elevenlabs_voice_id: elevenlabsVoiceId,
      },
      setElevenlabsLoading,
      setElevenlabsFeedback,
    );
  }

  function saveStripe() {
    handleSaveWithFeedback(
      {
        stripe_secret_key: stripeSecretKey,
        stripe_webhook_secret: stripeWebhookSecret,
      },
      setStripeLoading,
      setStripeFeedback,
    );
  }

  return (
    <>
      {/* Ghost CMS */}
      <SectionCard
        title="Ghost CMS"
        description="Publish blog posts directly to your Ghost site."
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FieldRow label="Ghost URL">
            <TextInput
              value={ghostUrl}
              onChange={setGhostUrl}
              placeholder="http://localhost:2368"
            />
          </FieldRow>
          <FieldRow label="Ghost Admin API Key">
            <PasswordInput
              value={ghostAdminKey}
              onChange={setGhostAdminKey}
              placeholder="id:secret"
            />
          </FieldRow>
          <SaveButton
            onClick={saveGhost}
            loading={ghostLoading || saving}
            feedback={ghostFeedback}
          />
        </div>
      </SectionCard>

      {/* Email (Brevo) */}
      <SectionCard
        title="Email (Brevo)"
        description="Configure Brevo for newsletter delivery."
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FieldRow label="Brevo API Key">
            <PasswordInput
              value={brevoKey}
              onChange={setBrevoKey}
              placeholder="xkeysib-..."
            />
          </FieldRow>
          <FieldRow label="Sender Email">
            <TextInput
              value={brevoSenderEmail}
              onChange={setBrevoSenderEmail}
              placeholder="hello@yourdomain.com"
            />
          </FieldRow>
          <FieldRow label="Sender Name">
            <TextInput
              value={brevoSenderName}
              onChange={setBrevoSenderName}
              placeholder="Your Name"
            />
          </FieldRow>
          <FieldRow label="Recipient Email">
            <TextInput
              value={brevoToEmail}
              onChange={setBrevoToEmail}
              placeholder="newsletter@yourdomain.com"
            />
          </FieldRow>
          <FieldRow label="SMTP Key">
            <PasswordInput
              value={brevoSmtpKey}
              onChange={setBrevoSmtpKey}
              placeholder="xsmtp-..."
            />
          </FieldRow>
          <SaveButton
            onClick={saveBrevo}
            loading={brevoLoading || saving}
            feedback={brevoFeedback}
          />
        </div>
      </SectionCard>

      {/* Audio (ElevenLabs) */}
      <SectionCard
        title="Audio (ElevenLabs)"
        description="AI voiceover for captioned video generation."
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FieldRow label="ElevenLabs API Key">
            <PasswordInput
              value={elevenlabsKey}
              onChange={setElevenlabsKey}
              placeholder="sk_..."
            />
          </FieldRow>
          <FieldRow label="Voice">
            <select
              value={elevenlabsVoiceId}
              onChange={(e) => setElevenlabsVoiceId(e.target.value)}
              style={{
                background: "#0a0a0a",
                border: "1px solid #1f1f1f",
                borderRadius: "6px",
                color: "#e4e4e7",
                padding: "8px 12px",
                fontSize: "13px",
                width: "100%",
              }}
            >
              <option value="21m00Tcm4TlvDq8ikWAM">
                Rachel (Female, warm)
              </option>
              <option value="pNInz6obpgDQGcFmaJgB">
                Adam (Male, confident)
              </option>
              <option value="EXAVITQu4vr4xnSDxMaL">Bella (Female, soft)</option>
            </select>
          </FieldRow>
          <SaveButton
            onClick={saveElevenLabs}
            loading={elevenlabsLoading || saving}
            feedback={elevenlabsFeedback}
          />
        </div>
      </SectionCard>

      {/* Stripe */}
      <SectionCard
        title="Stripe"
        description="Payment processing and webhook verification."
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FieldRow label="Secret Key">
            <PasswordInput
              value={stripeSecretKey}
              onChange={setStripeSecretKey}
              placeholder="sk_live_..."
            />
          </FieldRow>
          <FieldRow label="Webhook Secret">
            <PasswordInput
              value={stripeWebhookSecret}
              onChange={setStripeWebhookSecret}
              placeholder="whsec_..."
            />
          </FieldRow>
          <SaveButton
            onClick={saveStripe}
            loading={stripeLoading || saving}
            feedback={stripeFeedback}
          />
        </div>
      </SectionCard>
    </>
  );
}
