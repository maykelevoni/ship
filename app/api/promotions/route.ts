import { auth } from "@/auth";

import { db } from "@/lib/db";

const VALID_TYPES = [
  "product",
  "service",
  "affiliate",
  "lead_magnet",
  "content",
] as const;
const VALID_STATUSES = ["active", "paused", "archived", "all"] as const;

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const userId = req.auth.user.id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "all";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)),
    );

    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return Response.json(
        {
          error:
            "Invalid status. Must be one of: active, paused, archived, all",
        },
        { status: 400 },
      );
    }

    const where = status === "all" ? { userId } : { userId, status };

    const [promotions, total] = await Promise.all([
      db.promotion.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.promotion.count({ where }),
    ]);

    return Response.json({ data: promotions, total, page, limit });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const userId = req.auth.user.id;
    const body = await req.json();

    // Validate required fields
    const {
      type,
      name,
      description,
      url,
      affiliateLink,
      price,
      benefits,
      targetAudience,
      weight,
      systemeFunnelUrl,
      systemeProductId,
      systemeCheckoutUrl,
    } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return Response.json({ error: "name is required" }, { status: 400 });
    }
    if (
      !description ||
      typeof description !== "string" ||
      description.trim() === ""
    ) {
      return Response.json(
        { error: "description is required" },
        { status: 400 },
      );
    }
    if (!url || typeof url !== "string" || url.trim() === "") {
      return Response.json({ error: "url is required" }, { status: 400 });
    }
    if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      return Response.json(
        {
          error:
            "type must be one of: product, service, affiliate, lead_magnet, content",
        },
        { status: 400 },
      );
    }

    const promotion = await db.promotion.create({
      data: {
        userId,
        type,
        name: name.trim(),
        description: description.trim(),
        url: url.trim(),
        affiliateLink: affiliateLink ?? null,
        price: price ?? null,
        benefits: Array.isArray(benefits) ? JSON.stringify(benefits) : (benefits ?? null),
        targetAudience: targetAudience ?? null,
        weight: typeof weight === "number" ? weight : 5,
        status: "active",
        systemeFunnelUrl: systemeFunnelUrl ?? null,
        systemeProductId: systemeProductId ?? null,
        systemeCheckoutUrl: systemeCheckoutUrl ?? null,
      },
    });

    return Response.json(promotion, { status: 201 });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
