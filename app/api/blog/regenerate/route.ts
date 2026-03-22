import { auth } from "@/auth";
import { db } from "@/lib/db";
import { runBlogGeneration } from "@/worker/blog/index";

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.blogPost.deleteMany({
      where: { date: { gte: today } },
    });

    await db.researchTopic.updateMany({
      where: { date: { gte: today }, selected: true },
      data: { selected: false },
    });

    await runBlogGeneration();

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
});
