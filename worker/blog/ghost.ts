/**
 * ghost.ts
 *
 * Publishes a BlogPostContent to Ghost CMS using the Ghost Admin API.
 * JWT auth is implemented manually using Node.js built-in `crypto` module
 * to avoid requiring the `jsonwebtoken` package.
 */

import crypto from 'crypto'
import type { BlogPostContent } from './generate'

// ---------------------------------------------------------------------------
// Manual JWT creation (HS256) — avoids jsonwebtoken dependency
// ---------------------------------------------------------------------------

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function createGhostJwt(id: string, secret: string): string {
  const nowSeconds = Math.floor(Date.now() / 1000)

  const header = { alg: 'HS256', typ: 'JWT', kid: id }
  const payload = {
    iat: nowSeconds,
    exp: nowSeconds + 300,
    aud: '/admin/',
  }

  const headerB64 = base64UrlEncode(JSON.stringify(header))
  const payloadB64 = base64UrlEncode(JSON.stringify(payload))
  const signingInput = `${headerB64}.${payloadB64}`

  const keyBuffer = Buffer.from(secret, 'hex')
  const signature = crypto
    .createHmac('sha256', keyBuffer)
    .update(signingInput)
    .digest()

  return `${signingInput}.${base64UrlEncode(signature)}`
}

// ---------------------------------------------------------------------------
// Markdown to HTML converter (simple, no external dependencies)
// ---------------------------------------------------------------------------

function markdownToHtml(markdown: string): string {
  const lines = markdown.split('\n')
  const htmlLines: string[] = []
  let inParagraph = false
  let paragraphBuffer: string[] = []

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      const text = paragraphBuffer.join(' ').trim()
      if (text) {
        htmlLines.push(`<p>${text}</p>`)
      }
      paragraphBuffer = []
      inParagraph = false
    }
  }

  function processInline(text: string): string {
    // Bold: **text** → <strong>text</strong>
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text* or _text_ → <em>text</em>
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
    text = text.replace(/_(.+?)_/g, '<em>$1</em>')
    // Inline code: `code` → <code>code</code>
    text = text.replace(/`(.+?)`/g, '<code>$1</code>')
    // Links: [text](url) → <a href="url">text</a>
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    return text
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Raw HTML pass-through (e.g., iframes)
    if (trimmed.startsWith('<') && !trimmed.startsWith('<p') && !trimmed.startsWith('<strong')) {
      flushParagraph()
      htmlLines.push(line)
      continue
    }

    // H3: ### heading
    if (trimmed.startsWith('### ')) {
      flushParagraph()
      htmlLines.push(`<h3>${processInline(trimmed.slice(4))}</h3>`)
      continue
    }

    // H2: ## heading
    if (trimmed.startsWith('## ')) {
      flushParagraph()
      htmlLines.push(`<h2>${processInline(trimmed.slice(3))}</h2>`)
      continue
    }

    // H1: # heading
    if (trimmed.startsWith('# ')) {
      flushParagraph()
      htmlLines.push(`<h1>${processInline(trimmed.slice(2))}</h1>`)
      continue
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushParagraph()
      htmlLines.push('<hr />')
      continue
    }

    // Image tags (already converted to <img ...>)
    if (trimmed.startsWith('<img ')) {
      flushParagraph()
      htmlLines.push(trimmed)
      continue
    }

    // [IMAGE: ...] markers that weren't replaced — skip them
    if (trimmed.startsWith('[IMAGE:')) {
      flushParagraph()
      continue
    }

    // Empty line — flush paragraph
    if (trimmed === '') {
      flushParagraph()
      continue
    }

    // Regular text — accumulate into paragraph
    paragraphBuffer.push(processInline(trimmed))
    inParagraph = true
  }

  // Flush any remaining paragraph
  flushParagraph()

  return htmlLines.join('\n')
}

// ---------------------------------------------------------------------------
// Ghost publish
// ---------------------------------------------------------------------------

export async function publishToGhost(
  post: BlogPostContent,
  ghostUrl: string,
  ghostAdminApiKey: string,
  authorName: string | null,
): Promise<{ ghostId: string; ghostUrl: string }> {
  // Split key into id:secret
  const colonIndex = ghostAdminApiKey.indexOf(':')
  if (colonIndex === -1) {
    throw new Error('ghost_admin_api_key must be in format {id}:{secret}')
  }
  const id = ghostAdminApiKey.slice(0, colonIndex)
  const secret = ghostAdminApiKey.slice(colonIndex + 1)

  const token = createGhostJwt(id, secret)

  const html = markdownToHtml(post.content)

  const postBody: Record<string, unknown> = {
    title: post.title,
    slug: post.slug,
    html,
    custom_excerpt: post.seoDescription,
    status: 'published',
  }

  if (authorName) {
    // Ghost allows setting authors via authors array with name/email
    postBody.authors = [{ name: authorName }]
  }

  const apiUrl = `${ghostUrl.replace(/\/$/, '')}/ghost/api/admin/posts/?source=html`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Ghost ${token}`,
    },
    body: JSON.stringify({ posts: [postBody] }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Ghost API error ${response.status}: ${errorText.slice(0, 500)}`,
    )
  }

  const data = (await response.json()) as { posts: Array<{ id: string; url: string }> }
  const created = data.posts[0]

  return {
    ghostId: created.id,
    ghostUrl: created.url,
  }
}
