# Ace — failure modes and what actually caused them

Hard-won. Most of this project's time went into "the API key doesn't work",
which turned out to be **four unrelated causes stacked on top of each other**.
Read this before changing anything key-related, and before telling the user to
try something.

---

## 1. A Claude artifact page has no outbound network

**This was the root cause of the longest-running problem.** The user was
running Ace from the published artifact link. Every `fetch` to Google or
Anthropic was refused before it left the page, so **no API key in any format
could ever have worked there**.

The capability contract states it plainly: *"The page cannot fetch images from
URLs (its network is blocked)."*

**Fix:** inside an artifact, use `claude.use('sample')` to ask Claude directly.
No key. This is now the auto-selected provider there, and the only path
confirmed working against a real model.

**Lesson:** this was flagged as a possibility early and then not chased down,
while several rounds went into fixing key handling instead. When a whole class
of thing fails, check whether the *channel* works before refining the payload.

---

## 2. Google's new `AQ.` key format

Google is migrating AI Studio keys from `AIza...` to `AQ....`. A hardcoded
`AIza` prefix check rejected a perfectly valid current key.

They also **authenticate differently**:

| Format | Transport | Wrong transport gives |
| --- | --- | --- |
| `AIza...` | `x-goog-api-key` header (or `?key=`) | — |
| `AQ....` | `Authorization: Bearer` | `401 ACCESS_TOKEN_TYPE_UNSUPPORTED` |

**Also:** since **19 June 2026 Google refuses *unrestricted* keys** in the
`AQ.` format. The documented fix is to restrict the key to the Gemini API on
the AI Studio keys page. This is widely reported on Google's own forums and is
**the most likely remaining cause** if the user's key still fails.

**Unverified.** All of this was inferred from probing the live API with invalid
keys plus forum reports. A real `AQ.` key was never available. Specifically,
the claim that `AQ.` keys work as bearer tokens rests on the observation that
the bearer path returns `API_KEY_SERVICE_BLOCKED` (credential type recognised)
while the api-key path returns `ACCESS_TOKEN_TYPE_UNSUPPORTED` (type refused).
**That inference may be wrong.** The code tries both and caches the winner, so
it should survive being wrong, but treat it as unconfirmed.

**Never hardcode a key prefix as a gate.** It is a hint. The format has already
changed once.

---

## 3. `window.confirm()` is a silent no-op in a sandboxed iframe

The user pressed **Save** on their key and *nothing happened* — no dialog, no
error, no stored key.

Cause: `saveKey()` guarded an unrecognised prefix behind `confirm("save it
anyway?")`. A sandboxed iframe without `allow-modals` ignores `confirm()` and
returns `false`, so the function returned early, silently.

**Fix:** a prefix mismatch no longer blocks saving at all, and every
confirmation uses `ask()`, an in-page modal. Never reintroduce `confirm()`,
`alert()` or `prompt()` — the app runs inside a sandbox.

---

## 4. Errors that said nothing

The original reported every failure as "Sorry, I had trouble responding."
Several distinct problems were indistinguishable.

Now: HTTP status and provider reason codes map to specific, actionable text,
**per provider** — note Gemini reports an invalid key as **400
INVALID_ARGUMENT**, not 401, so shared error mapping would mislabel it.

There is also a **Run diagnostics** button that checks each layer separately:
key format → can we reach the host at all → did the host accept the key → does
the chosen model reply. The critical distinction is *blocked before reaching
the provider* (network, blocker, or a sandbox CSP) versus *provider answered
and refused* — these need opposite fixes and previously looked identical.

A further silent failure: saving a key ran the model-list fetch with errors
suppressed, so a key Google rejected looked like it saved fine and failed later
for no stated reason. That fetch now reports.

---

## Bugs found in the original app

Not key-related, but worth knowing so they are not reintroduced.

| Bug | Effect |
| --- | --- |
| SVGs had no `viewBox` | Every avatar rendered as a cropped corner |
| All 89 SVGs reuse ids `reuse-0..14`, `a` | With two avatars on screen, the second rendered with the first's shapes |
| Picker loaded `hair/hair-N.svg` | Files that do not exist in a standalone file — all 89 options showed `?` |
| `.c2` and `.c6` never recoloured | Everyone had grey hair and white shoes |
| `.customDrawFill` left white | A white band across the lower face |
| Art ships a blank face layer | No eyes or mouth on any avatar, ever |
| Settings wrote `"key saved"` into the key input | Pressing Save twice stored the literal string **over the real key** |
| `newChat()` ran on every load | Empty "New Conversation" entries piled up; reload never returned to your chat |
| Model/assistant text via `innerHTML` | XSS |
| Attached images read then discarded | Only `[Image: name]` was sent |
| Image-generation toggle | Changed a badge and nothing else; the API cannot generate images |
| Model `claude-sonnet-4-20250514` | Stale |

---

## Environment constraints hit during this work

- **Netlify is blocked** by the environment's network policy (403 on CONNECT to
  `*.netlify.app` and `app.netlify.com`). Deploys must go via Git or from the
  user's machine, unless they widen Network access in the environment settings.
- **`ai.google.dev`, `discuss.ai.google.dev` and `docs.github.com` are blocked**
  by the egress proxy, so provider documentation could not be read directly.
  `generativelanguage.googleapis.com` and `api.anthropic.com` **are** reachable,
  which is how the transport behaviour above was probed.
- **The Cloudflare connector** has D1/KV/R2/Workers-read only — no DNS, no
  zones, no Pages deploy.
- **The Netlify connector** can deploy and set env vars but has no domain API.
- **Playwright**: use the preinstalled browser at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Do not run
  `playwright install`.

---

## Two process lessons

**A mock only proves your assumption is self-consistent.** The `AQ.` transport
fix was verified against a mock built from the very inference it was testing.
It passed; reality did not. Where the truth is on the other side of a network
call you cannot make, say so rather than implying it is verified.

**Get the symptom before shipping the fix.** Several rounds were spent
speculating about what "it doesn't work" meant. Two multiple-choice questions
— *what happens?* and *where are you running it?* — identified the real cause
in one exchange. Ask earlier.
