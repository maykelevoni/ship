import React from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { Caption } from './types'

export const WordPage: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const currentTimeMs = (frame / fps) * 1000

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0 12px',
        fontFamily: 'Anton, sans-serif',
        fontSize: 120,
        fontWeight: 'bold',
        WebkitTextStroke: '20px black',
        paintOrder: 'stroke fill',
      }}
    >
      {captions.map((caption, i) => {
        const isActive = currentTimeMs >= caption.startMs && currentTimeMs < caption.endMs
        return (
          <span
            key={i}
            style={{
              color: isActive ? '#39E508' : 'white',
              display: 'inline-block',
            }}
          >
            {caption.text.toUpperCase()}
          </span>
        )
      })}
    </div>
  )
}
