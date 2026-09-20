/**
 * Game Forge — the conversational half of the website builder.
 *
 * The browser owns the rendering: it turns a filled-in spec into the finished
 * single-file website. This function only does the part a model is good at —
 * reading what someone wrote, pulling every fact out of it, answering whatever
 * they asked, and working out what is still missing.
 *
 * It returns a strict JSON turn, never HTML, so a bad or surprising model
 * response can never produce a broken page.
 *
 * Provider is whichever key the site has: ANTHROPIC_API_KEY, else
 * GEMINI_API_KEY (already used by generate-questions). With neither, the
 * endpoint reports itself unavailable and the browser falls back to the
 * scripted interview, which works offline anyway.
 */
import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

const SITE_TYPES = [
  'business', 'menu', 'event', 'club', 'portfolio',
  'personal', 'classpage', 'project', 'resume', 'game',
] as const

const THEMES = ['calm', 'fresh', 'playful', 'elegant', 'bold', 'night'] as const

/** Every field is present and nullable: null means "still unknown". */
const TurnSchema = z.object({
  reply: z.string(),
  patch: z.object({
    type: z.enum(SITE_TYPES).nullable(),
    name: z.string().nullable(),
    tagline: z.string().nullable(),
    items: z.string().nullable(),
    contact: z.string().nullable(),
    more: z.string().nullable(),
    theme: z.enum(THEMES).nullable(),
    gamebrief: z.string().nullable(),
    gameshape: z.string().nullable(),
  }),
  ready: z.boolean(),
})

type Turn = z.infer<typeof TurnSchema>

const SYSTEM = `You are the interviewer for Game Forge, a tool that builds someone a
one-page website and hands them the finished file. You do the talking; separate code
does the building. Your job is to end up with enough detail to build a page worth having.

HOW YOU SOUND
Warm, brief, and plain. Short sentences. No corporate words, no exclamation marks, no
emoji, no markdown, no bullet lists. Two or three sentences is usually plenty. Talk like
a capable person helping a neighbour, not like a form.

THE ONE RULE THAT MATTERS MOST
Only ask for what you do not already know. Read every message for everything it contains.
If somebody writes "It's called Ridgeway Bakehouse, we do sourdough and cakes, ring us on
01234 567890", you have just learned the name, the items and the contact in one go — fill
all three in and ask about something else. Never ask a question whose answer is already in
the transcript or in KNOWN. Never re-ask a question they declined.

WHAT YOU ARE FILLING IN
- type: one of business, menu, event, club, portfolio, personal, classpage, project,
  resume, game. Infer it; do not interrogate. A bakery or cafe is "menu". A quiz or
  trivia game for a class is "game".
- name: what the thing is called. The one thing you must never invent.
- tagline: one line saying what it is.
- items: the main list for the page, comma separated. Menu dishes with prices, services,
  projects, links, running order — whatever suits the type. "Title: detail" pairs work.
- contact: email, phone, address, opening hours — however they want to be reached.
- more: an optional sentence or two for an about section, in their words.
- theme: one of calm, fresh, playful, elegant, bold, night. Infer from how they talk about
  it; only ask if nothing suggests one.
- For type "game" only: gamebrief (subject and year group, team count, timer) and
  gameshape (one of "buzzer quiz", "jeopardy points board categories", "bingo").

Set a field only when you actually know it. Leave it null otherwise. Repeat a field you
already knew only if this message changed it.

ANSWERING THEM
They will ask things mid-way — "why do you need that?", "what do you mean?", "like what?",
"can it do a shop?", "you pick". Answer properly, then carry on with your question in the
same reply. If they ask for examples, give two or three concrete ones that fit what they
have already told you, and say they can use one or write their own. If they say you pick,
write something sensible into the field yourself and tell them what you used — except for
the name, which must be theirs.

WHAT YOU MUST NOT DO
Never invent a fact about their business, their prices, their opening hours or their
history. Suggestions are fine when you label them as suggestions; quietly putting an
invented fact on someone's real website is not. If you draft wording for them, say so.

WHAT THE TOOL ACTUALLY DOES, so you can answer honestly
It builds one scrolling page, with a menu at the top that jumps between sections, and
gives it to them as a single .html file. That file works with no internet, opens in Safari
from the Files app on an iPhone or iPad, and can be emailed, AirDropped or uploaded to any
web host. It is free and needs no account. Nothing they type leaves their browser except
this conversation. The finished page has an "Edit text" button that lets them retype any
wording and save a fresh copy, so nothing is permanent.
It cannot: take payments or run a shop, upload photos (it draws coloured tiles with their
captions instead), send a contact form by itself (it uses a tappable email link, which
needs no server), or make several separate pages. Say so plainly when asked. Never promise
any of those.

WHEN TO STOP
Set ready true once you have type and name plus at least one of tagline, items or contact
— enough to build something worth looking at. Say in your reply that you are building it
now. If they ask you to build before then, and you have a name, build it. Getting a page
in front of them beats a perfect interview.`

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(statusCode: number, body: unknown): HandlerResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    body: JSON.stringify(body),
  }
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function activeProvider(): 'claude' | 'gemini' | null {
  if (process.env.ANTHROPIC_API_KEY) return 'claude'
  if (process.env.GEMINI_API_KEY) return 'gemini'
  return null
}

