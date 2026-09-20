import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Game Forge lives in /public as a plain static page, so it keeps working when
 * you open its files directly. Vite's SPA fallback otherwise answers `/forge/`
 * with the React shell. Netlify serves the directory index in production; this
 * keeps `bun run dev` behaving the same way.
 */
function staticPages(): Plugin {
  const pages = ['/forge']
  return {
    name: 'gamehub:static-pages',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url) {
          const [path, query] = req.url.split('?')
          const hit = pages.find((p) => path === p || path === `${p}/`)
          if (hit) req.url = `${hit}/index.html${query ? `?${query}` : ''}`
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), staticPages()],
})
