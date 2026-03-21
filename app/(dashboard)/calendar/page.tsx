"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { CalendarGrid, type CalendarData } from "@/components/dashboard/calendar-grid";
import { DayPanel } from "@/components/dashboard/day-panel";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function firstDayOfMonth(year: number, month: number): string {
  return new Date(year, month, 1).toISOString().slice(0, 10);
}

function lastDayOfMonth(year: number, month: number): string {
  return new Date(year, month + 1, 0).toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const [data, setData] = useState<CalendarData>({});
  const [promotions, setPromotions] = useState<{ id: string; name: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetch calendar data whenever month/year changes
  useEffect(() => {
    setLoading(true);
    const from = firstDayOfMonth(year, month);
    const to = lastDayOfMonth(year, month);

    fetch(`/api/calendar?from=${from}&to=${to}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((json: CalendarData) => setData(json))
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, [year, month]);

  // Fetch promotions once for override select
  useEffect(() => {
    fetch("/api/promotions")
      .then((res) => (res.ok ? res.json() : []))
      .then((list: { id: string; name: string; type: string }[]) =>
        setPromotions(list.filter((p) => (p as { status?: string }).status !== "archived")),
      )
      .catch(() => setPromotions([]));
  }, []);

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goToToday() {
    const n = new Date();
    setYear(n.getFullYear());
    setMonth(n.getMonth());
  }

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <CalendarDays size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            Calendar
          </h1>
        </div>

        {/* Month navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!isCurrentMonth && (
            <button
              onClick={goToToday}
              style={{
                padding: "7px 14px",
                borderRadius: "7px",
                border: "1px solid #2a2a2a",
                background: "transparent",
                color: "#a1a1aa",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                marginRight: "4px",
              }}
            >
              Today
            </button>
          )}

          <button
            onClick={prevMonth}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "7px",
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#71717a",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <span
            style={{
              minWidth: "140px",
              textAlign: "center",
              fontSize: "15px",
              fontWeight: 600,
              color: "#e4e4e7",
            }}
          >
            {MONTH_NAMES[month]} {year}
          </span>

          <button
            onClick={nextMonth}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "7px",
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#71717a",
              cursor: "pointer",
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        {[
          { color: "#4ade80", label: "Posted" },
          { color: "#fbbf24", label: "Queued / Approved" },
          { color: "#f87171", label: "Failed" },
          { color: "#3f3f46", label: "No content" },
        ].map(({ color, label }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
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
            <span style={{ fontSize: "11px", color: "#52525b" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Grid area */}
      <div
        style={{
          background: "#0a0a0a",
          border: "1px solid #1a1a1a",
          borderRadius: "12px",
          padding: "20px",
          position: "relative",
        }}
      >
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(10,10,10,0.7)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: "13px", color: "#52525b" }}>Loading…</span>
          </div>
        )}

        <CalendarGrid
          data={data}
          year={year}
          month={month}
          promotions={promotions}
          onDayClick={(date) => setSelectedDate(date)}
        />
      </div>

      <DayPanel
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  );
}
