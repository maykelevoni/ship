import { auth } from "@/auth";
import { db } from "@/lib/db";

export const GET = auth(async (req, ctx) => {
  if (!req.auth) return new Response("Not authenticated", { status: 401 });

  try {
    const { id } = (ctx as { params: { id: string } }).params;

    const post = await db.blogPost.findUnique({
      where: { id },
      include: {
        topic: true,
        contentPieces: { orderBy: { platform: "asc" } },
        emailDraft: true,
      },
    });

    if (!post) return new Response("Not found", { status: 404 });

    // If no pieces linked by blogPostId, fall back to fetching by date
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

    // Fetch geoScore from the first piece that has a promotionId
    let geoScore: number | null = null;
    const promotionId = pieces.find((p) => p.promotionId)?.promotionId ?? null;
    if (promotionId) {
      const promotion = await db.promotion.findUnique({
        where: { id: promotionId },
        select: { geoScore: true },
      });
      geoScore = promotion?.geoScore ?? null;
    }

    return Response.json({
      id: post.id,
      date: post.date,
      title: post.title,
      slug: post.slug,
      seoDescription: post.seoDescription,
      content: post.content,
      status: post.status,
      ghostUrl: post.ghostUrl,
      topic: post.topic,
      pieces: pieces.map((p) => ({
        id: p.id,
        platform: p.platform,
        content: p.content,
        mediaPath: p.mediaPath,
        status: p.status,
        promotionId: p.promotionId,
      })),
      emailDraft: post.emailDraft
        ? {
            id: post.emailDraft.id,
            subject: post.emailDraft.subject,
            body: post.emailDraft.body,
            status: post.emailDraft.status,
          }
        : null,
      geoScore,
    });
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
});
