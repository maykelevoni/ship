import { auth } from "@/auth";

import { db } from "@/lib/db";

export const GET = auth(async (req) => {
  if (!req.auth) return new Response("Unauthorized", { status: 401 });
  const user = await db.user.findUnique({
    where: { id: req.auth.user.id },
    select: {
      plan: true,
      onboardingDone: true,
      polarCustomerId: true,
      planExpiresAt: true,
    },
  });
  return Response.json(user);
});
