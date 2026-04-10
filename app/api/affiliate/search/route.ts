import { auth } from "@/auth";

import { db } from "@/lib/db";
import { searchAmazon } from "@/worker/research/affiliate/amazon";
import { searchClickBank } from "@/worker/research/affiliate/clickbank";

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const userId = req.auth.user!.id as string;

  try {
    const body = await req.json();
    const { keyword, provider = "both" } = body;

    if (!keyword || typeof keyword !== "string") {
      return Response.json(
        { error: "keyword is required" },
        { status: 400 },
      );
    }

    const results: any[] = [];

    if (provider === "amazon" || provider === "both") {
      const amazonProducts = await searchAmazon(keyword, userId);
      results.push(...amazonProducts);
    }

    if (provider === "clickbank" || provider === "both") {
      const cbProducts = await searchClickBank(keyword, userId);
      results.push(...cbProducts);
    }

    // Save new products to DB
    const savedProducts = [];
    for (const product of results) {
      const existing = await db.ownProduct.findFirst({
        where: { userId, affiliateUrl: product.affiliateUrl },
      });

      if (!existing) {
        const saved = await db.ownProduct.create({
          data: {
            userId,
            title: product.title,
            description: product.description,
            outline: "",
            status: "outline",
            affiliateUrl: product.affiliateUrl,
            asin: product.asin || null,
            source: product.source,
            commissionPct: product.commissionPct,
            price: parseFloat(product.price) || 0,
          },
        });
        savedProducts.push(saved);
      } else {
        savedProducts.push(existing);
      }
    }

    return Response.json({ products: savedProducts });
  } catch (error) {
    console.error("[affiliate/search] Error:", error);
    return Response.json(
      { error: "Affiliate search failed" },
      { status: 500 },
    );
  }
});
