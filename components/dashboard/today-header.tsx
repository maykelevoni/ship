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

function GeoScoreChip({ score }: { score: number | null }) {
  if (score === null) return null;

  const color = score >= 70 ? "#4ade80" : score >= 40 ? "#fbbf24" : "#f87171";
  const bg =
    score >= 70
      ? "rgba(74,222,128,0.12)"
      : score >= 40
        ? "rgba(251,191,36,0.12)"
        : "rgba(248,113,113,0.12)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 8px",
        borderRadius: "5px",
        fontSize: "11px",
        fontWeight: 700,
        color,
        background: bg,
      }}
    >
      GEO {score}
    </span>
  );
}

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
  activePromotion: ActivePromotion | null;
  stats: TodayStats;
  lastEngineRun: { status: string; createdAt: string } | null;
  onRunEngine: () => void;
  engineRunning: boolean;
  streamEvents: string[];
  // pipeline counts (derived in parent to avoid re-deriving)
  generatedCount: number;
  mediaCount: number;
  postedCount: number;
  totalPieces: number;
  // research pipeline data
  todayBlogPostStatus: string | null;
  emailDraftStatus: string | null;
  newOpportunitiesCount: number;
  contentPiecesToday: number;
  // alert
  alertCount: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TodayHeader({
  todayDate,
  activePromotion,
  lastEngineRun,
  onRunEngine,
  engineRunning,
  streamEvents,
  generatedCount,
  mediaCount,
  postedCount,
  totalPieces,
  todayBlogPostStatus,
  emailDraftStatus,
  newOpportunitiesCount,
  contentPiecesToday,
  alertCount,
}: TodayHeaderProps) {
  const typeBadge = activePromotion
    ? (TYPE_BADGE[activePromotion.type as PromotionType] ?? TYPE_BADGE.content)
    : null;

  const lastRunLabel = lastEngineRun
    ? `Last run: ${relativeTime(lastEngineRun.createdAt)}`
    : "Never run";

  // ── Status chip ─────────────────────────────────────────────────────────────
  const failCount = totalPieces > 0 ? totalPieces - generatedCount : 0;
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

  const showAlert = alertCount > 0;

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
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
              color: "#e4e4e7",
            }}
          >
            Today
          </h1>
        </div>
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
            marginTop: "4px",
            flexShrink: 0,
          }}
        >
          {systemStatus.label}
        </span>
      </div>

      {/* ── Alert banner ───────────────────────────────────────────────────── */}
      {showAlert && (
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
      )}

      {/* ── Engine control card ─────────────────────────────────────────────── */}
      <div
        style={{
          background: "#111111",
          border: "1px solid #1e1e1e",
          borderRadius: "12px",
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* Left: promotion info */}
          <div style={{ flex: 1, minWidth: "220px" }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "11px",
                color: "#52525b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 500,
              }}
            >
              Active Promotion
            </p>
            {activePromotion && typeBadge ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "6px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      color: typeBadge.color,
                      background: typeBadge.bg,
                    }}
                  >
                    {typeBadge.label.toUpperCase()}
                  </span>
                  <GeoScoreChip score={activePromotion.geoScore} />
                </div>
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  {activePromotion.name}
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#71717a",
                    lineHeight: "1.5",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {activePromotion.description}
                </p>
              </>
            ) : (
              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "15px",
                    color: "#52525b",
                    fontWeight: 500,
                  }}
                >
                  No active promotion
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#3f3f46" }}>
                  Add a promotion and run the engine to get started.
                </p>
              </div>
            )}
          </div>

          {/* Right: run button + last run */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <button
              onClick={onRunEngine}
              disabled={engineRunning}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "11px 20px",
                borderRadius: "8px",
                border: "none",
                background: engineRunning ? "rgba(99,102,241,0.4)" : "#6366f1",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: engineRunning ? "not-allowed" : "pointer",
                flexShrink: 0,
                transition: "background 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {engineRunning ? (
                <Loader2
                  size={14}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Zap size={14} />
              )}
              {engineRunning ? "Running…" : "Run Engine Now"}
            </button>
            <span style={{ fontSize: "11px", color: "#52525b" }}>
              {lastRunLabel}
            </span>
          </div>
        </div>

        {/* Stream feed inside engine card */}
        {streamEvents.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <StreamFeed events={streamEvents} />
          </div>
        )}
      </div>

      {/* ── Promotion pipeline strip ────────────────────────────────────────── */}
      <div
        style={{
          background: "#111111",
          border: "1px solid #1e1e1e",
          borderRadius: "10px",
          padding: "14px 16px",
        }}
      >
        <p
          style={{
            margin: "0 0 10px",
            fontSize: "11px",
            color: "#52525b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 500,
          }}
        >
          Promotion Pipeline
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: "6px",
          }}
        >
          <PipelineStage
            label="Promotion"
            value={
              activePromotion
                ? activePromotion.name.length > 18
                  ? activePromotion.name.slice(0, 18) + "…"
                  : activePromotion.name
                : "None"
            }
            color={activePromotion ? "#818cf8" : "#3f3f46"}
          />
          <PipelineArrow />
          <PipelineStage
            label="Generated"
            value={`${generatedCount}/6`}
            color={generatedCount > 0 ? "#60a5fa" : "#3f3f46"}
          />
          <PipelineArrow />
          <PipelineStage
            label="Media"
            value={String(mediaCount)}
            color={mediaCount > 0 ? "#c084fc" : "#3f3f46"}
          />
          <PipelineArrow />
          <PipelineStage
            label="Posted"
            value={`${postedCount}/6`}
            color={postedCount > 0 ? "#4ade80" : "#3f3f46"}
          />
        </div>
      </div>

      {/* ── Research pipeline strip ─────────────────────────────────────────── */}
      <div
        style={{
          background: "#111111",
          border: "1px solid #1e1e1e",
          borderRadius: "10px",
          padding: "14px 16px",
        }}
      >
        <p
          style={{
            margin: "0 0 10px",
            fontSize: "11px",
            color: "#52525b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 500,
          }}
        >
          Research Pipeline
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: "6px",
          }}
        >
          <PipelineStage
            label="Topics"
            value={contentPiecesToday > 0 ? String(contentPiecesToday) : "—"}
            color={contentPiecesToday > 0 ? "#60a5fa" : "#3f3f46"}
          />
          <PipelineArrow />
          <PipelineStage
            label="Blog"
            value={todayBlogPostStatus ?? "None"}
            color={todayBlogPostStatus ? "#818cf8" : "#3f3f46"}
            href="/content"
          />
          <PipelineArrow />
          <PipelineStage
            label="Email"
            value={emailDraftStatus ?? "None"}
            color={emailDraftStatus ? "#60a5fa" : "#3f3f46"}
            href="/content"
          />
          <PipelineArrow />
          <PipelineStage
            label="Opps"
            value={
              newOpportunitiesCount > 0 ? `${newOpportunitiesCount} new` : "0"
            }
            color={newOpportunitiesCount > 0 ? "#fbbf24" : "#3f3f46"}
            href="/content"
          />
        </div>
      </div>
    </>
  );
}
