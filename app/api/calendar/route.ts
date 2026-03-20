import { auth } from "@/auth";
import { db } from "@/lib/db";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return Response.json(
        { error: "from and to query params are required (ISO date)" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return Response.json(
        { error: "from and to must be valid ISO date strings" },
        { status: 400 }
      );
    }

    // Set toDate to end of day
    toDate.setUTCHours(23, 59, 59, 999);

    const pieces = await db.contentPiece.findMany({
      where: {
        date: {
          gte: fromDate,
          lte: toDate,
        },
        platform: {
          in: ["master", "twitter", "linkedin", "reddit", "instagram", "email", "video"],
        },
      },
      include: {
        promotion: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { platform: "asc" }],
    });

    // Group by date string, one piece per platform per date
    const grouped: Record<
      string,
      {
        promotionId: string;
        promotionName: string;
        promotionType: string;
        pieces: { platform: string; status: string; id: string }[];
      }
    > = {};

    const seenPlatformByDate = new Map<string, Set<string>>();

    for (const piece of pieces) {
      const dateKey = piece.date.toISOString().slice(0, 10);

      if (!seenPlatformByDate.has(dateKey)) {
        seenPlatformByDate.set(dateKey, new Set());
      }
      const seenPlatforms = seenPlatformByDate.get(dateKey)!;

      // Skip duplicates — only one piece per platform per date
      if (seenPlatforms.has(piece.platform)) {
        continue;
      }
      seenPlatforms.add(piece.platform);

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          promotionId: piece.promotion.id,
          promotionName: piece.promotion.name,
          promotionType: piece.promotion.type,
          pieces: [],
        };
      }

      grouped[dateKey].pieces.push({
        id: piece.id,
        platform: piece.platform,
        status: piece.status,
      });
    }

    return Response.json(grouped);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
