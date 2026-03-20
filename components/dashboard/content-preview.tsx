"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Twitter,
  Linkedin,
  Video,
  MessageSquare,
  Instagram,
  Mail,
  CheckCircle,
  XCircle,
  RotateCcw,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ContentPieceData } from "./platform-status-card";

export interface ContentPreviewProps {
  piece: (ContentPieceData & { promotionName: string }) | null;
  open: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

const PLATFORM_META: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  twitter: { label: "Twitter / X", icon: <Twitter size={15} /> },
  linkedin: { label: "LinkedIn", icon: <Linkedin size={15} /> },
  video: { label: "Video", icon: <Video size={15} /> },
  reddit: { label: "Reddit", icon: <MessageSquare size={15} /> },
  instagram: { label: "Instagram", icon: <Instagram size={15} /> },
  email: { label: "Email", icon: <Mail size={15} /> },
};

const STATUS_STYLES: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  queued: { label: "Queued", color: "#a1a1aa", bg: "rgba(161,161,170,0.15)" },
  generating: {
    label: "Generating",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.15)",
  },
  generated: {
    label: "Generated",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.15)",
  },
  approved: {
    label: "Approved",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.15)",
  },
  posting: {
    label: "Posting",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.15)",
  },
  posted: { label: "Posted", color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
  failed: {
    label: "Failed",
    color: "#f87171",
    bg: "rgba(248,113,113,0.15)",
  },
  rejected: {
    label: "Rejected",
    color: "#f87171",
    bg: "rgba(248,113,113,0.15)",
  },
};

const TWITTER_LIMIT = 280;

/** Parse numbered tweets (1., 2., etc.) from a block of text */
function parseTwitterThreads(content: string): string[] {
  // Match lines like "1. ...", "2. ...", etc.
  const lines = content.split("\n");
  const tweets: string[] = [];
  let current = "";

  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (match) {
      if (current.trim()) tweets.push(current.trim());
      current = match[2];
    } else {
      current += (current ? "\n" : "") + line;
    }
  }
  if (current.trim()) tweets.push(current.trim());

  return tweets.length > 0 ? tweets : [content];
}

