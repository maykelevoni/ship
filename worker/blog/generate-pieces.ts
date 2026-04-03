import type { Promotion } from "@prisma/client";

import { db } from "../../lib/db";
import { getSetting } from "../../lib/settings";
import { generateAllFormats } from "../engine/generate";
import { renderImageForPlatform } from "../media/image";
import { renderVideoForPromotion } from "../media/video";

// ---------------------------------------------------------------------------
// Logger helper — mirrors worker/engine/run.ts pattern
// ---------------------------------------------------------------------------

function makeLogger() {
  let log = "";
  return {
    info(msg: string) {
      const line = `[${new Date().toISOString()}] ${msg}`;
      console.log(line);
      log += line + "\n";
    },
    error(msg: string, err?: unknown) {
      const detail = err instanceof Error ? err.message : String(err ?? "");
      const line = `[${new Date().toISOString()}] ERROR: ${msg}${detail ? ` — ${detail}` : ""}`;
      console.error(line);
      log += line + "\n";
    },
    get text() {
      return log;
    },
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generatePiecesForBlogPost(
  blogPostId: string,
  userId: string,
): Promise<{ count: number; pieceIds: string[] }> {
  const logger = makeLogger();

  // 1. Fetch the BlogPost (include topic relation)
  const post = await db.blogPost.findFirst({
    where: { id: blogPostId, userId },
    include: { topic: true },
  });

  if (!post) {
    throw new Error("BlogPost not found: " + blogPostId);
  }

  logger.info(
    `Generating pieces for blog post: "${post.title}" (id: ${post.id})`,
  );

  // 2. Build a pseudo-Promotion to reuse existing generators
  const pseudoPromotion: Promotion = {
    id: post.id,
    userId,
    name: post.title,
    description: post.seoDescription ?? post.title,
    url: post.ghostUrl ?? "",
    affiliateLink: null,
    price: null,
    benefits: null,
    targetAudience: null,
    type: "content",
    status: "active",
    weight: 5,
    geoScore: null,
    geoIssues: null,
    geoAuditedAt: null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  const pieceIds: string[] = [];

  // 3. Save master ContentPiece
  logger.info("Saving master piece…");
  const masterPiece = await db.contentPiece.create({
    data: {
      userId,
      blogPostId: post.id,
      date: today,
      platform: "master",
      content: post.content,
      status: "generated",
    },
  });
  pieceIds.push(masterPiece.id);
  logger.info(`Master piece saved (id: ${masterPiece.id})`);

  // 4. Generate all platform formats
  logger.info("Generating platform formats…");
  const formats = await generateAllFormats(pseudoPromotion, post.content);

  const savedPieces: Record<string, { id: string; content: string }> = {};

  for (const [platform, piece] of Object.entries(formats)) {
    try {
      const { content, provider } = piece;
      const dbPiece = await db.contentPiece.create({
        data: {
          userId,
          blogPostId: post.id,
          date: today,
          platform,
          content,
          provider,
          status: "generated",
        },
      });
      savedPieces[platform] = { id: dbPiece.id, content };
      pieceIds.push(dbPiece.id);
      logger.info(
        `Platform "${platform}" content saved (id: ${dbPiece.id}, provider: ${provider})`,
      );
    } catch (err) {
      logger.error(
        `Failed to save content piece for platform "${platform}"`,
        err,
      );
    }
  }

  // 5. Generate images for linkedin + instagram (errors are caught and logged)
  logger.info("Generating media assets…");

  const videoScript = savedPieces["video"]?.content ?? "";

  const [linkedinResult, instagramResult] = await Promise.allSettled([
    renderImageForPlatform({
      platform: "linkedin",
      promotion: pseudoPromotion,
      postTitle: post.title,
      postDescription: post.seoDescription ?? undefined,
      date: dateStr,
    }),
    renderImageForPlatform({
      platform: "instagram",
      promotion: pseudoPromotion,
      postTitle: post.title,
      postDescription: post.seoDescription ?? undefined,
      date: dateStr,
    }),
  ]);

  // Update linkedin image path
  if (linkedinResult.status === "fulfilled") {
    const linkedinId = savedPieces["linkedin"]?.id;
    if (linkedinId) {
      await db.contentPiece.update({
        where: { id: linkedinId },
        data: { mediaPath: linkedinResult.value },
      });
      logger.info(`LinkedIn image saved: ${linkedinResult.value}`);
    }
  } else {
    logger.error("LinkedIn image generation failed", linkedinResult.reason);
  }

  // Update instagram image path
  if (instagramResult.status === "fulfilled") {
    const instagramId = savedPieces["instagram"]?.id;
    if (instagramId) {
      await db.contentPiece.update({
        where: { id: instagramId },
        data: { mediaPath: instagramResult.value },
      });
      logger.info(`Instagram image saved: ${instagramResult.value}`);
    }
  } else {
    logger.error("Instagram image generation failed", instagramResult.reason);
  }

  // 6. Handle video — check setting, attempt render, always save script piece
  const videoRenderingEnabled =
    (await getSetting("video_rendering_enabled", userId)) === "true";
  const existingVideoId = savedPieces["video"]?.id;

  if (videoRenderingEnabled) {
    try {
      const videoPath = await renderVideoForPromotion({
        promotion: pseudoPromotion,
        videoScript,
        date: dateStr,
      });
      if (existingVideoId) {
        await db.contentPiece.update({
          where: { id: existingVideoId },
          data: { mediaPath: videoPath },
        });
      } else {
        const videoPiece = await db.contentPiece.create({
          data: {
            userId,
            blogPostId: post.id,
            date: today,
            platform: "video",
            content: videoScript,
            mediaPath: videoPath,
            status: "generated",
          },
        });
        pieceIds.push(videoPiece.id);
      }
      logger.info(`Video saved: ${videoPath}`);
    } catch (err) {
      logger.error("Video rendering failed", err);
      // Ensure script piece exists even when render fails
      if (!existingVideoId) {
        const videoPiece = await db.contentPiece.create({
          data: {
            userId,
            blogPostId: post.id,
            date: today,
            platform: "video",
            content: videoScript,
            status: "generated",
          },
        });
        pieceIds.push(videoPiece.id);
      }
    }
  } else {
    logger.info("Video rendering disabled — script saved, no MP4");
    if (!existingVideoId) {
      const videoPiece = await db.contentPiece.create({
        data: {
          userId,
          blogPostId: post.id,
          date: today,
          platform: "video",
          content: videoScript,
          status: "generated",
        },
      });
      pieceIds.push(videoPiece.id);
    }
  }

  logger.info(
    `generatePiecesForBlogPost completed — ${pieceIds.length} piece(s) created`,
  );

  return { count: pieceIds.length, pieceIds };
}
