import { auth } from "@/auth";

import { generateText } from "@/lib/claude";
import { db } from "@/lib/db";

export const POST = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    const { id } = params as { id: string };

    const product = await db.ownProduct.findFirst({ where: { id, userId } });
    if (!product) {
      return Response.json({ error: "OwnProduct not found" }, { status: 404 });
    }

    // Find related blog posts using first word of title as keyword
    const keyword = product.title.split(" ")[0];
    const blogPosts = await db.blogPost.findMany({
      where: { title: { contains: keyword, mode: "insensitive" } },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    const blogPostSummaries = blogPosts
      .map((p) => `Title: ${p.title}\n${p.seoDescription ?? ""}`)
      .join("\n\n");

    const system =
      "You are a digital product creator. Generate a structured ebook outline.";
    const prompt = `Create an outline for an ebook titled: '${product.title}'. Description: '${product.description}'.${blogPosts.length > 0 ? ` Based on these blog posts:\n\n${blogPostSummaries}\n\n` : " "}Return a JSON array of 6-8 chapters, each with: { title: string, description: string }. Return ONLY the JSON array, no markdown.`;

    const raw = await generateText(prompt, system);

    // Strip markdown code fences if present
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const outline = JSON.parse(cleaned) as {
      title: string;
      description: string;
    }[];

    await db.ownProduct.update({
      where: { id },
      data: { outline: JSON.stringify(outline) },
    });

    return Response.json({ outline });
  } catch (error) {
    console.error("[generate-outline]", error);
    return new Response("Internal server error", { status: 500 });
  }
});
