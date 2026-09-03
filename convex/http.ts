import { httpActionGeneric, httpRouter } from 'convex/server'

const http = httpRouter()
const nonprofitApiRoot = 'https://projects.propublica.org/nonprofits/api/v2/organizations'
const allowedEins = new Set(['131617086', '133170676', '133127972'])

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

http.route({
  path: '/api/nonprofits',
  method: 'OPTIONS',
  handler: httpActionGeneric(async () => new Response(null, { status: 204, headers: corsHeaders })),
})

http.route({
  path: '/api/nonprofits',
  method: 'GET',
  handler: httpActionGeneric(async (_context, request) => {
    const ein = new URL(request.url).searchParams.get('ein')?.replace(/\D/g, '') ?? ''
    if (!allowedEins.has(ein)) {
      return Response.json({ error: 'Unknown pilot organization.' }, { status: 400, headers: corsHeaders })
    }

    try {
      const upstream = await fetch(`${nonprofitApiRoot}/${ein}.json`, {
        headers: { Accept: 'application/json', 'User-Agent': 'RescueRelay/0.1 live-demo' },
      })
      if (!upstream.ok) {
        return Response.json({ error: `Live registry returned ${upstream.status}.` }, { status: 502, headers: corsHeaders })
      }
      return new Response(await upstream.text(), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      })
    } catch {
      return Response.json({ error: 'Unable to reach the live nonprofit registry.' }, { status: 502, headers: corsHeaders })
    }
  }),
})

export default http
