"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutTemplate,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  ChevronRight,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  platform: string;
  charLimit: number | null;
  imageEnabled: boolean;
  imageWidth: number | null;
  imageHeight: number | null;
  videoEnabled: boolean;
  videoWidth: number | null;
  videoHeight: number | null;
  includeLink: boolean;
  aiInstructions: string | null;
  active: boolean;
  createdAt: string;
}

interface FormState {
  name: string;
  platform: string;
  charLimit: string;
  imageEnabled: boolean;
  imageWidth: string;
  imageHeight: string;
  videoEnabled: boolean;
  videoWidth: string;
  videoHeight: string;
  includeLink: boolean;
  aiInstructions: string;
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

const PLATFORM_ORDER = PLATFORMS.map((p) => p.id);

function platformLabel(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

function platformEmoji(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.emoji ?? "📌";
}

const EMPTY_FORM: FormState = {
  name: "",
  platform: "twitter",
  charLimit: "",
  imageEnabled: false,
  imageWidth: "",
  imageHeight: "",
  videoEnabled: false,
  videoWidth: "",
  videoHeight: "",
  includeLink: false,
  aiInstructions: "",
  active: true,
};

// ─── Form helpers ─────────────────────────────────────────────────────────────

function toFormState(t: Template): FormState {
  return {
    name: t.name,
    platform: t.platform,
    charLimit: t.charLimit !== null ? String(t.charLimit) : "",
    imageEnabled: t.imageEnabled,
    imageWidth: t.imageWidth !== null ? String(t.imageWidth) : "",
    imageHeight: t.imageHeight !== null ? String(t.imageHeight) : "",
    videoEnabled: t.videoEnabled,
    videoWidth: t.videoWidth !== null ? String(t.videoWidth) : "",
    videoHeight: t.videoHeight !== null ? String(t.videoHeight) : "",
    includeLink: t.includeLink,
    aiInstructions: t.aiInstructions ?? "",
    active: t.active,
  };
}

function formToPayload(f: FormState): Record<string, unknown> {
  return {
    name: f.name.trim(),
    platform: f.platform,
    charLimit: f.charLimit !== "" ? parseInt(f.charLimit, 10) : null,
    imageEnabled: f.imageEnabled,
    imageWidth: f.imageEnabled && f.imageWidth !== "" ? parseInt(f.imageWidth, 10) : null,
    imageHeight:
      f.imageEnabled && f.imageHeight !== "" ? parseInt(f.imageHeight, 10) : null,
    videoEnabled: f.videoEnabled,
    videoWidth: f.videoEnabled && f.videoWidth !== "" ? parseInt(f.videoWidth, 10) : null,
    videoHeight:
      f.videoEnabled && f.videoHeight !== "" ? parseInt(f.videoHeight, 10) : null,
    includeLink: f.includeLink,
    aiInstructions: f.aiInstructions.trim() || null,
    active: f.active,
  };
}

// ─── Constraint chip ──────────────────────────────────────────────────────────

function Chip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 7px",
        borderRadius: "4px",
        background: "#161616",
        border: "1px solid #222",
        fontSize: "11px",
        color: "#71717a",
        fontWeight: 500,
      }}
    >
      {label}
    </span>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: Template;
  onEdit: (t: Template) => void;
  onDelete: (t: Template) => void;
}) {
  const excerpt = template.aiInstructions
    ? template.aiInstructions.length > 80
      ? template.aiInstructions.slice(0, 80) + "…"
      : template.aiInstructions
    : null;

  return (
    <div
      style={{
        background: "#0f0f0f",
        border: "1px solid #1a1a1a",
        borderRadius: "10px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Name + active badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#e4e4e7",
            flex: 1,
          }}
        >
          {template.name}
        </span>
        {!template.active && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#52525b",
              background: "#141414",
              border: "1px solid #222",
              borderRadius: "4px",
              padding: "2px 6px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Inactive
          </span>
        )}
      </div>

      {/* Constraint chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {template.charLimit !== null && (
          <Chip label={`≤${template.charLimit} chars`} />
        )}
        {template.imageEnabled && template.imageWidth && template.imageHeight && (
          <Chip label={`${template.imageWidth}×${template.imageHeight} img`} />
        )}
        {template.imageEnabled && (!template.imageWidth || !template.imageHeight) && (
          <Chip label="image" />
        )}
        {template.videoEnabled && template.videoWidth && template.videoHeight && (
          <Chip label={`${template.videoWidth}×${template.videoHeight} video`} />
        )}
        {template.videoEnabled && (!template.videoWidth || !template.videoHeight) && (
          <Chip label="video" />
        )}
        {template.includeLink && <Chip label="link" />}
        {!template.charLimit && !template.imageEnabled && !template.videoEnabled && !template.includeLink && (
          <Chip label="no constraints" />
        )}
      </div>

      {/* AI instructions excerpt */}
      {excerpt && (
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            color: "#52525b",
            lineHeight: "1.5",
            fontStyle: "italic",
          }}
        >
          {excerpt}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
        <button
          onClick={() => onEdit(template)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 12px",
            borderRadius: "6px",
            border: "1px solid #2a2a2a",
            background: "transparent",
            color: "#a1a1aa",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <Pencil size={11} />
          Edit
        </button>
        <button
          onClick={() => onDelete(template)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 12px",
            borderRadius: "6px",
            border: "1px solid rgba(239,68,68,0.2)",
            background: "transparent",
            color: "#ef4444",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <Trash2 size={11} />
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Form fields helpers ──────────────────────────────────────────────────────

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 500, color: "#71717a" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FormInput({
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      style={{
        padding: "8px 10px",
        background: "#0a0a0a",
        border: "1px solid #2a2a2a",
        borderRadius: "6px",
        color: "#e4e4e7",
        fontSize: "13px",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
      }}
    />
  );
}

function FormToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={() => onChange(!checked)}
    >
      <div
        style={{
          width: "36px",
          height: "20px",
          borderRadius: "10px",
          background: checked ? "#6366f1" : "#1a1a1a",
          border: `1px solid ${checked ? "#6366f1" : "#2a2a2a"}`,
          position: "relative",
          transition: "background 0.15s ease",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "2px",
            left: checked ? "17px" : "2px",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.15s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "13px", color: "#a1a1aa" }}>{label}</span>
    </div>
  );
}

// ─── Slide-in panel form ──────────────────────────────────────────────────────

function TemplateForm({
  editingTemplate,
  onClose,
  onSaved,
}: {
  editingTemplate: Template | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = editingTemplate !== null;
  const [form, setForm] = useState<FormState>(
    isEdit ? toFormState(editingTemplate) : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.platform) {
      setError("Platform is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = isEdit ? `/api/templates/${editingTemplate!.id}` : "/api/templates";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form)),
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
          width: "440px",
          maxWidth: "100vw",
          background: "#0f0f0f",
          borderLeft: "1px solid #1a1a1a",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Panel header */}
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
            {isEdit ? "Edit Template" : "New Template"}
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

        {/* Panel body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <FormField label="Name *">
            <FormInput
              value={form.name}
              onChange={(v) => setField("name", v)}
              placeholder="e.g. Short Tweet + Link"
            />
          </FormField>

          <FormField label="Platform *">
            <select
              value={form.platform}
              onChange={(e) => setField("platform", e.target.value)}
              style={{
                padding: "8px 10px",
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
          </FormField>

          <FormField label="Character Limit (optional)">
            <FormInput
              type="number"
              value={form.charLimit}
              onChange={(v) => setField("charLimit", v)}
              placeholder="e.g. 280"
              min={1}
            />
          </FormField>

          {/* Image toggle */}
          <div
            style={{
              background: "#0a0a0a",
              border: "1px solid #1a1a1a",
              borderRadius: "8px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <FormToggle
              checked={form.imageEnabled}
              onChange={(v) => setField("imageEnabled", v)}
              label="Requires Image"
            />
            {form.imageEnabled && (
              <div style={{ display: "flex", gap: "10px" }}>
                <FormField label="Width (px)">
                  <FormInput
                    type="number"
                    value={form.imageWidth}
                    onChange={(v) => setField("imageWidth", v)}
                    placeholder="1080"
                    min={1}
                  />
                </FormField>
                <FormField label="Height (px)">
                  <FormInput
                    type="number"
                    value={form.imageHeight}
                    onChange={(v) => setField("imageHeight", v)}
                    placeholder="1080"
                    min={1}
                  />
                </FormField>
              </div>
            )}
          </div>

          {/* Video toggle */}
          <div
            style={{
              background: "#0a0a0a",
              border: "1px solid #1a1a1a",
              borderRadius: "8px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <FormToggle
              checked={form.videoEnabled}
              onChange={(v) => setField("videoEnabled", v)}
              label="Requires Video"
            />
            {form.videoEnabled && (
              <div style={{ display: "flex", gap: "10px" }}>
                <FormField label="Width (px)">
                  <FormInput
                    type="number"
                    value={form.videoWidth}
                    onChange={(v) => setField("videoWidth", v)}
                    placeholder="1080"
                    min={1}
                  />
                </FormField>
                <FormField label="Height (px)">
                  <FormInput
                    type="number"
                    value={form.videoHeight}
                    onChange={(v) => setField("videoHeight", v)}
                    placeholder="1920"
                    min={1}
                  />
                </FormField>
              </div>
            )}
          </div>

          <FormField label="">
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
                checked={form.includeLink}
                onChange={(e) => setField("includeLink", e.target.checked)}
                style={{ accentColor: "#6366f1" }}
              />
              <span style={{ fontSize: "13px", color: "#a1a1aa" }}>Include Link</span>
            </label>
          </FormField>

          <FormField label="AI Instructions">
            <textarea
              rows={4}
              value={form.aiInstructions}
              onChange={(e) => setField("aiInstructions", e.target.value)}
              placeholder="Describe tone, format, and any special rules..."
              style={{
                padding: "8px 10px",
                background: "#0a0a0a",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                color: "#e4e4e7",
                fontSize: "13px",
                outline: "none",
                width: "100%",
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: "1.5",
                boxSizing: "border-box",
              }}
            />
          </FormField>

          <FormField label="">
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
                onChange={(e) => setField("active", e.target.checked)}
                style={{ accentColor: "#6366f1" }}
              />
              <span style={{ fontSize: "13px", color: "#a1a1aa" }}>Active</span>
            </label>
          </FormField>
        </div>

        {/* Panel footer */}
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
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Template"}
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

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Template | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data: Template[] = await res.json();
        setTemplates(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  function openCreate() {
    setEditingTemplate(null);
    setPanelOpen(true);
  }

  function openEdit(t: Template) {
    setEditingTemplate(t);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditingTemplate(null);
  }

  function handleSaved() {
    closePanel();
    fetchTemplates();
  }

  function handleDeleteClick(t: Template) {
    setDeleteConfirm(t);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/templates/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchTemplates();
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

  // Group by platform in a consistent order
  const grouped = PLATFORM_ORDER.reduce<{ platform: string; items: Template[] }[]>(
    (acc, pid) => {
      const items = templates.filter((t) => t.platform === pid);
      if (items.length > 0) {
        acc.push({ platform: pid, items });
      }
      return acc;
    },
    []
  );

  // Also catch any platforms not in PLATFORM_ORDER
  const knownPlatforms = new Set(PLATFORM_ORDER);
  const extraPlatforms = [...new Set(templates.map((t) => t.platform))].filter(
    (p) => !knownPlatforms.has(p)
  );
  for (const pid of extraPlatforms) {
    grouped.push({
      platform: pid,
      items: templates.filter((t) => t.platform === pid),
    });
  }

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
          <LayoutTemplate size={20} style={{ color: "#6366f1", flexShrink: 0 }} />
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "#e4e4e7",
            }}
          >
            Templates
          </h1>
          {templates.length > 0 && (
            <span
              style={{
                fontSize: "12px",
                color: "#3f3f46",
                fontWeight: 500,
              }}
            >
              {templates.length} template{templates.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={openCreate}
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
          New Template
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
          <span style={{ fontSize: "13px", color: "#52525b" }}>Loading templates…</span>
        </div>
      ) : grouped.length === 0 ? (
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
          <LayoutTemplate size={36} style={{ color: "#27272a" }} />
          <p style={{ margin: 0, fontSize: "15px", color: "#3f3f46", fontWeight: 500 }}>
            No templates yet
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#27272a" }}>
            Create your first template to define how AI formats content per platform.
          </p>
          <button
            onClick={openCreate}
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
            New Template
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {grouped.map(({ platform, items }) => (
            <div key={platform}>
              {/* Platform section heading */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <span style={{ fontSize: "16px" }}>{platformEmoji(platform)}</span>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#a1a1aa",
                    textTransform: "capitalize",
                  }}
                >
                  {platformLabel(platform)}
                </h2>
                <ChevronRight size={12} style={{ color: "#3f3f46" }} />
                <span style={{ fontSize: "12px", color: "#3f3f46" }}>
                  {items.length} template{items.length !== 1 ? "s" : ""}
                </span>
                <div
                  style={{ flex: 1, height: "1px", background: "#1a1a1a" }}
                />
              </div>

              {/* Cards grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "12px",
                }}
              >
                {items.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onEdit={openEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-in form panel */}
      {panelOpen && (
        <TemplateForm
          editingTemplate={editingTemplate}
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
              Delete Template?
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#71717a" }}>
              Are you sure you want to delete{" "}
              <strong style={{ color: "#a1a1aa" }}>{deleteConfirm.name}</strong>? This
              cannot be undone.
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
