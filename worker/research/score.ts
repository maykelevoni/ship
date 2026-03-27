import { generateText } from '../../lib/ai'
import type { RawTopic, ScoredTopic } from './index'

interface ScoreEntry {
  index: number
  score: number
  rationale?: string
}

export async function scoreTopics(topics: RawTopic[], keyword?: string): Promise<ScoredTopic[]> {
  if (topics.length === 0) return []

  const topicList = topics
    .map((t, i) => `${i}. Title: ${t.title}\n   Summary: ${t.summary ?? '(no summary)'}`)
    .join('\n')

  const prompt = `Here is a list of trending topics:\n\n${topicList}\n\nReturn a JSON array where each element has: { "index": <number>, "score": <1-10>, "rationale": "<brief reason>" }. Score each topic from 1 to 10 based on virality potential and content creation potential. Return ONLY the JSON array with no extra text.`

  const keywordContext = keyword
    ? ` The user is researching the topic: '${keyword}'. Prioritize topics that are most relevant to this keyword.`
    : ''
  const system = `You are a content strategist scoring trending topics for social media and blog content potential.${keywordContext} Always respond with valid JSON only.`

  try {
    const result = await generateText(prompt, system)

    let parsed: ScoreEntry[] = []

    try {
      // Strip markdown code fences if present
      const cleaned = result.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      parsed = JSON.parse(cleaned) as ScoreEntry[]
    } catch {
      console.error('[research/score] Failed to parse AI response as JSON — using default scores')
    }

    const scoreMap = new Map<number, ScoreEntry>()
    for (const entry of parsed) {
      if (typeof entry.index === 'number' && typeof entry.score === 'number') {
        scoreMap.set(entry.index, entry)
      }
    }

    return topics.map((topic, i) => {
      const entry = scoreMap.get(i)
      return {
        ...topic,
        score: entry?.score ?? 5,
        rationale: entry?.rationale,
      }
    })
  } catch (err) {
    console.error('[research/score] AI scoring failed — using default scores', err instanceof Error ? err.message : String(err))
    return topics.map((topic) => ({ ...topic, score: 5 }))
  }
}
