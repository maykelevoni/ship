"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, RefreshCw, Search, TrendingUp, Zap } from "lucide-react";

import {
  BlogPostPreview,
  formatSourceLabel,
  getScoreBadgeStyle,
  getSourceBadgeStyle,
  ModalState,
  ResearchTopic,
  SOURCE_FILTERS,
  stripMarkdown,
} from "./research-types";

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

// ─── Generation Modal ─────────────────────────────────────────────────────────

function GenerationModal({
  modal,
  onClose,
  onApprove,
}: {
  modal: ModalState;
  onClose: () => void;
  onApprove: () => void;
}) {
  const router = useRouter();
  const canClose = modal.phase === "preview" || modal.phase === "complete";

  const excerpt = modal.post
    ? stripMarkdown(modal.post.content).slice(0, 300) +
      (modal.post.content.length > 300 ? "…" : "")
    : "";

  const wordCount = modal.post
    ? Math.round(modal.post.content.split(/\s+/).length)
    : 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "16px",
      }}
      onClick={(e) => {
        if (canClose && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid #2a2a2a",
          borderRadius: "12px",
          padding: "28px",
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          position: "relative",
        }}
      >
        {/* Close button — only on preview/complete */}
        {canClose && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "transparent",
              border: "none",
              color: "#52525b",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}

        {/* Phase: generating */}
        {modal.phase === "generating" && (
          <>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                padding: "8px 0",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "3px solid #1a1a1a",
                  borderTopColor: "#6366f1",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#e4e4e7",
                  }}
                >
                  Generating article…
                </p>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: "12px",
                    color: "#52525b",
                  }}
                >
                  {modal.topicTitle}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Phase: preview */}
        {modal.phase === "preview" && modal.post && (
          <>
            <div style={{ paddingRight: "24px" }}>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "11px",
                  color: "#52525b",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Article Preview
              </p>
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#e4e4e7",
                  lineHeight: 1.3,
                }}
              >
                {modal.post.title}
              </h2>
              {modal.post.seoDescription && (
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: "13px",
                    color: "#71717a",
                    lineHeight: 1.5,
                  }}
                >
                  {modal.post.seoDescription}
                </p>
              )}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  borderRadius: "5px",
                  background: "rgba(99,102,241,0.12)",
                  color: "#818cf8",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {wordCount} words
              </span>
            </div>

            <div
              style={{
                background: "#0a0a0a",
                border: "1px solid #1a1a1a",
                borderRadius: "8px",
                padding: "14px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#a1a1aa",
                  lineHeight: 1.6,
                }}
              >
                {excerpt}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  router.push(`/posts/${modal.post!.id}`);
                  onClose();
                }}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "1px solid #2a2a2a",
                  background: "transparent",
                  color: "#a1a1aa",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                View Article
              </button>
              <button
                onClick={onApprove}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#6366f1",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Approve &amp; Generate All
              </button>
            </div>
          </>
        )}

        {/* Phase: generating-pieces */}
        {modal.phase === "generating-pieces" && (
          <>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                padding: "8px 0",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "3px solid #1a1a1a",
                  borderTopColor: "#6366f1",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#e4e4e7",
                  textAlign: "center",
                }}
              >
                Generating social pieces, images, and video…
              </p>
            </div>
          </>
        )}

        {/* Phase: complete */}
        {modal.phase === "complete" && (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                padding: "8px 0",
                paddingRight: "24px",
              }}
            >
              <CheckCircle size={40} style={{ color: "#4ade80" }} />
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#e4e4e7",
                  }}
                >
                  {modal.count ?? 0} pieces created
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#71717a" }}>
                  Your content kit is ready
                </p>
              </div>
            </div>

            <div
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              <button
                onClick={onClose}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "1px solid #2a2a2a",
                  background: "transparent",
                  color: "#a1a1aa",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  router.push(
                    modal.postId
                      ? `/posts?blogPostId=${modal.postId}`
                      : "/posts",
                  );
                  onClose();
                }}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#6366f1",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                View in Posts
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ResearchTopicsTabProps {
  topics: ResearchTopic[];
  loading: boolean;
  onRefresh: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResearchTopicsTab({
  topics,
  loading,
  onRefresh,
}: ResearchTopicsTabProps) {
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generation state
  const [generatingTopicId, setGeneratingTopicId] = useState<string | null>(
    null,
  );
  const [generatedTopicIds, setGeneratedTopicIds] = useState<Set<string>>(
    new Set(),
  );
  const [topicErrors, setTopicErrors] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<ModalState | null>(null);

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
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Search failed.");
      }
    } catch {
      setError("Search failed.");
    }
    onRefresh();
    setSearching(false);
  }

  async function handleGenerateContent(topicId: string, topicTitle: string) {
    setGeneratingTopicId(topicId);
    setTopicErrors((prev) => {
      const next = { ...prev };
      delete next[topicId];
      return next;
    });

    setModal({ topicId, topicTitle, phase: "generating" });

    try {
      const res = await fetch(`/api/research/topics/${topicId}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setModal(null);
        setTopicErrors((prev) => ({
          ...prev,
          [topicId]: json.error ?? "Generation failed.",
        }));
      } else {
        const data = (await res.json()) as { post: BlogPostPreview };
        setModal({
          topicId,
          topicTitle,
          phase: "preview",
          post: data.post,
          postId: data.post.id,
        });
      }
    } catch {
      setModal(null);
      setTopicErrors((prev) => ({
        ...prev,
        [topicId]: "Generation failed.",
      }));
    } finally {
      setGeneratingTopicId(null);
    }
  }

  async function handleApproveAndGenerate() {
    if (!modal?.post) return;
    const postId = modal.post.id;
    setModal((prev) => (prev ? { ...prev, phase: "generating-pieces" } : prev));

    try {
      const res = await fetch(`/api/blog-posts/${postId}/generate-pieces`, {
        method: "POST",
      });
      if (res.ok) {
        const data = (await res.json()) as { count: number };
        setModal((prev) =>
          prev
            ? { ...prev, phase: "complete", count: data.count, postId }
            : prev,
        );
      } else {
        setModal((prev) =>
          prev ? { ...prev, phase: "complete", count: 0, postId } : prev,
        );
      }
    } catch {
      setModal((prev) =>
        prev ? { ...prev, phase: "complete", count: 0, postId } : prev,
      );
    }
  }

  function handleModalClose() {
    if (modal && (modal.phase === "preview" || modal.phase === "complete")) {
      if (modal.phase === "complete") {
        setGeneratedTopicIds((prev) => new Set(prev).add(modal.topicId));
      }
      setModal(null);
    }
  }

  // Filtered topics
  const filteredTopics =
    sourceFilter === "all"
      ? topics
      : topics.filter((t) => t.source.toLowerCase() === sourceFilter);

  // Source counts
  const sourceCounts: Record<string, number> = { all: topics.length };
  for (const t of topics) {
    const s = t.source.toLowerCase();
    sourceCounts[s] = (sourceCounts[s] ?? 0) + 1;
  }

  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

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
              style={{
                animation: searching ? "spin 1s linear infinite" : "none",
              }}
            />
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "#52525b" }}>
          Leave empty to fetch trending topics
        </p>
        {error && (
          <p style={{ margin: 0, fontSize: "12px", color: "#f87171" }}>
            {error}
          </p>
        )}
      </div>

      {/* Source filter chips */}
      {!loading && topics.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          {SOURCE_FILTERS.map(({ key, label }) => {
            const count = sourceCounts[key] ?? 0;
            if (key !== "all" && count === 0) return null;
            const isActive = sourceFilter === key;
            return (
              <button
                key={key}
                onClick={() => setSourceFilter(key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  border: "1px solid #1a1a1a",
                  background: isActive ? "#1a1a1a" : "transparent",
                  color: isActive ? "#e4e4e7" : "#71717a",
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  transition: "background 0.1s ease, color 0.1s ease",
                }}
              >
                {label}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "16px",
                    height: "16px",
                    padding: "0 3px",
                    borderRadius: "8px",
                    background: isActive ? "#2a2a2a" : "#1a1a1a",
                    color: isActive ? "#a1a1aa" : "#52525b",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

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

        {/* Filter info */}
        {!loading && sourceFilter !== "all" && (
          <p
            style={{
              margin: "-8px 0 0",
              fontSize: "12px",
              color: "#52525b",
            }}
          >
            Showing {filteredTopics.length} of {topics.length} topics
          </p>
        )}

        {/* States */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredTopics.length === 0 ? (
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
              {topics.length === 0
                ? "No research topics yet."
                : "No topics for this source."}
            </p>
            {topics.length === 0 && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "12px",
                  color: "#2a2a2a",
                }}
              >
                Enter a keyword above or leave empty to fetch trending topics.
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredTopics.map((topic) => {
              const isGenerating = generatingTopicId === topic.id;
              const isGenerated = generatedTopicIds.has(topic.id);
              const topicError = topicErrors[topic.id];
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

                    {/* Content Generated badge */}
                    {isGenerated && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          height: "20px",
                          padding: "0 7px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 600,
                          flexShrink: 0,
                          background: "rgba(74,222,128,0.12)",
                          color: "#4ade80",
                          border: "1px solid rgba(74,222,128,0.25)",
                        }}
                      >
                        <CheckCircle size={10} />
                        Content Generated
                      </span>
                    )}

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

                  {/* Topic-level error */}
                  {topicError && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#f87171",
                      }}
                    >
                      {topicError}
                    </p>
                  )}

                  {/* Bottom row: URL + Generate Content */}
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
                      onClick={() =>
                        !isGenerating &&
                        !isGenerated &&
                        handleGenerateContent(topic.id, topic.title)
                      }
                      disabled={isGenerating || isGenerated}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 12px",
                        borderRadius: "6px",
                        border: isGenerated
                          ? "1px solid rgba(74,222,128,0.3)"
                          : "1px solid rgba(99,102,241,0.4)",
                        background: isGenerated
                          ? "rgba(74,222,128,0.1)"
                          : "rgba(99,102,241,0.12)",
                        color: isGenerated ? "#4ade80" : "#818cf8",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor:
                          isGenerating || isGenerated
                            ? "not-allowed"
                            : "pointer",
                        opacity: isGenerating ? 0.7 : 1,
                        flexShrink: 0,
                        transition: "opacity 0.15s ease",
                      }}
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw
                            size={11}
                            style={{
                              animation: "spin 1s linear infinite",
                            }}
                          />
                          Generating…
                        </>
                      ) : isGenerated ? (
                        <>
                          <CheckCircle size={11} />
                          Content Generated
                        </>
                      ) : (
                        <>
                          <Zap size={11} />
                          Generate Content
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generation modal */}
      {modal && (
        <GenerationModal
          modal={modal}
          onClose={handleModalClose}
          onApprove={handleApproveAndGenerate}
        />
      )}
    </>
  );
}
