"use client";

import { useState } from "react";
import { Globe, KeyRound, Send } from "lucide-react";

import type { SectionProps } from "./types";
import { FieldRow, PasswordInput, SaveButton, SectionCard } from "./ui";

export function ApiKeysSection({ settings, saving, onSave }: SectionProps) {
  const [geminiKey, setGeminiKey] = useState(settings.gemini_api_key ?? "");
  const [openrouterKey, setOpenrouterKey] = useState(
    settings.openrouter_api_key ?? "",
  );
  const [openrouterModel, setOpenrouterModel] = useState(
    settings.openrouter_model ?? "deepseek/deepseek-v3",
  );
  const [replicateKey, setReplicateKey] = useState(
    settings.replicate_api_key ?? "",
  );
  const [postbridgeKey, setPostbridgeKey] = useState(
    settings.postbridge_api_key ?? "",
  );
  const [youtubeKey, setYoutubeKey] = useState(settings.youtube_api_key ?? "");
  const [newsapiKey, setNewsapiKey] = useState(settings.newsapi_key ?? "");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<"saved" | "error" | null>(null);
  const [postingLoading, setPostingLoading] = useState(false);
  const [postingFeedback, setPostingFeedback] = useState<
    "saved" | "error" | null
  >(null);
  const [researchKeyLoading, setResearchKeyLoading] = useState(false);
  const [researchKeyFeedback, setResearchKeyFeedback] = useState<
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

  function saveAI() {
    handleSaveWithFeedback(
      {
        gemini_api_key: geminiKey,
        openrouter_api_key: openrouterKey,
        openrouter_model: openrouterModel,
        replicate_api_key: replicateKey,
      },
      setAiLoading,
      setAiFeedback,
    );
  }

  function savePosting() {
    handleSaveWithFeedback(
      { postbridge_api_key: postbridgeKey },
      setPostingLoading,
      setPostingFeedback,
    );
  }

  function saveResearchKeys() {
    handleSaveWithFeedback(
      {
        youtube_api_key: youtubeKey,
        newsapi_key: newsapiKey,
      },
      setResearchKeyLoading,
      setResearchKeyFeedback,
    );
  }

  return (
    <>
      {/* AI Providers */}
      <SectionCard
        title="AI Providers"
        description="Gemini is primary. OpenRouter and Replicate are the fallbacks."
        icon={<KeyRound size={15} style={{ color: "#6366f1" }} />}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FieldRow label="Gemini API Key">
            <PasswordInput
              value={geminiKey}
              onChange={setGeminiKey}
              placeholder="AIza..."
            />
          </FieldRow>
          <FieldRow label="OpenRouter API Key">
            <PasswordInput
              value={openrouterKey}
              onChange={setOpenrouterKey}
              placeholder="sk-or-..."
            />
          </FieldRow>
          <FieldRow label="OpenRouter Model">
            <input
              type="text"
              value={openrouterModel}
              onChange={(e) => setOpenrouterModel(e.target.value)}
              placeholder="deepseek/deepseek-v3"
              style={{
                background: "#141414",
                border: "1px solid #27272a",
                borderRadius: "8px",
                color: "#fafafa",
                fontSize: "13px",
                padding: "8px 12px",
                width: "100%",
                outline: "none",
              }}
            />
          </FieldRow>
          <FieldRow label="Replicate API Key">
            <PasswordInput
              value={replicateKey}
              onChange={setReplicateKey}
              placeholder="r8_..."
            />
          </FieldRow>
          <SaveButton
            onClick={saveAI}
            loading={aiLoading || saving}
            feedback={aiFeedback}
          />
        </div>
      </SectionCard>

      {/* Social Posting */}
      <SectionCard
        title="Social Posting"
        description="Configure post-bridge for social media publishing."
        icon={<Send size={15} style={{ color: "#6366f1" }} />}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FieldRow label="post-bridge API Key">
            <PasswordInput
              value={postbridgeKey}
              onChange={setPostbridgeKey}
              placeholder="pb-..."
            />
          </FieldRow>
          <SaveButton
            onClick={savePosting}
            loading={postingLoading || saving}
            feedback={postingFeedback}
          />
        </div>
      </SectionCard>

      {/* Research API Keys */}
      <SectionCard
        title="Research API Keys"
        description="Keys used by the research engine to gather content."
        icon={<Globe size={15} style={{ color: "#6366f1" }} />}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FieldRow label="YouTube API Key">
            <PasswordInput value={youtubeKey} onChange={setYoutubeKey} />
          </FieldRow>
          <FieldRow label="NewsAPI Key">
            <PasswordInput value={newsapiKey} onChange={setNewsapiKey} />
          </FieldRow>
          <SaveButton
            onClick={saveResearchKeys}
            loading={researchKeyLoading || saving}
            feedback={researchKeyFeedback}
          />
        </div>
      </SectionCard>
    </>
  );
}
