/* BS Prep — app principale. Tutto offline, dati in localStorage. */
(function(){
'use strict';
const KEY='bsprep.v1';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pct=x=>Math.round(Math.max(0,Math.min(1,x||0))*100);
const dstr=d=>{d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const today=()=>dstr();
const addDays=(n)=>{const d=new Date();d.setDate(d.getDate()+n);return dstr(d)};
const fmtDate=s=>{if(!s)return '';const [y,m,d]=s.slice(0,10).split('-');return `${d}/${m}/${y}`};

/* ---------------- STATO ---------------- */
function defaults(){return {v:1,theme:null,checks:{},texts:{},lessons:{},mastery:{},srs:{},streak:{last:null,count:0,best:0},activity:{},psHistory:[],quizHistory:[],stories:[],referees:[],mocks:[],sdDone:{},pyDone:{},algoDone:{},enDone:{},enSpeak:{},created:new Date().toISOString()}}
function load(){try{const raw=localStorage.getItem(KEY);if(!raw)return defaults();return Object.assign(defaults(),JSON.parse(raw))}catch(e){return defaults()}}
let S=load();
let saveT=null;
function save(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('⚠️ Impossibile salvare (spazio esaurito o modalità privata)')}},150)}
function saveNow(){clearTimeout(saveT);try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
window.addEventListener('beforeunload',saveNow);
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2200)}

/* ---------------- STREAK & ATTIVITÀ ---------------- */
function touch(){const t=today();S.activity[t]=(S.activity[t]||0)+1;const st=S.streak;if(st.last!==t){st.count=(st.last===addDays(-1))?st.count+1:1;st.last=t;st.best=Math.max(st.best||0,st.count)}save();updateBadges()}
function streakNow(){const st=S.streak;if(!st.last)return 0;return (st.last===today()||st.last===addDays(-1))?st.count:0}

/* ---------------- PADRONANZA ---------------- */
function record(topic,score){if(!TOPICS[topic])return;const a=S.mastery[topic]||(S.mastery[topic]=[]);a.push(Math.max(0,Math.min(1,score)));if(a.length>30)a.splice(0,a.length-30);touch()}
function mastery(topic){const a=S.mastery[topic]||[];if(!a.length)return {acc:0,n:0,level:0};
  // media pesata: i risultati recenti contano di più
  let w=0,s=0;a.forEach((x,i)=>{const wi=1+i/a.length;w+=wi;s+=x*wi});const acc=s/w;const cov=Math.min(1,a.length/10);
  return {acc,n:a.length,level:acc*(0.4+0.6*cov)};}
function mLabel(l){return l>=.85?'Padroneggiato':l>=.65?'Buono':l>=.4?'In corso':l>0?'Iniziato':'Da iniziare'}
function weakTopics(){return Object.keys(TOPICS).map(t=>({t,...mastery(t)})).filter(x=>x.n>=3&&x.acc<.65).sort((a,b)=>a.acc-b.acc)}
const lessonsOf=t=>LESSONS.filter(l=>l.topic===t);
const firstLesson=t=>{const ls=lessonsOf(t);return (ls.find(l=>!S.lessons[l.id]||!S.lessons[l.id].done)||ls[0]||{}).id};

