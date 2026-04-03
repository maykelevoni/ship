import { auth } from "@/auth";

import { db } from "@/lib/db";

export const POST = auth(async (req) => {
  if (!req.auth) return new Response("Unauthorized", { status: 401 });
  await db.user.update({
    where: { id: req.auth.user.id },
    data: { onboardingDone: true },
  });
  return Response.json({ ok: true });
});
