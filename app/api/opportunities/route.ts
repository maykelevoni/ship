import { auth } from "@/auth";

import { db } from "@/lib/db";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const userId = req.auth.user.id;
    const opportunities = await db.promotionOpportunity.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "asc" }],
    });

    return Response.json(opportunities);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
