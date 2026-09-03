import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const port = Number(process.env.PORT || 3000)
const distDirectory = join(process.cwd(), 'dist')
const nonprofitApiRoot = 'https://projects.propublica.org/nonprofits/api/v2/organizations'
const allowedEins = new Set(['131617086', '133170676', '133127972'])

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(body))
}

async function proxyNonprofit(requestUrl, response) {
  const ein = requestUrl.searchParams.get('ein')?.replace(/\D/g, '') ?? ''
  if (!allowedEins.has(ein)) {
    sendJson(response, 400, { error: 'Unknown pilot organization.' })
    return
  }

  try {
    const upstream = await fetch(`${nonprofitApiRoot}/${ein}.json`, {
      headers: { Accept: 'application/json', 'User-Agent': 'RescueRelay/0.1 live-demo' },
      signal: AbortSignal.timeout(12_000),
    })
    if (!upstream.ok) {
      sendJson(response, 502, { error: `Live registry returned ${upstream.status}.` })
      return
    }
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    })
    response.end(await upstream.text())
  } catch {
    sendJson(response, 502, { error: 'Unable to reach the live nonprofit registry.' })
  }
}

async function serveFile(pathname, response) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname
  const safePath = normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, '')
  let filePath = join(distDirectory, safePath)

  try {
    const file = await stat(filePath)
    if (!file.isFile()) throw new Error('Not a file')
  } catch {
    filePath = join(distDirectory, 'index.html')
  }

  response.writeHead(200, {
    'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
  })
  createReadStream(filePath).pipe(response)
}

createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)

  if (requestUrl.pathname === '/healthz') {
    sendJson(response, 200, { ok: true })
    return
  }
  if (requestUrl.pathname === '/api/nonprofits') {
    if (request.method !== 'GET') {
      response.writeHead(405, { Allow: 'GET' })
      response.end()
      return
    }
    await proxyNonprofit(requestUrl, response)
    return
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' })
    response.end()
    return
  }
  await serveFile(decodeURIComponent(requestUrl.pathname), response)
}).listen(port, '0.0.0.0', () => {
  console.log(`RescueRelay is listening on port ${port}`)
})
