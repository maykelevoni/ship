import { auth } from "@/auth";
import { db } from "@/lib/db";
import { runGeoAudit } from "@/worker/engine/geo-audit";

export const POST = auth(async (req, { params }: { params: { id: string } }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = params;

    const promotion = await db.promotion.findUnique({ where: { id } });
    if (!promotion) {
      return Response.json({ error: "Promotion not found" }, { status: 404 });
    }

    if (!promotion.url) {
      return Response.json({ error: "Promotion has no URL to audit" }, { status: 400 });
    }

    // Fire-and-forget — do not await
    runGeoAudit(id, promotion.url).catch((err) => {
      console.error(`[geo-audit] Background task error for ${id}:`, err);
    });

    return Response.json({ status: "started" });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
