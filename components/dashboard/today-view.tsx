"use client";

import { useState, useCallback } from "react";
import { Zap, Loader2, Activity, CheckSquare, FileText, Mail, Lightbulb, CheckCircle } from "lucide-react";
import { useStream, type StreamEvent } from "@/hooks/use-stream";
import {
  PlatformStatusCard,
  PlatformStatusCardEmpty,
  type ContentPieceData,
} from "./platform-status-card";
import { ContentPreview } from "./content-preview";

const PLATFORMS = ["twitter", "linkedin", "video", "reddit", "instagram", "email"] as const;

type PromotionType = "product" | "service" | "affiliate" | "lead_magnet" | "content";

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

function GeoScoreChip({ score }: { score: number | null }) {
  if (score === null) return null;

  const color =
    score >= 70 ? "#4ade80" : score >= 40 ? "#fbbf24" : "#f87171";
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
}: TodayViewProps) {
  const [pieces, setPieces] = useState<ContentPieceData[]>(initialPieces);
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "done">(
    "idle",
  );
  const [streamEvents, setStreamEvents] = useState<string[]>([]);
  const [previewPiece, setPreviewPiece] = useState<
    (ContentPieceData & { promotionName: string }) | null
  >(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(initialPendingApprovals);
  const [emailDraft, setEmailDraft] = useState<TodayEmailDraft | null>(initialEmailDraft);
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
        event.type === "engine_completed" ? "Engine completed" : "Engine failed";
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
      const res = await fetch(`/api/email-drafts/${id}/send`, { method: "POST" });
      if (res.ok) {
        setEmailDraft((prev) => prev ? { ...prev, status: "sent" } : prev);
        setEmailSentMessage("Email sent successfully!");
      } else {
        const data = await res.json().catch(() => ({}));
        setEmailSentMessage((data as { error?: string }).error ?? "Failed to send email.");
      }
    } catch {
      setEmailSentMessage("Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleApprovalAction(id: string, action: "approve" | "reject") {
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
    ? TYPE_BADGE[promotion.type] ?? TYPE_BADGE.content
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
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

      {/* Stats row */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {[
          { label: "Active Promotions", value: stats.activePromotionsCount },
          { label: "Content Today", value: stats.contentPiecesToday },
          { label: "Posts This Week", value: stats.postsThisWeek },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: "#111111",
              border: "1px solid #1e1e1e",
              borderRadius: "8px",
              padding: "14px 20px",
              minWidth: "140px",
              flex: "1",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                color: "#52525b",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {label}
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "26px",
                fontWeight: 700,
                color: "#e4e4e7",
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Active promotion card */}
      <div
        style={{
          background: "#111111",
          border: "1px solid #1e1e1e",
          borderRadius: "12px",
          padding: "20px 24px",
        }}
      >
        {promotion && typeBadge ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
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
              </div>
              <button
                onClick={handleRunEngine}
                disabled={runStatus === "running"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    runStatus === "running"
                      ? "rgba(99,102,241,0.4)"
                      : "#6366f1",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor:
                    runStatus === "running" ? "not-allowed" : "pointer",
                  flexShrink: 0,
                  transition: "background 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {runStatus === "running" ? (
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Zap size={14} />
                )}
                {runStatus === "running" ? "Running…" : "Run Engine Now"}
              </button>
            </div>

            {/* Stream feed */}
            {streamEvents.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <StreamFeed events={streamEvents} />
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <Zap size={28} style={{ color: "#3f3f46", marginBottom: "8px" }} />
            <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>
              No active promotion for today.
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#3f3f46" }}>
              Add a promotion and run the engine to get started.
            </p>
            <button
              onClick={handleRunEngine}
              disabled={runStatus === "running"}
              style={{
                marginTop: "16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                background:
                  runStatus === "running" ? "rgba(99,102,241,0.4)" : "#6366f1",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: runStatus === "running" ? "not-allowed" : "pointer",
              }}
            >
              {runStatus === "running" ? (
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Zap size={14} />
              )}
              {runStatus === "running" ? "Running…" : "Run Engine Now"}
            </button>
          </div>
        )}
      </div>

      {/* Platform cards grid */}
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

      {/* Action cards grid */}
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
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <CheckSquare size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Approvals
              </span>
            </div>
            {pendingApprovals.length > 0 ? (
              <>
                <p style={{ margin: "0 0 10px", fontSize: "14px", color: "#e4e4e7", fontWeight: 600 }}>
                  {pendingApprovals.length} item{pendingApprovals.length !== 1 ? "s" : ""} need approval
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                  {pendingApprovals.slice(0, 3).map((item) => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {item.platform}: {item.content.slice(0, 40)}{item.content.length > 40 ? "…" : ""}
                      </span>
                      <button
                        onClick={() => handleApprovalAction(item.id, "approve")}
                        style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", border: "none", background: "rgba(245,158,11,0.15)", color: "#f59e0b", cursor: "pointer", flexShrink: 0, fontWeight: 600 }}
                      >
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
                <a
                  href="/promote"
                  style={{ fontSize: "12px", color: "#6366f1", textDecoration: "none", fontWeight: 600 }}
                >
                  Review in Promote →
                </a>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle size={16} style={{ color: "#4ade80", flexShrink: 0 }} />
                <span style={{ fontSize: "14px", color: "#71717a" }}>All content approved</span>
              </div>
            )}
          </div>

          {/* Card 2 — Blog Post */}
          <div
            style={{
              background: "#111111",
              border: "1px solid #1e1e1e",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <FileText size={16} style={{ color: "#818cf8", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Blog Post
              </span>
            </div>
            {todayBlogPost ? (
              <>
                <p style={{ margin: "0 0 6px", fontSize: "14px", color: "#e4e4e7", fontWeight: 600, lineHeight: "1.4" }}>
                  {todayBlogPost.title.length > 60 ? todayBlogPost.title.slice(0, 60) + "…" : todayBlogPost.title}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    marginBottom: "10px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: todayBlogPost.status === "published" ? "#4ade80" : "#fbbf24",
                    background: todayBlogPost.status === "published" ? "rgba(74,222,128,0.12)" : "rgba(251,191,36,0.12)",
                  }}
                >
                  {todayBlogPost.status}
                </span>
                <br />
                <a
                  href="/content"
                  style={{ fontSize: "12px", color: "#6366f1", textDecoration: "none", fontWeight: 600 }}
                >
                  View in Content →
                </a>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>No blog post today</p>
            )}
          </div>

          {/* Card 3 — Email Draft */}
          <div
            style={{
              background: "#111111",
              border: "1px solid #1e1e1e",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Mail size={16} style={{ color: "#818cf8", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Email Draft
              </span>
            </div>
            {emailDraft ? (
              emailDraft.status === "sent" ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle size={16} style={{ color: "#4ade80", flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", color: "#71717a" }}>Email already sent</span>
                </div>
              ) : (
                <>
                  <p style={{ margin: "0 0 10px", fontSize: "14px", color: "#e4e4e7", fontWeight: 600, lineHeight: "1.4" }}>
                    {emailDraft.subject}
                  </p>
                  {emailSentMessage && (
                    <p style={{ margin: "0 0 8px", fontSize: "12px", color: emailSentMessage.includes("success") ? "#4ade80" : "#f87171" }}>
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
                      background: sendingEmail ? "rgba(99,102,241,0.4)" : "#6366f1",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: sendingEmail ? "not-allowed" : "pointer",
                    }}
                  >
                    {sendingEmail ? (
                      <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Mail size={12} />
                    )}
                    {sendingEmail ? "Sending…" : "Send Now"}
                  </button>
                </>
              )
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>No unsent email draft today</p>
            )}
          </div>

          {/* Card 4 — Opportunities */}
          <div
            style={{
              background: "#111111",
              border: "1px solid #1e1e1e",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Lightbulb size={16} style={{ color: "#fbbf24", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Opportunities
              </span>
            </div>
            {newOpportunitiesCount > 0 ? (
              <>
                <p style={{ margin: "0 0 10px", fontSize: "14px", color: "#e4e4e7", fontWeight: 600 }}>
                  {newOpportunitiesCount} new opportunit{newOpportunitiesCount !== 1 ? "ies" : "y"}
                </p>
                <a
                  href="/content"
                  style={{ fontSize: "12px", color: "#6366f1", textDecoration: "none", fontWeight: 600 }}
                >
                  Review →
                </a>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>No new opportunities</p>
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
      `}</style>
    </div>
  );
}
