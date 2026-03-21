"use client";

import { useState, useCallback } from "react";
import { X, ChevronRight } from "lucide-react";
import { useStream, type StreamEvent } from "@/hooks/use-stream";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalendarPiece {
  id: string;
  platform: string;
  status: string;
}

export interface CalendarDay {
  promotionId: string;
  promotionName: string;
  promotionType: string;
  pieces: CalendarPiece[];
}

export type CalendarData = Record<string, CalendarDay>;

interface CalendarGridProps {
  data: CalendarData;
  year: number;
  month: number; // 0-indexed
  promotions: { id: string; name: string; type: string }[];
  onDayClick?: (date: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PLATFORMS = ["twitter", "linkedin", "video", "reddit", "instagram", "email"] as const;

type PromotionType = "product" | "service" | "affiliate" | "lead_magnet" | "content";

const TYPE_BADGE: Record<PromotionType, { label: string; color: string; bg: string }> = {
  product:    { label: "Product",     color: "#60a5fa", bg: "rgba(96,165,250,0.18)" },
  service:    { label: "Service",     color: "#60a5fa", bg: "rgba(96,165,250,0.18)" },
  affiliate:  { label: "Affiliate",   color: "#4ade80", bg: "rgba(74,222,128,0.18)" },
  lead_magnet:{ label: "Lead Magnet", color: "#c084fc", bg: "rgba(192,132,252,0.18)" },
  content:    { label: "Content",     color: "#a1a1aa", bg: "rgba(161,161,170,0.18)" },
};

function getTypeBadge(type: string) {
  return TYPE_BADGE[type as PromotionType] ?? TYPE_BADGE.content;
}

// ─── Status dot colour ────────────────────────────────────────────────────────

function dotColor(status: string): string {
  if (status === "posted")                         return "#4ade80";
  if (status === "queued" || status === "approved") return "#fbbf24";
  if (status === "failed")                          return "#f87171";
  return "#3f3f46";
}

// ─── Build month grid ─────────────────────────────────────────────────────────

/**
 * Returns an array of Date | null rows×7 where null = padding cell.
 * Weeks start on Monday (ISO).
 */
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  // getDay(): 0=Sun … 6=Sat → convert to Mon-based: Mon=0 … Sun=6
  const startPad = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  // Pad trailing cells to complete the last week
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ─── Day cell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  date: Date;
  dayData: CalendarDay | undefined;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function DayCell({ date, dayData, isToday, isPast, isSelected, onClick }: DayCellProps) {
  const badge = dayData ? getTypeBadge(dayData.promotionType) : null;
  const dayNum = date.getDate();

  // Build platform dot map: one dot per PLATFORM ordered list
  const pieceMap = new Map<string, string>();
  if (dayData) {
    for (const p of dayData.pieces) {
      if (!pieceMap.has(p.platform)) pieceMap.set(p.platform, p.status);
    }
  }

  return (
    <div
      onClick={onClick}
      style={{
        border: isToday || isSelected
          ? "1.5px solid #6366f1"
          : "1px solid #1a1a1a",
        borderRadius: "8px",
        background: isToday || isSelected
          ? "rgba(99,102,241,0.07)"
          : dayData
          ? "#0f0f0f"
          : "transparent",
        padding: "8px",
        minHeight: "80px",
        cursor: "pointer",
        opacity: isPast ? 0.55 : 1,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        transition: "border-color 0.12s ease, background 0.12s ease",
        position: "relative",
        ...(dayData || isSelected ? {} : { borderStyle: isToday ? "solid" : "dashed" }),
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#6366f1";
        (e.currentTarget as HTMLDivElement).style.borderStyle = "solid";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = isToday || isSelected
          ? "#6366f1"
          : "#1a1a1a";
        (e.currentTarget as HTMLDivElement).style.borderStyle = dayData || isToday || isSelected
          ? "solid"
          : "dashed";
      }}
    >
      {/* Day number */}
      <span
        style={{
          fontSize: "11px",
          fontWeight: isToday ? 700 : 500,
          color: isToday ? "#818cf8" : "#71717a",
          lineHeight: 1,
        }}
      >
        {dayNum}
      </span>

      {dayData && (
        <>
          {/* Promotion name */}
          <p
            style={{
              margin: 0,
              fontSize: "10px",
              fontWeight: 600,
              color: "#e4e4e7",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              lineHeight: 1.3,
            }}
          >
            {dayData.promotionName}
          </p>

          {/* Type badge */}
          {badge && (
            <span
              style={{
                alignSelf: "flex-start",
                padding: "1px 5px",
                borderRadius: "3px",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: badge.color,
                background: badge.bg,
                lineHeight: 1.4,
              }}
            >
              {badge.label.toUpperCase()}
            </span>
          )}

          {/* Platform status dots */}
          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginTop: "2px" }}>
            {PLATFORMS.map((platform) => {
              const status = pieceMap.get(platform) ?? "none";
              return (
                <div
                  key={platform}
                  title={`${platform}: ${status}`}
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: dotColor(status),
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────

interface DetailPanelProps {
  date: Date;
  dayData: CalendarDay | undefined;
  promotions: { id: string; name: string; type: string }[];
  onClose: () => void;
}

function DetailPanel({ date, dayData, promotions, onClose }: DetailPanelProps) {
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [selectedOverride, setSelectedOverride] = useState(dayData?.promotionId ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const badge = dayData ? getTypeBadge(dayData.promotionType) : null;

  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  async function handleSaveOverride() {
    if (!selectedOverride) return;
    setSaving(true);
    try {
      await fetch("/api/calendar/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: toDateKey(date),
          promotionId: selectedOverride,
        }),
      });
      setSaved(true);
      setOverrideOpen(false);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "relative",
          width: "360px",
          maxWidth: "100vw",
          height: "100%",
          background: "#0f0f0f",
          borderLeft: "1px solid #1e1e1e",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "20px 20px 16px",
            borderBottom: "1px solid #1e1e1e",
            gap: "12px",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#52525b", marginBottom: "4px" }}>
              {dateLabel}
            </p>
            {dayData ? (
              <>
                {badge && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      color: badge.color,
                      background: badge.bg,
                      marginBottom: "6px",
                    }}
                  >
                    {badge.label.toUpperCase()}
                  </span>
                )}
                <h2
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#e4e4e7",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {dayData.promotionName}
                </h2>
              </>
            ) : (
              <h2
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#52525b",
                }}
              >
                No promotion
              </h2>
            )}
          </div>
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
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Platform list */}
          {dayData && dayData.pieces.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
                Platforms
              </p>
              {PLATFORMS.map((platform) => {
                const piece = dayData.pieces.find((p) => p.platform === platform);
                const status = piece?.status ?? "none";
                const color = dotColor(status);
                const label =
                  status === "posted"   ? "Posted"   :
                  status === "queued"   ? "Queued"   :
                  status === "approved" ? "Approved" :
                  status === "failed"   ? "Failed"   :
                  status === "generated"? "Generated":
                  status === "rejected" ? "Rejected" :
                  "No content";
                return (
                  <div
                    key={platform}
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
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#a1a1aa",
                        textTransform: "capitalize",
                      }}
                    >
                      {platform}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color,
                      }}
                    >
                      {label}
                    </span>
                    {piece && (
                      <button
                        onClick={() =>
                          window.open(`/api/content/${piece.id}`, "_blank")
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "3px 7px",
                          borderRadius: "4px",
                          border: "1px solid #2a2a2a",
                          background: "transparent",
                          color: "#71717a",
                          fontSize: "10px",
                          fontWeight: 600,
                          cursor: "pointer",
                          gap: "3px",
                        }}
                      >
                        Preview
                        <ChevronRight size={10} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "13px", color: "#52525b" }}>
              No content pieces scheduled for this day.
            </p>
          )}

