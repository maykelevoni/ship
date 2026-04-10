import { auth } from "@/auth";

import { db } from "@/lib/db";

export const GET = auth(async (req, ctx) => {
  if (!req.auth) return new Response("Not authenticated", { status: 401 });

  try {
    const userId = req.auth.user.id;
    const { id } = (ctx as { params: { id: string } }).params;

    const post = await db.blogPost.findFirst({
      where: { id, userId },
      include: {
        topic: true,
        contentPieces: { orderBy: { platform: "asc" } },
        emailDraft: true,
      },
    });

    if (!post) return new Response("Not found", { status: 404 });

    // Always merge pieces by blogPostId + pieces by date (deduplicated by id)
    const dayStart = new Date(post.date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const datePieces = await db.contentPiece.findMany({
      where: {
        userId,
        date: { gte: dayStart, lt: dayEnd },
        platform: { not: "master" },
      },
      orderBy: { platform: "asc" },
    });

    const byId = new Map(post.contentPieces.map((p) => [p.id, p]));
    for (const p of datePieces) byId.set(p.id, p);
    const pieces = Array.from(byId.values()).sort((a, b) =>
      a.platform.localeCompare(b.platform),
    );

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
    });
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
});
