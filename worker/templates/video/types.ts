export interface ShortFormVideoProps {
  /** Base64 data URL of a photorealistic background image (data:image/png;base64,...) */
  backgroundImageDataUrl?: string
}

export interface Caption {
  text: string
  startMs: number
  endMs: number
  timestampMs: number | null
  confidence: number | null
}

export interface CaptionedSlideshowProps {
  /** Array of 5 base64 data URLs (data:image/...;base64,...) */
  images: string[]
  /** MP3 audio as data URL (data:audio/mpeg;base64,...) */
  audioDataUrl: string
  /** Word-level caption timing array from ElevenLabs */
  captions: Caption[]
  /** Total duration: Math.ceil(durationSeconds * 30) */
  durationInFrames: number
}
