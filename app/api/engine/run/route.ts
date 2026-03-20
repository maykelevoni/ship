import { auth } from "@/auth";

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  // Fire-and-forget: runEngine manages its own EngineRun record
  import("@/worker/engine/run")
    .then(({ runEngine }) => runEngine())
    .catch(() => undefined);

  return Response.json({ status: "started" }, { status: 202 });
});
