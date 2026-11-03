/* Merge dei progressi. Funzione pura: per ogni voce vince il timestamp più recente.
   Unisce le carte SM-2, non le scarta. Nessun segreto qui dentro. */
(function(root){
'use strict';
const BAD_KEY=/^(?:__proto__|constructor|prototype)$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const LIMITS={
  keys:4000, srs:5000, texts:200, textLen:20000, stories:80, refs:20, mocks:200,
  history:200, mastery:30, activity:800, stamps:8000, str:8000, id:120
};
function plain(v){return v&&typeof v==='object'&&!Array.isArray(v);}
function keyOk(k){return typeof k==='string'&&k.length>0&&k.length<=LIMITS.id&&!BAD_KEY.test(k);}
function clampStr(s,n){s=typeof s==='string'?s:s==null?'':String(s);if(s.length>(n||LIMITS.str))s=s.slice(0,n||LIMITS.str);return s;}
function num(v,min,max,fallback){v=Number(v);if(!Number.isFinite(v))return fallback;if(v<min)return min;if(v>max)return max;return v;}
function int(v,min,max,fallback){v=num(v,min,max,fallback);return v==null?v:Math.round(v);}
function when(stamp,fallback){
  if(typeof stamp==='string'){const t=Date.parse(stamp);if(Number.isFinite(t))return t;}
  if(typeof fallback==='string'&&DATE.test(fallback))return Date.parse(fallback+'T00:00:00Z')||0;
  return 0;
}
function jsonSafe(v,depth){
  if(depth>5)return null;
  if(v==null)return null;
  const t=typeof v;
  if(t==='string')return clampStr(v);
  if(t==='number')return Number.isFinite(v)?v:null;
  if(t==='boolean')return v;
  if(Array.isArray(v))return v.slice(0,40).map(x=>jsonSafe(x,depth+1));
  if(!plain(v))return null;
  const o={};
  const ks=Object.keys(v).filter(keyOk).slice(0,30);
  ks.forEach(k=>{o[k]=jsonSafe(v[k],depth+1);});
  return o;
}
function srsCard(raw){
  if(!plain(raw))return null;
  const due=typeof raw.due==='string'&&DATE.test(raw.due)?raw.due:'1970-01-01';
  const card={
    ef:num(raw.ef,1.3,5,2.5),
    int:int(raw.int,0,36500,0),
    reps:int(raw.reps,0,100000,0),
    due:due,
    n:int(raw.n,0,100000,0),
    lapses:int(raw.lapses,0,100000,0)
  };
  if(typeof raw.last==='string'&&DATE.test(raw.last))card.last=raw.last;
  if(typeof raw.at==='string'&&Number.isFinite(Date.parse(raw.at)))card.at=new Date(raw.at).toISOString();
  return card;
}
function lessonRow(raw){
  if(!plain(raw))return null;
  const row={done:!!raw.done,score:num(raw.score,0,1,0)};
  if(typeof raw.date==='string'&&DATE.test(raw.date))row.date=raw.date;
  if(typeof raw.at==='string'&&Number.isFinite(Date.parse(raw.at)))row.at=new Date(raw.at).toISOString();
  return row;
}
function mapOf(raw,mapFn,cap){
  const out={};
  if(!plain(raw))return out;
  for(const k of Object.keys(raw)){
    if(!keyOk(k))continue;
    if(Object.keys(out).length>=cap)break;
    const v=mapFn(raw[k],k);
    if(v!=null)out[k]=v;
  }
  return out;
}
function masteryArr(raw){
  if(!Array.isArray(raw))return [];
  return raw.filter(x=>typeof x==='number'&&x>=0&&x<=1).slice(-LIMITS.mastery);
}
function listOf(raw,cap){
  if(!Array.isArray(raw))return [];
  const out=[];
  for(const item of raw){
    const clean=jsonSafe(item,0);
    if(clean==null)continue;
    out.push(clean);
    if(out.length>=cap)break;
  }
  return out;
}
function empty(){
  return {v:1,theme:null,checks:{},texts:{},lessons:{},mastery:{},srs:{},streak:{last:null,count:0,best:0},activity:{},psHistory:[],quizHistory:[],stories:[],referees:[],mocks:[],sdDone:{},pyDone:{},algoDone:{},enDone:{},enSpeak:{},stamps:{},created:null};
}
function sanitizeProgress(raw){
  if(typeof raw==='string'){
    if(raw.length>1500000)return null;
    try{raw=JSON.parse(raw,function(k,v){if(k==='__proto__'||k==='constructor'||k==='prototype')return undefined;return v;});}catch(e){return null;}
  }
  if(!plain(raw))return null;
  if(raw.v!=null&&raw.v!==1&&raw.v!=='1')return null;
  const base=empty();
  base.v=1;
  base.theme=raw.theme==='dark'||raw.theme==='light'?raw.theme:null;
  base.checks=mapOf(raw.checks,v=>!!v,LIMITS.keys);
  base.texts=mapOf(raw.texts,v=>clampStr(v,LIMITS.textLen),LIMITS.texts);
  base.lessons=mapOf(raw.lessons,lessonRow,LIMITS.keys);
  base.mastery=mapOf(raw.mastery,masteryArr,LIMITS.keys);
  base.srs=mapOf(raw.srs,srsCard,LIMITS.srs);
  const st=plain(raw.streak)?raw.streak:{};
  base.streak={
    last:typeof st.last==='string'&&DATE.test(st.last)?st.last:null,
    count:int(st.count,0,100000,0),
    best:int(st.best,0,100000,0)
  };
  base.activity=mapOf(raw.activity,(v,k)=>DATE.test(k)?int(v,0,10000,0):null,LIMITS.activity);
  base.psHistory=listOf(raw.psHistory,LIMITS.history);
  base.quizHistory=listOf(raw.quizHistory,LIMITS.history);
  base.stories=listOf(raw.stories,LIMITS.stories).filter(s=>s&&typeof s.id==='string');
  base.referees=listOf(raw.referees,LIMITS.refs).filter(s=>s&&typeof s.id==='string');
  base.mocks=listOf(raw.mocks,LIMITS.mocks);
  base.sdDone=mapOf(raw.sdDone,v=>int(v,0,5,0),LIMITS.keys);
  base.pyDone=mapOf(raw.pyDone,v=>!!v,LIMITS.keys);
  base.algoDone=mapOf(raw.algoDone,v=>!!v,LIMITS.keys);
  base.enDone=mapOf(raw.enDone,v=>!!v,LIMITS.keys);
  base.enSpeak=mapOf(raw.enSpeak,v=>int(v,0,5,0),LIMITS.keys);
  base.stamps=mapOf(raw.stamps,v=>typeof v==='string'&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():null,LIMITS.stamps);
  base.created=typeof raw.created==='string'&&Number.isFinite(Date.parse(raw.created))?new Date(raw.created).toISOString():null;
  return base;
}
function newer(aStamp,bStamp,aFall,bFall){
  return when(aStamp,aFall)>=when(bStamp,bFall);
}
function pick(path,A,B,stA,stB,aFall,bFall){
  const left=stA[path], right=stB[path];
  return newer(left,right,aFall,bFall)?A:B;
}
function mergeMaps(a,b,stA,stB,prefix,score){
  const out={};
  const keys=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);
  keys.forEach(k=>{
    const A=a?a[k]:undefined, B=b?b[k]:undefined;
    if(A==null){out[k]=B;return;}
    if(B==null){out[k]=A;return;}
    const path=prefix+k;
    if(stA[path]||stB[path])out[k]=pick(path,A,B,stA,stB);
    else out[k]=score(A,B);
  });
  return out;
}
function mergeSrs(a,b,stA,stB){
  const out={};
  new Set([...Object.keys(a),...Object.keys(b)]).forEach(id=>{
    const A=a[id], B=b[id];
    if(!A){out[id]=B;return;}
    if(!B){out[id]=A;return;}
    const path='srs:'+id;
    const ta=when(stA[path]||A.at,A.last), tb=when(stB[path]||B.at,B.last);
    if(ta!==tb)out[id]=ta>tb?A:B;
    else out[id]=(A.n||0)>=(B.n||0)?A:B;
  });
  return out;
}
function mergeLessons(a,b,stA,stB){
  const out={};
  new Set([...Object.keys(a),...Object.keys(b)]).forEach(id=>{
    const A=a[id], B=b[id];
    if(!A){out[id]=B;return;}
    if(!B){out[id]=A;return;}
    const ta=when(stA['lesson:'+id]||A.at,A.date), tb=when(stB['lesson:'+id]||B.at,B.date);
    let win=ta>=tb?A:B;
    if(ta===tb){
      win=Object.assign({},A.done||B.done?{done:true}:{},A,B);
      win.done=!!(A.done||B.done);
      win.score=Math.max(A.score||0,B.score||0);
      win.date=A.date&&B.date?(A.date>B.date?A.date:B.date):(A.date||B.date);
    }
    out[id]=win;
  });
  return out;
}
function mergeById(a,b,stA,stB,prefix){
  const map={};
  function put(list,st){
    (list||[]).forEach(item=>{
      if(!item||typeof item.id!=='string')return;
      const prev=map[item.id];
      if(!prev){map[item.id]={item:item,st:st};return;}
      const pa=prev.st[prefix+item.id], pb=st[prefix+item.id];
      if(when(pb)>when(pa))map[item.id]={item:item,st:st};
    });
  }
  put(a,stA); put(b,stB);
  return Object.keys(map).map(k=>map[k].item);
}
function mergeHistory(a,b,cap){
  const seen=new Set();
  const out=[];
  [...(b||[]),...(a||[])].forEach(item=>{
    let key;
    try{key=JSON.stringify(item);}catch(e){return;}
    if(seen.has(key))return;
    seen.add(key);
    out.push(item);
  });
  out.sort((x,y)=>String((y&&y.date)||'').localeCompare(String((x&&x.date)||'')));
  return out.slice(0,cap);
}
function mergeMastery(a,b,stA,stB){
  const out={};
  new Set([...Object.keys(a),...Object.keys(b)]).forEach(k=>{
    const A=a[k]||[], B=b[k]||[];
    const path='mastery:'+k;
    if(stA[path]||stB[path])out[k]=when(stA[path])>=when(stB[path])?A:B;
    else out[k]=A.concat(B).slice(-LIMITS.mastery);
  });
  return out;
}
function mergeStreak(a,b){
  const left=a||{last:null,count:0,best:0}, right=b||{last:null,count:0,best:0};
  const win=(left.last||'')>=(right.last||'')?left:right;
  return {last:win.last,count:win.count,best:Math.max(left.best||0,right.best||0,win.best||0)};
}
function mergeActivity(a,b){
  const out={};
  new Set([...Object.keys(a),...Object.keys(b)]).forEach(k=>{out[k]=Math.max(a[k]||0,b[k]||0);});
  return out;
}
function mergeProgress(local,remote){
  const L=sanitizeProgress(local)||empty();
  const R=sanitizeProgress(remote);
  if(!R)return L;
  const sL=L.stamps, sR=R.stamps;
  const checks=mergeMaps(L.checks,R.checks,sL,sR,'check:',(A,B)=>A||B);
  const texts=mergeMaps(L.texts,R.texts,sL,sR,'text:',(A,B)=>(String(A).length>=String(B).length?A:B));
  const sd=mergeMaps(L.sdDone,R.sdDone,sL,sR,'sd:',(A,B)=>Math.max(A||0,B||0));
  const py=mergeMaps(L.pyDone,R.pyDone,sL,sR,'py:',(A,B)=>A||B);
  const algo=mergeMaps(L.algoDone,R.algoDone,sL,sR,'algo:',(A,B)=>A||B);
  const enDone=mergeMaps(L.enDone,R.enDone,sL,sR,'enDone:',(A,B)=>A||B);
  const enSpeak=mergeMaps(L.enSpeak,R.enSpeak,sL,sR,'enSpeak:',(A,B)=>Math.max(A||0,B||0));
  const themePathL=sL.theme, themePathR=sR.theme;
  let theme=L.theme;
  if(themePathL||themePathR)theme=when(themePathL)>=when(themePathR)?L.theme:R.theme;
  else if(!theme)theme=R.theme;
  const created=[L.created,R.created].filter(Boolean).sort()[0]||null;
  return sanitizeProgress({
    v:1, theme, checks, texts,
    lessons:mergeLessons(L.lessons,R.lessons,sL,sR),
    mastery:mergeMastery(L.mastery,R.mastery,sL,sR),
    srs:mergeSrs(L.srs,R.srs,sL,sR),
    streak:mergeStreak(L.streak,R.streak),
    activity:mergeActivity(L.activity,R.activity),
    psHistory:mergeHistory(L.psHistory,R.psHistory,LIMITS.history),
    quizHistory:mergeHistory(L.quizHistory,R.quizHistory,LIMITS.history),
    stories:mergeById(L.stories,R.stories,sL,sR,'story:'),
    referees:mergeById(L.referees,R.referees,sL,sR,'ref:'),
    mocks:mergeHistory(L.mocks,R.mocks,LIMITS.mocks),
    sdDone:sd, pyDone:py, algoDone:algo, enDone, enSpeak,
    stamps:Object.assign({},sR,sL,laterStamps(sL,sR)),
    created
  });
}
function laterStamps(a,b){
  const out={};
  new Set([...Object.keys(a),...Object.keys(b)]).forEach(k=>{
    out[k]=when(a[k])>=when(b[k])?(a[k]||b[k]):b[k];
  });
  return out;
}
function stripMeta(v){
  if(!plain(v))return v;
  const o={};
  Object.keys(v).forEach(k=>{if(k!=='at')o[k]=v[k];});
  return o;
}
function applyStamps(prev,next,iso){
  if(!plain(next))return next;
  const p=plain(prev)?prev:{};
  const stamps=Object.assign({},plain(next.stamps)?next.stamps:{});
  function changed(path,before,after){
    let same;
    try{same=JSON.stringify(before)===JSON.stringify(after);}catch(e){same=false;}
    if(!same)stamps[path]=iso;
  }
  const ps=plain(p.srs)?p.srs:{}, ns=plain(next.srs)?next.srs:{};
  Object.keys(ns).forEach(id=>{
    if(!keyOk(id))return;
    const before=ps[id]?stripMeta(ps[id]):undefined;
    const after=stripMeta(ns[id]);
    let same;
    try{same=JSON.stringify(before)===JSON.stringify(after);}catch(e){same=false;}
    if(!same&&plain(ns[id])){ns[id].at=iso;stamps['srs:'+id]=iso;}
  });
  const pl=plain(p.lessons)?p.lessons:{}, nl=plain(next.lessons)?next.lessons:{};
  Object.keys(nl).forEach(id=>{
    if(!keyOk(id)||!plain(nl[id]))return;
    const before=pl[id]?stripMeta(pl[id]):undefined;
    let same;
    try{same=JSON.stringify(before)===JSON.stringify(stripMeta(nl[id]));}catch(e){same=false;}
    if(!same){nl[id].at=iso;stamps['lesson:'+id]=iso;}
  });
  [['checks','check:'],['texts','text:'],['sdDone','sd:'],['pyDone','py:'],['algoDone','algo:'],['enDone','enDone:'],['enSpeak','enSpeak:']].forEach(([field,prefix])=>{
    const a=plain(p[field])?p[field]:{}, b=plain(next[field])?next[field]:{};
    Object.keys(b).forEach(k=>{if(keyOk(k))changed(prefix+k,a[k],b[k]);});
  });
  const pm=plain(p.mastery)?p.mastery:{}, nm=plain(next.mastery)?next.mastery:{};
  Object.keys(nm).forEach(k=>{if(keyOk(k))changed('mastery:'+k,pm[k],nm[k]);});
  if((p.theme||null)!==(next.theme||null))stamps.theme=iso;
  (Array.isArray(next.stories)?next.stories:[]).forEach(s=>{
    if(!s||typeof s.id!=='string')return;
    const old=(Array.isArray(p.stories)?p.stories:[]).find(x=>x&&x.id===s.id);
    let same=false;
    try{same=JSON.stringify(old)===JSON.stringify(s);}catch(e){same=false;}
    if(!same)stamps['story:'+s.id]=iso;
  });
  (Array.isArray(next.referees)?next.referees:[]).forEach(s=>{
    if(!s||typeof s.id!=='string')return;
    const old=(Array.isArray(p.referees)?p.referees:[]).find(x=>x&&x.id===s.id);
    let same=false;
    try{same=JSON.stringify(old)===JSON.stringify(s);}catch(e){same=false;}
    if(!same)stamps['ref:'+s.id]=iso;
  });
  const keys=Object.keys(stamps);
  if(keys.length>LIMITS.stamps)keys.slice(0,keys.length-LIMITS.stamps).forEach(k=>{delete stamps[k];});
  next.stamps=stamps;
  return next;
}
function parseGist(text){
  if(typeof text!=='string'||text.length>1500000)return null;
  let body;
  try{body=JSON.parse(text,function(k,v){if(k==='__proto__'||k==='constructor'||k==='prototype')return undefined;return v;});}
  catch(e){return null;}
  if(!plain(body))return null;
  const data=body.data&&plain(body.data)?body.data:body;
  if(body.app&&body.app!=='bs-prep')return null;
  return sanitizeProgress(data);
}
root.BSMerge={sanitizeProgress,mergeProgress,applyStamps,parseGist,empty};
})(typeof window!=='undefined'?window:globalThis);
