"use client";

import {
  Twitter,
  Linkedin,
  Video,
  MessageSquare,
  Instagram,
  Mail,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";

export interface ContentPieceData {
  id: string;
  platform: string;
  content: string;
  status: string;
  approved: boolean;
  postedAt?: string | null;
  scheduledTime?: string;
}

interface PlatformStatusCardProps {
  piece: ContentPieceData;
  gateModeEnabled: boolean;
  onPreview: (piece: ContentPieceData) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const PLATFORM_META: Record<
  string,
  { label: string; icon: React.ReactNode; scheduledTime: string }
> = {
  twitter: {
    label: "Twitter / X",
    icon: <Twitter size={16} />,
    scheduledTime: "9:00 AM",
  },
  linkedin: {
    label: "LinkedIn",
    icon: <Linkedin size={16} />,
    scheduledTime: "10:00 AM",
  },
  video: {
    label: "Video",
    icon: <Video size={16} />,
    scheduledTime: "11:00 AM",
  },
  reddit: {
    label: "Reddit",
    icon: <MessageSquare size={16} />,
    scheduledTime: "12:00 PM",
  },
  instagram: {
    label: "Instagram",
    icon: <Instagram size={16} />,
    scheduledTime: "2:00 PM",
  },
  email: {
    label: "Email",
    icon: <Mail size={16} />,
    scheduledTime: "5:00 PM",
  },
};

const STATUS_STYLES: Record<
  string,
  { label: string; color: string; bg: string; pulse?: boolean }
> = {
  queued: { label: "Queued", color: "#a1a1aa", bg: "rgba(161,161,170,0.12)" },
  generating: {
    label: "Generating",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    pulse: true,
  },
  generated: {
    label: "Generated",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
  },
  approved: {
    label: "Approved",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.12)",
  },
  posting: {
    label: "Posting",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    pulse: true,
  },
  posted: {
    label: "Posted",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.12)",
  },
  failed: {
    label: "Failed",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
  },
  rejected: {
    label: "Rejected",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
  },
};

export function PlatformStatusCard({
  piece,
  gateModeEnabled,
  onPreview,
  onApprove,
  onReject,
}: PlatformStatusCardProps) {
  const meta = PLATFORM_META[piece.platform] ?? {
    label: piece.platform,
    icon: null,
    scheduledTime: "—",
  };
  const statusStyle = STATUS_STYLES[piece.status] ?? STATUS_STYLES.queued;
  const preview = piece.content
    ? piece.content.slice(0, 100) + (piece.content.length > 100 ? "…" : "")
    : "No content yet";

  const showApproveReject =
    gateModeEnabled && piece.status === "generated" && !piece.approved;

  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid #1e1e1e",
        borderRadius: "10px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#e4e4e7",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <span style={{ color: "#a1a1aa" }}>{meta.icon}</span>
          {meta.label}
        </div>
        <span style={{ fontSize: "12px", color: "#52525b" }}>
          {meta.scheduledTime}
        </span>
      </div>

      {/* Status badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {statusStyle.pulse && (
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: statusStyle.color,
              display: "inline-block",
              animation: "pulse 1.5s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
        )}
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
      </div>

      {/* Content preview */}
      <p
        style={{
          margin: 0,
          fontSize: "12px",
          color: "#71717a",
          lineHeight: "1.5",
          minHeight: "36px",
        }}
      >
        {preview}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={() => onPreview(piece)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 10px",
            borderRadius: "5px",
            border: "1px solid #2a2a2a",
            background: "transparent",
            color: "#a1a1aa",
            fontSize: "12px",
            cursor: "pointer",
            transition: "color 0.15s ease, border-color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#e4e4e7";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#3a3a3a";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2a";
          }}
        >
          <Eye size={12} />
          Preview
        </button>

        {showApproveReject && (
          <>
            <button
              onClick={() => onApprove(piece.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                borderRadius: "5px",
                border: "1px solid rgba(74,222,128,0.3)",
                background: "rgba(74,222,128,0.08)",
                color: "#4ade80",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              <CheckCircle size={12} />
              Approve
            </button>
            <button
              onClick={() => onReject(piece.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                borderRadius: "5px",
                border: "1px solid rgba(248,113,113,0.3)",
                background: "rgba(248,113,113,0.08)",
                color: "#f87171",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              <XCircle size={12} />
              Reject
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

/** Returns an empty placeholder card for platforms with no content piece yet */
export function PlatformStatusCardEmpty({
  platform,
}: {
  platform: string;
}) {
  const meta = PLATFORM_META[platform] ?? {
    label: platform,
    icon: null,
    scheduledTime: "—",
  };

  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid #1e1e1e",
        borderRadius: "10px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        opacity: 0.5,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#e4e4e7",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <span style={{ color: "#a1a1aa" }}>{meta.icon}</span>
          {meta.label}
        </div>
        <span style={{ fontSize: "12px", color: "#52525b" }}>
          {meta.scheduledTime}
        </span>
      </div>
      <span
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          color: "#a1a1aa",
          background: "rgba(161,161,170,0.12)",
          width: "fit-content",
        }}
      >
        NO CONTENT
      </span>
      <p style={{ margin: 0, fontSize: "12px", color: "#52525b" }}>
        Run the engine to generate content for this platform.
      </p>
    </div>
  );
}
