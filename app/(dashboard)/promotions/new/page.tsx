"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PromotionForm } from "@/components/dashboard/promotion-form";

export default function NewPromotionPage() {
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
            New Promotion
          </h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#52525b" }}>
            Add a promotion to the content rotation.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div
        style={{
          background: "#0a0a0a",
          border: "1px solid #1e1e1e",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "680px",
        }}
      >
        <PromotionForm mode="create" />
      </div>
    </div>
  );
}
