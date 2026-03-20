export interface ShortFormVideoProps {
  hook: string          // 0-3s: punchy opening sentence
  points: string[]      // 3 points shown sequentially (3-15s)
  reveal: string        // product/offer reveal (15-25s)
  cta: string           // call to action (25-30s)
  url: string           // shown with CTA
  accentColor?: string  // default: '#6366f1'
  productName?: string
}
