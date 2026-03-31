import { db } from '../../lib/db'
import { getSetting } from '../../lib/settings'
import { fetchYoutubeTrending } from './youtube'
import { fetchRedditHot } from './reddit'
import { fetchNewsApiHeadlines } from './news'
import { fetchHackerNewsTop } from './hackernews'
import { fetchGoogleTrends } from './trends'
import { scoreTopics } from './score'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface RawTopic {
  source: string
  title: string
  url?: string
  summary?: string
}

export interface ScoredTopic extends RawTopic {
  score: number
  rationale?: string
}

// ---------------------------------------------------------------------------
// Logger helper (mirrors worker/engine/run.ts pattern)
// ---------------------------------------------------------------------------

function makeLogger() {
  let log = ''
  return {
    info(msg: string) {
      const line = `[${new Date().toISOString()}] ${msg}`
      console.log(line)
      log += line + '\n'
    },
    error(msg: string, err?: unknown) {
      const detail = err instanceof Error ? err.message : String(err ?? '')
      const line = `[${new Date().toISOString()}] ERROR: ${msg}${detail ? ` — ${detail}` : ''}`
      console.error(line)
      log += line + '\n'
    },
    get text() {
      return log
    },
  }
}

// ---------------------------------------------------------------------------
// Main research runner
// ---------------------------------------------------------------------------

export async function runResearch(keyword?: string): Promise<void> {
  const logger = makeLogger()
  logger.info('Research worker started')

  // Read settings
  const [youtubeApiKey, newsapiKey, subreddits, youtubeRegion, newsCategories] = await Promise.all([
    getSetting('youtube_api_key'),
    getSetting('newsapi_key'),
    getSetting('research_subreddits'),
    getSetting('research_youtube_region'),
    getSetting('research_news_categories'),
  ])

  logger.info(`Settings loaded — subreddits: ${subreddits ?? '(default)'}, youtube region: ${youtubeRegion ?? 'US'}, news categories: ${newsCategories ?? '(default)'}`)

  // Fetch all sources in parallel
  const [youtubeResults, redditResults, newsResults, hackernewsResults, trendsResults] = await Promise.allSettled([
    fetchYoutubeTrending(youtubeApiKey ?? '', youtubeRegion ?? 'US', keyword),
    fetchRedditHot(subreddits ?? 'entrepreneur,marketing,smallbusiness,SaaS', keyword),
    fetchNewsApiHeadlines(newsapiKey ?? '', newsCategories ?? 'business,technology', keyword),
    fetchHackerNewsTop(keyword),
    fetchGoogleTrends(keyword),
  ])

  const allTopics: RawTopic[] = [
    ...(youtubeResults.status === 'fulfilled' ? youtubeResults.value : []),
    ...(redditResults.status === 'fulfilled' ? redditResults.value : []),
    ...(newsResults.status === 'fulfilled' ? newsResults.value : []),
    ...(hackernewsResults.status === 'fulfilled' ? hackernewsResults.value : []),
    ...(trendsResults.status === 'fulfilled' ? trendsResults.value : []),
  ]

  logger.info(`Fetched ${allTopics.length} raw topics (youtube: ${youtubeResults.status === 'fulfilled' ? youtubeResults.value.length : 0}, reddit: ${redditResults.status === 'fulfilled' ? redditResults.value.length : 0}, news: ${newsResults.status === 'fulfilled' ? newsResults.value.length : 0}, hackernews: ${hackernewsResults.status === 'fulfilled' ? hackernewsResults.value.length : 0}, trends: ${trendsResults.status === 'fulfilled' ? trendsResults.value.length : 0})`)

  // Deduplicate by title (case-insensitive)
  const seen = new Set<string>()
  const deduplicated = allTopics.filter((topic) => {
    const key = topic.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  logger.info(`After deduplication: ${deduplicated.length} unique topics`)

  if (deduplicated.length === 0) {
    logger.info('No topics to score or save — research run complete')
    return
  }

  // Score all topics with AI
  logger.info('Scoring topics with AI…')
  const scored = await scoreTopics(deduplicated, keyword)
  logger.info(`Scored ${scored.length} topics`)

  // Today at midnight UTC (idempotent date key)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Delete existing rows for today (idempotent refresh)
  const deleted = await db.researchTopic.deleteMany({
    where: { date: today },
  })
  logger.info(`Deleted ${deleted.count} existing ResearchTopic rows for today`)

  // Save all scored topics
  await db.researchTopic.createMany({
    data: scored.map((topic) => ({
      date: today,
      source: topic.source,
      title: topic.title,
      url: topic.url ?? null,
      summary: topic.summary ?? null,
      score: Math.round(Math.min(10, Math.max(1, topic.score))),
      rationale: topic.rationale ?? null,
    })),
  })

  logger.info(`Saved ${scored.length} ResearchTopic rows for ${today.toISOString().slice(0, 10)}`)
  logger.info('Research worker completed')
}
