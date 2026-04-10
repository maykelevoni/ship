"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

const ALL_PLATFORMS = [
  { id: "twitter", label: "Twitter / X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "reddit", label: "Reddit" },
  { id: "email", label: "Email" },
  { id: "tiktok", label: "TikTok" },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
];

// ─── Shared sub-components ────────────────────────────────────────────────────

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "13px", fontWeight: 500, color: "#a1a1aa" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "9px 40px 9px 12px",
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
    </div>
  );
}

function StepDots({ current }: { current: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        marginBottom: "32px",
      }}
    >
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? "24px" : "8px",
            height: "8px",
            borderRadius: "4px",
            background:
              i === current ? "#6366f1" : i < current ? "#3f3f46" : "#27272a",
            transition: "all 0.2s ease",
          }}
        />
      ))}
    </div>
  );
}

function ActionRow({
  onBack,
  onNext,
  nextLabel,
  loading,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  loading: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginTop: "28px",
        justifyContent: onBack ? "space-between" : "flex-end",
      }}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          style={{
            padding: "9px 20px",
            borderRadius: "7px",
            border: "1px solid #2a2a2a",
            background: "transparent",
            color: "#a1a1aa",
            fontSize: "13px",
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          Back
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={loading}
        style={{
          padding: "9px 24px",
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
        {loading ? "Saving…" : nextLabel}
      </button>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      style={{
        margin: "12px 0 0",
        fontSize: "13px",
        color: "#f87171",
        fontWeight: 500,
      }}
    >
      {message}
    </p>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "14px",
          background: "rgba(99,102,241,0.12)",
          border: "1px solid rgba(99,102,241,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: "26px",
        }}
      >
        ⚡
      </div>
      <h1
        style={{
          margin: "0 0 12px",
          fontSize: "24px",
          fontWeight: 700,
          color: "#e4e4e7",
          letterSpacing: "-0.02em",
        }}
      >
        Welcome to PostForge
      </h1>
      <p
        style={{
          margin: "0 0 32px",
          fontSize: "14px",
          color: "#71717a",
          lineHeight: 1.6,
        }}
      >
        Let&apos;s get your account set up in a few steps.
      </p>
      <button
        type="button"
        onClick={onNext}
        style={{
          width: "100%",
          padding: "11px 24px",
          borderRadius: "8px",
          border: "none",
          background: "#6366f1",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "opacity 0.15s ease",
        }}
      >
        Get Started →
      </button>
    </div>
  );
}

function StepAIKeys({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNext() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anthropic_api_key: anthropicKey,
          gemini_api_key: geminiKey,
        }),
      });
      if (!res.ok) throw new Error("Failed to save API keys.");
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2
        style={{
          margin: "0 0 6px",
          fontSize: "20px",
          fontWeight: 700,
          color: "#e4e4e7",
          letterSpacing: "-0.01em",
        }}
      >
        AI Keys
      </h2>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: "13px",
          color: "#71717a",
          lineHeight: 1.5,
        }}
      >
        PostForge uses Claude for writing and Gemini for image generation.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <PasswordField
          label="Anthropic API Key"
          value={anthropicKey}
          onChange={setAnthropicKey}
          placeholder="sk-ant-..."
        />
        <PasswordField
          label="Gemini API Key"
          value={geminiKey}
          onChange={setGeminiKey}
          placeholder="AIza..."
        />
      </div>

      {error && <ErrorMessage message={error} />}

      <ActionRow
        onBack={onBack}
        onNext={handleNext}
        nextLabel="Next"
        loading={loading}
      />
    </div>
  );
}

