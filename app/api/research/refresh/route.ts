import { auth } from "@/auth";
import { runResearch } from "@/worker/research/index";

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { keyword } = (await req.json().catch(() => ({}))) as {
      keyword?: string;
    };
    const userId = req.auth!.user!.id as string;
    await runResearch(userId, keyword);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
});
