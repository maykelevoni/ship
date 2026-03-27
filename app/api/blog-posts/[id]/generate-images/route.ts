import { auth } from "@/auth";
import { db } from "@/lib/db";
import { renderImageForPlatform } from "@/worker/media/image";

export const POST = auth(async (req, ctx) => {
  if (!req.auth) return new Response("Not authenticated", { status: 401 });

  try {
    const { id } = (ctx as { params: { id: string } }).params;

    // 1. Get blog post
    const post = await db.blogPost.findUnique({
      where: { id },
      include: {
        contentPieces: { orderBy: { platform: "asc" } },
      },
    });

    if (!post) return new Response("Not found", { status: 404 });

    // 2. Find pieces: first by blogPostId, then date fallback
    let pieces = post.contentPieces;
    if (pieces.length === 0) {
      const dayStart = new Date(post.date);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      pieces = await db.contentPiece.findMany({
        where: {
          date: { gte: dayStart, lt: dayEnd },
          platform: { not: "master" },
        },
        orderBy: { platform: "asc" },
      });
    }

    // 3. Get promotionId from any piece that has one
    const promotionId = pieces.find((p) => p.promotionId)?.promotionId ?? null;
    if (!promotionId) {
      return Response.json(
        { error: "No promotion linked to this post" },
        { status: 400 }
      );
    }

    // 4. Fetch the full Promotion record
    const promotion = await db.promotion.findUnique({
      where: { id: promotionId },
    });
    if (!promotion) {
      return Response.json(
        { error: "No promotion linked to this post" },
        { status: 400 }
      );
    }

    // 5. Format date as YYYY-MM-DD
    const d = new Date(post.date);
    const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

    // 6. Generate both images
    const [linkedinPath, instagramPath] = await Promise.all([
      renderImageForPlatform({ platform: "linkedin", promotion, content: "", date }),
      renderImageForPlatform({ platform: "instagram", promotion, content: "", date }),
    ]);

    // Relative paths for DB storage
    const imageCardPath = `./media/images/${date}-linkedin.png`;
    const imageQuotePath = `./media/images/${date}-instagram.png`;

    // 7. Upsert image_card ContentPiece
    let imageCardPiece = pieces.find((p) => p.platform === "image_card") ?? null;
    if (!imageCardPiece) {
      // Try date fallback if pieces were from blogPostId query and came up empty for image_card
      const dayStart = new Date(post.date);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
      imageCardPiece = await db.contentPiece.findFirst({
        where: {
          platform: "image_card",
          date: { gte: dayStart, lt: dayEnd },
        },
      });
    }

    let imageCardResult: { id: string; mediaPath: string };
    if (imageCardPiece) {
      const updated = await db.contentPiece.update({
        where: { id: imageCardPiece.id },
        data: { mediaPath: imageCardPath },
      });
      imageCardResult = { id: updated.id, mediaPath: updated.mediaPath! };
    } else {
      const created = await db.contentPiece.create({
        data: {
          platform: "image_card",
          content: "generated",
          status: "generated",
          mediaPath: imageCardPath,
          promotionId,
          blogPostId: id,
          date: post.date,
        },
      });
      imageCardResult = { id: created.id, mediaPath: created.mediaPath! };
    }

    // 8. Upsert image_quote ContentPiece
    let imageQuotePiece = pieces.find((p) => p.platform === "image_quote") ?? null;
    if (!imageQuotePiece) {
      const dayStart = new Date(post.date);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
      imageQuotePiece = await db.contentPiece.findFirst({
        where: {
          platform: "image_quote",
          date: { gte: dayStart, lt: dayEnd },
        },
      });
    }

    let imageQuoteResult: { id: string; mediaPath: string };
    if (imageQuotePiece) {
      const updated = await db.contentPiece.update({
        where: { id: imageQuotePiece.id },
        data: { mediaPath: imageQuotePath },
      });
      imageQuoteResult = { id: updated.id, mediaPath: updated.mediaPath! };
    } else {
      const created = await db.contentPiece.create({
        data: {
          platform: "image_quote",
          content: "generated",
          status: "generated",
          mediaPath: imageQuotePath,
          promotionId,
          blogPostId: id,
          date: post.date,
        },
      });
      imageQuoteResult = { id: created.id, mediaPath: created.mediaPath! };
    }

    // Suppress unused variable warnings — paths are returned indirectly via DB records
    void linkedinPath;
    void instagramPath;

    return Response.json({
      imageCard: imageCardResult,
      imageQuote: imageQuoteResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
});
