# Ace — standalone AI companion

A single self-contained HTML file. No build step, no dependencies, no server
required: open `index.html` in a browser and it runs. Everything (your name,
avatars, chats, API key) is stored in that browser's `localStorage` and never
leaves your device except for the messages you send to Anthropic.

Deployed with this repo it is served at `/ace/`.

## Connecting it to Claude

Ace needs an **Anthropic API key**. Two ways to supply one:

### Direct mode (default) — for a page you run for yourself

1. Get a key at <https://console.anthropic.com/settings/keys>.
2. Add a payment method and buy credits under **Billing**. API credits are
   separate from a Claude.ai Pro/Max subscription — a subscription alone will
   not work.
3. Paste the key (`sk-ant-api03-…`) into Settings → Connection → Save, then
   press **Test connection**.

The browser talks to `api.anthropic.com` directly, using the
`anthropic-dangerous-direct-browser-access: true` header that Anthropic
requires for browser-side calls. The key is readable by anyone who can use that
browser profile, so this mode is only appropriate for your own device.

### Proxy mode — required if other people will use the page

Never ship a page that carries your key to other people. Instead run the
bundled Netlify function, which keeps the key server-side:

1. Set `ANTHROPIC_API_KEY` in Netlify → Site settings → Environment variables.
2. Deploy. The function is at `netlify/functions/ace-chat.ts` and is routed to
   `/api/ace-chat` by `netlify.toml`.
3. In Settings → Connection choose **Through my own server** and enter
   `/api/ace-chat`.

Optionally set `ACE_ALLOWED_ORIGIN` to your site's origin to stop other sites
calling your proxy.

## Cost

Billed per token. Defaults to Claude Opus 5 at low effort; Sonnet 5 and
Haiku 4.5 are selectable in Settings and are cheaper. A typical short exchange
costs well under a cent. Set a monthly budget cap in the Anthropic console.
