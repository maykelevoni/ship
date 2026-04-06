"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Edit2, Archive, Pause, Play, AlertCircle } from "lucide-react";
import posthog from "posthog-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PromotionStatus = "active" | "paused" | "archived";
export type PromotionType =
  | "product"
  | "service"
  | "affiliate"
  | "lead_magnet"
  | "content";

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  status: PromotionStatus;
  description: string;
  url: string;
  weight: number;
}

interface PromotionCardProps {
  promotion: Promotion;
  onStatusChange: (id: string, status: PromotionStatus) => void;
  onArchive: (id: string) => void;
  onWeightChange: (id: string, weight: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<
  PromotionType,
  { label: string; color: string; bg: string }
> = {
  product: { label: "Product", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  service: { label: "Service", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  affiliate: {
    label: "Affiliate",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.12)",
  },
  lead_magnet: {
    label: "Lead Magnet",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.12)",
  },
  content: {
    label: "Content",
    color: "#a1a1aa",
    bg: "rgba(161,161,170,0.12)",
  },
};

const STATUS_CHIP: Record<
  PromotionStatus,
  { label: string; color: string; bg: string }
> = {
  active: { label: "Active", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  paused: { label: "Paused", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  archived: {
    label: "Archived",
    color: "#71717a",
    bg: "rgba(113,113,122,0.12)",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function WeightDots({ weight }: { weight: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "3px",
      }}
      title={`Weight: ${weight}/10`}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: i < weight ? "#6366f1" : "#27272a",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  promotionName,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  promotionName: string;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#111111",
          border: "1px solid #2a2a2a",
          borderRadius: "12px",
          padding: "28px 32px",
          maxWidth: "400px",
          width: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <AlertCircle size={18} style={{ color: "#f87171", flexShrink: 0 }} />
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: "#e4e4e7",
            }}
          >
            Archive Promotion?
          </h3>
        </div>
        <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#71717a" }}>
          &ldquo;{promotionName}&rdquo; will be archived and removed from the
          rotation. This can be undone by editing the promotion.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#a1a1aa",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: "#ef4444",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────

export function PromotionCard({
  promotion,
  onStatusChange,
  onArchive,
  onWeightChange,
}: PromotionCardProps) {
  const [localWeight, setLocalWeight] = useState(promotion.weight);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const typeBadge = TYPE_BADGE[promotion.type] ?? TYPE_BADGE.content;
  const statusChip = STATUS_CHIP[promotion.status] ?? STATUS_CHIP.active;

  const handleWeightChange = useCallback(
    (newWeight: number) => {
      setLocalWeight(newWeight);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onWeightChange(promotion.id, newWeight);
      }, 500);
    },
    [promotion.id, onWeightChange],
  );

  function handleToggleStatus() {
    const next: PromotionStatus =
      promotion.status === "active" ? "paused" : "active";
    onStatusChange(promotion.id, next);
  }

  function handleArchiveConfirm() {
    setShowArchiveDialog(false);
    onArchive(promotion.id);
  }

  return (
    <>
      <ConfirmDialog
        open={showArchiveDialog}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setShowArchiveDialog(false)}
        promotionName={promotion.name}
      />

      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid #1a1a1a",
          borderRadius: "12px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          transition: "border-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a";
        }}
      >
        {/* Top row: type badge + status chip + weight dots */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {/* Type badge */}
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: typeBadge.color,
              background: typeBadge.bg,
              textTransform: "uppercase",
            }}
          >
            {typeBadge.label}
          </span>

          {/* Status chip */}
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 600,
              color: statusChip.color,
              background: statusChip.bg,
            }}
          >
            {statusChip.label}
          </span>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Weight dots */}
          <WeightDots weight={localWeight} />
        </div>

        {/* Middle: name + description + URL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <h3
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: "1.3",
            }}
          >
            {promotion.name}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "#71717a",
              lineHeight: "1.5",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {promotion.description}
          </p>
          <a
            href={promotion.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              posthog.capture("product_link_clicked", {
                promotionId: promotion.id,
                promotionName: promotion.name,
                platform: "dashboard",
                destination: promotion.url,
              })
            }
            style={{
              fontSize: "11px",
              color: "#3f3f46",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
              textDecoration: "none",
            }}
            title={promotion.url}
          >
            {promotion.url}
          </a>
        </div>

        {/* Weight slider */}
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
              flexShrink: 0,
            }}
          >
            Weight
          </span>
          <input
            type="range"
            min={1}
            max={10}
            value={localWeight}
            onChange={(e) => handleWeightChange(Number(e.target.value))}
            style={{
              flex: 1,
              height: "4px",
              accentColor: "#6366f1",
              cursor: "pointer",
            }}
          />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#a1a1aa",
              minWidth: "20px",
              textAlign: "right",
            }}
          >
            {localWeight}
          </span>
        </div>

        {/* Bottom actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            paddingTop: "4px",
            borderTop: "1px solid #1a1a1a",
            flexWrap: "wrap",
          }}
        >
          {/* Pause / Activate toggle */}
          {promotion.status !== "archived" && (
            <button
              onClick={handleToggleStatus}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #2a2a2a",
                background: "transparent",
                color:
                  promotion.status === "active" ? "#fbbf24" : "#4ade80",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {promotion.status === "active" ? (
                <>
                  <Pause size={12} />
                  Pause
                </>
              ) : (
                <>
                  <Play size={12} />
                  Activate
                </>
              )}
            </button>
          )}

          {/* Edit */}
          <Link
            href={`/promote/${promotion.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#a1a1aa",
              fontSize: "12px",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <Edit2 size={12} />
            Edit
          </Link>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Archive */}
          {promotion.status !== "archived" && (
            <button
              onClick={() => setShowArchiveDialog(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(239,68,68,0.2)",
                background: "transparent",
                color: "#ef4444",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Archive size={12} />
              Archive
            </button>
          )}
        </div>
      </div>
    </>
  );
}
