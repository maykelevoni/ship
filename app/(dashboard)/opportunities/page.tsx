"use client";

import { useState, useEffect } from "react";
import {
  Lightbulb,
  ShoppingCart,
  Tag,
  BookOpen,
  Wrench,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS: {
  type: OpportunityType;
  label: string;
  Icon: React.ElementType;
}[] = [
  { type: "affiliate", label: "Affiliate", Icon: ShoppingCart },
  { type: "ghost_offer", label: "Ghost Offers", Icon: Tag },
  { type: "digital_product", label: "Digital Products", Icon: BookOpen },
  { type: "product_gap", label: "Product Gaps", Icon: Wrench },
];

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  OpportunityStatus,
  { background: string; color: string }
> = {
  new: { background: "rgba(99,102,241,0.15)", color: "#818cf8" },
  acted: { background: "rgba(74,222,128,0.15)", color: "#4ade80" },
  dismissed: { background: "rgba(82,82,91,0.15)", color: "#71717a" },
};

function StatusBadge({ status }: { status: OpportunityStatus }) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.new;
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
        background: styles.background,
        color: styles.color,
      }}
    >
      {status}
    </span>
  );
}

// ─── Opportunity row ──────────────────────────────────────────────────────────

function OpportunityRow({
  opp,
  onAct,
  onDismiss,
}: {
  opp: Opportunity;
  onAct: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 16px",
        borderBottom: "1px solid #1a1a1a",
      }}
    >
      {/* Status badge */}
      <div style={{ paddingTop: "2px" }}>
        <StatusBadge status={opp.status} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 700,
            color: "#e4e4e7",
            lineHeight: 1.4,
          }}
        >
          {opp.title}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: "12px",
            color: "#a1a1aa",
            lineHeight: 1.5,
          }}
        >
          {opp.rationale}
        </p>
        {opp.searchQuery && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginTop: "6px",
              padding: "2px 8px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid #2a2a2a",
              fontSize: "11px",
              color: "#71717a",
            }}
          >
            Search: {opp.searchQuery}
          </span>
        )}
      </div>

      {/* Action buttons — only for new */}
      {opp.status === "new" && (
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button
            onClick={() => onAct(opp.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid rgba(74,222,128,0.35)",
              background: "rgba(74,222,128,0.1)",
              color: "#4ade80",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.15s ease",
            }}
          >
            Act
          </button>
          <button
            onClick={() => onDismiss(opp.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid rgba(82,82,91,0.35)",
              background: "rgba(82,82,91,0.1)",
              color: "#71717a",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.15s ease",
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  items,
  onAct,
  onDismiss,
}: {
  section: (typeof SECTIONS)[number];
  items: Opportunity[];
  onAct: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const { Icon, label } = section;
  const isEmpty = items.length === 0;

  return (
    <div
      style={{
        background: "#0f0f0f",
        border: "1px solid #1a1a1a",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "14px 16px",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        <Icon size={15} style={{ color: "#6366f1", flexShrink: 0 }} />
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#e4e4e7",
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "18px",
            height: "18px",
            padding: "0 4px",
            borderRadius: "9px",
            background: "#1a1a1a",
            color: "#52525b",
            fontSize: "10px",
            fontWeight: 600,
          }}
        >
          {items.length}
        </span>
      </div>

      {/* Items or empty state */}
      {isEmpty ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 24px",
          }}
        >
          <p style={{ margin: 0, fontSize: "13px", color: "#52525b" }}>
            No {label.toLowerCase()} opportunities yet.
          </p>
        </div>
      ) : (
        <div>
          {items.map((opp, idx) => (
            <div
              key={opp.id}
              style={
                idx === items.length - 1
                  ? { borderBottom: "none" }
                  : undefined
              }
            >
              <OpportunityRow opp={opp} onAct={onAct} onDismiss={onDismiss} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OpportunitiesPage() {
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
    // Optimistic update
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
    try {
      await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      // silently fail — local state already updated
    }
  }

  // Filter dismissed if toggle is off
  const visible = showDismissed
    ? opportunities
    : opportunities.filter((o) => o.status !== "dismissed");

  const totalCount = opportunities.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        background: "#0a0a0a",
        minHeight: "100%",
      }}
    >
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
          <Lightbulb size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            Opportunities
          </h1>
          {totalCount > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "24px",
                height: "24px",
                padding: "0 7px",
                borderRadius: "12px",
                background: "#6366f1",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {totalCount}
            </span>
          )}
        </div>

        {/* Show dismissed toggle */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "13px",
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 0",
          }}
        >
          <span style={{ fontSize: "13px", color: "#52525b" }}>
            Loading opportunities…
          </span>
        </div>
      ) : totalCount === 0 ? (
        /* Overall empty state */
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
          <Lightbulb size={36} style={{ color: "#27272a" }} />
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              color: "#3f3f46",
              fontWeight: 500,
            }}
          >
            No opportunities yet
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#27272a" }}>
            Opportunities will appear here after the engine analyzes your
            content.
          </p>
        </div>
      ) : (
        /* Sections */
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {SECTIONS.map((section) => {
            const sectionItems = visible.filter(
              (o) => o.type === section.type
            );
            return (
              <SectionCard
                key={section.type}
                section={section}
                items={sectionItems}
                onAct={(id) => handleAction(id, "acted")}
                onDismiss={(id) => handleAction(id, "dismissed")}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
