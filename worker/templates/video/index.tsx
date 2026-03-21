import React from 'react'
import { registerRoot, Composition } from 'remotion'
import { ShortFormVideo } from './short-form'

registerRoot(() => (
  <Composition
    id="ShortFormVideo"
    component={ShortFormVideo}
    durationInFrames={900}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ hook: '', points: [], reveal: '', cta: '', url: '' }}
  />
))
