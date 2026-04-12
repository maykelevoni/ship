"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";

import { ApiKeysSection } from "./_components/api-keys-section";
import { IntegrationsSection } from "./_components/integrations-section";
import { PlatformsSection } from "./_components/platforms-section";
import { ResearchSection } from "./_components/research-section";
import type { SettingsData } from "./_components/types";

export interface SectionProps {
  settings: SettingsData;
  saving: boolean;
  onSave: (patch: Partial<SettingsData>) => Promise<void>;
}

type PlanInfo = {
  plan: string;
  onboardingDone: boolean;
  polarCustomerId: string | null;
  planExpiresAt: string | null;
};

export default function SettingsPage() {
  const [tab, setTab] = useState<"general" | "api-keys">("general");
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) setSettings(await res.json());
    } catch {
      // silently fail
    } finally {
      setPageLoading(false);
    }
  }, []);

  const loadPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/user/plan");
      if (res.ok) setPlanInfo(await res.json());
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadPlan();
  }, [loadSettings, loadPlan]);

  async function handleSave(patch: Partial<SettingsData>) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Save failed");
      // Reload settings from DB so state reflects what was persisted
      await loadSettings();
    } finally {
      setSaving(false);
    }
  }

  if (pageLoading || !settings) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 0",
        }}
      >
        <span style={{ fontSize: "13px", color: "#52525b" }}>
          Loading settings…
        </span>
      </div>
    );
  }

  const sectionProps = { settings, saving, onSave: handleSave };

  const plan = planInfo?.plan ?? "free";
  const planColor =
    plan === "pro" ? "#16a34a" : plan === "starter" ? "#2563eb" : "#52525b";
  const planDescription =
    plan === "free"
      ? "Read-only access. Upgrade to run the engine and post content."
      : "Full access. Engine runs and posting enabled.";
  const checkoutUrl =
    process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL ?? "https://polar.sh";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Settings size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 700,
            color: "#e4e4e7",
          }}
        >
          Settings
        </h1>
      </div>

      {/* Plan Card */}
      <div
        style={{
          background: "#111",
          border: "1px solid #1e1e1e",
          borderRadius: 8,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, color: "#888" }}>Current plan</span>
            <span
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 4,
                background: planColor,
                color: "#fff",
                fontWeight: 600,
              }}
            >
              {plan.toUpperCase()}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#555" }}>
            {planDescription}
          </p>
        </div>
        {plan === "free" ? (
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "#6366f1",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Upgrade →
          </a>
        ) : (
          <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 500 }}>
            Full access enabled
          </span>
        )}
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: "8px" }}>
        {(["general", "api-keys"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "7px 18px",
                borderRadius: "9999px",
                border: active ? "none" : "1px solid #2a2a2a",
                background: active ? "#6366f1" : "transparent",
                color: active ? "#fff" : "#71717a",
                fontSize: "13px",
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t === "general" ? "General" : "API Keys"}
            </button>
          );
        })}
      </div>

      {/* General Tab */}
      {tab === "general" && (
        <>
          <PlatformsSection {...sectionProps} />
          <ResearchSection {...sectionProps} />
        </>
      )}

      {/* API Keys Tab */}
      {tab === "api-keys" && (
        <>
          <ApiKeysSection {...sectionProps} />
          <IntegrationsSection {...sectionProps} />
        </>
      )}
    </div>
  );
}
