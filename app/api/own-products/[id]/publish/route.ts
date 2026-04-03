import { auth } from "@/auth";

import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";

export const POST = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    const { id } = params as { id: string };

    const product = await db.ownProduct.findFirst({ where: { id, userId } });
    if (!product) {
      return Response.json({ error: "OwnProduct not found" }, { status: 404 });
    }

    if (product.status !== "ready") {
      return Response.json(
        { error: "Product must be in 'ready' status before publishing" },
        { status: 400 },
      );
    }

    const gumroadToken = await getSetting("gumroad_access_token");
    if (!gumroadToken) {
      return Response.json(
        { error: "Gumroad access token not configured" },
        { status: 400 },
      );
    }

    // Publish to Gumroad
    const priceCents = Math.round(product.price * 100);
    const formBody = new URLSearchParams({
      access_token: gumroadToken,
      name: product.title,
      description: product.description || product.title,
      price: String(priceCents),
    });

    const gumroadRes = await fetch("https://api.gumroad.com/v2/products", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString(),
    });

    const gumroadData = (await gumroadRes.json()) as {
      success: boolean;
      product?: { short_url: string; id: string };
      message?: string;
    };

    if (!gumroadData.success) {
      return Response.json(
        { error: gumroadData.message ?? "Gumroad API error" },
        { status: 500 },
      );
    }

    const checkoutUrl = gumroadData.product!.short_url;

    // Create Promotion record
    const promotion = await db.promotion.create({
      data: {
        userId,
        type: "product",
        name: product.title,
        description: product.description || product.title,
        url: checkoutUrl,
        affiliateLink: checkoutUrl,
        price: String(product.price),
        status: "active",
      },
    });

    // Update OwnProduct
    await db.ownProduct.update({
      where: { id },
      data: {
        status: "published",
        platform: "gumroad",
        checkoutUrl,
        promotionId: promotion.id,
      },
    });

    return Response.json({ checkoutUrl, promotionId: promotion.id });
  } catch (error) {
    console.error("[publish]", error);
    return new Response("Internal server error", { status: 500 });
  }
});
