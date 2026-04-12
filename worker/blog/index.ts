/**
 * index.ts
 *
 * Orchestrates the blog generation pipeline:
 * 1. Find today's top-scored, unselected ResearchTopic
 * 2. Generate a blog post with Claude/Gemini
 * 3. Generate images for each [IMAGE: ...] marker and save to public/blog-images/
 * 4. Optionally publish to Ghost CMS
 * 5. Save BlogPost to DB and mark the topic as selected
 */

import fs from "fs";
import path from "path";

import { db } from "../../lib/db";
import { generateImage } from "../../lib/image-gen";
import { getSetting } from "../../lib/settings";
import { generateBlogPost } from "./generate";
import { publishToGhost } from "./ghost";

// ---------------------------------------------------------------------------
// Logger helper (mirrors worker/engine/run.ts pattern)
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
// Image generation helper — mirrors worker/media/image.ts pattern
// ---------------------------------------------------------------------------

async function generateBlogImage(
  prompt: string,
  outputPath: string,
  userId: string,
): Promise<void> {
  const buffer = await generateImage({ prompt, userId });
  fs.writeFileSync(outputPath, buffer);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function runBlogGeneration(userId: string): Promise<void> {
  const logger = makeLogger();

  // 1. Get today's date (midnight UTC)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  logger.info("Blog generation started");

  // 2. Find today's top-scored, unselected ResearchTopic
  const topic = await db.researchTopic.findFirst({
    where: {
      userId,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
      selected: false,
    },
    orderBy: { score: "desc" },
  });

  if (!topic) {
    logger.info(
      "No unselected ResearchTopic found for today — skipping blog generation",
    );
    return;
  }

  logger.info(`Selected topic: "${topic.title}" (score: ${topic.score})`);

  // 3. Generate blog post content
  logger.info("Generating blog post with AI…");
  const postContent = await generateBlogPost({
    title: topic.title,
    summary: topic.summary,
    url: topic.url,
  });
  logger.info(
    `Blog post generated: "${postContent.title}" — ${postContent.imagePrompts.length} image prompt(s)`,
  );

  // 4. Generate images for each [IMAGE: ...] marker
  const blogImagesDir = path.resolve("./public/blog-images");
  fs.mkdirSync(blogImagesDir, { recursive: true });

  let processedContent = postContent.content;

  for (let i = 0; i < postContent.imagePrompts.length; i++) {
    const prompt = postContent.imagePrompts[i];
    const filename = `${dateStr}-${i}.png`;
    const outputPath = path.join(blogImagesDir, filename);
    const publicSrc = `/blog-images/${filename}`;

    logger.info(
      `Generating image ${i + 1}/${postContent.imagePrompts.length}…`,
    );

    try {
      await generateBlogImage(prompt, outputPath, userId);
      logger.info(`Image saved: ${outputPath}`);

      // Replace the [IMAGE: ...] marker in content with an <img> tag
      // We replace the first occurrence each time (since we process in order)
      processedContent = processedContent.replace(
        /\[IMAGE:[^\]]*\]/,
        `<img src="${publicSrc}" alt="${prompt.slice(0, 100).replace(/"/g, "'")}" />`,
      );
    } catch (err) {
      logger.error(`Image generation failed for prompt ${i + 1}`, err);
      // Remove the marker so it doesn't appear in the published post
      processedContent = processedContent.replace(/\[IMAGE:[^\]]*\]/, "");
    }
  }

  // Update content with processed version (images replaced)
  postContent.content = processedContent;

  // 5. Read Ghost settings
  const ghostUrl = await getSetting("ghost_url", userId);
  const ghostAdminApiKey = await getSetting("ghost_admin_api_key", userId);
  const blogAuthorName = await getSetting("blog_author_name", userId);

  let ghostId: string | undefined;
  let ghostPostUrl: string | undefined;

  // 6. Publish to Ghost if credentials are configured
  if (ghostUrl && ghostAdminApiKey) {
    logger.info("Publishing to Ghost CMS…");
    try {
      const result = await publishToGhost(
        postContent,
        ghostUrl,
        ghostAdminApiKey,
        blogAuthorName,
      );
      ghostId = result.ghostId;
      ghostPostUrl = result.ghostUrl;
      logger.info(`Published to Ghost: ${ghostPostUrl} (id: ${ghostId})`);
    } catch (err) {
      logger.error("Ghost publishing failed", err);
    }
  } else {
    logger.info("Ghost credentials not configured — saving as draft");
  }

  // 7. Save BlogPost to DB
  const blogPost = await db.blogPost.create({
    data: {
      userId,
      date: today,
      topicId: topic.id,
      title: postContent.title,
      slug: postContent.slug,
      seoDescription: postContent.seoDescription,
      content: postContent.content,
      ghostId: ghostId ?? null,
      ghostUrl: ghostPostUrl ?? null,
      status: ghostId ? "published" : "draft",
    },
  });

  logger.info(
    `BlogPost saved to DB (id: ${blogPost.id}, status: ${blogPost.status})`,
  );

  // 9. Mark topic as selected
  await db.researchTopic.update({
    where: { id: topic.id },
    data: { selected: true },
  });

  logger.info(`ResearchTopic marked as selected (id: ${topic.id})`);
  logger.info("Blog generation completed successfully");
}

