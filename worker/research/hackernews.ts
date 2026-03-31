import type { RawTopic } from './index'

export async function fetchHackerNewsTop(keyword?: string): Promise<RawTopic[]> {
  try {
    let url: string
    if (keyword) {
      url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(keyword)}&tags=story&hitsPerPage=15`
    } else {
      url = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20'
    }

    const res = await fetch(url)

    if (!res.ok) {
      console.error(`[research/hackernews] Request failed: ${res.status} ${res.statusText}`)
      return []
    }

    const data = await res.json() as {
      hits?: Array<{
        title?: string
        url?: string
        story_url?: string
      }>
    }

    if (!data.hits) return []

    return data.hits
      .filter((hit) => hit.title && hit.title.trim() !== '')
      .map((hit) => ({
        source: 'hackernews',
        title: hit.title!,
        url: hit.url ?? hit.story_url,
        summary: undefined,
      }))
  } catch (err) {
    console.error('[research/hackernews] Error fetching topics', err instanceof Error ? err.message : String(err))
    return []
  }
}
