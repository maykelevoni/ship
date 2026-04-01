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

  try {
    const products = await searchAffiliateProducts(keyword);
    return Response.json(products);
  } catch (err) {
    const isError = err instanceof Error;
    const message = isError ? (err as Error).message : String(err);
    const errType = Object.prototype.toString.call(err);
    const errKeys =
      err && typeof err === "object" ? Object.keys(err as object) : [];
    console.error(
      "[products] search failed — isError:",
      isError,
      "type:",
      errType,
      "message:",
      message,
    );
    return Response.json(
      { error: message, isError, errType, errKeys },
      { status: 500 },
    );
  }
});
