"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Eye,
  EyeOff,
  LayoutTemplate,
  Save,
  ScrollText,
} from "lucide-react";

export function SectionCard({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
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

const QUICK_LINKS = [
  {
    href: "/templates",
    label: "Templates",
    Icon: LayoutTemplate,
    description: "Manage post templates",
  },
  {
    href: "/schedule",
    label: "Schedule",
    Icon: Clock,
    description: "Configure posting schedule",
  },
  {
    href: "/logs",
    label: "Logs",
    Icon: ScrollText,
    description: "View activity logs",
  },
] as const;

export function QuickAccess() {
  return (
    <div>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: "12px",
          fontWeight: 600,
          color: "#52525b",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Quick Access
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        {QUICK_LINKS.map(({ href, label, Icon, description }) => (
          <Link key={href} href={href} style={{ textDecoration: "none" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                background: "#0f0f0f",
                border: "1px solid #1a1a1a",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "border-color 0.15s ease, background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "#2a2a2a";
                (e.currentTarget as HTMLDivElement).style.background =
                  "#141414";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "#1a1a1a";
                (e.currentTarget as HTMLDivElement).style.background =
                  "#0f0f0f";
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Icon size={16} style={{ color: "#6366f1", flexShrink: 0 }} />
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#e4e4e7",
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "11px",
                      color: "#52525b",
                    }}
                  >
                    {description}
                  </p>
                </div>
              </div>
              <ArrowRight
                size={14}
                style={{ color: "#3f3f46", flexShrink: 0 }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
