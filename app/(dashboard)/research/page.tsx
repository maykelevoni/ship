"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, TrendingUp } from "lucide-react";

import ResearchProductsTab from "./_components/research-products-tab";
import ResearchTopicsTab from "./_components/research-topics-tab";
import { AffiliateProduct, ResearchTopic } from "./_components/research-types";

export default function ResearchPage() {
  const [tab, setTab] = useState<"content" | "products">("content");

  // ── Topics state ──────────────────────────────────────────────────────────
  const [topics, setTopics] = useState<ResearchTopic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

  const fetchTopics = useCallback(async () => {
    setTopicsLoading(true);
    try {
      const res = await fetch("/api/research");
      if (res.ok) {
        const data: ResearchTopic[] = await res.json();
        setTopics(data);
      }
    } catch {
      // silently fail
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // ── Products state ────────────────────────────────────────────────────────
  const [productNiche, setProductNiche] = useState("");
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  async function handleProductResearch() {
    if (!productNiche.trim()) return;
    setProductsLoading(true);
    setProducts([]);
    setProductsError(null);
    try {
      const res = await fetch(
        `/api/research/products?keyword=${encodeURIComponent(productNiche.trim())}`,
      );
      if (res.ok) {
        const data: AffiliateProduct[] = await res.json();
        setProducts(data);
      } else {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setProductsError(json.error ?? "Search failed.");
      }
    } catch {
      setProductsError("Search failed.");
    } finally {
      setProductsLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page heading */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <TrendingUp size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            Research
          </h1>
        </div>
        <p
          style={{
            margin: "4px 0 0 30px",
            fontSize: "13px",
            color: "#71717a",
          }}
        >
          Discover topics, trends, and niches
        </p>
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
        {(["content", "products"] as const).map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
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
              {t === "content" ? (
                <>
                  <TrendingUp size={13} />
                  Content
                </>
              ) : (
                <>
                  <Package size={13} />
                  Products
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content tab ── */}
      {tab === "content" && (
        <ResearchTopicsTab
          topics={topics}
          loading={topicsLoading}
          onRefresh={fetchTopics}
        />
      )}

      {/* ── Products tab ── */}
      {tab === "products" && (
        <ResearchProductsTab
          products={products}
          loading={productsLoading}
          niche={productNiche}
          onNicheChange={setProductNiche}
          onResearch={handleProductResearch}
          error={productsError}
        />
      )}
    </div>
  );
}
