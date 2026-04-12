"use client";

import { Activity, Loader2, Zap } from "lucide-react";

import type { ActivePromotion, TodayStats } from "./today-view";

// ── Utility ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

export function StreamFeed({ events }: { events: string[] }) {
  if (events.length === 0) return null;

  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid #1e1e1e",
        borderRadius: "8px",
        padding: "12px 16px",
        maxHeight: "140px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "6px",
        }}
      >
        <Activity size={12} style={{ color: "#4ade80" }} />
        <span style={{ fontSize: "11px", fontWeight: 600, color: "#4ade80" }}>
          LIVE FEED
        </span>
      </div>
      {[...events].reverse().map((msg, i) => (
        <p
          key={i}
          style={{
            margin: 0,
            fontSize: "11px",
            color: "#71717a",
            fontFamily: "monospace",
            lineHeight: "1.4",
          }}
        >
          {msg}
        </p>
      ))}
    </div>
  );
}

export function AlertBanner({ alertCount }: { alertCount: number }) {
  if (alertCount === 0) return null;

  return (
    <div
      style={{
        background: "rgba(245,158,11,0.1)",
        border: "1px solid rgba(245,158,11,0.25)",
        borderRadius: "6px",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <span style={{ fontSize: "13px", color: "#fbbf24", fontWeight: 500 }}>
        ⚠ {alertCount} item{alertCount !== 1 ? "s" : ""} need attention
      </span>
      <a
        href="/promote"
        style={{
          fontSize: "12px",
          color: "#f59e0b",
          fontWeight: 600,
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        Review queue →
      </a>
    </div>
  );
}

/** Single pipeline stage box */
function PipelineStage({
  label,
  value,
  color,
  href,
}: {
  label: string;
  value: string;
  color: string;
  href?: string;
}) {
  const inner = (
    <div
      style={{
        flex: 1,
        background: "#0d0d0d",
        border: "1px solid #1e1e1e",
        borderRadius: "6px",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "11px",
            color: "#52525b",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: color === "#3f3f46" ? "#52525b" : "#e4e4e7",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );

  if (href) {
    return (
      <a href={href} style={{ flex: 1, textDecoration: "none", minWidth: 0 }}>
        {inner}
      </a>
    );
  }
  return <div style={{ flex: 1, minWidth: 0 }}>{inner}</div>;
}

/** Arrow separator between pipeline stages */
function PipelineArrow() {
  return (
    <span
      style={{
        color: "#3f3f46",
        fontSize: "14px",
        flexShrink: 0,
        paddingTop: "10px",
      }}
    >
      →
    </span>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type PromotionType =
  | "product"
  | "service"
  | "affiliate"
  | "lead_magnet"
  | "content";

const TYPE_BADGE: Record<
  PromotionType,
  { label: string; color: string; bg: string }
> = {
  product: { label: "Product", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  service: { label: "Service", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  affiliate: {
    label: "Affiliate",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.12)",
  },
  lead_magnet: {
    label: "Lead Magnet",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.12)",
  },
  content: { label: "Content", color: "#a1a1aa", bg: "rgba(161,161,170,0.12)" },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface TodayHeaderProps {
  todayDate: string;
  lastEngineRun: { status: string; createdAt: string } | null;
  onRunEngine: () => void;
  engineRunning: boolean;
  // status counts
  postedCount: number;
  totalPieces: number;
  failCount: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TodayHeader({
  todayDate,
  lastEngineRun,
  onRunEngine,
  engineRunning,
  postedCount,
  totalPieces,
  failCount,
}: TodayHeaderProps) {
  const lastRunLabel = lastEngineRun
    ? `Last run: ${relativeTime(lastEngineRun.createdAt)}`
    : "Never run";

  // ── Status chip ─────────────────────────────────────────────────────────────
  const systemStatus: { label: string; color: string; bg: string } =
    totalPieces === 0
      ? {
          label: "Engine not run today",
          color: "#fbbf24",
          bg: "rgba(251,191,36,0.12)",
        }
      : failCount > 0
        ? {
            label: `${failCount} failure${failCount !== 1 ? "s" : ""}`,
            color: "#f87171",
            bg: "rgba(248,113,113,0.12)",
          }
        : postedCount === totalPieces
          ? {
              label: `All ${totalPieces} posted`,
              color: "#4ade80",
              bg: "rgba(74,222,128,0.12)",
            }
          : {
              label: `${postedCount}/${totalPieces} posted today`,
              color: "#60a5fa",
              bg: "rgba(96,165,250,0.12)",
            };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: "12px", color: "#52525b" }}>
          {todayDate}
        </p>
        <h1
          style={{
            margin: "4px 0 0",
            fontSize: "22px",
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          Today
        </h1>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "5px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 600,
            color: systemStatus.color,
            background: systemStatus.bg,
            border: `1px solid ${systemStatus.color}22`,
            flexShrink: 0,
          }}
        >
          {systemStatus.label}
        </span>

        <button
          onClick={onRunEngine}
          disabled={engineRunning}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 16px",
            borderRadius: "8px",
            border: "none",
            background: engineRunning ? "rgba(99,102,241,0.4)" : "#6366f1",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 600,
            cursor: engineRunning ? "not-allowed" : "pointer",
            flexShrink: 0,
            transition: "background 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          {engineRunning ? (
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Zap size={13} />
          )}
          {engineRunning ? "Running…" : "Run Engine Now"}
        </button>
      </div>
    </div>
  );
}