// ---------------------------------------------------------------------------
// Per-topic export — non-destructive (does NOT delete existing posts or reset
// other topics' selected flags)
// ---------------------------------------------------------------------------

export async function runBlogGenerationForTopic(
  topicId: string,
  userId: string,
): Promise<import("@prisma/client").BlogPost> {
  const logger = makeLogger();

  // 1. Fetch the specific topic by ID
  const topic = await db.researchTopic.findUnique({ where: { id: topicId } });

  if (!topic) {
    throw new Error("ResearchTopic not found: " + topicId);
  }

  logger.info('Blog generation started for topic: "' + topic.title + '"');

  // 2. Generate blog post content
  logger.info("Generating blog post with AI…");
  const postContent = await generateBlogPost({
    title: topic.title,
    summary: topic.summary ?? undefined,
    url: topic.url ?? undefined,
  });
  logger.info(
    `Blog post generated: "${postContent.title}" — ${postContent.imagePrompts.length} image prompt(s)`,
  );

  // 3. Generate images for each [IMAGE: ...] marker
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  const blogImagesDir = path.resolve("./public/blog-images");
  fs.mkdirSync(blogImagesDir, { recursive: true });

  let processedContent = postContent.content;

  for (let i = 0; i < postContent.imagePrompts.length; i++) {
    const prompt = postContent.imagePrompts[i];
    const filename = `${dateStr}-${topicId.slice(0, 8)}-${i}.png`;
    const outputPath = path.join(blogImagesDir, filename);
    const publicSrc = `/blog-images/${filename}`;

    logger.info(
      `Generating image ${i + 1}/${postContent.imagePrompts.length}…`,
    );

    try {
      await generateBlogImage(prompt, outputPath, userId);
      logger.info(`Image saved: ${outputPath}`);

      // Replace the [IMAGE: ...] marker in content with an <img> tag
      processedContent = processedContent.replace(
        /\[IMAGE:[^\]]*\]/,
        `<img src="${publicSrc}" alt="${prompt.slice(0, 100).replace(/"/g, "'")}" />`,
      );
    } catch (err) {
      logger.error(`Image generation failed for prompt ${i + 1}`, err);
      // Remove the marker so it doesn't appear in the published post
      processedContent = processedContent.replace(/\[IMAGE:[^\]]*\]/, "");
    }
  }

  // Update content with processed version (images replaced)
  postContent.content = processedContent;

  // 4. Create the BlogPost record (non-destructive — no deleteMany)
  const blogPost = await db.blogPost.create({
    data: {
      userId,
      date: today,
      topicId: topic.id,
      title: postContent.title,
      slug: postContent.slug,
      seoDescription: postContent.seoDescription,
      content: postContent.content,
      status: "draft",
    },
  });

  logger.info(`BlogPost saved to DB (id: ${blogPost.id})`);

  // 5. Mark only the target topic as selected (other topics untouched)
  await db.researchTopic.update({
    where: { id: topicId },
    data: { selected: true },
  });

  logger.info(`ResearchTopic marked as selected (id: ${topicId})`);

  // 6. Optionally publish to Ghost (non-fatal if it fails)
  const ghostUrl = await getSetting("ghost_url", userId);
  const ghostAdminApiKey = await getSetting("ghost_admin_api_key", userId);
  const blogAuthorName = await getSetting("blog_author_name", userId);

  if (ghostUrl && ghostAdminApiKey) {
    logger.info("Publishing to Ghost CMS…");
    try {
      const result = await publishToGhost(
        postContent,
        ghostUrl,
        ghostAdminApiKey,
        blogAuthorName,
      );
      logger.info(
        `Published to Ghost: ${result.ghostUrl} (id: ${result.ghostId})`,
      );
    } catch (err) {
      logger.error("Ghost publishing failed", err);
    }
  } else {
    logger.info("Ghost credentials not configured — saved as draft");
  }

  logger.info("Blog generation for topic completed successfully");

  return blogPost;
}
