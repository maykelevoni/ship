"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Link as LinkIcon,
  Gift,
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Archive,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PromotionType =
  | "product"
  | "service"
  | "affiliate"
  | "lead_magnet"
  | "content";

export interface PromotionFormData {
  type: PromotionType | "";
  name: string;
  description: string;
  url: string;
  notes: string;
  weight: number;
  // product / service only
  price: string;
  benefits: string[];
  targetAudience: string;
  // affiliate only
  affiliateLink: string;
  commission: string;
  // lead_magnet only
  leadMagnetWhat: string;
  leadMagnetAudience: string;
}

interface PromotionFormProps {
  /** When provided, renders the edit form pre-filled with this data. */
  initialData?: Partial<PromotionFormData> & { id: string };
  mode: "create" | "edit";
}

// ─── Type card config ──────────────────────────────────────────────────────────

const TYPE_CARDS: {
  value: PromotionType;
  label: string;
  sub: string;
  Icon: React.FC<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  bg: string;
}[] = [
  {
    value: "product",
    label: "Product",
    sub: "Physical or digital product",
    Icon: Package,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
  },
  {
    value: "service",
    label: "Service",
    sub: "Offering or subscription",
    Icon: Package,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
  },
  {
    value: "affiliate",
    label: "Affiliate Offer",
    sub: "Third-party with commission",
    Icon: LinkIcon,
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
  },
  {
    value: "lead_magnet",
    label: "Lead Magnet",
    sub: "Free resource or checklist",
    Icon: Gift,
    color: "#c084fc",
    bg: "rgba(192,132,252,0.08)",
  },
  {
    value: "content",
    label: "Content Piece",
    sub: "Article, video, or post",
    Icon: FileText,
    color: "#a1a1aa",
    bg: "rgba(161,161,170,0.08)",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function buildDefault(initial?: Partial<PromotionFormData>): PromotionFormData {
  return {
    type: initial?.type ?? "",
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    url: initial?.url ?? "",
    notes: initial?.notes ?? "",
    weight: initial?.weight ?? 5,
    price: initial?.price ?? "",
    benefits: initial?.benefits ?? [""],
    targetAudience: initial?.targetAudience ?? "",
    affiliateLink: initial?.affiliateLink ?? "",
    commission: initial?.commission ?? "",
    leadMagnetWhat: initial?.leadMagnetWhat ?? "",
    leadMagnetAudience: initial?.leadMagnetAudience ?? "",
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldGroup({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{ fontSize: "13px", fontWeight: 600, color: "#a1a1aa" }}
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <span style={{ fontSize: "11px", color: "#52525b" }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontSize: "11px", color: "#f87171" }}>{error}</span>
      )}
    </div>
  );
}

function StyledInput({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        background: "#0a0a0a",
        border: "1px solid #2a2a2a",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "14px",
        color: "#e4e4e7",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        transition: "border-color 0.15s ease",
      }}
      onFocus={(e) => {
        (e.target as HTMLInputElement).style.borderColor = "#6366f1";
      }}
      onBlur={(e) => {
        (e.target as HTMLInputElement).style.borderColor = "#2a2a2a";
      }}
    />
  );
}

function StyledTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        background: "#0a0a0a",
        border: "1px solid #2a2a2a",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "14px",
        color: "#e4e4e7",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        resize: "vertical",
        fontFamily: "inherit",
        transition: "border-color 0.15s ease",
      }}
      onFocus={(e) => {
        (e.target as HTMLTextAreaElement).style.borderColor = "#6366f1";
      }}
      onBlur={(e) => {
        (e.target as HTMLTextAreaElement).style.borderColor = "#2a2a2a";
      }}
    />
  );
}

// ─── Step 1: Type Selection ────────────────────────────────────────────────────

