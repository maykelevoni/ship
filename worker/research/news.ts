import type { RawTopic } from './index'

export async function fetchNewsApiHeadlines(apiKey: string, categories: string): Promise<RawTopic[]> {
  if (!apiKey) {
    console.log('[research/news] No API key configured — skipping')
    return []
  }

  const cats = categories.split(',').map((c) => c.trim()).filter(Boolean)

  const results = await Promise.allSettled(
    cats.map(async (category): Promise<RawTopic[]> => {
      try {
        const url = `https://newsapi.org/v2/top-headlines?category=${encodeURIComponent(category)}&apiKey=${encodeURIComponent(apiKey)}&pageSize=5`
        const res = await fetch(url)

        if (!res.ok) {
          console.error(`[research/news] Request failed for category "${category}": ${res.status} ${res.statusText}`)
          return []
        }

        const data = await res.json() as {
          articles?: Array<{
            title: string
            url: string
            description?: string
          }>
        }

        if (!data.articles) return []

        return data.articles.map((article) => ({
          source: 'newsapi',
          title: article.title,
          url: article.url,
          summary: article.description ?? undefined,
        }))
      } catch (err) {
        console.error(`[research/news] Error fetching category "${category}"`, err instanceof Error ? err.message : String(err))
        return []
      }
    }),
  )

  return results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : [],
  )
}
