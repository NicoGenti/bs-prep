import { handle, issueState, verifyState } from '../worker/src/index.js';

let failed = 0;
const logs = [];
for (const m of ['log', 'info', 'warn', 'error', 'debug']) {
  const orig = console[m].bind(console);
  console[m] = (...args) => {
    const line = args.map(String).join(' ');
    if (!line.startsWith('ok  ') && !line.startsWith('FAIL ')) logs.push(line);
    orig(...args);
  };
}
function check(name, cond, detail) {
  if (cond) console.log('ok  ' + name);
  else { failed++; console.error('FAIL ' + name + (detail ? ' — ' + detail : '')); }
}
const env = {
  GITHUB_CLIENT_ID: 'Iv1.testclient',
  GITHUB_CLIENT_SECRET: 'super-secret-value',
  ALLOWED_ORIGIN: 'https://nicogenti.github.io/bs-prep'
};
const origin = 'https://nicogenti.github.io';

function req(path, opts) {
  return new Request('https://worker.test' + path, Object.assign({ headers: { Origin: origin } }, opts || {}));
}

const pre = await handle(req('/token', { method: 'OPTIONS' }), env, async () => { throw new Error('no fetch'); });
check('preflight consentito', pre.status === 204 && pre.headers.get('Access-Control-Allow-Origin') === origin);

const evil = await handle(new Request('https://worker.test/state', { headers: { Origin: 'https://evil.test' } }), env, async () => { throw new Error('no fetch'); });
check('origine non in elenco rifiutata', evil.status === 403 && evil.headers.get('Access-Control-Allow-Origin') == null);

const stateRes = await handle(req('/state'), env, async () => { throw new Error('no fetch'); });
const { state } = await stateRes.json();
check('state firmato', await verifyState(env.GITHUB_CLIENT_SECRET, state));
check('state scaduto rifiutato', !(await verifyState(env.GITHUB_CLIENT_SECRET, state, Date.now() + 20 * 60 * 1000)));

let ghCall = null;
const gh = async (url, opts) => {
  ghCall = { url: String(url), body: opts.body, headers: opts.headers };
  return new Response(JSON.stringify({ access_token: 'gho_goodtokenvalue', token_type: 'bearer', scope: 'gist' }), { status: 200 });
};
const ok = await handle(req('/token', {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'abcDEF1234', state, redirect_uri: 'https://nicogenti.github.io/bs-prep' })
}), env, gh);
const token = await ok.json();
check('scambio riuscito', ok.status === 200 && token.access_token === 'gho_goodtokenvalue' && token.scope === 'gist');
check('chiama solo GitHub', ghCall && ghCall.url === 'https://github.com/login/oauth/access_token' && ghCall.body.includes('client_secret=super-secret-value'));
check('la risposta non contiene il secret', !JSON.stringify(token).includes('super-secret') && !('client_secret' in token));
check('CORS sulla risposta', ok.headers.get('Access-Control-Allow-Origin') === origin && ok.headers.get('Cache-Control') === 'no-store');

const badState = await handle(req('/token', {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'abcDEF1234', state: 'nope', redirect_uri: 'https://nicogenti.github.io/bs-prep/' })
}), env, async () => { throw new Error('non doveva chiamare GitHub'); });
check('state non valido', badState.status === 400);

const otherScope = await handle(req('/token', {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'abcDEF1234', state, redirect_uri: 'https://nicogenti.github.io/bs-prep/' })
}), env, async () => new Response(JSON.stringify({ access_token: 'gho_goodtokenvalue', scope: 'gist,repo' }), { status: 200 }));
check('scope diverso da gist rifiutato', otherScope.status === 403 && !(await otherScope.clone().json()).access_token);

const upstream = await handle(req('/token', {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'abcDEF1234', state, redirect_uri: 'https://nicogenti.github.io/bs-prep/' })
}), env, async () => new Response(JSON.stringify({ error: 'bad_verification_code', error_description: 'secret leak?' }), { status: 200 }));
const upBody = await upstream.json();
check('errore GitHub generico', upstream.status === 502 && upBody.error === 'exchange_failed' && !JSON.stringify(upBody).includes('secret'));

const bare = await handle(req('/state'), { ALLOWED_ORIGIN: env.ALLOWED_ORIGIN }, async () => { throw new Error('no'); });
check('senza segreti non parte', bare.status === 503);

const wrongRedirect = await handle(req('/token', {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'abcDEF1234', state, redirect_uri: 'https://nicogenti.github.io/altro/' })
}), env, async () => { throw new Error('non doveva chiamare GitHub'); });
check('redirect_uri diverso rifiutato', wrongRedirect.status === 400);

check('nessun log del worker', logs.length === 0, logs.join(' | '));

const fresh = await issueState('super-secret-value');
check('firma diversa non passa', !(await verifyState('altro-segreto', fresh)));

if (failed) {
  console.error(failed + ' controlli falliti');
  process.exit(1);
}
console.log('Worker ok.');
