# Putting Ace on theacechat.com (Cloudflare)

The domain's DNS is already in Cloudflare, so hosting it on Cloudflare Pages
avoids touching DNS records at all — attaching the custom domain sets them up
for you, and there is no proxy/grey-cloud problem to get wrong.

Nothing here needs a file upload. Cloudflare pulls the code from GitHub.

## 1. Create the Pages project

Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
**Connect to Git** → pick the `gamehub` repository.

Build settings:

| Setting | Value |
| --- | --- |
| Production branch | `claude/optimistic-mayer-6s4bp3` |
| Framework preset | None |
| Build command | `npm install && npm run build` |
| Build output directory | `dist/ace` |
| Root directory | *(leave blank)* |

`dist/ace` is the important one: it makes Ace the site root, so the domain
serves the app directly rather than at `/ace/`.

The API function is picked up automatically from `functions/api/ace-chat.js`
in the repository root and served at `/api/ace-chat`. The build output
directory does not affect it.

## 2. Add the key as a secret

Project → **Settings** → **Variables and Secrets** → **Add**:

- Name `GEMINI_API_KEY`, value your Google AI Studio key, and press **Encrypt**
  before saving. (Or `ANTHROPIC_API_KEY` for Claude.)

Secrets must exist *before* the deployment that uses them, so redeploy after
adding it.

Once set, visitors need no key of their own: Ace detects the server key on
load and routes through it.

## 3. Attach the domain

Project → **Custom domains** → **Set up a custom domain** → `theacechat.com`.

Because the zone is in the same Cloudflare account, Cloudflare creates the DNS
record itself. Repeat for `www.theacechat.com` if you want it.

## 4. Check the key actually works

Open:

    https://theacechat.com/api/ace-chat?selftest=1

The server calls the provider and reports exactly what came back — status,
the provider's own reason code, and the fix if it is the unrestricted-`AQ.`
key problem. `ok: true` means you are done. It contains no secret, so it is
safe to share.

## Notes

- Netlify is still supported: `netlify/functions/ace-chat.mts` and the host
  rules in `netlify.toml` are the equivalent setup there. Use one or the
  other, not both.
- Inside a Claude artifact the app needs no key at all — it asks Claude
  directly, because that page has no outbound network access. That path is
  unrelated to this deployment.
