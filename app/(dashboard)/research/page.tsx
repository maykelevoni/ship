"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Search, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResearchTopic {
  id: string;
  title: string;
  summary: string;
  source: string;
  score: number;
  url?: string;
  rationale?: string;
}

// ─── Badge helpers (mirrors content/page.tsx) ─────────────────────────────────

function getScoreBadgeStyle(score: number): React.CSSProperties {
  if (score >= 8)
    return {
      background: "rgba(74,222,128,0.15)",
      color: "#4ade80",
      border: "1px solid rgba(74,222,128,0.3)",
    };
  if (score >= 5)
    return {
      background: "rgba(251,191,36,0.15)",
      color: "#fbbf24",
      border: "1px solid rgba(251,191,36,0.3)",
    };
  return {
    background: "rgba(248,113,113,0.15)",
    color: "#f87171",
    border: "1px solid rgba(248,113,113,0.3)",
  };
}

function getSourceBadgeStyle(source: string): React.CSSProperties {
  const s = source.toLowerCase();
  if (s === "youtube") return { background: "#ef4444", color: "#ffffff" };
  if (s === "reddit") return { background: "#f97316", color: "#ffffff" };
  if (s === "newsapi") return { background: "#60a5fa", color: "#ffffff" };
  return { background: "#3f3f46", color: "#a1a1aa" };
}

function formatSourceLabel(source: string): string {
  const s = source.toLowerCase();
  if (s === "youtube") return "YouTube";
  if (s === "reddit") return "Reddit";
  if (s === "newsapi") return "NewsAPI";
  return source;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      style={{
        height: "72px",
        background: "#1a1a1a",
        borderRadius: "8px",
      }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResearchPage() {
  const [topics, setTopics] = useState<ResearchTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [creatingPostId, setCreatingPostId] = useState<string | null>(null);
  const [createdPostIds, setCreatedPostIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

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

  async function handleSearch() {
    setSearching(true);
    setError(null);
    try {
      const body = keyword.trim() ? { keyword: keyword.trim() } : {};
      const res = await fetch("/api/research/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        setError(json.error ?? "Search failed.");
      }
    } catch {
      setError("Search failed.");
    }
    setLoading(true);
    await fetchTopics();
    setSearching(false);
  }

  async function handleCreatePost(topicId: string) {
    setCreatingPostId(topicId);
    try {
      const res = await fetch("/api/blog/regenerate", { method: "POST" });
      if (res.ok) {
        setCreatedPostIds((prev) => new Set(prev).add(topicId));
      }
    } catch {
      // silently fail
    } finally {
      setCreatingPostId(null);
    }
  }

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: "8px 12px",
    background: "#0a0a0a",
    border: "1px solid #2a2a2a",
    borderRadius: "7px",
    color: "#e4e4e7",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Page heading */}
      <div>
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
        </div>
        <p
          style={{
            margin: "4px 0 0 30px",
            fontSize: "13px",
            color: "#71717a",
          }}
        >
          Discover topics, trends, and niches
        </p>
      </div>

      {/* Search input */}
      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid #1a1a1a",
          borderRadius: "10px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#52525b",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !searching) handleSearch();
              }}
              placeholder="e.g. sourdough bread, AI tools, remote work…"
              style={{ ...inputStyle, paddingLeft: "30px" }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
              borderRadius: "7px",
              border: "none",
              background: searching || loading ? "#1a1a1a" : "#6366f1",
              color: searching || loading ? "#52525b" : "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: searching || loading ? "not-allowed" : "pointer",
              transition: "background 0.15s ease",
              flexShrink: 0,
            }}
          >
            <RefreshCw
              size={13}
              style={{ animation: searching ? "spin 1s linear infinite" : "none" }}
            />
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "#52525b" }}>
          Leave empty to fetch trending topics
        </p>
        {error && (
          <p style={{ margin: 0, fontSize: "12px", color: "#f87171" }}>{error}</p>
        )}
      </div>

      {/* Topics list */}
      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid #1a1a1a",
          borderRadius: "10px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={15} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h2
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            Topics
          </h2>
          {!loading && topics.length > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "20px",
                height: "20px",
                padding: "0 5px",
                borderRadius: "10px",
                background: "#1a1a1a",
                color: "#52525b",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              {topics.length}
            </span>
          )}
        </div>

        {/* States */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
            }}
          >
            <TrendingUp
              size={32}
              style={{ color: "#2a2a2a", marginBottom: "12px" }}
            />
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#3f3f46",
                fontWeight: 500,
              }}
            >
              No research topics yet.
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "#2a2a2a",
              }}
            >
              Enter a keyword above or leave empty to fetch trending topics.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topics.map((topic) => {
              const isCreating = creatingPostId === topic.id;
              const isCreated = createdPostIds.has(topic.id);
              return (
                <div
                  key={topic.id}
                  style={{
                    background: "#0a0a0a",
                    border: "1px solid #1a1a1a",
                    borderRadius: "8px",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {/* Top row: badges + title */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Score badge */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "28px",
                        height: "20px",
                        padding: "0 6px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        fontWeight: 700,
                        flexShrink: 0,
                        ...getScoreBadgeStyle(topic.score),
                      }}
                    >
                      {topic.score}
                    </span>

                    {/* Source badge */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        height: "20px",
                        padding: "0 7px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 600,
                        flexShrink: 0,
                        ...getSourceBadgeStyle(topic.source),
                      }}
                    >
                      {formatSourceLabel(topic.source)}
                    </span>

                    {/* Title */}
                    <span
                      style={{
                        flex: 1,
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#e4e4e7",
                        lineHeight: 1.4,
                        minWidth: "120px",
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
                        fontSize: "12px",
                        color: "#a1a1aa",
                        lineHeight: 1.6,
                      }}
                    >
                      {topic.summary}
                    </p>
                  )}

                  {/* Bottom row: URL + Create Post */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginTop: "2px",
                    }}
                  >
                    {topic.url ? (
                      <a
                        href={topic.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "11px",
                          color: "#6366f1",
                          textDecoration: "none",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "300px",
                        }}
                      >
                        {topic.url}
                      </a>
                    ) : (
                      <span />
                    )}

                    <button
                      onClick={() => handleCreatePost(topic.id)}
                      disabled={isCreating || isCreated}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 12px",
                        borderRadius: "6px",
                        border: isCreated
                          ? "1px solid rgba(74,222,128,0.3)"
                          : "1px solid rgba(99,102,241,0.4)",
                        background: isCreated
                          ? "rgba(74,222,128,0.1)"
                          : "rgba(99,102,241,0.12)",
                        color: isCreated ? "#4ade80" : "#818cf8",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: isCreating || isCreated ? "not-allowed" : "pointer",
                        opacity: isCreating ? 0.7 : 1,
                        flexShrink: 0,
                        transition: "opacity 0.15s ease",
                      }}
                    >
                      {isCreating ? (
                        <>
                          <RefreshCw
                            size={11}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                          Creating…
                        </>
                      ) : isCreated ? (
                        "Post Created"
                      ) : (
                        "Create Post"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
