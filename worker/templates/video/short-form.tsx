import React from 'react'
import { AbsoluteFill, useCurrentFrame, interpolate, Img } from 'remotion'
import { ShortFormVideoProps } from './types'

export const ShortFormVideo: React.FC<ShortFormVideoProps> = ({ backgroundImageDataUrl }) => {
  const frame = useCurrentFrame()

  // Ken Burns slow zoom: 1× → 1.12× over 900 frames (30s at 30fps)
  const scale = interpolate(frame, [0, 900], [1, 1.12], { extrapolateRight: 'clamp' })

  if (!backgroundImageDataUrl) {
    return <AbsoluteFill style={{ backgroundColor: '#000000' }} />
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      <Img
        src={backgroundImageDataUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      />
    </AbsoluteFill>
  )
}
