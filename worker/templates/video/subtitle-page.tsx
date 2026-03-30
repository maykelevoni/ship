import React from 'react'
import { useCurrentFrame, useVideoConfig, spring } from 'remotion'
import type { Caption } from './types'
import { WordPage } from './word-page'

export const SubtitlePage: React.FC<{ captions: Caption[]; startFrame: number }> = ({
  captions,
  startFrame,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const localFrame = frame - startFrame

  const progress = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 200, mass: 0.5 },
    durationInFrames: 5,
  })

  const scale = 0.8 + 0.2 * progress
  const translateY = 50 * (1 - progress)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 350,
        left: '5%',
        width: '90%',
        textAlign: 'center',
        transform: `scale(${scale}) translateY(${translateY}px)`,
        transformOrigin: 'bottom center',
      }}
    >
      <WordPage captions={captions} />
    </div>
  )
}