function StepType({
  selected,
  onSelect,
}: {
  selected: PromotionType | "";
  onSelect: (t: PromotionType) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2
          style={{
            margin: "0 0 6px",
            fontSize: "18px",
            fontWeight: 700,
            color: "#e4e4e7",
          }}
        >
          What are you promoting?
        </h2>
        <p style={{ margin: 0, fontSize: "13px", color: "#71717a" }}>
          Choose a type — it determines which fields appear next.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {TYPE_CARDS.map((card) => {
          const isSelected = selected === card.value;
          return (
            <button
              key={card.value}
              onClick={() => onSelect(card.value)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                padding: "20px 18px",
                borderRadius: "10px",
                border: isSelected
                  ? `1px solid ${card.color}`
                  : "1px solid #1e1e1e",
                background: isSelected ? card.bg : "#0a0a0a",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
                position: "relative",
              }}
            >
              {isSelected && (
                <span
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: card.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={11} style={{ color: "#000" }} />
                </span>
              )}
              <card.Icon
                size={24}
                style={{ color: isSelected ? card.color : "#52525b" }}
              />
              <div>
                <p
                  style={{
                    margin: "0 0 2px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: isSelected ? card.color : "#e4e4e7",
                  }}
                >
                  {card.label}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#52525b",
                    lineHeight: "1.4",
                  }}
                >
                  {card.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Details ──────────────────────────────────────────────────────────

function StepDetails({
  form,
  onChange,
  errors,
}: {
  form: PromotionFormData;
  onChange: <K extends keyof PromotionFormData>(
    key: K,
    value: PromotionFormData[K],
  ) => void;
  errors: Partial<Record<keyof PromotionFormData, string>>;
}) {
  const isProductOrService =
    form.type === "product" || form.type === "service";
  const isAffiliate = form.type === "affiliate";
  const isLeadMagnet = form.type === "lead_magnet";

  // Benefits multi-input
  const addBenefit = useCallback(() => {
    if (form.benefits.length < 5) {
      onChange("benefits", [...form.benefits, ""]);
    }
  }, [form.benefits, onChange]);

  const updateBenefit = useCallback(
    (i: number, v: string) => {
      const next = [...form.benefits];
      next[i] = v;
      onChange("benefits", next);
    },
    [form.benefits, onChange],
  );

  const removeBenefit = useCallback(
    (i: number) => {
      onChange(
        "benefits",
        form.benefits.filter((_, idx) => idx !== i),
      );
    },
    [form.benefits, onChange],
  );

  const typeLabel =
    TYPE_CARDS.find((c) => c.value === form.type)?.label ?? form.type;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2
          style={{
            margin: "0 0 4px",
            fontSize: "18px",
            fontWeight: 700,
            color: "#e4e4e7",
          }}
        >
          {typeLabel} Details
        </h2>
        <p style={{ margin: 0, fontSize: "13px", color: "#71717a" }}>
          Fill in the details for your promotion.
        </p>
      </div>

      {/* Name */}
      <FieldGroup label="Name *" error={errors.name}>
        <StyledInput
          value={form.name}
          onChange={(v) => onChange("name", v)}
          placeholder="e.g. My SaaS Product"
        />
      </FieldGroup>

      {/* Description */}
      <FieldGroup label="Description *" error={errors.description}>
        <StyledTextarea
          value={form.description}
          onChange={(v) => onChange("description", v)}
          placeholder="A brief description of what you're promoting…"
          rows={3}
        />
      </FieldGroup>

      {/* URL */}
      <FieldGroup
        label="URL *"
        hint="Must be a valid URL starting with https://"
        error={errors.url}
      >
        <StyledInput
          value={form.url}
          onChange={(v) => onChange("url", v)}
          placeholder="https://example.com"
          type="url"
        />
      </FieldGroup>

      {/* Affiliate-only fields */}
      {isAffiliate && (
        <>
          <FieldGroup label="Affiliate Link *" error={errors.affiliateLink}>
            <StyledInput
              value={form.affiliateLink}
              onChange={(v) => onChange("affiliateLink", v)}
              placeholder="https://example.com/ref/you"
              type="url"
            />
          </FieldGroup>
          <FieldGroup
            label="Commission"
            hint="e.g. 30% or $10 flat"
            error={errors.commission}
          >
            <StyledInput
              value={form.commission}
              onChange={(v) => onChange("commission", v)}
              placeholder="30%"
            />
          </FieldGroup>
        </>
      )}

      {/* Product / Service only */}
      {isProductOrService && (
        <>
          <FieldGroup
            label="Price"
            hint="e.g. $49/mo or Free"
            error={errors.price}
          >
            <StyledInput
              value={form.price}
              onChange={(v) => onChange("price", v)}
              placeholder="$49/mo"
            />
          </FieldGroup>

          <FieldGroup
            label="Key Benefits"
            hint="Up to 5 bullet points"
            error={errors.benefits as string | undefined}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {form.benefits.map((b, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <StyledInput
                    value={b}
                    onChange={(v) => updateBenefit(i, v)}
                    placeholder={`Benefit ${i + 1}`}
                  />
                  {form.benefits.length > 1 && (
                    <button
                      onClick={() => removeBenefit(i)}
                      type="button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        border: "1px solid #2a2a2a",
                        background: "transparent",
                        color: "#71717a",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {form.benefits.length < 5 && (
                <button
                  onClick={addBenefit}
                  type="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "7px",
                    border: "1px dashed #2a2a2a",
                    background: "transparent",
                    color: "#71717a",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    width: "fit-content",
                  }}
                >
                  <Plus size={13} />
                  Add Benefit
                </button>
              )}
            </div>
          </FieldGroup>

          <FieldGroup label="Target Audience" error={errors.targetAudience}>
            <StyledInput
              value={form.targetAudience}
              onChange={(v) => onChange("targetAudience", v)}
              placeholder="e.g. SaaS founders, indie hackers"
            />
          </FieldGroup>
        </>
      )}

      {/* Lead Magnet only */}
      {isLeadMagnet && (
        <>
          <FieldGroup
            label="What is it?"
            hint="e.g. PDF checklist, email course"
            error={errors.leadMagnetWhat}
          >
            <StyledInput
              value={form.leadMagnetWhat}
              onChange={(v) => onChange("leadMagnetWhat", v)}
              placeholder="PDF checklist"
            />
          </FieldGroup>
          <FieldGroup
            label="Target Audience"
            error={errors.leadMagnetAudience}
          >
            <StyledInput
              value={form.leadMagnetAudience}
              onChange={(v) => onChange("leadMagnetAudience", v)}
              placeholder="e.g. early-stage founders"
            />
          </FieldGroup>
        </>
      )}

      {/* Notes */}
      <FieldGroup label="Notes" hint="Optional internal notes" error={errors.notes}>
        <StyledTextarea
          value={form.notes}
          onChange={(v) => onChange("notes", v)}
          placeholder="Any extra context or instructions for the AI…"
          rows={2}
        />
      </FieldGroup>

      {/* Weight */}
      <FieldGroup
        label="How often to promote? (Weight)"
        hint={`${form.weight} / 10 — higher = promoted more frequently`}
      >
        <input
          type="range"
          min={1}
          max={10}
          value={form.weight}
          onChange={(e) => onChange("weight", Number(e.target.value))}
          style={{
            width: "100%",
            accentColor: "#6366f1",
            cursor: "pointer",
            height: "4px",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            color: "#52525b",
            marginTop: "2px",
          }}
        >
          <span>1</span>
          <span style={{ fontWeight: 700, color: "#6366f1", fontSize: "13px" }}>
            {form.weight}
          </span>
          <span>10</span>
        </div>
      </FieldGroup>
    </div>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "10px 0",
        borderBottom: "1px solid #1a1a1a",
        alignItems: "flex-start",
      }}
    >
      <span
        style={{
          fontSize: "12px",
          color: "#52525b",
          fontWeight: 600,
          minWidth: "120px",
          flexShrink: 0,
          paddingTop: "1px",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "13px",
          color: "#a1a1aa",
          lineHeight: "1.5",
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function StepReview({
  form,
  mode,
}: {
  form: PromotionFormData;
  mode: "create" | "edit";
}) {
  const typeLabel =
    TYPE_CARDS.find((c) => c.value === form.type)?.label ?? form.type;
  const isProductOrService =
    form.type === "product" || form.type === "service";
  const isAffiliate = form.type === "affiliate";
  const isLeadMagnet = form.type === "lead_magnet";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2
          style={{
            margin: "0 0 4px",
            fontSize: "18px",
            fontWeight: 700,
            color: "#e4e4e7",
          }}
        >
          Review
        </h2>
        <p style={{ margin: 0, fontSize: "13px", color: "#71717a" }}>
          {mode === "create"
            ? "Confirm everything looks right, then create."
            : "Review your changes, then save."}
        </p>
      </div>

      <div
        style={{
          background: "#0a0a0a",
          border: "1px solid #1e1e1e",
          borderRadius: "10px",
          padding: "4px 16px",
        }}
      >
        <ReviewRow label="Type" value={typeLabel} />
        <ReviewRow label="Name" value={form.name} />
        <ReviewRow label="Description" value={form.description} />
        <ReviewRow label="URL" value={form.url} />
        {isAffiliate && (
          <>
            <ReviewRow label="Affiliate Link" value={form.affiliateLink} />
            <ReviewRow label="Commission" value={form.commission} />
          </>
        )}
        {isProductOrService && (
          <>
            <ReviewRow label="Price" value={form.price} />
            <ReviewRow
              label="Benefits"
              value={form.benefits.filter(Boolean).join(" · ")}
            />
            <ReviewRow label="Target Audience" value={form.targetAudience} />
          </>
        )}
        {isLeadMagnet && (
          <>
            <ReviewRow label="What is it?" value={form.leadMagnetWhat} />
            <ReviewRow
              label="Target Audience"
              value={form.leadMagnetAudience}
            />
          </>
        )}
        <ReviewRow label="Notes" value={form.notes} />
        <ReviewRow label="Weight" value={`${form.weight} / 10`} />
      </div>
    </div>
  );
}

// ─── Main PromotionForm ────────────────────────────────────────────────────────

export function PromotionForm({ initialData, mode }: PromotionFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(mode === "edit" ? 2 : 1);
  const [form, setForm] = useState<PromotionFormData>(
    buildDefault(initialData),
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof PromotionFormData, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const onChange = useCallback(
    <K extends keyof PromotionFormData>(
      key: K,
      value: PromotionFormData[K],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    [],
  );

  // ── Validation ─────────────────────────────────────────────────────────────

  function validateStep1(): boolean {
    if (!form.type) {
      setErrors({ type: "Please select a type" });
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    const next: Partial<Record<keyof PromotionFormData, string>> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.description.trim()) next.description = "Description is required";
    if (!form.url.trim()) {
      next.url = "URL is required";
    } else if (!isValidUrl(form.url)) {
      next.url = "Must be a valid URL (e.g. https://example.com)";
    }
    if (form.type === "affiliate" && form.affiliateLink && !isValidUrl(form.affiliateLink)) {
      next.affiliateLink = "Must be a valid URL";
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return false;
    }
    return true;
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function handleNext() {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
    }
  }

  function handleBack() {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);

    const payload: Record<string, unknown> = {
      type: form.type,
      name: form.name.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      notes: form.notes.trim() || undefined,
      weight: form.weight,
    };

    if (form.type === "product" || form.type === "service") {
      payload.price = form.price.trim() || undefined;
      payload.benefits = form.benefits.filter(Boolean);
      payload.targetAudience = form.targetAudience.trim() || undefined;
    }

    if (form.type === "affiliate") {
      payload.affiliateLink = form.affiliateLink.trim() || undefined;
      payload.commission = form.commission.trim() || undefined;
    }

    if (form.type === "lead_magnet") {
      payload.leadMagnetWhat = form.leadMagnetWhat.trim() || undefined;
      payload.targetAudience = form.leadMagnetAudience.trim() || undefined;
    }

    try {
      const url =
        mode === "edit"
          ? `/api/promotions/${initialData!.id}`
          : "/api/promotions";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(
          (body as { error?: string }).error ??
            "Something went wrong. Please try again.",
        );
        return;
      }

      router.push("/promotions");
    } catch {
      setSubmitError("Network error — please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Archive (edit mode) ────────────────────────────────────────────────────

  async function handleArchive() {
    if (!initialData?.id) return;
    setArchiving(true);
    try {
      await fetch(`/api/promotions/${initialData.id}`, { method: "DELETE" });
      router.push("/promotions");
    } catch {
      // silently fail
    } finally {
      setArchiving(false);
    }
  }

  // ── Step indicator ─────────────────────────────────────────────────────────

  const steps = mode === "edit" ? ["Details", "Review"] : ["Type", "Details", "Review"];
  const currentStepIdx = mode === "edit" ? step - 2 : step - 1;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Step indicator */}
      {mode === "create" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
          {steps.map((s, i) => {
            const done = i < currentStepIdx;
            const active = i === currentStepIdx;
            return (
              <div
                key={s}
                style={{ display: "flex", alignItems: "center", gap: "0" }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: done
                        ? "#6366f1"
                        : active
                          ? "#6366f1"
                          : "#1e1e1e",
                      border: active
                        ? "2px solid #6366f1"
                        : done
                          ? "none"
                          : "2px solid #2a2a2a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: done || active ? "#fff" : "#52525b",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {done ? <Check size={13} /> : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: active ? "#e4e4e7" : "#52525b",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {s}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: "2px",
                      background: i < currentStepIdx ? "#6366f1" : "#1e1e1e",
                      width: "64px",
                      marginBottom: "18px",
                      transition: "background 0.2s ease",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Step content */}
      <div>
        {step === 1 && mode === "create" && (
          <StepType
            selected={form.type}
            onSelect={(t) => onChange("type", t)}
          />
        )}
        {step === 2 && (
          <StepDetails form={form} onChange={onChange} errors={errors} />
        )}
        {step === 3 && <StepReview form={form} mode={mode} />}
      </div>

      {/* Error banner */}
      {submitError && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#f87171",
          }}
        >
          {submitError}
        </div>
      )}

      {/* Navigation buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "8px",
          borderTop: "1px solid #1a1a1a",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* Back / Archive */}
        <div style={{ display: "flex", gap: "10px" }}>
          {step > (mode === "edit" ? 2 : 1) && (
            <button
              onClick={handleBack}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 16px",
                borderRadius: "8px",
                border: "1px solid #2a2a2a",
                background: "transparent",
                color: "#a1a1aa",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={15} />
              Back
            </button>
          )}

          {mode === "edit" && (
            <button
              onClick={handleArchive}
              disabled={archiving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(239,68,68,0.3)",
                background: "transparent",
                color: "#ef4444",
                fontSize: "13px",
                fontWeight: 500,
                cursor: archiving ? "not-allowed" : "pointer",
                opacity: archiving ? 0.6 : 1,
              }}
            >
              <Archive size={14} />
              {archiving ? "Archiving…" : "Archive"}
            </button>
          )}
        </div>

        {/* Next / Submit */}
        {step < 3 ? (
          <button
            onClick={handleNext}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#6366f1",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Next
            <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 20px",
              borderRadius: "8px",
              border: "none",
              background: submitting ? "rgba(99,102,241,0.5)" : "#6366f1",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "background 0.15s ease",
            }}
          >
            {submitting
              ? "Saving…"
              : mode === "create"
                ? "Create Promotion"
                : "Save Changes"}
          </button>
        )}
      </div>
    </div>
  );
}
