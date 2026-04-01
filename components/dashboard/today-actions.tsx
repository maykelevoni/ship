"use client";

import { useState } from "react";
import {
  CheckCircle,
  CheckSquare,
  FileText,
  Lightbulb,
  Loader2,
  Mail,
} from "lucide-react";

import type {
  PendingApproval,
  TodayBlogPost,
  TodayEmailDraft,
} from "./today-view";

interface TodayActionsProps {
  pendingApprovals: PendingApproval[];
  todayBlogPost: TodayBlogPost | null;
  emailDraft: TodayEmailDraft | null;
  newOpportunitiesCount: number;
  onApprovalAction: (id: string, action: "approve" | "reject") => void;
  onSendEmail: (id: string) => Promise<{ ok: boolean; message: string }>;
}

export function TodayActions({
  pendingApprovals,
  todayBlogPost,
  emailDraft: initialEmailDraft,
  newOpportunitiesCount,
  onApprovalAction,
  onSendEmail,
}: TodayActionsProps) {
  const [emailDraft, setEmailDraft] = useState<TodayEmailDraft | null>(
    initialEmailDraft,
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentMessage, setEmailSentMessage] = useState<string | null>(null);

  async function handleSendEmail(id: string) {
    setSendingEmail(true);
    setEmailSentMessage(null);
    const result = await onSendEmail(id);
    if (result.ok) {
      setEmailDraft((prev) => (prev ? { ...prev, status: "sent" } : prev));
    }
    setEmailSentMessage(result.message);
    setSendingEmail(false);
  }

  return (
    <div>
      <h3
        style={{
          margin: "0 0 12px",
          fontSize: "13px",
          fontWeight: 600,
          color: "#71717a",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Actions
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Card 1 — Approvals */}
        <div
          style={{
            background: "#111111",
            border: "1px solid #1e1e1e",
            borderTop:
              pendingApprovals.length > 0
                ? "2px solid #f59e0b"
                : "2px solid #1e1e1e",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <CheckSquare
              size={16}
              style={{ color: "#f59e0b", flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#a1a1aa",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Approvals
            </span>
          </div>
          {pendingApprovals.length > 0 ? (
            <>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: "14px",
                  color: "#e4e4e7",
                  fontWeight: 600,
                }}
              >
                {pendingApprovals.length} item
                {pendingApprovals.length !== 1 ? "s" : ""} need approval
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  marginBottom: "10px",
                }}
              >
                {pendingApprovals.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#71717a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {item.platform}: {item.content.slice(0, 40)}
                      {item.content.length > 40 ? "…" : ""}
                    </span>
                    <button
                      onClick={() => onApprovalAction(item.id, "approve")}
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        border: "none",
                        background: "rgba(245,158,11,0.15)",
                        color: "#f59e0b",
                        cursor: "pointer",
                        flexShrink: 0,
                        fontWeight: 600,
                      }}
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
              <a
                href="/promote"
                style={{
                  fontSize: "12px",
                  color: "#6366f1",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Review in Promote →
              </a>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle
                size={16}
                style={{ color: "#4ade80", flexShrink: 0 }}
              />
              <span style={{ fontSize: "14px", color: "#71717a" }}>
                All content approved
              </span>
            </div>
          )}
        </div>

        {/* Card 2 — Blog Post */}
        <div
          style={{
            background: "#111111",
            border: "1px solid #1e1e1e",
            borderTop: todayBlogPost
              ? "2px solid #818cf8"
              : "2px solid #1e1e1e",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <FileText size={16} style={{ color: "#818cf8", flexShrink: 0 }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#a1a1aa",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Blog Post
            </span>
          </div>
          {todayBlogPost ? (
            <>
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: "14px",
                  color: "#e4e4e7",
                  fontWeight: 600,
                  lineHeight: "1.4",
                }}
              >
                {todayBlogPost.title.length > 60
                  ? todayBlogPost.title.slice(0, 60) + "…"
                  : todayBlogPost.title}
              </p>
              <span
                style={{
                  display: "inline-block",
                  marginBottom: "10px",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color:
                    todayBlogPost.status === "published"
                      ? "#4ade80"
                      : "#fbbf24",
                  background:
                    todayBlogPost.status === "published"
                      ? "rgba(74,222,128,0.12)"
                      : "rgba(251,191,36,0.12)",
                }}
              >
                {todayBlogPost.status}
              </span>
              <br />
              <a
                href="/content"
                style={{
                  fontSize: "12px",
                  color: "#6366f1",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                View in Content →
              </a>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>
              No blog post today
            </p>
          )}
        </div>

        {/* Card 3 — Email Draft */}
        <div
          style={{
            background: "#111111",
            border: "1px solid #1e1e1e",
            borderTop:
              emailDraft && emailDraft.status !== "sent"
                ? "2px solid #60a5fa"
                : "2px solid #1e1e1e",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <Mail size={16} style={{ color: "#818cf8", flexShrink: 0 }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#a1a1aa",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Email Draft
            </span>
          </div>
          {emailDraft ? (
            emailDraft.status === "sent" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <CheckCircle
                  size={16}
                  style={{ color: "#4ade80", flexShrink: 0 }}
                />
                <span style={{ fontSize: "14px", color: "#71717a" }}>
                  Email already sent
                </span>
              </div>
            ) : (
              <>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "14px",
                    color: "#e4e4e7",
                    fontWeight: 600,
                    lineHeight: "1.4",
                  }}
                >
                  {emailDraft.subject}
                </p>
                {emailSentMessage && (
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: "12px",
                      color: emailSentMessage.includes("success")
                        ? "#4ade80"
                        : "#f87171",
                    }}
                  >
                    {emailSentMessage}
                  </p>
                )}
                <button
                  onClick={() => handleSendEmail(emailDraft.id)}
                  disabled={sendingEmail}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: sendingEmail
                      ? "rgba(99,102,241,0.4)"
                      : "#6366f1",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: sendingEmail ? "not-allowed" : "pointer",
                  }}
                >
                  {sendingEmail ? (
                    <Loader2
                      size={12}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <Mail size={12} />
                  )}
                  {sendingEmail ? "Sending…" : "Send Now"}
                </button>
              </>
            )
          ) : (
            <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>
              No unsent email draft today
            </p>
          )}
        </div>

        {/* Card 4 — Opportunities */}
        <div
          style={{
            background: "#111111",
            border: "1px solid #1e1e1e",
            borderTop:
              newOpportunitiesCount > 0
                ? "2px solid #fbbf24"
                : "2px solid #1e1e1e",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <Lightbulb size={16} style={{ color: "#fbbf24", flexShrink: 0 }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#a1a1aa",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Opportunities
            </span>
          </div>
          {newOpportunitiesCount > 0 ? (
            <>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: "14px",
                  color: "#e4e4e7",
                  fontWeight: 600,
                }}
              >
                {newOpportunitiesCount} new opportunit
                {newOpportunitiesCount !== 1 ? "ies" : "y"}
              </p>
              <a
                href="/content"
                style={{
                  fontSize: "12px",
                  color: "#6366f1",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Review →
              </a>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: "14px", color: "#52525b" }}>
              No new opportunities
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
