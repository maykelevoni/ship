import { auth } from "@/auth";
import { db } from "@/lib/db";

const VALID_STATUSES = ["generated", "approved", "rejected", "posted", "failed"];

export const GET = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = params as { id: string };

    const piece = await db.contentPiece.findUnique({
      where: { id },
      include: {
        promotion: { select: { name: true } },
        blogPost: { select: { title: true, ghostUrl: true } },
      },
    });

    if (!piece) {
      return Response.json({ error: "ContentPiece not found" }, { status: 404 });
    }

    return Response.json({
      ...piece,
      promotionName: piece.promotion?.name ?? null,
      blogPostTitle: piece.blogPost?.title ?? null,
      blogPostGhostUrl: piece.blogPost?.ghostUrl ?? null,
    });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});

export const PATCH = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = params as { id: string };

    const existing = await db.contentPiece.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "ContentPiece not found" }, { status: 404 });
    }

    const body = await req.json();
    const { content, status, scheduledAt } = body as {
      content?: string;
      status?: string;
      scheduledAt?: string | null;
    };

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return Response.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (content !== undefined) {
      updateData.content = content;
    }

    if (status !== undefined) {
      updateData.status = status;
      if (status === "approved") {
        updateData.approved = true;
      } else if (status === "rejected") {
        updateData.approved = false;
      }
    }

    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt === null ? null : new Date(scheduledAt);
    }

    const updated = await db.contentPiece.update({
      where: { id },
      data: updateData,
    });

    return Response.json(updated);
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
});
