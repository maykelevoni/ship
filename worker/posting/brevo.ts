import { getSetting } from '../../lib/settings'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

export async function sendEmail(params: {
  subject: string
  body: string
  fromEmail?: string
  fromName?: string
  toEmail?: string
}): Promise<{ id: string }> {
  const apiKey = await getSetting('brevo_api_key')
  if (!apiKey) {
    throw new Error('brevo_api_key is not configured in settings')
  }

  const senderEmail =
    params.fromEmail ?? (await getSetting('brevo_sender_email'))
  if (!senderEmail) {
    throw new Error('brevo_sender_email is not configured in settings')
  }

  const senderName =
    params.fromName ?? (await getSetting('brevo_sender_name')) ?? 'PostForge'

  const toEmail =
    params.toEmail ?? (await getSetting('brevo_to_email'))
  if (!toEmail) {
    throw new Error('brevo_to_email is not configured in settings')
  }

  // Extract body text — strip "BODY: " prefix if present
  const bodyText = params.body.startsWith('BODY: ')
    ? params.body.slice('BODY: '.length)
    : params.body

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: toEmail }],
    subject: params.subject,
    textContent: bodyText,
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Brevo send failed (${response.status}): ${text}`)
  }

  const data = await response.json()

  return { id: data.messageId ?? 'sent' }
}
