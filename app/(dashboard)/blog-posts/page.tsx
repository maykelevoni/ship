"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, RefreshCw } from "lucide-react";

interface BlogPost {
  id: string;
  date: string;
  topicId: string | null;
  title: string;
  slug: string | null;
  seoDescription: string | null;
  content: string;
  ghostId: string | null;
  ghostUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { background: string; color: string }> = {
    published: { background: "rgba(74,222,128,0.15)", color: "#4ade80" },
    draft: { background: "rgba(251,191,36,0.15)", color: "#fbbf24" },
    failed: { background: "rgba(248,113,113,0.15)", color: "#f87171" },
  };

  const style = styles[status] ?? styles.draft;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
        background: style.background,
        color: style.color,
        textTransform: "capitalize",
        letterSpacing: "0.02em",
      }}
    >
      {status}
    </span>
  );
}

export default function BlogPage() {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch("/api/blog");
      if (res.ok) {
        const data: BlogPost | null = await res.json();
        setPost(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/blog/regenerate", { method: "POST" });
      if (res.ok) {
        await fetchPost();
      }
    } catch {
      // silently fail
    } finally {
      setRegenerating(false);
    }
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
          <FileText size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            Blog
          </h1>
        </div>

        {/* Regenerate button */}
        <button
          onClick={handleRegenerate}
          disabled={regenerating || loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 16px",
            borderRadius: "7px",
            border: "1px solid rgba(99,102,241,0.4)",
            background: "rgba(99,102,241,0.12)",
            color: "#6366f1",
            fontSize: "13px",
            fontWeight: 600,
            cursor: regenerating || loading ? "not-allowed" : "pointer",
            opacity: regenerating || loading ? 0.7 : 1,
            transition: "opacity 0.15s ease",
          }}
        >
          <RefreshCw
            size={14}
            style={{
              animation: regenerating ? "spin 1s linear infinite" : "none",
            }}
          />
          {regenerating ? "Regenerating…" : "Regenerate"}
        </button>
      </div>

      {/* Spin keyframes */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

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
          <span style={{ fontSize: "13px", color: "#52525b" }}>Loading…</span>
        </div>
      ) : post === null ? (
        /* Empty state */
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
          <FileText size={36} style={{ color: "#27272a" }} />
          <p style={{ margin: 0, fontSize: "15px", color: "#3f3f46", fontWeight: 500 }}>
            No blog post for today
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#27272a" }}>
            No blog post for today. Click Regenerate to generate one.
          </p>
        </div>
      ) : (
        /* Post card */
        <div
          style={{
            background: "#0f0f0f",
            border: "1px solid #1a1a1a",
            borderRadius: "10px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Title row + badge */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flexWrap: "wrap" }}>
            <h2
              style={{
                margin: 0,
                flex: 1,
                fontSize: "20px",
                fontWeight: 700,
                color: "#e4e4e7",
                lineHeight: 1.3,
              }}
            >
              {post.title}
            </h2>
            <StatusBadge status={post.status} />
          </div>

          {/* SEO description */}
          {post.seoDescription && (
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#a1a1aa",
                fontStyle: "italic",
                lineHeight: 1.6,
              }}
            >
              {post.seoDescription}
            </p>
          )}

          {/* Ghost link */}
          {post.ghostUrl && (
            <a
              href={post.ghostUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#6366f1",
                textDecoration: "none",
              }}
            >
              View on Ghost →
            </a>
          )}

          {/* Content preview */}
          <div>
            <p
              style={{
                margin: "0 0 8px 0",
                fontSize: "11px",
                fontWeight: 700,
                color: "#52525b",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Content Preview
            </p>
            <pre
              style={{
                margin: 0,
                padding: "14px 16px",
                background: "#0a0a0a",
                border: "1px solid #1a1a1a",
                borderRadius: "7px",
                fontSize: "12px",
                lineHeight: 1.7,
                color: "#a1a1aa",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowY: "auto",
                maxHeight: "300px",
                fontFamily: "inherit",
              }}
            >
              {post.content.slice(0, 800)}
              {post.content.length > 800 && (
                <span style={{ color: "#52525b" }}>…</span>
              )}
            </pre>
          </div>

          {/* Metadata row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
              paddingTop: "4px",
              borderTop: "1px solid #1a1a1a",
            }}
          >
            <span style={{ fontSize: "12px", color: "#52525b" }}>
              <span style={{ color: "#3f3f46", fontWeight: 600 }}>Published at </span>
              {new Date(post.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
