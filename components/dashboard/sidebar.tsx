"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  BookOpen,
  FileStack,
  Settings,
  Zap,
  Search,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const mainNavItems: NavItem[] = [
  {
    href: "/",
    label: "Today",
    icon: <LayoutDashboard size={18} />,
  },
  {
    href: "/research",
    label: "Research",
    icon: <Search size={18} />,
  },
  {
    href: "/content",
    label: "Content",
    icon: <BookOpen size={18} />,
  },
  {
    href: "/posts",
    label: "Posts",
    icon: <FileStack size={18} />,
  },
  {
    href: "/products",
    label: "Products",
    icon: <Megaphone size={18} />,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <Settings size={18} />,
  },
];

export function EngineSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const renderNavItem = (item: NavItem) => {
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
          PostForge
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
        {mainNavItems.map((item) => renderNavItem(item))}
      </nav>
    </aside>
  );
}
