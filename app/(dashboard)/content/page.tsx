"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Layers,
  TrendingUp,
  FileText,
  Mail,
  Lightbulb,
  RefreshCw,
  ShoppingCart,
  Tag,
  BookOpen,
  Wrench,
} from "lucide-react";

// ─── Shared types ─────────────────────────────────────────────────────────────

interface ResearchTopic {
  id: string;
  title: string;
  summary: string;
  source: string;
  score: number;
  url?: string;
  rationale?: string;
}

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

interface BlogPostRef {
  title: string;
  ghostUrl: string | null;
}

interface EmailDraft {
  id: string;
  blogPostId: string;
  blogPost: BlogPostRef;
  subject: string;
  body: string;
  suggestedPromos: string | null;
  status: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type OpportunityStatus = "new" | "acted" | "dismissed";
type OpportunityType = "affiliate" | "ghost_offer" | "digital_product" | "product_gap";

interface Opportunity {
  id: string;
  date: string;
  type: OpportunityType;
  title: string;
  rationale: string;
  searchQuery?: string | null;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({
  stepNumber,
  children,
}: {
  stepNumber: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#0f0f0f",
        border: "1px solid #1a1a1a",
        borderRadius: "10px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        position: "relative",
      }}
    >
      {/* Step badge */}
      <span
        style={{
          position: "absolute",
          top: "24px",
          right: "24px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "#6366f1",
          color: "#fff",
          fontSize: "11px",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {stepNumber}
      </span>
      {children}
    </div>
  );
}

// ─── Section 1: Research ──────────────────────────────────────────────────────

function ResearchSection() {
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
    <SectionCard stepNumber="1">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          paddingRight: "36px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={16} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h2
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            01 Research
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "7px",
            border: "1px solid #2a2a2a",
            background: "transparent",
            color: "#a1a1aa",
            fontSize: "12px",
            fontWeight: 600,
            cursor: refreshing || loading ? "not-allowed" : "pointer",
            opacity: refreshing || loading ? 0.6 : 1,
            transition: "border-color 0.15s ease, color 0.15s ease",
          }}
        >
          <RefreshCw
            size={13}
            style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}
          />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <span style={{ fontSize: "13px", color: "#52525b" }}>Loading research…</span>
        </div>
      ) : topics.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#3f3f46", fontWeight: 500 }}>
            No research data for today.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {topics.slice(0, 8).map((topic) => (
            <div
              key={topic.id}
              style={{
                background: "#0a0a0a",
                border: "1px solid #1a1a1a",
                borderRadius: "8px",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
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
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    height: "18px",
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
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#e4e4e7",
                    flex: 1,
                  }}
                >
                  {topic.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Section 2: Blog ──────────────────────────────────────────────────────────

function BlogStatusBadge({ status }: { status: string }) {
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

function BlogSection() {
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
    <SectionCard stepNumber="2">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          paddingRight: "36px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FileText size={16} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h2
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            02 Blog Post
          </h2>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating || loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "7px",
            border: "1px solid rgba(99,102,241,0.4)",
            background: "rgba(99,102,241,0.12)",
            color: "#6366f1",
            fontSize: "12px",
            fontWeight: 600,
            cursor: regenerating || loading ? "not-allowed" : "pointer",
            opacity: regenerating || loading ? 0.7 : 1,
            transition: "opacity 0.15s ease",
          }}
        >
          <RefreshCw
            size={13}
            style={{ animation: regenerating ? "spin 1s linear infinite" : "none" }}
          />
          {regenerating ? "Regenerating…" : "Regenerate"}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <span style={{ fontSize: "13px", color: "#52525b" }}>Loading…</span>
        </div>
      ) : post === null ? (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#3f3f46", fontWeight: 500 }}>
            No blog post for today.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Title + badge */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
            <h3
              style={{
                margin: 0,
                flex: 1,
                fontSize: "17px",
                fontWeight: 700,
                color: "#e4e4e7",
                lineHeight: 1.3,
              }}
            >
              {post.title}
            </h3>
            <BlogStatusBadge status={post.status} />
          </div>

          {/* SEO description */}
          {post.seoDescription && (
            <p
              style={{
                margin: 0,
                fontSize: "13px",
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
                gap: "4px",
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
          <pre
            style={{
              margin: 0,
              padding: "12px 14px",
              background: "#0a0a0a",
              border: "1px solid #1a1a1a",
              borderRadius: "7px",
              fontSize: "12px",
              lineHeight: 1.7,
              color: "#a1a1aa",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowY: "auto",
              maxHeight: "200px",
              fontFamily: "inherit",
            }}
          >
            {post.content.slice(0, 400)}
            {post.content.length > 400 && (
              <span style={{ color: "#52525b" }}>…</span>
            )}
          </pre>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Section 3: Email Draft ───────────────────────────────────────────────────

function EmailSection() {
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<"sent" | "error" | null>(null);
  const [localStatus, setLocalStatus] = useState("");

  const fetchDraft = useCallback(async () => {
    try {
      const res = await fetch("/api/email-drafts");
      if (res.ok) {
        const data: EmailDraft[] = await res.json();
        if (data.length > 0) {
          const d = data[0];
          setDraft(d);
          setSubject(d.subject);
          setBody(d.body);
          setLocalStatus(d.status);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      await fetch(`/api/email-drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleSend() {
    if (!draft) return;
    setSending(true);
    setSendFeedback(null);
    try {
      const res = await fetch(`/api/email-drafts/${draft.id}/send`, {
        method: "POST",
      });
      if (res.ok) {
        setSendFeedback("sent");
        setLocalStatus("sent");
      } else {
        setSendFeedback("error");
      }
    } catch {
      setSendFeedback("error");
    } finally {
      setSending(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
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
    <SectionCard stepNumber="3">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          paddingRight: "36px",
        }}
      >
        <Mail size={16} style={{ color: "#6366f1", flexShrink: 0 }} />
        <h2
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: 700,
            color: "#e4e4e7",
          }}
        >
          03 Email Draft
        </h2>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <span style={{ fontSize: "13px", color: "#52525b" }}>Loading draft…</span>
        </div>
      ) : draft === null ? (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#3f3f46", fontWeight: 500 }}>
            No email draft yet.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Subject */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "#a1a1aa",
                marginBottom: "6px",
              }}
            >
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Body */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "#a1a1aa",
                marginBottom: "6px",
              }}
            >
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: "200px",
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: "1.6",
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "7px 16px",
                borderRadius: "7px",
                border: "1px solid #2a2a2a",
                background: "transparent",
                color: "#a1a1aa",
                fontSize: "13px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving…" : "Save"}
            </button>

            <button
              onClick={handleSend}
              disabled={localStatus === "sent" || sending}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "7px 16px",
                borderRadius: "7px",
                border: "none",
                background: localStatus === "sent" ? "#1a1a1a" : "#6366f1",
                color: localStatus === "sent" ? "#52525b" : "#fff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: localStatus === "sent" || sending ? "not-allowed" : "pointer",
                opacity: sending ? 0.7 : 1,
                transition: "opacity 0.15s ease",
              }}
            >
              <Mail size={13} />
              {sending ? "Sending…" : localStatus === "sent" ? "Sent" : "Send"}
            </button>

            {sendFeedback === "sent" && (
              <span style={{ fontSize: "13px", color: "#4ade80", fontWeight: 500 }}>Sent!</span>
            )}
            {sendFeedback === "error" && (
              <span style={{ fontSize: "13px", color: "#f87171", fontWeight: 500 }}>
                Send failed.
              </span>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Section 4: Opportunities ─────────────────────────────────────────────────

const OPP_SECTIONS: {
  type: OpportunityType;
  label: string;
  Icon: React.ElementType;
}[] = [
  { type: "affiliate", label: "Affiliate", Icon: ShoppingCart },
  { type: "ghost_offer", label: "Ghost Offers", Icon: Tag },
  { type: "digital_product", label: "Digital Products", Icon: BookOpen },
  { type: "product_gap", label: "Product Gaps", Icon: Wrench },
];

const OPP_STATUS_STYLES: Record<OpportunityStatus, { background: string; color: string }> = {
  new: { background: "rgba(99,102,241,0.15)", color: "#818cf8" },
  acted: { background: "rgba(74,222,128,0.15)", color: "#4ade80" },
  dismissed: { background: "rgba(82,82,91,0.15)", color: "#71717a" },
};

function OppStatusBadge({ status }: { status: OpportunityStatus }) {
  const s = OPP_STATUS_STYLES[status] ?? OPP_STATUS_STYLES.new;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "capitalize",
        flexShrink: 0,
        background: s.background,
        color: s.color,
      }}
    >
      {status}
    </span>
  );
}

function OpportunitiesSection() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDismissed, setShowDismissed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/opportunities");
        if (res.ok) {
          const data: Opportunity[] = await res.json();
          setOpportunities(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleAction(id: string, status: "acted" | "dismissed") {
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      // silently fail
    }
  }

  const visible = showDismissed
    ? opportunities
    : opportunities.filter((o) => o.status !== "dismissed");

  const totalCount = opportunities.length;

  return (
    <SectionCard stepNumber="4">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          paddingRight: "36px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Lightbulb size={16} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h2
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            04 Opportunities
          </h2>
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            cursor: "pointer",
            fontSize: "12px",
            color: "#a1a1aa",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={showDismissed}
            onChange={(e) => setShowDismissed(e.target.checked)}
            style={{ cursor: "pointer", accentColor: "#6366f1" }}
          />
          Show dismissed
        </label>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <span style={{ fontSize: "13px", color: "#52525b" }}>Loading opportunities…</span>
        </div>
      ) : totalCount === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#3f3f46", fontWeight: 500 }}>
            No opportunities yet.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {OPP_SECTIONS.map((section) => {
            const items = visible.filter((o) => o.type === section.type);
            if (items.length === 0) return null;
            const { Icon, label } = section;
            return (
              <div
                key={section.type}
                style={{
                  background: "#0a0a0a",
                  border: "1px solid #1a1a1a",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                {/* Sub-section header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "10px 14px",
                    borderBottom: "1px solid #1a1a1a",
                  }}
                >
                  <Icon size={13} style={{ color: "#6366f1", flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#a1a1aa" }}>
                    {label}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "16px",
                      height: "16px",
                      padding: "0 3px",
                      borderRadius: "8px",
                      background: "#1a1a1a",
                      color: "#52525b",
                      fontSize: "10px",
                      fontWeight: 600,
                    }}
                  >
                    {items.length}
                  </span>
                </div>

                {/* Items */}
                {items.map((opp, idx) => (
                  <div
                    key={opp.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "12px 14px",
                      borderBottom: idx < items.length - 1 ? "1px solid #1a1a1a" : "none",
                    }}
                  >
                    <div style={{ paddingTop: "1px" }}>
                      <OppStatusBadge status={opp.status} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#e4e4e7",
                          lineHeight: 1.4,
                        }}
                      >
                        {opp.title}
                      </p>
                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: "12px",
                          color: "#a1a1aa",
                          lineHeight: 1.5,
                        }}
                      >
                        {opp.rationale}
                      </p>
                    </div>
                    {opp.status === "new" && (
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        <button
                          onClick={() => handleAction(opp.id, "acted")}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            border: "1px solid rgba(74,222,128,0.35)",
                            background: "rgba(74,222,128,0.1)",
                            color: "#4ade80",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Act
                        </button>
                        <button
                          onClick={() => handleAction(opp.id, "dismissed")}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            border: "1px solid rgba(82,82,91,0.35)",
                            background: "rgba(82,82,91,0.1)",
                            color: "#71717a",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Page heading */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Layers size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 700,
            color: "#e4e4e7",
          }}
        >
          Content
        </h1>
      </div>

      {/* Pipeline sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <ResearchSection />
        <BlogSection />
        <EmailSection />
        <OpportunitiesSection />
      </div>
    </div>
  );
}
