"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface LogEntryData {
  id: string;
  date: string;
  promotionName: string | null;
  status: string;
  contentCount: number;
  createdAt: string;
  log: string | null;
}

interface LogEntryProps {
  entry: LogEntryData;
}

const STATUS_STYLES: Record<
  string,
  { label: string; color: string; bg: string; pulse?: boolean }
> = {
  completed: {
    label: "Completed",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.12)",
  },
  running: {
    label: "Running",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    pulse: true,
  },
  failed: {
    label: "Failed",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
  },
};

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

export function LogEntry({ entry }: LogEntryProps) {
  const [expanded, setExpanded] = useState(false);

  const statusStyle = STATUS_STYLES[entry.status] ?? {
    label: entry.status,
    color: "#a1a1aa",
    bg: "rgba(161,161,170,0.12)",
  };
  const { date, time } = formatDateTime(entry.createdAt);
  const isFailed = entry.status === "failed";

  return (
    <div
      style={{
        background: "#111111",
        border: `1px solid ${isFailed ? "rgba(248,113,113,0.2)" : "#1e1e1e"}`,
        borderRadius: "10px",
        overflow: "hidden",
        transition: "border-color 0.15s ease",
      }}
    >
      {/* Row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          width: "100%",
          padding: "14px 18px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Expand arrow */}
        <span style={{ color: "#3f3f46", flexShrink: 0 }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>

        {/* Date + time */}
        <div style={{ minWidth: "120px", flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#d4d4d8", fontWeight: 500 }}>
            {date}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: "#52525b" }}>{time}</p>
        </div>

        {/* Promotion name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: entry.promotionName ? "#a1a1aa" : "#3f3f46",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {entry.promotionName ?? "—"}
          </p>
        </div>

        {/* Status badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 9px",
            borderRadius: "5px",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: statusStyle.color,
            background: statusStyle.bg,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {statusStyle.pulse && (
            <span
              style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#fbbf24",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          )}
          {statusStyle.label}
        </span>

        {/* Content count chip */}
        <span
          style={{
            display: "inline-block",
            padding: "3px 9px",
            borderRadius: "5px",
            fontSize: "11px",
            fontWeight: 600,
            color: "#71717a",
            background: "rgba(113,113,122,0.12)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {entry.contentCount} {entry.contentCount === 1 ? "piece" : "pieces"}
        </span>
      </button>

      {/* Expanded log */}
      {expanded && (
        <div
          style={{
            padding: "0 18px 16px",
            borderTop: "1px solid #1a1a1a",
          }}
        >
          {entry.log ? (
            <pre
              style={{
                margin: "12px 0 0",
                padding: "12px 14px",
                background: "#0a0a0a",
                border: `1px solid ${isFailed ? "rgba(248,113,113,0.2)" : "#1a1a1a"}`,
                borderRadius: "8px",
                fontSize: "11px",
                lineHeight: "1.7",
                color: isFailed ? "#fca5a5" : "#71717a",
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowX: "auto",
                maxHeight: "320px",
                overflowY: "auto",
              }}
            >
              {entry.log}
            </pre>
          ) : (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "12px",
                color: "#3f3f46",
                fontStyle: "italic",
              }}
            >
              No log output available.
            </p>
          )}
        </div>
      )}

      {/* Keyframe for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
