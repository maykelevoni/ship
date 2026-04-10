"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileStack } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string;
  title: string;
  date: string;
  status: string;
  ghostId: string | null;
  ghostUrl: string | null;
  createdAt: string;
}

interface SocialPost {
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
  error?: string | null;
}

interface EmailDraft {
  id: string;
  subject: string;
  createdAt: string;
  blogPost: { title: string; ghostUrl: string | null } | null;
}

// ─── Tab config ────────────────────────────────────────────────────────────────

type TabKey = "blog" | "twitter" | "linkedin" | "video" | "instagram" | "reddit" | "email";

const TABS: { key: TabKey; label: string }[] = [
  { key: "blog", label: "Blog" },
  { key: "twitter", label: "X" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "video", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "reddit", label: "Reddit" },
  { key: "email", label: "Email" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "…" : str;
}

// ─── Style constants ───────────────────────────────────────────────────────────

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 8px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: 600,
};

const headerColStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#52525b",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

// ─── Status badge helpers ──────────────────────────────────────────────────────

function getBlogStatusBadge(status: string): { style: React.CSSProperties; label: string } {
  if (status === "published") {
    return {
      style: { background: "rgba(34,197,94,0.15)", color: "#22c55e" },
      label: "Published",
    };
  }
  return {
    style: { background: "rgba(251,191,36,0.15)", color: "#fbbf24" },
    label: "Draft",
  };
}

function getSocialStatusBadge(
  status: string,
  scheduledAt: string | null,
  error?: string | null
): { style: React.CSSProperties; label: string; title?: string } {
  switch (status) {
    case "generated":
      return { style: { background: "rgba(251,191,36,0.15)", color: "#fbbf24" }, label: "Draft" };
    case "approved":
      if (scheduledAt) {
        return {
          style: { background: "rgba(59,130,246,0.15)", color: "#60a5fa" },
          label: `Scheduled ${formatDate(scheduledAt)}`,
        };
      }
      return {
        style: { background: "rgba(99,102,241,0.15)", color: "#818cf8" },
        label: "Approved",
      };
    case "posted":
      return {
        style: { background: "rgba(34,197,94,0.15)", color: "#22c55e" },
        label: scheduledAt ? `Posted ${formatDate(scheduledAt)}` : "Posted",
      };
    case "failed":
      return {
        style: { background: "rgba(248,113,113,0.15)", color: "#f87171" },
        label: "Failed",
        title: error ?? undefined,
      };
    case "posting":
      return { style: { background: "rgba(82,82,91,0.15)", color: "#71717a" }, label: "Posting…" };
    case "rejected":
      return { style: { background: "rgba(82,82,91,0.15)", color: "#71717a" }, label: "Rejected" };
    default:
      return { style: { background: "rgba(82,82,91,0.15)", color: "#71717a" }, label: status };
  }
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div style={{ padding: "8px 16px" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            height: "52px",
            background: "#1a1a1a",
            borderRadius: "6px",
            marginBottom: "4px",
          }}
        />
      ))}
    </div>
  );
}

// ─── Attention count helper ─────────────────────────────────────────────────────

