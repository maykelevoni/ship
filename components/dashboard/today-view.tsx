"use client";

import { useCallback, useState } from "react";

import { useStream, type StreamEvent } from "@/hooks/use-stream";

import { ContentPreview } from "./content-preview";
import { type ContentPieceData } from "./platform-status-card";
import { TodayActions } from "./today-actions";
import { TodayHeader, AlertBanner, StreamFeed } from "./today-header";
import { ContentList } from "./today-pipeline";

// Shared types (exported for sub-components)

export type PromotionType =
  | "product"
  | "service"
  | "affiliate"
  | "lead_magnet"
  | "content";

export interface ActivePromotion {
  id: string;
  name: string;
  type: PromotionType;
  description: string;
}

export interface TodayStats {
  activePromotionsCount: number;
  contentPiecesToday: number;
  postsThisWeek: number;
}

export interface PendingApproval {
  id: string;
  platform: string;
  content: string;
}

export interface TodayBlogPost {
  id: string;
  title: string;
  status: string;
  ghostUrl: string | null;
}

export interface TodayEmailDraft {
  id: string;
  subject: string;
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

  async function handleSendEmail(
    id: string,
  ): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch(`/api/email-drafts/${id}/send`, {
        method: "POST",
      });
      if (res.ok) {
        return { ok: true, message: "Email sent successfully!" };
      }
      const data = await res.json().catch(() => ({}));
      return {
        ok: false,
        message: (data as { error?: string }).error ?? "Failed to send email.",
      };
    } catch {
      return { ok: false, message: "Failed to send email." };
    }
  }

  const failCount = pieces.filter((p) => p.status === "failed").length;
  const postedCount = pieces.filter((p) => p.status === "posted").length;
  const alertCount = pendingApprovals.length + failCount;

  // Type badge colors for ActivePromotionCard
  const TYPE_BADGE: Record<
    PromotionType,
    { label: string; color: string; bg: string }
  > = {
    product: {
      label: "Product",
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.12)",
    },
    service: {
      label: "Service",
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.12)",
    },
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
    content: {
      label: "Content",
      color: "#a1a1aa",
      bg: "rgba(161,161,170,0.12)",
    },
  };

  // MetricCard component
  function MetricCard({
    label,
    value,
  }: {
    label: string;
    value: number;
  }) {
    return (
      <div
        style={{
          background: "#111111",
          border: "1px solid #1e1e1e",
          borderRadius: "10px",
          padding: "16px 20px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "11px",
            color: "#52525b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 500,
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: "28px",
            fontWeight: 700,
            color: "#e4e4e7",
          }}
        >
          {value}
        </p>
      </div>
    );
  }

  // ActivePromotionCard component
  function ActivePromotionCard({
    promotion,
  }: {
    promotion: ActivePromotion;
  }) {
    const typeBadge =
      TYPE_BADGE[promotion.type as PromotionType] ?? TYPE_BADGE.content;

    return (
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
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "200px" }}>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "11px",
                color: "#52525b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 500,
              }}
            >
              ACTIVE PROMOTION
            </p>
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
                  padding: "3px 10px",
                  borderRadius: "5px",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: typeBadge.color,
                  background: typeBadge.bg,
                }}
              >
                {typeBadge.label.toUpperCase()}
              </span>
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
              }}
            >
              {promotion.description}
            </p>
          </div>
          <a
            href="/products"
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#a1a1aa",
              background: "#1e1e1e",
              textDecoration: "none",
              transition: "background 0.15s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#27272a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1e1e1e";
            }}
          >
            Change promotion →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Slim header */}
      <TodayHeader
        todayDate={todayDate}
        lastEngineRun={lastEngineRun}
        onRunEngine={handleRunEngine}
        engineRunning={runStatus === "running"}
        postedCount={postedCount}
        totalPieces={pieces.length}
        failCount={failCount}
      />

      {/* 2. Alert banner */}
      {alertCount > 0 && <AlertBanner alertCount={alertCount} />}

      {/* 3. Metric cards row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        <MetricCard label="Content Today" value={stats.contentPiecesToday} />
        <MetricCard label="Posted This Week" value={stats.postsThisWeek} />
        <MetricCard
          label="Active Promotions"
          value={stats.activePromotionsCount}
        />
      </div>

      {/* 4. Active Promotion card */}
      {promotion && <ActivePromotionCard promotion={promotion} />}

      {/* 5. Today's Content compact list */}
      <ContentList
        pieces={pieces}
        gateModeEnabled={gateModeEnabled}
        onPreview={setPreviewPiece}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* 6. Stream feed (when events exist) */}
      {streamEvents.length > 0 && <StreamFeed events={streamEvents} />}

      {/* 7. Today Actions */}
      <TodayActions
        pendingApprovals={pendingApprovals}
        todayBlogPost={todayBlogPost}
        emailDraft={initialEmailDraft}
        newOpportunitiesCount={newOpportunitiesCount}
        onApprovalAction={handleApprovalAction}
        onSendEmail={handleSendEmail}
      />

      {/* 8. Content Preview Modal */}
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
