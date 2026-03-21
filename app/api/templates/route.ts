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

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const templates = await db.template.findMany({
      orderBy: [{ platform: "asc" }, { name: "asc" }],
    });
    return Response.json(templates);
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

    const {
      name,
      platform,
      charLimit,
      imageEnabled,
      imageWidth,
      imageHeight,
      videoEnabled,
      videoWidth,
      videoHeight,
      includeLink,
      aiInstructions,
      active,
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      return Response.json({ error: "name is required" }, { status: 400 });
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

    // Validate optional numeric fields
    if (charLimit !== undefined && (!Number.isInteger(charLimit) || charLimit <= 0)) {
      return Response.json(
        { error: "charLimit must be a positive integer" },
        { status: 400 }
      );
    }
    for (const [field, val] of [
      ["imageWidth", imageWidth],
      ["imageHeight", imageHeight],
      ["videoWidth", videoWidth],
      ["videoHeight", videoHeight],
    ] as [string, unknown][]) {
      if (val !== undefined && (!Number.isInteger(val) || (val as number) <= 0)) {
        return Response.json(
          { error: `${field} must be a positive integer` },
          { status: 400 }
        );
      }
    }

    const template = await db.template.create({
      data: {
        name: name.trim(),
        platform,
        charLimit: charLimit ?? null,
        imageEnabled: imageEnabled ?? false,
        imageWidth: imageWidth ?? null,
        imageHeight: imageHeight ?? null,
        videoEnabled: videoEnabled ?? false,
        videoWidth: videoWidth ?? null,
        videoHeight: videoHeight ?? null,
        includeLink: includeLink ?? false,
        aiInstructions: aiInstructions ?? null,
        active: active ?? true,
      },
    });

    return Response.json(template, { status: 201 });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
