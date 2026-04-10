/**
 * clickbank.ts
 *
 * ClickBank Marketplace API product search.
 * Returns digital products with HopLink and commission percentage.
 */

import { getSetting } from "../../../lib/settings";
import type { AffiliateProduct } from "./amazon";

export async function searchClickBank(
  keyword: string,
  userId: string,
): Promise<AffiliateProduct[]> {
  const cbApiKey = await getSetting("clickbank_api_key", userId);
  const cbAccount = await getSetting("clickbank_account", userId);

  if (!cbApiKey || !cbAccount) {
    console.warn(
      "[affiliate/clickbank] ClickBank credentials not configured — skipping",
    );
    return [];
  }

  try {
    const url = `https://api.clickbank.com/rest/1.3/marketplace/search?keyword=${encodeURIComponent(keyword)}&pageSize=5`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `${cbApiKey}`,
      },
    });

    if (!res.ok) {
      console.error(
        `[affiliate/clickbank] API request failed: ${res.status}`,
        await res.text(),
      );
      return [];
    }

    const products = (await res.json()) as Array<{
      name: string;
      description?: string;
      percentCommission?: number;
      site?: string;
    }>;

    if (!Array.isArray(products)) {
      return [];
    }

    return products.slice(0, 5).map((p) => {
      const vendor = p.site ?? "unknown";
      return {
        title: p.name,
        description: p.description ?? "",
        price: "",
        affiliateUrl: `https://${vendor}.hop.clickbank.net/?affiliate=${cbAccount}`,
        asin: "",
        source: "clickbank" as const,
        commissionPct: p.percentCommission ?? null,
      };
    });
  } catch (err) {
    console.error("[affiliate/clickbank] Search error:", err);
    return [];
  }
}
