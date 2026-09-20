# GameHub

A collection of browser games, plus **Game Forge** — a builder that turns a
sentence into a finished classroom game.

## Game Forge

Live at **`/forge/`** (`bun run dev` → <http://localhost:5173/forge/>).

Type what you want — *"a 4th grade science review game with 5 teams and a 20
second timer"* — and it parses the prompt, picks a game shape, writes the
questions, and hands back a **single self-contained `.html` file**. While it
builds it narrates each step and draws a preview of what it just decided
(palette, board layout, a real question card, the scoreboard).

The downloaded file has no external requests, no build step and no sign-in: open
it from Files on an iPad, double-click it on a Mac, AirDrop it to another
teacher. It works with the wifi off.

### Three game shapes

| Shape | What it is | Picked when the prompt says |
| --- | --- | --- |
| **Buzz-In Quiz** | One big question, teams buzz in on number keys or by tapping their colour | *buzz, fast, kahoot, race* — and by default |
| **Points Board** | Five categories × five point values, difficulty climbing with the points | *jeopardy, board, categories, review game* |
| **Review Bingo** | A different printable card per student; you read clues, they cover answers | *bingo* |

The prompt also sets the subject, grade band (K–2 / 3–5 / 6–8 / 9–12), team
count, class size, timer, length and colour theme. Anything it guesses wrong is
a dropdown away under **Change something**.

### Inside a generated game

Scoreboard, per-question timer with warning beeps, WebAudio sound effects,
full-screen mode, keyboard shortcuts (number keys award points, space reveals),
confetti on the win screen, and an in-game question editor that saves to
`localStorage` — so a teacher can swap in their own questions without touching
code.

### Layout

Deliberately plain static files under `public/forge/`, not part of the React
bundle, so the builder runs from a file path as happily as from a server.

| File | Role |
| --- | --- |
| `bank.js` | ~420 curated questions across 11 subjects and 4 grade bands |
| `generator.js` | `parsePrompt` → `buildSpec` → `buildGame` (emits the HTML) |
| `runtime.js` | The generated game's engine and CSS, inlined into every export |
| `forge.js` / `forge.css` / `index.html` | The builder page and its build pipeline |

`runtime.js` is serialised into each export with `Function.prototype.toString()`.
That keeps the export a single offline file while the engine stays an ordinary
source file you can lint, diff and test.

### Adding questions

Append to a subject's band array in `bank.js`. Each row is
`[question, correctAnswer, wrong, wrong, wrong]`; distractors are shuffled at
build time, and rows are reused as bingo clues when the answer is short enough.

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
