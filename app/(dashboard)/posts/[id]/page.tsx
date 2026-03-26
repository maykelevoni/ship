"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentPiece {
  id: string;
  platform: string;
  promotionId: string | null;
  promotionName: string | null;
  blogPostTitle: string | null;
  blogPostGhostUrl: string | null;
  date: string;
  status: string;
  content: string;
  mediaPath: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Badge helpers (same as list page) ───────────────────────────────────────

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
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatScheduled(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Media preview helper ─────────────────────────────────────────────────────

function isImage(path: string): boolean {
  return /\.(png|jpg|jpeg|gif|webp)$/i.test(path);
}

function isVideo(path: string): boolean {
  return /\.(mp4|webm|ogg)$/i.test(path);
}

function mediaUrl(mediaPath: string): string {
  return "/" + mediaPath.replace("./", "");
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: "28px",
        height: "28px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "5px",
        border: "1px solid #2a2a2a",
        background: active ? "#2a2a2a" : "transparent",
        color: active ? "#e4e4e7" : "#a1a1aa",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PostEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const [piece, setPiece] = useState<ContentPiece | null>(null);
  const [localStatus, setLocalStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Action state
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [posting, setPosting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  // Feedback messages: null | { type: 'ok' | 'err'; text: string }
  const [saveFb, setSaveFb] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [approveFb, setApproveFb] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [rejectFb, setRejectFb] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [postFb, setPostFb] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [scheduleFb, setScheduleFb] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Feedback auto-clear helpers
  function clearAfter(
    setter: React.Dispatch<React.SetStateAction<{ type: "ok" | "err"; text: string } | null>>,
    ms = 3000
  ) {
    setTimeout(() => setter(null), ms);
  }

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  // Fetch the piece
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (res.ok) {
          const data: ContentPiece = await res.json();
          setPiece(data);
          setLocalStatus(data.status);
          if (data.scheduledAt) {
            // Pre-fill the datetime-local input (strips timezone)
            const d = new Date(data.scheduledAt);
            const pad = (n: number) => String(n).padStart(2, "0");
            setScheduledAt(
              `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
            );
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Set editor content once piece is loaded
  useEffect(() => {
    if (editor && piece) {
      editor.commands.setContent(piece.content);
    }
  }, [editor, piece]);

  // ── Action handlers ─────────────────────────────────────────────────────────

  async function handleSave() {
    if (!editor) return;
    setSaving(true);
    setSaveFb(null);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editor.getHTML() }),
      });
      if (res.ok) {
        setSaveFb({ type: "ok", text: "Saved!" });
      } else {
        setSaveFb({ type: "err", text: "Save failed." });
      }
    } catch {
      setSaveFb({ type: "err", text: "Save failed." });
    } finally {
      setSaving(false);
      clearAfter(setSaveFb);
    }
  }

  async function handleApprove() {
    setApproving(true);
    setApproveFb(null);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (res.ok) {
        setLocalStatus("approved");
        setApproveFb({ type: "ok", text: "Approved!" });
      } else {
        setApproveFb({ type: "err", text: "Failed." });
      }
    } catch {
      setApproveFb({ type: "err", text: "Failed." });
    } finally {
      setApproving(false);
      clearAfter(setApproveFb);
    }
  }

  async function handleReject() {
    setRejecting(true);
    setRejectFb(null);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (res.ok) {
        setLocalStatus("rejected");
        setRejectFb({ type: "ok", text: "Rejected." });
      } else {
        setRejectFb({ type: "err", text: "Failed." });
      }
    } catch {
      setRejectFb({ type: "err", text: "Failed." });
    } finally {
      setRejecting(false);
      clearAfter(setRejectFb);
    }
  }

  async function handlePostNow() {
    setPosting(true);
    setPostFb(null);
    try {
      const res = await fetch(`/api/posts/${id}/publish`, { method: "POST" });
      if (res.ok) {
        setLocalStatus("posted");
        setPostFb({ type: "ok", text: "✓ Posted!" });
      } else {
        const err = await res.json().catch(() => ({}));
        setPostFb({ type: "err", text: (err as { error?: string }).error ?? "Post failed." });
      }
    } catch {
      setPostFb({ type: "err", text: "Post failed." });
    } finally {
      setPosting(false);
      clearAfter(setPostFb, 5000);
    }
  }

  async function handleSetSchedule() {
    if (!scheduledAt) return;
    setScheduling(true);
    setScheduleFb(null);
    try {
      const iso = new Date(scheduledAt).toISOString();
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: iso }),
      });
      if (res.ok) {
        setScheduleFb({ type: "ok", text: "Scheduled!" });
      } else {
        setScheduleFb({ type: "err", text: "Failed." });
      }
    } catch {
      setScheduleFb({ type: "err", text: "Failed." });
    } finally {
      setScheduling(false);
      clearAfter(setScheduleFb);
    }
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ height: "20px", width: "120px", background: "#1a1a1a", borderRadius: "6px" }} />
        <div style={{ height: "36px", width: "300px", background: "#1a1a1a", borderRadius: "8px" }} />
        <div style={{ display: "flex", gap: "24px" }}>
          <div style={{ flex: 1, height: "500px", background: "#1a1a1a", borderRadius: "10px" }} />
          <div style={{ width: "280px", height: "400px", background: "#1a1a1a", borderRadius: "10px" }} />
        </div>
      </div>
    );
  }

  if (!piece) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>Post not found.</p>
        <Link href="/posts" style={{ fontSize: "13px", color: "#6366f1", textDecoration: "none" }}>
          ← Back to Posts
        </Link>
      </div>
    );
  }

  const platformBadge = getPlatformBadgeStyle(piece.platform);
  const { style: statusStyle, label: statusLabel } = getStatusBadgeStyle(localStatus);

  const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
  };

  const actionBtnBase: React.CSSProperties = {
    width: "100%",
    padding: "9px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "opacity 0.15s ease",
  };

  const metaLabelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    color: "#52525b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "4px",
  };

  const metaValueStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#e4e4e7",
    fontWeight: 500,
  };

  const feedbackStyle = (type: "ok" | "err"): React.CSSProperties => ({
    fontSize: "12px",
    fontWeight: 500,
    color: type === "ok" ? "#4ade80" : "#f87171",
    marginTop: "4px",
    textAlign: "center",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* TipTap + prose styles */}
      <style>{`
        .ProseMirror {
          outline: none;
          color: #e4e4e7;
          font-size: 14px;
          line-height: 1.7;
          min-height: 360px;
        }
        .ProseMirror p {
          margin: 0 0 0.75em;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0 0 0.75em;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #2a2a2a;
          padding-left: 1em;
          margin: 0 0 0.75em;
          color: #a1a1aa;
        }
        .ProseMirror code {
          background: #1a1a1a;
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 13px;
        }
        .ProseMirror h2 {
          font-size: 18px;
          font-weight: 700;
          color: #e4e4e7;
          margin: 0 0 0.5em;
        }
        .ProseMirror h3 {
          font-size: 15px;
          font-weight: 700;
          color: #e4e4e7;
          margin: 0 0 0.5em;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid #2a2a2a;
          margin: 1.2em 0;
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Back nav */}
      <Link
        href="/posts"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "13px",
          color: "#a1a1aa",
          textDecoration: "none",
          width: "fit-content",
        }}
      >
        ← Back to Posts
      </Link>

      {/* Page title */}
      <h1
        style={{
          margin: 0,
          fontSize: "20px",
          fontWeight: 700,
          color: "#e4e4e7",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {piece.promotionName ?? "Untitled"}
        <span style={{ fontSize: "14px", fontWeight: 400, color: "#71717a" }}>—</span>
        <span style={{ ...pillStyle, ...platformBadge }}>
          {platformLabel(piece.platform)}
        </span>
      </h1>

      {/* Two-column layout */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* ── Left column: editor + media ──────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              padding: "8px 10px",
              background: "#0a0a0a",
              border: "1px solid #2a2a2a",
              borderRadius: "8px 8px 0 0",
              flexWrap: "wrap",
            }}
          >
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive("bold")}
              title="Bold"
            >
              B
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive("italic")}
              title="Italic"
            >
              <em>I</em>
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive("bulletList")}
              title="Bullet List"
            >
              •
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              active={editor?.isActive("blockquote")}
              title="Blockquote"
            >
              &ldquo;
            </ToolbarBtn>
            <div
              style={{
                width: "1px",
                background: "#2a2a2a",
                margin: "2px 4px",
                alignSelf: "stretch",
              }}
            />
            <ToolbarBtn
              onClick={() => editor?.chain().focus().undo().run()}
              title="Undo"
            >
              ↩
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().redo().run()}
              title="Redo"
            >
              ↪
            </ToolbarBtn>
          </div>

          {/* Editor area */}
          <div
            style={{
              background: "#0a0a0a",
              border: "1px solid #2a2a2a",
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
              padding: "16px",
              minHeight: "400px",
            }}
          >
            <EditorContent editor={editor} />
          </div>

          {/* Media preview */}
          {piece.mediaPath && (
            <div
              style={{
                background: "#0a0a0a",
                border: "1px solid #1a1a1a",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#52525b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Media
              </p>
              {isImage(piece.mediaPath) && (
                <img
                  src={mediaUrl(piece.mediaPath)}
                  alt="Content media"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "400px",
                    borderRadius: "6px",
                    display: "block",
                  }}
                />
              )}
              {isVideo(piece.mediaPath) && (
                <video
                  controls
                  style={{
                    maxWidth: "100%",
                    maxHeight: "400px",
                    borderRadius: "6px",
                    display: "block",
                  }}
                >
                  <source src={mediaUrl(piece.mediaPath)} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
        </div>

        {/* ── Right column: metadata + actions ────────────────────────────── */}
        <div
          style={{
            width: "280px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Metadata card */}
          <div
            style={{
              background: "#0a0a0a",
              border: "1px solid #1a1a1a",
              borderRadius: "8px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* Platform */}
            <div>
              <p style={metaLabelStyle}>Platform</p>
              <span style={{ ...pillStyle, ...platformBadge }}>
                {platformLabel(piece.platform)}
              </span>
            </div>

            {/* Status */}
            <div>
              <p style={metaLabelStyle}>Status</p>
              <span style={{ ...pillStyle, ...statusStyle }}>{statusLabel}</span>
            </div>

            {/* Promotion */}
            <div>
              <p style={metaLabelStyle}>Promotion</p>
              <p style={{ ...metaValueStyle, margin: 0 }}>
                {piece.promotionName ?? "—"}
              </p>
            </div>

            {/* Date */}
            <div>
              <p style={metaLabelStyle}>Date</p>
              <p style={{ ...metaValueStyle, margin: 0 }}>{formatDate(piece.date)}</p>
            </div>

            {/* Scheduled */}
            {piece.scheduledAt && (
              <div>
                <p style={metaLabelStyle}>Scheduled</p>
                <p style={{ ...metaValueStyle, margin: 0 }}>
                  {formatScheduled(piece.scheduledAt)}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Save */}
            <div>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  ...actionBtnBase,
                  border: "1px solid #2a2a2a",
                  background: "transparent",
                  color: "#a1a1aa",
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              {saveFb && (
                <p style={feedbackStyle(saveFb.type)}>{saveFb.text}</p>
              )}
            </div>

            {/* Approve */}
            <div>
              <button
                onClick={handleApprove}
                disabled={approving || localStatus === "approved" || localStatus === "posted"}
                style={{
                  ...actionBtnBase,
                  border: "none",
                  background:
                    localStatus === "approved" || localStatus === "posted"
                      ? "#1a1a1a"
                      : "#6366f1",
                  color:
                    localStatus === "approved" || localStatus === "posted"
                      ? "#52525b"
                      : "#ffffff",
                  opacity: approving ? 0.7 : 1,
                  cursor:
                    approving || localStatus === "approved" || localStatus === "posted"
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {approving
                  ? "Approving…"
                  : localStatus === "approved"
                  ? "Approved ✓"
                  : "Approve"}
              </button>
              {approveFb && (
                <p style={feedbackStyle(approveFb.type)}>{approveFb.text}</p>
              )}
            </div>

            {/* Reject */}
            <div>
              <button
                onClick={handleReject}
                disabled={rejecting || localStatus === "posted"}
                style={{
                  ...actionBtnBase,
                  border: "1px solid #3f3f46",
                  background: "transparent",
                  color: "#f87171",
                  opacity: rejecting || localStatus === "posted" ? 0.5 : 1,
                  cursor:
                    rejecting || localStatus === "posted" ? "not-allowed" : "pointer",
                }}
              >
                {rejecting ? "Rejecting…" : "Reject"}
              </button>
              {rejectFb && (
                <p style={feedbackStyle(rejectFb.type)}>{rejectFb.text}</p>
              )}
            </div>

            {/* Post Now */}
            <div>
              <button
                onClick={handlePostNow}
                disabled={posting || localStatus === "posted"}
                style={{
                  ...actionBtnBase,
                  border: "none",
                  background: localStatus === "posted" ? "#1a1a1a" : "#22c55e",
                  color: localStatus === "posted" ? "#52525b" : "#000000",
                  opacity: posting ? 0.7 : 1,
                  cursor:
                    posting || localStatus === "posted" ? "not-allowed" : "pointer",
                }}
              >
                {posting ? (
                  <>
                    <span
                      style={{
                        width: "14px",
                        height: "14px",
                        border: "2px solid rgba(0,0,0,0.3)",
                        borderTopColor: "#000",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    Posting…
                  </>
                ) : localStatus === "posted" ? (
                  "✓ Posted!"
                ) : (
                  "Post Now"
                )}
              </button>
              {postFb && (
                <p style={feedbackStyle(postFb.type)}>{postFb.text}</p>
              )}
            </div>

            {/* Schedule */}
            <div>
              <button
                onClick={() => setScheduleExpanded((v) => !v)}
                style={{
                  ...actionBtnBase,
                  border: "1px dashed #2a2a2a",
                  background: "transparent",
                  color: "#a1a1aa",
                  cursor: "pointer",
                }}
              >
                {scheduleExpanded ? "Hide Schedule" : "Schedule"}
              </button>

              {scheduleExpanded && (
                <div
                  style={{
                    marginTop: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: "#0a0a0a",
                      border: "1px solid #2a2a2a",
                      borderRadius: "7px",
                      color: "#e4e4e7",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                      colorScheme: "dark",
                    }}
                  />
                  <button
                    onClick={handleSetSchedule}
                    disabled={scheduling || !scheduledAt}
                    style={{
                      ...actionBtnBase,
                      border: "none",
                      background: "#6366f1",
                      color: "#ffffff",
                      opacity: scheduling || !scheduledAt ? 0.6 : 1,
                      cursor: scheduling || !scheduledAt ? "not-allowed" : "pointer",
                    }}
                  >
                    {scheduling ? "Saving…" : "Set Schedule"}
                  </button>
                </div>
              )}

              {scheduleFb && (
                <p style={feedbackStyle(scheduleFb.type)}>{scheduleFb.text}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
