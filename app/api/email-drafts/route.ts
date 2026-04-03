import { auth } from "@/auth";

import { db } from "@/lib/db";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const userId = req.auth.user.id;
    const drafts = await db.emailDraft.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        blogPost: {
          select: { title: true, ghostUrl: true },
        },
      },
    });

    return Response.json(drafts);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
