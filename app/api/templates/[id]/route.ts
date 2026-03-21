import { auth } from "@/auth";
import { db } from "@/lib/db";

const VALID_PLATFORMS = [
  "twitter",
  "linkedin",
  "instagram",
  "facebook",
  "reddit",
  "email",
  "tiktok",
  "youtube",
] as const;

export const PATCH = auth(async (req, { params }: { params: { id: string } }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = params;

    const existing = await db.template.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    const body = await req.json();

    const allowedFields = [
      "name",
      "platform",
      "charLimit",
      "imageEnabled",
      "imageWidth",
      "imageHeight",
      "videoEnabled",
      "videoWidth",
      "videoHeight",
      "includeLink",
      "aiInstructions",
      "active",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        data[field] = body[field];
      }
    }

    if (
      "platform" in data &&
      !VALID_PLATFORMS.includes(data.platform as (typeof VALID_PLATFORMS)[number])
    ) {
      return Response.json(
        {
          error:
            "platform must be one of: twitter | linkedin | instagram | facebook | reddit | email | tiktok | youtube",
        },
        { status: 400 }
      );
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const updated = await db.template.update({
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

    const existing = await db.template.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    // Check if template is used in any ScheduleEntry
    const usageCount = await db.scheduleEntry.count({ where: { templateId: id } });
    if (usageCount > 0) {
      return Response.json(
        { error: "Template is used in schedule. Remove schedule entries first." },
        { status: 409 }
      );
    }

    await db.template.delete({ where: { id } });

    return Response.json({ ok: true });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
