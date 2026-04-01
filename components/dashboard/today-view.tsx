"use client";

import { useCallback, useState } from "react";
import {
  Activity,
  CheckCircle,
  CheckSquare,
  FileText,
  Lightbulb,
  Loader2,
  Mail,
  Zap,
} from "lucide-react";

import { useStream, type StreamEvent } from "@/hooks/use-stream";

import { ContentPreview } from "./content-preview";
import {
  PlatformStatusCard,
  PlatformStatusCardEmpty,
  type ContentPieceData,
} from "./platform-status-card";

const PLATFORMS = [
  "twitter",
  "linkedin",
  "video",
  "reddit",
  "instagram",
  "email",
] as const;

type PromotionType =
  | "product"
  | "service"
  | "affiliate"
  | "lead_magnet"
  | "content";

interface ActivePromotion {
  id: string;
  name: string;
  type: PromotionType;
  description: string;
  geoScore: number | null;
}

interface TodayStats {
  activePromotionsCount: number;
  contentPiecesToday: number;
  postsThisWeek: number;
}

interface PendingApproval {
  id: string;
  platform: string;
  content: string;
}

interface TodayBlogPost {
  id: string;
  title: string;
  status: string;
  ghostUrl: string | null;
}

interface TodayEmailDraft {
  id: string;
  subject: string;
  status: string;
}

interface TodayViewProps {
  todayDate: string;
  pieces: ContentPieceData[];
  promotion: ActivePromotion | null;
  stats: TodayStats;
  gateModeEnabled: boolean;
  pendingApprovals: PendingApproval[];
  todayBlogPost: TodayBlogPost | null;
  todayEmailDraft: TodayEmailDraft | null;
  newOpportunitiesCount: number;
  lastEngineRun: { status: string; createdAt: string } | null;
}

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

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

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

