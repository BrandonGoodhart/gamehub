# Putting Ace on theacechat.com

Two routes. Pick one — the difference is whether visitors need their own
API key.

| | GitHub Pages | Cloudflare Pages |
| --- | --- | --- |
| Hosting | static only | static + server code |
| Who supplies the API key | **each visitor, in Settings** | **you, once, as a secret** |
| DNS work | add records in Cloudflare by hand | one click, records written for you |
| Files to upload | none | none |

GitHub Pages cannot run the `/api/ace-chat` function, so there is nowhere for
a server-held key to live. Ace detects that and falls back to asking each
visitor for their own key, which works fine — it is just a worse experience
for anyone but you.

---

## Route A — GitHub Pages (what the verification TXT record is for)

The app is committed at `docs/index.html`, with `docs/CNAME` naming the
domain, so there is nothing to upload.

### 1. Turn Pages on

GitHub → the `gamehub` repo → **Settings** → **Pages**:

- Source: **Deploy from a branch**
- Branch: `claude/optimistic-mayer-6s4bp3`, folder **`/docs`**
- Save.

### 2. Verify the domain

GitHub → your profile **Settings** → **Pages** → **Add a domain**. It gives
the TXT record. In Cloudflare → **DNS** → **Add record**:

| Field | Value |
| --- | --- |
| Type | `TXT` |
| Name | `_github-pages-challenge-BrandonGoodhart` |
| Content | the value GitHub shows |
| TTL | Auto |

### 3. Point the domain at GitHub

In Cloudflare → DNS, replace the existing `theacechat.com` record with four
**A** records, all named `theacechat.com`:

    185.199.108.153
    185.199.109.153
    185.199.110.153
    185.199.111.153

Optionally a **CNAME** named `www` pointing at `brandongoodhart.github.io`.

**Set every one of these to "DNS only" — the grey cloud, not orange.** While
Cloudflare proxies them, GitHub cannot issue the HTTPS certificate for the
domain. You can switch proxying back on afterwards if you want it.

### 4. Set the custom domain in the repo

Repo → Settings → Pages → Custom domain → `theacechat.com` → Save, then tick
**Enforce HTTPS** once the certificate is issued (can take a few minutes).

---

## Route B — Cloudflare Pages (no key for visitors)

Worth it if anyone other than you will use the site.

Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
→ `gamehub`:

| Setting | Value |
| --- | --- |
| Production branch | `claude/optimistic-mayer-6s4bp3` |
| Build command | `npm install && npm run build` |
| Build output directory | `dist/ace` |

Then **Settings → Variables and Secrets** → add `GEMINI_API_KEY`, press
**Encrypt**, and redeploy. Then **Custom domains** → add `theacechat.com`;
Cloudflare writes the DNS itself.

`functions/api/ace-chat.js` is picked up automatically and served at
`/api/ace-chat`. Check the key with:

    https://theacechat.com/api/ace-chat?selftest=1

It reports exactly what the provider said, and contains no secret.

---

## Note

Inside a Claude artifact the app needs no key at all — it asks Claude directly,
because that page has no outbound network access. That is unrelated to either
deployment above.

When the app changes, `docs/index.html` is a copy of `public/ace/index.html`
and must be refreshed alongside it.
