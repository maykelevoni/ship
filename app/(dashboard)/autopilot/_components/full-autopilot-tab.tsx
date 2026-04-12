"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot } from "lucide-react";
import { Toggle, SaveButton } from "../../settings/_components/ui";

interface AutopilotRule {
  id: string;
  type: string;
  days: string[];
  hour: number;
  sources?: string[];
  platforms?: string[];
  promotionId?: string | null;
  gate: boolean;
  keyword?: string | null;
  enabled: boolean;
}

interface Promotion {
  id: string;
  name: string;
  type: string;
  status: string;
  weight: number;
}

interface FullAutopilotTabProps {
  rules: AutopilotRule[];
  onRuleUpdated?: () => void;
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const SOURCES = ["youtube", "reddit", "hn", "news"] as const;
const SOURCE_LABELS: Record<string, string> = {
  youtube: "YouTube",
  reddit: "Reddit",
  hn: "HN",
  news: "News",
};

const PLATFORMS = ["twitter", "linkedin", "reddit", "instagram", "blog"] as const;
const PLATFORM_LABELS: Record<string, string> = {
  twitter: "Twitter",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  instagram: "Instagram",
  blog: "Blog",
};

export function FullAutopilotTab({ rules, onRuleUpdated }: FullAutopilotTabProps) {
  const fullRule = rules.find((r) => r.type === "full") || null;

  // Form state
  const [enabled, setEnabled] = useState(fullRule?.enabled ?? true);
  const [days, setDays] = useState<string[]>(fullRule?.days ?? []);
  const [hour, setHour] = useState(fullRule?.hour ?? 8);
  const [sources, setSources] = useState<string[]>(fullRule?.sources ?? ["youtube", "reddit"]);
  const [promotionId, setPromotionId] = useState<string | null>(fullRule?.promotionId ?? null);
  const [platforms, setPlatforms] = useState<string[]>(fullRule?.platforms ?? ["twitter", "linkedin"]);
  const [gate, setGate] = useState(fullRule?.gate ?? false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<"saved" | "error" | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);

  // Fetch active promotions
  useEffect(() => {
    async function fetchPromotions() {
      try {
        const res = await fetch("/api/promotions?status=active&limit=50");
        if (res.ok) {
          const json = await res.json();
          setPromotions(json.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch promotions:", error);
      } finally {
        setLoadingPromotions(false);
      }
    }
    fetchPromotions();
  }, []);

  // Toggle enabled immediately
  const handleToggleEnabled = useCallback(async () => {
    const newValue = !enabled;
    setEnabled(newValue);

    if (fullRule) {
      try {
        await fetch(`/api/autopilot/${fullRule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: newValue }),
        });
        onRuleUpdated?.();
      } catch (error) {
        console.error("Failed to toggle enabled:", error);
        setEnabled(!newValue); // Revert on error
      }
    }
  }, [enabled, fullRule, onRuleUpdated]);

  // Save full rule
  const handleSave = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const body = {
        type: "full" as const,
        days,
        hour,
        sources: sources.length > 0 ? sources : undefined,
        platforms: platforms.length > 0 ? platforms : undefined,
        promotionId: promotionId || undefined,
        gate,
        enabled,
      };

      const res = fullRule
        ? await fetch(`/api/autopilot/${fullRule.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/autopilot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) throw new Error("Save failed");

      setFeedback("saved");
      onRuleUpdated?.();
    } catch (error) {
      console.error("Failed to save:", error);
      setFeedback("error");
    } finally {
      setLoading(false);
    }
  }, [days, hour, sources, promotionId, platforms, gate, enabled, fullRule, onRuleUpdated]);

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const toggleSource = (source: string) => {
    setSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  return (
    <div
      style={{
        background: "#0f0f0f",
        border: "1px solid #1a1a1a",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Bot size={18} style={{ color: "#6366f1", flexShrink: 0 }} />
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 600,
                color: "#e4e4e7",
              }}
            >
              Full Autopilot
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "#52525b",
              }}
            >
              Runs the complete pipeline on schedule
            </p>
          </div>
        </div>
        <Toggle checked={enabled} onChange={handleToggleEnabled} label="" />
      </div>

      {/* Content */}
      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Days */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "#a1a1aa",
              marginBottom: "8px",
            }}
          >
            Runs on
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {DAYS.map((day) => {
              const selected = days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: selected ? "none" : "1px solid #2a2a2a",
                    background: selected ? "#6366f1" : "transparent",
                    color: selected ? "#fff" : "#71717a",
                    fontSize: "13px",
                    fontWeight: selected ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {DAY_LABELS[day]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "#a1a1aa",
              marginBottom: "8px",
            }}
          >
            At
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              value={hour}
              onChange={(e) => setHour(parseInt(e.target.value, 10))}
              style={{
                padding: "8px 32px 8px 12px",
                borderRadius: "7px",
                border: "1px solid #2a2a2a",
                background: "#0a0a0a",
                color: "#e4e4e7",
                fontSize: "13px",
                cursor: "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2371717a' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
              }}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
            <span style={{ fontSize: "13px", color: "#71717a" }}>:00</span>
          </div>
        </div>

        {/* Research */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "#a1a1aa",
              marginBottom: "8px",
            }}
          >
            Research
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SOURCES.map((source) => {
              const checked = sources.includes(source);
              return (
                <button
                  key={source}
                  type="button"
                  onClick={() => toggleSource(source)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "7px",
                    border: `1px solid ${checked ? "#6366f1" : "#2a2a2a"}`,
                    background: checked ? "#1e1b4b" : "transparent",
                    color: checked ? "#a5b4fc" : "#71717a",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "14px",
                      height: "14px",
                      borderRadius: "3px",
                      border: `1px solid ${checked ? "#6366f1" : "#3f3f46"}`,
                      background: checked ? "#6366f1" : "transparent",
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: 600,
                    }}
                  >
                    {checked ? "✓" : ""}
                  </span>
                  {SOURCE_LABELS[source]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Promotion */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "#a1a1aa",
              marginBottom: "8px",
            }}
          >
            Promote
          </label>
          <select
            value={promotionId ?? ""}
            onChange={(e) => setPromotionId(e.target.value || null)}
            disabled={loadingPromotions}
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "8px 32px 8px 12px",
              borderRadius: "7px",
              border: "1px solid #2a2a2a",
              background: "#0a0a0a",
              color: "#e4e4e7",
              fontSize: "13px",
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2371717a' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              opacity: loadingPromotions ? 0.7 : 1,
            }}
          >
            <option value="">Auto-pick by priority</option>
            {promotions.map((promo) => (
              <option key={promo.id} value={promo.id}>
                {promo.name} (weight: {promo.weight})
              </option>
            ))}
          </select>
        </div>

        {/* Platforms */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "#a1a1aa",
              marginBottom: "8px",
            }}
          >
            Post to
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {PLATFORMS.map((platform) => {
              const checked = platforms.includes(platform);
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "7px",
                    border: `1px solid ${checked ? "#6366f1" : "#2a2a2a"}`,
                    background: checked ? "#1e1b4b" : "transparent",
                    color: checked ? "#a5b4fc" : "#71717a",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "14px",
                      height: "14px",
                      borderRadius: "3px",
                      border: `1px solid ${checked ? "#6366f1" : "#3f3f46"}`,
                      background: checked ? "#6366f1" : "transparent",
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: 600,
                    }}
                  >
                    {checked ? "✓" : ""}
                  </span>
                  {PLATFORM_LABELS[platform]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gate */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "#a1a1aa",
              marginBottom: "8px",
            }}
          >
            Gate
          </label>
          <div style={{ display: "flex", gap: "16px" }}>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "#71717a",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="gate"
                checked={!gate}
                onChange={() => setGate(false)}
                style={{
                  width: "16px",
                  height: "16px",
                  accentColor: "#6366f1",
                  cursor: "pointer",
                }}
              />
              Auto-post
            </label>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "#71717a",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="gate"
                checked={gate}
                onChange={() => setGate(true)}
                style={{
                  width: "16px",
                  height: "16px",
                  accentColor: "#6366f1",
                  cursor: "pointer",
                }}
              />
              Require approval
            </label>
          </div>
        </div>

        {/* Save button */}
        <div style={{ paddingTop: "8px" }}>
          <SaveButton onClick={handleSave} loading={loading} feedback={feedback} />
        </div>
      </div>
    </div>
  );
}
