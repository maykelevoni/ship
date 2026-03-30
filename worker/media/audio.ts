import fs from 'fs'
import path from 'path'
import { getSetting } from '../../lib/settings'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface Caption {
  text: string
  startMs: number
  endMs: number
  timestampMs: number | null
  confidence: number | null
}

export interface VoiceoverResult {
  audioPath: string
  audioDataUrl: string // data:audio/mpeg;base64,...
  captions: Caption[]
  durationSeconds: number
}

// ---------------------------------------------------------------------------
// ElevenLabs response shape
// ---------------------------------------------------------------------------

interface ElevenLabsResponse {
  audio_base64: string
  alignment: {
    characters: string[]
    character_start_times_seconds: number[]
    character_end_times_seconds: number[]
  }
}

// ---------------------------------------------------------------------------
// generateVoiceover
// ---------------------------------------------------------------------------

export async function generateVoiceover(params: {
  text: string
  outputPath: string
}): Promise<VoiceoverResult> {
  const { text, outputPath } = params

  // 1. Read API key — required
  const apiKey = await getSetting('elevenlabs_api_key')
  if (!apiKey) {
    throw new Error('elevenlabs_api_key not configured in Settings')
  }

  // 2. Read voice ID — default to Rachel if not set
  const voiceId =
    (await getSetting('elevenlabs_voice_id')) ?? '21m00Tcm4TlvDq8ikWAM'

  // 3. POST to ElevenLabs with-timestamps endpoint
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        output_format: 'mp3_44100_128',
      }),
    }
  )

  // 4. Throw on non-ok response
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `ElevenLabs TTS failed (${response.status}): ${errorText}`
    )
  }

  const data: ElevenLabsResponse = await response.json()
  const { audio_base64, alignment } = data
  const {
    characters,
    character_start_times_seconds,
    character_end_times_seconds,
  } = alignment

  // 5. Decode audio_base64 and write MP3 to outputPath
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, Buffer.from(audio_base64, 'base64'))

  // 6. Convert character alignment to word-level Caption[]
  const captions: Caption[] = []
  let wordChars: string[] = []
  let wordStart = 0

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i]

    if (char === ' ' || char === '') {
      // Flush accumulated word if any
      if (wordChars.length > 0) {
        const wordEnd = i - 1
        captions.push({
          text: wordChars.join(''),
          startMs: character_start_times_seconds[wordStart] * 1000,
          endMs: character_end_times_seconds[wordEnd] * 1000,
          timestampMs: null,
          confidence: null,
        })
        wordChars = []
      }
      // Reset wordStart to the character after this space
      wordStart = i + 1
    } else {
      if (wordChars.length === 0) {
        wordStart = i
      }
      wordChars.push(char)
    }
  }

  // Flush any remaining word at end of array
  if (wordChars.length > 0) {
    const wordEnd = characters.length - 1
    captions.push({
      text: wordChars.join(''),
      startMs: character_start_times_seconds[wordStart] * 1000,
      endMs: character_end_times_seconds[wordEnd] * 1000,
      timestampMs: null,
      confidence: null,
    })
  }

  // 7. Compute durationSeconds from last caption
  const durationSeconds =
    captions.length > 0 ? captions[captions.length - 1].endMs / 1000 : 0

  return {
    audioPath: outputPath,
    audioDataUrl: `data:audio/mpeg;base64,${audio_base64}`,
    captions,
    durationSeconds,
  }
}
