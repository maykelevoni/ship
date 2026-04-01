"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";

import { ApiKeysSection } from "./_components/api-keys-section";
import { IntegrationsSection } from "./_components/integrations-section";
import { PlatformsSection } from "./_components/platforms-section";
import { ResearchSection } from "./_components/research-section";
import type { SettingsData } from "./_components/types";
import { QuickAccess } from "./_components/ui";

export interface SectionProps {
  settings: SettingsData;
  saving: boolean;
  onSave: (patch: Partial<SettingsData>) => Promise<void>;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<"general" | "api-keys">("general");
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

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

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSave(patch: Partial<SettingsData>) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Save failed");
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

      <QuickAccess />
    </div>
  );
}
