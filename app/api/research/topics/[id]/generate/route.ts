import { auth } from "@/auth";
import { runBlogGenerationForTopic } from "@/worker/blog/index";

// ---------------------------------------------------------------------------
// POST /api/research/topics/[id]/generate
// ---------------------------------------------------------------------------

export const POST = auth(async (req, context) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = await (
      context as unknown as { params: Promise<{ id: string }> }
    ).params;

    const userId = req.auth!.user!.id as string;
    const post = await runBlogGenerationForTopic(id, userId);

    return Response.json({ post });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
});
