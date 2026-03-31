import { auth } from "@/auth";
import { generatePiecesForBlogPost } from "@/worker/blog/generate-pieces";

// ---------------------------------------------------------------------------
// POST /api/blog-posts/[id]/generate-pieces
// ---------------------------------------------------------------------------

export const POST = auth(async (req, context) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = await (
      context as unknown as { params: Promise<{ id: string }> }
    ).params;

    const { count, pieceIds } = await generatePiecesForBlogPost(id);

    return Response.json({ count, pieceIds });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
});
