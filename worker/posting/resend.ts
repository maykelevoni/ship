import { getSetting } from '../../lib/settings'

const RESEND_API_URL = 'https://api.resend.com'

async function getAuthHeader(): Promise<string> {
  const apiKey = await getSetting('resend_api_key')
  if (!apiKey) {
    throw new Error('resend_api_key is not configured in settings')
  }
  return `Bearer ${apiKey}`
}

export async function sendEmail(params: {
  subject: string
  body: string        // extracted from email content piece (after "BODY: " prefix)
  fromEmail?: string  // falls back to getSetting('resend_from_email')
}): Promise<{ id: string }> {
  const authHeader = await getAuthHeader()

  const fromEmail =
    params.fromEmail ?? (await getSetting('resend_from_email'))
  if (!fromEmail) {
    throw new Error('resend_from_email is not configured in settings')
  }

  const listId = await getSetting('resend_list_id')
  if (!listId) {
    throw new Error('resend_list_id is not configured in settings')
  }

  // Extract body text — strip "BODY: " prefix if present
  const bodyText = params.body.startsWith('BODY: ')
    ? params.body.slice('BODY: '.length)
    : params.body

  const broadcastPayload = {
    audience_id: listId,
    from: fromEmail,
    subject: params.subject,
    text: bodyText,
  }

  const response = await fetch(`${RESEND_API_URL}/broadcasts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(broadcastPayload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Resend broadcast failed (${response.status}): ${text}`)
  }

  const data = await response.json()

  // Send the broadcast immediately after creating it
  const broadcastId = data.id as string

  const sendResponse = await fetch(`${RESEND_API_URL}/broadcasts/${broadcastId}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
  })

  if (!sendResponse.ok) {
    const text = await sendResponse.text()
    throw new Error(`Resend broadcast send failed (${sendResponse.status}): ${text}`)
  }

  return { id: broadcastId }
}