          {/* Override section */}
          <div
            style={{
              borderTop: "1px solid #1e1e1e",
              paddingTop: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
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
              Override Promotion
            </p>
            {!overrideOpen ? (
              <button
                onClick={() => setOverrideOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "7px",
                  border: "1px solid #2a2a2a",
                  background: "transparent",
                  color: "#a1a1aa",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  width: "fit-content",
                }}
              >
                Override for this day
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <select
                  value={selectedOverride}
                  onChange={(e) => setSelectedOverride(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1px solid #2a2a2a",
                    background: "#111111",
                    color: "#e4e4e7",
                    fontSize: "13px",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="">— select promotion —</option>
                  {promotions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleSaveOverride}
                    disabled={saving || !selectedOverride}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: "7px",
                      border: "none",
                      background: saving || !selectedOverride ? "rgba(99,102,241,0.4)" : "#6366f1",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: saving || !selectedOverride ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? "Saving…" : saved ? "Saved!" : "Save Override"}
                  </button>
                  <button
                    onClick={() => setOverrideOpen(false)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "7px",
                      border: "1px solid #2a2a2a",
                      background: "transparent",
                      color: "#71717a",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────

export function CalendarGrid({ data: initialData, year, month, promotions, onDayClick }: CalendarGridProps) {
  const [data, setData] = useState<CalendarData>(initialData);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const cells = buildMonthGrid(year, month);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // SSE: update piece statuses in real-time
  const handleEvent = useCallback((event: StreamEvent) => {
    const payload = event.payload as Record<string, unknown>;
    if (event.type === "content_piece_updated") {
      const id = payload?.id as string | undefined;
      const status = payload?.status as string | undefined;
      if (!id || !status) return;

      setData((prev) => {
        const next = { ...prev };
        for (const [dateKey, day] of Object.entries(next)) {
          const idx = day.pieces.findIndex((p) => p.id === id);
          if (idx !== -1) {
            const updatedPieces = [...day.pieces];
            updatedPieces[idx] = { ...updatedPieces[idx], status };
            next[dateKey] = { ...day, pieces: updatedPieces };
          }
        }
        return next;
      });
    }
  }, []);

  useStream(handleEvent);

  const selectedDay = selectedDate ? data[toDateKey(selectedDate)] : undefined;

  return (
    <>
      {/* Day-of-week header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
          marginBottom: "6px",
        }}
      >
        {DAYS_OF_WEEK.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: "11px",
              fontWeight: 600,
              color: "#3f3f46",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
        }}
      >
        {cells.map((date, i) =>
          date === null ? (
            <div key={`pad-${i}`} style={{ minHeight: "80px" }} />
          ) : (
            <DayCell
              key={date.toISOString()}
              date={date}
              dayData={data[toDateKey(date)]}
              isToday={date.getTime() === today.getTime()}
              isPast={date < today}
              isSelected={
                selectedDate !== null &&
                selectedDate.getTime() === date.getTime()
              }
              onClick={() => {
                setSelectedDate(date);
                if (onDayClick) onDayClick(toDateKey(date));
              }}
            />
          ),
        )}
      </div>

      {/* Detail panel slide-in */}
      {selectedDate && (
        <DetailPanel
          date={selectedDate}
          dayData={selectedDay}
          promotions={promotions}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  );
}