function userTurn(known: Record<string, unknown>) {
  return `KNOWN SO FAR (null means you still need it):\n${JSON.stringify(known, null, 2)}\n\nReply to the last message.`
}

async function askClaude(messages: ChatMessage[], known: Record<string, unknown>): Promise<Turn> {
  const client = new Anthropic()
  const response = await client.messages.parse({
    model: 'claude-opus-5',
    max_tokens: 4000,
    system: SYSTEM,
    // A chat turn is a short extract-and-reply task, and someone is waiting for
    // the answer, so buy latency rather than depth here.
    output_config: { effort: 'low', format: zodOutputFormat(TurnSchema) },
    messages: [...messages, { role: 'user' as const, content: userTurn(known) }],
  })
  if (!response.parsed_output) {
    throw new Error('Model did not return a usable turn')
  }
  return response.parsed_output
}

const GEMINI_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: { type: 'STRING' },
    patch: {
      type: 'OBJECT',
      properties: {
        type: { type: 'STRING', nullable: true, enum: [...SITE_TYPES] },
        name: { type: 'STRING', nullable: true },
        tagline: { type: 'STRING', nullable: true },
        items: { type: 'STRING', nullable: true },
        contact: { type: 'STRING', nullable: true },
        more: { type: 'STRING', nullable: true },
        theme: { type: 'STRING', nullable: true, enum: [...THEMES] },
        gamebrief: { type: 'STRING', nullable: true },
        gameshape: { type: 'STRING', nullable: true },
      },
    },
    ready: { type: 'BOOLEAN' },
  },
  required: ['reply', 'patch', 'ready'],
}

async function askGemini(messages: ChatMessage[], known: Record<string, unknown>): Promise<Turn> {
  const key = process.env.GEMINI_API_KEY as string
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' +
    encodeURIComponent(key)

  const contents = [...messages, { role: 'user' as const, content: userTurn(known) }].map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM }] },
      contents,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: GEMINI_SCHEMA,
        temperature: 0.4,
        maxOutputTokens: 2000,
      },
    }),
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Gemini error (${resp.status}): ${text.slice(0, 200)}`)
  }

  const data = (await resp.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content')
  return TurnSchema.parse(JSON.parse(text))
}

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' }
  }

  const provider = activeProvider()

  // A cheap probe so the browser can pick its mode without spending a call.
  if (event.httpMethod === 'GET') {
    return json(200, { ok: provider !== null, provider })
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }
  if (!provider) {
    return json(503, {
      error:
        'No model key configured. Add ANTHROPIC_API_KEY or GEMINI_API_KEY in Netlify → Site settings → Environment variables, then redeploy.',
    })
  }

  let body: { messages?: ChatMessage[]; known?: Record<string, unknown> }
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Body must be JSON' })
  }

  const messages = (body.messages || [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .slice(-30)
    .map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content.slice(0, 4000),
    }))

  if (!messages.length || messages[0].role !== 'user') {
    return json(400, { error: 'Need at least one user message to start' })
  }

  try {
    const turn = provider === 'claude'
      ? await askClaude(messages, body.known || {})
      : await askGemini(messages, body.known || {})
    return json(200, { ...turn, provider })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (err instanceof Anthropic.AuthenticationError) {
      return json(500, { error: 'ANTHROPIC_API_KEY was rejected. Check it in Netlify env vars.' })
    }
    if (err instanceof Anthropic.RateLimitError) {
      return json(429, { error: 'Rate limited. Try again in a moment.' })
    }
    return json(502, { error: message.slice(0, 300) })
  }
}