function attentionCount(
  tab: TabKey,
  blogPosts: BlogPost[],
  socialData: Record<string, SocialPost[]>,
  emailDrafts: EmailDraft[]
): number {
  if (tab === "blog") {
    return blogPosts.filter((p) => p.status === "draft").length;
  }
  if (tab === "email") {
    // All email drafts are now drafts (no send status)
    return emailDrafts.length;
  }
  const posts = socialData[tab] ?? [];
  return posts.filter((p) => p.status === "generated" || p.status === "failed").length;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ContentHubPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>("blog");

  // Per-tab data
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [emailDrafts, setEmailDrafts] = useState<EmailDraft[]>([]);
  const [socialData, setSocialData] = useState<Record<string, SocialPost[]>>({});

  // Per-tab loading
  const [loadingTabs, setLoadingTabs] = useState<Record<string, boolean>>({});
  // Which tabs have already been fetched
  const [fetchedTabs, setFetchedTabs] = useState<Set<string>>(new Set());

  // Per-item action in-flight sets
  const [publishing, setPublishing] = useState<Set<string>>(new Set());
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState<Set<string>>(new Set());

  // Inline schedule picker state: id → { open, value }
  const [schedulePickers, setSchedulePickers] = useState<
    Record<string, { open: boolean; value: string }>
  >({});
  const [scheduling, setScheduling] = useState<Set<string>>(new Set());

  // Error messages per item
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  // ── Fetch helpers ────────────────────────────────────────────────────────────

  const fetchTab = useCallback(
    async (tab: TabKey) => {
      if (fetchedTabs.has(tab)) return;
      setLoadingTabs((prev) => ({ ...prev, [tab]: true }));
      try {
        if (tab === "blog") {
          const res = await fetch("/api/blog-posts");
          if (res.ok) {
            const data: BlogPost[] = await res.json();
            setBlogPosts(data);
          }
        } else if (tab === "email") {
          const res = await fetch("/api/email-drafts");
          if (res.ok) {
            const data: EmailDraft[] = await res.json();
            setEmailDrafts(data);
          }
        } else {
          const res = await fetch(`/api/posts?platform=${tab}&limit=100`);
          if (res.ok) {
            const json: { data: SocialPost[] } = await res.json();
            setSocialData((prev) => ({ ...prev, [tab]: json.data }));
          }
        }
        setFetchedTabs((prev) => new Set(prev).add(tab));
      } catch {
        // silently fail
      } finally {
        setLoadingTabs((prev) => ({ ...prev, [tab]: false }));
      }
    },
    [fetchedTabs]
  );

  function handleTabClick(tab: TabKey) {
    setActiveTab(tab);
    fetchTab(tab);
  }

  // Trigger blog tab on mount
  if (!fetchedTabs.has("blog") && !loadingTabs["blog"]) {
    fetchTab("blog");
  }

  // ── Blog actions ─────────────────────────────────────────────────────────────

  async function handlePublish(id: string) {
    setPublishing((prev) => new Set(prev).add(id));
    setItemErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
    try {
      const res = await fetch(`/api/blog-posts/${id}/publish`, { method: "POST" });
      if (res.ok) {
        setBlogPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "published" } : p))
        );
        setPublishedIds((prev) => new Set(prev).add(id));
      } else {
        const err = await res.json().catch(() => ({}));
        setItemErrors((prev) => ({
          ...prev,
          [id]: (err as { error?: string }).error ?? "Publish failed.",
        }));
      }
    } catch {
      setItemErrors((prev) => ({ ...prev, [id]: "Publish failed." }));
    } finally {
      setPublishing((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  }

  // ── Social actions ───────────────────────────────────────────────────────────

  async function handleApprove(tab: string, id: string) {
    setApproving((prev) => new Set(prev).add(id));
    // Optimistic
    setSocialData((prev) => ({
      ...prev,
      [tab]: (prev[tab] ?? []).map((p) =>
        p.id === id ? { ...p, status: "approved" } : p
      ),
    }));
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) {
        // revert
        setSocialData((prev) => ({
          ...prev,
          [tab]: (prev[tab] ?? []).map((p) =>
            p.id === id ? { ...p, status: "generated" } : p
          ),
        }));
        setItemErrors((prev) => ({ ...prev, [id]: "Approve failed." }));
      }
    } catch {
      setSocialData((prev) => ({
        ...prev,
        [tab]: (prev[tab] ?? []).map((p) =>
          p.id === id ? { ...p, status: "generated" } : p
        ),
      }));
      setItemErrors((prev) => ({ ...prev, [id]: "Approve failed." }));
    } finally {
      setApproving((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  }

  function openSchedulePicker(id: string) {
    setSchedulePickers((prev) => ({
      ...prev,
      [id]: { open: true, value: prev[id]?.value ?? "" },
    }));
  }

  function closeSchedulePicker(id: string) {
    setSchedulePickers((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  }

  async function handleSetSchedule(tab: string, id: string) {
    const val = schedulePickers[id]?.value;
    if (!val) return;
    setScheduling((prev) => new Set(prev).add(id));
    const iso = new Date(val).toISOString();
    // Optimistic
    setSocialData((prev) => ({
      ...prev,
      [tab]: (prev[tab] ?? []).map((p) =>
        p.id === id ? { ...p, scheduledAt: iso } : p
      ),
    }));
    closeSchedulePicker(id);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: iso }),
      });
      if (!res.ok) {
        setItemErrors((prev) => ({ ...prev, [id]: "Schedule failed." }));
      }
    } catch {
      setItemErrors((prev) => ({ ...prev, [id]: "Schedule failed." }));
    } finally {
      setScheduling((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  }

  // ── Email actions ────────────────────────────────────────────────────────────
  // Export button added in next task

  // ── Shared row styles ─────────────────────────────────────────────────────────

  function rowBaseStyle(idx: number): React.CSSProperties {
    return {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      background: idx % 2 === 0 ? "#0a0a0a" : "#0f0f0f",
      borderBottom: "1px solid #1a1a1a",
      minHeight: "52px",
      boxSizing: "border-box",
    };
  }

  function actionBtn(
    variant: "indigo" | "green" | "ghost" | "dashed",
    disabled?: boolean
  ): React.CSSProperties {
    const base: React.CSSProperties = {
      padding: "4px 12px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      whiteSpace: "nowrap",
      transition: "opacity 0.15s",
    };
    if (variant === "indigo") {
      return { ...base, background: "#6366f1", color: "#fff", border: "none" };
    }
    if (variant === "green") {
      return { ...base, background: "#22c55e", color: "#000", border: "none" };
    }
    if (variant === "dashed") {
      return {
        ...base,
        background: "transparent",
        color: "#a1a1aa",
        border: "1px dashed #3f3f46",
      };
    }
    // ghost
    return {
      ...base,
      background: "transparent",
      color: "#6366f1",
      border: "1px solid #6366f1",
    };
  }

  // ── Render tabs ───────────────────────────────────────────────────────────────

  const isLoading = !!loadingTabs[activeTab];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <FileStack size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#e4e4e7" }}>
          Posts
        </h1>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "#0a0a0a",
          border: "1px solid #1a1a1a",
          borderRadius: "8px",
          padding: "4px",
          width: "fit-content",
          flexWrap: "wrap",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = attentionCount(tab.key, blogPosts, socialData, emailDrafts);
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
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

      {/* Content table */}
      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid #1a1a1a",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        {/* ── BLOG TAB ───────────────────────────────────────────────────── */}
        {activeTab === "blog" && (
          <>
            {/* Column headers */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 16px",
                borderBottom: "1px solid #1a1a1a",
              }}
            >
              <span style={{ ...headerColStyle, flex: 1 }}>Title</span>
              <span style={{ ...headerColStyle, width: "80px", flexShrink: 0 }}>Date</span>
              <span style={{ ...headerColStyle, width: "90px", flexShrink: 0 }}>Status</span>
              <span style={{ ...headerColStyle, width: "220px", flexShrink: 0 }}>Actions</span>
            </div>

            {isLoading ? (
              <SkeletonRows />
            ) : blogPosts.length === 0 ? (
              <EmptyState label="Blog" />
            ) : (
              blogPosts.map((post, idx) => {
                const { style: badgeStyle, label: badgeLabel } = getBlogStatusBadge(post.status);
                const isPublishing = publishing.has(post.id);
                const isPublished = publishedIds.has(post.id) || post.status === "published";
                const errMsg = itemErrors[post.id];
                const showPublish = post.status === "draft" && !!post.ghostId;

                return (
                  <div
                    key={post.id}
                    style={rowBaseStyle(idx)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "#141414";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        idx % 2 === 0 ? "#0a0a0a" : "#0f0f0f";
                    }}
                  >
                    {/* Title */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#e4e4e7",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {post.ghostUrl ? (
                        <a
                          href={post.ghostUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#e4e4e7", textDecoration: "none" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {truncate(post.title, 60)}
                        </a>
                      ) : (
                        truncate(post.title, 60)
                      )}
                    </div>

                    {/* Date */}
                    <div
                      style={{
                        width: "80px",
                        flexShrink: 0,
                        fontSize: "12px",
                        color: "#52525b",
                      }}
                    >
                      {formatDate(post.date)}
                    </div>

                    {/* Status */}
                    <div style={{ width: "90px", flexShrink: 0 }}>
                      <span style={{ ...pillStyle, ...badgeStyle }}>{badgeLabel}</span>
                    </div>

                    {/* Actions */}
                    <div
                      style={{
                        width: "220px",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      {post.ghostUrl && (
                        <a
                          href={post.ghostUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#a1a1aa",
                            border: "1px solid #2a2a2a",
                            background: "transparent",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          View in Ghost
                        </a>
                      )}
                      {showPublish && (
                        <button
                          disabled={isPublishing || isPublished}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublish(post.id);
                          }}
                          style={actionBtn("indigo", isPublishing || isPublished)}
                        >
                          {isPublishing
                            ? "Publishing…"
                            : isPublished
                            ? "Published ✓"
                            : "Publish"}
                        </button>
                      )}
                      {errMsg && (
                        <span style={{ fontSize: "11px", color: "#f87171" }}>{errMsg}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ── SOCIAL TABS ────────────────────────────────────────────────── */}
        {(activeTab === "twitter" ||
          activeTab === "linkedin" ||
          activeTab === "video" ||
          activeTab === "instagram" ||
          activeTab === "reddit") && (
          <>
            {/* Column headers */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 16px",
                borderBottom: "1px solid #1a1a1a",
              }}
            >
              <span style={{ ...headerColStyle, width: "110px", flexShrink: 0 }}>Status</span>
              <span style={{ ...headerColStyle, flex: 1 }}>Preview</span>
              <span style={{ ...headerColStyle, width: "80px", flexShrink: 0 }}>Date</span>
              <span style={{ ...headerColStyle, width: "140px", flexShrink: 0 }}>Actions</span>
            </div>

            {isLoading ? (
              <SkeletonRows />
            ) : (socialData[activeTab] ?? []).length === 0 ? (
              <EmptyState label={TABS.find((t) => t.key === activeTab)?.label ?? activeTab} />
            ) : (
              (socialData[activeTab] ?? []).map((post, idx) => {
                const badge = getSocialStatusBadge(post.status, post.scheduledAt, post.error);
                const isApproving = approving.has(post.id);
                const isScheduling = scheduling.has(post.id);
                const picker = schedulePickers[post.id];
                const errMsg = itemErrors[post.id];

                return (
                  <div key={post.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <div
                      style={{
                        ...rowBaseStyle(idx),
                        borderBottom: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => router.push(`/posts/${post.id}`)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "#141414";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          idx % 2 === 0 ? "#0a0a0a" : "#0f0f0f";
                      }}
                    >
                      {/* Status badge */}
                      <div style={{ width: "110px", flexShrink: 0 }}>
                        <span
                          style={{ ...pillStyle, ...badge.style }}
                          title={badge.title}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Preview */}
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: "13px",
                          color: "#a1a1aa",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {truncate(stripHtml(post.contentPreview), 80)}
                      </div>

                      {/* Date */}
                      <div
                        style={{
                          width: "80px",
                          flexShrink: 0,
                          fontSize: "12px",
                          color: "#52525b",
                        }}
                      >
                        {formatDate(post.date)}
                      </div>

                      {/* Actions */}
                      <div
                        style={{
                          width: "140px",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {post.status === "generated" && (
                          <button
                            disabled={isApproving}
                            onClick={() => handleApprove(activeTab, post.id)}
                            style={actionBtn("indigo", isApproving)}
                          >
                            {isApproving ? "Approving…" : "Approve"}
                          </button>
                        )}
                        {post.status === "approved" && !post.scheduledAt && (
                          <button
                            onClick={() => openSchedulePicker(post.id)}
                            style={actionBtn("dashed", false)}
                          >
                            Schedule
                          </button>
                        )}
                        {post.status === "approved" && post.scheduledAt && (
                          <button
                            onClick={() => openSchedulePicker(post.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#6366f1",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              padding: "4px 0",
                            }}
                          >
                            Reschedule
                          </button>
                        )}
                        {post.status === "failed" && (
                          <a
                            href={`/posts/${post.id}`}
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#f87171",
                              textDecoration: "none",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            View →
                          </a>
                        )}
                        {errMsg && (
                          <span style={{ fontSize: "11px", color: "#f87171" }}>{errMsg}</span>
                        )}
                      </div>
                    </div>

                    {/* Inline schedule picker */}
                    {picker?.open && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 16px 12px",
                          background: "#0a0a0a",
                          borderTop: "1px solid #1a1a1a",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="datetime-local"
                          value={picker.value}
                          onChange={(e) =>
                            setSchedulePickers((prev) => ({
                              ...prev,
                              [post.id]: { open: true, value: e.target.value },
                            }))
                          }
                          style={{
                            padding: "6px 10px",
                            background: "#0f0f0f",
                            border: "1px solid #2a2a2a",
                            borderRadius: "6px",
                            color: "#e4e4e7",
                            fontSize: "13px",
                            outline: "none",
                            colorScheme: "dark",
                          }}
                        />
                        <button
                          disabled={!picker.value || isScheduling}
                          onClick={() => handleSetSchedule(activeTab, post.id)}
                          style={actionBtn("indigo", !picker.value || isScheduling)}
                        >
                          {isScheduling ? "Saving…" : "Set"}
                        </button>
                        <button
                          onClick={() => closeSchedulePicker(post.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#52525b",
                            fontSize: "12px",
                            cursor: "pointer",
                            padding: "4px",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ── EMAIL TAB ──────────────────────────────────────────────────── */}
        {activeTab === "email" && (
          <>
            {/* Column headers */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 16px",
                borderBottom: "1px solid #1a1a1a",
              }}
            >
              <span style={{ ...headerColStyle, flex: 1 }}>Subject</span>
              <span style={{ ...headerColStyle, width: "160px", flexShrink: 0 }}>Source</span>
              <span style={{ ...headerColStyle, width: "90px", flexShrink: 0 }}>Status</span>
              <span style={{ ...headerColStyle, width: "80px", flexShrink: 0 }}>Sent</span>
              <span style={{ ...headerColStyle, width: "100px", flexShrink: 0 }}>Actions</span>
            </div>

            {isLoading ? (
              <SkeletonRows />
            ) : emailDrafts.length === 0 ? (
              <EmptyState label="Email" />
            ) : (
              emailDrafts.map((draft, idx) => {
                return (
                  <div
                    key={draft.id}
                    style={rowBaseStyle(idx)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "#141414";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        idx % 2 === 0 ? "#0a0a0a" : "#0f0f0f";
                    }}
                  >
                    {/* Subject */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#e4e4e7",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {truncate(draft.subject, 60)}
                    </div>

                    {/* Source blog title */}
                    <div
                      style={{
                        width: "160px",
                        flexShrink: 0,
                        fontSize: "11px",
                        color: "#52525b",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {draft.blogPost?.title ?? "—"}
                    </div>

                    {/* Export button added in next task */}
                    <div style={{ width: "100px", flexShrink: 0 }}>
                      {/* Export button placeholder */}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Empty state component ─────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>
        No {label} content yet.
      </p>
    </div>
  );
}
