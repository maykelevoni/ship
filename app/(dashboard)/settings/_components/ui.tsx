"use client";

import { useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";

export function SectionCard({
  children,
  title,
  description,
  icon,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
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
          padding: "20px 24px",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {icon && (
            <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              {icon}
            </span>
          )}
          <h2
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 600,
              color: "#e4e4e7",
            }}
          >
            {title}
          </h2>
        </div>
        {description && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "12px",
              color: "#52525b",
            }}
          >
            {description}
          </p>
        )}
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );
}

export function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr",
        gap: "16px",
        alignItems: "center",
        paddingBottom: "16px",
        borderBottom: "1px solid #141414",
        marginBottom: "16px",
      }}
    >
      <label style={{ fontSize: "13px", fontWeight: 500, color: "#a1a1aa" }}>
        {label}
      </label>
      <div>{children}</div>
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "8px 12px",
        background: "#0a0a0a",
        border: "1px solid #2a2a2a",
        borderRadius: "7px",
        color: "#e4e4e7",
        fontSize: "13px",
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

export function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "8px 40px 8px 12px",
          background: "#0a0a0a",
          border: "1px solid #2a2a2a",
          borderRadius: "7px",
          color: "#e4e4e7",
          fontSize: "13px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: "#52525b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: "2px",
        }}
        aria-label={show ? "Hide" : "Show"}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

export function Toggle({
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
        gap: "12px",
        cursor: "pointer",
      }}
      onClick={() => onChange(!checked)}
    >
      <div
        style={{
          width: "40px",
          height: "22px",
          borderRadius: "11px",
          background: checked ? "#6366f1" : "#1a1a1a",
          border: `1px solid ${checked ? "#6366f1" : "#2a2a2a"}`,
          position: "relative",
          transition: "background 0.15s ease, border-color 0.15s ease",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "2px",
            left: checked ? "19px" : "2px",
            width: "16px",
            height: "16px",
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

export function SaveButton({
  onClick,
  loading,
  feedback,
}: {
  onClick: () => void;
  loading: boolean;
  feedback: "saved" | "error" | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        paddingTop: "4px",
      }}
    >
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 18px",
          borderRadius: "7px",
          border: "none",
          background: "#6366f1",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        <Save size={13} />
        {loading ? "Saving…" : "Save"}
      </button>
      {feedback === "saved" && (
        <span
          style={{
            fontSize: "13px",
            color: "#4ade80",
            fontWeight: 500,
          }}
        >
          Saved!
        </span>
      )}
      {feedback === "error" && (
        <span
          style={{
            fontSize: "13px",
            color: "#f87171",
            fontWeight: 500,
          }}
        >
          Save failed. Please try again.
        </span>
      )}
    </div>
  );
}
