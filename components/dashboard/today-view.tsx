"use client";

import { useCallback, useState } from "react";

import { useStream, type StreamEvent } from "@/hooks/use-stream";

import { ContentPreview } from "./content-preview";
import { type ContentPieceData } from "./platform-status-card";
import { TodayActions } from "./today-actions";
import { TodayHeader } from "./today-header";
import { TodayPipeline } from "./today-pipeline";

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
  const generatedCount = pieces.filter((p) => p.status !== "queued").length;
  const mediaCount = pieces.filter((p) => p.mediaPath != null).length;
  const alertCount = pendingApprovals.length + failCount;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <TodayHeader
        todayDate={todayDate}
        activePromotion={promotion}
        stats={stats}
        lastEngineRun={lastEngineRun}
        onRunEngine={handleRunEngine}
        engineRunning={runStatus === "running"}
        streamEvents={streamEvents}
        generatedCount={generatedCount}
        mediaCount={mediaCount}
        postedCount={postedCount}
        totalPieces={pieces.length}
        todayBlogPostStatus={todayBlogPost?.status ?? null}
        emailDraftStatus={initialEmailDraft?.status ?? null}
        newOpportunitiesCount={newOpportunitiesCount}
        contentPiecesToday={stats.contentPiecesToday}
        alertCount={alertCount}
      />

      <TodayPipeline
        pieces={pieces}
        blogPost={todayBlogPost}
        promotion={promotion}
        gateModeEnabled={gateModeEnabled}
        onPreview={setPreviewPiece}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <TodayActions
        pendingApprovals={pendingApprovals}
        todayBlogPost={todayBlogPost}
        emailDraft={initialEmailDraft}
        newOpportunitiesCount={newOpportunitiesCount}
        onApprovalAction={handleApprovalAction}
        onSendEmail={handleSendEmail}
      />

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
