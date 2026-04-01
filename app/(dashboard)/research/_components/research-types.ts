import type React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResearchTopic {
  id: string;
  title: string;
  summary: string;
  source: string;
  score: number;
  url?: string;
  rationale?: string;
}

export interface BlogPostPreview {
  id: string;
  title: string;
  seoDescription: string | null;
  content: string;
  slug: string | null;
}

export type ModalPhase =
  | "generating"
  | "preview"
  | "generating-pieces"
  | "complete";

export interface ModalState {
  topicId: string;
  topicTitle: string;
  phase: ModalPhase;
  post?: BlogPostPreview;
  count?: number;
  postId?: string;
}

export interface AffiliateProduct {
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

export const SOURCE_FILTERS = [
  { key: "all", label: "All" },
  { key: "youtube", label: "YouTube" },
  { key: "reddit", label: "Reddit" },
  { key: "newsapi", label: "NewsAPI" },
  { key: "hackernews", label: "HackerNews" },
  { key: "trends", label: "Trends" },
] as const;

// ─── Platform badge colors ────────────────────────────────────────────────────

export function getPlatformBadgeStyle(platform: string): React.CSSProperties {
  const p = platform.toLowerCase();
  if (p === "clickbank") return { background: "#dc2626", color: "#fff" };
  if (p === "jvzoo") return { background: "#16a34a", color: "#fff" };
  if (p === "shareasale") return { background: "#2563eb", color: "#fff" };
  if (p === "partnerstack") return { background: "#7c3aed", color: "#fff" };
  if (p === "gumroad") return { background: "#f59e0b", color: "#000" };
  return { background: "#3f3f46", color: "#a1a1aa" };
}

export const PLATFORMS = [
  "ClickBank",
  "JVZoo",
  "ShareASale",
  "PartnerStack",
  "Gumroad",
] as const;

// ─── Badge helpers ─────────────────────────────────────────────────────────────

export function getScoreBadgeStyle(score: number): React.CSSProperties {
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

export function getSourceBadgeStyle(source: string): React.CSSProperties {
  const s = source.toLowerCase();
  if (s === "youtube") return { background: "#ef4444", color: "#ffffff" };
  if (s === "reddit") return { background: "#f97316", color: "#ffffff" };
  if (s === "newsapi") return { background: "#60a5fa", color: "#ffffff" };
  if (s === "hackernews") return { background: "#f97316", color: "#ffffff" };
  if (s === "trends") return { background: "#14b8a6", color: "#ffffff" };
  return { background: "#3f3f46", color: "#a1a1aa" };
}

export function formatSourceLabel(source: string): string {
  const s = source.toLowerCase();
  if (s === "youtube") return "YouTube";
  if (s === "reddit") return "Reddit";
  if (s === "newsapi") return "NewsAPI";
  if (s === "hackernews") return "HackerNews";
  if (s === "trends") return "Trends";
  return source;
}

// ─── Strip markdown for excerpt ───────────────────────────────────────────────

export function stripMarkdown(text: string): string {
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
