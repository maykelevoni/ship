import { auth } from "@/auth";
import { db } from "@/lib/db";

const QUEUE_STATUSES = ["queued", "generating", "generated"];

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const pieces = await db.contentPiece.findMany({
      where: {
        status: {
          in: QUEUE_STATUSES,
        },
      },
      include: {
        promotion: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { platform: "asc" }],
    });

    const result = pieces.map((piece) => ({
      id: piece.id,
      promotionId: piece.promotionId,
      promotionName: piece.promotion.name,
      promotionType: piece.promotion.type,
      date: piece.date,
      platform: piece.platform,
      content: piece.content,
      mediaPath: piece.mediaPath,
      status: piece.status,
      approved: piece.approved,
      createdAt: piece.createdAt,
      updatedAt: piece.updatedAt,
    }));

    return Response.json(result);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
