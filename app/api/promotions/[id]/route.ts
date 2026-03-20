import { auth } from "@/auth";
import { db } from "@/lib/db";

const VALID_STATUSES = ["active", "paused", "archived"] as const;

export const PATCH = auth(async (req, { params }: { params: { id: string } }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = params;

    const existing = await db.promotion.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Promotion not found" }, { status: 404 });
    }

    const body = await req.json();

    const allowedFields = [
      "name",
      "description",
      "url",
      "affiliateLink",
      "price",
      "benefits",
      "targetAudience",
      "status",
      "weight",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        data[field] = body[field];
      }
    }

    if ("status" in data && !VALID_STATUSES.includes(data.status as (typeof VALID_STATUSES)[number])) {
      return Response.json(
        { error: "status must be one of: active, paused, archived" },
        { status: 400 }
      );
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const updated = await db.promotion.update({
      where: { id },
      data,
    });

    return Response.json(updated);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});

export const DELETE = auth(async (req, { params }: { params: { id: string } }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = params;

    const existing = await db.promotion.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Promotion not found" }, { status: 404 });
    }

    await db.promotion.update({
      where: { id },
      data: { status: "archived" },
    });

    return Response.json({ success: true });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
