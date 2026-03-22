"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePromos(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
  } catch {
    // ignore
  }
  return [];
}

function formatSentAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function truncateId(id: string): string {
  return id.length > 12 ? id.slice(0, 12) + "…" : id;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  let bg = "rgba(251,191,36,0.15)";
  let color = "#fbbf24";

  if (status === "approved") {
    bg = "rgba(99,102,241,0.15)";
    color = "#818cf8";
  } else if (status === "sent") {
    bg = "rgba(74,222,128,0.15)";
    color = "#4ade80";
  }

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "999px",
        background: bg,
        color,
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.03em",
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

// ─── Draft Card ───────────────────────────────────────────────────────────────

function DraftCard({
  draft,
  onUpdate,
}: {
  draft: EmailDraft;
  onUpdate: (updated: Partial<EmailDraft> & { id: string }) => void;
}) {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [promos, setPromos] = useState<string[]>(() => parsePromos(draft.suggestedPromos));
  const [sending, setSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<"sent" | "error" | null>(null);
  const [localStatus, setLocalStatus] = useState(draft.status);

  const handleSubjectBlur = useCallback(async (value: string) => {
    await fetch(`/api/email-drafts/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: value }),
    });
  }, [draft.id]);

  const handleBodyBlur = useCallback(async (value: string) => {
    await fetch(`/api/email-drafts/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: value }),
    });
  }, [draft.id]);

  const handleDismissPromo = useCallback(async (promoId: string) => {
    const updated = promos.filter((p) => p !== promoId);
    setPromos(updated);
    await fetch(`/api/email-drafts/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestedPromos: JSON.stringify(updated) }),
    });
    onUpdate({ id: draft.id, suggestedPromos: JSON.stringify(updated) });
  }, [draft.id, promos, onUpdate]);

  const handleSend = useCallback(async () => {
    setSending(true);
    setSendFeedback(null);
    try {
      const res = await fetch(`/api/email-drafts/${draft.id}/send`, {
        method: "POST",
      });
      if (res.ok) {
        setSendFeedback("sent");
        setLocalStatus("sent");
        onUpdate({ id: draft.id, status: "sent", sentAt: new Date().toISOString() });
      } else {
        setSendFeedback("error");
      }
    } catch {
      setSendFeedback("error");
    } finally {
      setSending(false);
    }
  }, [draft.id, onUpdate]);

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
    <div
      style={{
        background: "#0f0f0f",
        border: "1px solid #1a1a1a",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Card Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <StatusBadge status={localStatus} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {draft.blogPost.ghostUrl ? (
            <a
              href={draft.blogPost.ghostUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#e4e4e7",
                textDecoration: "none",
              }}
            >
              {draft.blogPost.title}
            </a>
          ) : (
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#e4e4e7",
              }}
            >
              {draft.blogPost.title}
            </span>
          )}
        </div>
        {localStatus === "sent" && draft.sentAt && (
          <span style={{ fontSize: "12px", color: "#52525b", flexShrink: 0 }}>
            Sent {formatSentAt(draft.sentAt)}
          </span>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
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
            onBlur={(e) => handleSubjectBlur(e.target.value)}
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
            onBlur={(e) => handleBodyBlur(e.target.value)}
            style={{
              ...inputStyle,
              minHeight: "300px",
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: "1.6",
            }}
          />
        </div>

        {/* Suggested Promos */}
        {promos.length > 0 && (
          <div>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "12px",
                fontWeight: 500,
                color: "#a1a1aa",
              }}
            >
              Suggested Promotions
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {promos.map((promoId, idx) => (
                <div
                  key={promoId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "#0a0a0a",
                    border: "1px solid #1a1a1a",
                    borderRadius: "7px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#a1a1aa" }}>
                    Promo #{idx + 1}{" "}
                    <span style={{ fontSize: "11px", color: "#52525b" }}>
                      ({truncateId(promoId)})
                    </span>
                  </span>
                  <button
                    onClick={() => handleDismissPromo(promoId)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "none",
                      border: "none",
                      color: "#52525b",
                      cursor: "pointer",
                      padding: "2px",
                      borderRadius: "4px",
                    }}
                    aria-label="Dismiss promo"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "4px" }}>
          <button
            onClick={handleSend}
            disabled={localStatus === "sent" || sending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
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
            <span style={{ fontSize: "13px", color: "#4ade80", fontWeight: 500 }}>
              Sent!
            </span>
          )}
          {sendFeedback === "error" && (
            <span style={{ fontSize: "13px", color: "#f87171", fontWeight: 500 }}>
              Send failed. Please try again.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmailDraftsPage() {
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDrafts = useCallback(async () => {
    try {
      const res = await fetch("/api/email-drafts");
      if (res.ok) {
        const data: EmailDraft[] = await res.json();
        setDrafts(data);
      } else {
        setError("Failed to load email drafts.");
      }
    } catch {
      setError("Failed to load email drafts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const handleDraftUpdate = useCallback((updated: Partial<EmailDraft> & { id: string }) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
    );
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 0",
        }}
      >
        <span style={{ fontSize: "13px", color: "#52525b" }}>Loading drafts…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 0",
        }}
      >
        <span style={{ fontSize: "13px", color: "#f87171" }}>{error}</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Mail size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 700,
            color: "#e4e4e7",
          }}
        >
          Email Drafts
        </h1>
      </div>

      {/* Empty state */}
      {drafts.length === 0 ? (
        <div
          style={{
            background: "#0f0f0f",
            border: "1px solid #1a1a1a",
            borderRadius: "12px",
            padding: "60px 24px",
            textAlign: "center",
          }}
        >
          <Mail size={32} style={{ color: "#2a2a2a", marginBottom: "12px" }} />
          <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>
            No email drafts yet. Drafts are generated automatically after the daily blog post.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {drafts.map((draft) => (
            <DraftCard key={draft.id} draft={draft} onUpdate={handleDraftUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
