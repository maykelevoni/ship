import path from "path";

import { db } from "../../lib/db";
import { getSetting } from "../../lib/settings";
import { generateFromBlog } from "../engine/generate";
import { renderImage } from "../media/image";
import { renderVideo } from "../media/video";

// ---------------------------------------------------------------------------
// Social repurposing from today's blog post
// ---------------------------------------------------------------------------

const PLATFORMS = [
  "twitter",
  "linkedin",
  "reddit",
  "instagram",
  "video",
] as const;
type SocialPlatform = (typeof PLATFORMS)[number];

export async function runSocialRepurposing(userId: string): Promise<void> {
  // 1. Get today's date at midnight UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // 2. Find today's blog post (published or draft)
  const blogPost = await db.blogPost.findFirst({
    where: {
      userId,
      date: today,
      status: { in: ["published", "draft"] },
    },
  });

  if (!blogPost) {
    console.log(
      "[social] No blog post for today — skipping social repurposing",
    );
    return;
  }

  console.log(
    `[social] Repurposing blog post: "${blogPost.title}" (${blogPost.id})`,
  );

  // 3. Load templates from DB
  const templateRows = await db.template.findMany({
    where: { userId, platform: { in: [...PLATFORMS] }, active: true },
  });
  const templates = Object.fromEntries(
    templateRows.map((t) => [t.platform, t]),
  );

  // 4. Read gate_mode setting
  const gateModeRaw = await getSetting("gate_mode", userId);
  const gateMode = gateModeRaw === "true";

  const status = gateMode ? "generated" : "approved";
  const approved = !gateMode;

  const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const blogContent = blogPost.content;

  // 5. Generate all platforms in parallel
  const results = await Promise.allSettled(
    PLATFORMS.map((platform) =>
      generateFromBlog(blogContent, platform, templates[platform]),
    ),
  );

  // 6. Save each ContentPiece and collect saved IDs for media steps
  const savedPieces: Partial<
    Record<SocialPlatform, { id: string; content: string }>
  > = {};

  for (let i = 0; i < PLATFORMS.length; i++) {
    const platform = PLATFORMS[i];
    const result = results[i];

    if (result.status === "rejected") {
      console.error(
        `[social] Generation failed for "${platform}":`,
        result.reason,
      );
      continue;
    }

    const { content, provider } = result.value;

    try {
      const piece = await db.contentPiece.create({
        data: {
          userId,
          promotionId: null,
          blogPostId: blogPost.id,
          date: today,
          platform,
          content,
          provider,
          status,
          approved,
        },
      });
      savedPieces[platform] = { id: piece.id, content };
      console.log(
        `[social] Saved "${platform}" piece (id: ${piece.id}, provider: ${provider})`,
      );
    } catch (err) {
      console.error(`[social] Failed to save piece for "${platform}":`, err);
    }
  }

  // 7. Render instagram image
  const instagramPiece = savedPieces["instagram"];
  if (instagramPiece) {
    try {
      // Use first 150 chars of blog content as the excerpt for the quote card
      const excerpt = blogContent.slice(0, 150).trimEnd();
      const outputDir = path.resolve("./media/images");
      const outputPath = path.join(outputDir, `${dateStr}-instagram-blog.png`);

      const mediaPath = await renderImage({
        style: "quote-card",
        promptData: {
          quote: excerpt,
          attribution: blogPost.title,
        },
        outputPath,
      });

      await db.contentPiece.update({
        where: { id: instagramPiece.id },
        data: { mediaPath },
      });
      console.log(`[social] Instagram image saved: ${mediaPath}`);
    } catch (err) {
      console.error("[social] Instagram image generation failed:", err);
    }
  }

  // 8. Render video
  const videoPiece = savedPieces["video"];
  if (videoPiece) {
    try {
      const script = JSON.parse(videoPiece.content) as {
        hook: string;
        points: string[];
        reveal: string;
        cta: string;
      };

      const outputDir = path.resolve("./media/videos");
      const outputPath = path.join(outputDir, `${dateStr}-blog.mp4`);

      const mediaPath = await renderVideo({
        script,
        promotion: { name: blogPost.title, url: blogPost.ghostUrl ?? "" },
        outputPath,
      });

      await db.contentPiece.update({
        where: { id: videoPiece.id },
        data: { mediaPath },
      });
      console.log(`[social] Video saved: ${mediaPath}`);
    } catch (err) {
      console.error("[social] Video generation failed:", err);
    }
  }

  const count = Object.keys(savedPieces).length;
  console.log(
    `[social] Social repurposing complete — ${count} piece(s) saved (gate_mode: ${gateMode})`,
  );
}
