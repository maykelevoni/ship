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

const TIME_REGEX = /^[0-2][0-9]:[0-5][0-9]$/;

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const entries = await db.scheduleEntry.findMany({
      include: { template: true },
      orderBy: { time: "asc" },
    });
    return Response.json(entries);
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

    const { time, platform, templateId, daysOfWeek, active } = body;

    // Validate required fields
    if (!time || typeof time !== "string" || !TIME_REGEX.test(time)) {
      return Response.json(
        { error: "time is required and must be in HH:MM format (00:00–23:59)" },
        { status: 400 }
      );
    }

    if (
      !platform ||
      !VALID_PLATFORMS.includes(platform as (typeof VALID_PLATFORMS)[number])
    ) {
      return Response.json(
        {
          error:
            "platform must be one of: twitter | linkedin | instagram | facebook | reddit | email | tiktok | youtube",
        },
        { status: 400 }
      );
    }

    if (!templateId || typeof templateId !== "string") {
      return Response.json({ error: "templateId is required" }, { status: 400 });
    }

    // Verify the template exists
    const template = await db.template.findUnique({ where: { id: templateId } });
    if (!template) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    const entry = await db.scheduleEntry.create({
      data: {
        time,
        platform,
        templateId,
        daysOfWeek: daysOfWeek ?? "[0,1,2,3,4,5,6]",
        active: active ?? true,
      },
      include: { template: true },
    });

    return Response.json(entry, { status: 201 });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
