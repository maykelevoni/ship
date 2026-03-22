import type { RawTopic } from './index'

export async function fetchRedditHot(subreddits: string): Promise<RawTopic[]> {
  const subs = subreddits.split(',').map((s) => s.trim()).filter(Boolean)

  const results = await Promise.allSettled(
    subs.map(async (sub): Promise<RawTopic[]> => {
      try {
        const url = `https://www.reddit.com/r/${encodeURIComponent(sub)}/hot.json?limit=5`
        const res = await fetch(url, {
          headers: { 'User-Agent': 'PostForge/1.0' },
        })

        if (!res.ok) {
          console.error(`[research/reddit] Request failed for r/${sub}: ${res.status} ${res.statusText}`)
          return []
        }

        const data = await res.json() as {
          data?: {
            children?: Array<{
              data: {
                title: string
                permalink: string
                selftext?: string
              }
            }>
          }
        }

        if (!data.data?.children) return []

        return data.data.children.map((child) => ({
          source: 'reddit',
          title: child.data.title,
          url: `https://reddit.com${child.data.permalink}`,
          summary: child.data.selftext?.slice(0, 300),
        }))
      } catch (err) {
        console.error(`[research/reddit] Error fetching r/${sub}`, err instanceof Error ? err.message : String(err))
        return []
      }
    }),
  )

  return results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : [],
  )
}
