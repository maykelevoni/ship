import { Suspense } from "react";
import { db } from "@/lib/db";
import { TodayView } from "@/components/dashboard/today-view";
import type { ContentPieceData } from "@/components/dashboard/platform-status-card";

// ─── Data fetching helpers ────────────────────────────────────────────────────

async function getTodayPieces(): Promise<ContentPieceData[]> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const DISPLAY_PLATFORMS = [
    "twitter",
    "linkedin",
    "video",
    "reddit",
    "instagram",
    "email",
  ];

  try {
    const pieces = await db.contentPiece.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        platform: { in: DISPLAY_PLATFORMS },
      },
      orderBy: { platform: "asc" },
    });

    // One piece per platform (latest wins if duplicates exist)
    const byPlatform = new Map<string, (typeof pieces)[number]>();
    for (const p of pieces) {
      byPlatform.set(p.platform, p);
    }

    return Array.from(byPlatform.values()).map((p) => ({
      id: p.id,
      platform: p.platform,
      content: p.content,
      status: p.status,
      approved: p.approved,
      mediaPath: p.mediaPath ?? null,
      postedAt: p.postedAt?.toISOString() ?? null,
    }));
  } catch {
    return [];
  }
}

async function getActivePromotion() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  try {
    // Find promotion used today by looking at a content piece for today
    const piece = await db.contentPiece.findFirst({
      where: { date: { gte: today, lt: tomorrow } },
      include: {
        promotion: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            geoScore: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!piece) return null;

    return {
      id: piece.promotion.id,
      name: piece.promotion.name,
      type: piece.promotion.type as
        | "product"
        | "service"
        | "affiliate"
        | "lead_magnet"
        | "content",
      description: piece.promotion.description,
      geoScore: piece.promotion.geoScore,
    };
  } catch {
    return null;
  }
}

async function getStats() {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // Start of this week (Monday)
    const dayOfWeek = today.getUTCDay(); // 0 = Sunday
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setUTCDate(weekStart.getUTCDate() - daysFromMonday);

    const [activePromotionsCount, contentPiecesToday, postsThisWeek] =
      await Promise.all([
        db.promotion.count({ where: { status: "active" } }),
        db.contentPiece.count({
          where: { date: { gte: today, lt: tomorrow } },
        }),
        db.contentPiece.count({
          where: {
            status: "posted",
            date: { gte: weekStart, lt: tomorrow },
          },
        }),
      ]);

    return { activePromotionsCount, contentPiecesToday, postsThisWeek };
  } catch {
    return { activePromotionsCount: 0, contentPiecesToday: 0, postsThisWeek: 0 };
  }
}

async function getGateModeEnabled(): Promise<boolean> {
  try {
    const setting = await db.setting.findUnique({ where: { key: "gate_mode" } });
    return setting?.value === "true";
  } catch {
    return false;
  }
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function TodayViewSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header skeleton */}
      <div>
        <div
          style={{
            width: "120px",
            height: "12px",
            background: "#1e1e1e",
            borderRadius: "4px",
            marginBottom: "8px",
          }}
        />
        <div
          style={{
            width: "80px",
            height: "22px",
            background: "#1e1e1e",
            borderRadius: "4px",
          }}
        />
      </div>

      {/* Stats skeleton */}
      <div style={{ display: "flex", gap: "12px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "76px",
              background: "#111111",
              border: "1px solid #1e1e1e",
              borderRadius: "8px",
            }}
          />
        ))}
      </div>

      {/* Promotion card skeleton */}
      <div
        style={{
          height: "120px",
          background: "#111111",
          border: "1px solid #1e1e1e",
          borderRadius: "12px",
        }}
      />

      {/* Platform grid skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "12px",
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              height: "140px",
              background: "#111111",
              border: "1px solid #1e1e1e",
              borderRadius: "10px",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Async content component ──────────────────────────────────────────────────

async function TodayContent() {
  const [pieces, promotion, stats, gateModeEnabled] = await Promise.all([
    getTodayPieces(),
    getActivePromotion(),
    getStats(),
    getGateModeEnabled(),
  ]);

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <TodayView
      todayDate={todayDate}
      pieces={pieces}
      promotion={promotion}
      stats={stats}
      gateModeEnabled={gateModeEnabled}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense fallback={<TodayViewSkeleton />}>
      <TodayContent />
    </Suspense>
  );
}
