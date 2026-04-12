"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

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

interface StepModalProps {
  rule?: AutopilotRule | null;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
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

const CONTENT_PLATFORMS = ["blog", "email", "twitter", "linkedin", "reddit", "instagram"] as const;
const CONTENT_LABELS: Record<string, string> = {
  blog: "Blog",
  email: "Email",
  twitter: "Twitter",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  instagram: "Instagram",
};

const POST_PLATFORMS = ["twitter", "linkedin", "reddit", "instagram", "blog"] as const;
const PLATFORM_LABELS: Record<string, string> = {
  twitter: "Twitter",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  instagram: "Instagram",
  blog: "Blog",
};

export function StepModal({ rule, onSave, onClose }: StepModalProps) {
  const isEditing = !!rule;

  // Form state
  const [type, setType] = useState(rule?.type ?? "research");
  const [days, setDays] = useState<string[]>(rule?.days ?? []);
  const [hour, setHour] = useState(rule?.hour ?? 9);
  const [sources, setSources] = useState<string[]>(rule?.sources ?? []);
  const [platforms, setPlatforms] = useState<string[]>(rule?.platforms ?? []);
  const [promotionId, setPromotionId] = useState<string | null>(rule?.promotionId ?? null);
  const [gate, setGate] = useState(rule?.gate ?? false);
  const [keyword, setKeyword] = useState(rule?.keyword ?? "");

  // UI state
  const [loading, setLoading] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);

  // Fetch promotions
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

  const handleSave = async () => {
    if (days.length === 0) {
      alert("Please select at least one day");
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        type,
        days,
        hour,
        enabled: true,
      };

      if (type === "research") {
        body.sources = sources.length > 0 ? sources : undefined;
        body.keyword = keyword || undefined;
      } else if (type === "generate") {
        body.platforms = platforms.length > 0 ? platforms : undefined;
        body.promotionId = promotionId || undefined;
      } else if (type === "post") {
        body.platforms = platforms.length > 0 ? platforms : undefined;
        body.gate = gate;
      }

      await onSave(body);
      onClose();
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save rule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid #1a1a1a",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "560px",
          maxHeight: "90vh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
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
          <h2
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: "#e4e4e7",
            }}
          >
            {isEditing ? "Edit Step" : "Add Step"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              border: "none",
              background: "transparent",
              color: "#71717a",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1a1a1a";
              e.currentTarget.style.color = "#a1a1aa";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#71717a";
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Type selector */}
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
              Step Type
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["research", "generate", "post"] as const).map((t) => {
                const isActive = type === t;
                const icons = { research: "🔍", generate: "✍️", post: "📤" };
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: isActive ? "none" : "1px solid #2a2a2a",
                      background: isActive ? "#6366f1" : "transparent",
                      color: isActive ? "#fff" : "#71717a",
                      fontSize: "13px",
                      fontWeight: isActive ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {icons[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule */}
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
              Schedule
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Day chips */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {DAYS.map((day) => {
                  const selected = days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: selected ? "none" : "1px solid #2a2a2a",
                        background: selected ? "#6366f1" : "transparent",
                        color: selected ? "#fff" : "#71717a",
                        fontSize: "12px",
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

              {/* Hour picker */}
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
                      {i.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Config based on type */}
          {type === "research" && (
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
                Sources
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
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

              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#a1a1aa",
                  marginBottom: "8px",
                }}
              >
                Keyword (optional)
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g., claude code"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "7px",
                  border: "1px solid #2a2a2a",
                  background: "#0a0a0a",
                  color: "#e4e4e7",
                  fontSize: "13px",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#2a2a2a";
                }}
              />
            </div>
          )}

          {type === "generate" && (
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
                Content Types
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                {CONTENT_PLATFORMS.map((platform) => {
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
                      {CONTENT_LABELS[platform]}
                    </button>
                  );
                })}
              </div>

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
          )}

          {type === "post" && (
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
                Platforms
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                {POST_PLATFORMS.map((platform) => {
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
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "20px 24px",
            borderTop: "1px solid #1a1a1a",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: "7px",
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#e4e4e7",
              fontSize: "13px",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#1a1a1a";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: "7px",
              border: "none",
              background: loading ? "#3f3f46" : "#6366f1",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#4f46e5";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = loading ? "#3f3f46" : "#6366f1";
            }}
          >
            {loading ? "Saving…" : isEditing ? "Save Changes" : "Add Step"}
          </button>
        </div>
      </div>
    </div>
  );
}
