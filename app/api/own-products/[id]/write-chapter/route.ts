import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateText } from "@/lib/claude";

interface Chapter {
  title: string;
  description: string;
  content?: string;
}

export const POST = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  try {
    const { id } = params as { id: string };

    const product = await db.ownProduct.findUnique({ where: { id } });
    if (!product) {
      return Response.json({ error: "OwnProduct not found" }, { status: 404 });
    }

    const body = await req.json();
    const { chapterIndex } = body as { chapterIndex: number };

    const outline: Chapter[] = JSON.parse(product.outline || "[]");
    if (chapterIndex < 0 || chapterIndex >= outline.length) {
      return Response.json({ error: "Invalid chapterIndex" }, { status: 400 });
    }

    const chapter = outline[chapterIndex];

    // Get context from related blog posts
    const keyword = product.title.split(" ")[0];
    const blogPosts = await db.blogPost.findMany({
      where: { title: { contains: keyword, mode: "insensitive" } },
      take: 2,
      orderBy: { createdAt: "desc" },
    });

    const blogPostContent = blogPosts
      .map((p) => `Title: ${p.title}\n${p.content.slice(0, 800)}`)
      .join("\n\n");

    const system = "You are a professional writer creating educational ebook content.";
    const prompt = `Write the full content for this chapter of the ebook '${product.title}':\n\nChapter: ${chapter.title}\nDescription: ${chapter.description}\n${blogPosts.length > 0 ? `\nContext from blog posts:\n${blogPostContent}\n` : ""}
Write 500-800 words. Use clear headers, bullet points where appropriate. Be practical and actionable.`;

    const content = await generateText(prompt, system);

    // Update the chapter in the outline
    outline[chapterIndex] = { ...chapter, content };

    await db.ownProduct.update({
      where: { id },
      data: { outline: JSON.stringify(outline) },
    });

    return Response.json({ content, chapterIndex });
  } catch (error) {
    console.error("[write-chapter]", error);
    return new Response("Internal server error", { status: 500 });
  }
});