function StepPostBridge({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const [postbridgeKey, setPostbridgeKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNext() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postbridge_api_key: postbridgeKey }),
      });
      if (!res.ok) throw new Error("Failed to save PostBridge key.");
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2
        style={{
          margin: "0 0 6px",
          fontSize: "20px",
          fontWeight: 700,
          color: "#e4e4e7",
          letterSpacing: "-0.01em",
        }}
      >
        PostBridge Key
      </h2>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: "13px",
          color: "#71717a",
          lineHeight: 1.5,
        }}
      >
        This is what posts to your social accounts. You can skip this and add it
        later in Settings.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <PasswordField
          label="PostBridge API Key"
          value={postbridgeKey}
          onChange={setPostbridgeKey}
          placeholder="pb-..."
        />
      </div>

      <p
        style={{
          margin: "12px 0 0",
          fontSize: "12px",
          color: "#52525b",
          lineHeight: 1.5,
        }}
      >
        Get your key at{" "}
        <a
          href="https://postbridge.io"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#6366f1", textDecoration: "none" }}
        >
          postbridge.io
        </a>{" "}
        ($29/mo). This is what posts to your social accounts.
      </p>

      {error && <ErrorMessage message={error} />}

      <ActionRow
        onBack={onBack}
        onNext={handleNext}
        nextLabel="Next"
        loading={loading}
      />
    </div>
  );
}

function StepPlatforms({
  onBack,
  onFinish,
}: {
  onBack: () => void;
  onFinish: () => void;
}) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    ALL_PLATFORMS.map((p) => p.id),
  );
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleFinish() {
    setLoading(true);
    setError(null);
    try {
      // 1. Save platforms + timezone
      const settingsRes = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled_platforms: JSON.stringify(selectedPlatforms),
          timezone,
        }),
      });
      if (!settingsRes.ok) throw new Error("Failed to save platform settings.");

      // 2. Mark onboarding complete
      const onboardingRes = await fetch("/api/user/onboarding", {
        method: "POST",
      });
      if (!onboardingRes.ok) throw new Error("Failed to complete onboarding.");

      // 3. Redirect to dashboard — hard navigation forces fresh JWT so middleware
      //    reads onboardingDone: true from the new session token
      onFinish();
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2
        style={{
          margin: "0 0 6px",
          fontSize: "20px",
          fontWeight: 700,
          color: "#e4e4e7",
          letterSpacing: "-0.01em",
        }}
      >
        Platforms &amp; Timezone
      </h2>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: "13px",
          color: "#71717a",
          lineHeight: 1.5,
        }}
      >
        Choose which platforms should receive generated content.
      </p>

      {/* Platform grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px",
          marginBottom: "20px",
        }}
      >
        {ALL_PLATFORMS.map((p) => {
          const on = selectedPlatforms.includes(p.id);
          return (
            <label
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: `1px solid ${on ? "rgba(99,102,241,0.4)" : "#1e1e1e"}`,
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
              <span
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "3px",
                  border: `1px solid ${on ? "#6366f1" : "#3f3f46"}`,
                  background: on ? "#6366f1" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
              >
                {on && (
                  <span
                    style={{
                      fontSize: "9px",
                      color: "#fff",
                      lineHeight: 1,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                )}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: on ? "#e4e4e7" : "#71717a",
                  fontWeight: on ? 500 : 400,
                }}
              >
                {p.label}
              </span>
            </label>
          );
        })}
      </div>

      {/* Timezone */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "13px", fontWeight: 500, color: "#a1a1aa" }}>
          Timezone
        </label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          style={{
            width: "100%",
            padding: "9px 12px",
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
      </div>

      {error && <ErrorMessage message={error} />}

      <ActionRow
        onBack={onBack}
        onNext={handleFinish}
        nextLabel="Finish"
        loading={loading}
      />
    </div>
  );
}

// ─── Wizard shell ─────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const [step, setStep] = useState(0);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "480px",
        margin: "0 auto",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: "#111111",
          border: "1px solid #1e1e1e",
          borderRadius: "16px",
          padding: "40px",
        }}
      >
        <StepDots current={step} />

        {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
        {step === 1 && (
          <StepAIKeys onBack={() => setStep(0)} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <StepPostBridge onBack={() => setStep(1)} onNext={() => setStep(3)} />
        )}
        {step === 3 && (
          <StepPlatforms onBack={() => setStep(2)} onFinish={() => {}} />
        )}
      </div>
    </div>
  );
}
