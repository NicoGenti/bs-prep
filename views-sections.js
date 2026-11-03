/* Viste delle sezioni: CV, Problem solving, Tecnico, Comportamentale, Referenze */
(function(){
'use strict';
const B=window.BS,{esc,$,$$,pct,bar,tabs,tval}=B;
const T=window.TOPICS;
function head(sec,sub){return `<h1>${window.SECTIONS[sec].icon} ${window.SECTIONS[sec].label}</h1>${sub?`<p class="muted">${sub}</p>`:''}<div class="card"><div class="spread small"><b>Progresso sezione</b><span>${pct(B.secProg(sec))}%</span></div>${bar(B.secProg(sec))}</div>`}
const field=(k,lab,ph,area,live)=>`<label for="f_${k}">${lab}</label>${area?`<textarea id="f_${k}" data-bind="${k}" ${live?`data-live="${live}"`:''} placeholder="${esc(ph||'')}">${tval(k)}</textarea>`:`<input type="text" id="f_${k}" data-bind="${k}" ${live?`data-live="${live}"`:''} placeholder="${esc(ph||'')}" value="${tval(k)}">`}`;
function copyText(txt){if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(txt).then(()=>B.toast('Copiato negli appunti'),()=>fallback())}else fallback();
  function fallback(){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');B.toast('Copiato negli appunti')}catch(e){B.toast('Seleziona e copia a mano')}ta.remove()}}
function liveListen(name,fn){const h=()=>fn();window.addEventListener('live:'+name,h);const off=()=>{window.removeEventListener('live:'+name,h);window.removeEventListener('hashchange',off)};window.addEventListener('hashchange',off)}
function ratingRow(name,cur){return `<div class="row rating" data-rating="${name}">${[1,2,3,4,5].map(n=>`<button class="btn ghost sm ${cur===n?'sel':''}" data-v="${n}">${n}</button>`).join('')}</div>`}
function bindRatings(root,store){$$('[data-rating]',root).forEach(r=>$$('button',r).forEach(b=>b.addEventListener('click',()=>{store[r.dataset.rating]=+b.dataset.v;$$('button',r).forEach(x=>x.classList.toggle('sel',x===b))})))}

/* ======================= CV ======================= */
const VERBS='built led designed implemented reduced increased automated migrated launched created developed optimized optimised improved cut delivered refactored owned drove scaled shipped wrote introduced mentored architected replaced deployed streamlined accelerated eliminated simplified resolved integrated rebuilt analyzed analysed saved grew achieved established prototyped trained halved doubled tripled converted containerized containerised modernized modernised debugged diagnosed rewrote unified standardized standardised spearheaded initiated designed engineered maintained coordinated organized organised negotiated taught onboarded proposed identified fixed boosted lowered raised'.split(' ');
const WEAK=['responsible for','worked on','helped','involved in','participated','tasks included','duties','various','assisted','in charge of','dealt with','was part of','etc'];
const IMPACT=/(reduc|increas|cut|sav|fast|slow|latenc|cost|revenue|user|customer|%|time|error|bug|uptime|availab|throughput|from .+ to|incident|downtime|release|deploy|adoption|conversion|memory|cpu|€|\$|hours|minutes|days|weeks|x\b)/i;
function analyzeBullet(b){const t=b.trim().replace(/^[-•*]\s*/,'');const words=t.split(/\s+/).filter(Boolean);const first=(words[0]||'').toLowerCase().replace(/[^a-z]/g,'');const fb=[];let score=0;
  const verb=VERBS.includes(first)||(/ed$/.test(first)&&first.length>4);if(verb){score++;fb.push(['ok','Inizia con un verbo d’azione ("'+esc(words[0])+'").'])}else fb.push(['bad','Inizia con un verbo d’azione al passato (Built, Reduced, Automated…), non con un nome o "I".']);
  if(/\d/.test(t)){score++;fb.push(['ok','Contiene un numero.'])}else fb.push(['bad','Nessun numero: aggiungi una quantità (%, tempo, utenti, servizi, costi).']);
  if(words.length>=8&&words.length<=30){score++;fb.push(['ok','Lunghezza giusta ('+words.length+' parole).'])}else fb.push(['warn',words.length<8?'Troppo corto ('+words.length+' parole): aggiungi contesto e risultato.':'Troppo lungo ('+words.length+' parole): punta a 8–30 parole.']);
  if(IMPACT.test(t)){score++;fb.push(['ok','Descrive un impatto o un risultato.'])}else fb.push(['bad','Manca l’impatto: cosa è cambiato grazie a te? (più veloce, meno errori, meno costi…)']);
  const w=WEAK.find(p=>t.toLowerCase().includes(p));if(!w){score++}else fb.push(['bad','Formula debole: "'+w+'". Sostituiscila con ciò che hai fatto concretamente.']);
  if(/\bwe\b|\bour\b/i.test(t))fb.push(['warn','Usa "we/our": nel CV chiarisci il TUO contributo (e non esagerare: le referenze lo verificano).']);
  return {t,score,fb}}
B.ROUTES.cv=function(app,args){const tab=args[0]||'lezioni';
  app.innerHTML=head('cv','CV breve in inglese con dati quantitativi, lettera facoltativa ma apprezzata, profilo GitHub curato.')+tabs('cv',[['lezioni','Lezioni'],['checklist','Checklist CV'],['bullet','Bullet trainer'],['lettera','Lettera'],['github','GitHub']],tab)+'<div id="tab"></div>';
  const box=$('#tab');
  if(tab==='lezioni')box.innerHTML=B.lessonList('cv');
  else if(tab==='checklist')box.innerHTML='<p class="small muted">Spunta solo ciò che è davvero vero per il tuo CV attuale.</p>'+B.checklist('cv');
  else if(tab==='github')box.innerHTML='<p class="small muted">Il modulo di candidatura ha un campo GitHub: chi lo apre deve capire in 30 secondi cosa sai fare.</p>'+B.checklist('github')+'<p><a href="#/lesson/cv-github">📖 Lezione: profilo GitHub</a></p>';
  else if(tab==='bullet'){box.innerHTML=`<div class="card"><h3 style="margin-top:0">Esempi: debole → forte</h3><table><tr><th>❌ Debole</th><th>✅ Forte</th></tr>${window.BULLET_EX.map(e=>`<tr><td>${esc(e[0])}</td><td>${esc(e[1])}</td></tr>`).join('')}</table></div>
    <div class="card"><h3 style="margin-top:0">Riscrivi i tuoi bullet</h3><p class="small muted">Un bullet per riga, in inglese. Il controllo è euristico (verbo d’azione, numero, lunghezza, impatto, formule deboli): non sostituisce il giudizio di una persona.</p>${field('bullets','I tuoi bullet','For a sample reading club, cut the weekly note from about 2 hours to about 25 minutes with a shared template.',true)}<button class="btn" id="an">Analizza</button><div id="fbk"></div></div>`;
    $('#an').addEventListener('click',()=>{const lines=(B.S.texts.bullets||'').split('\n').filter(l=>l.trim());if(!lines.length){B.toast('Scrivi almeno un bullet');return}
      const res=lines.map(analyzeBullet);const av=B.avg(res.map(r=>r.score/5));B.record('cv',av);
      $('#fbk').innerHTML=`<p><b>Punteggio medio: ${pct(av)}%</b></p>`+res.map(r=>`<div class="card"><div class="spread"><i>${esc(r.t)}</i><span class="tag ${r.score>=4?'ok':r.score>=3?'warn':'bad'}">${r.score}/5</span></div><ul class="fb small">${r.fb.map(f=>`<li>${f[0]==='ok'?'✅':f[0]==='warn'?'⚠️':'❌'} ${f[1]}</li>`).join('')}</ul></div>`).join('')})}
  else if(tab==='lettera'){box.innerHTML=`<div class="callout small">La lettera è <b>facoltativa ma apprezzata</b>. Breve (200–350 parole), in inglese, specifica. Niente frasi generiche come "I am passionate about technology".</div>
    <div class="card">${field('cl_name','Il tuo nome','Nome Cognome')}
    ${field('cl_qualities','1. Chi sei in 2 frasi (in inglese)','I am a software engineer who likes small, measurable improvements. This sentence is only a sample.',true,'cl')}
    ${field('cl_achievement','2. Un risultato concreto con numeri','For a sample reading club I cut weekly-note prep from about 2 hours to about 25 minutes with a shared template. Fictional example.',true,'cl')}
    ${field('cl_why','3. Come impari in fretta (potenziale di lungo periodo)','When we adopted Kubernetes I learned it from scratch and within three months was running the migration of our main API.',true,'cl')}
    ${field('cl_ai','4. Come usi l’AI per amplificare il tuo impatto','I use AI assistants daily to explore unfamiliar codebases, draft tests and review my own changes, which roughly doubled my throughput on routine tasks.',true,'cl')}
    ${field('cl_motivation','5. Perché Bending Spoons, nello specifico','I am drawn to your focus on simplifying products relentlessly and on giving small teams real ownership…',true,'cl')}</div>
    <div class="card"><div class="spread"><h3 style="margin:0">Bozza (inglese)</h3><span class="small muted" id="wc"></span></div><div class="copybox" id="letter"></div><div class="row" style="margin-top:.6rem"><button class="btn" id="copy">📋 Copia</button></div><p class="small muted">Rileggila ad alta voce, togli ogni frase che potrebbe scrivere chiunque, e verifica che ogni affermazione sia vera e difendibile in colloquio.</p></div>`;
    const build=()=>{const g=k=>(B.S.texts[k]||'').trim();const parts=['Dear Bending Spoons Hiring Team,','I am applying for the Software Engineer position. '+(g('cl_qualities')||'[Who you are in two sentences]'),g('cl_achievement')?'One result I am proud of: '+g('cl_achievement').replace(/^One result I am proud of:\s*/i,''):'[A concrete, quantified achievement]',g('cl_why')||'[Evidence that you learn fast]',g('cl_ai')||'[How you use AI to amplify your impact]',g('cl_motivation')?'Why Bending Spoons: '+g('cl_motivation'):'[Why Bending Spoons, specifically]','Thank you for your time and consideration. I would be glad to discuss how I can contribute.','Best regards,\n'+(g('cl_name')||'[Your name]')];
      const txt=parts.join('\n\n');$('#letter').textContent=txt;const wc=txt.split(/\s+/).filter(Boolean).length;$('#wc').textContent=wc+' parole '+(wc<200?'(un po’ corta)':wc>350?'(troppo lunga)':'(ok)');return txt};
    build();liveListen('cl',build);$('#copy').addEventListener('click',()=>{copyText(build());B.touch()})}
};

/* ======================= PROBLEM SOLVING ======================= */
const GL=window.GEN_LABELS||{seq:'Successioni',arith:'Percentuali e calcolo',logic:'Logica',matrix:'Matrici',estim:'Stime'};
B.ROUTES.ps=function(app,args){const tab=args[0]||'lezioni';
  app.innerHTML=head('ps','Test a tempo generati casualmente: successioni, percentuali, logica, matrici, stime. Esercizi di pratica nello stile descritto, non domande reali.')+tabs('ps',[['lezioni','Lezioni'],['test','Test a tempo'],['storico','Storico'],['algoritmi','Algoritmi']],tab)+'<div id="tab"></div>';
  const box=$('#tab');
  if(tab==='lezioni')box.innerHTML=B.lessonList('ps');
  else if(tab==='test')psSetup(box,args[1]);
  else if(tab==='storico')psHistory(box);
  else if(tab==='algoritmi')algo(box)};
function psSetup(box,pre){const last=B.S.texts.ps_cfg?JSON.parse(B.S.texts.ps_cfg):{type:'mix',n:10,sec:60,mode:'train'};if(pre&&window.GEN[pre])last.type=pre;
  box.innerHTML=`<div class="card"><h3 style="margin-top:0">Configura il test</h3><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
   <div><label>Tipo</label><select id="c_type"><option value="mix">Misto</option>${Object.keys(window.GEN).map(k=>`<option value="${k}">${esc(GL[k]||k)}</option>`).join('')}</select></div>
   <div><label>Domande</label><select id="c_n">${[5,10,15,20,30].map(n=>`<option>${n}</option>`).join('')}</select></div>
   <div><label>Secondi per domanda</label><select id="c_sec">${[30,45,60,90,120].map(n=>`<option>${n}</option>`).join('')}</select></div>
   <div><label>Modalità</label><select id="c_mode"><option value="train">Allenamento (spiegazione subito, il timer si ferma)</option><option value="exam">Simulazione d’esame (spiegazioni alla fine)</option></select></div></div>
   <p class="small muted">In simulazione il timer non si ferma mai e le domande senza risposta contano come errori: è il modo più vicino a un test reale a tempo.</p><button class="btn" id="go">▶️ Inizia</button></div>`;
  $('#c_type').value=last.type;$('#c_n').value=last.n;$('#c_sec').value=last.sec;$('#c_mode').value=last.mode;
  $('#go').addEventListener('click',()=>{const cfg={type:$('#c_type').value,n:+$('#c_n').value,sec:+$('#c_sec').value,mode:$('#c_mode').value};B.S.texts.ps_cfg=JSON.stringify(cfg);B.save();psRun(box,cfg)})}
function psRun(box,cfg){const keys=Object.keys(window.GEN);const qs=[];for(let i=0;i<cfg.n;i++){const k=cfg.type==='mix'?keys[i%keys.length]:cfg.type;qs.push(window.GEN[k]())}if(cfg.type==='mix')for(let i=qs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[qs[i],qs[j]]=[qs[j],qs[i]]}
  const res=[];let i=0,finished=false,start=Date.now();
  box.innerHTML=`<div class="card"><div class="spread"><span>Domanda <b id="qi">1</b> / ${cfg.n} · corrette <b id="qc">0</b></span><span class="timer" id="tm"></span></div>${bar(0)}</div><div class="card" id="qb"></div>`;
  const timer=B.countdown($('#tm'),cfg.n*cfg.sec,()=>end(true));
  function show(){B.clearDock();if(i>=qs.length)return end(false);$('#qi').textContent=i+1;$('.bar>i',box).style.width=pct(i/cfg.n)+'%';timer.paused=false;const q=qs[i];
    B.renderMCQ($('#qb'),Object.assign({},q,{q:`<div class="small muted">${esc(GL[q.topic]||q.topic)}</div>`+q.q}),(ok,ch)=>{res[i]={ok,ch};B.record(q.topic,ok?1:0);$('#qc').textContent=res.filter(r=>r&&r.ok).length;
      if(cfg.mode==='train'){timer.paused=true;const nb=document.createElement('button');nb.className='btn thumb';nb.textContent=i<qs.length-1?'Avanti →':'Vedi risultato';nb.addEventListener('click',()=>{i++;show()});$('#qb .after').appendChild(nb);nb.focus();B.toast(ok?'Risposta salvata':'Risposta registrata')}
      else setTimeout(()=>{i++;show()},250)},{hide:cfg.mode==='exam'})}
  function end(timeout){if(finished)return;finished=true;timer.stop();const correct=res.filter(r=>r&&r.ok).length;const secs=Math.round((Date.now()-start)/1000);
    B.S.psHistory.push({date:new Date().toISOString(),type:cfg.type,n:cfg.n,correct,secs,mode:cfg.mode,timeout});if(B.S.psHistory.length>200)B.S.psHistory.shift();B.touch();B.save();
    const byT={};qs.forEach((q,k)=>{const t=byT[q.topic]||(byT[q.topic]=[0,0]);t[1]++;if(res[k]&&res[k].ok)t[0]++});
    box.innerHTML=`<div class="card"><h2 style="margin-top:0">${timeout?'⏰ Tempo scaduto! ':''}Risultato: ${correct}/${cfg.n} (${pct(correct/cfg.n)}%)</h2><p class="muted">Tempo usato: ${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')} · ${cfg.mode==='exam'?'simulazione':'allenamento'}</p>
     <div class="kpi">${Object.keys(byT).map(t=>`<div><div class="small">${esc(GL[t]||t)}: ${byT[t][0]}/${byT[t][1]}</div>${bar(byT[t][0]/byT[t][1],byT[t][0]/byT[t][1]<.6)}</div>`).join('')}</div>
     <div class="row thumb" style="margin-top:.8rem"><button class="btn" id="again">Nuovo test</button><a class="btn ghost" href="#/ps/storico">Storico</a></div></div>
     <h3>Revisione</h3>${qs.map((q,k)=>{const r=res[k];return `<details class="card"><summary>${r?(r.ok?'✅':'❌'):'⏭️'} Domanda ${k+1} · ${esc(GL[q.topic]||q.topic)}</summary><div class="qtext">${q.q}</div><p><b>Risposta corretta:</b></p><div class="${q.svg?'mopts':''}">${q.svg?`<button disabled class="ok">${q.opts[q.ans]}</button>`:esc(q.opts[q.ans].replace(/<[^>]+>/g,''))}</div>${r&&!r.ok?`<p class="small">La tua risposta: ${q.svg?'figura '+(r.ch+1):esc(String(q.opts[r.ch]).replace(/<[^>]+>/g,''))}</p>`:''}<div class="expl">${q.expl}</div><p class="small"><a href="#/lesson/${B.firstLesson(q.topic)}">📖 Lezione</a></p></details>`}).join('')}`;
    $('#again').addEventListener('click',()=>psSetup(box))}
  show()}
function psHistory(box){const H=B.S.psHistory.slice(-30);if(!H.length){box.innerHTML='<div class="card">Nessun test ancora. <a href="#/ps/test">Fai il primo</a>.</div>';return}
  const W=600,Hh=160,pts=H.map((h,k)=>[H.length===1?W/2:20+k*(W-40)/(H.length-1),Hh-15-(h.correct/h.n)*(Hh-30)]);
  box.innerHTML=`<div class="card"><h3 style="margin-top:0">Andamento (ultimi ${H.length} test, % corrette)</h3><svg viewBox="0 0 ${W} ${Hh}" style="width:100%;height:auto"><line x1="0" x2="${W}" y1="${Hh-15-.6*(Hh-30)}" y2="${Hh-15-.6*(Hh-30)}" stroke="var(--warn)" stroke-dasharray="4 4"/><polyline fill="none" stroke="var(--accent)" stroke-width="3" points="${pts.map(p=>p.join(',')).join(' ')}"/>${pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--accent)"/>`).join('')}</svg><p class="small muted">Linea tratteggiata: 60%.</p></div>
   <div class="card"><table><tr><th>Data</th><th>Tipo</th><th>Modalità</th><th>Punteggio</th><th>Tempo</th></tr>${H.slice().reverse().map(h=>`<tr><td>${new Date(h.date).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'})}</td><td>${h.type==='mix'?'Misto':esc(GL[h.type]||h.type)}</td><td>${h.mode==='exam'?'Simulazione':'Allenamento'}${h.timeout?' ⏰':''}</td><td>${h.correct}/${h.n} (${pct(h.correct/h.n)}%)</td><td>${Math.floor(h.secs/60)}:${String(h.secs%60).padStart(2,'0')}</td></tr>`).join('')}</table></div>`}
function algo(box){const D=B.S.algoDone;const all=window.ALGO_TOPICS.flatMap(g=>g[1]);const n=all.filter(p=>D[p[1]]).length;
  box.innerHTML=`<div class="card"><p>Per i test tecnici e i colloqui è utile allenarsi sui pattern classici. Segui la <a href="https://neetcode.io/roadmap" target="_blank" rel="noopener">roadmap di NeetCode</a> (con video spiegazioni) e risolvi i problemi su LeetCode. Prima studia la <a href="#/lesson/ps-algo">lezione sui pattern</a>.</p>${bar(n/all.length)}<p class="small muted">${n}/${all.length} risolti (li spunti tu). I link richiedono internet.</p></div>
   <div class="grid">${window.ALGO_TOPICS.map(g=>`<div class="card"><h3 style="margin-top:0">${esc(g[0])}</h3>${g[1].map(p=>`<label class="check"><input type="checkbox" data-algo="${esc(p[1])}" ${D[p[1]]?'checked':''}><span><a href="${esc(p[1])}" target="_blank" rel="noopener">${esc(p[0])}</a></span></label>`).join('')}</div>`).join('')}</div>`;
  $$('[data-algo]',box).forEach(c=>c.addEventListener('change',()=>{D[c.dataset.algo]=c.checked;if(c.checked)B.record('algo',1);B.save()}))}

/* ======================= TECNICO ======================= */
const TECH=['python','k8s','grpc','docker','sysdesign','simplify'];
B.ROUTES.tech=function(app,args){const tab=args[0]||'lezioni';
  app.innerHTML=head('tech','Lezioni, quiz e flashcard su Python (partendo da C#), Kubernetes, gRPC/REST, Docker, system design e semplificazione. Domande di pratica, non quelle reali.')+tabs('tech',[['lezioni','Lezioni'],['quiz','Quiz'],['flashcard','Flashcard'],['python','Esercizi Python'],['design','System design']],tab)+'<div id="tab"></div>';
  const box=$('#tab');
  if(tab==='lezioni')box.innerHTML=B.lessonList('tech');
  else if(tab==='quiz')quizSetup(box,args[1]);
  else if(tab==='flashcard')box.innerHTML=`<p class="muted">Scegli un mazzo: le carte usano ripetizione spaziata (SM-2) e alimentano la padronanza.</p><div class="grid">${TECH.map(t=>{const ids=Object.values(B.CARDS).filter(c=>c.topic===t);const inS=ids.filter(c=>B.S.srs[c.id]).length;return `<a class="card" style="text-decoration:none;color:inherit" href="#/review/${t}"><b>${esc(T[t].label)}</b><div class="small muted">${ids.length} carte · ${inS} già nel ripasso</div>${bar(B.mastery(t).level)}</a>`}).join('')}</div>`;
  else if(tab==='python')pyEx(box);
  else if(tab==='design')design(box,args[1])};
function quizSetup(box,pre){box.innerHTML=`<div class="card"><h3 style="margin-top:0">Scegli il quiz</h3><div class="grid">${TECH.map(t=>{const m=B.mastery(t);return `<div class="card"><b>${esc(T[t].label)}</b><div class="small muted">${window.QUIZ[t].length} domande · padronanza ${pct(m.level)}%</div>${bar(m.level,m.n>=3&&m.acc<.65)}<div class="row" style="margin-top:.5rem"><button class="btn sm" data-q="${t}" data-n="10">10 domande</button><button class="btn sm ghost" data-q="${t}" data-n="999">Tutte</button></div></div>`}).join('')}</div></div>`;
  $$('[data-q]',box).forEach(b=>b.addEventListener('click',()=>quizRun(box,b.dataset.q,+b.dataset.n)));
  if(pre&&window.QUIZ[pre]){const el=$(`[data-q="${pre}"]`,box);el&&el.closest('.card').scrollIntoView();el&&(el.closest('.card').style.borderColor='var(--accent)')}}
function quizRun(box,t,n){const S=B.S;const all=window.QUIZ[t].map((_,i)=>i);
  // priorità alle domande in scadenza o mai viste, poi le altre
  const td=B.today();const pri=all.filter(i=>{const s=S.srs['Q:'+t+':'+i];return !s||s.due<=td});const rest=all.filter(i=>!pri.includes(i));
  const order=[...B.shuffle(pri),...B.shuffle(rest)].slice(0,Math.min(n,all.length));let k=0,correct=0;const wrong=[];
  function show(){B.clearDock();if(k>=order.length)return end();const q=B.quizItem(t,order[k]);const c=document.createElement('div');
    box.innerHTML=`<div class="card"><div class="spread"><b>${esc(T[t].label)}</b><span>${k+1}/${order.length} · ✅ ${correct}</span></div>${bar(k/order.length)}</div>`;c.className='card';box.appendChild(c);
    B.renderMCQ(c,q,ok=>{const id=q.cid;if(ok)correct++;else wrong.push(order[k]);B.record(t,ok?1:0);
      if(!S.srs[id])B.srsAdd(id,ok?(()=>{const d=new Date();d.setDate(d.getDate()+1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})():td);else if(!ok){S.srs[id].due=td;S.srs[id].reps=0}B.save();
      const nb=document.createElement('button');nb.className='btn thumb';nb.textContent=k<order.length-1?'Avanti →':'Risultato';nb.addEventListener('click',()=>{k++;show()});$('.after',c).appendChild(nb);nb.focus();B.toast(ok?'Risposta salvata':'Da ripassare, salvato')})}
  function end(){S.quizHistory.push({date:new Date().toISOString(),topic:t,n:order.length,correct});B.save();
    box.innerHTML=`<div class="card"><h2 style="margin-top:0">${esc(T[t].label)}: ${correct}/${order.length} (${pct(correct/order.length)}%)</h2><p class="muted small">Le domande sbagliate sono già nel ripasso di oggi.</p><div class="row thumb"><button class="btn" id="again">Altro quiz</button><a class="btn ghost" href="#/lesson/${B.firstLesson(t)}">📖 Lezione</a><a class="btn ghost" href="#/review">Ripasso</a></div></div>${wrong.length?'<h3>Da rivedere</h3>'+wrong.map(i=>{const r=window.QUIZ[t][i];return `<div class="card"><b>${esc(r[0])}</b><div class="expl"><b>${esc(r[1][r[2]])}</b> — ${esc(r[3])}</div></div>`}).join(''):''}`;
    $('#again').addEventListener('click',()=>quizSetup(box))}
  show()}
function pyEx(box){const D=B.S.pyDone;box.innerHTML=`<div class="callout small">Il sito è offline e non esegue Python. Scrivi la soluzione qui (viene salvata), poi provala sul tuo PC: <code>python3 esercizio.py</code>. Confrontala con la soluzione di riferimento solo dopo averci provato davvero.</div>
  ${window.PY_EX.map((e,i)=>`<div class="card"><div class="spread"><h3 style="margin:0">${i+1}. ${esc(e.t)}</h3><label class="check" style="margin:0"><input type="checkbox" data-py="${i}" ${D[i]?'checked':''}><span>Fatto</span></label></div><p>${esc(e.d)}</p><textarea data-bind="py_${i}" spellcheck="false" style="font-family:ui-monospace,monospace;font-size:.88rem;min-height:120px" placeholder="# la tua soluzione">${tval('py_'+i)}</textarea><details><summary>Mostra la soluzione di riferimento</summary><pre><code>${esc(e.s)}</code></pre></details></div>`).join('')}`;
  $$('[data-py]',box).forEach(c=>c.addEventListener('change',()=>{D[c.dataset.py]=c.checked;if(c.checked)B.record('python',1);B.touch();B.save()}))}
const SD_FIELDS=[['req','1. Requisiti funzionali e non funzionali','Cosa deve fare? Utenti, latenza, disponibilità, consistenza…'],['est','2. Stime','QPS letture/scritture, storage in 5 anni, banda'],['api','3. API','POST /links {url} → {code}; GET /{code} → 301…'],['data','4. Modello dati e storage','Tabelle/chiavi, quale database e perché'],['arch','5. Architettura e scalabilità','Componenti, cache, code, sharding, replica, CDN'],['trade','6. Trade-off e rischi','Cosa hai sacrificato e perché; colli di bottiglia; come semplificare']];
function design(box,id){const P=window.SD_PROMPTS;const cur=P.find(p=>p.id===id)||P[0];const S=B.S;
  box.innerHTML=`<div class="row">${P.map(p=>`<a class="btn sm ${p.id===cur.id?'':'ghost'}" href="#/tech/design/${p.id}">${esc(p.title)}${S.sdDone[p.id]?' ✓':''}</a>`).join('')}</div>
  <div class="card"><div class="spread"><h3 style="margin:0">${esc(cur.title)}</h3><span><span class="timer" id="sdt">35:00</span> <button class="btn sm ghost" id="sdgo">Avvia 35 min</button></span></div><p>${esc(cur.brief)}</p><p class="small muted">Segui lo schema, scrivi (anche in inglese, come in colloquio) e solo dopo confronta con la traccia. Rileggi prima la <a href="#/lesson/sd-1">lezione sul metodo</a>.</p>
  ${SD_FIELDS.map(f=>field('sd_'+cur.id+'_'+f[0],f[1],f[2],true)).join('')}</div>
  <details class="card" id="sol"><summary>Mostra la traccia di soluzione</summary><div class="lesson" style="margin-top:.6rem">${window.BSSanitize.sanitizeLessonHtml(cur.outline)}</div><h3>Autovalutazione</h3><p class="small muted">Quanto la tua risposta copriva i punti della traccia (1 = poco, 5 = tutto, con trade-off motivati)?</p>${ratingRow('sd',S.sdDone[cur.id]||0)}<button class="btn" id="sdsave" style="margin-top:.5rem">Salva valutazione</button></details>`;
  $('#sdgo').addEventListener('click',e=>{e.target.disabled=true;B.countdown($('#sdt'),35*60,()=>B.toast('Tempo! Passa ai trade-off e confronta con la traccia.'))});
  const st={};bindRatings(box,st);$('#sdsave').addEventListener('click',()=>{if(!st.sd){B.toast('Scegli un voto da 1 a 5');return}S.sdDone[cur.id]=st.sd;B.record('sysdesign',st.sd/5);B.save();B.toast('Valutazione salvata')})}

/* ======================= COMPORTAMENTALE ======================= */
const TR=window.TRAITS;
B.ROUTES.behav=function(app,args){const tab=args[0]||'lezioni';
  app.innerHTML=head('behav','Storie STAR pronte per ogni tratto, simulazioni di colloquio a tempo e cultura aziendale.')+tabs('behav',[['lezioni','Lezioni'],['star','Storie STAR'],['mock','Simulazione'],['cultura','Cultura']],tab)+'<div id="tab"></div>';
  const box=$('#tab');
  if(tab==='lezioni')box.innerHTML=B.lessonList('behav');
  else if(tab==='star')star(box,args[1]);
  else if(tab==='mock')mock(box);
  else if(tab==='cultura')culture(box)};
const HONEST=`<div class="callout small">🧭 <b>Onestà: separa "io" da "team".</b> Per ogni storia sappi dire con precisione cosa hai fatto <i>tu</i> ("I designed…, I wrote…") e cosa ha fatto il team ("we shipped…"). Non gonfiare numeri o ruoli: chi esagera i propri risultati non riceve l'offerta, e le referenze servono proprio a verificarli.</div>`;
function star(box,editId){const S=B.S;const ed=S.stories.find(s=>s.id===editId)||{traits:[]};
  const cov=Object.keys(TR).map(t=>[t,S.stories.filter(s=>(s.traits||[]).includes(t)).length]);
  box.innerHTML=HONEST+`<div class="card"><h3 style="margin-top:0">Copertura dei tratti</h3><div>${cov.map(([t,n])=>`<span class="tag ${n?'ok':B.CORE_TRAITS.includes(t)?'bad':''}">${esc(TR[t])}: ${n}</span>`).join('')}</div><p class="small muted">Obiettivo: almeno una storia per ogni tratto in rosso, e 5+ storie in totale (una storia può coprire più tratti).</p></div>
  <div class="card" id="form"><h3 style="margin-top:0">${ed.id?'Modifica storia':'Nuova storia'}</h3>
   <label>Titolo breve</label><input type="text" id="s_title" value="${esc(ed.title||'')}" placeholder="Migrazione della pipeline di release">
   <label>Tratti che dimostra</label><div class="row">${Object.keys(TR).map(t=>`<label class="check" style="margin:0"><input type="checkbox" value="${t}" class="s_tr" ${(ed.traits||[]).includes(t)?'checked':''}><span>${esc(TR[t])}</span></label>`).join('')}</div>
   ${[['s','S — Situazione','Contesto in 1–2 frasi: azienda, team, problema'],['t','T — Task','Qual era il TUO obiettivo o responsabilità'],['a','A — Azione','Cosa hai fatto TU, passo per passo (I…)'],['r','R — Risultato','Numeri, impatto, cosa hai imparato'],['me','Il mio contributo vs il team','Io: … / Il team: …']].map(f=>`<label>${f[1]}</label><textarea id="s_${f[0]}" placeholder="${esc(f[2])}">${esc(ed[f[0]]||'')}</textarea>`).join('')}
   <div id="s_warn"></div><div class="row"><button class="btn" id="s_save">${ed.id?'Salva modifiche':'Aggiungi storia'}</button>${ed.id?'<a class="btn ghost" href="#/behav/star">Annulla</a>':''}</div></div>
  <h3>Le tue storie (${S.stories.length})</h3>${S.stories.map(s=>`<div class="card story"><div class="spread"><b>${esc(s.title||'(senza titolo)')}</b><span><a class="btn sm ghost" href="#/behav/star/${s.id}">Modifica</a><button class="btn sm danger" data-del="${s.id}">Elimina</button></span></div><div>${(s.traits||[]).map(t=>`<span class="tag">${esc(TR[t]||t)}</span>`).join('')}</div><details><summary class="small">Leggi</summary><p><b>S:</b> ${esc(s.s)}</p><p><b>T:</b> ${esc(s.t)}</p><p><b>A:</b> ${esc(s.a)}</p><p><b>R:</b> ${esc(s.r)}</p>${s.me?`<p><b>Io vs team:</b> ${esc(s.me)}</p>`:''}</details></div>`).join('')||'<p class="muted">Nessuna storia ancora. Rileggi la <a href="#/lesson/star-1">lezione sul metodo STAR</a>.</p>'}`;
  $('#s_save').addEventListener('click',()=>{const g=k=>$('#s_'+k).value.trim();const st={id:ed.id||('s'+Date.now().toString(36)),title:g('title'),traits:$$('.s_tr:checked').map(c=>c.value),s:g('s'),t:g('t'),a:g('a'),r:g('r'),me:g('me')};
    if(!st.title||!st.a){B.toast('Servono almeno titolo e azione');return}
    const we=(st.a.match(/\b(we|our|noi|abbiamo)\b/gi)||[]).length,i=(st.a.match(/\b(I|io|ho)\b/g)||[]).length;
    const idx=S.stories.findIndex(x=>x.id===st.id);if(idx>=0)S.stories[idx]=st;else S.stories.push(st);B.touch();B.save();
    if(we>i)B.toast('Salvata. Nota: nell’azione prevale "we": chiarisci cosa hai fatto tu.');else B.toast('Storia salvata');B.go('#/behav/star');if(editId)return;B.route()});
  $$('[data-del]',box).forEach(b=>b.addEventListener('click',()=>{if(!confirm('Eliminare questa storia?'))return;S.stories=S.stories.filter(s=>s.id!==b.dataset.del);B.save();B.route()}))}
function mock(box){const S=B.S;
  box.innerHTML=HONEST+`<div class="card"><h3 style="margin-top:0">Simulazione di colloquio</h3><p>Ricevi una domanda in inglese. Hai <b>2 minuti</b> per pensare (scegli la storia e la struttura STAR), poi <b>3 minuti</b> per rispondere ad alta voce, come in un colloquio vero. Alla fine ti autovaluti.</p>
   <div class="row"><select id="m_tr" style="max-width:280px"><option value="">Tratto casuale</option>${Object.keys(TR).map(t=>`<option value="${t}">${esc(TR[t])}</option>`).join('')}</select><button class="btn" id="m_go">🎲 Nuova domanda</button></div></div><div id="m_box"></div>
   <h3>Storico simulazioni (${S.mocks.length})</h3>${S.mocks.slice(-10).reverse().map(m=>`<div class="card small"><div class="spread"><span><span class="tag">${esc(TR[m.trait]||m.trait)}</span> ${esc(m.q)}</span><b>${m.avg.toFixed(1)}/5</b></div>${m.note?`<div class="muted">${esc(m.note)}</div>`:''}<div class="muted">${new Date(m.date).toLocaleDateString('it-IT')}</div></div>`).join('')||'<p class="muted">Ancora nessuna.</p>'}`;
  $('#m_go').addEventListener('click',()=>{B.clearTimers();const tr=$('#m_tr').value;const pool=window.BEHAV_Q.filter(q=>!tr||q[0]===tr);const q=pool[Math.floor(Math.random()*pool.length)];run(q)});
  function run(q){const mb=$('#m_box');const stories=S.stories.filter(s=>(s.traits||[]).includes(q[0]));
    mb.innerHTML=`<div class="card"><span class="tag">${esc(TR[q[0]])}</span><p class="big"><b>${esc(q[1])}</b></p>${stories.length?`<p class="small muted">Storie collegate: ${stories.map(s=>esc(s.title)).join(' · ')}</p>`:`<p class="small muted">Non hai ancora storie per questo tratto: <a href="#/behav/star">creane una</a> dopo la simulazione.</p>`}
     <div class="spread"><span id="m_ph"><b>🧠 Fase 1: pensa</b></span><span class="timer" id="m_t"></span></div><div class="row"><button class="btn" id="m_next">Sono pronto, inizio a rispondere</button></div></div>`;
    let phase=1;const think=B.countdown($('#m_t'),120,()=>answer());
    function answer(){if(phase!==1)return;phase=2;think.stop();$('#m_ph').innerHTML='<b>🎤 Fase 2: rispondi ad alta voce</b>';$('#m_next').textContent='Ho finito';const ans=B.countdown($('#m_t'),180,()=>rate());$('#m_next').onclick=()=>{ans.stop();rate()}}
    $('#m_next').onclick=answer;
    function rate(){if(phase===3)return;phase=3;B.clearTimers();const crit=[['struct','Struttura STAR chiara'],['me','Il mio contributo distinto da quello del team'],['res','Risultato concreto e quantificato'],['learn','Riflessione / cosa ho imparato'],['time','Durata giusta (2–3 min), senza divagare']];
      mb.innerHTML=`<div class="card"><h3 style="margin-top:0">Autovalutazione</h3><p class="small muted">${esc(q[1])}</p>${crit.map(c=>`<label>${c[1]}</label>${ratingRow(c[0],0)}`).join('')}<label>Note (cosa migliorare)</label><textarea id="m_note"></textarea><button class="btn" id="m_save" style="margin-top:.5rem">Salva</button></div>`;
      const st={};bindRatings(mb,st);$('#m_save').addEventListener('click',()=>{const vals=crit.map(c=>st[c[0]]).filter(Boolean);if(vals.length<crit.length){B.toast('Dai un voto a tutti i criteri');return}const a=B.avg(vals);S.mocks.push({date:new Date().toISOString(),trait:q[0],q:q[1],ratings:st,avg:a,note:$('#m_note').value.trim()});B.record('star',a/5);B.save();B.toast('Simulazione salvata');B.route()})}}}
function culture(box){box.innerHTML=`<div class="card"><h3 style="margin-top:0">In sintesi</h3><ul>
  <li><b>Potenziale più che esperienza:</b> conta quanto velocemente impari e quanto potresti crescere nel lungo periodo.</li>
  <li><b>Ragionamento, drive, spirito di squadra, inglese</b> sono i requisiti dichiarati.</li>
  <li><b>"Simplify relentlessly":</b> preferire la soluzione più semplice che funziona, togliere complessità.</li>
  <li><b>"Amplify your impact with AI":</b> usare l'AI per fare di più e meglio, sapendo spiegare come.</li>
  <li><b>Radical Candor:</b> feedback diretto e rispettoso, in entrambe le direzioni (dettagli nel documento ufficiale).</li>
  <li><b>Onestà:</b> nessuna offerta a chi gonfia i propri risultati.</li></ul>
  <div class="row"><a class="btn" href="#/lesson/culture-1">📖 Lezione sulla cultura</a><a class="btn ghost" href="#/lesson/star-1">📖 Metodo STAR</a><a class="btn ghost" href="#/lesson/simp-1">📖 Semplificare</a></div></div>
  ${HONEST}
  <div class="card"><h3 style="margin-top:0">Documenti ufficiali (servono internet)</h3><ul><li><a href="https://bndspn.com/process-document" target="_blank" rel="noopener">Processo di selezione</a></li><li><a href="https://bendingspoons.com/documents/Culture&amp;Policies%E2%80%94RadicalCandor.pdf" target="_blank" rel="noopener">Culture &amp; Policies — Radical Candor (PDF)</a></li><li><a href="https://jobs.bendingspoons.com/positions/69c3ec6cf2164aed6ede175b" target="_blank" rel="noopener">Annuncio Software Engineer</a></li><li><a href="https://bendingspoons.com/careers" target="_blank" rel="noopener">Careers</a></li></ul><p class="small muted">Leggi i documenti originali: questa sintesi è una semplificazione.</p></div>`}

/* ======================= REFERENZE ======================= */
B.ROUTES.refs=function(app,args){const S=B.S;const ed=S.referees.find(r=>r.id===args[0])||{};
  app.innerHTML=head('refs','Il controllo referenze verifica ciò che hai raccontato. Prepara 2–3 persone che conoscono bene il tuo lavoro.')+`<p><a href="#/lesson/refs-1">📖 Lezione sulle referenze</a></p>`+B.checklist('refs')+
  `<div class="card"><h3 style="margin-top:0">${ed.id?'Modifica referenza':'Aggiungi una referenza'} <span class="small muted">(${S.referees.length}/3)</span></h3><p class="small muted">Salvato solo in questo browser. Di proposito non si salvano email o telefoni.</p>
   <label>Nome</label><input type="text" id="r_name" value="${esc(ed.name||'')}">
   <label>Ruolo e rapporto con te</label><input type="text" id="r_role" value="${esc(ed.role||'')}" placeholder="Es. il mio team lead 2021–2024">
   <label>Cosa può confermare</label><textarea id="r_can" placeholder="Quali progetti, risultati e tratti può raccontare con esempi concreti">${esc(ed.can||'')}</textarea>
   <label class="check"><input type="checkbox" id="r_ok" ${ed.ok?'checked':''}><span>Gli/le ho chiesto il permesso e l'ho avvisato/a del possibile contatto</span></label>
   <div class="row"><button class="btn" id="r_save">${ed.id?'Salva':'Aggiungi'}</button>${ed.id?'<a class="btn ghost" href="#/refs">Annulla</a>':''}</div></div>
  ${S.referees.map(r=>`<div class="card story"><div class="spread"><b>${esc(r.name)}</b><span>${r.ok?'<span class="tag ok">permesso ok</span>':'<span class="tag warn">da avvisare</span>'} <a class="btn sm ghost" href="#/refs/${r.id}">Modifica</a><button class="btn sm danger" data-del="${r.id}">Elimina</button></span></div><div class="small muted">${esc(r.role)}</div><p>${esc(r.can)}</p></div>`).join('')}`;
  $('#r_save').addEventListener('click',()=>{const r={id:ed.id||('r'+Date.now().toString(36)),name:$('#r_name').value.trim(),role:$('#r_role').value.trim(),can:$('#r_can').value.trim(),ok:$('#r_ok').checked};if(!r.name){B.toast('Inserisci almeno il nome');return}
    const i=S.referees.findIndex(x=>x.id===r.id);if(i>=0)S.referees[i]=r;else{if(S.referees.length>=3&&!confirm('Hai già 3 referenze. Aggiungerne un’altra?'))return;S.referees.push(r)}B.touch();B.save();B.toast('Referenza salvata');if(location.hash==='#/refs')B.route();else B.go('#/refs')});
  $$('[data-del]',app).forEach(b=>b.addEventListener('click',()=>{if(!confirm('Eliminare questa referenza?'))return;S.referees=S.referees.filter(r=>r.id!==b.dataset.del);B.save();B.route()}))};

/* ======================= INGLESE TECNICO ======================= */
const EN_TYPES={translate:'Traduci IT → EN',fix:'Correggi l’errore',concise:'Riscrivi più conciso',choice:'Scegli la parola',gap:'Riempi lo spazio'};
function speakEn(text){
  if(!window.speechSynthesis||typeof window.SpeechSynthesisUtterance!=='function'){B.toast('Sintesi vocale non disponibile in questo browser: leggi ad alta voce');return}
  try{window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.95;window.speechSynthesis.speak(u)}
  catch(e){B.toast('Sintesi vocale non disponibile: leggi ad alta voce')}
}
B.ROUTES.en=function(app,args){const tab=args[0]||'lezioni';
  app.innerHTML=head('en','Inglese di lavoro, come si usa in un’azienda che lavora solo in inglese: vocabolario tecnico, messaggi, documenti, code review e colloquio. Le spiegazioni sono in italiano; ciò che pratichi è in inglese.')+
    tabs('en',[['lezioni','Lezioni'],['flashcard','Flashcard'],['esercizi','Esercizi'],['speaking','Speaking']],tab)+'<div id="tab"></div>';
  const box=$('#tab');
  if(tab==='lezioni')box.innerHTML=B.lessonList('en');
  else if(tab==='flashcard')enDecks(box);
  else if(tab==='esercizi')enExercises(box,args.slice(1));
  else enSpeak(box,args[1]);
};
function enDecks(box){const topics=['en-vocab','en-mistakes','en-writing','en-speaking'];
  box.innerHTML=`<p class="muted">Flashcard termine o frase → significato e uso (anche IT → EN). Quando completi una lezione, le sue carte entrano nel ripasso spaziato.</p>
   <div class="grid">${topics.map(t=>{const ids=Object.values(B.CARDS).filter(c=>c.topic===t&&!c.hideInDeck);const inS=ids.filter(c=>B.S.srs[c.id]).length;const m=B.mastery(t);
     return `<a class="card" style="text-decoration:none;color:inherit" href="#/review/${t}"><b>${esc(T[t].label)}</b><div class="small muted">${ids.length} carte · ${inS} già nel ripasso</div>${bar(m.level)}</a>`}).join('')}</div>`}
function enExercises(box,args){const S=B.S;const all=window.EN_EX||[];const mode=args[0]||'';
  if(mode==='item'){const ex=all.find(e=>e.id===args[1]);if(!ex){B.go('#/en/esercizi');return}return enExerciseOne(box,ex,all)}
  const type=EN_TYPES[mode]?mode:'';
  const list=type?all.filter(e=>e.type===type):all;
  const done=all.filter(e=>S.enDone[e.id]).length;
  box.innerHTML=`<div class="card"><div class="spread"><b>Esercizi svolti</b><span>${done} / ${all.length}</span></div>${bar(all.length?done/all.length:0)}
    <p class="small muted">Traduzione, correzione, riscrittura, scelta e cloze. La risposta modello resta nascosta finché non la chiedi. Un voto da «difficile» in su segna l’esercizio come fatto e lo mette nel ripasso.</p></div>
    <div class="tabs"><a href="#/en/esercizi" class="${type?'':'active'}">Tutti</a>${Object.keys(EN_TYPES).map(k=>`<a href="#/en/esercizi/${k}" class="${k===type?'active':''}">${EN_TYPES[k]}</a>`).join('')}</div>
    <div class="grid">${list.map(e=>`<a class="card" style="text-decoration:none;color:inherit" href="#/en/esercizi/item/${e.id}"><div class="spread"><span class="tag">${esc(EN_TYPES[e.type]||e.type)}</span>${S.enDone[e.id]?'<span class="tag ok">fatto</span>':'<span class="tag">da fare</span>'}</div><p style="margin:.45rem 0 0">${esc(e.prompt.split('\n')[0].slice(0,140))}</p></a>`).join('')}</div>`}
function enExerciseOne(box,ex,all){const S=B.S;const idx=all.findIndex(e=>e.id===ex.id);const prev=all[idx-1],next=all[idx+1];
  const prompt=esc(ex.prompt).replace(/\n/g,'<br>');
  box.innerHTML=`<div class="small"><a href="#/en/esercizi">Esercizi</a> › ${esc(EN_TYPES[ex.type]||ex.type)}</div>
    <div class="card"><div class="spread"><span class="tag">${esc(EN_TYPES[ex.type])}</span><span class="small muted">${idx+1} / ${all.length}</span></div>
    <div class="qtext" style="margin-top:.6rem">${prompt}</div>
    <div id="en_body"></div></div>
    <div class="spread">${prev?`<a class="btn ghost" href="#/en/esercizi/item/${prev.id}">← Precedente</a>`:'<span></span>'}${next?`<a class="btn ghost" href="#/en/esercizi/item/${next.id}">Successivo →</a>`:''}</div>`;
  const body=$('#en_body');
  if(ex.type==='choice'||ex.type==='gap'){
    B.renderMCQ(body,{q:'',opts:ex.options.map(o=>esc(o)),ans:ex.answer,expl:esc(ex.explanation)},ok=>{
      S.enDone[ex.id]=ok;B.srsGrade('EX:'+ex.id,ok?4:1);B.toast(ok?'Corretto, carta aggiornata':'Da ripassare: la trovi nel ripasso');
    });
    return;
  }
  body.innerHTML=`<label for="en_try">La tua versione</label><textarea id="en_try" data-bind="enx_${ex.id}" spellcheck="true">${B.tval('enx_'+ex.id)}</textarea>
    <div class="thumb" id="en_show_bar"><button class="btn" id="en_show">Mostra la risposta modello</button></div><div id="en_model"></div>`;
  $('#en_show').addEventListener('click',()=>{
    const bar=$('#en_show_bar');if(bar)bar.remove();
    $('#en_model').innerHTML=`<div class="expl"><b>Risposta modello</b><div style="margin-top:.35rem">${esc(ex.answer).replace(/\n/g,'<br>')}</div></div>
      <p>${esc(ex.explanation)}</p>
      <p class="small muted">Quanto ci sei andato vicino? Il voto aggiorna il ripasso spaziato di questa frase.</p>
      <div class="row rating thumb"><button class="btn danger" data-q="1">Ancora</button><button class="btn ghost" data-q="3">Difficile</button><button class="btn" data-q="4">Bene</button><button class="btn" data-q="5" style="background:var(--ok);border-color:var(--ok)">Facile</button></div>`;
    $$('#en_model [data-q]').forEach(b=>b.addEventListener('click',()=>{const q=+b.dataset.q;S.enDone[ex.id]=q>=3;B.srsGrade('EX:'+ex.id,q);B.toast(q>=3?'Registrato nel ripasso':'Lo rivedrai presto');$$('#en_model [data-q]').forEach(x=>x.disabled=true)}));
  });
}
function enSpeak(box,id){const S=B.S;const all=window.EN_SPEAK||[];
  if(!id){const done=all.filter(s=>S.enSpeak[s.id]>=3).length;
    box.innerHTML=`<div class="card"><div class="spread"><b>Risposte provate</b><span>${done} / ${all.length}</span></div>${bar(all.length?done/all.length:0)}
      <p class="small muted">Domande da colloquio, in inglese, con una risposta modello. «Ascolta» usa la sintesi vocale del browser (Web Speech API): non fa richieste di rete. Se non c’è, leggi ad alta voce lo stesso.</p></div>
      <div class="grid">${all.map(s=>`<a class="card" style="text-decoration:none;color:inherit" href="#/en/speaking/${s.id}"><div class="spread"><span class="tag">${esc(s.kind)}</span>${S.enSpeak[s.id]>=3?'<span class="tag ok">fatto</span>':'<span class="tag">da fare</span>'}</div><p style="margin:.45rem 0 0"><b>${esc(s.question)}</b></p></a>`).join('')}</div>`;
    return}
  const s=all.find(x=>x.id===id);if(!s){B.go('#/en/speaking');return}
  const i=all.findIndex(x=>x.id===id);const prev=all[i-1],next=all[i+1];
  box.innerHTML=`<div class="small"><a href="#/en/speaking">Speaking</a> › ${esc(s.kind)}</div>
    <div class="card"><span class="tag">${esc(s.kind)}</span><p class="big"><b>${esc(s.question)}</b></p>
    <div class="row"><button class="btn" id="sp_q">🔊 Ascolta la domanda</button><button class="btn ghost" id="sp_a">🔊 Ascolta la risposta modello</button></div>
    <p class="small muted">${esc(s.coaching)}</p>
    <label for="sp_try">Appunti o la tua risposta (resta solo in questo browser)</label>
    <textarea id="sp_try" data-bind="ens_${s.id}">${B.tval('ens_'+s.id)}</textarea>
    <details class="card"><summary>Mostra la risposta modello</summary><div class="copybox" id="sp_sample" style="margin-top:.6rem"></div><p>${esc(s.notes)}</p></details>
    <p class="small muted">Dopo aver risposto ad alta voce, valuta quanto la tua risposta copriva struttura, contributo personale e risultato.</p>
    <div class="row rating thumb"><button class="btn danger" data-q="1">Ancora</button><button class="btn ghost" data-q="3">Difficile</button><button class="btn" data-q="4">Bene</button><button class="btn" data-q="5" style="background:var(--ok);border-color:var(--ok)">Facile</button></div></div>
    <div class="spread" style="margin-top:.8rem">${prev?`<a class="btn ghost" href="#/en/speaking/${prev.id}">← Precedente</a>`:'<span></span>'}${next?`<a class="btn ghost" href="#/en/speaking/${next.id}">Successiva →</a>`:''}</div>`;
  $('#sp_sample').textContent=s.sample;
  $('#sp_q').addEventListener('click',()=>speakEn(s.question));
  $('#sp_a').addEventListener('click',()=>speakEn(s.sample));
  $$('[data-q]',box).forEach(b=>b.addEventListener('click',()=>{const q=+b.dataset.q;S.enSpeak[s.id]=q;B.srsGrade('SP:'+s.id,q);B.toast(q>=3?'Speaking registrato':'Da riprovare');$$('[data-q]',box).forEach(x=>x.classList.toggle('sel',x===b))}));
}

/* ---- avvio ---- */
B.route();
})();
