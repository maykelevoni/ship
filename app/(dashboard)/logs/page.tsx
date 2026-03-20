"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollText, ChevronDown } from "lucide-react";
import { LogEntry, type LogEntryData } from "@/components/dashboard/log-entry";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface LogsResponse {
  data: LogEntryData[];
  pagination: Pagination;
}

export default function LogsPage() {
  const [entries, setEntries] = useState<LogEntryData[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchLogs = useCallback(async (page: number, append = false) => {
    try {
      const res = await fetch(`/api/logs?page=${page}`);
      if (res.ok) {
        const json: LogsResponse = await res.json();
        setEntries((prev) => (append ? [...prev, ...json.data] : json.data));
        setPagination(json.pagination);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  async function handleLoadMore() {
    if (!pagination || pagination.page >= pagination.totalPages) return;
    setLoadingMore(true);
    await fetchLogs(pagination.page + 1, true);
  }

  const hasMore =
    pagination !== null && pagination.page < pagination.totalPages;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <ScrollText size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 700,
            color: "#e4e4e7",
          }}
        >
          Engine Logs
        </h1>
        {pagination && (
          <span
            style={{
              fontSize: "12px",
              color: "#3f3f46",
              fontWeight: 500,
              marginLeft: "4px",
            }}
          >
            {pagination.total} run{pagination.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

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
          <span style={{ fontSize: "13px", color: "#52525b" }}>Loading logs…</span>
        </div>
      ) : entries.length === 0 ? (
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
          <ScrollText size={36} style={{ color: "#27272a" }} />
          <p style={{ margin: 0, fontSize: "15px", color: "#3f3f46", fontWeight: 500 }}>
            No engine runs yet
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#27272a" }}>
            Run history will appear here after the engine fires.
          </p>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "0 18px 0 46px",
            }}
          >
            <span
              style={{
                minWidth: "120px",
                flexShrink: 0,
                fontSize: "10px",
                fontWeight: 700,
                color: "#3f3f46",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Date
            </span>
            <span
              style={{
                flex: 1,
                fontSize: "10px",
                fontWeight: 700,
                color: "#3f3f46",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Promotion
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#3f3f46",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                flexShrink: 0,
              }}
            >
              Status
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#3f3f46",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                flexShrink: 0,
              }}
            >
              Content
            </span>
          </div>

          {/* Log entries list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {entries.map((entry) => (
              <LogEntry key={entry.id} entry={entry} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "8px" }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 20px",
                  borderRadius: "7px",
                  border: "1px solid #2a2a2a",
                  background: "transparent",
                  color: "#71717a",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: loadingMore ? "not-allowed" : "pointer",
                  opacity: loadingMore ? 0.6 : 1,
                  transition: "border-color 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loadingMore) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#3f3f46";
                    (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2a";
                  (e.currentTarget as HTMLButtonElement).style.color = "#71717a";
                }}
              >
                <ChevronDown size={14} />
                {loadingMore ? "Loading…" : "Load More"}
              </button>
            </div>
          )}

          {/* Pagination info */}
          {pagination && (
            <p
              style={{
                margin: 0,
                textAlign: "center",
                fontSize: "11px",
                color: "#27272a",
              }}
            >
              Showing {entries.length} of {pagination.total} runs
            </p>
          )}
        </>
      )}
    </div>
  );
}
