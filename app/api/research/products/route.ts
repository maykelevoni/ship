import { auth } from "@/auth";
import { searchAffiliateProducts } from "@/worker/research/products";

// ---------------------------------------------------------------------------
// GET /api/research/products?keyword=xxx
// ---------------------------------------------------------------------------

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return Response.json({ error: "keyword required" }, { status: 400 });
  }

  const products = await searchAffiliateProducts(keyword);

  return Response.json(products);
});
