# Ace — handoff

**Read this first.** It is the state of play. The other documents are:

| File | What it covers |
| --- | --- |
| `ACE-ARCHITECTURE.md` | How the code works, file by file and subsystem by subsystem |
| `ACE-TROUBLESHOOTING.md` | Every failure mode found and what actually caused it — **read before touching the API-key code** |
| `DEPLOY-theacechat.md` | Getting it onto `theacechat.com` (GitHub Pages or Cloudflare Pages) |
| `public/ace/README.md` | End-user facing readme for the app itself |

---

## What this is

**Ace** is a self-contained AI companion chat app: one HTML file, ~790 KB, no
build step, no dependencies, no server required. Open it and it runs. It has
an avatar builder (89 character styles), five themes, a streaming chat, and
support for three different ways of reaching a model.

It started as a 4.9 MB single-file prototype the user supplied
(`ace_app_v20_standalone_1.html`). It was rebuilt in place. The 89 character
SVGs are the original art, preserved byte for byte.

It lives inside the `gamehub` repository but is **entirely independent** of
the React game hub — it shares only the repo and the Netlify config.

## Branch

Everything is on **`claude/optimistic-mayer-6s4bp3`**, pushed.

- **11 commits are this work**, from `6d8a7a5` to `4177696`.
- **6 commits below that are inherited** — pre-existing game-hub work that is
  on this branch but not yet in `origin/main`. `git diff origin/main..HEAD`
  therefore shows `src/games/cracked-heist/*` changes that are **not ours**.
  Do not assume those are part of this project.

No pull request has been opened. The user has not asked for one.

## Current state

| Thing | State |
| --- | --- |
| The app | Works. Build stamp `2026-09-24c`. |
| Avatars, onboarding, themes, chat, Markdown, images, export | Working, verified in Chromium |
| Chat inside a Claude artifact | **Working, no API key needed** |
| Chat with a user's own Gemini/Anthropic key | Code complete, **never confirmed against a real key** |
| `theacechat.com` | **Not live.** DNS still points at Cloudflare's proxy. |
| Server-held key (so visitors need none) | Code complete both for Netlify and Cloudflare Pages, **never deployed** |

### The one thing that works right now

The published artifact — https://claude.ai/artifact/FpH9moPUSG5oNKS33ZcJpZ —
chats with no API key at all, using the artifact runtime's `sample`
capability. This is the only path confirmed end to end with a real model.

## Open items, in priority order

1. **Is the user's Gemini key valid?** Still unknown after many rounds. It is a
   new-format `AQ.` key. Google rejects *unrestricted* keys of that format
   (`401 ACCESS_TOKEN_TYPE_UNSUPPORTED`); the documented fix is to restrict the
   key to the Gemini API in AI Studio. The user has not confirmed trying it.
   The quickest definitive test is deploying and hitting
   `/api/ace-chat?selftest=1`, which reports the provider's own answer.
2. **Get the domain live.** Both routes are written and pushed; neither has
   been executed. See `DEPLOY-theacechat.md`. The user's last message was a
   GitHub Pages verification TXT record, so they appear to be going that way —
   but GitHub Pages cannot host the key function, so every visitor would need
   their own key. Cloudflare Pages can, and the domain's DNS is already there.
3. **`docs/index.html` is a copy of `public/ace/index.html`.** If you change
   the app, refresh it: `cp public/ace/index.html docs/index.html`. They are
   currently identical.

## What I could not do from this environment

- **Deploy to Netlify.** The environment's network policy denies
  `*.netlify.app` and `app.netlify.com` (403 on CONNECT). The user can widen
  Network access in the environment settings, or deploy from Git.
- **Touch DNS.** The Cloudflare connector has D1/KV/R2/Workers-read only — no
  DNS, no zones, no Pages deploy. The Netlify connector can deploy and set env
  vars but has no domain API.
- **Verify a real API key.** Never had one. Everything key-related was tested
  against mocks built from probing the real endpoints with invalid keys.
  `ACE-TROUBLESHOOTING.md` explains where that led me wrong.

## How to work on it

The single HTML file is **assembled, not edited directly**. Editing
`public/ace/index.html` by hand is possible but will be overwritten. Source
lives in a scratchpad that does not survive the session, so **the committed
`public/ace/index.html` is now the source of truth** — see
`ACE-ARCHITECTURE.md` § "Editing the app" for how to work with it safely.

Verification was done by driving the real page in headless Chromium via
Playwright. `ACE-ARCHITECTURE.md` § "Testing" has the pattern, including how
to mock each provider and the artifact runtime.

## Standing instruction from the user

After finishing any piece of work, give them **both**: a link to open the app,
and the file to download. They asked for this explicitly and repeated it.
