import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'

/**
 * Server-side proxy for the Ace companion app (public/ace/index.html).
 *
 * In "direct" mode Ace calls api.anthropic.com straight from the browser with
 * the visitor's own key. That is fine for a page you run for yourself, but the
 * key is readable by anyone using that browser — so it is never acceptable for
 * a page you host for other people.
 *
 * This function is the alternative: the key lives in the Netlify environment,
 * the browser never sees it. Point Ace's Settings → "Through my own server"
 * field at /api/ace-chat.
 *
 * Set ANTHROPIC_API_KEY in Netlify → Site settings → Environment variables.
 *
 * Note: a standard Netlify function buffers its response, so replies arrive in
 * one piece rather than token by token. The client parses the buffered SSE
 * body correctly either way — you just lose the typewriter effect.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

// Only models the app offers. Anything else is rejected so a stray client
// cannot bill the site owner for an arbitrary model.
const ALLOWED_MODELS = new Set([
  'claude-opus-5',
  'claude-sonnet-5',
  'claude-haiku-4-5',
])

const MAX_TOKENS_CAP = 16000
const MAX_BODY_BYTES = 8 * 1024 * 1024

/**
 * Restrict this to your own site once deployed, e.g.
 * ALLOWED_ORIGIN = 'https://your-site.netlify.app'. Left as '*' so the
 * function works the moment it is deployed; tighten it before you share it.
 */
const ALLOWED_ORIGIN = process.env.ACE_ALLOWED_ORIGIN || '*'

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function json(statusCode: number, body: unknown): HandlerResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    body: JSON.stringify(body),
  }
}

/** Mirrors the error envelope the Anthropic API uses, so the client's existing
 *  error handling works unchanged whether it talks to us or to Anthropic. */
function apiError(statusCode: number, message: string): HandlerResponse {
  return json(statusCode, { error: { type: 'proxy_error', message } })
}

interface ChatRequest {
  model?: unknown
  max_tokens?: unknown
  system?: unknown
  messages?: unknown
  stream?: unknown
  output_config?: unknown
}

export const handler: Handler = async (
  event: HandlerEvent,
): Promise<HandlerResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return apiError(405, 'Method not allowed')
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return apiError(
      500,
      'This server has no ANTHROPIC_API_KEY set. Add it in Netlify → Site settings → Environment variables, then redeploy.',
    )
  }

  const raw = event.body || '{}'
  if (raw.length > MAX_BODY_BYTES) {
    return apiError(413, 'Request too large.')
  }

  let body: ChatRequest
  try {
    body = JSON.parse(raw) as ChatRequest
  } catch {
    return apiError(400, 'Invalid JSON body')
  }

  const model = typeof body.model === 'string' ? body.model : ''
  if (!ALLOWED_MODELS.has(model)) {
    return apiError(400, `Model "${model}" is not enabled on this server.`)
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return apiError(400, 'messages must be a non-empty array')
  }

  const maxTokens = Math.min(
    MAX_TOKENS_CAP,
    Math.max(1, Number(body.max_tokens) || 4096),
  )

  // Rebuild the payload rather than forwarding it wholesale, so the client
  // cannot smuggle through parameters this server has not vetted.
  const payload: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages: body.messages,
  }
  if (typeof body.system === 'string' && body.system) payload.system = body.system
  if (body.stream === true) payload.stream = true
  if (
    body.output_config &&
    typeof body.output_config === 'object' &&
    model !== 'claude-haiku-4-5' // effort is not supported on Haiku 4.5
  ) {
    const effort = (body.output_config as { effort?: unknown }).effort
    if (effort === 'low' || effort === 'medium' || effort === 'high') {
      payload.output_config = { effort }
    }
  }

  let resp: Response
  try {
    resp = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error'
    return apiError(502, `Could not reach the Anthropic API: ${msg}`)
  }

  const contentType = resp.headers.get('content-type') || 'application/json'
  const text = await resp.text()

  // Pass the upstream status and body straight through — including the SSE
  // stream and Anthropic's own error messages, which the client already
  // knows how to explain.
  return {
    statusCode: resp.status,
    headers: { 'Content-Type': contentType, ...corsHeaders() },
    body: text,
  }
}
