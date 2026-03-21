"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleEntry {
  id: string;
  time: string;
  platform: string;
  daysOfWeek: string; // JSON string of int[]
  active: boolean;
  template: {
    id: string;
    name: string;
  };
}

interface CalendarPiece {
  id: string;
  platform: string;
  status: string;
}

interface CalendarDay {
  promotionId: string;
  promotionName: string;
  promotionType: string;
  pieces: CalendarPiece[];
}

type CalendarData = Record<string, CalendarDay>;

interface DayPanelProps {
  date: string | null; // "YYYY-MM-DD" or null (null = closed)
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_LABEL: Record<string, string> = {
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  reddit: "Reddit",
  email: "Email",
  tiktok: "TikTok",
  youtube: "YouTube",
  video: "Video",
};

const PLATFORM_EMOJI: Record<string, string> = {
  twitter: "🐦",
  linkedin: "💼",
  instagram: "📸",
  facebook: "📘",
  reddit: "🤖",
  email: "✉️",
  tiktok: "🎵",
  youtube: "▶️",
  video: "🎬",
};

function statusBadgeStyle(status: string): {
  label: string;
  color: string;
  bg: string;
} {
  if (status === "posted") {
    return { label: "Posted", color: "#4ade80", bg: "rgba(74,222,128,0.15)" };
  }
  if (status === "failed") {
    return { label: "Failed", color: "#f87171", bg: "rgba(248,113,113,0.15)" };
  }
  if (
    status === "queued" ||
    status === "generated" ||
    status === "approved"
  ) {
    return {
      label:
        status.charAt(0).toUpperCase() + status.slice(1),
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.15)",
    };
  }
  return { label: "Pending", color: "#71717a", bg: "rgba(113,113,122,0.15)" };
}

/**
 * Converts a "YYYY-MM-DD" date string into the JS day-of-week index (0=Sun … 6=Sat).
 * Uses UTC so there is no local-timezone shift from date parsing.
 */
function dateToDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

// ─── DayPanel ─────────────────────────────────────────────────────────────────

export function DayPanel({ date, onClose }: DayPanelProps) {
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [loading, setLoading] = useState(false);

  const isOpen = date !== null;

  useEffect(() => {
    if (!date) return;

    setLoading(true);
    setScheduleEntries([]);
    setCalendarData({});

    Promise.all([
      fetch("/api/schedule")
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => [] as ScheduleEntry[]),
      fetch(`/api/calendar?from=${date}&to=${date}`)
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({} as CalendarData)),
    ]).then(([entries, calData]) => {
      const dow = dateToDayOfWeek(date);
      const filtered = (entries as ScheduleEntry[]).filter((entry) => {
        if (!entry.active) return false;
        try {
          const days: number[] = JSON.parse(entry.daysOfWeek);
          return days.includes(dow);
        } catch {
          return false;
        }
      });
      setScheduleEntries(filtered);
      setCalendarData(calData as CalendarData);
      setLoading(false);
    });
  }, [date]);

  // Format header date: "March 21"
  const dateLabel = date
    ? (() => {
        const [year, month, day] = date.split("-").map(Number);
        return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
          "en-US",
          { month: "long", day: "numeric", timeZone: "UTC" }
        );
      })()
    : "";

  const dayData = date ? calendarData[date] : undefined;
  const pieces = dayData?.pieces ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={isOpen ? onClose : undefined}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 49,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.2s ease",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "360px",
          height: "100vh",
          background: "#0f0f0f",
          borderLeft: "1px solid #1a1a1a",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 20px 16px",
            borderBottom: "1px solid #1a1a1a",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "17px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            {dateLabel}
          </h2>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#71717a",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {loading ? (
            <p style={{ margin: 0, fontSize: "13px", color: "#52525b" }}>
              Loading…
            </p>
          ) : scheduleEntries.length === 0 ? (
            <p style={{ margin: 0, fontSize: "13px", color: "#52525b" }}>
              No posts scheduled for this day.
            </p>
          ) : (
            <>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#3f3f46",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Scheduled Posts
              </p>
              {scheduleEntries.map((entry) => {
                // Find matching ContentPiece for this platform
                const piece = pieces.find((p) => p.platform === entry.platform);
                const badge = piece
                  ? statusBadgeStyle(piece.status)
                  : statusBadgeStyle("pending");

                const emoji =
                  PLATFORM_EMOJI[entry.platform] ?? "📌";
                const platformLabel =
                  PLATFORM_LABEL[entry.platform] ?? entry.platform;

                return (
                  <div
                    key={entry.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "#111111",
                      border: "1px solid #1e1e1e",
                    }}
                  >
                    {/* Time */}
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6366f1",
                        minWidth: "38px",
                        flexShrink: 0,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {entry.time}
                    </span>

                    {/* Platform */}
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#a1a1aa",
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ marginRight: "5px" }}>{emoji}</span>
                      {platformLabel}
                    </span>

                    {/* Template name */}
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#52525b",
                        maxWidth: "90px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                      title={entry.template.name}
                    >
                      {entry.template.name}
                    </span>

                    {/* Status badge */}
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 7px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                        color: badge.color,
                        background: badge.bg,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </>
  );
}
