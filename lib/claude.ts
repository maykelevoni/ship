import Anthropic from '@anthropic-ai/sdk'
import { getSetting } from './settings'

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 4096

async function getClient(): Promise<Anthropic> {
  const apiKey =
    process.env.ANTHROPIC_API_KEY || (await getSetting('anthropic_api_key')) || undefined
  return new Anthropic({ apiKey })
}

export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  const client = await getClient()

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: [{ role: 'user', content: prompt }],
  })

  const block = message.content[0]
  if (block.type !== 'text') {
    throw new Error(`Unexpected content block type: ${block.type}`)
  }
  return block.text
}
