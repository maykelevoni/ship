"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ExternalLink,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  Zap,
} from "lucide-react";

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

interface BlogPostPreview {
  id: string;
  title: string;
  seoDescription: string | null;
  content: string;
  slug: string | null;
}

type ModalPhase = "generating" | "preview" | "generating-pieces" | "complete";

interface ModalState {
  topicId: string;
  topicTitle: string;
  phase: ModalPhase;
  post?: BlogPostPreview;
  count?: number;
  postId?: string;
}

interface AffiliateProduct {
  name: string;
  platform: string;
  description: string;
  painPoints: string[];
  benefits: string[];
  commission: number;
  affiliateLink: string;
  targetAudience: string;
}

// ─── Source config ────────────────────────────────────────────────────────────

const SOURCE_FILTERS = [
  { key: "all", label: "All" },
  { key: "youtube", label: "YouTube" },
  { key: "reddit", label: "Reddit" },
  { key: "newsapi", label: "NewsAPI" },
  { key: "hackernews", label: "HackerNews" },
  { key: "trends", label: "Trends" },
] as const;

// ─── Platform badge colors ────────────────────────────────────────────────────

function getPlatformBadgeStyle(platform: string): React.CSSProperties {
  const p = platform.toLowerCase();
  if (p === "clickbank") return { background: "#dc2626", color: "#fff" };
  if (p === "jvzoo") return { background: "#16a34a", color: "#fff" };
  if (p === "shareasale") return { background: "#2563eb", color: "#fff" };
  if (p === "partnerstack") return { background: "#7c3aed", color: "#fff" };
  if (p === "gumroad") return { background: "#f59e0b", color: "#000" };
  return { background: "#3f3f46", color: "#a1a1aa" };
}

const PLATFORMS = [
  "ClickBank",
  "JVZoo",
  "ShareASale",
  "PartnerStack",
  "Gumroad",
] as const;

// ─── Badge helpers ─────────────────────────────────────────────────────────────

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
  if (s === "hackernews") return { background: "#f97316", color: "#ffffff" };
  if (s === "trends") return { background: "#14b8a6", color: "#ffffff" };
  return { background: "#3f3f46", color: "#a1a1aa" };
}

function formatSourceLabel(source: string): string {
  const s = source.toLowerCase();
  if (s === "youtube") return "YouTube";
  if (s === "reddit") return "Reddit";
  if (s === "newsapi") return "NewsAPI";
  if (s === "hackernews") return "HackerNews";
  if (s === "trends") return "Trends";
  return source;
}

// ─── Strip markdown for excerpt ───────────────────────────────────────────────

