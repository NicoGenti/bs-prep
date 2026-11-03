/* Login GitHub opzionale e sync su un Gist segreto dell'utente. Senza config non fa nulla. */
(function(){
'use strict';
const B=window.BS;
const M=window.BSMerge;
const FILE='bs-prep-progress.json';
const AUTH_KEY='bsprep.oauth';
const STATE_KEY='bsprep.oauth.state';
let memory=null;
let timer=null;
let status={phase:'off', detail:'', at:null};
let pushLock=false;

function esc(s){return B.esc(s);}
function cfg(){
  const c=window.BS_SYNC||{};
  const id=String(c.clientId||'').trim();
  const raw=String(c.workerUrl||'').trim();
  if(!id||!raw||!/^[A-Za-z0-9._-]{4,80}$/.test(id))return null;
  let url;
  try{url=new URL(raw);}catch(e){return null;}
  const local=url.hostname==='127.0.0.1'||url.hostname==='localhost';
  if(url.protocol!=='https:'&&!local)return null;
  if(url.username||url.password||url.search||url.hash)return null;
  url.hash=''; url.search='';
  const path=url.pathname==='/'?'':url.pathname.replace(/\/$/,'');
  return {clientId:id, workerUrl:url.origin+path};
}
function redirectUri(){
  const u=new URL(location.href);
  u.hash=''; u.search='';
  if(u.pathname.endsWith('index.html'))u.pathname=u.pathname.slice(0,-'index.html'.length);
  if(!u.pathname.endsWith('/'))u.pathname+='/';
  return u.toString();
}
function session(){
  try{
    const raw=localStorage.getItem(AUTH_KEY);
    if(!raw)return null;
    const o=JSON.parse(raw);
    if(!o||typeof o.token!=='string'||!/^[A-Za-z0-9_]{10,255}$/.test(o.token))return null;
    return {token:o.token, login:typeof o.login==='string'?o.login.slice(0,80):'', gistId:typeof o.gistId==='string'?o.gistId.slice(0,80):'', at:typeof o.at==='string'?o.at:''};
  }catch(e){return null;}
}
function storeSession(next){
  if(!next){localStorage.removeItem(AUTH_KEY);return;}
  localStorage.setItem(AUTH_KEY, JSON.stringify({token:next.token, login:next.login||'', gistId:next.gistId||'', at:next.at||''}));
}
function setStatus(phase, detail){
  status={phase, detail:detail||'', at:status.at};
  paint();
}
function fmtStamp(iso){
  const d=new Date(iso);
  if(!iso||Number.isNaN(d.getTime()))return '';
  const p=n=>String(n).padStart(2,'0');
  return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());
}
function paint(){
  const c=cfg();
  const btn=document.getElementById('ghBtn');
  const badge=document.getElementById('syncBadge');
  const ses=session();
  if(btn){
    if(!c)btn.hidden=true;
    else{
      btn.hidden=false;
      btn.textContent=ses?'Esci':'Accedi';
      btn.title=ses?('Esci da GitHub ('+(ses.login||'account')+'). Il token viene rimosso da questo browser.'):'Accedi con GitHub per copiare i progressi su un Gist segreto del tuo account';
    }
  }
  if(badge){
    if(!c||!ses)badge.hidden=true;
    else{
      badge.hidden=false;
      badge.textContent=status.phase==='saving'?'…':status.phase==='error'||status.phase==='offline'?'!':'✓';
      badge.title=label();
    }
  }
  if(document.getElementById('syncCard'))mountSettings();
}
function label(){
  if(status.phase==='saving')return 'Sincronizzazione in corso…';
  if(status.phase==='offline')return 'Offline: i progressi restano su questo dispositivo. '+(status.detail||'');
  if(status.phase==='error')return 'Errore di sincronizzazione. '+(status.detail||'Riprovo da solo.');
  if(status.phase==='ok')return 'Sincronizzato'+(status.at?' · '+fmtStamp(status.at):'');
  return 'Non connesso';
}
function gh(path, opts){
  const ses=session();
  if(!ses)return Promise.reject(new Error('no-session'));
  opts=opts||{};
  const headers=Object.assign({
    Accept:'application/vnd.github+json',
    Authorization:'Bearer '+ses.token,
    'X-GitHub-Api-Version':'2022-11-28'
  }, opts.headers||{});
  return fetch('https://api.github.com'+path, {method:opts.method||'GET', headers, body:opts.body, keepalive:!!opts.keepalive}).then(async res=>{
    if(res.status===401){storeSession(null); setStatus('error','Sessione GitHub scaduta: accedi di nuovo.'); throw new Error('unauthorized');}
    if(!res.ok){
      const err=new Error('github '+res.status);
      err.status=res.status;
      throw err;
    }
    if(res.status===204)return null;
    return res.json();
  });
}
function envelope(){
  const data=M.sanitizeProgress(B.S);
  return JSON.stringify({app:'bs-prep', v:1, savedAt:new Date().toISOString(), data});
}
async function findGist(ses){
  if(ses.gistId){
    try{
      const one=await gh('/gists/'+encodeURIComponent(ses.gistId));
      if(one&&one.files&&one.files[FILE])return one;
    }catch(e){if(e.message==='unauthorized')throw e;}
  }
  for(let page=1; page<=5; page++){
    const list=await gh('/gists?per_page=100&page='+page);
    if(!Array.isArray(list)||!list.length)break;
    const hits=list.filter(g=>g&&g.files&&g.files[FILE]);
    if(hits.length){
      hits.sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
      return gh('/gists/'+encodeURIComponent(hits[0].id));
    }
    if(list.length<100)break;
  }
  return null;
}
async function pushNow(){
  const ses=session();
  if(!ses||pushLock)return;
  if(typeof navigator!=='undefined'&&navigator.onLine===false){setStatus('offline',''); return;}
  pushLock=true;
  setStatus('saving');
  try{
    const content=envelope();
    let gist=await findGist(ses);
    if(!gist){
      gist=await gh('/gists', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        description:'BS Prep — progressi',
        public:false,
        files:{[FILE]:{content}}
      })});
    }else{
      gist=await gh('/gists/'+encodeURIComponent(gist.id), {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        files:{[FILE]:{content}}
      })});
    }
    const login=gist&&gist.owner&&gist.owner.login?String(gist.owner.login).slice(0,80):ses.login;
    const at=new Date().toISOString();
    status.at=at;
    storeSession({token:ses.token, login, gistId:gist.id, at});
    setStatus('ok');
  }catch(e){
    if(e.message==='unauthorized')return;
    if(e.name==='TypeError'||(typeof navigator!=='undefined'&&navigator.onLine===false))setStatus('offline','');
    else setStatus('error','');
    clearTimeout(timer);
    timer=setTimeout(pushNow, 20000);
  }finally{pushLock=false;}
}
function schedule(){
  if(!session())return;
  clearTimeout(timer);
  timer=setTimeout(pushNow, 2500);
}
async function pull(){
  const ses=session();
  if(!ses)return;
  if(typeof navigator!=='undefined'&&navigator.onLine===false){setStatus('offline'); return;}
  setStatus('saving');
  try{
    const gist=await findGist(ses);
    if(!gist){status.at=ses.at||null; setStatus('ok'); schedule(); return;}
    const file=gist.files&&gist.files[FILE];
    const text=file&&typeof file.content==='string'?file.content:'';
    const remote=M.parseGist(text);
    if(!remote){setStatus('error','Il Gist non contiene progressi riconoscibili.'); return;}
    const merged=M.mergeProgress(B.S, remote);
    const login=gist.owner&&gist.owner.login?String(gist.owner.login).slice(0,80):ses.login;
    storeSession({token:ses.token, login, gistId:gist.id, at:ses.at});
    B.replaceState(merged);
    if(merged.theme)document.documentElement.dataset.theme=merged.theme;
    memory=clone(B.S);
    status.at=ses.at||null;
    setStatus('ok');
    B.route();
    schedule();
  }catch(e){
    if(e.message==='unauthorized')return;
    if(e.name==='TypeError')setStatus('offline');
    else setStatus('error');
  }
}
async function finishOAuth(code, state){
  const c=cfg();
  const expect=sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  if(!c||!expect||expect!==state||typeof code!=='string'){B.toast('Accesso non valido: riprova'); return;}
  setStatus('saving');
  const res=await fetch(c.workerUrl+'/token', {
    method:'POST',
    headers:{'Content-Type':'application/json', Accept:'application/json'},
    body:JSON.stringify({code, state, redirect_uri:redirectUri()})
  });
  let data=null;
  try{data=await res.json();}catch(e){data=null;}
  if(!res.ok||!data||typeof data.access_token!=='string'||!/^[A-Za-z0-9_]{10,255}$/.test(data.access_token)||data.scope!=='gist'){
    setStatus('error','Accesso GitHub non riuscito.');
    B.toast('Accesso GitHub non riuscito');
    return;
  }
  storeSession({token:data.access_token, login:'', gistId:'', at:''});
  B.toast('Accesso eseguito');
  await pull();
}
async function login(){
  const c=cfg();
  if(!c)return;
  setStatus('saving');
  let res;
  try{
    res=await fetch(c.workerUrl+'/state', {headers:{Accept:'application/json'}});
  }catch(e){setStatus('offline'); B.toast('Worker non raggiungibile'); return;}
  let data=null;
  try{data=await res.json();}catch(e){data=null;}
  if(!res.ok||!data||typeof data.state!=='string'||!/^[0-9a-f.]+$/.test(data.state)||data.state.length>200){
    setStatus('error'); B.toast('Impossibile iniziare l’accesso'); return;
  }
  sessionStorage.setItem(STATE_KEY, data.state);
  const auth=new URL('https://github.com/login/oauth/authorize');
  auth.searchParams.set('client_id', c.clientId);
  auth.searchParams.set('redirect_uri', redirectUri());
  auth.searchParams.set('scope', 'gist');
  auth.searchParams.set('state', data.state);
  location.assign(auth.toString());
}
function logout(){
  if(!confirm('Uscire da GitHub su questo browser? I progressi restano sul dispositivo. Il token viene cancellato.'))return;
  storeSession(null);
  sessionStorage.removeItem(STATE_KEY);
  status={phase:'off', detail:'', at:null};
  B.toast('Sei uscito');
  paint();
}
function mountSettings(){
  const card=document.getElementById('syncCard');
  const body=document.getElementById('syncBody');
  if(!card||!body)return;
  const c=cfg();
  if(!c){card.hidden=true; return;}
  card.hidden=false;
  const ses=session();
  body.innerHTML=`<p class="small">Il token di accesso resta <b>solo in questo browser</b> (localStorage, separato dai progressi). Permette soltanto di leggere e scrivere i Gist del tuo account. Esci per rimuoverlo.</p>
    <p class="small muted">Dopo l’accesso i progressi vanno in un Gist segreto tuo, file <code>${FILE}</code>. Un Gist segreto non compare nel profilo, ma chiunque abbia il link può leggerlo: non è un archivio privato.</p>
    <p><b>${esc(label())}</b>${ses&&ses.login?' · '+esc(ses.login):''}</p>
    <div class="row">${ses?'<button class="btn ghost" type="button" id="syncNow">Sincronizza ora</button><button class="btn ghost" type="button" id="syncOut">Esci</button>':'<button class="btn" type="button" id="syncIn">Accedi con GitHub</button>'}</div>`;
  const inn=document.getElementById('syncIn'); if(inn)inn.addEventListener('click', login);
  const out=document.getElementById('syncOut'); if(out)out.addEventListener('click', logout);
  const now=document.getElementById('syncNow'); if(now)now.addEventListener('click', ()=>{pull().catch(()=>setStatus('error'));});
}
function stripQuery(){
  const u=new URL(location.href);
  if(!u.search)return;
  u.search='';
  history.replaceState(null, '', u.pathname+u.search+u.hash);
}
function clone(v){try{return structuredClone(v);}catch(e){return JSON.parse(JSON.stringify(v));}}
function boot(){
  try{bootInner();}catch(e){}
}
function bootInner(){
  memory=clone(B.S);
  window.BSPrepareSave=function(S){M.applyStamps(memory||{}, S, new Date().toISOString()); memory=clone(S);};
  window.BS_onProgress=function(){if(session())schedule();};
  const btn=document.getElementById('ghBtn');
  if(btn&&!btn.dataset.bound){
    btn.dataset.bound='1';
    btn.addEventListener('click', ()=>{if(session())logout(); else login();});
  }
  paint();
  if(!cfg())return;
  const q=new URLSearchParams(location.search);
  if(q.get('error')){stripQuery(); B.toast('Accesso annullato'); return;}
  const code=q.get('code'), state=q.get('state');
  if(code&&state){stripQuery(); finishOAuth(code, state).catch(()=>setStatus('error')); return;}
  if(session())pull().catch(()=>setStatus('error'));
}
document.addEventListener('visibilitychange', ()=>{if(document.visibilityState==='hidden'&&session())pushNow();});
window.addEventListener('pagehide', ()=>{if(session())pushNow();});
window.addEventListener('online', ()=>{if(session()&&status.phase==='offline')pushNow();});
window.BSSync={boot, mountSettings, login, logout, pull, pushNow, finishOAuth, cfg, session, redirectUri};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
