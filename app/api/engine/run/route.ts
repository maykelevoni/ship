import { auth } from "@/auth";

import { db } from "@/lib/db";

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const userId = req.auth.user.id;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (user?.plan === "free") {
    return Response.json(
      { error: "Upgrade required to run the engine", upgrade: true },
      { status: 403 },
    );
  }

  // Fire-and-forget: runEngine manages its own EngineRun record
  import("@/worker/engine/run")
    .then(({ runEngine }) => runEngine(userId))
    .catch(() => undefined);

  return Response.json({ status: "started" }, { status: 202 });
});