function stripMarkdown(text: string): string {
  return text
    .replace(/\[IMAGE:[^\]]*\]/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[.*?\]\(.*?\)/g, (m) => m.replace(/\[(.+?)\]\(.+?\)/, "$1"))
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResearchPage() {
  const [tab, setTab] = useState<"content" | "products">("content");
  const [topics, setTopics] = useState<ResearchTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Source filter
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Products tab state
  const [productKeyword, setProductKeyword] = useState("");
  const [productResults, setProductResults] = useState<AffiliateProduct[]>([]);
  const [productSearching, setProductSearching] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState<string>("all");
  const [addState, setAddState] = useState<Record<string, "adding" | string>>(
    {},
  );
  const [expandedPainPoints, setExpandedPainPoints] = useState<Set<string>>(
    new Set(),
  );
  const [expandedBenefits, setExpandedBenefits] = useState<Set<string>>(
    new Set(),
  );
  const [productKeywordSearched, setProductKeywordSearched] =
    useState<string>("");

  // Generation state
  const [generatingTopicId, setGeneratingTopicId] = useState<string | null>(
    null,
  );
  const [generatedTopicIds, setGeneratedTopicIds] = useState<Set<string>>(
    new Set(),
  );
  const [topicErrors, setTopicErrors] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<ModalState | null>(null);

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
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Search failed.");
      }
    } catch {
      setError("Search failed.");
    }
    setLoading(true);
    await fetchTopics();
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

  async function handleProductSearch() {
    if (!productKeyword.trim()) return;
    setProductSearching(true);
    setProductError(null);
    setProductResults([]);
    setProductKeywordSearched(productKeyword.trim());
    setProductFilter("all");
    try {
      const res = await fetch(
        `/api/research/products?keyword=${encodeURIComponent(productKeyword.trim())}`,
      );
      if (res.ok) {
        const data: AffiliateProduct[] = await res.json();
        setProductResults(data);
      } else {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setProductError(json.error ?? "Search failed.");
      }
    } catch {
      setProductError("Search failed.");
    } finally {
      setProductSearching(false);
    }
  }

  async function handleAddProduct(product: AffiliateProduct) {
    const key = product.name;
    setAddState((prev) => ({ ...prev, [key]: "adding" }));
    try {
      const res = await fetch("/api/research/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        const { promotionId } = (await res.json()) as { promotionId: string };
        setAddState((prev) => ({ ...prev, [key]: promotionId }));
      } else {
        setAddState((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    } catch {
      setAddState((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
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

  const filteredProductResults =
    productFilter === "all"
      ? productResults
      : productResults.filter(
          (p) => p.platform.toLowerCase() === productFilter.toLowerCase(),
        );

  const availablePlatforms = Array.from(
    new Set(productResults.map((p) => p.platform)),
  );

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

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "#0a0a0a",
          border: "1px solid #1a1a1a",
          borderRadius: "8px",
          padding: "4px",
          width: "fit-content",
        }}
      >
        {(["content", "products"] as const).map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 16px",
                borderRadius: "6px",
                border: "none",
                background: isActive ? "#1a1a1a" : "transparent",
                color: isActive ? "#e4e4e7" : "#71717a",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {t === "content" ? (
                <>
                  <TrendingUp size={13} />
                  Content
                </>
              ) : (
                <>
                  <Package size={13} />
                  Products
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content tab ── */}
      {tab === "content" && (
        <>
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
              <TrendingUp
                size={15}
                style={{ color: "#6366f1", flexShrink: 0 }}
              />
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
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
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
                    Enter a keyword above or leave empty to fetch trending
                    topics.
                  </p>
                )}
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
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
        </>
      )}

      {/* ── Products tab ── */}
      {tab === "products" && (
        <>
          {/* Search bar */}
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
                  value={productKeyword}
                  onChange={(e) => setProductKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !productSearching)
                      handleProductSearch();
                  }}
                  placeholder="e.g. email marketing, weight loss, AI tools, crypto…"
                  style={{ ...inputStyle, paddingLeft: "30px" }}
                />
              </div>
              <button
                onClick={handleProductSearch}
                disabled={productSearching || !productKeyword.trim()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 18px",
                  borderRadius: "7px",
                  border: "none",
                  background:
                    productSearching || !productKeyword.trim()
                      ? "#1a1a1a"
                      : "#6366f1",
                  color:
                    productSearching || !productKeyword.trim()
                      ? "#52525b"
                      : "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor:
                    productSearching || !productKeyword.trim()
                      ? "not-allowed"
                      : "pointer",
                  flexShrink: 0,
                }}
              >
                <RefreshCw
                  size={13}
                  style={{
                    animation: productSearching
                      ? "spin 1s linear infinite"
                      : "none",
                  }}
                />
                {productSearching ? "Searching…" : "Search Products"}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#52525b" }}>
              AI will suggest real affiliate products with commission details
            </p>
            {productError && (
              <p style={{ margin: 0, fontSize: "12px", color: "#f87171" }}>
                {productError}
              </p>
            )}
          </div>

          {/* Platform filter chips */}
          {productResults.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {["all", ...availablePlatforms].map((platform) => {
                const isAll = platform === "all";
                const filterKey = isAll ? "all" : platform.toLowerCase();
                const isActive = productFilter === filterKey;
                const count = isAll
                  ? productResults.length
                  : productResults.filter(
                      (r) => r.platform.toLowerCase() === filterKey,
                    ).length;
                return (
                  <button
                    key={platform}
                    onClick={() => setProductFilter(filterKey)}
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
                    }}
                  >
                    {isAll ? "All" : platform}
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

          {/* Product cards */}
          {productSearching ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "140px",
                    background: "#1a1a1a",
                    borderRadius: "10px",
                  }}
                />
              ))}
            </div>
          ) : filteredProductResults.length > 0 ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {filteredProductResults.map((product) => {
                const addKey = product.name;
                const addVal = addState[addKey];
                const isAdding = addVal === "adding";
                const isAdded = addVal !== undefined && addVal !== "adding";
                const isPainExpanded = expandedPainPoints.has(addKey);
                const isBenefitsExpanded = expandedBenefits.has(addKey);
                return (
                  <div
                    key={addKey}
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
                    {/* Top row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 700,
                          flexShrink: 0,
                          ...getPlatformBadgeStyle(product.platform),
                        }}
                      >
                        {product.platform}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#e4e4e7",
                          minWidth: "120px",
                        }}
                      >
                        {product.name}
                      </span>
                      {product.commission > 0 && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px 8px",
                            borderRadius: "5px",
                            background: "rgba(74,222,128,0.12)",
                            color: "#4ade80",
                            border: "1px solid rgba(74,222,128,0.25)",
                            fontSize: "11px",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {product.commission}% commission
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#a1a1aa",
                        lineHeight: 1.6,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {product.description}
                    </p>

                    {/* Pain Points */}
                    {product.painPoints?.length > 0 && (
                      <div>
                        <button
                          onClick={() =>
                            setExpandedPainPoints((prev) => {
                              const next = new Set(prev);
                              next.has(addKey)
                                ? next.delete(addKey)
                                : next.add(addKey);
                              return next;
                            })
                          }
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#71717a",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: "0",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {isPainExpanded ? "▾" : "▸"} Pain Points (
                          {product.painPoints.length})
                        </button>
                        {isPainExpanded && (
                          <ul
                            style={{
                              margin: "8px 0 0",
                              padding: "0 0 0 4px",
                              listStyle: "none",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            {product.painPoints.map((pt, i) => (
                              <li
                                key={i}
                                style={{
                                  fontSize: "12px",
                                  color: "#a1a1aa",
                                  lineHeight: 1.5,
                                }}
                              >
                                <span style={{ color: "#f87171" }}>✗ </span>
                                {pt}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Benefits */}
                    {product.benefits?.length > 0 && (
                      <div>
                        <button
                          onClick={() =>
                            setExpandedBenefits((prev) => {
                              const next = new Set(prev);
                              next.has(addKey)
                                ? next.delete(addKey)
                                : next.add(addKey);
                              return next;
                            })
                          }
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#71717a",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: "0",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {isBenefitsExpanded ? "▾" : "▸"} Benefits (
                          {product.benefits.length})
                        </button>
                        {isBenefitsExpanded && (
                          <ul
                            style={{
                              margin: "8px 0 0",
                              padding: "0 0 0 4px",
                              listStyle: "none",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            {product.benefits.map((b, i) => (
                              <li
                                key={i}
                                style={{
                                  fontSize: "12px",
                                  color: "#a1a1aa",
                                  lineHeight: 1.5,
                                }}
                              >
                                <span style={{ color: "#4ade80" }}>✓ </span>
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Target audience */}
                    {product.targetAudience && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          color: "#52525b",
                        }}
                      >
                        👥 {product.targetAudience}
                      </p>
                    )}

                    {/* Bottom row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginTop: "4px",
                      }}
                    >
                      {/* Affiliate link */}
                      <a
                        href={product.affiliateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "11px",
                          color: "#6366f1",
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLink size={11} />
                        Affiliate Program
                      </a>

                      {/* Add to Products button */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {isAdded && (
                          <Link
                            href="/products"
                            style={{
                              fontSize: "11px",
                              color: "#6366f1",
                              textDecoration: "none",
                            }}
                          >
                            → View in Products
                          </Link>
                        )}
                        <button
                          onClick={() =>
                            !isAdding && !isAdded && handleAddProduct(product)
                          }
                          disabled={isAdding || isAdded}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "5px 12px",
                            borderRadius: "6px",
                            border: isAdded
                              ? "1px solid rgba(74,222,128,0.3)"
                              : "1px solid rgba(99,102,241,0.4)",
                            background: isAdded
                              ? "rgba(74,222,128,0.1)"
                              : "rgba(99,102,241,0.12)",
                            color: isAdded ? "#4ade80" : "#818cf8",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor:
                              isAdding || isAdded ? "not-allowed" : "pointer",
                            flexShrink: 0,
                          }}
                        >
                          {isAdding ? (
                            <>
                              <RefreshCw
                                size={11}
                                style={{ animation: "spin 1s linear infinite" }}
                              />
                              Adding…
                            </>
                          ) : isAdded ? (
                            "Added ✓"
                          ) : (
                            "Add to Products"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                background: "#0f0f0f",
                border: "1px solid #1a1a1a",
                borderRadius: "10px",
                padding: "64px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                textAlign: "center",
              }}
            >
              <ShoppingBag size={36} style={{ color: "#2a2a2a" }} />
              {productKeywordSearched ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    color: "#3f3f46",
                    fontWeight: 500,
                  }}
                >
                  No products found for &ldquo;{productKeywordSearched}&rdquo;.
                  Try a different niche.
                </p>
              ) : (
                <>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#3f3f46",
                    }}
                  >
                    Search for affiliate products in your niche
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#2a2a2a" }}>
                    Enter a keyword like &ldquo;email marketing&rdquo;,
                    &ldquo;fitness&rdquo;, or &ldquo;AI tools&rdquo;
                  </p>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Generation modal */}
      {modal && (
        <GenerationModal
          modal={modal}
          onClose={handleModalClose}
          onApprove={handleApproveAndGenerate}
        />
      )}
    </div>
  );
}
