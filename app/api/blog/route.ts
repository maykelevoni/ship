import { auth } from "@/auth";

import { db } from "@/lib/db";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const post = await db.blogPost.findFirst({
      where: {
        userId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(post);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
