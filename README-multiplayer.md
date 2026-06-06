# Cracked-Heist Multiplayer Setup

The game uses **Supabase Realtime** for multiplayer. No server to deploy — everything is configured from the Supabase dashboard in your browser.

## One-time setup

### 1. Make a Supabase account
Go to **[supabase.com](https://supabase.com)** and sign up (free, just an email — no credit card).

### 2. Create a new project
- Click **"New project"**
- Name it anything (e.g. "cracked-heist")
- Pick any region close to you
- Set a database password (you won't actually use it for this game, but Supabase requires one)
- Click **Create new project** and wait ~1 minute for it to provision

### 3. Copy your project URL and anon key
Once the project is ready, go to **Settings → API**. You'll see two values:

| Key | Where to find it |
|---|---|
| **Project URL** | At the top of Settings → API, looks like `https://abcxyz.supabase.co` |
| **anon public** | Under "Project API keys" — a long string starting with `eyJ...` |

### 4. Add them to Netlify
On Netlify → **Site configuration** → **Environment variables**, add:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your project URL (the whole thing, with `https://`) |
| `VITE_SUPABASE_ANON_KEY` | Your anon public key |

### 5. (Optional) AI question generation
If you also want the "Ask AI to make questions" button to work, add:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key (from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — free tier works) |

### 6. Redeploy
On Netlify → **Deploys** → **Trigger deploy** → **Deploy site**. Wait ~1 minute. Multiplayer now works.

## How it works (technical note)

- Whoever hosts the room runs the game reducer locally and broadcasts state over a Supabase Realtime channel named after the room code.
- Joiners send actions over the same channel; the host applies them and broadcasts the new state.
- No backend code to deploy — Supabase Realtime is a hosted WebSocket fan-out service.
- The free tier supports plenty of concurrent connections for classroom use.

## Local development

```sh
VITE_SUPABASE_URL=https://your.supabase.co \
VITE_SUPABASE_ANON_KEY=your-anon-key \
bun run dev
```

Then open two browser windows. One hosts, the other joins with the host's room code — they share a room.
