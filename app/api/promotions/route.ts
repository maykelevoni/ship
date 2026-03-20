import { auth } from "@/auth";
import { db } from "@/lib/db";
import { runGeoAudit } from "@/worker/engine/geo-audit";

const VALID_TYPES = ["product", "service", "affiliate", "lead_magnet", "content"] as const;
const VALID_STATUSES = ["active", "paused", "archived", "all"] as const;

async function triggerGeoAudit(id: string, url: string): Promise<void> {
  await runGeoAudit(id, url);
}

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "all";

    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return Response.json(
        { error: "Invalid status. Must be one of: active, paused, archived, all" },
        { status: 400 }
      );
    }

    const promotions = await db.promotion.findMany({
      where: status === "all" ? undefined : { status },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(promotions);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate required fields
    const { type, name, description, url, affiliateLink, price, benefits, targetAudience, weight } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return Response.json({ error: "name is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim() === "") {
      return Response.json({ error: "description is required" }, { status: 400 });
    }
    if (!url || typeof url !== "string" || url.trim() === "") {
      return Response.json({ error: "url is required" }, { status: 400 });
    }
    if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      return Response.json(
        { error: "type must be one of: product, service, affiliate, lead_magnet, content" },
        { status: 400 }
      );
    }

    const promotion = await db.promotion.create({
      data: {
        type,
        name: name.trim(),
        description: description.trim(),
        url: url.trim(),
        affiliateLink: affiliateLink ?? null,
        price: price ?? null,
        benefits: benefits ?? null,
        targetAudience: targetAudience ?? null,
        weight: typeof weight === "number" ? weight : 5,
        status: "active",
      },
    });

    // Fire-and-forget geo audit for product/service types
    if (type === "product" || type === "service") {
      triggerGeoAudit(promotion.id, promotion.url).catch(() => {
        // intentionally swallowed — background task
      });
    }

    return Response.json(promotion, { status: 201 });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
