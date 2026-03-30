import { auth } from "@/auth";
import { db } from "@/lib/db";

const VALID_STATUSES = ["generated", "approved", "rejected", "posted", "failed"];
const VALID_PLATFORMS = ["twitter", "linkedin", "instagram", "reddit", "video", "email"];

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const statusParam = searchParams.get("status");
    const platformParam = searchParams.get("platform");

    const where: Record<string, unknown> = {
      platform: { not: "master" },
    };

    if (platformParam && VALID_PLATFORMS.includes(platformParam)) {
      where.platform = platformParam;
    }

    if (statusParam && statusParam !== "all" && VALID_STATUSES.includes(statusParam)) {
      where.status = statusParam;
    }

    const [pieces, total] = await Promise.all([
      db.contentPiece.findMany({
        where,
        include: {
          promotion: { select: { name: true } },
        },
        orderBy: [{ date: "desc" }, { platform: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.contentPiece.count({ where }),
    ]);

    const data = pieces.map((piece) => ({
      id: piece.id,
      platform: piece.platform,
      promotionId: piece.promotionId,
      promotionName: piece.promotion?.name ?? null,
      date: piece.date,
      status: piece.status,
      contentPreview: piece.content.replace(/<[^>]+>/g, "").slice(0, 80),
      mediaPath: piece.mediaPath,
      createdAt: piece.createdAt,
      scheduledAt: piece.scheduledAt,
    }));

    return Response.json({ data, total, page, limit });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
