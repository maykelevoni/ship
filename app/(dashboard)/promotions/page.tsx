"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Megaphone } from "lucide-react";
import {
  PromotionCard,
  type Promotion,
  type PromotionStatus,
} from "@/components/dashboard/promotion-card";

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const TABS: { label: string; value: "all" | PromotionStatus }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Archived", value: "archived" },
];

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: string }) {
  const isAll = filter === "all";
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        gap: "12px",
        textAlign: "center",
      }}
    >
      <Megaphone size={36} style={{ color: "#2d2d2d" }} />
      <p style={{ margin: 0, fontSize: "15px", color: "#52525b" }}>
        {isAll
          ? "No promotions yet."
          : `No ${filter} promotions.`}
      </p>
      {isAll && (
        <p style={{ margin: 0, fontSize: "13px", color: "#3f3f46" }}>
          Add your first one to start generating content.
        </p>
      )}
      {isAll && (
        <Link
          href="/promotions/new"
          style={{
            marginTop: "8px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            background: "#6366f1",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <Plus size={14} />
          Add Promotion
        </Link>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div
      style={{
        background: "#0f0f0f",
        border: "1px solid #1a1a1a",
        borderRadius: "12px",
        padding: "20px",
        height: "280px",
      }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | PromotionStatus>("all");

  // Fetch all promotions once
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/promotions");
        if (res.ok) {
          const data: Promotion[] = await res.json();
          setPromotions(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Client-side filter
  const filtered =
    activeTab === "all"
      ? promotions
      : promotions.filter((p) => p.status === activeTab);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStatusChange = useCallback(
    async (id: string, status: PromotionStatus) => {
      // Optimistic update
      setPromotions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p)),
      );
      try {
        await fetch(`/api/promotions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      } catch {
        // revert on failure
        setPromotions((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: p.status } : p,
          ),
        );
      }
    },
    [],
  );

  const handleArchive = useCallback(async (id: string) => {
    // Optimistic update
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "archived" } : p)),
    );
    try {
      await fetch(`/api/promotions/${id}`, { method: "DELETE" });
    } catch {
      // revert
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: "active" } : p,
        ),
      );
    }
  }, []);

  const handleWeightChange = useCallback(async (id: string, weight: number) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, weight } : p)),
    );
    try {
      await fetch(`/api/promotions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight }),
      });
    } catch {
      // silently fail — weight will sync on next load
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

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
        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 700,
            color: "#e4e4e7",
          }}
        >
          Promotions
        </h1>
        <Link
          href="/promotions/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 16px",
            borderRadius: "8px",
            border: "none",
            background: "#6366f1",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <Plus size={14} />
          Add Promotion
        </Link>
      </div>

      {/* Filter tabs */}
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
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          // Badge count
          const count =
            tab.value === "all"
              ? promotions.length
              : promotions.filter((p) => p.status === tab.value).length;

          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                background: isActive ? "#1a1a1a" : "transparent",
                color: isActive ? "#e4e4e7" : "#71717a",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
              {count > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "18px",
                    height: "18px",
                    padding: "0 4px",
                    borderRadius: "9px",
                    background: isActive ? "#2d2d2d" : "#1a1a1a",
                    color: isActive ? "#a1a1aa" : "#52525b",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "16px",
        }}
      >
        {loading ? (
          [1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState filter={activeTab} />
        ) : (
          filtered.map((promotion) => (
            <PromotionCard
              key={promotion.id}
              promotion={promotion}
              onStatusChange={handleStatusChange}
              onArchive={handleArchive}
              onWeightChange={handleWeightChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
