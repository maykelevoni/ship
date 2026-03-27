import { auth } from "@/auth";
import { db } from "@/lib/db";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const products = await db.ownProduct.findMany({
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ products });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, opportunityId, price } = body as {
      title?: string;
      description?: string;
      opportunityId?: string;
      price?: number;
    };

    if (!title || typeof title !== "string" || title.trim() === "") {
      return Response.json({ error: "title is required" }, { status: 400 });
    }

    const product = await db.ownProduct.create({
      data: {
        title: title.trim(),
        status: "outline",
        outline: "[]",
        ...(description !== undefined && { description }),
        ...(opportunityId !== undefined && { opportunityId }),
        ...(price !== undefined && { price }),
      },
    });

    return Response.json(product, { status: 201 });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
