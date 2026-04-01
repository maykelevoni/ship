"use client";

import { useState } from "react";

import type { SectionProps } from "./types";
import { FieldRow, SaveButton, SectionCard, Toggle } from "./ui";

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

function parseBool(val: string | null | boolean): boolean {
  if (val === true || val === "true") return true;
  return false;
}

export function PlatformsSection({ settings, saving, onSave }: SectionProps) {
  const [enabledPlatforms, setEnabledPlatforms] = useState<string[]>(
    parsePlatforms(settings.enabled_platforms),
  );
  const [gateMode, setGateMode] = useState(parseBool(settings.gate_mode));
  const [timezone, setTimezone] = useState(
    settings.timezone ?? "America/New_York",
  );
  const [dailyRunHour, setDailyRunHour] = useState(
    settings.daily_run_hour ?? "6",
  );

  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalFeedback, setGeneralFeedback] = useState<
    "saved" | "error" | null
  >(null);
  const [postingLoading, setPostingLoading] = useState(false);
  const [postingFeedback, setPostingFeedback] = useState<
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

  function togglePlatform(id: string) {
    setEnabledPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function saveGeneral() {
    const hour = parseInt(dailyRunHour, 10);
    handleSaveWithFeedback(
      {
        timezone,
        gate_mode: String(gateMode),
        daily_run_hour: String(
          isNaN(hour) ? 6 : Math.max(0, Math.min(23, hour)),
        ),
      },
      setGeneralLoading,
      setGeneralFeedback,
    );
  }

  function savePlatforms() {
    handleSaveWithFeedback(
      { enabled_platforms: JSON.stringify(enabledPlatforms) },
      setPostingLoading,
      setPostingFeedback,
    );
  }

  return (
    <>
      {/* General section */}
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
            loading={generalLoading || saving}
            feedback={generalFeedback}
          />
        </div>
      </SectionCard>

      {/* Platforms section */}
      <SectionCard
        title="Platforms"
        description="Choose which platforms receive generated content."
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              paddingBottom: "20px",
              borderBottom: "1px solid #141414",
              marginBottom: "20px",
            }}
          >
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
            onClick={savePlatforms}
            loading={postingLoading || saving}
            feedback={postingFeedback}
          />
        </div>
      </SectionCard>
    </>
  );
}
