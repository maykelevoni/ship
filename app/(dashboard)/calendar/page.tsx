"use client";

import { useState, useEffect } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarGrid, type CalendarData } from "@/components/dashboard/calendar-grid";

interface Promotion {
  id: string;
  name: string;
  type: string;
}

function getMonthRange(year: number, month: number) {
  const from = new Date(year, month, 1).toISOString().slice(0, 10);
  const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [data, setData] = useState<CalendarData>({});
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { from, to } = getMonthRange(year, month);

    Promise.all([
      fetch(`/api/calendar?from=${from}&to=${to}`).then((r) => r.ok ? r.json() : {}),
      fetch("/api/promotions?status=active&limit=100").then((r) => r.ok ? r.json() : { data: [] }),
    ])
      .then(([calData, promoData]) => {
        setData(calData ?? {});
        setPromotions(promoData?.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <CalendarDays size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#e4e4e7" }}>Calendar</h1>
        </div>

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={prevMonth}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "32px", height: "32px", borderRadius: "7px",
              border: "1px solid #2a2a2a", background: "transparent",
              color: "#a1a1aa", cursor: "pointer",
            }}
          >
            <ChevronLeft size={15} />
          </button>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#e4e4e7", minWidth: "140px", textAlign: "center" }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "32px", height: "32px", borderRadius: "7px",
              border: "1px solid #2a2a2a", background: "transparent",
              color: "#a1a1aa", cursor: "pointer",
            }}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid #1a1a1a",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <span style={{ fontSize: "13px", color: "#3f3f46" }}>Loading calendar…</span>
          </div>
        ) : (
          <CalendarGrid
            data={data}
            year={year}
            month={month}
            promotions={promotions}
          />
        )}
      </div>
    </div>
  );
}
