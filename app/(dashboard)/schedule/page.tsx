"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Plus, Pencil, Trash2, X, Save } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  platform: string;
  active: boolean;
}

interface ScheduleEntry {
  id: string;
  time: string;
  platform: string;
  templateId: string;
  template: Template;
  daysOfWeek: string; // JSON string e.g. "[0,1,2,3,4,5,6]"
  active: boolean;
  createdAt: string;
}

interface FormState {
  time: string;
  platform: string;
  templateId: string;
  daysOfWeek: number[];
  active: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: "twitter", label: "Twitter / X", emoji: "🐦" },
  { id: "linkedin", label: "LinkedIn", emoji: "💼" },
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "facebook", label: "Facebook", emoji: "👥" },
  { id: "reddit", label: "Reddit", emoji: "🤖" },
  { id: "email", label: "Email", emoji: "✉️" },
  { id: "tiktok", label: "TikTok", emoji: "🎵" },
  { id: "youtube", label: "YouTube", emoji: "▶️" },
];

// Sun=0 Mon=1 … Sat=6
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function platformLabel(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

function platformEmoji(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.emoji ?? "📌";
}

function parseDays(val: string): number[] {
  try {
    const arr = JSON.parse(val);
    if (Array.isArray(arr)) return arr as number[];
  } catch {
    // ignore
  }
  return ALL_DAYS;
}

const EMPTY_FORM: FormState = {
  time: "09:00",
  platform: "twitter",
  templateId: "",
  daysOfWeek: [...ALL_DAYS],
  active: true,
};

// ─── Days chips display ───────────────────────────────────────────────────────

function DaysChips({ days }: { days: number[] }) {
  const daySet = new Set(days);
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {DAY_LABELS.map((label, idx) => {
        const active = daySet.has(idx);
        return (
          <span
            key={idx}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "20px",
              height: "20px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 700,
              background: active ? "#6366f1" : "#1a1a1a",
              color: active ? "#fff" : "#3f3f46",
              border: `1px solid ${active ? "#6366f1" : "#222"}`,
            }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

// ─── Slide-in panel form ──────────────────────────────────────────────────────

function ScheduleForm({
  editingEntry,
  templates,
  onClose,
  onSaved,
}: {
  editingEntry: ScheduleEntry | null;
  templates: Template[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = editingEntry !== null;

  const buildInitialForm = useCallback((): FormState => {
    if (!isEdit) return { ...EMPTY_FORM, daysOfWeek: [...ALL_DAYS] };
    return {
      time: editingEntry.time,
      platform: editingEntry.platform,
      templateId: editingEntry.templateId,
      daysOfWeek: parseDays(editingEntry.daysOfWeek),
      active: editingEntry.active,
    };
  }, [isEdit, editingEntry]);

  const [form, setForm] = useState<FormState>(buildInitialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Templates filtered by selected platform
  const platformTemplates = templates.filter(
    (t) => t.platform === form.platform
  );

  // When platform changes, reset templateId if current one doesn't match
  function handlePlatformChange(platform: string) {
    const newPlatformTemplates = templates.filter((t) => t.platform === platform);
    const keepId = newPlatformTemplates.find((t) => t.id === form.templateId)
      ? form.templateId
      : newPlatformTemplates[0]?.id ?? "";
    setForm((prev) => ({ ...prev, platform, templateId: keepId }));
  }

  // Auto-select first template when platform templates load and no templateId
  useEffect(() => {
    if (!form.templateId && platformTemplates.length > 0) {
      setForm((prev) => ({ ...prev, templateId: platformTemplates[0].id }));
    }
  }, [form.templateId, platformTemplates]);

  function toggleDay(day: number) {
    setForm((prev) => {
      const has = prev.daysOfWeek.includes(day);
      return {
        ...prev,
        daysOfWeek: has
          ? prev.daysOfWeek.filter((d) => d !== day)
          : [...prev.daysOfWeek, day].sort((a, b) => a - b),
      };
    });
  }

  async function handleSave() {
    if (!form.time) {
      setError("Time is required.");
      return;
    }
    if (!form.platform) {
      setError("Platform is required.");
      return;
    }
    if (!form.templateId) {
      setError("Template is required.");
      return;
    }
    if (form.daysOfWeek.length === 0) {
      setError("Select at least one day.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const url = isEdit ? `/api/schedule/${editingEntry!.id}` : "/api/schedule";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time: form.time,
          platform: form.platform,
          templateId: form.templateId,
          daysOfWeek: JSON.stringify(form.daysOfWeek),
          active: form.active,
        }),
      });
      if (res.ok) {
        onSaved();
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to save.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 40,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "420px",
          maxWidth: "100vw",
          background: "#0f0f0f",
          borderLeft: "1px solid #1a1a1a",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid #1a1a1a",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: "#e4e4e7",
            }}
          >
            {isEdit ? "Edit Schedule Entry" : "Add Schedule Entry"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#52525b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "4px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* Time */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "#71717a" }}>
              Time (24h) *
            </label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
              style={{
                padding: "8px 12px",
                background: "#0a0a0a",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                color: "#e4e4e7",
                fontSize: "13px",
                outline: "none",
                width: "160px",
                colorScheme: "dark",
              }}
            />
          </div>

          {/* Platform */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "#71717a" }}>
              Platform *
            </label>
            <select
              value={form.platform}
              onChange={(e) => handlePlatformChange(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "#0a0a0a",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                color: "#e4e4e7",
                fontSize: "13px",
                outline: "none",
                cursor: "pointer",
                width: "100%",
              }}
            >
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Template (filtered by platform) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "#71717a" }}>
              Template *
            </label>
            {platformTemplates.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#52525b",
                  padding: "8px 12px",
                  background: "#0a0a0a",
                  border: "1px solid #1a1a1a",
                  borderRadius: "6px",
                }}
              >
                No templates for {platformLabel(form.platform)}. Create one in
                the Templates page first.
              </p>
            ) : (
              <select
                value={form.templateId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, templateId: e.target.value }))
                }
                style={{
                  padding: "8px 12px",
                  background: "#0a0a0a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "6px",
                  color: "#e4e4e7",
                  fontSize: "13px",
                  outline: "none",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                {platformTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Days of week */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ fontSize: "12px", fontWeight: 500, color: "#71717a" }}>
              Days of Week
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {DAY_LABELS.map((label, idx) => {
                const active = form.daysOfWeek.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "6px",
                      border: `1px solid ${active ? "#6366f1" : "#2a2a2a"}`,
                      background: active ? "rgba(99,102,241,0.15)" : "#0a0a0a",
                      color: active ? "#818cf8" : "#52525b",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, daysOfWeek: [...ALL_DAYS] }))
                }
                style={{
                  fontSize: "11px",
                  color: "#6366f1",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, daysOfWeek: [1, 2, 3, 4, 5] }))}
                style={{
                  fontSize: "11px",
                  color: "#6366f1",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                Weekdays
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, daysOfWeek: [0, 6] }))}
                style={{
                  fontSize: "11px",
                  color: "#6366f1",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                Weekends
              </button>
            </div>
          </div>

          {/* Active */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, active: e.target.checked }))
              }
              style={{ accentColor: "#6366f1" }}
            />
            <span style={{ fontSize: "13px", color: "#a1a1aa" }}>Active</span>
          </label>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #1a1a1a",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {error && (
            <p style={{ margin: 0, fontSize: "12px", color: "#f87171" }}>{error}</p>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "9px 16px",
                borderRadius: "7px",
                border: "none",
                background: "#6366f1",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Save size={13} />
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Entry"}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "9px 16px",
                borderRadius: "7px",
                border: "1px solid #2a2a2a",
                background: "transparent",
                color: "#71717a",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ScheduleEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [schedRes, tmplRes] = await Promise.all([
        fetch("/api/schedule"),
        fetch("/api/templates"),
      ]);
      if (schedRes.ok) {
        const data: ScheduleEntry[] = await schedRes.json();
        setEntries(data);
      }
      if (tmplRes.ok) {
        const data: Template[] = await tmplRes.json();
        setTemplates(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openAdd() {
    setEditingEntry(null);
    setPanelOpen(true);
  }

  function openEdit(e: ScheduleEntry) {
    setEditingEntry(e);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditingEntry(null);
  }

  function handleSaved() {
    closePanel();
    fetchData();
  }

  function handleDeleteClick(e: ScheduleEntry) {
    setDeleteConfirm(e);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/schedule/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchData();
      } else {
        const json = await res.json().catch(() => ({}));
        setDeleteError(json.error ?? "Failed to delete.");
      }
    } catch {
      setDeleteError("Network error.");
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Clock size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            Schedule
          </h1>
          {entries.length > 0 && (
            <span
              style={{
                fontSize: "12px",
                color: "#3f3f46",
                fontWeight: 500,
              }}
            >
              {entries.length} entr{entries.length !== 1 ? "ies" : "y"}
            </span>
          )}
        </div>
        <button
          onClick={openAdd}
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
          Add Entry
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 0",
          }}
        >
          <span style={{ fontSize: "13px", color: "#52525b" }}>
            Loading schedule…
          </span>
        </div>
      ) : entries.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 0",
            gap: "12px",
          }}
        >
          <Clock size={36} style={{ color: "#27272a" }} />
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              color: "#3f3f46",
              fontWeight: 500,
            }}
          >
            No schedule entries
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#27272a" }}>
            Add your first posting slot to start the automated schedule.
          </p>
          <button
            onClick={openAdd}
            style={{
              marginTop: "8px",
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
            Add Entry
          </button>
        </div>
      ) : (
        /* Table */
        <div
          style={{
            background: "#0f0f0f",
            border: "1px solid #1a1a1a",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 160px 1fr 170px 60px 120px",
              gap: "0",
              padding: "10px 16px",
              borderBottom: "1px solid #1a1a1a",
            }}
          >
            {["Time", "Platform", "Template", "Days", "Active", "Actions"].map(
              (col) => (
                <span
                  key={col}
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#3f3f46",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {col}
                </span>
              )
            )}
          </div>

          {/* Rows */}
          {entries.map((entry, idx) => {
            const days = parseDays(entry.daysOfWeek);
            const isLast = idx === entries.length - 1;
            return (
              <div
                key={entry.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 160px 1fr 170px 60px 120px",
                  gap: "0",
                  padding: "12px 16px",
                  borderBottom: isLast ? "none" : "1px solid #141414",
                  alignItems: "center",
                  transition: "background 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "#111";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                {/* Time */}
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#e4e4e7",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {entry.time}
                </span>

                {/* Platform */}
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <span style={{ fontSize: "14px" }}>
                    {platformEmoji(entry.platform)}
                  </span>
                  <span style={{ fontSize: "13px", color: "#a1a1aa" }}>
                    {platformLabel(entry.platform)}
                  </span>
                </div>

                {/* Template */}
                <span
                  style={{
                    fontSize: "13px",
                    color: "#71717a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.template?.name ?? entry.templateId}
                </span>

                {/* Days */}
                <DaysChips days={days} />

                {/* Active */}
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: entry.active ? "#4ade80" : "#3f3f46",
                  }}
                />

                {/* Actions */}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => openEdit(entry)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 10px",
                      borderRadius: "5px",
                      border: "1px solid #2a2a2a",
                      background: "transparent",
                      color: "#a1a1aa",
                      fontSize: "11px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    <Pencil size={10} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(entry)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 10px",
                      borderRadius: "5px",
                      border: "1px solid rgba(239,68,68,0.2)",
                      background: "transparent",
                      color: "#ef4444",
                      fontSize: "11px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={10} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-in form panel */}
      {panelOpen && (
        <ScheduleForm
          editingEntry={editingEntry}
          templates={templates}
          onClose={closePanel}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <>
          <div
            onClick={() => setDeleteConfirm(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 60,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#0f0f0f",
              border: "1px solid #2a2a2a",
              borderRadius: "12px",
              padding: "28px",
              zIndex: 70,
              width: "360px",
              maxWidth: "90vw",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 600,
                color: "#e4e4e7",
              }}
            >
              Delete Schedule Entry?
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#71717a" }}>
              Remove the{" "}
              <strong style={{ color: "#a1a1aa" }}>
                {deleteConfirm.time}
              </strong>{" "}
              {platformLabel(deleteConfirm.platform)} slot? This cannot be
              undone.
            </p>
            {deleteError && (
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#f87171",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "6px",
                  padding: "8px 12px",
                }}
              >
                {deleteError}
              </p>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  borderRadius: "7px",
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "7px",
                  border: "1px solid #2a2a2a",
                  background: "transparent",
                  color: "#71717a",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
