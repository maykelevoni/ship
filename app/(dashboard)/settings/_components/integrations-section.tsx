"use client";

import { useState } from "react";
import { Plug } from "lucide-react";

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
  // Systeme.io
  const [systemeDomain, setSystemeDomain] = useState(settings.systeme_domain ?? "");
  const [systemeFunnelUrl, setSystemeFunnelUrl] = useState(settings.systeme_default_funnel_url ?? "");
  const [systemeApiKey, setSystemeApiKey] = useState(settings.systeme_api_key ?? "");

  // Ghost
  const [ghostUrl, setGhostUrl] = useState(settings.ghost_url ?? "");
  const [ghostAdminKey, setGhostAdminKey] = useState(
    settings.ghost_admin_api_key ?? "",
  );

  // ElevenLabs
  const [elevenlabsKey, setElevenlabsKey] = useState(
    settings.elevenlabs_api_key ?? "",
  );
  const [elevenlabsVoiceId, setElevenlabsVoiceId] = useState(
    settings.elevenlabs_voice_id ?? "21m00Tcm4TlvDq8ikWAM",
  );

  // Amazon Associates
  const [amazonTag, setAmazonTag] = useState(settings.amazon_affiliate_tag ?? "");
  const [amazonPaapiKey, setAmazonPaapiKey] = useState(settings.amazon_paapi_key ?? "");
  const [amazonPaapiSecret, setAmazonPaapiSecret] = useState(settings.amazon_paapi_secret ?? "");

  // ClickBank
  const [clickbankKey, setClickbankKey] = useState(settings.clickbank_api_key ?? "");
  const [clickbankAccount, setClickbankAccount] = useState(settings.clickbank_account ?? "");

  const [systemeLoading, setSystemeLoading] = useState(false);
  const [systemeFeedback, setSystemeFeedback] = useState<"saved" | "error" | null>(null);
  const [ghostLoading, setGhostLoading] = useState(false);
  const [ghostFeedback, setGhostFeedback] = useState<"saved" | "error" | null>(
    null,
  );
  const [elevenlabsLoading, setElevenlabsLoading] = useState(false);
  const [elevenlabsFeedback, setElevenlabsFeedback] = useState<
    "saved" | "error" | null
  >(null);

  const [amazonLoading, setAmazonLoading] = useState(false);
  const [amazonFeedback, setAmazonFeedback] = useState<"saved" | "error" | null>(null);
  const [clickbankLoading, setClickbankLoading] = useState(false);
  const [clickbankFeedback, setClickbankFeedback] = useState<"saved" | "error" | null>(null);

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

  function saveSysteme() {
    handleSaveWithFeedback(
      {
        systeme_domain: systemeDomain,
        systeme_default_funnel_url: systemeFunnelUrl,
        systeme_api_key: systemeApiKey,
      },
      setSystemeLoading,
      setSystemeFeedback,
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

  function saveAmazon() {
    handleSaveWithFeedback(
      {
        amazon_affiliate_tag: amazonTag,
        amazon_paapi_key: amazonPaapiKey,
        amazon_paapi_secret: amazonPaapiSecret,
      },
      setAmazonLoading,
      setAmazonFeedback,
    );
  }

  function saveClickBank() {
    handleSaveWithFeedback(
      {
        clickbank_api_key: clickbankKey,
        clickbank_account: clickbankAccount,
      },
      setClickbankLoading,
      setClickbankFeedback,
    );
  }

  return (
    <>
      {/* Systeme.io */}
      <SectionCard
        title="Systeme.io"
        description="Connect Systeme.io to auto-track funnel links in all generated content."
        icon={<Plug size={15} style={{ color: "#6366f1" }} />}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FieldRow label="Domain">
            <TextInput
              value={systemeDomain}
              onChange={setSystemeDomain}
              placeholder="yourname.systeme.io"
            />
          </FieldRow>
          <FieldRow label="Default Funnel URL">
            <TextInput
              value={systemeFunnelUrl}
              onChange={setSystemeFunnelUrl}
              placeholder="https://yourname.systeme.io/your-funnel"
            />
          </FieldRow>
          <FieldRow label="API Key">
            <PasswordInput
              value={systemeApiKey}
              onChange={setSystemeApiKey}
              placeholder="api key from Systeme.io dashboard"
            />
          </FieldRow>
          <SaveButton
            onClick={saveSysteme}
            loading={systemeLoading || saving}
            feedback={systemeFeedback}
          />
        </div>
      </SectionCard>

      {/* Ghost CMS */}
      <SectionCard
        title="Ghost CMS"
        description="Publish blog posts directly to your Ghost site."
        icon={<Plug size={15} style={{ color: "#6366f1" }} />}
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

      {/* Audio (ElevenLabs) */}
      <SectionCard
        title="Audio (ElevenLabs)"
        description="AI voiceover for captioned video generation."
        icon={<Plug size={15} style={{ color: "#6366f1" }} />}
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

      {/* Amazon Associates */}
      <SectionCard
        title="Amazon Associates"
        description="Find and promote physical products via Amazon affiliate links."
        icon={<Plug size={15} style={{ color: "#6366f1" }} />}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FieldRow label="Associate Tag">
            <TextInput
              value={amazonTag}
              onChange={setAmazonTag}
              placeholder="yourtag-20"
            />
          </FieldRow>
          <FieldRow label="PAAPI Key">
            <PasswordInput
              value={amazonPaapiKey}
              onChange={setAmazonPaapiKey}
              placeholder="AKIA..."
            />
          </FieldRow>
          <FieldRow label="PAAPI Secret">
            <PasswordInput
              value={amazonPaapiSecret}
              onChange={setAmazonPaapiSecret}
              placeholder="secret key"
            />
          </FieldRow>
          <SaveButton
            onClick={saveAmazon}
            loading={amazonLoading || saving}
            feedback={amazonFeedback}
          />
        </div>
      </SectionCard>

      {/* ClickBank */}
      <SectionCard
        title="ClickBank"
        description="Find and promote digital products (courses, ebooks, software)."
        icon={<Plug size={15} style={{ color: "#6366f1" }} />}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FieldRow label="Account Nickname">
            <TextInput
              value={clickbankAccount}
              onChange={setClickbankAccount}
              placeholder="youraccount"
            />
          </FieldRow>
          <FieldRow label="API Key">
            <PasswordInput
              value={clickbankKey}
              onChange={setClickbankKey}
              placeholder="CB API key"
            />
          </FieldRow>
          <SaveButton
            onClick={saveClickBank}
            loading={clickbankLoading || saving}
            feedback={clickbankFeedback}
          />
        </div>
      </SectionCard>
    </>
  );
}
