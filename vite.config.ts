import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const nonprofitApiRoot = 'https://projects.propublica.org/nonprofits/api/v2/organizations'
const allowedEins = new Set(['131617086', '133170676', '133127972'])

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rescuerelay-live-nonprofits',
      configureServer(server) {
        server.middlewares.use('/api/nonprofits', async (request, response) => {
          const requestUrl = new URL((request as { originalUrl?: string; url?: string }).originalUrl ?? (request as { url?: string }).url ?? '/', 'http://localhost')
          const ein = requestUrl.searchParams.get('ein')?.replace(/\D/g, '') ?? ''
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          if (!allowedEins.has(ein)) {
            response.statusCode = 400
            response.end(JSON.stringify({ error: 'Unknown pilot organization.' }))
            return
          }
          try {
            const upstream = await fetch(`${nonprofitApiRoot}/${ein}.json`, {
              headers: { Accept: 'application/json', 'User-Agent': 'RescueRelay/0.1 live-demo' },
            })
            if (!upstream.ok) {
              response.statusCode = 502
              response.end(JSON.stringify({ error: `Live registry returned ${upstream.status}.` }))
              return
            }
            response.setHeader('Cache-Control', 'public, max-age=300')
            response.statusCode = 200
            response.end(await upstream.text())
          } catch {
            response.statusCode = 502
            response.end(JSON.stringify({ error: 'Unable to reach the live nonprofit registry.' }))
          }
        })
      },
    },
  ],
})
