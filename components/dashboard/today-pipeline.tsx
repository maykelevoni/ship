"use client";

import type { ContentPieceData } from "./platform-status-card";

const PLATFORMS = [
  "twitter",
  "linkedin",
  "reddit",
  "instagram",
  "email",
] as const;

const PLATFORM_LABELS: Record<string, string> = {
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  instagram: "Instagram",
  email: "Email",
};

const STATUS_DOT: Record<string, string> = {
  posted: "#4ade80",
  generated: "#60a5fa",
  approved: "#818cf8",
  failed: "#f87171",
  rejected: "#f87171",
  queued: "#3f3f46",
};

interface ContentListProps {
  pieces: ContentPieceData[];
  gateModeEnabled: boolean;
  onPreview: (piece: ContentPieceData & { promotionName: string }) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ContentList({
  pieces,
  gateModeEnabled,
  onPreview,
  onApprove,
  onReject,
}: ContentListProps) {
  const byPlatform = new Map(pieces.map((p) => [p.platform, p]));

  return (
    <div>
      <p
        style={{
          margin: "0 0 10px",
          fontSize: "12px",
          fontWeight: 600,
          color: "#71717a",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        TODAY'S CONTENT
      </p>
      <div
        style={{
          background: "#111111",
          border: "1px solid #1e1e1e",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {PLATFORMS.map((platform, i) => {
          const piece = byPlatform.get(platform);
          return (
            <div
              key={platform}
              onClick={() =>
                piece && onPreview({ ...piece, promotionName: "" })
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 20px",
                borderBottom:
                  i < PLATFORMS.length - 1 ? "1px solid #1a1a1a" : "none",
                cursor: piece ? "pointer" : "default",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={(e) => {
                if (piece) {
                  e.currentTarget.style.background = "#161616";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Status dot */}
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: piece
                    ? (STATUS_DOT[piece.status] ?? "#3f3f46")
                    : "#1e1e1e",
                }}
              />

              {/* Platform name */}
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#a1a1aa",
                  minWidth: "100px",
                  flexShrink: 0,
                }}
              >
                {PLATFORM_LABELS[platform]}
              </span>

              {/* Status label */}
              <span
                style={{
                  fontSize: "12px",
                  color: "#52525b",
                  minWidth: "80px",
                  flexShrink: 0,
                  textTransform: "capitalize",
                }}
              >
                {piece ? piece.status : "—"}
              </span>

              {/* Content preview */}
              <span
                style={{
                  fontSize: "12px",
                  color: "#71717a",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {piece
                  ? piece.content.slice(0, 120)
                  : "No content yet"}
              </span>

              {/* Approve/Reject if gate + generated */}
              {piece &&
                gateModeEnabled &&
                piece.status === "generated" &&
                !piece.approved && (
                  <div
                    style={{ display: "flex", gap: "6px", flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onApprove(piece.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        border: "none",
                        background: "rgba(74,222,128,0.15)",
                        color: "#4ade80",
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(74,222,128,0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(74,222,128,0.15)";
                      }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => onReject(piece.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        border: "none",
                        background: "rgba(248,113,113,0.15)",
                        color: "#f87171",
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(248,113,113,0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(248,113,113,0.15)";
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
