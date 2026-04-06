import { auth } from "@/auth";
import { runGeoAudit } from "@/worker/engine/geo-audit";

import { db } from "@/lib/db";

export const POST = auth(async (req, ctx) => {
  if (!req.auth) return new Response("Not authenticated", { status: 401 });

  try {
    const userId = req.auth?.user?.id as string;
    const { id } = (ctx as { params: { id: string } }).params;

    const post = await db.blogPost.findFirst({ where: { id, userId } });
    if (!post) return new Response("Not found", { status: 404 });

    // Fire-and-forget: run geo audit in background
    runGeoAudit(post.id, post.title ?? "", post.content ?? "").catch(
      console.error,
    );

    return Response.json({ status: "started" });
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
});
