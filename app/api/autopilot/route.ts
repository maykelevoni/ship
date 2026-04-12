import { auth } from "@/auth";

import { db } from "@/lib/db";

// Helper to parse JSON string fields back to arrays
function parseRule(rule: any) {
  return {
    ...rule,
    days: rule.days ? JSON.parse(rule.days) : [],
    sources: rule.sources ? JSON.parse(rule.sources) : undefined,
    platforms: rule.platforms ? JSON.parse(rule.platforms) : undefined,
  };
}

export const GET = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    const rules = await db.autopilotRule.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    const parsedRules = rules.map(parseRule);
    return Response.json({ rules: parsedRules });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});

export const POST = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    const body = await req.json();
    const {
      type,
      days,
      hour,
      sources,
      platforms,
      promotionId,
      gate,
      keyword,
    } = body as {
      type: string;
      days: string[];
      hour: number;
      sources?: string[];
      platforms?: string[];
      promotionId?: string;
      gate?: boolean;
      keyword?: string;
    };

    // Validate type
    const validTypes = ["full", "research", "generate", "post"];
    if (!type || !validTypes.includes(type)) {
      return Response.json(
        { error: `type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate days
    if (
      !days ||
      !Array.isArray(days) ||
      days.length === 0 ||
      !days.every((d) =>
        ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].includes(d)
      )
    ) {
      return Response.json(
        { error: "days must be a non-empty array of weekday abbreviations" },
        { status: 400 }
      );
    }

    // Validate hour
    if (typeof hour !== "number" || hour < 0 || hour > 23) {
      return Response.json(
        { error: "hour must be a number between 0 and 23" },
        { status: 400 }
      );
    }

    // Store arrays as JSON strings
    const rule = await db.autopilotRule.create({
      data: {
        userId,
        type,
        days: JSON.stringify(days),
        hour,
        sources: sources ? JSON.stringify(sources) : null,
        platforms: platforms ? JSON.stringify(platforms) : null,
        promotionId,
        gate: gate ?? false,
        keyword,
      },
    });

    return Response.json(parseRule(rule), { status: 201 });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
