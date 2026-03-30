import crypto from "crypto";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Manual JWT creation (HS256) — avoids jsonwebtoken dependency
// Copied verbatim from worker/blog/ghost.ts
// ---------------------------------------------------------------------------

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function createGhostJwt(id: string, secret: string): string {
  const nowSeconds = Math.floor(Date.now() / 1000);

  const header = { alg: "HS256", typ: "JWT", kid: id };
  const payload = {
    iat: nowSeconds,
    exp: nowSeconds + 300,
    aud: "/admin/",
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const keyBuffer = Buffer.from(secret, "hex");
  const signature = crypto
    .createHmac("sha256", keyBuffer)
    .update(signingInput)
    .digest();

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

// ---------------------------------------------------------------------------
// POST /api/blog-posts/[id]/publish
// ---------------------------------------------------------------------------

export const POST = auth(async (req, context) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = await (context as unknown as { params: Promise<{ id: string }> }).params;

    // Load the BlogPost record
    const post = await db.blogPost.findUnique({ where: { id } });
    if (!post) {
      return new Response("Not found", { status: 404 });
    }

    // Require a Ghost ID
    if (!post.ghostId) {
      return new Response("Post has no Ghost ID", { status: 400 });
    }

    // Load Ghost settings
    const settingRows = await db.setting.findMany({
      where: { key: { in: ["ghost_url", "ghost_admin_api_key"] } },
    });
    const settings = Object.fromEntries(settingRows.map((s) => [s.key, s.value]));

    const ghostUrl = settings["ghost_url"];
    const ghostAdminApiKey = settings["ghost_admin_api_key"];

    if (!ghostUrl || !ghostAdminApiKey) {
      return new Response("Ghost not configured", { status: 400 });
    }

    // Build JWT
    const colonIndex = ghostAdminApiKey.indexOf(":");
    const keyId = ghostAdminApiKey.slice(0, colonIndex);
    const secret = ghostAdminApiKey.slice(colonIndex + 1);
    const jwt = createGhostJwt(keyId, secret);

    // Call Ghost Admin API to publish the post
    const apiUrl = `${ghostUrl.replace(/\/$/, "")}/ghost/api/admin/posts/${post.ghostId}/?source=html`;

    const ghostRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Ghost ${jwt}`,
      },
      body: JSON.stringify({
        posts: [{ status: "published", updated_at: new Date().toISOString() }],
      }),
    });

    if (!ghostRes.ok) {
      const errorText = await ghostRes.text();
      return new Response(errorText, { status: 502 });
    }

    const data = (await ghostRes.json()) as { posts: Array<{ url: string }> };
    const publishedGhostUrl = data.posts[0].url;

    // Update local record
    await db.blogPost.update({
      where: { id },
      data: { status: "published", ghostUrl: publishedGhostUrl },
    });

    return Response.json({ ok: true, ghostUrl: publishedGhostUrl });
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
});
