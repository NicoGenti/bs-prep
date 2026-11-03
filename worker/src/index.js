/* Scambia il code OAuth di GitHub con un access token. Non salva e non registra nulla.
   Segreti: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET. Variabile: ALLOWED_ORIGIN. */

const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const STATE_TTL_MS = 10 * 60 * 1000;

function bytesToHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return bytesToHex(sig);
}
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
export function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}
export function canonicalRedirect(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
  let path = url.pathname;
  if (path.endsWith('index.html')) path = path.slice(0, -'index.html'.length);
  if (!path.endsWith('/')) path += '/';
  return url.origin + path;
}
function corsHeaders(origin, allowed) {
  const ok = allowed.some(entry => {
    try { return new URL(entry).origin === origin; } catch { return false; }
  });
  if (!ok) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, accept',
    'Access-Control-Max-Age': '600',
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  };
}
function reply(body, status, headers) {
  const h = Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, headers || {});
  return new Response(JSON.stringify(body), { status, headers: h });
}
export async function issueState(secret, now) {
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = bytesToHex(nonceBytes);
  const exp = String((now || Date.now()) + STATE_TTL_MS);
  const payload = nonce + '.' + exp;
  const sig = await hmac(secret, payload);
  return payload + '.' + sig;
}
export async function verifyState(secret, state, now) {
  if (typeof state !== 'string' || state.length > 200) return false;
  const parts = state.split('.');
  if (parts.length !== 3) return false;
  const [nonce, exp, sig] = parts;
  if (!/^[0-9a-f]{32}$/.test(nonce) || !/^\d{10,16}$/.test(exp) || !/^[0-9a-f]{64}$/.test(sig)) return false;
  if (Number(exp) < (now || Date.now())) return false;
  const expected = await hmac(secret, nonce + '.' + exp);
  if (expected.length !== sig.length || hexToBytes(sig).length !== 32) return false;
  return safeEqual(expected, sig);
}
function redirectAllowed(env, redirectUri) {
  const want = canonicalRedirect(redirectUri);
  if (!want) return false;
  return allowedOrigins(env).some(entry => canonicalRedirect(entry) === want);
}

export async function handle(request, env, fetchImpl) {
  const fetchFn = fetchImpl || fetch;
  const origin = request.headers.get('Origin') || '';
  const allowed = allowedOrigins(env);
  const headers = corsHeaders(origin, allowed);
  if (!headers) return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'no-store' } });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return reply({ error: 'not_configured' }, 503, headers);
  }
  const url = new URL(request.url);
  if (url.pathname === '/state' && request.method === 'GET') {
    const state = await issueState(env.GITHUB_CLIENT_SECRET);
    return reply({ state }, 200, headers);
  }
  if (url.pathname === '/token' && request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return reply({ error: 'bad_request' }, 400, headers); }
    const code = body && body.code;
    const state = body && body.state;
    const redirectUri = body && body.redirect_uri;
    if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{10,100}$/.test(code)) return reply({ error: 'bad_code' }, 400, headers);
    if (!await verifyState(env.GITHUB_CLIENT_SECRET, state)) return reply({ error: 'bad_state' }, 400, headers);
    if (!redirectAllowed(env, redirectUri)) return reply({ error: 'bad_redirect' }, 400, headers);
    const form = new URLSearchParams();
    form.set('client_id', env.GITHUB_CLIENT_ID);
    form.set('client_secret', env.GITHUB_CLIENT_SECRET);
    form.set('code', code);
    form.set('redirect_uri', redirectUri);
    let gh;
    try {
      gh = await fetchFn(TOKEN_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
        signal: AbortSignal.timeout(10000)
      });
    } catch {
      return reply({ error: 'upstream' }, 502, headers);
    }
    let data;
    try { data = await gh.json(); } catch { return reply({ error: 'upstream' }, 502, headers); }
    if (!gh.ok || !data || data.error || typeof data.access_token !== 'string') {
      return reply({ error: 'exchange_failed' }, 502, headers);
    }
    const scope = String(data.scope || '');
    const parts = scope.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length !== 1 || parts[0] !== 'gist') return reply({ error: 'scope' }, 403, headers);
    return reply({ access_token: data.access_token, token_type: 'bearer', scope: 'gist' }, 200, headers);
  }
  return reply({ error: 'not_found' }, 404, headers);
}

export default {
  fetch(request, env) { return handle(request, env, fetch); }
};
