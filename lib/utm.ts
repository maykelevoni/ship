/**
 * UTM URL builder for PostForge outbound links.
 * Post-processes generated content — not injected into AI prompts directly.
 *
 * Standard UTM params:
 *   utm_source   = "postforge" (always)
 *   utm_medium   = platform (twitter|linkedin|reddit|instagram|email|blog)
 *   utm_campaign = promotion name (slugified)
 *   utm_content  = content type (social|email|blog)
 */
export function buildUtmUrl(
  baseUrl: string,
  params: {
    medium: string
    campaign: string
    content: string
  }
): string {
  try {
    const url = new URL(baseUrl)
    url.searchParams.set('utm_source', 'postforge')
    url.searchParams.set('utm_medium', params.medium)
    url.searchParams.set('utm_campaign', params.campaign)
    url.searchParams.set('utm_content', params.content)
    return url.toString()
  } catch {
    // Invalid URL — return as-is rather than crashing generation
    return baseUrl
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
