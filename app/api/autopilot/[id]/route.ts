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

export const PATCH = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const userId = req.auth.user.id;
  const { id } = params;

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
      enabled,
    } = body as {
      type?: string;
      days?: string[];
      hour?: number;
      sources?: string[];
      platforms?: string[];
      promotionId?: string;
      gate?: boolean;
      keyword?: string;
      enabled?: boolean;
    };

    // Validate type if provided
    if (type) {
      const validTypes = ["full", "research", "generate", "post"];
      if (!validTypes.includes(type)) {
        return Response.json(
          { error: `type must be one of: ${validTypes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Validate days if provided
    if (days) {
      if (
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
    }

    // Validate hour if provided
    if (hour !== undefined) {
      if (typeof hour !== "number" || hour < 0 || hour > 23) {
        return Response.json(
          { error: "hour must be a number between 0 and 23" },
          { status: 400 }
        );
      }
    }

    // Build update data object with only provided fields
    const updateData: Record<string, string | number | boolean | null> = {};
    if (type !== undefined) updateData.type = type;
    if (days !== undefined) updateData.days = JSON.stringify(days);
    if (hour !== undefined) updateData.hour = hour;
    if (sources !== undefined)
      updateData.sources = sources ? JSON.stringify(sources) : null;
    if (platforms !== undefined)
      updateData.platforms = platforms ? JSON.stringify(platforms) : null;
    if (promotionId !== undefined) updateData.promotionId = promotionId;
    if (gate !== undefined) updateData.gate = gate;
    if (keyword !== undefined) updateData.keyword = keyword;
    if (enabled !== undefined) updateData.enabled = enabled;

    // Check if rule exists and belongs to user
    const existing = await db.autopilotRule.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return new Response("Autopilot rule not found", { status: 404 });
    }

    const updated = await db.autopilotRule.update({
      where: { id },
      data: updateData,
    });

    return Response.json(parseRule(updated));
  } catch (error: any) {
    // Prisma error code for record not found
    if (error.code === "P2025") {
      return new Response("Autopilot rule not found", { status: 404 });
    }
    return new Response("Internal server error", { status: 500 });
  }
});

export const DELETE = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const userId = req.auth.user.id;
  const { id } = params;

  try {
    // Check if rule exists and belongs to user
    const existing = await db.autopilotRule.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return new Response("Autopilot rule not found", { status: 404 });
    }

    await db.autopilotRule.delete({
      where: { id },
    });

    return Response.json({ ok: true });
  } catch (error: any) {
    // Prisma error code for record not found
    if (error.code === "P2025") {
      return new Response("Autopilot rule not found", { status: 404 });
    }
    return new Response("Internal server error", { status: 500 });
  }
});
