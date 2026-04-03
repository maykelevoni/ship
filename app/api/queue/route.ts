import { auth } from "@/auth";

import { db } from "@/lib/db";

const QUEUE_STATUSES = ["queued", "generating", "generated"];

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const userId = req.auth.user.id;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)),
    );

    const where = { userId, status: { in: QUEUE_STATUSES } };

    const [pieces, total] = await Promise.all([
      db.contentPiece.findMany({
        where,
        include: {
          promotion: { select: { name: true, type: true } },
        },
        orderBy: [{ date: "asc" }, { platform: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.contentPiece.count({ where }),
    ]);

    const data = pieces.map((piece) => ({
      id: piece.id,
      promotionId: piece.promotionId,
      promotionName: piece.promotion?.name ?? "",
      promotionType: piece.promotion?.type ?? "",
      date: piece.date,
      platform: piece.platform,
      content: piece.content,
      mediaPath: piece.mediaPath,
      status: piece.status,
      approved: piece.approved,
      createdAt: piece.createdAt,
      updatedAt: piece.updatedAt,
    }));

    return Response.json({ data, total, page, limit });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
