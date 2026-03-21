import { auth } from "@/auth";
import { db } from "@/lib/db";

export const PATCH = auth(async (req, { params }: { params: { id: string } }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = params;

    const existing = await db.scheduleEntry.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Schedule entry not found" }, { status: 404 });
    }

    const body = await req.json();

    const allowedFields = [
      "time",
      "platform",
      "templateId",
      "daysOfWeek",
      "active",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        data[field] = body[field];
      }
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const updated = await db.scheduleEntry.update({
      where: { id },
      data,
      include: { template: true },
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

    const existing = await db.scheduleEntry.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Schedule entry not found" }, { status: 404 });
    }

    await db.scheduleEntry.delete({ where: { id } });

    return Response.json({ ok: true });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
