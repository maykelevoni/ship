// @ts-ignore — google-trends-api has no official TypeScript types
import googleTrends from 'google-trends-api'
import type { RawTopic } from './index'

export async function fetchGoogleTrends(keyword?: string): Promise<RawTopic[]> {
  try {
    if (keyword) {
      const result: string = await googleTrends.relatedQueries({
        keyword,
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })
      const parsed = JSON.parse(result) as {
        default?: {
          rankedList?: Array<{
            rankedKeyword?: Array<{ query: string }>
          }>
        }
      }
      const rankedKeywords = parsed?.default?.rankedList?.[0]?.rankedKeyword ?? []
      return rankedKeywords.map((item) => ({
        source: 'trends',
        title: item.query,
        url: undefined,
      }))
    }

    const result: string = await googleTrends.dailyTrends({
      trendDate: new Date(),
      geo: 'US',
    })
    const parsed = JSON.parse(result) as {
      default?: {
        trendingSearchesDays?: Array<{
          trendingSearches?: Array<{
            title: { query: string }
            articles?: Array<{ url?: string }>
          }>
        }>
      }
    }
    const trendingSearches =
      parsed?.default?.trendingSearchesDays?.[0]?.trendingSearches ?? []
    return trendingSearches.map((item) => ({
      source: 'trends',
      title: item.title.query,
      url: item.articles?.[0]?.url,
    }))
  } catch (err) {
    console.error('[research/trends] Error fetching trends', err instanceof Error ? err.message : String(err))
    return []
  }
}
