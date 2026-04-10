/**
 * index.ts — Affiliate research orchestrator
 *
 * Runs Amazon and ClickBank searches for all active research topics,
 * saves new products to OwnProduct, and triggers content generation.
 */

import { db } from "../../../lib/db";
import { searchAmazon } from "./amazon";
import { searchClickBank } from "./clickbank";

export async function runAffiliateResearch(userId: string): Promise<void> {
  try {
    const topics = await db.researchTopic.findMany({
      where: { userId, selected: false },
    });

    if (topics.length === 0) {
      console.log("[affiliate] No unselected topics — skipping");
      return;
    }

    for (const topic of topics) {
      const [amazonResult, cbResult] = await Promise.allSettled([
        searchAmazon(topic.title, userId),
        searchClickBank(topic.title, userId),
      ]);

      const amazonProducts =
        amazonResult.status === "fulfilled" ? amazonResult.value : [];
      const cbProducts =
        cbResult.status === "fulfilled" ? cbResult.value : [];

      // Dedupe by affiliateUrl
      const seen = new Set<string>();
      const allProducts = [...amazonProducts, ...cbProducts].filter((p) => {
        if (seen.has(p.affiliateUrl)) return false;
        seen.add(p.affiliateUrl);
        return true;
      });

      // Filter out products that already exist
      const existingUrls = await db.ownProduct
        .findMany({
          where: { userId, affiliateUrl: { in: Array.from(seen) } },
          select: { affiliateUrl: true },
        })
        .then((rows) => new Set(rows.map((r) => r.affiliateUrl)));

      const newProducts = allProducts.filter(
        (p) => !existingUrls.has(p.affiliateUrl),
      );

      // Save new products
      for (const product of newProducts) {
        await db.ownProduct.create({
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
      }

      const amazonCount = amazonProducts.length;
      const cbCount = cbProducts.length;
      console.log(
        `[affiliate] Found ${amazonCount} Amazon + ${cbCount} ClickBank products for topic: ${topic.title} (${newProducts.length} new)`,
      );
    }

    console.log("[affiliate] Research complete");
  } catch (error) {
    console.error("[affiliate] Research failed:", error);
  }
}
