import { auth } from "@/auth";

import { db } from "@/lib/db";

export const GET = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    const { id } = params as { id: string };

    const product = await db.ownProduct.findFirst({
      where: { id, userId },
    });

    if (!product) {
      return Response.json({ error: "OwnProduct not found" }, { status: 404 });
    }

    return Response.json(product);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});

export const PATCH = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    const { id } = params as { id: string };

    const existing = await db.ownProduct.findFirst({ where: { id, userId } });
    if (!existing) {
      return Response.json({ error: "OwnProduct not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      description,
      outline,
      status,
      price,
      systemeProductId,
      systemeCheckoutUrl,
      promotionId,
    } = body as {
      title?: string;
      description?: string;
      outline?: string;
      status?: string;
      price?: number;
      systemeProductId?: string;
      systemeCheckoutUrl?: string;
      promotionId?: string;
    };

    const updated = await db.ownProduct.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(outline !== undefined && { outline }),
        ...(status !== undefined && { status }),
        ...(price !== undefined && { price }),
        ...(systemeProductId !== undefined && { systemeProductId }),
        ...(systemeCheckoutUrl !== undefined && { systemeCheckoutUrl }),
        ...(promotionId !== undefined && { promotionId }),
      },
    });

    return Response.json(updated);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
