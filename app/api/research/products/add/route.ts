import { auth } from "@/auth";

import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// POST /api/research/products/add
// ---------------------------------------------------------------------------

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      name?: string;
      platform?: string;
      description?: string;
      painPoints?: string[];
      benefits?: string[];
      commission?: number;
      affiliateLink?: string;
      targetAudience?: string;
    };

    const {
      name,
      platform,
      description,
      painPoints,
      benefits,
      commission,
      affiliateLink,
      targetAudience,
    } = body;

    // Validate required fields
    if (!name || !affiliateLink) {
      return Response.json(
        { error: "name and affiliateLink are required" },
        { status: 400 },
      );
    }

    const userId = req.auth.user.id;

    const promotion = await db.promotion.create({
      data: {
        userId,
        type: "affiliate",
        name,
        description: description ?? name,
        url: affiliateLink,
        affiliateLink,
        benefits: JSON.stringify(benefits ?? []),
        targetAudience: targetAudience ?? null,
        price: commission ? `${commission}% commission` : null,
        status: "active",
        weight: 5,
      },
    });

    return Response.json({ promotionId: promotion.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
});