/* ---------------- SRS (SM-2) ---------------- */
const CARDS={};
LESSONS.forEach(l=>(l.cards||[]).forEach((c,i)=>{CARDS['L:'+l.id+':'+i]={id:'L:'+l.id+':'+i,topic:l.topic,front:esc(c[0]),back:esc(c[1]),lesson:l.id}}));
Object.keys(QUIZ).forEach(t=>QUIZ[t].forEach((q,i)=>{CARDS['Q:'+t+':'+i]={id:'Q:'+t+':'+i,topic:t,front:esc(q[0]),back:'<b>'+esc(q[1][q[2]])+'</b><br><span class="muted">'+esc(q[3])+'</span>',lesson:firstLesson(t)}}));
(window.EN_EX||[]).forEach(ex=>{
  const back=(ex.type==='choice'||ex.type==='gap')
    ?'<b>'+esc(ex.options[ex.answer])+'</b><br><span class="muted">'+esc(ex.explanation)+'</span>'
    :'<b>'+esc(ex.answer)+'</b><br><span class="muted">'+esc(ex.explanation)+'</span>';
  CARDS['EX:'+ex.id]={id:'EX:'+ex.id,topic:ex.topic,front:esc(ex.prompt),back,lesson:ex.lesson||firstLesson(ex.topic),hideInDeck:true};
});
(window.EN_SPEAK||[]).forEach(sp=>{
  CARDS['SP:'+sp.id]={id:'SP:'+sp.id,topic:'en-speaking',front:esc(sp.question),back:'<b>'+esc(sp.sample)+'</b><br><span class="muted">'+esc(sp.notes||'')+'</span>',lesson:sp.lesson||firstLesson('en-speaking'),hideInDeck:true};
});
function srsAdd(id,due){if(!CARDS[id]||S.srs[id])return false;S.srs[id]={ef:2.5,int:0,reps:0,due:due||today(),n:0,lapses:0};return true}
function srsGrade(id,q){if(!S.srs[id])srsAdd(id);const c=S.srs[id];c.n++;
  if(q<3){c.reps=0;c.int=0;c.lapses++;c.due=today()}
  else{c.reps++;c.int=c.reps===1?1:c.reps===2?(q===5?4:3):Math.round(c.int*c.ef*(q===3?0.8:1));c.ef=Math.max(1.3,c.ef+0.1-(5-q)*(0.08+(5-q)*0.02));c.due=addDays(c.int)}
  c.last=today();record(CARDS[id].topic,q>=4?1:q===3?.6:0);save()}
function dueCards(){const t=today();return Object.keys(S.srs).filter(id=>CARDS[id]&&S.srs[id].due<=t)}
function updateBadges(){$('#streakBadge').textContent='🔥 '+streakNow();$('#dueBadge').textContent='🧠 '+dueCards().length;const cu=$('#contentUpdated');if(cu)cu.textContent='Ultimo aggiornamento contenuti: '+(window.CONTENT_UPDATED?fmtDate(window.CONTENT_UPDATED):'—')}

/* ---------------- PROGRESSO SEZIONI ---------------- */
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
function lessonFrac(sec){const ls=LESSONS.filter(l=>TOPICS[l.topic].section===sec);return avg(ls.map(l=>S.lessons[l.id]&&S.lessons[l.id].done?1:0))}
function checkFrac(name){const n=CHECKLISTS[name].length;let c=0;for(let i=0;i<n;i++)if(S.checks[name+':'+i])c++;return c/n}
const COVER_FIELDS=['cl_name','cl_motivation','cl_qualities','cl_ai','cl_why','cl_achievement'];
const CORE_TRAITS=['ownership','ambition','team','failure','conflict','simplify'];
function sectionParts(sec){const ml=ts=>avg(ts.map(t=>mastery(t).level));
  if(sec==='cv')return [['Lezioni',lessonFrac('cv')],['Checklist CV',checkFrac('cv')],['Checklist GitHub',checkFrac('github')],['Lettera',avg(COVER_FIELDS.map(f=>(S.texts[f]||'').trim().length>10?1:0))],['Bullet',mastery('cv').level]];
  if(sec==='ps')return [['Lezioni',lessonFrac('ps')],['Padronanza test',ml(['seq','arith','logic','matrix','estim'])],['Problemi di algoritmi',Math.min(1,Object.values(S.algoDone).filter(Boolean).length/15)],['Test svolti',Math.min(1,S.psHistory.length/8)]];
  if(sec==='tech')return [['Lezioni',lessonFrac('tech')],['Padronanza quiz',ml(['python','k8s','grpc','docker','sysdesign','simplify'])],['Esercizi Python',avg(PY_EX.map((_,i)=>S.pyDone[i]?1:0))],['System design',avg(SD_PROMPTS.map(p=>S.sdDone[p.id]?1:0))]];
  if(sec==='behav'){const cov=CORE_TRAITS.filter(t=>S.stories.some(s=>(s.traits||[]).includes(t))).length/CORE_TRAITS.length;return [['Lezioni',lessonFrac('behav')],['Storie STAR (5+)',Math.min(1,S.stories.length/5)],['Copertura tratti',cov],['Simulazioni (5+)',Math.min(1,S.mocks.length/5)]]}
  if(sec==='refs')return [['Lezione',lessonFrac('refs')],['Checklist',checkFrac('refs')],['Referenze (2+)',Math.min(1,S.referees.filter(r=>r.name).length/2)]];
  if(sec==='en'){const ex=window.EN_EX||[],sp=window.EN_SPEAK||[];
    const exF=ex.length?ex.filter(e=>S.enDone[e.id]).length/ex.length:0;
    const spF=sp.length?sp.filter(e=>S.enSpeak[e.id]>=3).length/sp.length:0;
    return [['Lezioni',lessonFrac('en')],['Padronanza',ml(['en-vocab','en-mistakes','en-writing','en-speaking'])],['Esercizi',exF],['Speaking',spF]]}
  return []}
