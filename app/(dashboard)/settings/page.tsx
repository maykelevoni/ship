"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Eye, EyeOff, Save } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingsData {
  anthropic_api_key: string | null;
  gemini_api_key: string | null;
  ai_fallback_enabled: string | null;
  postbridge_api_key: string | null;
  enabled_platforms: string | null;
  resend_api_key: string | null;
  resend_from_email: string | null;
  resend_list_id: string | null;
  timezone: string | null;
  gate_mode: string | null;
  daily_run_hour: string | null;
}

const ALL_PLATFORMS = [
  { id: "twitter", label: "Twitter / X", emoji: "🐦" },
  { id: "linkedin", label: "LinkedIn", emoji: "💼" },
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "facebook", label: "Facebook", emoji: "👥" },
  { id: "reddit", label: "Reddit", emoji: "🤖" },
  { id: "tiktok", label: "TikTok", emoji: "🎵" },
  { id: "email", label: "Email", emoji: "✉️" },
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBool(val: string | null | boolean): boolean {
  if (val === true || val === "true") return true;
  return false;
}

function parsePlatforms(val: string | null): string[] {
  if (!val) return ALL_PLATFORMS.map((p) => p.id);
  try {
    const arr = JSON.parse(val);
    if (Array.isArray(arr)) return arr as string[];
  } catch {
    // ignore
  }
  return ALL_PLATFORMS.map((p) => p.id);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div
      style={{
        background: "#0f0f0f",
        border: "1px solid #1a1a1a",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "15px",
            fontWeight: 600,
            color: "#e4e4e7",
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "12px",
              color: "#52525b",
            }}
          >
            {description}
          </p>
        )}
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr",
        gap: "16px",
        alignItems: "center",
        paddingBottom: "16px",
        borderBottom: "1px solid #141414",
        marginBottom: "16px",
      }}
    >
      <label style={{ fontSize: "13px", fontWeight: 500, color: "#a1a1aa" }}>
        {label}
      </label>
      <div>{children}</div>
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "8px 12px",
        background: "#0a0a0a",
        border: "1px solid #2a2a2a",
        borderRadius: "7px",
        color: "#e4e4e7",
        fontSize: "13px",
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "8px 40px 8px 12px",
          background: "#0a0a0a",
          border: "1px solid #2a2a2a",
          borderRadius: "7px",
          color: "#e4e4e7",
          fontSize: "13px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: "#52525b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: "2px",
        }}
        aria-label={show ? "Hide" : "Show"}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
      }}
      onClick={() => onChange(!checked)}
    >
      <div
        style={{
          width: "40px",
          height: "22px",
          borderRadius: "11px",
          background: checked ? "#6366f1" : "#1a1a1a",
          border: `1px solid ${checked ? "#6366f1" : "#2a2a2a"}`,
          position: "relative",
          transition: "background 0.15s ease, border-color 0.15s ease",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "2px",
            left: checked ? "19px" : "2px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.15s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "13px", color: "#a1a1aa" }}>{label}</span>
    </div>
  );
}

