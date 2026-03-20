import { auth } from "@/auth";
import { db } from "@/lib/db";

const VALID_ACTIONS = ["approve", "reject", "edit"] as const;
type Action = (typeof VALID_ACTIONS)[number];

export const PATCH = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = params as { id: string };

    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const body = await req.json();
    const { action, content } = body as { action: Action; content?: string };

    if (!action || !VALID_ACTIONS.includes(action)) {
      return Response.json(
        { error: "action must be one of: approve, reject, edit" },
        { status: 400 }
      );
    }

    if (action === "edit" && (typeof content !== "string" || content.trim() === "")) {
      return Response.json(
        { error: "content is required for edit action" },
        { status: 400 }
      );
    }

    // Verify the piece exists
    const existing = await db.contentPiece.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "ContentPiece not found" }, { status: 404 });
    }

    let updateData: Record<string, unknown>;

    switch (action) {
      case "approve":
        updateData = { status: "approved", approved: true };
        break;
      case "reject":
        updateData = { status: "rejected" };
        break;
      case "edit":
        updateData = { content: content!.trim(), status: "approved", approved: true };
        break;
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
