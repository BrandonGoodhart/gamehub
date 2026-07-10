// Client helper for the Gemini-backed Netlify function.
// The function holds the API key; the browser only ever talks to our own endpoint.

const ENDPOINT = '/.netlify/functions/gemini'

export interface AiCard {
  player?: string
  year?: string
  set?: string
  cardNumber?: string
  variation?: string
  sport?: string
  searchTerm?: string
  confidence?: string
  notes?: string
}

export interface AiValue {
  lowUsd?: number
  highUsd?: number
  suggestedSearch?: string
  rationale?: string
}

interface Payload {
  mode: 'parse' | 'identify' | 'estimate'
  text?: string
  image?: { mimeType: string; data: string }
  card?: AiCard
}

async function call<T>(payload: Payload): Promise<T> {
  let resp: Response
  try {
    resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(
      'Could not reach the AI service. It runs on the deployed site (or `netlify dev`), not `vite dev`.',
    )
  }

  if (resp.status === 404) {
    throw new Error(
      'AI endpoint not found. It runs on the deployed Netlify site or via `netlify dev` locally.',
    )
  }

  const data = (await resp.json().catch(() => ({}))) as { result?: T; error?: string }
  if (!resp.ok) throw new Error(data.error || `Request failed (${resp.status})`)
  if (data.result === undefined) throw new Error('Empty response from AI service.')
  return data.result
}

export function parseCardText(text: string): Promise<AiCard> {
  return call<AiCard>({ mode: 'parse', text })
}

export function identifyCardImage(mimeType: string, base64: string): Promise<AiCard> {
  return call<AiCard>({ mode: 'identify', image: { mimeType, data: base64 } })
}

export function estimateValue(card: AiCard, text?: string): Promise<AiValue> {
  return call<AiValue>({ mode: 'estimate', card, text })
}

/** Read a File as base64 (without the data-URL prefix) for sending to the API. */
export function fileToBase64(file: File): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image file.'))
    reader.onload = () => {
      const result = String(reader.result)
      const comma = result.indexOf(',')
      resolve({ mimeType: file.type || 'image/jpeg', data: result.slice(comma + 1) })
    }
    reader.readAsDataURL(file)
  })
}
