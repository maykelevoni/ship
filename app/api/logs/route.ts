import { auth } from "@/auth";
import { db } from "@/lib/db";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20)
    );
    const skip = (page - 1) * limit;

    const [runs, total] = await Promise.all([
      db.engineRun.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          date: true,
          promotionName: true,
          status: true,
          contentCount: true,
          createdAt: true,
          log: true,
        },
      }),
      db.engineRun.count(),
    ]);

    const formatted = runs.map((run) => ({
      id: run.id,
      date: run.date,
      promotionName: run.promotionName ?? null,
      status: run.status,
      contentCount: run.contentCount,
      createdAt: run.createdAt,
      log: run.log ? run.log.slice(0, 500) : null,
    }));

    return Response.json({
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
