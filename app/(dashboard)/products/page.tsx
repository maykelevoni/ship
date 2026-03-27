"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Megaphone, Package, ExternalLink } from "lucide-react";
import {
  PromotionCard,
  type Promotion,
  type PromotionStatus,
} from "@/components/dashboard/promotion-card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OwnProduct {
  id: string;
  title: string;
  description: string;
  status: string;
  price: number;
  checkoutUrl: string | null;
  promotionId: string | null;
  createdAt: string;
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
        padding: "2px 8px",
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div
      style={{
        background: "#0f0f0f",
        border: "1px solid #1a1a1a",
        borderRadius: "12px",
        padding: "20px",
        height: "140px",
      }}
    />
  );
}

// ─── New Product Modal ────────────────────────────────────────────────────────

function NewProductModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("9.99");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/own-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          price: parseFloat(price) || 9.99,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const product: OwnProduct = await res.json();
      onCreated(product.id);
    } catch {
      setError("Failed to create product. Please try again.");
      setCreating(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid #2a2a2a",
          borderRadius: "12px",
          padding: "28px",
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#e4e4e7" }}>
          New Product
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", color: "#71717a" }}>Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Google Ads Mastery Guide"
            autoFocus
            style={{
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #2a2a2a",
              background: "#0a0a0a",
              color: "#e4e4e7",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", color: "#71717a" }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
            style={{
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #2a2a2a",
              background: "#0a0a0a",
              color: "#e4e4e7",
              fontSize: "14px",
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", color: "#71717a" }}>Price ($)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
            step="0.01"
            style={{
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #2a2a2a",
              background: "#0a0a0a",
              color: "#e4e4e7",
              fontSize: "14px",
              outline: "none",
              width: "120px",
            }}
          />
        </div>

        {error && (
          <p style={{ margin: 0, fontSize: "13px", color: "#f87171" }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: "8px",
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#a1a1aa",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              padding: "9px 18px",
              borderRadius: "8px",
              border: "none",
              background: "#6366f1",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: creating ? "not-allowed" : "pointer",
              opacity: creating ? 0.7 : 1,
            }}
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") ?? "affiliates") as "affiliates" | "own";

  // Affiliates state
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [affiliatesLoading, setAffiliatesLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | PromotionStatus>("all");

  // Own products state
  const [ownProducts, setOwnProducts] = useState<OwnProduct[]>([]);
  const [ownLoading, setOwnLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const LIMIT = 50;

  // ── Fetch affiliates ────────────────────────────────────────────────────────
  async function fetchAffiliates(pageNum: number, replace: boolean) {
    try {
      const res = await fetch(`/api/promotions?page=${pageNum}&limit=${LIMIT}`);
      if (res.ok) {
        const json: { data: Promotion[]; total: number } = await res.json();
        setTotal(json.total);
        setPromotions((prev) => (replace ? json.data : [...prev, ...json.data]));
        setPage(pageNum);
      }
    } catch {
      // silently fail
    }
  }

  // ── Fetch own products ──────────────────────────────────────────────────────
  async function fetchOwnProducts() {
    setOwnLoading(true);
    try {
      const res = await fetch("/api/own-products");
      if (res.ok) {
        const json: { products: OwnProduct[] } = await res.json();
        setOwnProducts(json.products);
      }
    } catch {
      // silently fail
    } finally {
      setOwnLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "affiliates" && promotions.length === 0) {
      setAffiliatesLoading(true);
      fetchAffiliates(1, true).finally(() => setAffiliatesLoading(false));
    }
    if (tab === "own" && ownProducts.length === 0) {
      fetchOwnProducts();
    }
  }, [tab]);

  // ── Affiliate handlers ──────────────────────────────────────────────────────
  const handleStatusChange = useCallback(async (id: string, status: PromotionStatus) => {
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    try {
      await fetch(`/api/promotions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      // silently fail
    }
  }, []);

  const handleArchive = useCallback(async (id: string) => {
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, status: "archived" } : p)));
    try {
      await fetch(`/api/promotions/${id}`, { method: "DELETE" });
    } catch {
      // silently fail
    }
  }, []);

  const handleWeightChange = useCallback(async (id: string, weight: number) => {
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, weight } : p)));
    try {
      await fetch(`/api/promotions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight }),
      });
    } catch {
      // silently fail
    }
  }, []);

  const filteredPromotions =
    activeFilter === "all" ? promotions : promotions.filter((p) => p.status === activeFilter);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#e4e4e7" }}>
          Products
        </h1>
        {tab === "affiliates" ? (
          <Link
            href="/promote/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#6366f1",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Plus size={14} />
            New Affiliate
          </Link>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#6366f1",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={14} />
            New Product
          </button>
        )}
      </div>

      {/* Tab switcher */}
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
        {(["affiliates", "own"] as const).map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => router.push(`/products?tab=${t}`)}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                border: "none",
                background: isActive ? "#1a1a1a" : "transparent",
                color: isActive ? "#e4e4e7" : "#71717a",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {t === "affiliates" ? "Affiliates" : "Own Products"}
            </button>
          );
        })}
      </div>

      {/* ── Affiliates tab ── */}
      {tab === "affiliates" && (
        <>
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
            {(["all", "active", "paused", "archived"] as const).map((f) => {
              const isActive = activeFilter === f;
              const count = f === "all" ? promotions.length : promotions.filter((p) => p.status === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
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
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "16px",
            }}
          >
            {affiliatesLoading ? (
              [1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)
            ) : filteredPromotions.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  padding: "64px 24px",
                  textAlign: "center",
                }}
              >
                <Megaphone size={36} style={{ color: "#2d2d2d" }} />
                <p style={{ margin: 0, fontSize: "15px", color: "#52525b" }}>No affiliates yet.</p>
                <Link
                  href="/promote/new"
                  style={{
                    marginTop: "8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#6366f1",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <Plus size={14} />
                  Add Affiliate
                </Link>
              </div>
            ) : (
              filteredPromotions.map((promotion) => (
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

          {!affiliatesLoading && promotions.length < total && (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={async () => {
                  setLoadingMore(true);
                  await fetchAffiliates(page + 1, false);
                  setLoadingMore(false);
                }}
                disabled={loadingMore}
                style={{
                  padding: "9px 24px",
                  borderRadius: "8px",
                  border: "1px solid #2a2a2a",
                  background: "transparent",
                  color: "#a1a1aa",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: loadingMore ? "not-allowed" : "pointer",
                  opacity: loadingMore ? 0.6 : 1,
                }}
              >
                {loadingMore ? "Loading…" : `Load more (${total - promotions.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Own Products tab ── */}
      {tab === "own" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {ownLoading ? (
            [1, 2, 3].map((i) => <CardSkeleton key={i} />)
          ) : ownProducts.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                padding: "64px 24px",
                textAlign: "center",
              }}
            >
              <Package size={36} style={{ color: "#2d2d2d" }} />
              <p style={{ margin: 0, fontSize: "15px", color: "#52525b" }}>
                No products yet. Create your first digital product.
              </p>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  marginTop: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#6366f1",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={14} />
                Create Product
              </button>
            </div>
          ) : (
            ownProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "#0f0f0f",
                  border: "1px solid #1a1a1a",
                  borderRadius: "12px",
                  padding: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "15px", fontWeight: 600, color: "#e4e4e7" }}>
                      {product.title}
                    </span>
                    <StatusBadge status={product.status} />
                    <span style={{ fontSize: "13px", color: "#52525b" }}>${product.price.toFixed(2)}</span>
                  </div>
                  {product.description && (
                    <p style={{ margin: 0, fontSize: "13px", color: "#71717a" }}>
                      {product.description}
                    </p>
                  )}
                  <span style={{ fontSize: "11px", color: "#3f3f46" }}>
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  {product.status === "published" && product.checkoutUrl && (
                    <a
                      href={product.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "7px 14px",
                        borderRadius: "8px",
                        border: "1px solid #2a2a2a",
                        background: "transparent",
                        color: "#4ade80",
                        fontSize: "13px",
                        textDecoration: "none",
                      }}
                    >
                      <ExternalLink size={12} />
                      Gumroad
                    </a>
                  )}
                  <Link
                    href={`/products/studio/${product.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "7px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#6366f1",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Open Studio
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* New Product Modal */}
      {showModal && (
        <NewProductModal
          onClose={() => setShowModal(false)}
          onCreated={(id) => router.push(`/products/studio/${id}`)}
        />
      )}
    </div>
  );
}
