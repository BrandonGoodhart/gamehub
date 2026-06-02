# Cracked-Heist Multiplayer Setup

The game runs in two pieces:

1. **Frontend** (Vite/React) — deployed to Netlify
2. **PartyKit room server** — deployed to PartyKit's free cloud

The frontend connects to the room server via WebSocket. Without the server URL configured, the home page shows a "Multiplayer not connected yet" message.

## One-time setup

### 1. Sign in to PartyKit

```sh
npx partykit login
```

This opens a browser and creates a free PartyKit account (or signs in with an existing one).

### 2. Deploy the room server

From the repo root:

```sh
npx partykit deploy
```

You'll get a URL printed at the end, something like:

```
✅ Deployed to https://cracked-heist.<your-username>.partykit.dev
```

Copy that URL.

### 3. Wire the frontend to the server

On Netlify, go to **Site configuration → Environment variables** and add:

| Key | Value |
|---|---|
| `VITE_PARTYKIT_HOST` | `cracked-heist.<your-username>.partykit.dev` |

(Drop the `https://` prefix — the client adds it.)

Trigger a redeploy (push to GitHub or click "Deploy site").

### 4. (Optional) AI question generation

If you also want the "Ask AI to make questions" button to work, add:

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (from console.anthropic.com) |

## Updating the room server

Anytime you change `party/cracked-heist.ts` or `src/games/cracked-heist/reducer.ts`:

```sh
npx partykit deploy
```

That's it — the frontend automatically reconnects on next page load.

## Local development

Run both servers in two terminals:

```sh
# Terminal 1
npx partykit dev

# Terminal 2
VITE_PARTYKIT_HOST=http://localhost:1999 bun run dev
```

Then open two browser windows at `http://localhost:5173`. One hosts, the other joins with the host's room code — they're in the same game.
