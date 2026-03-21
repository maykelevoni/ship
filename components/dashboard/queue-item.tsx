"use client";

import { useState } from "react";
import {
  Twitter,
  Linkedin,
  Video,
  MessageSquare,
  Instagram,
  Mail,
  CheckCircle,
  XCircle,
  Eye,
  Image as ImageIcon,
} from "lucide-react";
import { ContentPreview } from "./content-preview";

export interface QueueItemData {
  id: string;
  promotionId: string;
  promotionName: string;
  promotionType: string;
  date: string;
  platform: string;
  content: string | null;
  mediaPath: string | null;
  status: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  provider?: string;
}

interface QueueItemProps {
  item: QueueItemData;
  onStatusChange: (id: string, newStatus: string) => void;
}

const PLATFORM_META: Record<string, { label: string; icon: React.ReactNode }> =
  {
    twitter: {
      label: "Twitter / X",
      icon: <Twitter size={24} />,
    },
    linkedin: {
      label: "LinkedIn",
      icon: <Linkedin size={24} />,
    },
    video: {
      label: "Video",
      icon: <Video size={24} />,
    },
    reddit: {
      label: "Reddit",
      icon: <MessageSquare size={24} />,
    },
    instagram: {
      label: "Instagram",
      icon: <Instagram size={24} />,
    },
    email: {
      label: "Email",
      icon: <Mail size={24} />,
    },
  };

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  queued: { label: "Queued", color: "#a1a1aa", bg: "rgba(161,161,170,0.15)" },
  generating: { label: "Generating", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
  generated: { label: "Generated", color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
  approved: { label: "Approved", color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
  rejected: { label: "Rejected", color: "#f87171", bg: "rgba(248,113,113,0.15)" },
};

function isImagePath(p: string) {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(p);
}

function isVideoPath(p: string) {
  return /\.(mp4|webm|mov|avi|mkv)$/i.test(p);
}

export function QueueItem({ item, onStatusChange }: QueueItemProps) {
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const meta = PLATFORM_META[item.platform] ?? {
    label: item.platform,
    icon: <Mail size={24} />,
  };
  const statusStyle = STATUS_STYLES[item.status] ?? STATUS_STYLES.queued;
  const contentPreview = item.content
    ? item.content.slice(0, 120) + (item.content.length > 120 ? "…" : "")
    : "(no content yet)";

  const isActionable = item.status === "generated" || item.status === "queued";
  const isApproved = item.status === "approved";

  async function handleApprove() {
    setActionLoading("approve");
    try {
      const res = await fetch(`/api/queue/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        onStatusChange(item.id, "approved");
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    setActionLoading("reject");
    try {
      const res = await fetch(`/api/queue/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      if (res.ok) {
        onStatusChange(item.id, "rejected");
      }
    } finally {
      setActionLoading(null);
    }
  }

  const previewPiece = {
    id: item.id,
    platform: item.platform,
    content: item.content ?? "",
    status: item.status,
    approved: item.approved,
    mediaPath: item.mediaPath,
    promotionName: item.promotionName,
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "14px 18px",
          background: "#111111",
          border: "1px solid #1e1e1e",
          borderRadius: "10px",
          transition: "border-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#1e1e1e";
        }}
      >
        {/* Left: Platform icon + name */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            minWidth: "64px",
            width: "64px",
          }}
        >
          <span style={{ color: "#6366f1" }}>{meta.icon}</span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 500,
              color: "#52525b",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {meta.label}
          </span>
          {item.provider === "gemini" && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: "9999px",
                color: "#fbbf24",
                background: "rgba(251,191,36,0.1)",
                whiteSpace: "nowrap",
                lineHeight: 1.4,
              }}
            >
              Gemini
            </span>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            width: "1px",
            alignSelf: "stretch",
            background: "#1e1e1e",
            flexShrink: 0,
          }}
        />

        {/* Center: Promotion name + content preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "11px",
              fontWeight: 500,
              color: "#52525b",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.promotionName}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#d4d4d8",
              lineHeight: "1.5",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {contentPreview}
          </p>
          {/* Media indicator */}
          {item.mediaPath && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "6px",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              {isImagePath(item.mediaPath) ? (
                <ImageIcon size={10} style={{ color: "#818cf8" }} />
              ) : isVideoPath(item.mediaPath) ? (
                <Video size={10} style={{ color: "#818cf8" }} />
              ) : null}
              <span style={{ fontSize: "10px", color: "#818cf8", fontWeight: 500 }}>
                {isImagePath(item.mediaPath) ? "Image" : "Video"}
              </span>
            </div>
          )}
        </div>

        {/* Right: Status badge + action buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          {/* Status badge */}
          <span
            style={{
              display: "inline-block",
              padding: "3px 8px",
              borderRadius: "5px",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: statusStyle.color,
              background: statusStyle.bg,
              whiteSpace: "nowrap",
            }}
          >
            {statusStyle.label}
          </span>

          {/* Approved check */}
          {isApproved && (
            <CheckCircle size={16} style={{ color: "#4ade80", flexShrink: 0 }} />
          )}

          {/* Preview button (always shown) */}
          <button
            onClick={() => setPreviewOpen(true)}
            title="Preview"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#71717a",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#3f3f46";
              (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2a";
              (e.currentTarget as HTMLButtonElement).style.color = "#71717a";
            }}
          >
            <Eye size={13} />
          </button>

          {/* Approve button */}
          {isActionable && (
            <button
              onClick={handleApprove}
              disabled={actionLoading !== null}
              title="Approve"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                borderRadius: "6px",
                border: "1px solid rgba(74,222,128,0.35)",
                background: "rgba(74,222,128,0.1)",
                color: "#4ade80",
                fontSize: "12px",
                fontWeight: 600,
                cursor: actionLoading ? "not-allowed" : "pointer",
                opacity: actionLoading ? 0.6 : 1,
                flexShrink: 0,
              }}
            >
              <CheckCircle size={12} />
              {actionLoading === "approve" ? "…" : "Approve"}
            </button>
          )}

          {/* Reject button */}
          {isActionable && (
            <button
              onClick={handleReject}
              disabled={actionLoading !== null}
              title="Reject"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                borderRadius: "6px",
                border: "1px solid rgba(248,113,113,0.35)",
                background: "rgba(248,113,113,0.1)",
                color: "#f87171",
                fontSize: "12px",
                fontWeight: 600,
                cursor: actionLoading ? "not-allowed" : "pointer",
                opacity: actionLoading ? 0.6 : 1,
                flexShrink: 0,
              }}
            >
              <XCircle size={12} />
              {actionLoading === "reject" ? "…" : "Reject"}
            </button>
          )}
        </div>
      </div>

      {/* Content Preview Modal */}
      <ContentPreview
        piece={previewPiece}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onApprove={() => onStatusChange(item.id, "approved")}
        onReject={() => onStatusChange(item.id, "rejected")}
      />
    </>
  );
}
