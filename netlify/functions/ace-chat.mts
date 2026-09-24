import type { Config, Context } from '@netlify/functions'

/**
 * Server-side AI proxy for the Ace companion app (public/ace/index.html).
 *
 * Why this exists: in direct mode Ace calls the provider from the browser with
 * a key the visitor pasted in. That is fine for a page you run for yourself,
 * but the key is readable by anyone using that browser, so it can never be the
 * basis of a site other people visit. Here the key lives in the site's
 * environment and the browser never sees it.
 *
 * Set one of these in Netlify -> Project configuration -> Environment variables:
 *   GEMINI_API_KEY      a Google AI Studio key ("AQ...." or "AIza...")
 *   ANTHROPIC_API_KEY   an Anthropic key ("sk-ant-...")
 *
 * Endpoints (all at /api/ace-chat):
 *   GET                 which providers this server can serve. No key exposed.
 *   GET ?selftest=1     actually calls the provider and reports what happened.
 *                       This is the definitive answer to "is the key working",
 *                       because it removes the browser from the question.
 *   POST                a chat turn, streamed straight back to the client.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Models this server is willing to pay for, so a stray client cannot bill the
// owner for an arbitrary one. Gemini ids match by prefix because Google ships
// new point releases frequently.
const ALLOWED_ANTHROPIC = new Set([
  'claude-opus-5',
  'claude-sonnet-5',
  'claude-haiku-4-5',
])
const ALLOWED_GEMINI_PREFIX = /^gemini-[0-9]/

const MAX_TOKENS_CAP = 16000
const MAX_BODY_BYTES = 8 * 1024 * 1024

type Provider = 'gemini' | 'anthropic'

function env(name: string): string {
  // Netlify.env is the supported accessor inside functions.
  return (Netlify.env.get(name) || '').trim()
}

function keyFor(provider: Provider): string {
  return provider === 'gemini' ? env('GEMINI_API_KEY') : env('ANTHROPIC_API_KEY')
}

function defaultModel(provider: Provider): string {
  return provider === 'gemini'
    ? env('ACE_GEMINI_MODEL') || 'gemini-2.5-flash'
    : env('ACE_ANTHROPIC_MODEL') || 'claude-sonnet-5'
}

/**
 * Google issues two key formats and they authenticate differently: newer "AQ."
 * keys are bearer tokens and are refused on the API-key path with
 * ACCESS_TOKEN_TYPE_UNSUPPORTED, while older "AIza" keys are API keys. Sending
 * either as a header also keeps the key out of URLs and request logs.
 */
