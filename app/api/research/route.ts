import { auth } from "@/auth";
import { db } from "@/lib/db";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const topics = await db.researchTopic.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { score: "desc" },
    });

    return Response.json(topics);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
