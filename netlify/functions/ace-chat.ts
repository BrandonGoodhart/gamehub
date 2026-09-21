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
 * Set GEMINI_API_KEY and/or ANTHROPIC_API_KEY in Netlify → Site settings →
 * Environment variables. The client says which provider it formatted the
 * request for; this function only supplies the key and forwards.
 *
 * Note: a standard Netlify function buffers its response, so replies arrive in
 * one piece rather than token by token. The client parses the buffered SSE
 * body correctly either way — you just lose the typewriter effect.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Models the site owner is willing to pay for. A stray client cannot bill
// them for an arbitrary model. Gemini ids are matched by prefix because
// Google ships new point releases frequently.
const ALLOWED_ANTHROPIC = new Set([
  'claude-opus-5',
  'claude-sonnet-5',
  'claude-haiku-4-5',
])
const ALLOWED_GEMINI_PREFIX = /^gemini-[0-9]/

// Which model runs when the client leaves it to the server (proxy mode).
const DEFAULT_GEMINI_MODEL = process.env.ACE_GEMINI_MODEL || 'gemini-2.5-flash'
const DEFAULT_ANTHROPIC_MODEL =
  process.env.ACE_ANTHROPIC_MODEL || 'claude-sonnet-5'

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
  provider?: unknown
  model?: unknown
  system_instruction?: unknown
  contents?: unknown
  generationConfig?: unknown
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

  const provider = body.provider === 'anthropic' ? 'anthropic' : 'gemini'
  const streaming = body.stream === true

  const apiKey =
    provider === 'gemini'
      ? process.env.GEMINI_API_KEY
      : process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    const varName = provider === 'gemini' ? 'GEMINI_API_KEY' : 'ANTHROPIC_API_KEY'
    return apiError(
      500,
      `This server has no ${varName} set. Add it in Netlify → Site settings → Environment variables, then redeploy.`,
    )
  }

  let url: string
  let headers: Record<string, string>
  let payload: Record<string, unknown>

  if (provider === 'gemini') {
    // The client already built Gemini's request shape; validate and forward.
    if (!Array.isArray(body.contents) || body.contents.length === 0) {
      return apiError(400, 'contents must be a non-empty array')
    }
    const requested = typeof body.model === 'string' ? body.model : ''
    const model =
      requested && ALLOWED_GEMINI_PREFIX.test(requested)
        ? requested
        : DEFAULT_GEMINI_MODEL
    const method = streaming ? 'streamGenerateContent' : 'generateContent'
    url =
      `${GEMINI_BASE}/${encodeURIComponent(model)}:${method}` +
      (streaming ? '?alt=sse' : '')
    // Google issues two key formats and they authenticate differently: the
    // newer "AQ." keys are bearer tokens and are rejected on the API-key path
    // with ACCESS_TOKEN_TYPE_UNSUPPORTED; older "AIza" keys are API keys.
    // Sending it as a header also keeps the key out of URLs and logs.
    headers = apiKey.startsWith('AQ.')
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
      : { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }
    payload = { contents: body.contents }
    if (body.system_instruction) payload.system_instruction = body.system_instruction
    if (body.generationConfig && typeof body.generationConfig === 'object') {
      const g = body.generationConfig as { maxOutputTokens?: unknown }
      payload.generationConfig = {
        maxOutputTokens: Math.min(
          MAX_TOKENS_CAP,
          Math.max(1, Number(g.maxOutputTokens) || 8192),
        ),
      }
    }
  } else {
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return apiError(400, 'messages must be a non-empty array')
    }
    const requested = typeof body.model === 'string' ? body.model : ''
    const model = ALLOWED_ANTHROPIC.has(requested)
      ? requested
      : DEFAULT_ANTHROPIC_MODEL
    url = ANTHROPIC_URL
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }
    // Rebuild rather than forwarding wholesale, so the client cannot smuggle
    // through parameters this server has not vetted.
    payload = {
      model,
      max_tokens: Math.min(
        MAX_TOKENS_CAP,
        Math.max(1, Number(body.max_tokens) || 4096),
      ),
      messages: body.messages,
    }
    if (typeof body.system === 'string' && body.system) payload.system = body.system
    if (streaming) payload.stream = true
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
  }

  let resp: Response
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error'
    return apiError(502, `Could not reach the ${provider} API: ${msg}`)
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