const secProg=sec=>avg(sectionParts(sec).map(p=>p[1]));
const WEIGHTS={cv:.16,ps:.20,tech:.20,behav:.16,refs:.08,en:.20};
const readiness=()=>Object.keys(WEIGHTS).reduce((s,k)=>s+WEIGHTS[k]*secProg(k),0);
const bar=(v,weak)=>`<div class="bar${weak?' weak':''}" role="progressbar" aria-valuenow="${pct(v)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct(v)}%"></i></div>`;

/* ---------------- MCQ GENERICO ---------------- */
// q = {q (html), opts (html strings), ans, expl (html), svg?}
function renderMCQ(box,q,onAnswer,opts){opts=opts||{};
  box.innerHTML=`<div class="qtext">${q.q}</div><div class="${q.svg?'mopts':''}">${q.opts.map((o,i)=>`<button class="${q.svg?'':'opt'}" data-i="${i}" aria-label="Opzione ${i+1}">${q.svg?o:(String.fromCharCode(65+i)+'. '+o)}</button>`).join('')}</div><div class="after"></div>`;
  $$('button[data-i]',box).forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.i;const ok=i===q.ans;
    $$('button[data-i]',box).forEach(x=>{x.disabled=true;if(!opts.hide){if(+x.dataset.i===q.ans)x.classList.add('ok');else if(+x.dataset.i===i)x.classList.add('bad')}else if(+x.dataset.i===i)x.style.outline='3px solid var(--accent)'});
    if(!opts.hide)$('.after',box).innerHTML=`<div class="expl"><b>${ok?'✅ Corretto':'❌ Sbagliato'}</b> — ${q.expl}</div>`;
    onAnswer&&onAnswer(ok,i)}))}
function quizItem(topic,idx){const r=QUIZ[topic][idx];const order=shuffle(r[1].map((_,i)=>i));return {q:'<p><b>'+esc(r[0])+'</b></p>',opts:order.map(i=>esc(r[1][i])),ans:order.indexOf(r[2]),expl:esc(r[3]),topic,cid:'Q:'+topic+':'+idx}}
function checkItem(c){const order=shuffle(c[1].map((_,i)=>i));return {q:'<p><b>'+esc(c[0])+'</b></p>',opts:order.map(i=>esc(c[1][i])),ans:order.indexOf(c[2]),expl:esc(c[3])}}

