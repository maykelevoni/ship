import fs from "fs";
import path from "path";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// DELETE /api/media/[id]
// Removes the DB row and the file from disk (if filePath exists).
// ---------------------------------------------------------------------------

export const DELETE = auth(async (req, context) => {
  if (!req.auth) return new Response("Not authenticated", { status: 401 });

  try {
    const { id } = (await context?.params) as { id: string };

    // 1. Find the asset
    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // 2. Delete file from disk if filePath is set and file exists
    if (asset.filePath) {
      const resolvedPath = path.resolve(asset.filePath);
      if (fs.existsSync(resolvedPath)) {
        fs.unlinkSync(resolvedPath);
      }
    }

    // 3. Delete the DB row (do NOT cascade variations — parentId is nullable)
    await db.mediaAsset.delete({ where: { id } });

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
});
