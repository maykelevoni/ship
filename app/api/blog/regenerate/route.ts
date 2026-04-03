import { auth } from "@/auth";
import { runBlogGeneration } from "@/worker/blog/index";

import { db } from "@/lib/db";

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await db.blogPost.deleteMany({
      where: { userId, date: { gte: today } },
    });

    await db.researchTopic.updateMany({
      where: { userId, date: { gte: today }, selected: true },
      data: { selected: false },
    });

    await runBlogGeneration();

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
});
