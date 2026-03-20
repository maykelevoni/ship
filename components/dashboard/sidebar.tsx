"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Megaphone,
  ListTodo,
  ScrollText,
  Settings,
  Zap,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | null;
  position?: "bottom";
}

const mainNavItems: NavItem[] = [
  {
    href: "/",
    label: "Today",
    icon: <LayoutDashboard size={18} />,
  },
  {
    href: "/promotions",
    label: "Promotions",
    icon: <Megaphone size={18} />,
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: <CalendarDays size={18} />,
  },
  {
    href: "/queue",
    label: "Queue",
    icon: <ListTodo size={18} />,
  },
  {
    href: "/logs",
    label: "Logs",
    icon: <ScrollText size={18} />,
  },
];

const bottomNavItems: NavItem[] = [
  {
    href: "/settings",
    label: "Settings",
    icon: <Settings size={18} />,
    position: "bottom",
  },
];

export function EngineSidebar() {
  const pathname = usePathname();
  const [queueCount, setQueueCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchQueueCount() {
      try {
        const res = await fetch("/api/queue");
        if (res.ok) {
          const data = await res.json();
          const pending = Array.isArray(data)
            ? data.filter(
                (item: { status: string }) =>
                  item.status === "queued" || item.status === "generated",
              ).length
            : 0;
          setQueueCount(pending > 0 ? pending : null);
        }
      } catch {
        // silently fail — badge is non-critical
      }
    }
    fetchQueueCount();
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem, badge?: number | null) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 12px",
          borderRadius: "6px",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
          color: active ? "#818cf8" : "#a1a1aa",
          background: active ? "rgba(99, 102, 241, 0.15)" : "transparent",
          transition: "background 0.15s ease, color 0.15s ease",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLAnchorElement).style.background = "#1a1a1a";
            (e.currentTarget as HTMLAnchorElement).style.color = "#e4e4e7";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "transparent";
            (e.currentTarget as HTMLAnchorElement).style.color = "#a1a1aa";
          }
        }}
      >
        <span style={{ color: active ? "#818cf8" : "inherit", flexShrink: 0 }}>
          {item.icon}
        </span>
        <span style={{ flex: 1 }}>{item.label}</span>
        {badge != null && badge > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "20px",
              height: "20px",
              padding: "0 5px",
              borderRadius: "10px",
              background: "#6366f1",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      style={{
        width: "240px",
        minWidth: "240px",
        height: "100vh",
        background: "#0f0f0f",
        borderRight: "1px solid #1a1a1a",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        overflowY: "auto",
      }}
    >
      {/* App name / logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "20px 16px 16px",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        <Zap size={16} style={{ color: "#6366f1", flexShrink: 0 }} />
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#e4e4e7",
            letterSpacing: "0.01em",
          }}
        >
          Promotion Engine
        </span>
      </div>

      {/* Main nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {mainNavItems.map((item) =>
          renderNavItem(item, item.href === "/queue" ? queueCount : undefined),
        )}
      </nav>

      {/* Bottom nav (Settings) */}
      <div
        style={{
          padding: "8px 8px 16px",
          borderTop: "1px solid #1a1a1a",
        }}
      >
        {bottomNavItems.map((item) => renderNavItem(item))}
      </div>
    </aside>
  );
}
