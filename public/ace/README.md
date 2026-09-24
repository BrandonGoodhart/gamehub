# Ace — standalone AI companion

A single self-contained HTML file (~760 KB). No build step, no dependencies,
no server required: open `index.html` in a browser and it runs.

The 89 character avatars share most of their markup, so they ship as a gzipped
table of unique SVG fragments plus one index list per avatar, unpacked in the
browser at startup via `DecompressionStream`. That is 670 KB rather than the
4.7 MB the same art costs inline — the file is about 7x smaller with identical
output. To regenerate the pack after changing the art, see
`tools/pack-avatars.py`. Everything (your name,
avatars, chats, API key) is stored in that browser's `localStorage` and never
leaves your device except for the messages you send to Anthropic.

Deployed with this repo it is served at `/ace/`.

## Connecting it

Ace speaks to two providers. Pick one in Settings → Connection.

### Google Gemini (default) — has a free tier

1. Get a key at <https://aistudio.google.com/apikey>.
2. Paste it into Settings → Connection → Save.
3. Press **Test connection**.

**If your `AQ.` key is rejected with a 401 (`ACCESS_TOKEN_TYPE_UNSUPPORTED`):**
Google refuses *unrestricted* keys in this newer format (a rule that took
effect 19 June 2026). On the API keys page, click the **Unrestricted** label
beside your key, choose **Add restrictions**, restrict it to the **Gemini
API**, and save. This is the most common cause and it is a Google-side rule,
not an app bug.

Google issues two key formats and Ace handles both. Newer keys start `AQ.` and
are sent as a bearer token; older `AIza` keys are sent as an API key. The
api-key path rejects an `AQ.` key with `ACCESS_TOKEN_TYPE_UNSUPPORTED`, so the
distinction matters — Ace picks the right one from the prefix, falls back to
the other if that fails, and remembers which worked.

Saving a key also pulls the model list straight from that key, so the dropdown
shows the models you can actually use rather than a hardcoded list that goes
stale. **Refresh list** re-pulls it.

Google AI Studio has a free tier, so this works without adding a card. Free
usage is rate limited.

### Anthropic (Claude) — paid

1. Get a key at <https://console.anthropic.com/settings/keys>.
2. Add a payment method and buy credits under **Billing**. API credits are
   separate from a Claude.ai Pro/Max subscription — a subscription alone will
   not work.
3. Paste the key (`sk-ant-api03-…`) and Save.

Keys are stored per provider, so switching back and forth does not lose them.
Paste a key with the other provider's prefix and Ace switches provider for you
rather than failing.

Either way the browser talks to the provider directly and the key is readable
by anyone who can use that browser profile, so direct mode only suits your own
device. Anthropic additionally requires the
`anthropic-dangerous-direct-browser-access: true` header for browser calls;
Gemini takes its key in the query string and needs no such header.

### Hosted mode — zero setup for visitors

When Ace is served from a site whose server holds a key, it detects that on
load and uses it: visitors never see a key prompt. Set `GEMINI_API_KEY` (or
`ANTHROPIC_API_KEY`) in the site's environment variables and deploy. The
function is `netlify/functions/ace-chat.mts`, served at `/api/ace-chat`.

`GET /api/ace-chat?selftest=1` makes the server call the provider and reports
exactly what came back. That is the definitive test of whether a key works,
because it takes the browser out of the question.

### Proxy mode — required if other people will use the page

Never ship a page that carries your key to other people. Instead run the
bundled Netlify function, which keeps the key server-side:

1. Set `GEMINI_API_KEY` and/or `ANTHROPIC_API_KEY` in Netlify → Site settings →
   Environment variables.
2. Deploy. The function is at `netlify/functions/ace-chat.ts` and is routed to
   `/api/ace-chat` by `netlify.toml`.
3. In Settings → Connection choose **Through my own server**, enter
   `/api/ace-chat`, and set **My server talks to** to match the key you
   configured.

Optionally set `ACE_ALLOWED_ORIGIN` to your site's origin to stop other sites
calling your proxy.

## Cost

Gemini's free tier costs nothing within its rate limits. Anthropic is billed
per token — Opus 5 is $5/$25 per million in/out, Sonnet 5 $2/$10, Haiku 4.5
$1/$5, so a short exchange is well under a cent. Set a monthly budget cap in
the Anthropic console.
