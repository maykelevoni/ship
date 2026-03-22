/**
 * generate.ts
 *
 * Generates a full blog post from a research topic using Claude (with Gemini
 * fallback via lib/ai.ts).
 */

import { generateText } from '../../lib/ai'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BlogPostContent {
  title: string
  slug: string
  seoDescription: string
  content: string
  imagePrompts: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function extractImagePrompts(content: string): string[] {
  const matches = content.matchAll(/\[IMAGE:\s*([^\]]+)\]/g)
  return Array.from(matches, (m) => m[1].trim())
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generateBlogPost(topic: {
  title: string
  summary?: string | null
  url?: string | null
}): Promise<BlogPostContent> {
  const isYouTube =
    topic.url != null &&
    (topic.url.includes('youtube.com') || topic.url.includes('youtu.be'))

  const videoId = isYouTube && topic.url ? extractYouTubeVideoId(topic.url) : null

  const youtubeInstructions = videoId
    ? `- Include a "Watch the Video" section with the following exact iframe HTML (do not modify it):
<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    : ''

  const summaryContext = topic.summary ? `\n\nTopic summary: ${topic.summary}` : ''
  const urlContext = topic.url && !isYouTube ? `\n\nSource URL: ${topic.url}` : ''

  const systemPrompt = `You are an expert blog writer who produces SEO-optimized, engaging, long-form blog posts.
Your posts are well-structured, informative, and written for a general audience interested in technology and business.
Always follow the exact format requested.`

  const userPrompt = `Write a full blog post about the following topic:

Topic: ${topic.title}${summaryContext}${urlContext}

Your response must follow this EXACT structure (do not include the structure labels themselves, just the content):

1. SEO_TITLE: A compelling, SEO-optimized title (output on its own line as: SEO_TITLE: <title here>)

2. SEO_DESCRIPTION: A meta description of 150 characters max (output on its own line as: SEO_DESCRIPTION: <description here>)

3. CONTENT: The full blog post in markdown format, including:
   - An engaging introduction paragraph
   - Place exactly this marker after the intro: [IMAGE: <detailed image generation prompt describing a relevant visual for this post>]
   - 3–5 H2 sections (## Section Title) each with 2–3 paragraphs of body text
   - Place exactly this marker after the second H2 section: [IMAGE: <detailed image generation prompt describing a relevant visual for this post>]
   ${youtubeInstructions}
   - A conclusion paragraph
   - A call-to-action encouraging readers to subscribe to the blog for more content

Important rules:
- The [IMAGE: ...] markers must be placed exactly as shown, with a detailed description inside
- Each image prompt should be vivid, descriptive, and relevant to the surrounding content
- Do not use placeholder text — write real, valuable content
- The post should be at least 800 words`

  const result = await generateText(userPrompt, systemPrompt)
  const raw = result.text

  // Extract SEO_TITLE
  const titleMatch = raw.match(/^SEO_TITLE:\s*(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : topic.title

  // Extract SEO_DESCRIPTION
  const descMatch = raw.match(/^SEO_DESCRIPTION:\s*(.+)$/m)
  const seoDescription = descMatch
    ? descMatch[1].trim().slice(0, 150)
    : `Read about ${topic.title}`

  // Extract CONTENT — everything after the SEO_DESCRIPTION line
  let content = raw
  // Remove the SEO_TITLE and SEO_DESCRIPTION header lines
  content = content.replace(/^SEO_TITLE:.*$/m, '').replace(/^SEO_DESCRIPTION:.*$/m, '').trim()

  // If there's a CONTENT: label, strip it
  content = content.replace(/^CONTENT:\s*/m, '').trim()

  const slug = generateSlug(title)
  const imagePrompts = extractImagePrompts(content)

  return {
    title,
    slug,
    seoDescription,
    content,
    imagePrompts,
  }
}
