"use client";

import { useState, useEffect, useCallback } from "react";
import { ListTodo, CheckCheck, ShieldAlert } from "lucide-react";
import { QueueItem, type QueueItemData } from "@/components/dashboard/queue-item";

// Group items by their date string (YYYY-MM-DD)
function groupByDate(items: QueueItemData[]): [string, QueueItemData[]][] {
  const map = new Map<string, QueueItemData[]>();
  for (const item of items) {
    const day = item.date ? item.date.slice(0, 10) : "Unknown";
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(item);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function formatGroupLabel(dateStr: string): string {
  if (dateStr === "Unknown") return "Unknown Date";
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function QueuePage() {
  const [items, setItems] = useState<QueueItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [gateMode, setGateMode] = useState(false);
  const [approveAllLoading, setApproveAllLoading] = useState(false);
  const [approveAllProgress, setApproveAllProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/queue");
      if (res.ok) {
        const data: QueueItemData[] = await res.json();
        setItems(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setGateMode(data.gate_mode === "true" || data.gate_mode === true);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    fetchSettings();
  }, [fetchQueue, fetchSettings]);

  function handleStatusChange(id: string, newStatus: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: newStatus, approved: newStatus === "approved" }
          : item
      )
    );
  }

  const pendingItems = items.filter(
    (item) => item.status !== "approved" && item.status !== "rejected"
  );

  async function handleApproveAll() {
    if (pendingItems.length === 0) return;
    setApproveAllLoading(true);
    setApproveAllProgress({ done: 0, total: pendingItems.length });

    let done = 0;
    for (const item of pendingItems) {
      try {
        const res = await fetch(`/api/queue/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        });
        if (res.ok) {
          handleStatusChange(item.id, "approved");
        }
      } catch {
        // continue on error
      }
      done++;
      setApproveAllProgress({ done, total: pendingItems.length });
    }

    setApproveAllLoading(false);
    setApproveAllProgress(null);
  }

  // Only show non-rejected items in the queue view
  const visibleItems = items.filter((item) => item.status !== "rejected");
  const grouped = groupByDate(visibleItems);
  const totalCount = visibleItems.length;

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
          <ListTodo size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            Content Queue
          </h1>
          {totalCount > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "24px",
                height: "24px",
                padding: "0 7px",
                borderRadius: "12px",
                background: "#6366f1",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {totalCount}
            </span>
          )}
        </div>

        {/* Approve All button */}
        {pendingItems.length > 0 && (
          <button
            onClick={handleApproveAll}
            disabled={approveAllLoading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 16px",
              borderRadius: "7px",
              border: "1px solid rgba(74,222,128,0.35)",
              background: "rgba(74,222,128,0.1)",
              color: "#4ade80",
              fontSize: "13px",
              fontWeight: 600,
              cursor: approveAllLoading ? "not-allowed" : "pointer",
              opacity: approveAllLoading ? 0.7 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            <CheckCheck size={15} />
            {approveAllLoading && approveAllProgress
              ? `Approving… ${approveAllProgress.done}/${approveAllProgress.total}`
              : `Approve All (${pendingItems.length})`}
          </button>
        )}
      </div>

      {/* Gate Mode Banner */}
      {gateMode && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.25)",
            borderRadius: "8px",
          }}
        >
          <ShieldAlert size={16} style={{ color: "#fbbf24", flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "13px", color: "#fbbf24", fontWeight: 500 }}>
            Gate Mode is enabled — content must be approved before it will be posted.
          </p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 0",
          }}
        >
          <span style={{ fontSize: "13px", color: "#52525b" }}>Loading queue…</span>
        </div>
      ) : visibleItems.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 0",
            gap: "12px",
          }}
        >
          <ListTodo size={36} style={{ color: "#27272a" }} />
          <p style={{ margin: 0, fontSize: "15px", color: "#3f3f46", fontWeight: 500 }}>
            Queue is empty
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#27272a" }}>
            Content will appear here after the engine runs.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {grouped.map(([dateStr, dateItems]) => (
            <div key={dateStr}>
              {/* Date group header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#52525b",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {formatGroupLabel(dateStr)}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "#1a1a1a",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    color: "#3f3f46",
                    fontWeight: 500,
                  }}
                >
                  {dateItems.length} item{dateItems.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Items list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {dateItems.map((item) => (
                  <QueueItem
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