function StreamFeed({ events }: { events: string[] }) {
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
  const dotColor = color;
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
            background: dotColor,
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

export function TodayView({
  todayDate,
  pieces: initialPieces,
  promotion,
  stats,
  gateModeEnabled,
  pendingApprovals: initialPendingApprovals,
  todayBlogPost,
  todayEmailDraft: initialEmailDraft,
  newOpportunitiesCount,
  lastEngineRun,
}: TodayViewProps) {
  const [pieces, setPieces] = useState<ContentPieceData[]>(initialPieces);
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "done">(
    "idle",
  );
  const [streamEvents, setStreamEvents] = useState<string[]>([]);
  const [previewPiece, setPreviewPiece] = useState<
    (ContentPieceData & { promotionName: string }) | null
  >(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(
    initialPendingApprovals,
  );
  const [emailDraft, setEmailDraft] = useState<TodayEmailDraft | null>(
    initialEmailDraft,
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentMessage, setEmailSentMessage] = useState<string | null>(null);

  // SSE stream handler
  const handleEvent = useCallback((event: StreamEvent) => {
    const payload = event.payload as Record<string, unknown>;

    if (event.type === "content_piece_updated") {
      const id = payload?.id as string | undefined;
      const status = payload?.status as string | undefined;
      if (id && status) {
        setPieces((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status } : p)),
        );
        const platform = payload?.platform as string | undefined;
        setStreamEvents((prev) => [
          ...prev.slice(-49),
          `[${new Date().toLocaleTimeString()}] ${platform ?? "?"} → ${status}`,
        ]);
      }
    }

    if (event.type === "engine_started") {
      setRunStatus("running");
      setStreamEvents((prev) => [
        ...prev.slice(-49),
        `[${new Date().toLocaleTimeString()}] Engine started`,
      ]);
    }

    if (event.type === "engine_completed" || event.type === "engine_failed") {
      setRunStatus("done");
      const msg =
        event.type === "engine_completed"
          ? "Engine completed"
          : "Engine failed";
      setStreamEvents((prev) => [
        ...prev.slice(-49),
        `[${new Date().toLocaleTimeString()}] ${msg}`,
      ]);
    }

    if (event.type === "log") {
      const message = payload?.message as string | undefined;
      if (message) {
        setStreamEvents((prev) => [
          ...prev.slice(-49),
          `[${new Date().toLocaleTimeString()}] ${message}`,
        ]);
      }
    }
  }, []);

  useStream(handleEvent);

  async function handleRunEngine() {
    if (runStatus === "running") return;
    setRunStatus("running");
    setStreamEvents((prev) => [
      ...prev.slice(-49),
      `[${new Date().toLocaleTimeString()}] Triggering engine run…`,
    ]);
    try {
      await fetch("/api/engine/run", { method: "POST" });
    } catch {
      setRunStatus("idle");
    }
  }

  async function handleApprove(id: string) {
    try {
      await fetch(`/api/queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      setPieces((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: "approved", approved: true } : p,
        ),
      );
    } catch {
      // silently fail
    }
  }

  async function handleReject(id: string) {
    try {
      await fetch(`/api/queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      setPieces((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "rejected" } : p)),
      );
    } catch {
      // silently fail
    }
  }

  async function handleSendEmail(id: string) {
    setSendingEmail(true);
    setEmailSentMessage(null);
    try {
      const res = await fetch(`/api/email-drafts/${id}/send`, {
        method: "POST",
      });
      if (res.ok) {
        setEmailDraft((prev) => (prev ? { ...prev, status: "sent" } : prev));
        setEmailSentMessage("Email sent successfully!");
      } else {
        const data = await res.json().catch(() => ({}));
        setEmailSentMessage(
          (data as { error?: string }).error ?? "Failed to send email.",
        );
      }
    } catch {
      setEmailSentMessage("Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleApprovalAction(
    id: string,
    action: "approve" | "reject",
  ) {
    try {
      await fetch(`/api/queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setPendingApprovals((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // silently fail
    }
  }

  // Build per-platform map for easy lookup
  const pieceByPlatform = new Map<string, ContentPieceData>();
  for (const p of pieces) {
    if (!pieceByPlatform.has(p.platform)) {
      pieceByPlatform.set(p.platform, p);
    }
  }

  const typeBadge = promotion
    ? (TYPE_BADGE[promotion.type] ?? TYPE_BADGE.content)
    : null;

  // ── Status chip logic ────────────────────────────────────────────────────────
  const failCount = pieces.filter((p) => p.status === "failed").length;
  const postedCount = pieces.filter((p) => p.status === "posted").length;
  const total = pieces.length;

  const systemStatus: { label: string; color: string; bg: string } =
    total === 0
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
        : postedCount === total
          ? {
              label: `All ${total} posted`,
              color: "#4ade80",
              bg: "rgba(74,222,128,0.12)",
            }
          : {
              label: `${postedCount}/${total} posted today`,
              color: "#60a5fa",
              bg: "rgba(96,165,250,0.12)",
            };

  // ── Alert banner logic ───────────────────────────────────────────────────────
  const alertCount = pendingApprovals.length + failCount;
  const showAlert = alertCount > 0;

  // ── Pipeline counts ──────────────────────────────────────────────────────────
  const generatedCount = pieces.filter((p) => p.status !== "queued").length;
  const mediaCount = pieces.filter((p) => p.mediaPath != null).length;

  // ── Last run display ─────────────────────────────────────────────────────────
  const lastRunLabel = lastEngineRun
    ? `Last run: ${relativeTime(lastEngineRun.createdAt)}`
    : "Never run";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
            {promotion && typeBadge ? (
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
                  <GeoScoreChip score={promotion.geoScore} />
                </div>
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  {promotion.name}
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
                  {promotion.description}
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
              onClick={handleRunEngine}
              disabled={runStatus === "running"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "11px 20px",
                borderRadius: "8px",
                border: "none",
                background:
                  runStatus === "running" ? "rgba(99,102,241,0.4)" : "#6366f1",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: runStatus === "running" ? "not-allowed" : "pointer",
                flexShrink: 0,
                transition: "background 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {runStatus === "running" ? (
                <Loader2
                  size={14}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Zap size={14} />
              )}
              {runStatus === "running" ? "Running…" : "Run Engine Now"}
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
              promotion
                ? promotion.name.length > 18
                  ? promotion.name.slice(0, 18) + "…"
                  : promotion.name
                : "None"
            }
            color={promotion ? "#818cf8" : "#3f3f46"}
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
            value={
              stats.contentPiecesToday > 0
                ? String(stats.contentPiecesToday)
                : "—"
            }
            color={stats.contentPiecesToday > 0 ? "#60a5fa" : "#3f3f46"}
          />
          <PipelineArrow />
          <PipelineStage
            label="Blog"
            value={todayBlogPost?.status ?? "None"}
            color={todayBlogPost ? "#818cf8" : "#3f3f46"}
            href="/content"
          />
          <PipelineArrow />
          <PipelineStage
            label="Email"
            value={emailDraft?.status ?? "None"}
            color={emailDraft ? "#60a5fa" : "#3f3f46"}
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

      {/* ── Platform cards grid ─────────────────────────────────────────────── */}
      <div>
        <h3
          style={{
            margin: "0 0 12px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#71717a",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Platform Status
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          {PLATFORMS.map((platform) => {
            const piece = pieceByPlatform.get(platform);
            return piece ? (
              <PlatformStatusCard
                key={platform}
                piece={piece}
                gateModeEnabled={gateModeEnabled}
                onPreview={(p) =>
                  setPreviewPiece({
                    ...p,
                    promotionName: promotion?.name ?? "",
                  })
                }
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ) : (
              <PlatformStatusCardEmpty key={platform} platform={platform} />
            );
          })}
        </div>
      </div>

      {/* ── Action cards ────────────────────────────────────────────────────── */}
      <div>
        <h3
          style={{
            margin: "0 0 12px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#71717a",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Actions
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          {/* Card 1 — Approvals */}
          <div
            style={{
              background: "#111111",
              border: "1px solid #1e1e1e",
              borderTop:
                pendingApprovals.length > 0
                  ? "2px solid #f59e0b"
                  : "2px solid #1e1e1e",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <CheckSquare
                size={16}
                style={{ color: "#f59e0b", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#a1a1aa",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Approvals
              </span>
            </div>
            {pendingApprovals.length > 0 ? (
              <>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "14px",
                    color: "#e4e4e7",
                    fontWeight: 600,
                  }}
                >
                  {pendingApprovals.length} item
                  {pendingApprovals.length !== 1 ? "s" : ""} need approval
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    marginBottom: "10px",
                  }}
                >
                  {pendingApprovals.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#71717a",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {item.platform}: {item.content.slice(0, 40)}
                        {item.content.length > 40 ? "…" : ""}
                      </span>
                      <button
                        onClick={() => handleApprovalAction(item.id, "approve")}
                        style={{
                          fontSize: "11px",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          border: "none",
                          background: "rgba(245,158,11,0.15)",
                          color: "#f59e0b",
                          cursor: "pointer",
                          flexShrink: 0,
                          fontWeight: 600,
                        }}
                      >
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
                <a
                  href="/promote"
                  style={{
                    fontSize: "12px",
                    color: "#6366f1",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Review in Promote →
                </a>
              </>
            ) : (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <CheckCircle
                  size={16}
                  style={{ color: "#4ade80", flexShrink: 0 }}
                />
                <span style={{ fontSize: "14px", color: "#71717a" }}>
                  All content approved
                </span>
              </div>
            )}
          </div>

          {/* Card 2 — Blog Post */}
          <div
            style={{
              background: "#111111",
              border: "1px solid #1e1e1e",
              borderTop: todayBlogPost
                ? "2px solid #818cf8"
                : "2px solid #1e1e1e",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <FileText size={16} style={{ color: "#818cf8", flexShrink: 0 }} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#a1a1aa",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Blog Post
              </span>
            </div>
            {todayBlogPost ? (
              <>
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: "14px",
                    color: "#e4e4e7",
                    fontWeight: 600,
                    lineHeight: "1.4",
                  }}
                >
                  {todayBlogPost.title.length > 60
                    ? todayBlogPost.title.slice(0, 60) + "…"
                    : todayBlogPost.title}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    marginBottom: "10px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color:
                      todayBlogPost.status === "published"
                        ? "#4ade80"
                        : "#fbbf24",
                    background:
                      todayBlogPost.status === "published"
                        ? "rgba(74,222,128,0.12)"
                        : "rgba(251,191,36,0.12)",
                  }}
                >
                  {todayBlogPost.status}
                </span>
                <br />
                <a
                  href="/content"
                  style={{
                    fontSize: "12px",
                    color: "#6366f1",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  View in Content →
                </a>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>
                No blog post today
              </p>
            )}
          </div>

          {/* Card 3 — Email Draft */}
          <div
            style={{
              background: "#111111",
              border: "1px solid #1e1e1e",
              borderTop:
                emailDraft && emailDraft.status !== "sent"
                  ? "2px solid #60a5fa"
                  : "2px solid #1e1e1e",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <Mail size={16} style={{ color: "#818cf8", flexShrink: 0 }} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#a1a1aa",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Email Draft
              </span>
            </div>
            {emailDraft ? (
              emailDraft.status === "sent" ? (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <CheckCircle
                    size={16}
                    style={{ color: "#4ade80", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: "14px", color: "#71717a" }}>
                    Email already sent
                  </span>
                </div>
              ) : (
                <>
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: "14px",
                      color: "#e4e4e7",
                      fontWeight: 600,
                      lineHeight: "1.4",
                    }}
                  >
                    {emailDraft.subject}
                  </p>
                  {emailSentMessage && (
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontSize: "12px",
                        color: emailSentMessage.includes("success")
                          ? "#4ade80"
                          : "#f87171",
                      }}
                    >
                      {emailSentMessage}
                    </p>
                  )}
                  <button
                    onClick={() => handleSendEmail(emailDraft.id)}
                    disabled={sendingEmail}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      border: "none",
                      background: sendingEmail
                        ? "rgba(99,102,241,0.4)"
                        : "#6366f1",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: sendingEmail ? "not-allowed" : "pointer",
                    }}
                  >
                    {sendingEmail ? (
                      <Loader2
                        size={12}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      <Mail size={12} />
                    )}
                    {sendingEmail ? "Sending…" : "Send Now"}
                  </button>
                </>
              )
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>
                No unsent email draft today
              </p>
            )}
          </div>

          {/* Card 4 — Opportunities */}
          <div
            style={{
              background: "#111111",
              border: "1px solid #1e1e1e",
              borderTop:
                newOpportunitiesCount > 0
                  ? "2px solid #fbbf24"
                  : "2px solid #1e1e1e",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <Lightbulb
                size={16}
                style={{ color: "#fbbf24", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#a1a1aa",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Opportunities
              </span>
            </div>
            {newOpportunitiesCount > 0 ? (
              <>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "14px",
                    color: "#e4e4e7",
                    fontWeight: 600,
                  }}
                >
                  {newOpportunitiesCount} new opportunit
                  {newOpportunitiesCount !== 1 ? "ies" : "y"}
                </p>
                <a
                  href="/content"
                  style={{
                    fontSize: "12px",
                    color: "#6366f1",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Review →
                </a>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>
                No new opportunities
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content Preview Modal */}
      <ContentPreview
        piece={previewPiece}
        open={previewPiece !== null}
        onClose={() => setPreviewPiece(null)}
        onApprove={
          previewPiece ? () => handleApprove(previewPiece.id) : undefined
        }
        onReject={
          previewPiece ? () => handleReject(previewPiece.id) : undefined
        }
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
