"use client";

import { useState, useCallback } from "react";
import { Plus, Calendar } from "lucide-react";
import { RuleCard } from "./rule-card";
import { StepModal } from "./step-modal";

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

interface CustomScheduleTabProps {
  rules: AutopilotRule[];
  onRuleUpdated: () => void;
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const SOURCE_LABELS: Record<string, string> = {
  youtube: "YouTube",
  reddit: "Reddit",
  hn: "HN",
  news: "News",
};

const PLATFORM_LABELS: Record<string, string> = {
  twitter: "Twitter",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  instagram: "Instagram",
  blog: "Blog",
};

const CONTENT_LABELS: Record<string, string> = {
  blog: "Blog",
  email: "Email",
  twitter: "Twitter",
  linkedin: "LinkedIn",
  reddit: "Reddit",
  instagram: "Instagram",
};

interface NextRun {
  date: Date;
  hour: number;
  rule: AutopilotRule;
}

function getNextRuns(rules: AutopilotRule[], limit = 8): NextRun[] {
  const now = new Date();
  const runs: NextRun[] = [];
  const dayIndexMap: Record<string, number> = {
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    sun: 0,
  };

  // Look ahead up to 7 days
  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    date.setHours(0, 0, 0, 0);

    const dayName = DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];

    for (const rule of rules) {
      if (!rule.enabled || !rule.days.includes(dayName)) continue;

      // Skip if this run is in the past for today
      const runDate = new Date(date);
      runDate.setHours(rule.hour, 0, 0, 0);
      if (runDate <= now) continue;

      runs.push({ date: runDate, hour: rule.hour, rule });

      if (runs.length >= limit) break;
    }

    if (runs.length >= limit) break;
  }

  // Sort by date then hour
  runs.sort((a, b) => {
    const dateCompare = a.date.getTime() - b.date.getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.hour - b.hour;
  });

  return runs;
}

export function CustomScheduleTab({ rules, onRuleUpdated }: CustomScheduleTabProps) {
  // Filter out "full" type rules
  const customRules = rules.filter((r) => r.type !== "full");

  // Modal state
  const [modalRule, setModalRule] = useState<AutopilotRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group rules by day
  const rulesByDay: Record<string, AutopilotRule[]> = {};
  for (const rule of customRules) {
    for (const day of rule.days) {
      if (!rulesByDay[day]) {
        rulesByDay[day] = [];
      }
      rulesByDay[day].push(rule);
    }
  }

  const handleAddStep = () => {
    setModalRule(null);
    setIsModalOpen(true);
  };

  const handleEditRule = (rule: AutopilotRule) => {
    setModalRule(rule);
    setIsModalOpen(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this step?")) return;

    try {
      const res = await fetch(`/api/autopilot/${ruleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onRuleUpdated();
      }
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  const handleSaveRule = async (data: any) => {
    if (modalRule) {
      // Edit existing
      const res = await fetch(`/api/autopilot/${modalRule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update rule");
    } else {
      // Create new
      const res = await fetch("/api/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create rule");
    }
    onRuleUpdated();
  };

  const nextRuns = getNextRuns(customRules);

  // Format rule summary for next runs
  const formatRuleSummary = (rule: AutopilotRule) => {
    if (rule.type === "research") {
      const sources = rule.sources || [];
      const labels = sources.map((s) => SOURCE_LABELS[s]).filter(Boolean);
      return labels.length > 0 ? labels.join(" + ") : "No sources";
    } else if (rule.type === "generate") {
      const platforms = rule.platforms || [];
      const labels = platforms.map((p) => CONTENT_LABELS[p]).filter(Boolean);
      return labels.length > 0 ? labels.join(" + ") : "No content";
    } else if (rule.type === "post") {
      const platforms = rule.platforms || [];
      const labels = platforms.map((p) => PLATFORM_LABELS[p]).filter(Boolean);
      return labels.length > 0 ? labels.join(" + ") : "No platforms";
    }
    return "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header with Add button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: "#e4e4e7",
            }}
          >
            Custom Schedule
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "12px",
              color: "#52525b",
            }}
          >
            Configure individual pipeline steps per day
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddStep}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "7px",
            border: "none",
            background: "#6366f1",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#4f46e5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#6366f1";
          }}
        >
          <Plus size={16} />
          Add Step
        </button>
      </div>

      {/* Rules grouped by day */}
      {DAYS.map((day) => {
        const dayRules = rulesByDay[day];
        if (!dayRules || dayRules.length === 0) return null;

        return (
          <div key={day}>
            <h3
              style={{
                margin: "0 0 12px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#71717a",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {DAY_LABELS[day]}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {dayRules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onEdit={() => handleEditRule(rule)}
                  onDelete={() => handleDeleteRule(rule.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {customRules.length === 0 && (
        <div
          style={{
            background: "#0f0f0f",
            border: "1px solid #1a1a1a",
            borderRadius: "12px",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: "13px", color: "#52525b" }}>
            No custom steps yet. Click "Add Step" to create your first scheduled action.
          </p>
        </div>
      )}

      {/* Next Runs */}
      {nextRuns.length > 0 && (
        <div
          style={{
            background: "#0f0f0f",
            border: "1px solid #1a1a1a",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #1a1a1a",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Calendar size={16} style={{ color: "#71717a" }} />
            <h3
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 600,
                color: "#a1a1aa",
              }}
            >
              Next Runs
            </h3>
          </div>
          <div style={{ padding: "0" }}>
            {nextRuns.map((run, index) => {
              const typeIcons = { research: "🔍", generate: "✍️", post: "📤" };
              const icon = typeIcons[run.rule.type as keyof typeof typeIcons] || "•";

              return (
                <div
                  key={`${run.rule.id}-${index}`}
                  style={{
                    padding: "12px 20px",
                    borderBottom: index < nextRuns.length - 1 ? "1px solid #1a1a1a" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", color: "#e4e4e7", fontWeight: 500 }}>
                      {run.date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {run.hour.toString().padStart(2, "0")}:00
                    </div>
                    <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>
                      {run.rule.type.charAt(0).toUpperCase() + run.rule.type.slice(1)} — {formatRuleSummary(run.rule)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <StepModal rule={modalRule} onSave={handleSaveRule} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
