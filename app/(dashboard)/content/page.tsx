"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Video,
  Mail,
  ExternalLink,
  Zap,
  Twitter,
  Linkedin,
  MessageSquare,
  Instagram,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResearchTopic {
  title: string;
  source: string;
  score: number;
}

interface BlogPostListItem {
  id: string;
  date: string;
  title: string;
  seoDescription: string | null;
  status: string;
  ghostUrl: string | null;
  topic: ResearchTopic | null;
  piecesCount: number;
}

interface ContentPiece {
  id: string;
  platform: string;
  content: string;
  mediaPath: string | null;
  status: string;
}

interface EmailDraftDetail {
  id: string;
  subject: string;
  body: string;
  status: string;
}

interface BlogPostDetail {
  id: string;
  date: string;
  title: string;
  content: string;
  seoDescription: string | null;
  status: string;
  ghostUrl: string | null;
  topic: ResearchTopic | null;
  pieces: ContentPiece[];
  emailDraft: EmailDraftDetail | null;
  geoScore?: number | null;
}

// ─── Media URL helper ─────────────────────────────────────────────────────────

function mediaUrl(p: string): string {
  return "/" + p.replace("./", "");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SOURCE_STYLES: Record<string, { bg: string; color: string }> = {
  youtube:  { bg: "#ef4444", color: "#fff" },
  reddit:   { bg: "#f97316", color: "#fff" },
  newsapi:  { bg: "#60a5fa", color: "#fff" },
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  published: { bg: "rgba(74,222,128,0.15)",  color: "#4ade80", label: "Published" },
  draft:     { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24", label: "Draft"     },
  failed:    { bg: "rgba(248,113,113,0.15)", color: "#f87171", label: "Failed"    },
  generated: { bg: "rgba(96,165,250,0.15)",  color: "#60a5fa", label: "Generated" },
};

const PLATFORM_META: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  twitter:   { label: "Twitter / X", Icon: Twitter,       color: "#1d9bf0" },
  linkedin:  { label: "LinkedIn",    Icon: Linkedin,      color: "#0a66c2" },
  reddit:    { label: "Reddit",      Icon: MessageSquare, color: "#ff4500" },
  instagram: { label: "Instagram",   Icon: Instagram,     color: "#e1306c" },
  email:     { label: "Email",       Icon: Mail,          color: "#4ade80" },
};

const SOCIAL_PLATFORMS = ["twitter", "linkedin", "reddit", "instagram", "email"] as const;

function sourceBadge(source: string) {
  const s = SOURCE_STYLES[source.toLowerCase()] ?? { bg: "#3f3f46", color: "#a1a1aa" };
  return s;
}

function statusStyle(status: string) {
  return STATUS_STYLES[status] ?? STATUS_STYLES.draft;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function sourceLabel(source: string) {
  const map: Record<string, string> = { youtube: "YouTube", reddit: "Reddit", newsapi: "NewsAPI" };
  return map[source.toLowerCase()] ?? source;
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function doCopy() {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <button
      onClick={doCopy}
      title="Copy to clipboard"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 10px",
        borderRadius: "6px",
        border: "1px solid #2a2a2a",
        background: "transparent",
        color: copied ? "#4ade80" : "#71717a",
        fontSize: "11px",
        fontWeight: 600,
        cursor: "pointer",
        flexShrink: 0,
        transition: "color 0.15s",
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─── Piece status dot ─────────────────────────────────────────────────────────

function PieceDot({ status }: { status: string }) {
  const color =
    status === "posted"    ? "#4ade80" :
    status === "approved"  ? "#818cf8" :
    status === "generated" ? "#60a5fa" :
    status === "failed"    ? "#f87171" :
    "#3f3f46";
  return (
    <span
      title={status}
      style={{
        display: "inline-block",
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

// ─── Media indicator ──────────────────────────────────────────────────────────

function MediaChip({ label, hasMedia }: { label: string; hasMedia: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "5px",
        fontSize: "10px",
        fontWeight: 600,
        background: hasMedia ? "rgba(99,102,241,0.12)" : "rgba(82,82,91,0.1)",
        color: hasMedia ? "#818cf8" : "#3f3f46",
        border: `1px solid ${hasMedia ? "rgba(99,102,241,0.25)" : "rgba(82,82,91,0.2)"}`,
      }}
    >
      {label}
      {hasMedia ? " ✓" : " —"}
    </span>
  );
}

// ─── Blog post detail view ─────────────────────────────────────────────────────

function BlogPostDetailView({ post, onRefresh }: { post: BlogPostDetail; onRefresh: () => void }) {
  const [blogExpanded, setBlogExpanded] = useState(false);
  const [emailSubject, setEmailSubject] = useState(post.emailDraft?.subject ?? "");
  const [emailBody, setEmailBody] = useState(post.emailDraft?.body ?? "");
  const [emailStatus, setEmailStatus] = useState(post.emailDraft?.status ?? "");
  const [savingEmail, setSavingEmail] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<"sent" | "error" | null>(null);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [renderingVideo, setRenderingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const piecesByPlatform = (platform: string) =>
    post.pieces.filter((p) => p.platform === platform);

  const imageCard  = post.pieces.find((p) => p.platform === "image_card");
  const imageQuote = post.pieces.find((p) => p.platform === "image_quote");
  const videoPiece = post.pieces.find((p) => p.platform === "video");

  async function handleSaveEmail() {
    if (!post.emailDraft) return;
    setSavingEmail(true);
    try {
      await fetch(`/api/email-drafts/${post.emailDraft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: emailSubject, body: emailBody }),
      });
    } catch { /* silently fail */ }
    setSavingEmail(false);
  }

  async function handleSendEmail() {
    if (!post.emailDraft) return;
    setSendingEmail(true);
    setEmailFeedback(null);
    try {
      const res = await fetch(`/api/email-drafts/${post.emailDraft.id}/send`, { method: "POST" });
      if (res.ok) { setEmailFeedback("sent"); setEmailStatus("sent"); }
      else setEmailFeedback("error");
    } catch { setEmailFeedback("error"); }
    setSendingEmail(false);
  }

  async function handleGenerateImages() {
    setGeneratingImages(true);
    setImagesError(null);
    try {
      const res = await fetch(`/api/blog-posts/${post.id}/generate-images`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        setImagesError(err.error ?? "Generation failed");
        console.error("Generate images failed:", err.error);
      } else {
        onRefresh();
      }
    } catch (e) {
      setImagesError("Generation failed");
      console.error("Generate images error:", e);
    } finally {
      setGeneratingImages(false);
    }
  }

  async function handleRenderVideo() {
    setRenderingVideo(true);
    setVideoError(null);
    try {
      const res = await fetch(`/api/blog-posts/${post.id}/render-video`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        setVideoError(err.error ?? "Render failed");
        console.error("Render video failed:", err.error);
      } else {
        onRefresh();
      }
    } catch (e) {
      setVideoError("Render failed");
      console.error("Render video error:", e);
    } finally {
      setRenderingVideo(false);
    }
  }

  const sectionStyle: React.CSSProperties = {
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "8px",
    overflow: "hidden",
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderBottom: "1px solid #1a1a1a",
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 700,
    color: "#52525b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: "7px",
    color: "#e4e4e7",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const geoColor =
    post.geoScore != null
      ? post.geoScore >= 7
        ? "#4ade80"
        : post.geoScore >= 4
          ? "#fbbf24"
          : "#f87171"
      : null;

  const geoBg =
    post.geoScore != null
      ? post.geoScore >= 7
        ? "rgba(74,222,128,0.15)"
        : post.geoScore >= 4
          ? "rgba(251,191,36,0.15)"
          : "rgba(248,113,113,0.15)"
      : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>

      {/* ── GEO Score ── */}
      {post.geoScore != null && geoColor && geoBg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#52525b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            GEO
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: geoColor,
              background: geoBg,
              padding: "2px 8px",
              borderRadius: "5px",
            }}
          >
            {post.geoScore}/10
          </span>
        </div>
      )}

      {/* ── Blog Post ── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <FileText size={12} style={{ color: "#6366f1", flexShrink: 0 }} />
          <span style={sectionLabelStyle}>Blog Post</span>
          {post.ghostUrl && (
            <a
              href={post.ghostUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "#6366f1", textDecoration: "none", marginLeft: "auto" }}
            >
              Ghost <ExternalLink size={10} />
            </a>
          )}
        </div>
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#e4e4e7", lineHeight: 1.4 }}>
            {post.title}
          </h3>
          {post.seoDescription && (
            <p style={{ margin: 0, fontSize: "12px", color: "#71717a", fontStyle: "italic", lineHeight: 1.5 }}>
              {post.seoDescription}
            </p>
          )}
          <div
            style={{
              padding: "10px 12px",
              background: "#111",
              border: "1px solid #1a1a1a",
              borderRadius: "6px",
              fontSize: "12px",
              color: "#a1a1aa",
              lineHeight: 1.7,
              maxHeight: blogExpanded ? "600px" : "120px",
              overflow: "hidden",
              transition: "max-height 0.2s ease",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {post.content.replace(/<[^>]+>/g, "")}
          </div>
          <button
            onClick={() => setBlogExpanded(!blogExpanded)}
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 0",
              border: "none",
              background: "transparent",
              color: "#6366f1",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {blogExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {blogExpanded ? "Show less" : "Read more"}
          </button>
        </div>
      </div>

      {/* ── Generated Assets ── */}
      {(imageCard || imageQuote || videoPiece) && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <ImageIcon size={12} style={{ color: "#6366f1", flexShrink: 0 }} />
            <span style={sectionLabelStyle}>Generated Assets</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
              {imagesError && (
                <span style={{ fontSize: 11, color: "#f87171" }}>{imagesError}</span>
              )}
              <button
                onClick={handleGenerateImages}
                disabled={generatingImages}
                style={{
                  padding: "3px 8px",
                  fontSize: 11,
                  borderRadius: 4,
                  border: "1px solid #2a2a2a",
                  background: "#1a1a1a",
                  color: "#a1a1aa",
                  cursor: generatingImages ? "not-allowed" : "pointer",
                  opacity: generatingImages ? 0.4 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {generatingImages && (
                  <span style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    border: "1.5px solid #6366f1",
                    borderTopColor: "transparent",
                    animation: "spin 0.7s linear infinite",
                  }} />
                )}
                {generatingImages ? "Generating..." : "Generate Images"}
              </button>
              {videoError && (
                <span style={{ fontSize: 11, color: "#f87171" }}>{videoError}</span>
              )}
              <button
                onClick={handleRenderVideo}
                disabled={renderingVideo || !videoPiece}
                style={{
                  padding: "3px 8px",
                  fontSize: 11,
                  borderRadius: 4,
                  border: "1px solid #2a2a2a",
                  background: "#1a1a1a",
                  color: "#a1a1aa",
                  cursor: renderingVideo || !videoPiece ? "not-allowed" : "pointer",
                  opacity: renderingVideo || !videoPiece ? 0.4 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {renderingVideo && (
                  <span style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    border: "1.5px solid #a855f7",
                    borderTopColor: "transparent",
                    animation: "spin 0.7s linear infinite",
                  }} />
                )}
                {renderingVideo ? "Rendering..." : "Render Video"}
              </button>
            </div>
          </div>
          <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {imageCard && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#71717a" }}>Image Card</span>
                  <PieceDot status={imageCard.status} />
                  {imageCard.mediaPath && <span style={{ fontSize: "10px", color: "#3f3f46" }}>Generated</span>}
                  <CopyButton text={imageCard.content} />
                </div>
                {imageCard.mediaPath ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <img
                      src={mediaUrl(imageCard.mediaPath)}
                      alt="Image Card"
                      style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 6, display: "block", marginTop: 6, border: "1px solid #1a1a1a" }}
                    />
                    <a
                      href={mediaUrl(imageCard.mediaPath)}
                      download
                      style={{ fontSize: 11, color: "#6366f1", textDecoration: "none" }}
                    >
                      Download
                    </a>
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#71717a", lineHeight: 1.5, padding: "8px 10px", background: "#111", borderRadius: "5px", border: "1px solid #1a1a1a" }}>
                    <span style={{ color: "#3f3f46", fontStyle: "italic" }}>Not generated yet</span>
                    <div style={{ marginTop: 4 }}>
                      {imageCard.content.slice(0, 200)}{imageCard.content.length > 200 && "…"}
                    </div>
                  </div>
                )}
              </div>
            )}
            {imageQuote && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#71717a" }}>Image Quote</span>
                  <PieceDot status={imageQuote.status} />
                  {imageQuote.mediaPath && <span style={{ fontSize: "10px", color: "#3f3f46" }}>Generated</span>}
                  <CopyButton text={imageQuote.content} />
                </div>
                {imageQuote.mediaPath ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <img
                      src={mediaUrl(imageQuote.mediaPath)}
                      alt="Image Quote"
                      style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 6, display: "block", marginTop: 6, border: "1px solid #1a1a1a" }}
                    />
                    <a
                      href={mediaUrl(imageQuote.mediaPath)}
                      download
                      style={{ fontSize: 11, color: "#6366f1", textDecoration: "none" }}
                    >
                      Download
                    </a>
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#71717a", lineHeight: 1.5, padding: "8px 10px", background: "#111", borderRadius: "5px", border: "1px solid #1a1a1a" }}>
                    <span style={{ color: "#3f3f46", fontStyle: "italic" }}>Not generated yet</span>
                    <div style={{ marginTop: 4 }}>
                      {imageQuote.content.slice(0, 200)}{imageQuote.content.length > 200 && "…"}
                    </div>
                  </div>
                )}
              </div>
            )}
            {videoPiece && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Video size={11} style={{ color: "#a855f7" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#71717a" }}>Video Script</span>
                  <PieceDot status={videoPiece.status} />
                  {videoPiece.mediaPath && <span style={{ fontSize: "10px", color: "#4ade80" }}>Rendered</span>}
                  <CopyButton text={videoPiece.content} />
                </div>
                {videoPiece.mediaPath ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <video
                      controls
                      src={mediaUrl(videoPiece.mediaPath)}
                      style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 6, display: "block", marginTop: 6, border: "1px solid #1a1a1a" }}
                    />
                    <a
                      href={mediaUrl(videoPiece.mediaPath)}
                      download
                      style={{ fontSize: 11, color: "#6366f1", textDecoration: "none" }}
                    >
                      Download
                    </a>
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#71717a", lineHeight: 1.5, padding: "8px 10px", background: "#111", borderRadius: "5px", border: "1px solid #1a1a1a", whiteSpace: "pre-wrap" }}>
                    <span style={{ color: "#3f3f46", fontStyle: "italic", display: "block", marginBottom: 4 }}>Not rendered yet</span>
                    {videoPiece.content.slice(0, 300)}{videoPiece.content.length > 300 && "…"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Social Copies ── */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <Layers size={12} style={{ color: "#6366f1", flexShrink: 0 }} />
          <span style={sectionLabelStyle}>Social Copies</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {SOCIAL_PLATFORMS.map((platform, idx) => {
            const pieces = piecesByPlatform(platform);
            const meta = PLATFORM_META[platform];
            const { Icon, label, color } = meta;
            const isEmpty = pieces.length === 0;

            return (
              <div
                key={platform}
                style={{
                  padding: "12px 14px",
                  borderBottom: idx < SOCIAL_PLATFORMS.length - 1 ? "1px solid #1a1a1a" : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  opacity: isEmpty ? 0.35 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon size={13} style={{ color, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#a1a1aa" }}>{label}</span>
                  {!isEmpty && pieces.map((p) => <PieceDot key={p.id} status={p.status} />)}
                  <div style={{ marginLeft: "auto", display: "flex", gap: "6px", alignItems: "center" }}>
                    <MediaChip label="img" hasMedia={!!imageCard?.mediaPath || !!imageQuote?.mediaPath} />
                    <MediaChip label="vid" hasMedia={!!videoPiece?.mediaPath} />
                    {!isEmpty && <CopyButton text={pieces[0].content} />}
                  </div>
                </div>

                {isEmpty ? (
                  <p style={{ margin: 0, fontSize: "12px", color: "#3f3f46" }}>No content generated</p>
                ) : (
                  pieces.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        fontSize: "13px",
                        color: "#c4c4c7",
                        lineHeight: 1.6,
                        padding: "10px 12px",
                        background: "#111",
                        borderRadius: "6px",
                        border: "1px solid #1a1a1a",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {platform === "email"
                        ? (() => {
                            const lines = p.content.split("\n");
                            const subjLine = lines.find((l) => l.startsWith("SUBJECT:"));
                            const bodyIdx = lines.findIndex((l) => l.startsWith("BODY:"));
                            if (subjLine || bodyIdx !== -1) {
                              return (
                                <>
                                  {subjLine && (
                                    <div style={{ marginBottom: "6px" }}>
                                      <span style={{ color: "#52525b", fontSize: "11px", fontWeight: 600 }}>SUBJECT </span>
                                      {subjLine.replace("SUBJECT:", "").trim()}
                                    </div>
                                  )}
                                  {bodyIdx !== -1 && (
                                    <div>
                                      <span style={{ color: "#52525b", fontSize: "11px", fontWeight: 600 }}>BODY </span>
                                      {lines.slice(bodyIdx + 1).join("\n").slice(0, 300)}
                                      {p.content.length > 300 && "…"}
                                    </div>
                                  )}
                                </>
                              );
                            }
                            return p.content.slice(0, 400) + (p.content.length > 400 ? "…" : "");
                          })()
                        : p.content.slice(0, 400) + (p.content.length > 400 ? "…" : "")
                      }
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Email Draft ── */}
      {post.emailDraft && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <Mail size={12} style={{ color: "#6366f1", flexShrink: 0 }} />
            <span style={sectionLabelStyle}>Email Draft</span>
            {emailStatus === "sent" && (
              <span style={{ marginLeft: "auto", fontSize: "11px", color: "#4ade80", fontWeight: 600 }}>Sent</span>
            )}
          </div>
          <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#52525b", marginBottom: "5px", fontWeight: 600 }}>Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#52525b", marginBottom: "5px", fontWeight: 600 }}>Body</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                style={{ ...inputStyle, minHeight: "160px", resize: "vertical", lineHeight: 1.6 }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={handleSaveEmail}
                disabled={savingEmail}
                style={{ padding: "6px 14px", borderRadius: "7px", border: "1px solid #2a2a2a", background: "transparent", color: "#a1a1aa", fontSize: "12px", fontWeight: 600, cursor: savingEmail ? "not-allowed" : "pointer", opacity: savingEmail ? 0.6 : 1 }}
              >
                {savingEmail ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleSendEmail}
                disabled={emailStatus === "sent" || sendingEmail}
                style={{ padding: "6px 14px", borderRadius: "7px", border: "none", background: emailStatus === "sent" ? "#1a1a1a" : "#6366f1", color: emailStatus === "sent" ? "#52525b" : "#fff", fontSize: "12px", fontWeight: 600, cursor: emailStatus === "sent" || sendingEmail ? "not-allowed" : "pointer" }}
              >
                {sendingEmail ? "Sending…" : emailStatus === "sent" ? "Sent" : "Send"}
              </button>
              {emailFeedback === "error" && (
                <span style={{ fontSize: "12px", color: "#f87171" }}>Send failed.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Blog Post Row ─────────────────────────────────────────────────────────────

function BlogPostRow({ post }: { post: BlogPostListItem }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog-posts/${post.id}`);
      if (res.ok) setDetail(await res.json());
    } catch { /* silently fail */ }
    setLoading(false);
  }

  async function handleToggle() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (detail) return;
    await fetchDetail();
  }

  const ss = statusStyle(post.status);
  const src = post.topic ? sourceBadge(post.topic.source) : null;

  return (
    <div
      style={{
        background: "#0f0f0f",
        border: "1px solid #1a1a1a",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      {/* Row header */}
      <button
        onClick={handleToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          flexWrap: "wrap",
        }}
      >
        {/* Date */}
        <span style={{ fontSize: "12px", color: "#52525b", flexShrink: 0, minWidth: "70px" }}>
          {fmtDate(post.date)}
        </span>

        {/* Source + score */}
        {post.topic && src && (
          <div style={{ display: "flex", gap: "5px", alignItems: "center", flexShrink: 0 }}>
            <span
              style={{
                padding: "1px 7px",
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: 700,
                background: src.bg,
                color: src.color,
              }}
            >
              {sourceLabel(post.topic.source)}
            </span>
            <span
              style={{
                padding: "1px 6px",
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: 700,
                background: post.topic.score >= 8 ? "rgba(74,222,128,0.15)" : post.topic.score >= 5 ? "rgba(251,191,36,0.15)" : "rgba(248,113,113,0.15)",
                color: post.topic.score >= 8 ? "#4ade80" : post.topic.score >= 5 ? "#fbbf24" : "#f87171",
              }}
            >
              {post.topic.score}
            </span>
          </div>
        )}

        {/* Topic + title */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
          {post.topic && (
            <p style={{ margin: 0, fontSize: "11px", color: "#52525b", lineHeight: 1.3 }}>
              {post.topic.title}
            </p>
          )}
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#e4e4e7", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {post.title}
          </p>
        </div>

        {/* Pieces count */}
        {post.piecesCount > 0 && (
          <span style={{ fontSize: "11px", color: "#3f3f46", flexShrink: 0 }}>
            {post.piecesCount} pieces
          </span>
        )}

        {/* Status */}
        <span
          style={{
            padding: "3px 9px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: 600,
            background: ss.bg,
            color: ss.color,
            flexShrink: 0,
          }}
        >
          {ss.label}
        </span>

        {/* Expand toggle */}
        <span style={{ color: "#52525b", flexShrink: 0 }}>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {/* Detail panel */}
      {open && (
        <div style={{ borderTop: "1px solid #1a1a1a" }}>
          {loading ? (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <span style={{ fontSize: "13px", color: "#3f3f46" }}>Loading content kit…</span>
            </div>
          ) : detail ? (
            <BlogPostDetailView post={detail} onRefresh={fetchDetail} />
          ) : (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <span style={{ fontSize: "13px", color: "#3f3f46" }}>Failed to load.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentPage() {
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [engineMsg, setEngineMsg] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/blog-posts");
      if (res.ok) setPosts(await res.json());
    } catch { /* silently fail */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function handleRunEngine() {
    setRunning(true);
    setEngineMsg(null);
    try {
      const res = await fetch("/api/engine/run", { method: "POST" });
      if (res.ok) {
        setEngineMsg("Engine started — refresh in a moment.");
        setTimeout(() => fetchPosts(), 8000);
      } else {
        setEngineMsg("Failed to start engine.");
      }
    } catch {
      setEngineMsg("Failed to start engine.");
    }
    setRunning(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Layers size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#e4e4e7" }}>Content</h1>
          {!loading && (
            <span style={{ fontSize: "13px", color: "#3f3f46" }}>{posts.length} posts</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {engineMsg && (
            <span style={{ fontSize: "12px", color: "#a1a1aa" }}>{engineMsg}</span>
          )}
          <button
            onClick={handleRunEngine}
            disabled={running}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: running ? "rgba(99,102,241,0.4)" : "#6366f1",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: running ? "not-allowed" : "pointer",
              transition: "opacity 0.15s",
            }}
          >
            <Zap size={14} style={{ animation: running ? "spin 1s linear infinite" : "none" }} />
            {running ? "Running…" : "Run Engine"}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Blog post list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: "64px", background: "#1a1a1a", borderRadius: "10px" }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "#0f0f0f",
            border: "1px solid #1a1a1a",
            borderRadius: "10px",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px", color: "#3f3f46", fontWeight: 500 }}>
            No blog posts yet. Run the engine to generate content.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {posts.map((post) => (
            <BlogPostRow key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
