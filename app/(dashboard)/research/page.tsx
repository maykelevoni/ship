"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";

interface ResearchTopic {
  id: string;
  title: string;
  summary: string;
  source: string;
  score: number;
  url?: string;
  rationale?: string;
}

function getScoreBadgeStyle(score: number): React.CSSProperties {
  if (score >= 8) {
    return {
      background: "rgba(74,222,128,0.15)",
      color: "#4ade80",
      border: "1px solid rgba(74,222,128,0.3)",
    };
  }
  if (score >= 5) {
    return {
      background: "rgba(251,191,36,0.15)",
      color: "#fbbf24",
      border: "1px solid rgba(251,191,36,0.3)",
    };
  }
  return {
    background: "rgba(248,113,113,0.15)",
    color: "#f87171",
    border: "1px solid rgba(248,113,113,0.3)",
  };
}

function getSourceBadgeStyle(source: string): React.CSSProperties {
  const s = source.toLowerCase();
  if (s === "youtube") {
    return { background: "#ef4444", color: "#ffffff" };
  }
  if (s === "reddit") {
    return { background: "#f97316", color: "#ffffff" };
  }
  if (s === "newsapi") {
    return { background: "#60a5fa", color: "#ffffff" };
  }
  return { background: "#3f3f46", color: "#a1a1aa" };
}

function formatSourceLabel(source: string): string {
  const s = source.toLowerCase();
  if (s === "youtube") return "YouTube";
  if (s === "reddit") return "Reddit";
  if (s === "newsapi") return "NewsAPI";
  return source;
}

export default function ResearchPage() {
  const [topics, setTopics] = useState<ResearchTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTopics = useCallback(async () => {
    try {
      const res = await fetch("/api/research");
      if (res.ok) {
        const data: ResearchTopic[] = await res.json();
        setTopics(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch("/api/research/refresh", { method: "POST" });
    } catch {
      // silently fail
    }
    setLoading(true);
    await fetchTopics();
    setRefreshing(false);
  }

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
          <TrendingUp size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            Research
          </h1>
          {topics.length > 0 && (
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
              {topics.length}
            </span>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 16px",
            borderRadius: "7px",
            border: "1px solid #2a2a2a",
            background: "transparent",
            color: "#a1a1aa",
            fontSize: "13px",
            fontWeight: 600,
            cursor: refreshing || loading ? "not-allowed" : "pointer",
            opacity: refreshing || loading ? 0.6 : 1,
            transition: "border-color 0.15s ease, color 0.15s ease",
          }}
        >
          <RefreshCw
            size={14}
            style={{
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
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
          <span style={{ fontSize: "13px", color: "#52525b" }}>
            Loading research…
          </span>
        </div>
      ) : topics.length === 0 ? (
        <div
          style={{
            background: "#0f0f0f",
            border: "1px solid #1a1a1a",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 32px",
            gap: "12px",
            textAlign: "center",
          }}
        >
          <TrendingUp size={36} style={{ color: "#27272a" }} />
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              color: "#3f3f46",
              fontWeight: 500,
            }}
          >
            No research data for today.
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#27272a" }}>
            Click Refresh to pull trending topics.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {topics.map((topic) => {
            const scoreBadgeStyle = getScoreBadgeStyle(topic.score);
            const sourceBadgeStyle = getSourceBadgeStyle(topic.source);

            return (
              <div
                key={topic.id}
                style={{
                  background: "#0f0f0f",
                  border: "1px solid #1a1a1a",
                  borderRadius: "12px",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {/* Top row: score badge + source badge + title */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Score badge */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "32px",
                      height: "22px",
                      padding: "0 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      flexShrink: 0,
                      ...scoreBadgeStyle,
                    }}
                  >
                    {topic.score}
                  </span>

                  {/* Source badge */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "20px",
                      padding: "0 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      flexShrink: 0,
                      ...sourceBadgeStyle,
                    }}
                  >
                    {formatSourceLabel(topic.source)}
                  </span>

                  {/* Title */}
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#e4e4e7",
                      flex: 1,
                    }}
                  >
                    {topic.title}
                  </span>
                </div>

                {/* Summary */}
                {topic.summary && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#a1a1aa",
                      lineHeight: "1.5",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {topic.summary}
                  </p>
                )}

                {/* URL */}
                {topic.url && (
                  <a
                    href={topic.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "12px",
                      color: "#6366f1",
                      textDecoration: "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "block",
                    }}
                  >
                    {topic.url}
                  </a>
                )}

                {/* Rationale */}
                {topic.rationale && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "#52525b",
                      fontStyle: "italic",
                      lineHeight: "1.4",
                    }}
                  >
                    {topic.rationale}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Keyframe style for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
