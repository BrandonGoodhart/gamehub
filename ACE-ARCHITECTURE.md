# Ace — architecture

How the code is laid out and why. Read `ACE-TROUBLESHOOTING.md` alongside this
if you are touching anything to do with API keys or the artifact runtime.

## File map

| Path | Role |
| --- | --- |
| `public/ace/index.html` | **The whole app.** HTML + CSS + JS + compressed art in one file. Source of truth. |
| `docs/index.html` | Byte-identical copy, so GitHub Pages can serve `/docs`. Refresh with `cp` when the app changes. |
| `docs/CNAME` | `theacechat.com`, for GitHub Pages. |
| `netlify/functions/ace-chat.mts` | Netlify server proxy holding the API key. Modern function format, streams. |
| `functions/api/ace-chat.js` | The Cloudflare Pages twin of the same proxy. |
| `netlify.toml` | Host rules routing `theacechat.com` to the app at its root, `/api/*` excluded. |
| `tools/pack-avatars.py` | Rebuilds the compressed avatar pack. Refuses to emit one that does not round-trip. |
| `public/ace/README.md` | User-facing readme. |

Vite copies `public/` verbatim, so `bun run build` emits `dist/ace/index.html`.
A Cloudflare Pages project with build output `dist/ace` therefore serves the
app at the domain root.

## The single file, in order

1. **`<style>`** — CSS custom properties define five themes (`light`, `dark`,
   `ocean`, `forest`, `rose`) on `[data-theme]`. Everything else references the
   tokens, so adding a theme is one block. Honours
   `prefers-reduced-motion`.
2. **Markup** — six `.screen` elements (`loading`, `welcome`, `name-screen`,
   `avatar-screen`, `chat`, `settings`) plus the sidebar, a modal, a toast
   host, and `#measure` (an offscreen, `visibility:hidden` box used for SVG
   measurement — it must stay in the render tree or `getBBox()` returns zeros).
3. **`AVATAR_PACK`** — one base64 string, the compressed art.
4. **The script** — sections marked with banner comments, in this order:
   configuration, state, avatar engine, Markdown, screens, onboarding, chat
   shell, transcript, connection, sending, attachments, settings, diagnostics,
   wiring.

`bind()` at the end attaches every listener. There are **no inline `onclick`
attributes** — the original had them; they were removed so nothing depends on
globals.

## Avatar engine

This is the subtlest part. The supplied art had four defects, all fixed here:

1. **No viewBox.** The SVGs declare `width/height 300` but their geometry spans
   ~1000 units, so they rendered as a cropped corner. `measure()` runs
   `getBBox()` once per style, caches it, and `setCrop()` writes a viewBox —
   either the full body or a head crop.
2. **Colliding ids.** Every file reuses `reuse-0..14` and `a`. With two avatars
   inlined, the second one's `<use>` and `url(#a)` resolved against the first.
   `buildSvg()` namespaces every id per instance (`id="x"` → `id="x-i7"`), and
   a single regex on `href="#..."` covers both `href` and `xlink:href`.
3. **Unpainted groups.** `.c2` (hair) and `.c6` (shoes) were never recoloured,
   so everyone had grey hair and white shoes. `.customDrawFill` was left white,
   painting a band across the lower face. `RECOLOR` maps each group to a
   setting; skin/top/bottom/shoes target `#fff`, hair targets the grey
   `#c2c3bd` placeholder, so the two passes cannot collide.
4. **No faces.** The art ships a blank `customDraw` layer — it expects the host
   app to draw the features, which is why stock avatars had no eyes or mouth.
   `drawFace()` draws eyes, brows (in the hair colour), a nose and a mouth,
   anchored to the measured skull box. **The skull is at the same coordinates
   in all 89 styles** (x 84.9, y 52.5, w 130.3, h 158.4), so the proportions
   are reliable; only the hair differs.

The head crop anchors on the skull, not on `.head`, because `.head` grows with
the hair and would zoom out on big styles.

### The compressed pack

The 89 SVGs share ~60% of their markup. Storing them inline cost 4.65 MB. They
now ship as:

```json
{"d": "<unique fragments joined by \u0001>", "r": ["<base36 indices>", ...]}
```

gzipped and base64'd — 670 KB. `loadAvatarPack()` decodes it at startup with
`DecompressionStream('gzip')`; `avatarSvg(key)` rejoins the fragments with
`'><'` on first use and caches the result. All 89 rebuild **byte-identical**
to the original (4,719,198 characters total), asserted by the packer and
verified in the browser.