function geminiHeaders(apiKey: string): Record<string, string> {
  return apiKey.startsWith('AQ.')
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
    : { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

/** Same error envelope the providers use, so the client explains it unchanged. */
function apiError(status: number, message: string): Response {
  return json(status, { error: { type: 'proxy_error', message } })
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

/** Ask the provider for a token or two, purely to find out whether the stored
 *  key is accepted. Returns whatever the provider actually said. */
async function selfTest(provider: Provider) {
  const apiKey = keyFor(provider)
  if (!apiKey) {
    return {
      provider,
      configured: false,
      ok: false,
      detail: `No ${provider === 'gemini' ? 'GEMINI_API_KEY' : 'ANTHROPIC_API_KEY'} set on this server.`,
    }
  }
  const model = defaultModel(provider)
  let res: Response
  try {
    if (provider === 'gemini') {
      res = await fetch(
        `${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: geminiHeaders(apiKey),
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Reply with: ok' }] }],
            generationConfig: { maxOutputTokens: 16 },
          }),
        },
      )
    } else {
      res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 16,
          messages: [{ role: 'user', content: 'Reply with: ok' }],
        }),
      })
    }
  } catch (err) {
    return {
      provider,
      configured: true,
      ok: false,
      detail: `Could not reach the provider: ${err instanceof Error ? err.message : 'network error'}`,
    }
  }

  const text = await res.text()
  if (res.ok) {
    return { provider, configured: true, ok: true, model, detail: 'The provider accepted the key and replied.' }
  }
  // Surface the provider's own reason: it names the real problem, and it
  // contains no secret.
  let detail = text.slice(0, 400)
  let reason = ''
  try {
    const parsed = JSON.parse(text) as {
      error?: { message?: string; status?: string; details?: { reason?: string }[] }
    }
    detail = parsed.error?.message || detail
    reason = parsed.error?.details?.find((d) => d?.reason)?.reason || ''
  } catch {
    /* keep the raw text */
  }
  return {
    provider,
    configured: true,
    ok: false,
    model,
    status: res.status,
    reason,
    detail,
    hint:
      reason === 'ACCESS_TOKEN_TYPE_UNSUPPORTED'
        ? 'Google refuses unrestricted keys in the newer "AQ." format. On aistudio.google.com/apikey, click the Unrestricted label beside this key, choose Add restrictions, restrict it to the Gemini API, and save.'
        : undefined,
  }
}

export default async (req: Request, _context: Context): Promise<Response> => {
  const url = new URL(req.url)

  if (req.method === 'GET') {
    const gemini = !!keyFor('gemini')
    const anthropic = !!keyFor('anthropic')
    if (url.searchParams.get('selftest')) {
      const checks = []
      if (gemini) checks.push(await selfTest('gemini'))
      if (anthropic) checks.push(await selfTest('anthropic'))
      if (!checks.length) {
        return json(200, {
          ok: false,
          providers: { gemini, anthropic },
          detail:
            'No provider key is set on this server. Add GEMINI_API_KEY or ANTHROPIC_API_KEY in Netlify -> Project configuration -> Environment variables, then redeploy.',
        })
      }
      return json(200, { ok: checks.some((c) => c.ok), checks })
    }
    // Capability probe: lets the client offer a no-key experience when this
    // server can answer, without revealing anything about the key itself.
    return json(200, {
      ok: gemini || anthropic,
      providers: { gemini, anthropic },
      defaultProvider: gemini ? 'gemini' : anthropic ? 'anthropic' : null,
    })
  }

  if (req.method !== 'POST') {
    return apiError(405, 'Method not allowed')
  }

  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) return apiError(413, 'Request too large.')

  let body: ChatRequest
  try {
    body = JSON.parse(raw || '{}') as ChatRequest
  } catch {
    return apiError(400, 'Invalid JSON body')
  }

  const requestedProvider: Provider = body.provider === 'anthropic' ? 'anthropic' : 'gemini'
  // Fall back to whichever provider this server actually has a key for, so a
  // client asking for the wrong one still gets an answer.
  const provider: Provider = keyFor(requestedProvider)
    ? requestedProvider
    : keyFor('gemini')
      ? 'gemini'
      : 'anthropic'

  const apiKey = keyFor(provider)
  if (!apiKey) {
    return apiError(
      500,
      'This server has no provider key set. Add GEMINI_API_KEY or ANTHROPIC_API_KEY in Netlify -> Project configuration -> Environment variables, then redeploy.',
    )
  }

  const streaming = body.stream === true
  let target: string
  let headers: Record<string, string>
  let payload: Record<string, unknown>

  if (provider === 'gemini') {
    if (!Array.isArray(body.contents) || body.contents.length === 0) {
      return apiError(400, 'contents must be a non-empty array')
    }
    const requested = typeof body.model === 'string' ? body.model : ''
    const model =
      requested && ALLOWED_GEMINI_PREFIX.test(requested) ? requested : defaultModel('gemini')
    const method = streaming ? 'streamGenerateContent' : 'generateContent'
    target = `${GEMINI_BASE}/${encodeURIComponent(model)}:${method}${streaming ? '?alt=sse' : ''}`
    headers = geminiHeaders(apiKey)
    payload = { contents: body.contents }
    if (body.system_instruction) payload.system_instruction = body.system_instruction
    const g = (body.generationConfig || {}) as { maxOutputTokens?: unknown }
    payload.generationConfig = {
      maxOutputTokens: Math.min(MAX_TOKENS_CAP, Math.max(1, Number(g.maxOutputTokens) || 8192)),
    }
  } else {
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return apiError(400, 'messages must be a non-empty array')
    }
    const requested = typeof body.model === 'string' ? body.model : ''
    const model = ALLOWED_ANTHROPIC.has(requested) ? requested : defaultModel('anthropic')
    target = ANTHROPIC_URL
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }
    // Rebuilt rather than forwarded wholesale, so a client cannot smuggle
    // through parameters this server has not vetted.
    payload = {
      model,
      max_tokens: Math.min(MAX_TOKENS_CAP, Math.max(1, Number(body.max_tokens) || 4096)),
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

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error'
    return apiError(502, `Could not reach the ${provider} API: ${msg}`)
  }

  // Hand the upstream body straight back. Returning the stream (rather than
  // buffering it into a string) is what keeps replies arriving token by token.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

export const config: Config = {
  path: '/api/ace-chat',
}
