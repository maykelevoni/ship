"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function ProductStudioNewPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = searchParams.get("title") ?? "Untitled Product";
  const opportunityId = searchParams.get("opportunityId") ?? undefined;

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function create() {
      try {
        const res = await fetch("/api/own-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, opportunityId }),
        });
        if (!res.ok) throw new Error("Failed to create product");
        const product = await res.json();
        router.replace(`/products/studio/${product.id}`);
      } catch {
        setError("Failed to create product. Please try again.");
      }
    }

    create();
  }, []);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "64px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#f87171", fontSize: "14px" }}>{error}</p>
        <button
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
          style={{
            padding: "9px 18px",
            borderRadius: "8px",
            border: "none",
            background: "#6366f1",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "64px",
        color: "#71717a",
        fontSize: "14px",
      }}
    >
      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
      Creating product…
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ProductStudioNewPage() {
  return (
    <Suspense fallback={<div style={{ padding: "32px", color: "#52525b" }}>Loading…</div>}>
      <ProductStudioNewPageInner />
    </Suspense>
  );
}
