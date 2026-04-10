/**
 * amazon.ts
 *
 * Amazon PAAPI 5.0 affiliate product search.
 * AWS Signature V4 signing using only Node.js built-in crypto.
 */

import crypto from "crypto";

import { getSetting } from "../../../lib/settings";

export interface AffiliateProduct {
  title: string;
  description: string;
  price: string;
  affiliateUrl: string;
  asin: string;
  source: "amazon" | "clickbank";
  commissionPct: number | null;
}

const HOST = "webservices.amazon.com";
const PATH = "/paapi5/searchitems";
const REGION = "us-east-1";
const SERVICE = "ProductAdvertisingAPI";

// AWS Signature V4 signing
function signPAAPI(
  payload: string,
  accessKey: string,
  secretKey: string,
  partnerTag: string,
): Record<string, string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const datestamp = now.toISOString().slice(0, 10).replace(/-/g, "");

  const canonicalUri = PATH;
  const canonicalQueryString = "";
  const signedHeaders = "content-type;host;x-amz-date;x-amz-target";
  const contentType = "application/json; charset=utf-8";
  const xAmzTarget = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";

  const payloadHash = crypto
    .createHash("sha256")
    .update(payload)
    .digest("hex");

  const canonicalRequest = [
    "POST",
    canonicalUri,
    canonicalQueryString,
    `content-type:${contentType}`,
    `host:${HOST}`,
    `x-amz-date:${amzDate}`,
    `x-amz-target:${xAmzTarget}`,
    "",
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${datestamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    crypto
      .createHash("sha256")
      .update(canonicalRequest)
      .digest("hex"),
  ].join("\n");

  const dateKey = hmacSha256(`AWS4${secretKey}`, datestamp);
  const dateRegionKey = hmacSha256(dateKey, REGION);
  const dateRegionServiceKey = hmacSha256(dateRegionKey, SERVICE);
  const signingKey = hmacSha256(dateRegionServiceKey, "aws4_request");
  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    "Content-Type": contentType,
    Host: HOST,
    "X-Amz-Date": amzDate,
    "X-Amz-Target": xAmzTarget,
    Authorization: authorizationHeader,
  };
}

function hmacSha256(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data).digest();
}

export async function searchAmazon(
  keyword: string,
  userId: string,
): Promise<AffiliateProduct[]> {
  const paapiKey = await getSetting("amazon_paapi_key", userId);
  const paapiSecret = await getSetting("amazon_paapi_secret", userId);
  const affiliateTag = await getSetting("amazon_affiliate_tag", userId);

  if (!paapiKey || !paapiSecret || !affiliateTag) {
    console.warn(
      "[affiliate/amazon] PAAPI credentials not configured — skipping",
    );
    return [];
  }

  try {
    const payload = JSON.stringify({
      Keywords: keyword,
      SearchIndex: "All",
      PartnerTag: affiliateTag,
      PartnerType: "Associates",
      Resources: [
        "ItemInfo.Title",
        "ItemInfo.Features",
        "Offers.Listings.Price",
      ],
    });

    const headers = signPAAPI(payload, paapiKey, paapiSecret, affiliateTag);

    const res = await fetch(`https://${HOST}${PATH}`, {
      method: "POST",
      headers,
      body: payload,
    });

    if (!res.ok) {
      console.error(
        `[affiliate/amazon] PAAPI request failed: ${res.status}`,
        await res.text(),
      );
      return [];
    }

    const data = (await res.json()) as Record<string, unknown>;
    const items = ((data as any).ItemsResult?.Items as any[]) ?? [];

    return items.slice(0, 5).map((item: any) => {
      const asin = item.ASIN ?? "";
      const title = item.ItemInfo?.Title?.DisplayValue ?? asin;
      const features = item.ItemInfo?.Features?.DisplayValues ?? [];
      const description =
        features.length > 0 ? features.slice(0, 3).join(". ") : "";
      const priceListing =
        item.Offers?.Listings?.[0]?.Price?.DisplayAmount ?? "";

      return {
        title,
        description,
        price: priceListing,
        affiliateUrl: `https://www.amazon.com/dp/${asin}?tag=${affiliateTag}`,
        asin,
        source: "amazon" as const,
        commissionPct: null,
      };
    });
  } catch (err) {
    console.error("[affiliate/amazon] Search error:", err);
    return [];
  }
}
