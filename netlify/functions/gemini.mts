// Netlify Function (v2) — a secure proxy to Google Gemini.
//
// The API key lives ONLY here, server-side, read from the GEMINI_API_KEY
// environment variable (set it in the Netlify dashboard under
// Site settings → Environment variables). Browsers never see it.
//
// Handles three modes:
//   - "parse"    : free-text card description  -> structured card fields
//   - "identify" : a photo of a card           -> structured card fields
//   - "estimate" : structured card             -> rough value range

const MODEL = 'gemini-2.5-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

// Gemini responseSchema uses the OpenAPI subset (types in UPPERCASE).
const CARD_SCHEMA = {
  type: 'OBJECT',
  properties: {
    player: { type: 'STRING', description: 'Athlete / subject on the card' },
    year: { type: 'STRING', description: 'Copyright/season year, e.g. 2018' },
    set: { type: 'STRING', description: 'Set / product, e.g. Topps Chrome' },
    cardNumber: { type: 'STRING', description: 'Card number, e.g. 150' },
    variation: { type: 'STRING', description: 'Parallel/insert/variation, e.g. Refractor, Prizm Silver' },
    sport: { type: 'STRING', description: 'e.g. Baseball, Basketball, Football' },
    searchTerm: {
      type: 'STRING',
      description: 'The single best marketplace search phrase to find this exact card',
    },
    confidence: { type: 'STRING', description: 'low, medium, or high' },
    notes: { type: 'STRING', description: 'Any caveats or extra detail, one short sentence' },
  },
  required: ['searchTerm', 'confidence'],
}

const VALUE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    lowUsd: { type: 'NUMBER', description: 'Low end of a typical recent sale range, USD' },
    highUsd: { type: 'NUMBER', description: 'High end of a typical recent sale range, USD' },
    suggestedSearch: { type: 'STRING', description: 'Best phrase to pull real sold comps' },
    rationale: { type: 'STRING', description: 'One or two sentences on the estimate' },
  },
  required: ['lowUsd', 'highUsd', 'rationale'],
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

interface RequestBody {
  mode?: 'parse' | 'identify' | 'estimate'
  text?: string
  image?: { mimeType?: string; data?: string }
  card?: Record<string, unknown>
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return json(
      { error: 'AI isn’t configured yet. Set GEMINI_API_KEY in your Netlify environment variables.' },
      503,
    )
  }

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { mode } = body
  const parts: Array<Record<string, unknown>> = []
  let schema: unknown

  if (mode === 'parse') {
    if (!body.text?.trim()) return json({ error: 'Missing card description' }, 400)
    schema = CARD_SCHEMA
    parts.push({
      text:
        'You are an expert sports-card cataloguer. From the description below, extract the ' +
        'structured card details and the single best marketplace search phrase to find this ' +
        'exact card. If a field is unknown, leave it empty. Description:\n\n' +
        body.text.trim(),
    })
  } else if (mode === 'identify') {
    if (!body.image?.data || !body.image.mimeType) return json({ error: 'Missing image' }, 400)
    schema = CARD_SCHEMA
    parts.push({
      text:
        'Identify this sports trading card from the photo. Read the player name, year, set/brand, ' +
        'card number, and any parallel or variation. Then give the single best marketplace search ' +
        'phrase to find this exact card. If something is not legible, leave that field empty.',
    })
    parts.push({ inline_data: { mime_type: body.image.mimeType, data: body.image.data } })
  } else if (mode === 'estimate') {
    const card = body.card ?? {}
    const desc = body.text?.trim() || JSON.stringify(card)
    schema = VALUE_SCHEMA
    parts.push({
      text:
        'Give a rough ballpark value range (USD) for this raw/ungraded sports card based on ' +
        'general market knowledge. This is an estimate, not live pricing — be conservative and ' +
        'explain briefly. Also suggest the best phrase to pull real sold comps. Card:\n\n' +
        desc,
    })
  } else {
    return json({ error: 'Unknown mode. Use parse, identify, or estimate.' }, 400)
  }

  let geminiResp: Response
  try {
    geminiResp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.2,
        },
      }),
    })
  } catch (err) {
    return json({ error: 'Could not reach Gemini', detail: String(err) }, 502)
  }

  if (!geminiResp.ok) {
    const detail = await geminiResp.text().catch(() => '')
    return json({ error: `Gemini request failed (${geminiResp.status})`, detail }, 502)
  }

  const data = (await geminiResp.json().catch(() => null)) as
    | { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    | null
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) return json({ error: 'Empty AI response' }, 502)

  let result: unknown
  try {
    result = JSON.parse(raw)
  } catch {
    return json({ error: 'Could not parse AI response', detail: raw }, 502)
  }

  return json({ result })
}
