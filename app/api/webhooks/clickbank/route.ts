import { NextRequest } from 'next/server'
import { PostHog } from 'posthog-node'
import { getSetting } from '@/lib/settings'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Optionally verify ClickBank signature if secret key is configured
    const secretKey = await getSetting('clickbank_secret_key')
    if (secretKey) {
      const signature = req.headers.get('x-clickbank-signature')
      if (!signature) {
        console.warn('[clickbank webhook] Missing x-clickbank-signature header; skipping verification')
      } else {
        const crypto = await import('crypto')
        const expected = crypto
          .createHmac('sha256', secretKey)
          .update(JSON.stringify(body))
          .digest('base64')
        if (signature !== expected) {
          console.warn('[clickbank webhook] Signature mismatch; ignoring event')
          return Response.json({ ok: true }, { status: 200 })
        }
      }
    }

    const { receipt, lineItems, vendor, affiliate } = body as {
      receipt?: string
      lineItems?: Array<{ productTitle?: string; amount?: number }>
      vendor?: string
      affiliate?: string
    }

    const firstItem = lineItems?.[0]
    const amount = firstItem?.amount ?? 0
    const productTitle = firstItem?.productTitle ?? ''

    const client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    })

    await client.capture({
      distinctId: 'system',
      event: 'sale',
      properties: {
        platform: 'clickbank',
        orderId: receipt,
        amount,
        productTitle,
        vendor,
        affiliate,
      },
    })

    await client.shutdown()
  } catch (err) {
    console.error('[clickbank webhook] Error:', err)
  }

  return Response.json({ ok: true }, { status: 200 })
}
