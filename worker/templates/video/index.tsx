import React from 'react'
import { registerRoot, Composition } from 'remotion'
import { ShortFormVideo } from './short-form'
import { CaptionedSlideshow } from './captioned-slideshow'
import type { CaptionedSlideshowProps } from './types'

registerRoot(() => (
  <>
    <Composition
      id="ShortFormVideo"
      component={ShortFormVideo}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ hook: '', points: [], reveal: '', cta: '', url: '' }}
    />
    <Composition
      id="CaptionedSlideshow"
      component={CaptionedSlideshow}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        images: [],
        audioDataUrl: '',
        captions: [],
        durationInFrames: 900,
      } satisfies CaptionedSlideshowProps}
      calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames })}
    />
  </>
))