function SaveButton({
  onClick,
  loading,
  feedback,
}: {
  onClick: () => void;
  loading: boolean;
  feedback: "saved" | "error" | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        paddingTop: "4px",
      }}
    >
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 18px",
          borderRadius: "7px",
          border: "none",
          background: "#6366f1",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        <Save size={13} />
        {loading ? "Saving…" : "Save"}
      </button>
      {feedback === "saved" && (
        <span
          style={{
            fontSize: "13px",
            color: "#4ade80",
            fontWeight: 500,
          }}
        >
          Saved!
        </span>
      )}
      {feedback === "error" && (
        <span
          style={{
            fontSize: "13px",
            color: "#f87171",
            fontWeight: 500,
          }}
        >
          Save failed. Please try again.
        </span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  // AI section
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [aiFallback, setAiFallback] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<"saved" | "error" | null>(null);

  // Posting section
  const [postbridgeKey, setPostbridgeKey] = useState("");
  const [enabledPlatforms, setEnabledPlatforms] = useState<string[]>(
    ALL_PLATFORMS.map((p) => p.id)
  );
  const [postingLoading, setPostingLoading] = useState(false);
  const [postingFeedback, setPostingFeedback] = useState<"saved" | "error" | null>(null);

  // Email section
  const [resendKey, setResendKey] = useState("");
  const [resendFrom, setResendFrom] = useState("");
  const [resendListId, setResendListId] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<"saved" | "error" | null>(null);

  // General section
  const [timezone, setTimezone] = useState("America/New_York");
  const [gateMode, setGateMode] = useState(false);
  const [dailyRunHour, setDailyRunHour] = useState("6");
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalFeedback, setGeneralFeedback] = useState<"saved" | "error" | null>(null);

  const [pageLoading, setPageLoading] = useState(true);

  // ── Load settings on mount ────────────────────────────────────────────────

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data: SettingsData = await res.json();
        setAnthropicKey(data.anthropic_api_key ?? "");
        setGeminiKey(data.gemini_api_key ?? "");
        setAiFallback(parseBool(data.ai_fallback_enabled));
        setPostbridgeKey(data.postbridge_api_key ?? "");
        setEnabledPlatforms(parsePlatforms(data.enabled_platforms));
        setResendKey(data.resend_api_key ?? "");
        setResendFrom(data.resend_from_email ?? "");
        setResendListId(data.resend_list_id ?? "");
        setTimezone(data.timezone ?? "America/New_York");
        setGateMode(parseBool(data.gate_mode));
        setDailyRunHour(data.daily_run_hour ?? "6");
      }
    } catch {
      // silently fail
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ── Save helpers ──────────────────────────────────────────────────────────

  async function saveSection(
    payload: Record<string, string | boolean>,
    setLoading: (v: boolean) => void,
    setFeedback: (v: "saved" | "error" | null) => void
  ) {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setFeedback("saved");
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setFeedback("error");
      }
    } catch {
      setFeedback("error");
    } finally {
      setLoading(false);
    }
  }

  function togglePlatform(id: string) {
    setEnabledPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  // ── Section save handlers ─────────────────────────────────────────────────

  function saveAI() {
    saveSection(
      {
        anthropic_api_key: anthropicKey,
        gemini_api_key: geminiKey,
        ai_fallback_enabled: String(aiFallback),
      },
      setAiLoading,
      setAiFeedback
    );
  }

  function savePosting() {
    saveSection(
      {
        postbridge_api_key: postbridgeKey,
        enabled_platforms: JSON.stringify(enabledPlatforms),
      },
      setPostingLoading,
      setPostingFeedback
    );
  }

  function saveEmail() {
    saveSection(
      {
        resend_api_key: resendKey,
        resend_from_email: resendFrom,
        resend_list_id: resendListId,
      },
      setEmailLoading,
      setEmailFeedback
    );
  }

  function saveGeneral() {
    const hour = parseInt(dailyRunHour, 10);
    saveSection(
      {
        timezone,
        gate_mode: String(gateMode),
        daily_run_hour: String(isNaN(hour) ? 6 : Math.max(0, Math.min(23, hour))),
      },
      setGeneralLoading,
      setGeneralFeedback
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 0",
        }}
      >
        <span style={{ fontSize: "13px", color: "#52525b" }}>Loading settings…</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Settings size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 700,
            color: "#e4e4e7",
          }}
        >
          Settings
        </h1>
      </div>

      {/* ── AI Providers ────────────────────────────────────────────────────── */}
      <SectionCard
        title="AI Providers"
        description="Configure API keys for text and image generation."
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FieldRow label="Anthropic API Key">
            <PasswordInput
              value={anthropicKey}
              onChange={setAnthropicKey}
              placeholder="sk-ant-..."
            />
          </FieldRow>
          <FieldRow label="Gemini API Key">
            <PasswordInput
              value={geminiKey}
              onChange={setGeminiKey}
              placeholder="AIza..."
            />
          </FieldRow>
          <div style={{ paddingBottom: "20px", borderBottom: "1px solid #141414", marginBottom: "20px" }}>
            <Toggle
              checked={aiFallback}
              onChange={setAiFallback}
              label="Auto-switch to Gemini when Claude is unavailable"
            />
          </div>
          <SaveButton onClick={saveAI} loading={aiLoading} feedback={aiFeedback} />
        </div>
      </SectionCard>

      {/* ── Social Posting ───────────────────────────────────────────────────── */}
      <SectionCard
        title="Social Posting"
        description="Configure post-bridge and the platforms you want to publish to."
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FieldRow label="post-bridge API Key">
            <PasswordInput
              value={postbridgeKey}
              onChange={setPostbridgeKey}
              placeholder="pb-..."
            />
          </FieldRow>

          {/* Enabled platforms */}
          <div
            style={{
              paddingBottom: "20px",
              borderBottom: "1px solid #141414",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#a1a1aa",
              }}
            >
              Enabled Platforms
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "8px",
              }}
            >
              {ALL_PLATFORMS.map((p) => {
                const on = enabledPlatforms.includes(p.id);
                return (
                  <label
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: `1px solid ${on ? "rgba(99,102,241,0.4)" : "#1a1a1a"}`,
                      background: on ? "rgba(99,102,241,0.08)" : "#0a0a0a",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => togglePlatform(p.id)}
                      style={{ display: "none" }}
                    />
                    <span style={{ fontSize: "16px" }}>{p.emoji}</span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: on ? "#e4e4e7" : "#71717a",
                        fontWeight: on ? 500 : 400,
                      }}
                    >
                      {p.label}
                    </span>
                    {on && (
                      <span
                        style={{
                          marginLeft: "auto",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#6366f1",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <SaveButton
            onClick={savePosting}
            loading={postingLoading}
            feedback={postingFeedback}
          />
        </div>
      </SectionCard>

      {/* ── Email ─────────────────────────────────────────────────────────────── */}
      <SectionCard
        title="Email"
        description="Configure Resend for newsletter delivery."
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FieldRow label="Resend API Key">
            <PasswordInput
              value={resendKey}
              onChange={setResendKey}
              placeholder="re_..."
            />
          </FieldRow>
          <FieldRow label="From Email">
            <TextInput
              value={resendFrom}
              onChange={setResendFrom}
              placeholder="hello@yourdomain.com"
            />
          </FieldRow>
          <FieldRow label="Audience List ID">
            <TextInput
              value={resendListId}
              onChange={setResendListId}
              placeholder="list_..."
            />
          </FieldRow>
          <SaveButton
            onClick={saveEmail}
            loading={emailLoading}
            feedback={emailFeedback}
          />
        </div>
      </SectionCard>

      {/* ── General ──────────────────────────────────────────────────────────── */}
      <SectionCard
        title="General"
        description="Timezone, gate mode, and engine schedule."
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FieldRow label="Timezone">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#0a0a0a",
                border: "1px solid #2a2a2a",
                borderRadius: "7px",
                color: "#e4e4e7",
                fontSize: "13px",
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </FieldRow>

          <FieldRow label="Run Engine At Hour (24h)">
            <input
              type="number"
              min={0}
              max={23}
              value={dailyRunHour}
              onChange={(e) => setDailyRunHour(e.target.value)}
              style={{
                width: "100px",
                padding: "8px 12px",
                background: "#0a0a0a",
                border: "1px solid #2a2a2a",
                borderRadius: "7px",
                color: "#e4e4e7",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </FieldRow>

          <div
            style={{
              paddingBottom: "20px",
              borderBottom: "1px solid #141414",
              marginBottom: "20px",
            }}
          >
            <Toggle
              checked={gateMode}
              onChange={setGateMode}
              label="Require approval before content posts (Gate Mode)"
            />
          </div>

          <SaveButton
            onClick={saveGeneral}
            loading={generalLoading}
            feedback={generalFeedback}
          />
        </div>
      </SectionCard>
    </div>
  );
}
