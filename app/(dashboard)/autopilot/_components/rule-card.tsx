"use client";

import { Edit, Trash2 } from "lucide-react";

interface RuleCardProps {
  rule: {
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
  };
  onEdit: () => void;
  onDelete: () => void;
}

const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const SOURCE_LABELS: Record<string, string> = {
  youtube: "YouTube",
  reddit: "Reddit",
  hn: "HN",
  news: "News",
};

const PLATFORM_LABELS: Record<string, string> = {
  twitter: "Twitter",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  instagram: "Instagram",
  blog: "Blog",
};

const CONTENT_LABELS: Record<string, string> = {
  blog: "Blog",
  email: "Email",
  twitter: "Twitter",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  instagram: "Instagram",
};

const TYPE_COLORS = {
  research: "#60a5fa",
  generate: "#c084fc",
  post: "#4ade80",
};

const TYPE_ICONS = {
  research: "🔍",
  generate: "✍️",
  post: "📤",
};

const TYPE_LABELS = {
  research: "Research",
  generate: "Generate",
  post: "Post",
};

export function RuleCard({ rule, onEdit, onDelete }: RuleCardProps) {
  const dayLabel = rule.days.length === 1
    ? DAY_LABELS[rule.days[0]]
    : rule.days.length === 7
    ? "Every day"
    : `${rule.days.length} days`;

  const timeLabel = `${rule.hour.toString().padStart(2, "0")}:00`;

  const typeColor = TYPE_COLORS[rule.type as keyof typeof TYPE_COLORS] || "#71717a";
  const typeIcon = TYPE_ICONS[rule.type as keyof typeof TYPE_ICONS] || "•";
  const typeLabel = TYPE_LABELS[rule.type as keyof typeof TYPE_LABELS] || rule.type;

  // Build config summary based on type
  let configSummary = "";
  if (rule.type === "research") {
    const sources = rule.sources || [];
    const sourceLabels = sources.map((s) => SOURCE_LABELS[s]).filter(Boolean);
    if (sourceLabels.length > 0) {
      configSummary = sourceLabels.join(" + ");
      if (rule.keyword) {
        configSummary += ` · "${rule.keyword}"`;
      }
    } else {
      configSummary = "No sources selected";
    }
  } else if (rule.type === "generate") {
    const platforms = rule.platforms || [];
    const platformLabels = platforms
      .map((p) => CONTENT_LABELS[p])
      .filter(Boolean);
    if (platformLabels.length > 0) {
      configSummary = platformLabels.join(" + ");
    } else {
      configSummary = "No content types selected";
    }
  } else if (rule.type === "post") {
    const platforms = rule.platforms || [];
    const platformLabels = platforms.map((p) => PLATFORM_LABELS[p]).filter(Boolean);
    if (platformLabels.length > 0) {
      configSummary = platformLabels.join(" + ");
      configSummary += rule.gate ? " · Requires approval" : " · Auto-post";
    } else {
      configSummary = "No platforms selected";
    }
  }

  return (
    <div
      style={{
        background: "#0a0a0a",
        border: "1px solid #1a1a1a",
        borderRadius: "8px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "border-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#2a2a2a";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#1a1a1a";
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "6px",
              background: `${typeColor}15`,
              color: typeColor,
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {typeIcon} {typeLabel}
          </span>
          <span style={{ fontSize: "13px", color: "#e4e4e7" }}>
            {dayLabel} · {timeLabel}
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            onClick={onEdit}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
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
            <Edit size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              border: "none",
              background: "transparent",
              color: "#71717a",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1a1a1a";
              e.currentTarget.style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#71717a";
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Config summary */}
      <div
        style={{
          fontSize: "12px",
          color: "#71717a",
          lineHeight: "1.4",
        }}
      >
        {configSummary}
      </div>
    </div>
  );
}