function TwitterBubbles({ content }: { content: string }) {
  const tweets = parseTwitterThreads(content);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {tweets.map((tweet, i) => {
        const count = tweet.length;
        const over = count > TWITTER_LIMIT;
        return (
          <div
            key={i}
            style={{
              background: "#0d0d0d",
              border: `1px solid ${over ? "rgba(248,113,113,0.4)" : "#222222"}`,
              borderRadius: "10px",
              padding: "10px 14px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#d4d4d8",
                lineHeight: "1.55",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {tweet}
            </p>
            <div
              style={{
                marginTop: "6px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: over ? "#f87171" : "#52525b",
                  background: over
                    ? "rgba(248,113,113,0.12)"
                    : "rgba(82,82,91,0.15)",
                  borderRadius: "4px",
                  padding: "1px 6px",
                }}
              >
                {count} / {TWITTER_LIMIT}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AutoResizeTextarea({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        minHeight: "120px",
        background: "#0d0d0d",
        border: "1px solid #222222",
        borderRadius: "8px",
        color: "#d4d4d8",
        fontSize: "13px",
        lineHeight: "1.6",
        padding: "12px 14px",
        resize: "none",
        outline: "none",
        fontFamily: "inherit",
        boxSizing: "border-box",
        overflowY: "hidden",
      }}
      onFocus={(e) =>
        (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")
      }
      onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
    />
  );
}

function isImagePath(p: string) {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(p);
}

function isVideoPath(p: string) {
  return /\.(mp4|webm|mov|avi|mkv)$/i.test(p);
}

export function ContentPreview({
  piece,
  open,
  onClose,
  onApprove,
  onReject,
}: ContentPreviewProps) {
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<
    "approve" | "reject" | "revoke" | null
  >(null);

  // Sync content whenever the piece changes
  useEffect(() => {
    if (piece) {
      setEditedContent(piece.content ?? "");
    }
  }, [piece]);

  const isDirty = piece ? editedContent !== (piece.content ?? "") : false;

  const patchQueue = useCallback(
    async (body: Record<string, unknown>) => {
      if (!piece) return;
      await fetch(`/api/queue/${piece.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    [piece],
  );

  async function handleSave() {
    if (!piece || !isDirty) return;
    setSaving(true);
    try {
      await patchQueue({ action: "edit", content: editedContent });
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!piece) return;
    setActionLoading("approve");
    try {
      await patchQueue({ action: "approve" });
      onApprove?.();
      onClose();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!piece) return;
    setActionLoading("reject");
    try {
      await patchQueue({ action: "reject" });
      onReject?.();
      onClose();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRevoke() {
    if (!piece) return;
    setActionLoading("revoke");
    try {
      await patchQueue({ action: "reject" });
      onReject?.();
      onClose();
    } finally {
      setActionLoading(null);
    }
  }

  if (!piece) return null;

  const meta = PLATFORM_META[piece.platform] ?? {
    label: piece.platform,
    icon: null,
  };
  const statusStyle =
    STATUS_STYLES[piece.status] ?? STATUS_STYLES.queued;
  const isTwitter = piece.platform === "twitter";
  const mediaPath = (piece as ContentPieceData & { mediaPath?: string | null })
    .mediaPath;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-xl"
        style={{
          background: "#111111",
          border: "1px solid #2a2a2a",
          borderRadius: "14px",
          color: "#e4e4e7",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: 0,
        }}
      >
        {/* Header */}
        <DialogHeader
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid #1e1e1e",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: "#a1a1aa" }}>{meta.icon}</span>
            <DialogTitle
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: "#e4e4e7",
              }}
            >
              {meta.label}
            </DialogTitle>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: statusStyle.color,
                background: statusStyle.bg,
              }}
            >
              {statusStyle.label.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "#52525b",
                marginLeft: "auto",
              }}
            >
              {piece.promotionName}
            </span>
          </div>
        </DialogHeader>

        {/* Scrollable content area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Editable textarea or Twitter bubbles */}
          {isTwitter ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <AutoResizeTextarea
                value={editedContent}
                onChange={setEditedContent}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#52525b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Thread Preview
              </p>
              <TwitterBubbles content={editedContent} />
            </div>
          ) : (
            <AutoResizeTextarea
              value={editedContent}
              onChange={setEditedContent}
            />
          )}

          {/* Media preview */}
          {mediaPath && isImagePath(mediaPath) && (
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#52525b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Image Preview
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaPath}
                alt="Content media"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #2a2a2a",
                  display: "block",
                }}
              />
            </div>
          )}

          {mediaPath && isVideoPath(mediaPath) && (
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#52525b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Video Preview
              </p>
              <video
                controls
                src={mediaPath}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #2a2a2a",
                  display: "block",
                  background: "#000",
                }}
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <DialogFooter
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #1e1e1e",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {/* Save Edits — only when dirty */}
          {isDirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "6px",
                border: "1px solid rgba(99,102,241,0.4)",
                background: "rgba(99,102,241,0.12)",
                color: "#818cf8",
                fontSize: "13px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save Edits"}
            </button>
          )}

          {/* Approve + Reject when generated */}
          {piece.status === "generated" && (
            <>
              <button
                onClick={handleApprove}
                disabled={actionLoading !== null}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "6px",
                  border: "1px solid rgba(74,222,128,0.35)",
                  background: "rgba(74,222,128,0.1)",
                  color: "#4ade80",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                <CheckCircle size={13} />
                {actionLoading === "approve" ? "Approving…" : "Approve"}
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading !== null}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "6px",
                  border: "1px solid rgba(248,113,113,0.35)",
                  background: "rgba(248,113,113,0.1)",
                  color: "#f87171",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                <XCircle size={13} />
                {actionLoading === "reject" ? "Rejecting…" : "Reject"}
              </button>
            </>
          )}

          {/* Revoke when approved */}
          {piece.status === "approved" && (
            <button
              onClick={handleRevoke}
              disabled={actionLoading !== null}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "6px",
                border: "1px solid rgba(248,113,113,0.35)",
                background: "rgba(248,113,113,0.1)",
                color: "#f87171",
                fontSize: "13px",
                fontWeight: 600,
                cursor: actionLoading ? "not-allowed" : "pointer",
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              <RotateCcw size={13} />
              {actionLoading === "revoke" ? "Revoking…" : "Revoke"}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
