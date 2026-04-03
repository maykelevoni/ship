import { auth } from "@/auth";

import { db } from "@/lib/db";

const VALID_STATUSES = ["new", "acted", "dismissed"] as const;
type OpportunityStatus = (typeof VALID_STATUSES)[number];

export const PATCH = auth(async (req, context) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const userId = req.auth.user.id;
    const { id } = await (
      context as unknown as { params: Promise<{ id: string }> }
    ).params;

    const body = await req.json();
    const { status } = body as { status: OpportunityStatus };

    if (!VALID_STATUSES.includes(status)) {
      return new Response(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        { status: 400 },
      );
    }

    const updated = await db.promotionOpportunity.update({
      where: { id, userId },
      data: { status },
    });

    return Response.json(updated);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
