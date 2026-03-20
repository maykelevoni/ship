import React from 'react'
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion'
import { ShortFormVideoProps } from './types'

const FONT_FAMILY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const DEFAULT_ACCENT = '#6366f1'

// Segment boundaries (frames at 30fps)
const HOOK_START = 0
const HOOK_END = 90       // 0–3s
const POINTS_START = 90
const POINTS_END = 450    // 3–15s (3 points × 120 frames each)
const REVEAL_START = 450
const REVEAL_END = 750    // 15–25s
const CTA_START = 750
const CTA_END = 900       // 25–30s

// ── Hook Segment (0–90f) ──────────────────────────────────────────────────────

const HookSegment: React.FC<{ hook: string; accentColor: string; frame: number }> = ({
  hook,
  accentColor,
  frame,
}) => {
  const { fps } = useVideoConfig()

  const slideUp = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  })

  const textY = interpolate(slideUp, [0, 1], [80, 0])
  const textOpacity = interpolate(slideUp, [0, 1], [0, 1])

  const underlineProgress = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.6 },
  })
  const underlineWidth = interpolate(underlineProgress, [0, 1], [0, 100])

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 80px',
      }}
    >
      <div
        style={{
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 72,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.15,
            margin: 0,
            letterSpacing: '-1px',
          }}
        >
          {hook}
        </p>
        <div
          style={{
            marginTop: 20,
            height: 6,
            width: `${underlineWidth}%`,
            backgroundColor: accentColor,
            borderRadius: 3,
            margin: '20px auto 0',
          }}
        />
      </div>
    </AbsoluteFill>
  )
}

// ── Key Points Segment (90–450f) ──────────────────────────────────────────────

const POINT_DURATION = 120 // 4 seconds per point

const ProgressDots: React.FC<{ activeIndex: number; accentColor: string }> = ({
  activeIndex,
  accentColor,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'row',
      gap: 16,
      justifyContent: 'center',
    }}
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: i === activeIndex ? accentColor : 'rgba(255,255,255,0.3)',
          transition: 'background-color 0.3s',
        }}
      />
    ))}
  </div>
)

const KeyPointsSegment: React.FC<{
  points: string[]
  accentColor: string
  frame: number
}> = ({ points, accentColor, frame }) => {
  const { fps } = useVideoConfig()
  const localFrame = frame - POINTS_START
  const activeIndex = Math.min(Math.floor(localFrame / POINT_DURATION), 2)
  const pointFrame = localFrame - activeIndex * POINT_DURATION

  const slideIn = spring({
    frame: pointFrame,
    fps,
    config: { damping: 16, stiffness: 130, mass: 0.7 },
  })

  const textX = interpolate(slideIn, [0, 1], [120, 0])
  const textOpacity = interpolate(slideIn, [0, 1], [0, 1])

  const pointLabel = String(activeIndex + 1).padStart(2, '0')
  const pointText = points[activeIndex] ?? ''

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 80px',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          width: '100%',
          transform: `translateX(${textX}px)`,
          opacity: textOpacity,
        }}
      >
        <p
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 48,
            fontWeight: 900,
            color: accentColor,
            margin: '0 0 24px',
            lineHeight: 1,
          }}
        >
          {pointLabel}
        </p>
        <p
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 52,
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {pointText}
        </p>
      </div>
      <div style={{ paddingBottom: 120 }}>
        <ProgressDots activeIndex={activeIndex} accentColor={accentColor} />
      </div>
    </AbsoluteFill>
  )
}

// ── Reveal Segment (450–750f) ─────────────────────────────────────────────────

const RevealSegment: React.FC<{
  productName?: string
  reveal: string
  accentColor: string
  frame: number
}> = ({ productName, reveal, accentColor, frame }) => {
  const { fps } = useVideoConfig()
  const localFrame = frame - REVEAL_START

  const scaleIn = spring({
    frame: localFrame,
    fps,
    config: { damping: 18, stiffness: 100, mass: 1 },
  })

  const scale = interpolate(scaleIn, [0, 1], [0.85, 1])
  const opacity = interpolate(scaleIn, [0, 1], [0, 1])

  // Hex to rgba helper for tinted gradient
  const hexR = parseInt(accentColor.slice(1, 3), 16)
  const hexG = parseInt(accentColor.slice(3, 5), 16)
  const hexB = parseInt(accentColor.slice(5, 7), 16)

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, #0a0a0a 0%, rgba(${hexR},${hexG},${hexB},0.18) 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 80px',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          textAlign: 'center',
        }}
      >
        {productName && (
          <p
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: 48,
              fontWeight: 800,
              color: accentColor,
              margin: '0 0 32px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {productName}
          </p>
        )}
        <p
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 52,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.25,
            margin: 0,
          }}
        >
          {reveal}
        </p>
      </div>
    </AbsoluteFill>
  )
}

// ── CTA Segment (750–900f) ────────────────────────────────────────────────────

const CTASegment: React.FC<{
  cta: string
  url: string
  accentColor: string
  frame: number
}> = ({ cta, url, accentColor, frame }) => {
  const { fps } = useVideoConfig()
  const localFrame = frame - CTA_START

  const appear = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 110, mass: 0.9 },
  })

  const textOpacity = interpolate(appear, [0, 1], [0, 1])
  const textY = interpolate(appear, [0, 1], [40, 0])

  // Pulsing circle: oscillate scale using sin wave
  const pulseProgress = (localFrame % 60) / 60
  const pulseScale = 1 + 0.06 * Math.sin(pulseProgress * Math.PI * 2)

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 80px',
        flexDirection: 'column',
      }}
    >
      {/* Pulsing background circle */}
      <div
        style={{
          position: 'absolute',
          width: 560,
          height: 560,
          borderRadius: '50%',
          backgroundColor: accentColor,
          opacity: 0.08,
          transform: `scale(${pulseScale})`,
        }}
      />

      {/* CTA text */}
      <div
        style={{
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        <p
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 64,
            fontWeight: 900,
            color: '#ffffff',
            margin: '0 0 32px',
            lineHeight: 1.15,
            letterSpacing: '-0.5px',
          }}
        >
          {cta}
        </p>
        <p
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 36,
            fontWeight: 600,
            color: accentColor,
            margin: 0,
            letterSpacing: '0.25px',
          }}
        >
          {url}
        </p>
      </div>
    </AbsoluteFill>
  )
}

// ── Main Composition ──────────────────────────────────────────────────────────

export const ShortFormVideo: React.FC<ShortFormVideoProps> = (props) => {
  const {
    hook,
    points,
    reveal,
    cta,
    url,
    accentColor = DEFAULT_ACCENT,
    productName,
  } = props

  const frame = useCurrentFrame()

  const isHook = frame >= HOOK_START && frame < HOOK_END
  const isPoints = frame >= POINTS_START && frame < POINTS_END
  const isReveal = frame >= REVEAL_START && frame < REVEAL_END
  const isCTA = frame >= CTA_START && frame < CTA_END

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {isHook && (
        <HookSegment hook={hook} accentColor={accentColor} frame={frame} />
      )}
      {isPoints && (
        <KeyPointsSegment points={points} accentColor={accentColor} frame={frame} />
      )}
      {isReveal && (
        <RevealSegment
          productName={productName}
          reveal={reveal}
          accentColor={accentColor}
          frame={frame}
        />
      )}
      {isCTA && (
        <CTASegment cta={cta} url={url} accentColor={accentColor} frame={frame} />
      )}
    </AbsoluteFill>
  )
}
