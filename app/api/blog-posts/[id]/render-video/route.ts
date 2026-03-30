import path from "path";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { renderVideo } from "@/worker/media/video";

export const POST = auth(async (req, ctx) => {
  if (!req.auth) return new Response("Not authenticated", { status: 401 });

  try {
    const { id } = (ctx as { params: { id: string } }).params;

    // 1. Get blog post
    const post = await db.blogPost.findUnique({
      where: { id },
      include: {
        contentPieces: { orderBy: { platform: "asc" } },
      },
    });

    if (!post) return new Response("Not found", { status: 404 });

    // 2. Merge pieces by blogPostId + pieces by date (deduplicated by id)
    const dayStart = new Date(post.date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const datePieces = await db.contentPiece.findMany({
      where: {
        date: { gte: dayStart, lt: dayEnd },
        platform: { not: "master" },
      },
      orderBy: { platform: "asc" },
    });

    const byId = new Map(post.contentPieces.map((p) => [p.id, p]));
    for (const p of datePieces) byId.set(p.id, p);
    const pieces = Array.from(byId.values());

    // 3. Find the video content piece
    const videoPiece = pieces.find((p) => p.platform === "video") ?? null;
    if (!videoPiece) {
      return Response.json(
        { error: "No video script found for this post. Run the engine first." },
        { status: 400 }
      );
    }

    // 4. Parse the video script JSON (strip markdown code fences if present)
    let script: { hook: string; points: string[]; reveal: string; cta: string };
    try {
      const raw = (videoPiece.content ?? "").replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "").trim();
      script = JSON.parse(raw);
    } catch {
      return Response.json(
        { error: "Video script is not valid JSON" },
        { status: 400 }
      );
    }

    // 5. Get promotionId from any piece that has one
    const promotionId = pieces.find((p) => p.promotionId)?.promotionId ?? null;
    if (!promotionId) {
      return Response.json(
        { error: "No promotion linked for video rendering" },
        { status: 400 }
      );
    }

    // 6. Fetch the Promotion record
    const promotion = await db.promotion.findUnique({
      where: { id: promotionId },
      select: { name: true, url: true },
    });
    if (!promotion) {
      return Response.json(
        { error: "No promotion linked for video rendering" },
        { status: 400 }
      );
    }

    // 7. Format date as YYYY-MM-DD
    const d = new Date(post.date);
    const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

    // 8. Build output path
    const outputPath = path.join(process.cwd(), "media", "videos", `${date}.mp4`);
    const mediaPath = `./media/videos/${date}.mp4`;

    // 9. Render the video
    await renderVideo({
      script,
      promotion: { name: promotion.name, url: promotion.url },
      outputPath,
    });

    // 10. Update the video ContentPiece with the mediaPath
    await db.contentPiece.update({
      where: { id: videoPiece.id },
      data: { mediaPath },
    });

    return Response.json({ mediaPath });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
});