To change the art: rebuild with `tools/pack-avatars.py` against a build that
still has the inline `const AVATARS={...}`, and paste the output as
`AVATAR_PACK`.

## Providers

Three ways to reach a model, chosen by `S.provider`:

| `S.provider` | Transport | Key |
| --- | --- | --- |
| `claude` | `claude.use('sample')` — the artifact runtime | none |
| `gemini` / `anthropic` | direct `fetch` from the browser | the user's, in `localStorage` |
| `proxy` | POST to your own server | the server's |

`wire()` resolves which wire format to speak — in proxy mode that is
`S.proxyProvider`, since the transport is your server but the payload must
still match whatever it forwards to.

Keys are stored **per provider** (`S.keys`), so switching does not lose them.

### Gemini's two key formats

Google is migrating AI Studio keys from `AIza` to `AQ.`, and they authenticate
differently:

- `AIza...` → `x-goog-api-key` header
- `AQ....` → `Authorization: Bearer`

Sending an `AQ.` key the API-key way returns `401
ACCESS_TOKEN_TYPE_UNSUPPORTED`. `apiFetch()` picks the transport from the
prefix, falls back to the other on the auth-specific reason codes, and caches
whichever worked in `S.geminiAuth`. Both headers are CORS-allowed by Google
(verified by preflight). The key travels in a header, never the query string,
to keep it out of URLs and logs.

### The keyless path

Inside a Claude artifact the page has **no outbound network at all**, so no key
can work. `initSample()` resolves `claude.use('sample')`; if present, that
provider is selected automatically and the option is shown. Notes:

- There is no system role — standing instructions ride as a **leading user
  turn**, and the list must start *and* end on a user turn.
- `sampleTurns()` trims from the oldest exchange to stay under 64 KiB, never
  dropping the instructions turn.
- `cache: false` on every call, or a repeated question replays a stale answer.
- Model choice becomes the speed tier: `quick` / `default` / `complex`.
- Publishing requires `capabilities: {sample: {}, downloads: true}`.

### Streaming

Every backend reports **the whole text so far**, not deltas — `replyStream()`
dispatches and both paths call `setText(full)`. The SSE readers accumulate
internally; `sample`'s `onText` already works that way. Keeping one convention
avoids the class of bug where one path appends and another assigns.

## Other things worth knowing

- **Markdown is escaped first, then formatted.** Nothing from the model or the
  user is ever inserted as raw HTML. Verified with an XSS probe.
- **Images are never written to `localStorage`.** Two photos would blow the
  ~5 MB quota and take every saved conversation with them. They are sent to
  the API on the turn they are attached; the stored copy keeps only the name.
  Attachments are downscaled to 1024px JPEG before sending.
- **`window.confirm()` is never used.** It is a silent no-op in a sandboxed
  iframe. `ask()` is an in-page modal that works everywhere.
- **`localStorage` access is wrapped** — it can throw in private windows.

## Editing the app

The file was originally assembled from parts plus the art blob. Those parts
lived in a session scratchpad and are gone, so **`public/ace/index.html` is now
the source of truth**. It is a normal HTML file: the CSS, markup and script are
all readable and editable in place. The only thing you should not hand-edit is
the `AVATAR_PACK` string.

After any change:

```sh
cp public/ace/index.html docs/index.html   # keep the Pages copy in sync
bun run build                              # confirm dist/ace/index.html emits
```

Bump `BUILD` when you change behaviour — it is shown in Settings and is how
you tell which copy someone is running.

## Testing

There is no test suite. Verification was done by driving the real page in
headless Chromium:

```sh
npm i -D playwright@1.49.1
cd public && python3 -m http.server 8799 &
# launch with the preinstalled browser — do NOT run `playwright install`
# chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'})
```

Useful patterns, all of which found real bugs:

- **Mock a provider** with `page.route('https://generativelanguage.googleapis.com/**', ...)`
  returning SSE, so streaming and Markdown can be checked without a key.
- **Mock the artifact runtime** with `page.addInitScript()` defining
  `window.claude.use`, so the keyless path can be exercised.
- **Check for silent failures**: listen to `pageerror`, and assert that ids
  referenced in JS exist in the HTML.
- **Screenshot the avatar grid** after any change to the avatar engine.

Caveat learned the hard way: a mock only proves your assumption is
self-consistent. The `AQ.`-key transport was tested against a mock built on an
inference that turned out to be wrong. See `ACE-TROUBLESHOOTING.md`.
