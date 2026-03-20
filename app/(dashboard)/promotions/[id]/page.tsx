"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PromotionForm, type PromotionFormData } from "@/components/dashboard/promotion-form";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiPromotion {
  id: string;
  type: PromotionFormData["type"];
  name: string;
  description: string;
  url: string;
  weight: number;
  notes?: string | null;
  price?: string | null;
  benefits?: string[] | null;
  targetAudience?: string | null;
  affiliateLink?: string | null;
  commission?: string | null;
  leadMagnetWhat?: string | null;
  leadMagnetAudience?: string | null;
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "32px",
        background: "#0a0a0a",
        border: "1px solid #1e1e1e",
        borderRadius: "12px",
        maxWidth: "680px",
      }}
    >
      {[180, 80, 120, 60].map((h, i) => (
        <div
          key={i}
          style={{
            height: `${h}px`,
            borderRadius: "8px",
            background: "#111",
          }}
        />
      ))}
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "24px",
        background: "rgba(239,68,68,0.06)",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: "10px",
        maxWidth: "680px",
      }}
    >
      <p style={{ margin: 0, fontSize: "14px", color: "#f87171" }}>{message}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditPromotionPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [promotion, setPromotion] = useState<ApiPromotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/promotions/${id}`);
        if (res.status === 404) {
          setError("Promotion not found.");
          return;
        }
        if (!res.ok) {
          setError("Failed to load promotion.");
          return;
        }
        const data: ApiPromotion = await res.json();
        setPromotion(data);
      } catch {
        setError("Network error — please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Map API shape → form shape
  const initialData = promotion
    ? {
        id: promotion.id,
        type: promotion.type,
        name: promotion.name,
        description: promotion.description,
        url: promotion.url,
        weight: promotion.weight,
        notes: promotion.notes ?? "",
        price: promotion.price ?? "",
        benefits:
          promotion.benefits && promotion.benefits.length > 0
            ? promotion.benefits
            : [""],
        targetAudience: promotion.targetAudience ?? "",
        affiliateLink: promotion.affiliateLink ?? "",
        commission: promotion.commission ?? "",
        leadMagnetWhat: promotion.leadMagnetWhat ?? "",
        leadMagnetAudience: promotion.leadMagnetAudience ?? "",
      }
    : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <Link
          href="/promotions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            border: "1px solid #2a2a2a",
            background: "transparent",
            color: "#71717a",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            {promotion ? promotion.name : "Edit Promotion"}
          </h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#52525b" }}>
            Update promotion details or archive it.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div
          style={{
            background: "#0a0a0a",
            border: "1px solid #1e1e1e",
            borderRadius: "12px",
            padding: "32px",
            maxWidth: "680px",
          }}
        >
          <PromotionForm mode="edit" initialData={initialData} />
        </div>
      )}
    </div>
  );
}
