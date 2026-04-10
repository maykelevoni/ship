"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink, Loader2, Plus } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Chapter {
  title: string;
  description: string;
  content?: string;
}

interface OwnProduct {
  id: string;
  title: string;
  description: string;
  outline: string;
  status: string;
  price: number;
  systemeProductId: string | null;
  systemeCheckoutUrl: string | null;
  promotionId: string | null;
  createdAt: string;
}

interface BlogPost {
  id: string;
  title: string;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  outline: { bg: "#1a1a1a", color: "#71717a" },
  writing: { bg: "#2d2200", color: "#f59e0b" },
  ready: { bg: "#0c1a2e", color: "#60a5fa" },
  published: { bg: "#0a1f0a", color: "#4ade80" },
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.outline;
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "capitalize",
        background: colors.bg,
        color: colors.color,
      }}
    >
      {status}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductStudioPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [product, setProduct] = useState<OwnProduct | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline edit state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editSystemeProductId, setEditSystemeProductId] = useState("");
  const [editSystemeCheckoutUrl, setEditSystemeCheckoutUrl] = useState("");

  // Outline actions
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [writingChapter, setWritingChapter] = useState<number | null>(null);

  // Publish
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Related posts (post-publish)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [addedPosts, setAddedPosts] = useState<Set<string>>(new Set());

  // ── Fetch product ─────────────────────────────────────────────────────────

  async function loadProduct() {
    setLoading(true);
    try {
      const res = await fetch(`/api/own-products/${id}`);
      if (!res.ok) throw new Error("Not found");
      const p: OwnProduct = await res.json();
      setProduct(p);
      setEditTitle(p.title);
      setEditDescription(p.description);
      setEditPrice(String(p.price));
      setEditSystemeProductId(p.systemeProductId ?? "");
      setEditSystemeCheckoutUrl(p.systemeCheckoutUrl ?? "");
      try {
        setChapters(JSON.parse(p.outline || "[]"));
      } catch {
        setChapters([]);
      }
      if (p.status === "published") {
        fetchRelatedPosts(p.title);
      }
    } catch {
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProduct();
  }, [id]);

  // ── Related posts (shown after publish) ──────────────────────────────────

  async function fetchRelatedPosts(title: string) {
    try {
      const res = await fetch("/api/posts?limit=20");
      if (!res.ok) return;
      const json = await res.json();
      const posts: BlogPost[] = (json.posts ?? json.data ?? []) as BlogPost[];
      const keyword = title.split(" ")[0].toLowerCase();
      setRelatedPosts(posts.filter((p) => p.title.toLowerCase().includes(keyword)));
    } catch {
      // silently fail
    }
  }

  // ── Save helpers ──────────────────────────────────────────────────────────

  async function patch(data: Record<string, unknown>) {
    await fetch(`/api/own-products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function saveTitle() {
    if (!editTitle.trim() || editTitle === product?.title) return;
    await patch({ title: editTitle.trim() });
    setProduct((p) => p ? { ...p, title: editTitle.trim() } : p);
  }

  async function saveDescription() {
    if (editDescription === product?.description) return;
    await patch({ description: editDescription });
    setProduct((p) => p ? { ...p, description: editDescription } : p);
  }

  async function savePrice() {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price === product?.price) return;
    await patch({ price });
    setProduct((p) => p ? { ...p, price } : p);
  }

  async function saveSystemeProductId() {
    if (editSystemeProductId === product?.systemeProductId) return;
    await patch({ systemeProductId: editSystemeProductId || null });
    setProduct((p) => p ? { ...p, systemeProductId: editSystemeProductId || null } : p);
  }

  async function saveSystemeCheckoutUrl() {
    if (editSystemeCheckoutUrl === product?.systemeCheckoutUrl) return;
    await patch({ systemeCheckoutUrl: editSystemeCheckoutUrl || null });
    setProduct((p) => p ? { ...p, systemeCheckoutUrl: editSystemeCheckoutUrl || null } : p);
  }

  async function saveChapters(updated: Chapter[]) {
    setChapters(updated);
    await patch({ outline: JSON.stringify(updated) });
  }

  // ── Generate outline ──────────────────────────────────────────────────────

  async function generateOutline() {
    if (chapters.length > 0) {
      if (!confirm("Regenerate? This will overwrite existing chapters.")) return;
    }
    setGeneratingOutline(true);
    try {
      const res = await fetch(`/api/own-products/${id}/generate-outline`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const json: { outline: Chapter[] } = await res.json();
      setChapters(json.outline);
      setProduct((p) => p ? { ...p, outline: JSON.stringify(json.outline) } : p);
    } catch {
      alert("Failed to generate outline. Please try again.");
    } finally {
      setGeneratingOutline(false);
    }
  }

  // ── Write chapter ─────────────────────────────────────────────────────────

  async function writeChapter(index: number) {
    setWritingChapter(index);
    try {
      const res = await fetch(`/api/own-products/${id}/write-chapter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterIndex: index }),
      });
      if (!res.ok) throw new Error("Failed");
      const json: { content: string; chapterIndex: number } = await res.json();
      const updated = chapters.map((c, i) =>
        i === json.chapterIndex ? { ...c, content: json.content } : c,
      );
      setChapters(updated);
      setProduct((p) => p ? { ...p, outline: JSON.stringify(updated) } : p);
    } catch {
      alert("Failed to write chapter. Please try again.");
    } finally {
      setWritingChapter(null);
    }
  }

  // ── Mark ready ────────────────────────────────────────────────────────────

  async function markReady() {
    await patch({ status: "ready" });
    setProduct((p) => p ? { ...p, status: "ready" } : p);
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  async function publishToGumroad() {
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch(`/api/own-products/${id}/publish`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setPublishError(json.error ?? "Publish failed");
        return;
      }
      setProduct((p) => p ? { ...p, status: "published", systemeCheckoutUrl: json.systemeCheckoutUrl, promotionId: json.promotionId } : p);
      if (product) fetchRelatedPosts(product.title);
    } catch {
      setPublishError("Publish failed. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  // ── Add recommendation to post ────────────────────────────────────────────

  async function addRecommendation(postId: string) {
    if (!product?.systemeCheckoutUrl) return;
    try {
      const appendText = `\n\n---\n**Recommended:** [${product.title}](${product.systemeCheckoutUrl})`;
      const postRes = await fetch(`/api/posts/${postId}`);
      if (!postRes.ok) return;
      const postData = await postRes.json();
      const currentContent = postData.content ?? postData.post?.content ?? "";
      await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: currentContent + appendText }),
      });
      setAddedPosts((prev) => new Set([...prev, postId]));
    } catch {
      // silently fail
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: "80px", borderRadius: "12px", background: "#1a1a1a" }} />
        ))}
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ textAlign: "center", padding: "64px", color: "#52525b" }}>
        <p>{error ?? "Product not found"}</p>
        <Link href="/products?tab=own" style={{ color: "#6366f1" }}>← Back to Products</Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", paddingBottom: "100px" }}>
      {/* Back link */}
      <Link
        href="/products?tab=own"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "13px",
          color: "#71717a",
          textDecoration: "none",
          width: "fit-content",
        }}
      >
        <ChevronLeft size={14} />
        Products
      </Link>

      {/* Header row */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={saveTitle}
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#e4e4e7",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid transparent",
              outline: "none",
              padding: "2px 0",
              flex: 1,
              minWidth: "200px",
            }}
            onFocus={(e) => (e.target.style.borderBottomColor = "#3f3f46")}
            onBlurCapture={(e) => (e.target.style.borderBottomColor = "transparent")}
          />
          <StatusBadge status={product.status} />
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "13px", color: "#52525b" }}>$</span>
            <input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              onBlur={savePrice}
              min="0"
              step="0.01"
              style={{
                width: "70px",
                fontSize: "13px",
                color: "#a1a1aa",
                background: "transparent",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                padding: "4px 8px",
                outline: "none",
              }}
            />
          </div>
        </div>
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          onBlur={saveDescription}
          placeholder="Product description…"
          rows={2}
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #1a1a1a",
            background: "#0a0a0a",
            color: "#a1a1aa",
            fontSize: "14px",
            outline: "none",
            resize: "vertical",
          }}
        />

        {/* Systeme.io fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#71717a" }}>
            Systeme.io (optional)
          </h3>
          <input
            type="text"
            value={editSystemeProductId}
            onChange={(e) => setEditSystemeProductId(e.target.value)}
            onBlur={saveSystemeProductId}
            placeholder="12345"
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #1a1a1a",
              background: "#0a0a0a",
              color: "#a1a1aa",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <div style={{ fontSize: "12px", color: "#52525b" }}>Systeme.io Product ID</div>
          <input
            type="text"
            value={editSystemeCheckoutUrl}
            onChange={(e) => setEditSystemeCheckoutUrl(e.target.value)}
            onBlur={saveSystemeCheckoutUrl}
            placeholder="https://yourname.systeme.io/checkout/..."
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #1a1a1a",
              background: "#0a0a0a",
              color: "#a1a1aa",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <div style={{ fontSize: "12px", color: "#52525b" }}>Systeme.io Checkout URL</div>
        </div>
      </div>

      {/* Chapters section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#e4e4e7" }}>
            Chapters {chapters.length > 0 && <span style={{ color: "#52525b", fontWeight: 400 }}>({chapters.length})</span>}
          </h2>
          <button
            onClick={generateOutline}
            disabled={generatingOutline}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: generatingOutline ? "#1a1a1a" : "#6366f1",
              color: generatingOutline ? "#52525b" : "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: generatingOutline ? "not-allowed" : "pointer",
            }}
          >
            {generatingOutline ? (
              <>
                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                Generating…
              </>
            ) : (
              chapters.length > 0 ? "Regenerate Outline" : "Generate Outline"
            )}
          </button>
        </div>

        {chapters.length === 0 && !generatingOutline && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              border: "1px dashed #2a2a2a",
              borderRadius: "12px",
              color: "#52525b",
              fontSize: "14px",
            }}
          >
            Click "Generate Outline" to create chapters using AI.
          </div>
        )}

        {chapters.map((chapter, index) => (
          <div
            key={index}
            style={{
              background: "#0f0f0f",
              border: "1px solid #1a1a1a",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  background: "#1a1a1a",
                  color: "#71717a",
                  fontSize: "11px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <input
                  value={chapter.title}
                  onChange={(e) => {
                    const updated = chapters.map((c, i) =>
                      i === index ? { ...c, title: e.target.value } : c,
                    );
                    setChapters(updated);
                  }}
                  onBlur={() => saveChapters(chapters)}
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#e4e4e7",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid #1a1a1a",
                    outline: "none",
                    padding: "2px 0",
                    width: "100%",
                  }}
                />
                <textarea
                  value={chapter.description}
                  onChange={(e) => {
                    const updated = chapters.map((c, i) =>
                      i === index ? { ...c, description: e.target.value } : c,
                    );
                    setChapters(updated);
                  }}
                  onBlur={() => saveChapters(chapters)}
                  rows={2}
                  style={{
                    fontSize: "13px",
                    color: "#71717a",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    resize: "vertical",
                    padding: 0,
                    width: "100%",
                  }}
                />
              </div>
              <button
                onClick={() => writeChapter(index)}
                disabled={writingChapter === index}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "1px solid #2a2a2a",
                  background: "transparent",
                  color: writingChapter === index ? "#52525b" : "#a1a1aa",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: writingChapter === index ? "not-allowed" : "pointer",
                  flexShrink: 0,
                }}
              >
                {writingChapter === index ? (
                  <>
                    <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                    Writing…
                  </>
                ) : (
                  chapter.content ? "Rewrite" : "Write"
                )}
              </button>
            </div>

            {chapter.content && (
              <textarea
                value={chapter.content}
                onChange={(e) => {
                  const updated = chapters.map((c, i) =>
                    i === index ? { ...c, content: e.target.value } : c,
                  );
                  setChapters(updated);
                }}
                onBlur={() => saveChapters(chapters)}
                rows={8}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #1a1a1a",
                  background: "#0a0a0a",
                  color: "#a1a1aa",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  resize: "vertical",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Related posts (post-publish) */}
      {product.status === "published" && relatedPosts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#e4e4e7" }}>
            Add to existing posts
          </h3>
          {relatedPosts.map((post) => (
            <div
              key={post.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "14px 16px",
                background: "#0f0f0f",
                border: "1px solid #1a1a1a",
                borderRadius: "10px",
              }}
            >
              <span style={{ fontSize: "14px", color: "#a1a1aa" }}>{post.title}</span>
              <button
                onClick={() => addRecommendation(post.id)}
                disabled={addedPosts.has(post.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: addedPosts.has(post.id) ? "#0a1f0a" : "#1a1a1a",
                  color: addedPosts.has(post.id) ? "#4ade80" : "#a1a1aa",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: addedPosts.has(post.id) ? "default" : "pointer",
                  flexShrink: 0,
                }}
              >
                {addedPosts.has(post.id) ? "✓ Added" : "Add Recommendation"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sticky action bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 24px",
          background: "#0a0a0a",
          borderTop: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "12px",
          zIndex: 40,
        }}
      >
        {product.status === "outline" && (
          <button
            onClick={markReady}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#0c1a2e",
              color: "#60a5fa",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Mark Ready
          </button>
        )}

        {product.status === "ready" && (
          <>
            {publishError && (
              <span style={{ fontSize: "13px", color: "#f87171" }}>{publishError}</span>
            )}
            <button
              onClick={publishToGumroad}
              disabled={publishing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: publishing ? "#1a1a1a" : "#6366f1",
                color: publishing ? "#52525b" : "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: publishing ? "not-allowed" : "pointer",
              }}
            >
              {publishing ? (
                <>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  Publishing…
                </>
              ) : (
                "Publish to Gumroad"
              )}
            </button>
          </>
        )}

        {product.status === "published" && product.systemeCheckoutUrl && (
          <>
            <span style={{ fontSize: "13px", color: "#4ade80" }}>✓ Published</span>
            <a
              href={product.systemeCheckoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid #2a2a2a",
                background: "transparent",
                color: "#a1a1aa",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <ExternalLink size={14} />
              View on Systeme.io
            </a>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
