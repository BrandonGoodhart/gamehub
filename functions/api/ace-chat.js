/**
 * Cloudflare Pages Function: server-side AI proxy for the Ace app.
 *
 * The Cloudflare twin of netlify/functions/ace-chat.mts. Either host works;
 * this one suits a domain whose DNS already lives in Cloudflare, because the
 * custom domain attaches without touching DNS records by hand.
 *
 * File location maps to the route: functions/api/ace-chat.js -> /api/ace-chat
 *
 * Set the key as an encrypted secret (it is never exposed to the browser):
 *   Workers & Pages -> your project -> Settings -> Variables and Secrets
 *     GEMINI_API_KEY     a Google AI Studio key ("AQ...." or "AIza...")
 *     ANTHROPIC_API_KEY  an Anthropic key ("sk-ant-...")
 * Secrets must be set before the deployment that uses them.
 *
 * Routes:
 *   GET                which providers this server can serve. No key exposed.
 *   GET ?selftest=1    calls the provider and reports exactly what it said —
 *                      the definitive check on whether a key works, with the
 *                      browser taken out of the question.
 *   POST               one chat turn, streamed straight back.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Models this server is willing to pay for, so a stray client cannot bill the
// owner for an arbitrary one.
const ALLOWED_ANTHROPIC = new Set(['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'])
const ALLOWED_GEMINI_PREFIX = /^gemini-[0-9]/

const MAX_TOKENS_CAP = 16000
const MAX_BODY_BYTES = 8 * 1024 * 1024

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

/** Same envelope the providers use, so the client explains it unchanged. */
const apiError = (status, message) => json(status, { error: { type: 'proxy_error', message } })

const keyFor = (env, provider) =>
  ((provider === 'gemini' ? env.GEMINI_API_KEY : env.ANTHROPIC_API_KEY) || '').trim()

const defaultModel = (env, provider) =>
  provider === 'gemini'
    ? env.ACE_GEMINI_MODEL || 'gemini-2.5-flash'
    : env.ACE_ANTHROPIC_MODEL || 'claude-sonnet-5'

/**
 * Google issues two key formats that authenticate differently: newer "AQ."
 * keys are bearer tokens and are refused on the API-key path with
 * ACCESS_TOKEN_TYPE_UNSUPPORTED, while older "AIza" keys are API keys. Using a
 * header for either also keeps the key out of URLs and request logs.
 */
const geminiHeaders = (apiKey) =>
  apiKey.startsWith('AQ.')
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
    : { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }

async function selfTest(env, provider) {
  const apiKey = keyFor(env, provider)
  const varName = provider === 'gemini' ? 'GEMINI_API_KEY' : 'ANTHROPIC_API_KEY'
  if (!apiKey) {
    return { provider, configured: false, ok: false, detail: `No ${varName} set on this server.` }
  }
  const model = defaultModel(env, provider)
  let res
  try {
    res =
      provider === 'gemini'
        ? await fetch(`${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent`, {
            method: 'POST',
            headers: geminiHeaders(apiKey),
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Reply with: ok' }] }],
              generationConfig: { maxOutputTokens: 16 },
            }),
          })
        : await fetch(ANTHROPIC_URL, {
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
  } catch (err) {
    return {
      provider,
      configured: true,
      ok: false,
      detail: `Could not reach the provider: ${err && err.message ? err.message : 'network error'}`,
    }
  }

  const text = await res.text()
  if (res.ok) {
    return { provider, configured: true, ok: true, model, detail: 'The provider accepted the key and replied.' }
  }
  // Surface the provider's own reason: it names the real problem and holds no secret.
  let detail = text.slice(0, 400)
  let reason = ''
  try {
    const parsed = JSON.parse(text)
    detail = (parsed.error && parsed.error.message) || detail
    const details = (parsed.error && parsed.error.details) || []
    reason = (details.find((d) => d && d.reason) || {}).reason || ''
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

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)

  if (request.method === 'GET') {
    const gemini = !!keyFor(env, 'gemini')
    const anthropic = !!keyFor(env, 'anthropic')
    if (url.searchParams.get('selftest')) {
      const checks = []
      if (gemini) checks.push(await selfTest(env, 'gemini'))
      if (anthropic) checks.push(await selfTest(env, 'anthropic'))
      if (!checks.length) {
        return json(200, {
          ok: false,
          providers: { gemini, anthropic },
          detail:
            'No provider key is set. Add GEMINI_API_KEY or ANTHROPIC_API_KEY under Settings -> Variables and Secrets, then redeploy.',
        })
      }
      return json(200, { ok: checks.some((c) => c.ok), checks })
    }
    // Capability probe: lets the client skip the key prompt entirely without
    // revealing anything about the key.
    return json(200, {
      ok: gemini || anthropic,
      providers: { gemini, anthropic },
      defaultProvider: gemini ? 'gemini' : anthropic ? 'anthropic' : null,
    })
  }

  if (request.method !== 'POST') return apiError(405, 'Method not allowed')

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return apiError(413, 'Request too large.')

  let body
  try {
    body = JSON.parse(raw || '{}')
  } catch {
    return apiError(400, 'Invalid JSON body')
  }

  const requested = body.provider === 'anthropic' ? 'anthropic' : 'gemini'
  // Fall back to whichever provider this server actually holds a key for.
  const provider = keyFor(env, requested)
    ? requested
    : keyFor(env, 'gemini')
      ? 'gemini'
      : 'anthropic'

  const apiKey = keyFor(env, provider)
  if (!apiKey) {
    return apiError(
      500,
      'This server has no provider key set. Add GEMINI_API_KEY or ANTHROPIC_API_KEY under Settings -> Variables and Secrets, then redeploy.',
    )
  }

  const streaming = body.stream === true
  let target
  let headers
  let payload

  if (provider === 'gemini') {
    if (!Array.isArray(body.contents) || body.contents.length === 0) {
      return apiError(400, 'contents must be a non-empty array')
    }
    const want = typeof body.model === 'string' ? body.model : ''
    const model = want && ALLOWED_GEMINI_PREFIX.test(want) ? want : defaultModel(env, 'gemini')
    const method = streaming ? 'streamGenerateContent' : 'generateContent'
    target = `${GEMINI_BASE}/${encodeURIComponent(model)}:${method}${streaming ? '?alt=sse' : ''}`
    headers = geminiHeaders(apiKey)
    payload = { contents: body.contents }
    if (body.system_instruction) payload.system_instruction = body.system_instruction
    const g = body.generationConfig || {}
    payload.generationConfig = {
      maxOutputTokens: Math.min(MAX_TOKENS_CAP, Math.max(1, Number(g.maxOutputTokens) || 8192)),
    }
  } else {
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return apiError(400, 'messages must be a non-empty array')
    }
    const want = typeof body.model === 'string' ? body.model : ''
    const model = ALLOWED_ANTHROPIC.has(want) ? want : defaultModel(env, 'anthropic')
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
    if (body.output_config && typeof body.output_config === 'object' && model !== 'claude-haiku-4-5') {
      const effort = body.output_config.effort
      if (effort === 'low' || effort === 'medium' || effort === 'high') {
        payload.output_config = { effort }
      }
    }
  }

  let upstream
  try {
    upstream = await fetch(target, { method: 'POST', headers, body: JSON.stringify(payload) })
  } catch (err) {
    return apiError(
      502,
      `Could not reach the ${provider} API: ${err && err.message ? err.message : 'network error'}`,
    )
  }

  // Hand the upstream body back as a stream so replies arrive token by token.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}
