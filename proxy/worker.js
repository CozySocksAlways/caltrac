// Cloudflare Worker that forwards chat-completion requests to Blablador and adds the CORS
// headers Blablador doesn't send, so the PWA can call it from the browser.
// Only forwards to UPSTREAM_BASE and only answers ALLOWED_ORIGINS, so it isn't an open proxy.
// The API key is not stored here: the app sends it in the Authorization header as usual.

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? ''
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    if (!allowedOrigins.includes(origin)) {
      return new Response('Forbidden origin', { status: 403 })
    }

    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/v1/chat/completions') {
      return new Response('Not found', { status: 404, headers: cors })
    }

    const upstream = await fetch(`${env.UPSTREAM_BASE.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') ?? '',
      },
      body: request.body,
    })

    const headers = new Headers(upstream.headers)
    for (const [key, value] of Object.entries(cors)) headers.set(key, value)
    return new Response(upstream.body, { status: upstream.status, headers })
  },
}
