"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileStack } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostListItem {
  id: string;
  platform: string;
  promotionId: string | null;
  promotionName: string | null;
  date: string;
  status: string;
  contentPreview: string;
  mediaPath: string | null;
  createdAt: string;
  scheduledAt: string | null;
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type TabValue = "all" | "draft" | "approved" | "posted" | "failed";

const TABS: { label: string; value: TabValue }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Approved", value: "approved" },
  { label: "Posted", value: "posted" },
  { label: "Failed", value: "failed" },
];

// Maps UI tab value → API status param
function tabToStatus(tab: TabValue): string | null {
  if (tab === "all") return null;
  if (tab === "draft") return "generated";
  return tab; // approved, posted, failed are the same
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function getPlatformBadgeStyle(platform: string): React.CSSProperties {
  switch (platform) {
    case "twitter":
      return { background: "rgba(29,155,240,0.15)", color: "#1d9bf0" };
    case "linkedin":
      return { background: "rgba(0,119,181,0.15)", color: "#0a66c2" };
    case "instagram":
      return { background: "rgba(225,48,108,0.15)", color: "#e1306c" };
    case "reddit":
      return { background: "rgba(255,69,0,0.15)", color: "#ff4500" };
    case "email":
      return { background: "rgba(74,222,128,0.15)", color: "#4ade80" };
    case "video":
      return { background: "rgba(168,85,247,0.15)", color: "#a855f7" };
    default:
      return { background: "rgba(82,82,91,0.15)", color: "#71717a" };
  }
}

function getStatusBadgeStyle(status: string): { style: React.CSSProperties; label: string } {
  switch (status) {
    case "generated":
      return {
        style: { background: "rgba(251,191,36,0.15)", color: "#fbbf24" },
        label: "Draft",
      };
    case "approved":
      return {
        style: { background: "rgba(99,102,241,0.15)", color: "#818cf8" },
        label: "Approved",
      };
    case "posted":
      return {
        style: { background: "rgba(74,222,128,0.15)", color: "#4ade80" },
        label: "Posted",
      };
    case "failed":
      return {
        style: { background: "rgba(248,113,113,0.15)", color: "#f87171" },
        label: "Failed",
      };
    case "rejected":
      return {
        style: { background: "rgba(82,82,91,0.15)", color: "#71717a" },
        label: "Rejected",
      };
    default:
      return {
        style: { background: "rgba(82,82,91,0.15)", color: "#71717a" },
        label: status,
      };
  }
}

function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    twitter: "Twitter",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    reddit: "Reddit",
    email: "Email",
    video: "Video",
  };
  return labels[platform] ?? platform.charAt(0).toUpperCase() + platform.slice(1);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div
      style={{
        height: "48px",
        background: "#1a1a1a",
        borderRadius: "6px",
        marginBottom: "4px",
      }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PostsPage() {
  const [pieces, setPieces] = useState<PostListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  const LIMIT = 50;

  async function fetchPosts(pageNum: number, replace: boolean, tab: TabValue) {
    try {
      const statusParam = tabToStatus(tab);
      const statusQuery = statusParam ? `&status=${statusParam}` : "";
      const res = await fetch(`/api/posts?page=${pageNum}&limit=${LIMIT}${statusQuery}`);
      if (res.ok) {
        const json: { data: PostListItem[]; total: number } = await res.json();
        setTotal(json.total);
        setPieces((prev) => (replace ? json.data : [...prev, ...json.data]));
        setPage(pageNum);
      }
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    setLoading(true);
    setPieces([]);
    fetchPosts(1, true, activeTab).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Tab counts: derived client-side from loaded pieces
  function getTabCount(tab: TabValue): number {
    if (tab === "all") return pieces.length;
    const status = tabToStatus(tab);
    return pieces.filter((p) => p.status === status).length;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 600,
  };

  const colStyles = {
    platform: { width: "110px", flexShrink: 0 } as React.CSSProperties,
    promotion: { flex: 1, minWidth: 0 } as React.CSSProperties,
    date: { width: "72px", flexShrink: 0, color: "#52525b", fontSize: "12px" } as React.CSSProperties,
    status: { width: "100px", flexShrink: 0 } as React.CSSProperties,
    preview: { flex: 2, minWidth: 0, color: "#a1a1aa", fontSize: "12px" } as React.CSSProperties,
    actions: { width: "64px", flexShrink: 0, textAlign: "right" as const } as React.CSSProperties,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FileStack size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            Posts
          </h1>
        </div>
        {!loading && total > 0 && (
          <span style={{ fontSize: "13px", color: "#52525b" }}>
            {pieces.length < total ? `${pieces.length} of ${total}` : `${total}`}
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "#0a0a0a",
          border: "1px solid #1a1a1a",
          borderRadius: "8px",
          padding: "4px",
          width: "fit-content",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          const count = getTabCount(tab.value);
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                background: isActive ? "#1a1a1a" : "transparent",
                color: isActive ? "#e4e4e7" : "#71717a",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
              {count > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "18px",
                    height: "18px",
                    padding: "0 4px",
                    borderRadius: "9px",
                    background: isActive ? "#2d2d2d" : "#1a1a1a",
                    color: isActive ? "#a1a1aa" : "#52525b",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid #1a1a1a",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 16px",
            borderBottom: "1px solid #1a1a1a",
          }}
        >
          <span style={{ ...colStyles.platform, fontSize: "11px", fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Platform</span>
          <span style={{ ...colStyles.promotion, fontSize: "11px", fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Promotion</span>
          <span style={{ ...colStyles.date, fontSize: "11px", fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</span>
          <span style={{ ...colStyles.status, fontSize: "11px", fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</span>
          <span style={{ ...colStyles.preview, fontSize: "11px", fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Preview</span>
          <span style={{ ...colStyles.actions, fontSize: "11px", fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Edit</span>
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: "8px 16px" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : pieces.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>
              No content pieces yet.
            </p>
          </div>
        ) : (
          pieces.map((piece, idx) => {
            const platformBadge = getPlatformBadgeStyle(piece.platform);
            const { style: statusStyle, label: statusLabel } = getStatusBadgeStyle(piece.status);
            return (
              <Link
                key={piece.id}
                href={`/posts/${piece.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  background: idx % 2 === 0 ? "#0a0a0a" : "#0f0f0f",
                  borderBottom: idx < pieces.length - 1 ? "1px solid #1a1a1a" : "none",
                  textDecoration: "none",
                  color: "inherit",
                  cursor: "pointer",
                  transition: "background 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#141414";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    idx % 2 === 0 ? "#0a0a0a" : "#0f0f0f";
                }}
              >
                {/* Platform */}
                <div style={colStyles.platform}>
                  <span style={{ ...pillStyle, ...platformBadge }}>
                    {platformLabel(piece.platform)}
                  </span>
                </div>

                {/* Promotion */}
                <div
                  style={{
                    ...colStyles.promotion,
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#e4e4e7",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {piece.promotionName ?? "—"}
                </div>

                {/* Date */}
                <div style={colStyles.date}>
                  {formatDate(piece.date)}
                </div>

                {/* Status */}
                <div style={colStyles.status}>
                  <span style={{ ...pillStyle, ...statusStyle }}>
                    {statusLabel}
                  </span>
                </div>

                {/* Preview */}
                <div
                  style={{
                    ...colStyles.preview,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {piece.contentPreview}
                </div>

                {/* Edit link */}
                <div style={colStyles.actions}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6366f1",
                    }}
                  >
                    Edit →
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Load more */}
      {!loading && pieces.length < total && (
        <div style={{ textAlign: "center" }}>
          <button
            onClick={async () => {
              setLoadingMore(true);
              await fetchPosts(page + 1, false, activeTab);
              setLoadingMore(false);
            }}
            disabled={loadingMore}
            style={{
              padding: "9px 24px",
              borderRadius: "8px",
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#a1a1aa",
              fontSize: "13px",
              fontWeight: 600,
              cursor: loadingMore ? "not-allowed" : "pointer",
              opacity: loadingMore ? 0.6 : 1,
            }}
          >
            {loadingMore
              ? "Loading…"
              : `Load more (${total - pieces.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
