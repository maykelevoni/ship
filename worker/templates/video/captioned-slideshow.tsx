import React from 'react'
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  continueRender,
  delayRender,
} from 'remotion'
import { createTikTokStyleCaptions } from '@remotion/captions'
import { CaptionedSlideshowProps } from './types'
import { SubtitlePage } from './subtitle-page'

// Module-level font loading
let fontHandle: ReturnType<typeof delayRender> | null = null
if (typeof window !== 'undefined') {
  fontHandle = delayRender('Loading Anton font')
  const fontFace = new FontFace('Anton', 'url(/fonts/Anton-Regular.ttf)')
  fontFace.load().then((loaded) => {
    document.fonts.add(loaded)
    if (fontHandle !== null) continueRender(fontHandle)
  }).catch(() => {
    if (fontHandle !== null) continueRender(fontHandle)
  })
}

export const CaptionedSlideshow: React.FC<CaptionedSlideshowProps> = ({
  images,
  audioDataUrl,
  captions,
  durationInFrames,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sectionFrames = Math.floor(durationInFrames / images.length)
  const crossfadeDuration = 15

  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: 1200,
  })

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Image sections */}
      {images.map((src, i) => {
        const from = i * sectionFrames
        const duration = i < images.length - 1 ? sectionFrames : durationInFrames - from
        const localFrame = frame - from

        // Ken Burns: scale 1 → 1.08 over the section duration
        const kenBurnsScale = 1 + (0.08 * Math.min(localFrame, sectionFrames) / sectionFrames)

        // Crossfade: opacity 0→1 over first 15 frames, 1→0 over last 15 frames
        let opacity = 1
        if (localFrame < crossfadeDuration) {
          opacity = localFrame / crossfadeDuration
        } else if (localFrame > sectionFrames - crossfadeDuration && i < images.length - 1) {
          opacity = (sectionFrames - localFrame) / crossfadeDuration
        }

        return (
          <Sequence key={i} from={from} durationInFrames={duration + crossfadeDuration}>
            <AbsoluteFill>
              <Img
                src={src}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `scale(${kenBurnsScale})`,
                  opacity,
                }}
              />
            </AbsoluteFill>
          </Sequence>
        )
      })}

      {/* Audio track */}
      <Audio src={audioDataUrl} />

      {/* Caption pages */}
      {pages.map((page, i) => {
        const startMs = page.startMs
        const endMs = page.startMs + page.durationMs
        const startFrame = Math.floor(startMs / 1000 * fps)
        const endFrame = Math.ceil(endMs / 1000 * fps)
        const pageCaptions = page.tokens.map((t) => ({
          text: t.text,
          startMs: t.fromMs,
          endMs: t.toMs,
          timestampMs: null,
          confidence: null,
        }))
        return (
          <Sequence key={i} from={startFrame} durationInFrames={endFrame - startFrame}>
            <SubtitlePage captions={pageCaptions} startFrame={startFrame} />
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}
