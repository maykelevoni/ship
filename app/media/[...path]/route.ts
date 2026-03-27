import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".mp4") return "video/mp4";
  return "application/octet-stream";
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await ctx.params;

  // Security: reject any segment containing ".."
  if (segments.some((s) => s.includes(".."))) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const filePath = path.join(process.cwd(), "media", ...segments);

  try {
    const data = await fs.readFile(filePath);
    const contentType = getContentType(filePath);
    return new NextResponse(data, {
      status: 200,
      headers: { "Content-Type": contentType },
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}
