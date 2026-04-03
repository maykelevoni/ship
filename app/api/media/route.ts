import fs from "fs";
import path from "path";
import { auth } from "@/auth";
import {
  generateStudioImage,
  generateStudioVideo,
  resizeForPlatforms,
} from "@/worker/media/studio";

import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// POST /api/media
// Body: { type: 'image' | 'video', prompt: string, parentId?: string,
//         useAiBackground?: boolean, backgroundAssetId?: string }
// ---------------------------------------------------------------------------

export const POST = auth(async (req) => {
  if (!req.auth) return new Response("Not authenticated", { status: 401 });

  const userId = req.auth!.user!.id as string;

  try {
    const body = await req.json();
    const {
      type,
      prompt,
      parentId,
      useAiBackground,
      backgroundAssetId,
    }: {
      type: "image" | "video";
      prompt: string;
      parentId?: string;
      useAiBackground?: boolean;
      backgroundAssetId?: string;
    } = body;

    if (!type || !prompt) {
      return Response.json(
        { error: "type and prompt are required" },
        { status: 400 },
      );
    }

    if (type === "image") {
      // ---- Image flow ----
      const groupId = crypto.randomUUID();

      // 1. Create pending base row
      const baseRow = await db.mediaAsset.create({
        data: {
          userId,
          type: "image",
          prompt,
          groupId,
          parentId: parentId ?? null,
          platform: null,
          status: "pending",
        },
      });

      try {
        // 2. Optionally fetch parent filePath for Gemini context
        let parentFilePath: string | undefined;
        if (parentId) {
          const parent = await db.mediaAsset.findUnique({
            where: { id: parentId },
            select: { filePath: true },
          });
          parentFilePath = parent?.filePath ?? undefined;
        }

        // 3. Generate base image
        const outputPath = path.join(
          process.cwd(),
          "media",
          "studio",
          `${groupId}-base.png`,
        );
        const { buffer } = await generateStudioImage({
          prompt,
          parentFilePath,
          outputPath,
          userId,
        });

        const baseFilePath = `./media/studio/${groupId}-base.png`;

        // 4. Update base row to done
        const updatedBase = await db.mediaAsset.update({
          where: { id: baseRow.id },
          data: {
            filePath: baseFilePath,
            status: "done",
            width: 1080,
            height: 1080,
          },
        });

        // 5. Resize for platforms
        const outputDir = path.join(process.cwd(), "media", "studio");
        const resizeResults = await resizeForPlatforms({
          sourceBuffer: buffer,
          groupId,
          outputDir,
        });

        // 6. Create DB rows for each platform size
        const resizeRows = await Promise.all(
          resizeResults.map((r) =>
            db.mediaAsset.create({
              data: {
                userId,
                type: "image",
                prompt,
                groupId,
                parentId: null,
                platform: r.platform,
                filePath: `./media/studio/${groupId}-${r.platform}.png`,
                status: "done",
                width: r.width,
                height: r.height,
              },
            }),
          ),
        );

        return Response.json({ assets: [updatedBase, ...resizeRows] });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await db.mediaAsset.update({
          where: { id: baseRow.id },
          data: { status: "failed", errorMsg: message },
        });
        return Response.json({ error: message }, { status: 500 });
      }
    } else if (type === "video") {
      // ---- Video flow ----
      const groupId = crypto.randomUUID();

      // 1. Create pending video row
      const videoRow = await db.mediaAsset.create({
        data: {
          userId,
          type: "video",
          prompt,
          groupId,
          parentId: parentId ?? null,
          status: "pending",
        },
      });

      try {
        // 2. Optionally fetch parent script
        let parentScript: string | undefined;
        if (parentId) {
          const parent = await db.mediaAsset.findUnique({
            where: { id: parentId },
            select: { prompt: true },
          });
          parentScript = parent?.prompt ?? undefined;
        }

        // 3. Optionally build background image data URL
        let backgroundImageDataUrl: string | undefined;
        if (backgroundAssetId) {
          const bgAsset = await db.mediaAsset.findUnique({
            where: { id: backgroundAssetId },
            select: { filePath: true },
          });
          if (bgAsset?.filePath) {
            const absPath = path.isAbsolute(bgAsset.filePath)
              ? bgAsset.filePath
              : path.join(process.cwd(), bgAsset.filePath.replace(/^\.\//, ""));
            const fileBuffer = fs.readFileSync(absPath);
            const base64 = fileBuffer.toString("base64");
            backgroundImageDataUrl = `data:image/png;base64,${base64}`;
          }
        }
        // If useAiBackground is true and no backgroundAssetId, leave undefined —
        // generateStudioVideo will generate the background internally via Gemini.

        // 4. Render video
        const outputPath = path.join(
          process.cwd(),
          "media",
          "studio",
          `${videoRow.id}.mp4`,
        );
        await generateStudioVideo({
          prompt,
          parentScript,
          backgroundImageDataUrl,
          outputPath,
          userId,
        });

        const filePath = `./media/studio/${videoRow.id}.mp4`;

        // 5. Update row to done
        const updatedRow = await db.mediaAsset.update({
          where: { id: videoRow.id },
          data: { filePath, status: "done" },
        });

        return Response.json({ assets: [updatedRow] });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await db.mediaAsset.update({
          where: { id: videoRow.id },
          data: { status: "failed", errorMsg: message },
        });
        return Response.json({ error: message }, { status: 500 });
      }
    } else {
      return Response.json(
        { error: "type must be 'image' or 'video'" },
        { status: 400 },
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
});

// ---------------------------------------------------------------------------
// GET /api/media
// Query: ?type=image|video&limit=50
// ---------------------------------------------------------------------------

export const GET = auth(async (req) => {
  if (!req.auth) return new Response("Not authenticated", { status: 401 });

  const userId = req.auth!.user!.id as string;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "image" | "video" | null;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const assets = await db.mediaAsset.findMany({
      where: { userId, type: type ?? undefined },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return Response.json({ assets });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
});
