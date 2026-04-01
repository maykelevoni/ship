"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCw, Search, ShoppingBag } from "lucide-react";

import { AffiliateProduct, getPlatformBadgeStyle } from "./research-types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ResearchProductsTabProps {
  products: AffiliateProduct[];
  loading: boolean;
  niche: string;
  onNicheChange: (n: string) => void;
  onResearch: () => void;
  error?: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResearchProductsTab({
  products,
  loading,
  niche,
  onNicheChange,
  onResearch,
  error,
}: ResearchProductsTabProps) {
  const [productFilter, setProductFilter] = useState<string>("all");
  const [addState, setAddState] = useState<Record<string, "adding" | string>>(
    {},
  );
  const [expandedPainPoints, setExpandedPainPoints] = useState<Set<string>>(
    new Set(),
  );
  const [expandedBenefits, setExpandedBenefits] = useState<Set<string>>(
    new Set(),
  );
  const [productKeywordSearched, setProductKeywordSearched] =
    useState<string>("");

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: "8px 12px",
    background: "#0a0a0a",
    border: "1px solid #2a2a2a",
    borderRadius: "7px",
    color: "#e4e4e7",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  };

  async function handleProductSearch() {
    if (!niche.trim()) return;
    setProductFilter("all");
    setProductKeywordSearched(niche.trim());
    onResearch();
  }

  async function handleAddProduct(product: AffiliateProduct) {
    const key = product.name;
    setAddState((prev) => ({ ...prev, [key]: "adding" }));
    try {
      const res = await fetch("/api/research/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        const { promotionId } = (await res.json()) as { promotionId: string };
        setAddState((prev) => ({ ...prev, [key]: promotionId }));
      } else {
        setAddState((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    } catch {
      setAddState((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  const filteredProductResults =
    productFilter === "all"
      ? products
      : products.filter(
          (p) => p.platform.toLowerCase() === productFilter.toLowerCase(),
        );

  const availablePlatforms = Array.from(
    new Set(products.map((p) => p.platform)),
  );

  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Search bar */}
      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid #1a1a1a",
          borderRadius: "10px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#52525b",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={niche}
              onChange={(e) => onNicheChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) handleProductSearch();
              }}
              placeholder="e.g. email marketing, weight loss, AI tools, crypto…"
              style={{ ...inputStyle, paddingLeft: "30px" }}
            />
          </div>
          <button
            onClick={handleProductSearch}
            disabled={loading || !niche.trim()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
              borderRadius: "7px",
              border: "none",
              background: loading || !niche.trim() ? "#1a1a1a" : "#6366f1",
              color: loading || !niche.trim() ? "#52525b" : "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: loading || !niche.trim() ? "not-allowed" : "pointer",
              flexShrink: 0,
            }}
          >
            <RefreshCw
              size={13}
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
            {loading ? "Searching…" : "Search Products"}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "#52525b" }}>
          AI will suggest real affiliate products with commission details
        </p>
        {error && (
          <p style={{ margin: 0, fontSize: "12px", color: "#f87171" }}>
            {error}
          </p>
        )}
      </div>

      {/* Platform filter chips */}
      {products.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["all", ...availablePlatforms].map((platform) => {
            const isAll = platform === "all";
            const filterKey = isAll ? "all" : platform.toLowerCase();
            const isActive = productFilter === filterKey;
            const count = isAll
              ? products.length
              : products.filter((r) => r.platform.toLowerCase() === filterKey)
                  .length;
            return (
              <button
                key={platform}
                onClick={() => setProductFilter(filterKey)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  border: "1px solid #1a1a1a",
                  background: isActive ? "#1a1a1a" : "transparent",
                  color: isActive ? "#e4e4e7" : "#71717a",
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {isAll ? "All" : platform}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "16px",
                    height: "16px",
                    padding: "0 3px",
                    borderRadius: "8px",
                    background: isActive ? "#2a2a2a" : "#1a1a1a",
                    color: isActive ? "#a1a1aa" : "#52525b",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Product cards */}
      {loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: "140px",
                background: "#1a1a1a",
                borderRadius: "10px",
              }}
            />
          ))}
        </div>
      ) : filteredProductResults.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredProductResults.map((product) => {
            const addKey = product.name;
            const addVal = addState[addKey];
            const isAdding = addVal === "adding";
            const isAdded = addVal !== undefined && addVal !== "adding";
            const isPainExpanded = expandedPainPoints.has(addKey);
            const isBenefitsExpanded = expandedBenefits.has(addKey);
            return (
              <div
                key={addKey}
                style={{
                  background: "#0f0f0f",
                  border: "1px solid #1a1a1a",
                  borderRadius: "10px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Top row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: 700,
                      flexShrink: 0,
                      ...getPlatformBadgeStyle(product.platform),
                    }}
                  >
                    {product.platform}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#e4e4e7",
                      minWidth: "120px",
                    }}
                  >
                    {product.name}
                  </span>
                  {product.commission > 0 && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 8px",
                        borderRadius: "5px",
                        background: "rgba(74,222,128,0.12)",
                        color: "#4ade80",
                        border: "1px solid rgba(74,222,128,0.25)",
                        fontSize: "11px",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {product.commission}% commission
                    </span>
                  )}
                </div>

                {/* Description */}
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#a1a1aa",
                    lineHeight: 1.6,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {product.description}
                </p>

                {/* Pain Points */}
                {product.painPoints?.length > 0 && (
                  <div>
                    <button
                      onClick={() =>
                        setExpandedPainPoints((prev) => {
                          const next = new Set(prev);
                          next.has(addKey)
                            ? next.delete(addKey)
                            : next.add(addKey);
                          return next;
                        })
                      }
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#71717a",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: "0",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {isPainExpanded ? "▾" : "▸"} Pain Points (
                      {product.painPoints.length})
                    </button>
                    {isPainExpanded && (
                      <ul
                        style={{
                          margin: "8px 0 0",
                          padding: "0 0 0 4px",
                          listStyle: "none",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        {product.painPoints.map((pt, i) => (
                          <li
                            key={i}
                            style={{
                              fontSize: "12px",
                              color: "#a1a1aa",
                              lineHeight: 1.5,
                            }}
                          >
                            <span style={{ color: "#f87171" }}>✗ </span>
                            {pt}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Benefits */}
                {product.benefits?.length > 0 && (
                  <div>
                    <button
                      onClick={() =>
                        setExpandedBenefits((prev) => {
                          const next = new Set(prev);
                          next.has(addKey)
                            ? next.delete(addKey)
                            : next.add(addKey);
                          return next;
                        })
                      }
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#71717a",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: "0",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {isBenefitsExpanded ? "▾" : "▸"} Benefits (
                      {product.benefits.length})
                    </button>
                    {isBenefitsExpanded && (
                      <ul
                        style={{
                          margin: "8px 0 0",
                          padding: "0 0 0 4px",
                          listStyle: "none",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        {product.benefits.map((b, i) => (
                          <li
                            key={i}
                            style={{
                              fontSize: "12px",
                              color: "#a1a1aa",
                              lineHeight: 1.5,
                            }}
                          >
                            <span style={{ color: "#4ade80" }}>✓ </span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Target audience */}
                {product.targetAudience && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "#52525b",
                    }}
                  >
                    👥 {product.targetAudience}
                  </p>
                )}

                {/* Bottom row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "4px",
                  }}
                >
                  {/* Affiliate link */}
                  <a
                    href={product.affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "11px",
                      color: "#6366f1",
                      textDecoration: "none",
                    }}
                  >
                    <ExternalLink size={11} />
                    Affiliate Program
                  </a>

                  {/* Add to Products button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {isAdded && (
                      <Link
                        href="/products"
                        style={{
                          fontSize: "11px",
                          color: "#6366f1",
                          textDecoration: "none",
                        }}
                      >
                        → View in Products
                      </Link>
                    )}
                    <button
                      onClick={() =>
                        !isAdding && !isAdded && handleAddProduct(product)
                      }
                      disabled={isAdding || isAdded}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 12px",
                        borderRadius: "6px",
                        border: isAdded
                          ? "1px solid rgba(74,222,128,0.3)"
                          : "1px solid rgba(99,102,241,0.4)",
                        background: isAdded
                          ? "rgba(74,222,128,0.1)"
                          : "rgba(99,102,241,0.12)",
                        color: isAdded ? "#4ade80" : "#818cf8",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: isAdding || isAdded ? "not-allowed" : "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {isAdding ? (
                        <>
                          <RefreshCw
                            size={11}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                          Adding…
                        </>
                      ) : isAdded ? (
                        "Added ✓"
                      ) : (
                        "Add to Products"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            background: "#0f0f0f",
            border: "1px solid #1a1a1a",
            borderRadius: "10px",
            padding: "64px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            textAlign: "center",
          }}
        >
          <ShoppingBag size={36} style={{ color: "#2a2a2a" }} />
          {productKeywordSearched ? (
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#3f3f46",
                fontWeight: 500,
              }}
            >
              No products found for &ldquo;{productKeywordSearched}&rdquo;. Try
              a different niche.
            </p>
          ) : (
            <>
              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#3f3f46",
                }}
              >
                Search for affiliate products in your niche
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#2a2a2a" }}>
                Enter a keyword like &ldquo;email marketing&rdquo;,
                &ldquo;fitness&rdquo;, or &ldquo;AI tools&rdquo;
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
