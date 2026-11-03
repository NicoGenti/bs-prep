/* Exchanges a GitHub OAuth code for an access token. It stores and logs nothing.
   Variables: ALLOWED_ORIGIN (origins only, without paths), GITHUB_CLIENT_ID.
   Secret: GITHUB_CLIENT_SECRET. */

const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const STATE_TTL_MS = 10 * 60 * 1000;
const MAX_BODY_BYTES = 10240;

function bytesToHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, 2), 16);
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
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return bytesToHex(signature);
}
async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(digest);
}
async function digestEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const [left, right] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}
function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGIN || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}
function canonicalRedirect(value) {
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
  const responseHeaders = Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, headers || {});
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}
export async function issueState(secret, now) {
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = bytesToHex(nonceBytes);
  const expiresAt = String((now || Date.now()) + STATE_TTL_MS);
  const payload = nonce + '.' + expiresAt;
  const signature = await hmac(secret, payload);
  return payload + '.' + signature;
}
export async function verifyState(secret, state, now) {
  if (typeof state !== 'string' || state.length > 200) return false;
  const parts = state.split('.');
  if (parts.length !== 3) return false;
  const [nonce, expiresAt, signature] = parts;
  if (!/^[0-9a-f]{32}$/.test(nonce) || !/^\d{10,16}$/.test(expiresAt) || !/^[0-9a-f]{64}$/.test(signature)) return false;
  if (Number(expiresAt) < (now || Date.now())) return false;
  const expected = await hmac(secret, nonce + '.' + expiresAt);
  return digestEqual(expected, signature);
}
/* Site path on GitHub Pages. The Origin header is only https://<user>.github.io. */
const PAGES_PATH = '/bs-prep/';
export function redirectAllowed(env, redirectUri) {
  const wanted = canonicalRedirect(redirectUri);
  if (!wanted) return false;
  let wantedUrl;
  try { wantedUrl = new URL(wanted); } catch { return false; }
  return allowedOrigins(env).some(entry => {
    let configured;
    try { configured = new URL(entry); } catch { return false; }
    if (configured.protocol !== 'https:' || configured.origin !== wantedUrl.origin) return false;
    const path = configured.pathname || '/';
    if (path === '/') return wantedUrl.pathname === PAGES_PATH || wantedUrl.pathname === '/';
    return canonicalRedirect(entry) === wanted;
  });
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
    const contentType = String(request.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) return reply({ error: 'unsupported_media_type' }, 415, headers);

    const rawBody = await request.text();
    const bodyBytes = new TextEncoder().encode(rawBody).byteLength;
    if (bodyBytes === 0 || bodyBytes > MAX_BODY_BYTES) {
      return reply({ error: 'payload_too_large' }, 413, headers);
    }

    let body;
    try { body = JSON.parse(rawBody); } catch { return reply({ error: 'bad_request' }, 400, headers); }
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
    let githubResponse;
    try {
      githubResponse = await fetchFn(TOKEN_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
        signal: AbortSignal.timeout(10000)
      });
    } catch {
      return reply({ error: 'upstream' }, 502, headers);
    }
    let data;
    try { data = await githubResponse.json(); } catch { return reply({ error: 'upstream' }, 502, headers); }
    if (!githubResponse.ok || !data || data.error || typeof data.access_token !== 'string') {
      return reply({ error: 'exchange_failed' }, 502, headers);
    }
    const scope = String(data.scope || '');
    const scopeParts = scope.split(',').map(value => value.trim()).filter(Boolean);
    if (scopeParts.length !== 1 || scopeParts[0] !== 'gist') return reply({ error: 'scope' }, 403, headers);
    return reply({ access_token: data.access_token, token_type: 'bearer', scope: 'gist' }, 200, headers);
  }
  return reply({ error: 'not_found' }, 404, headers);
}

export default {
  fetch(request, env) { return handle(request, env, fetch); }
};
