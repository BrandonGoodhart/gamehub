# GameHub

A collection of browser games, plus **Game Forge** — a chat that turns a
sentence into a finished website you can download.

## Game Forge

Live at **`/forge/`** (`bun run dev` -> <http://localhost:5173/forge/>).

Two pages, nothing else:

- **`/forge/`** explains what it does, in plain language.
- **`/forge/chat.html`** is a chat. You say what you want, it asks four or five
  short questions, builds the site while you watch, and shows it to you playable
  in the thread with a **Download** button.

It builds websites, not just games. The chat *collects* the details only you
know rather than inventing them, so the copy on your page is your own words.

### What it can build

| Type | Sections it composes |
| --- | --- |
| Small business | hero, what we do, about, contact |
| Cafe or restaurant | hero, menu with price leaders, about, hours |
| Event | hero, running order, what to expect, RSVP |
| Club or team | hero, what we do, about, come along |
| Portfolio | hero, work gallery, about, contact |
| Personal link page | centred hero with initials, big link buttons, about |
| Class page | hero, coming up, how our week works, contact |
| Product or project | hero, features, why it exists, call to action |
| CV or résumé | hero, experience, profile, contact (prints cleanly) |
| Game for a class | hands off to the game engine below |

Six themes (Calm, Fresh, Playful, Elegant, Bold, Night), each with its own
palette and type family. The chat guesses the type and theme from your first
sentence; if it cannot, it offers buttons.

Once a site exists, plain English keeps working: *"make it darker"* restyles it,
anything else gets added to the page and it rebuilds.

### What you get

One self-contained `.html` file. No external requests, no build step, no
sign-in. It opens from Files on an iPad, double-clicks open on a Mac, and works
with the wifi off. Every generated page carries an **Edit text** button that
turns the page editable and saves you a new copy with your changes baked in —
so someone who cannot code can still reword their own site.

### The games

Asking for a quiz, trivia or bingo routes to the game engine: a **buzz-in quiz**,
a **points board** (5 categories x 5 values, difficulty climbing with the
points), or **printable bingo** with a different card per student. Backed by
~420 curated questions across 11 subjects and 4 grade bands, with a live
scoreboard, timer, sound, keyboard shortcuts and an in-game question editor.

### Layout

Deliberately plain static files under `public/forge/`, not part of the React
bundle, so everything runs from a file path as happily as from a server.

| File | Role |
| --- | --- |
| `index.html` | The explainer page |
| `chat.html` / `chat.js` | The conversation, the build, the result card |
| `site.js` | Website generator: themes, types, blocks, emitted CSS and runtime |
| `generator.js` | Game generator: `parsePrompt` -> `buildSpec` -> `buildGame` |
| `runtime.js` | The generated game's engine, inlined into every game export |
| `bank.js` | The question bank |
| `styles.css` | Styling for both builder pages |

Both `runtime.js` (games) and the site runtime in `site.js` are serialised into
their exports with `Function.prototype.toString()`. That keeps each export a
single offline file while the engines stay ordinary source files you can lint,
diff and test.

### Adding things

- **A new site type** is a recipe in `SITE.TYPES`: a name, the questions to ask,
  the section labels and which blocks to compose. No new rendering code.
- **A new theme** is one entry in `SITE.THEMES`.
- **More questions** go in `bank.js` as `[question, answer, wrong, wrong, wrong]`.

---

<details>
<summary>Vite template notes</summary>

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

</details>
