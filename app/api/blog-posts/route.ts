import { auth } from "@/auth";
import { db } from "@/lib/db";

export const GET = auth(async (req) => {
  if (!req.auth) return new Response("Not authenticated", { status: 401 });

  try {
    const posts = await db.blogPost.findMany({
      include: {
        topic: { select: { title: true, source: true, score: true } },
        _count: { select: { contentPieces: true } },
      },
      orderBy: { date: "desc" },
      take: 60,
    });

    return Response.json(
      posts.map((p) => ({
        id: p.id,
        date: p.date,
        title: p.title,
        slug: p.slug,
        seoDescription: p.seoDescription,
        status: p.status,
        ghostUrl: p.ghostUrl,
        topic: p.topic,
        piecesCount: p._count.contentPieces,
        createdAt: p.createdAt,
      }))
    );
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
});