/* ---------------- TIMER ---------------- */
let TIMERS=[];
function clearTimers(){TIMERS.forEach(clearInterval);TIMERS=[]}
function countdown(el,secs,onEnd,onTick){let left=secs;const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');const ctl={paused:false,left:()=>left,stop:()=>clearInterval(h)};
  const draw=()=>{el.textContent=fmt(left);el.classList.toggle('low',left<=Math.min(30,secs*.2))};draw();
  const h=setInterval(()=>{if(ctl.paused)return;left--;draw();onTick&&onTick(left);if(left<=0){clearInterval(h);onEnd&&onEnd()}},1000);TIMERS.push(h);return ctl}

/* ---------------- ROUTER ---------------- */
const ROUTES={};
function go(h){location.hash=h}
function route(){clearTimers();const parts=(location.hash.replace(/^#\/?/,'')||'home').split('/');const r=parts[0];
  $$('#sidenav a').forEach(a=>a.classList.toggle('active',a.dataset.nav===r||(r==='lesson'&&a.dataset.nav==='course')));
  $('#sidenav').classList.remove('open');
  const fn=ROUTES[r]||ROUTES.home;const app=$('#app');app.innerHTML='';fn(app,parts.slice(1));window.scrollTo(0,0);updateBadges()}
window.addEventListener('hashchange',route);
function tabs(base,list,cur){return `<div class="tabs">${list.map(([k,l])=>`<a href="#/${base}/${k}" class="${k===cur?'active':''}">${l}</a>`).join('')}</div>`}
function lessonList(sec){const ls=LESSONS.filter(l=>TOPICS[l.topic].section===sec);return `<div class="grid">${ls.map(l=>{const d=S.lessons[l.id];const m=mastery(l.topic);return `<a class="card" style="text-decoration:none;color:inherit" href="#/lesson/${l.id}"><div class="spread"><span class="tag">${esc(TOPICS[l.topic].label)}</span>${d&&d.done?`<span class="tag ok">✓ ${pct(d.score)}%</span>`:'<span class="tag">da fare</span>'}</div><h3>${esc(l.title)}</h3><div class="muted small">⏱ ${l.mins} min · padronanza argomento ${pct(m.level)}%</div></a>`}).join('')}</div>`}

/* ---------------- DELEGA EVENTI ---------------- */
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.bind){S.texts[el.dataset.bind]=el.value;save();if(el.dataset.live)window.dispatchEvent(new CustomEvent('live:'+el.dataset.live))}});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.check){S.checks[el.dataset.check]=el.checked;touch();save();const p=el.closest('[data-prog]');if(p){const name=p.dataset.prog;$('.cprog',p).innerHTML=bar(checkFrac(name))+`<div class="small muted">${pct(checkFrac(name))}% completato</div>`}}});
function checklist(name){return `<div class="card" data-prog="${name}"><div class="cprog">${bar(checkFrac(name))}<div class="small muted">${pct(checkFrac(name))}% completato</div></div>${CHECKLISTS[name].map((t,i)=>`<label class="check"><input type="checkbox" data-check="${name}:${i}" ${S.checks[name+':'+i]?'checked':''}><span>${esc(t)}</span></label>`).join('')}</div>`}
const tval=k=>esc(S.texts[k]||'');

$('#menuBtn').addEventListener('click',()=>$('#sidenav').classList.toggle('open'));
$('#themeBtn').addEventListener('click',()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;S.theme=t;save()});
window.BS={get S(){return S},streakNow,route,touch,save,saveNow,record,mastery,srsGrade,srsAdd,dueCards,readiness,secProg,CARDS,ROUTES,esc,$,$$,shuffle,pct,bar,tabs,lessonList,checklist,tval,toast,countdown,clearTimers,renderMCQ,quizItem,checkItem,today,fmtDate,avg,weakTopics,firstLesson,lessonsOf,mLabel,sectionParts,COVER_FIELDS,CORE_TRAITS,go,replaceState:(ns)=>{S=Object.assign(defaults(),ns);saveNow()},resetState:()=>{S=defaults();saveNow()}};
})();
