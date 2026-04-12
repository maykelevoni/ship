"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import { FullAutopilotTab } from "./_components/full-autopilot-tab";
import { CustomScheduleTab } from "./_components/custom-schedule-tab";

interface AutopilotRule {
  id: string;
  type: string;
  days: string[];
  hour: number;
  sources?: string[];
  platforms?: string[];
  promotionId?: string | null;
  gate: boolean;
  keyword?: string | null;
  enabled: boolean;
}

function AutopilotPageInner() {
  const router = useRouter();
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const tab = (searchParams.get("tab") ?? "full") as "full" | "custom";

  const [rules, setRules] = useState<AutopilotRule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRules = useCallback(async () => {
    try {
      const res = await fetch("/api/autopilot");
      if (res.ok) {
        const json = await res.json();
        setRules(json.rules || []);
      }
    } catch (error) {
      console.error("Failed to load autopilot rules:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 0",
        }}
      >
        <span style={{ fontSize: "13px", color: "#52525b" }}>Loading autopilot rules…</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Bot size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            Autopilot
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "12px",
              color: "#52525b",
            }}
          >
            Schedule your content pipeline
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          background: "#0a0a0a",
          border: "1px solid #1a1a1a",
          borderRadius: "8px",
          padding: "4px",
          width: "fit-content",
        }}
      >
        {(["full", "custom"] as const).map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => router.push(`/autopilot?tab=${t}`)}
              style={{
                padding: "7px 18px",
                borderRadius: "6px",
                border: "none",
                background: isActive ? "#1a1a1a" : "transparent",
                color: isActive ? "#e4e4e7" : "#71717a",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {t === "full" ? "⚡ Full Autopilot" : "🎛️ Custom Schedule"}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "full" && <FullAutopilotTab rules={rules} onRuleUpdated={loadRules} />}

      {tab === "custom" && <CustomScheduleTab rules={rules} onRuleUpdated={loadRules} />}
    </div>
  );
}

export default function AutopilotPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 0",
          }}
        >
          <span style={{ fontSize: "13px", color: "#52525b" }}>Loading…</span>
        </div>
      }
    >
      <AutopilotPageInner />
    </Suspense>
  );
}
