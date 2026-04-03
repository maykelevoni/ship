import { auth } from "@/auth";
import { sendEmail } from "@/worker/posting/brevo";
import { postToPlatform } from "@/worker/posting/post-bridge";

import { db } from "@/lib/db";

export const POST = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const userId = req.auth.user.id;
    const { id } = params as { id: string };

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    if (user?.plan === "free") {
      return Response.json(
        { error: "Upgrade required to publish posts", upgrade: true },
        { status: 403 },
      );
    }

    const piece = await db.contentPiece.findFirst({ where: { id, userId } });
    if (!piece) {
      return Response.json(
        { error: "ContentPiece not found" },
        { status: 404 },
      );
    }

    // Already posted — return early
    if (piece.status === "posted") {
      return Response.json({
        message: "Already posted",
        postBridgeId: piece.postBridgeId,
      });
    }

    // Ensure piece is approved before dispatch
    await db.contentPiece.update({
      where: { id },
      data: { approved: true, status: "approved" },
    });

    const { platform, content } = piece;
    let postBridgeId: string;

    switch (platform) {
      case "twitter": {
        const result = await postToPlatform({ platform: "twitter", content });
        postBridgeId = result.id;
        break;
      }

      case "linkedin": {
        const result = await postToPlatform({
          platform: "linkedin",
          content,
          mediaPath: piece.mediaPath ?? undefined,
        });
        postBridgeId = result.id;
        break;
      }

      case "instagram": {
        const result = await postToPlatform({
          platform: "instagram",
          content,
          mediaPath: piece.mediaPath ?? undefined,
        });
        postBridgeId = result.id;
        break;
      }

      case "reddit": {
        const result = await postToPlatform({ platform: "reddit", content });
        postBridgeId = result.id;
        break;
      }

      case "video": {
        // Use TikTok as primary for video pieces
        const result = await postToPlatform({
          platform: "tiktok",
          content,
          mediaPath: piece.mediaPath ?? undefined,
        });
        postBridgeId = result.id;
        break;
      }

      case "email": {
        // Content format: "SUBJECT: <subject>\nBODY: <body>"
        const lines = content.split("\n");
        const subjectLine = lines.find((l) => l.startsWith("SUBJECT:")) ?? "";
        const subject =
          subjectLine.replace(/^SUBJECT:\s*/, "").trim() || "Newsletter";
        const bodyStart = content.indexOf("BODY:");
        const body = bodyStart !== -1 ? content.slice(bodyStart) : content;
        const result = await sendEmail({ subject, body });
        postBridgeId = result.id;
        break;
      }

      default: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await postToPlatform({
          platform: platform as any,
          content,
        });
        postBridgeId = result.id;
        break;
      }
    }

    // Update DB: mark as posted
    await db.contentPiece.update({
      where: { id },
      data: {
        status: "posted",
        postedAt: new Date(),
        postBridgeId,
      },
    });

    return Response.json({ success: true, postBridgeId, platform });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
});
