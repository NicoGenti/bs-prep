/* Viste: home, ripasso, corso, lezione, impostazioni */
(function(){
'use strict';
const B=window.BS,{esc,$,$$,pct,bar}=B;
const PRACTICE={cv:'#/cv/bullet',cover:'#/cv/lettera',github:'#/cv/github',seq:'#/ps/test/seq',arith:'#/ps/test/arith',logic:'#/ps/test/logic',matrix:'#/ps/test/matrix',estim:'#/ps/test/estim',algo:'#/ps/algoritmi',python:'#/tech/quiz/python',k8s:'#/tech/quiz/k8s',grpc:'#/tech/quiz/grpc',docker:'#/tech/quiz/docker',sysdesign:'#/tech/design',simplify:'#/tech/quiz/simplify',star:'#/behav/mock',culture:'#/behav/cultura',refs:'#/refs','en-vocab':'#/en/flashcard','en-mistakes':'#/en/esercizi','en-writing':'#/en/esercizi','en-speaking':'#/en/speaking'};
B.PRACTICE=PRACTICE;
const STEPS=[['CV e candidatura','CV breve in inglese, lettera facoltativa, link GitHub','#/cv','cv'],['Test (più round)','Problem solving, comportamentale, tecnico. 1–6 ore in tutto, alcuni con proctoring','#/ps','ps'],['Test tecnici','Domande specifiche del ruolo','#/tech','tech'],['2–3 colloqui','Approfondimento su esperienze e ragionamento','#/behav','behav'],['Referenze','Persone che confermano i tuoi risultati','#/refs','refs'],['Hiring committee','Decisione finale','#/home',null]];

B.ROUTES.home=function(app){const S=B.S;const r=B.readiness();const due=B.dueCards().length;const weak=B.weakTopics();
  const label=r>=.85?'Pronto a candidarti':r>=.7?'Quasi pronto':r>=.4?'In crescita':'Agli inizi';
  const next=window.LESSONS.find(l=>!(S.lessons[l.id]&&S.lessons[l.id].done));
  const days=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');days.push([ds,S.activity[ds]||0])}
  app.innerHTML=`<h1>Preparazione Bending Spoons</h1>
  <p class="muted">Allenamento per il ruolo di Software Engineer. Gli esercizi sono <b>pratica nello stile descritto</b> pubblicamente dall'azienda, non le domande reali dei test.</p>
  <p class="small muted">Ultimo aggiornamento contenuti: ${esc(window.CONTENT_UPDATED?B.fmtDate(window.CONTENT_UPDATED):'—')}</p>
  <div class="card"><div class="spread"><h2 style="margin:0">Prontezza alla candidatura</h2><span class="big"><b>${pct(r)}%</b> · ${label}</span></div>
   <div class="meter" style="margin:.6rem 0"><i style="width:${pct(r)}%"></i></div>
   <div class="callout small">⏳ <b>Promemoria:</b> se non superi il processo, puoi ricandidarti solo dopo <b>12 mesi</b>. Conviene candidarsi quando questo indicatore è alto e i punti deboli sono coperti.</div></div>
  <div class="grid">
   <div class="card"><h3 style="margin-top:0">🧠 Ripasso di oggi</h3><p class="big"><b>${due}</b> carte da ripassare</p>${due?'<a class="btn" href="#/review">Inizia il ripasso</a>':'<p class="muted small">Niente in scadenza. Completa una lezione o un quiz per aggiungere carte.</p>'}</div>
   <div class="card"><h3 style="margin-top:0">🔥 Serie</h3><p class="big"><b>${B.streakNow()}</b> ${B.streakNow()===1?"giorno":"giorni"} · record ${S.streak.best||0}</p>
    <div class="row" style="gap:3px" aria-label="Attività ultimi 14 giorni">${days.map(([d,n])=>`<span title="${B.fmtDate(d)}: ${n} attività" style="width:16px;height:16px;border-radius:4px;background:${n?'var(--accent)':'var(--soft)'};opacity:${n?Math.min(1,.35+n/15):1}"></span>`).join('')}</div><p class="small muted">Ultimi 14 giorni</p></div>
   <div class="card"><h3 style="margin-top:0">▶️ Prossima lezione</h3>${next?`<p><b>${esc(next.title)}</b><br><span class="small muted">${esc(window.TOPICS[next.topic].label)} · ${next.mins} min</span></p><a class="btn" href="#/lesson/${next.id}">Studia ora</a>`:'<p>Hai completato tutte le lezioni. 🎉 Ora ripassa e fai simulazioni.</p>'}</div>
  </div>
  <h2>Le fasi del processo</h2>
  <div class="timeline">${STEPS.map((s,i)=>`<a href="${s[2]}"><span class="small muted">Fase ${i+1}</span><b>${s[0]}</b><span class="small muted">${s[1]}</span>${s[3]?`<div style="margin-top:.4rem">${bar(B.secProg(s[3]))}</div>`:''}</a>`).join('')}</div>
  <h2>Progresso per sezione</h2>
  <div class="grid">${Object.keys(window.SECTIONS).map(k=>{const p=B.secProg(k);return `<a class="card" style="text-decoration:none;color:inherit" href="#/${k}"><div class="spread"><b>${window.SECTIONS[k].icon} ${window.SECTIONS[k].label}</b><span>${pct(p)}%</span></div>${bar(p)}<ul class="small muted" style="padding-left:1rem;margin:.5rem 0 0">${B.sectionParts(k).map(x=>`<li>${x[0]}: ${pct(x[1])}%</li>`).join('')}</ul></a>`}).join('')}</div>
  ${weak.length?`<h2>⚠️ Argomenti deboli da ripassare</h2><div class="card">${weak.slice(0,6).map(w=>`<div class="spread" style="padding:.3rem 0"><span><b>${esc(window.TOPICS[w.t].label)}</b> <span class="small muted">accuratezza ${pct(w.acc)}% su ${w.n} risposte</span></span><span><a class="btn sm" href="#/lesson/${B.firstLesson(w.t)}">Rileggi la lezione</a><a class="btn sm ghost" href="${PRACTICE[w.t]}">Esercitati</a></span></div>`).join('')}</div>`:''}
  <h2>Padronanza per argomento</h2>
  <div class="card">${Object.keys(window.SECTIONS).map(sec=>`<h3>${window.SECTIONS[sec].icon} ${window.SECTIONS[sec].label}</h3>${Object.keys(window.TOPICS).filter(t=>window.TOPICS[t].section===sec).map(t=>{const m=B.mastery(t);return `<div style="margin:.35rem 0"><div class="spread small"><a href="#/lesson/${B.firstLesson(t)}">${esc(window.TOPICS[t].label)}</a><span class="muted">${B.mLabel(m.level)} · ${pct(m.level)}%${m.n?` (${m.n})`:''}</span></div>${bar(m.level,m.n>=3&&m.acc<.65)}</div>`}).join('')}`).join('')}
  <p class="small muted">La padronanza combina l'accuratezza recente (verifiche delle lezioni, quiz, test, flashcard, autovalutazioni) con la quantità di pratica: servono circa 10 risposte per arrivare al massimo.</p></div>
  <h2>Informazioni utili</h2>
  <div class="card small"><ul>
   <li>Valutano soprattutto il <b>potenziale di lungo periodo</b> e la <b>velocità di apprendimento</b>, più dell'esperienza attuale.</li>
   <li>Requisiti: capacità di ragionamento, drive, spirito di squadra, inglese.</li>
   <li>Nell'annuncio: <i>"Amplify your impact with AI"</i>, <i>"Simplify relentlessly"</i>, stack diversi.</li>
   <li>Retribuzione indicativa (Europa, fuori Londra): <b>66.065–107.837 €</b> tipica, fino a <b>240.330 €</b> per profili eccezionali.</li>
   <li>Se gonfi i risultati nel CV o nei colloqui, non ricevi un'offerta: il controllo referenze serve a verificarli.</li></ul>
   <p>Fonti ufficiali: <a href="https://bndspn.com/process-document" target="_blank" rel="noopener">documento sul processo</a> · <a href="https://jobs.bendingspoons.com/positions/69c3ec6cf2164aed6ede175b" target="_blank" rel="noopener">annuncio</a> · <a href="https://bendingspoons.com/documents/Culture&amp;Policies%E2%80%94RadicalCandor.pdf" target="_blank" rel="noopener">Radical Candor</a> · <a href="https://bendingspoons.com/careers" target="_blank" rel="noopener">careers</a> (servono una connessione internet)</p></div>`};

/* ---- Ripasso / flashcard ---- */
B.ROUTES.review=function(app,args){const S=B.S;const topic=args[0];let queue;
  if(topic&&window.TOPICS[topic]){const all=Object.values(B.CARDS).filter(c=>c.topic===topic&&!c.hideInDeck).map(c=>c.id);const t=B.today();
    const due=all.filter(id=>S.srs[id]&&S.srs[id].due<=t),fresh=B.shuffle(all.filter(id=>!S.srs[id])),later=all.filter(id=>S.srs[id]&&S.srs[id].due>t);queue=[...B.shuffle(due),...fresh,...B.shuffle(later)]}
  else queue=B.shuffle(B.dueCards());
  const total=queue.length;let done=0,i=0;
  const topicsWithCards=Object.keys(window.TOPICS).filter(t=>Object.values(B.CARDS).some(c=>c.topic===t&&!c.hideInDeck));
  app.innerHTML=`<h1>${topic?'Flashcard: '+esc(window.TOPICS[topic].label):'Ripasso di oggi'}</h1>
   <p class="muted small">Ripetizione spaziata (algoritmo SM-2): valuta quanto bene ricordavi la risposta. Le carte facili tornano tra più giorni, quelle sbagliate oggi stesso.</p>
   <div class="row"><label style="margin:0">Mazzo:</label><select id="deck" style="max-width:320px"><option value="">Carte in scadenza oggi (${B.dueCards().length})</option>${topicsWithCards.map(t=>`<option value="${t}" ${t===topic?'selected':''}>${esc(window.TOPICS[t].label)}</option>`).join('')}</select></div>
   <div id="fc"></div>`;
  $('#deck').addEventListener('change',e=>B.go('#/review'+(e.target.value?'/'+e.target.value:'')));
  const box=$('#fc');
  function show(){if(i>=queue.length){box.innerHTML=`<div class="card"><h2>✅ Fatto!</h2><p>${done?`Hai ripassato ${done} carte.`:'Nessuna carta in scadenza.'} ${B.dueCards().length?`Restano ${B.dueCards().length} carte per oggi.`:''}</p><p class="small muted">Per aggiungere carte: completa le lezioni (i concetti chiave entrano nel ripasso) oppure apri un mazzo per argomento.</p><a class="btn" href="#/course">Vai al corso</a> <a class="btn ghost" href="#/home">Home</a></div>`;B.toast&&done&&B.toast('Ripasso completato');return}
    const id=queue[i],c=B.CARDS[id],st=S.srs[id];
    box.innerHTML=`<div class="spread small muted" style="margin-top:1rem"><span>Carta ${i+1} di ${queue.length} · ${esc(window.TOPICS[c.topic].label)}</span><span>${st?`Intervallo ${st.int} gg · facilità ${st.ef.toFixed(2)}`:'<span class="tag">nuova</span>'}</span></div>
     <div class="card flash" id="face" tabindex="0" role="button" aria-label="Gira la carta"><div>${c.front}<div class="small muted" style="margin-top:.8rem">Tocca per vedere la risposta</div></div></div>
     <div id="rate" style="display:none"><div class="row"><button class="btn danger" data-q="1">Ancora</button><button class="btn ghost" data-q="3">Difficile</button><button class="btn" data-q="4">Bene</button><button class="btn" data-q="5" style="background:var(--ok);border-color:var(--ok)">Facile</button></div>${c.lesson?`<p class="small"><a href="#/lesson/${c.lesson}">📖 Apri la lezione</a></p>`:''}</div>`;
    const face=$('#face');const flip=()=>{face.innerHTML=`<div><div class="small muted">${c.front}</div><hr style="border:0;border-top:1px solid var(--border);margin:.8rem 0">${c.back}</div>`;$('#rate').style.display='block';face.style.cursor='default'};
    face.addEventListener('click',flip,{once:true});face.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();flip()}});
    $$('#rate [data-q]').forEach(b=>b.addEventListener('click',()=>{const q=+b.dataset.q;B.srsGrade(id,q);done++;if(q<3)queue.push(id);i++;show()}))}
  show()};

/* ---- Corso ---- */
B.ROUTES.course=function(app){const S=B.S;const done=window.LESSONS.filter(l=>S.lessons[l.id]&&S.lessons[l.id].done).length;
  app.innerHTML=`<h1>📚 Corso completo</h1><p class="muted">${window.LESSONS.length} lezioni in italiano con spiegazioni, esempi ed esercizi svolti. Ogni lezione si chiude con una breve verifica: superandola, i concetti chiave entrano nel ripasso spaziato.</p>
  <div class="card"><div class="spread"><b>Lezioni completate</b><span>${done} / ${window.LESSONS.length}</span></div>${bar(done/window.LESSONS.length)}</div>
  ${Object.keys(window.SECTIONS).map(sec=>`<h2>${window.SECTIONS[sec].icon} ${window.SECTIONS[sec].label}</h2>${B.lessonList(sec)}`).join('')}`};

/* ---- Lezione ---- */
B.ROUTES.lesson=function(app,args){const S=B.S;const L=window.LESSONS,idx=L.findIndex(l=>l.id===args[0]);if(idx<0){B.go('#/course');return}
  const l=L[idx],prev=L[idx-1],next=L[idx+1],sec=window.TOPICS[l.topic].section,st=S.lessons[l.id];
  app.innerHTML=`<div class="small"><a href="#/course">Corso</a> › <a href="#/${sec}">${window.SECTIONS[sec].label}</a> › ${esc(window.TOPICS[l.topic].label)}</div>
  <h1>${esc(l.title)}</h1><div class="row small muted"><span>⏱ ${l.mins} min</span>${st&&st.done?`<span class="tag ok">Completata il ${B.fmtDate(st.date)} · verifica ${pct(st.score)}%</span>`:''}</div>
  <article class="card lesson">${l.html}</article>
  ${(l.cards||[]).length?`<details class="card"><summary>🧠 Concetti chiave (${l.cards.length} flashcard)</summary><table style="margin-top:.6rem">${l.cards.map(c=>`<tr><td>${esc(c[0])}</td><td>${esc(c[1])}</td></tr>`).join('')}</table></details>`:''}
  <h2>✔️ Verifica di comprensione</h2><div id="checks"></div><div id="result"></div>
  <div class="spread" style="margin-top:1.2rem">${prev?`<a class="btn ghost" href="#/lesson/${prev.id}">← ${esc(prev.title)}</a>`:'<span></span>'}${next?`<a class="btn ghost" href="#/lesson/${next.id}">${esc(next.title)} →</a>`:''}</div>`;
  const checks=l.check||[];const box=$('#checks');let answered=0,correct=0;
  checks.forEach((c,k)=>{const d=document.createElement('div');d.className='card';box.appendChild(d);
    B.renderMCQ(d,(()=>{const q=B.checkItem(c);q.q=`<div class="small muted">Domanda ${k+1} di ${checks.length}</div>`+q.q;return q})(),ok=>{answered++;if(ok)correct++;B.record(l.topic,ok?1:0);if(answered===checks.length)finish()})});
  function finish(){const score=checks.length?correct/checks.length:1;const passed=score>=.6;
    if(passed){const prevDone=st&&st.done;S.lessons[l.id]={done:true,score:Math.max(score,(st&&st.score)||0),date:B.today()};let added=0;(l.cards||[]).forEach((_,i)=>{if(B.srsAdd('L:'+l.id+':'+i))added++});B.save();B.touch();
      $('#result').innerHTML=`<div class="card" style="border-color:var(--ok)"><h3 style="margin-top:0">🎉 Lezione completata: ${correct}/${checks.length}</h3><p>${added?`${added} concetti aggiunti al ripasso di oggi.`:prevDone?'Risultato aggiornato.':''}</p><div class="row">${next?`<a class="btn" href="#/lesson/${next.id}">Lezione successiva</a>`:''}<a class="btn ghost" href="${PRACTICE[l.topic]}">Esercitati su questo argomento</a><a class="btn ghost" href="#/review">Ripasso</a></div></div>`}
    else{B.save();$('#result').innerHTML=`<div class="card" style="border-color:var(--warn)"><h3 style="margin-top:0">${correct}/${checks.length}: ripassa e riprova</h3><p>Serve almeno il 60% per completare la lezione. Rileggi le parti che non erano chiare e rifai la verifica.</p><button class="btn" id="retry">Rifai la verifica</button></div>`;$('#retry').addEventListener('click',()=>B.route())}
    $('#result').scrollIntoView({behavior:'smooth',block:'center'})}
  if(!checks.length)finish()};

/* ---- Impostazioni ---- */
B.ROUTES.settings=function(app){const S=B.S;const size=new Blob([JSON.stringify(S)]).size;
  app.innerHTML=`<h1>⚙️ Impostazioni e dati</h1>
  <div class="card" id="syncCard" hidden><h3 style="margin-top:0">Sincronizzazione GitHub</h3><div id="syncBody"></div></div>
  <div class="card"><h3 style="margin-top:0">Tema</h3><div class="row"><button class="btn ghost" data-theme-set="light">☀️ Chiaro</button><button class="btn ghost" data-theme-set="dark">🌙 Scuro</button></div></div>
  <div class="card"><h3 style="margin-top:0">Esporta / importa i progressi</h3><p class="small muted">I dati restano solo in questo browser (localStorage, ${(size/1024).toFixed(1)} KB). Esporta un file JSON per fare un backup o spostarti su un altro dispositivo.</p>
   <div class="row"><button class="btn" id="exp">⬇️ Esporta JSON</button><label class="btn ghost" style="margin:0;font-weight:400">⬆️ Importa JSON<input type="file" id="imp" accept="application/json,.json" hidden></label></div></div>
  <div class="card"><h3 style="margin-top:0">Ripasso</h3><p class="small muted">Aggiungi subito al ripasso tutte le ${Object.keys(B.CARDS).length} carte (concetti delle lezioni e domande dei quiz), anche quelle degli argomenti non ancora studiati.</p><button class="btn ghost" id="addall">Aggiungi tutte le carte</button></div>
  <div class="card" style="border-color:var(--bad)"><h3 style="margin-top:0">Azzera i progressi</h3><p class="small muted">Cancella lezioni, punteggi, storie STAR, referenze e testi salvati. Non si può annullare: esporta prima un backup.</p><button class="btn danger" id="reset">Azzera tutto</button></div>`;
  $$('[data-theme-set]').forEach(b=>b.addEventListener('click',()=>{document.documentElement.dataset.theme=b.dataset.themeSet;B.S.theme=b.dataset.themeSet;B.save()}));
  $('#exp').addEventListener('click',()=>{B.saveNow();const blob=new Blob([JSON.stringify({app:'bs-prep',exported:new Date().toISOString(),data:B.S},null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bs-prep-progressi-'+B.today()+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);B.toast('File esportato')});
  $('#imp').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const j=JSON.parse(rd.result);const d=j&&j.data?j.data:j;if(!d||typeof d!=='object'||d.v!==1||!d.srs)throw new Error('formato');if(!confirm('Sostituire i progressi attuali con quelli del file?'))return;B.replaceState(d);if(d.theme)document.documentElement.dataset.theme=d.theme;B.toast('Progressi importati');B.go('#/home');B.route()}catch(err){alert('File non valido: non sembra un export di BS Prep.')}};rd.readAsText(f)});
  $('#addall').addEventListener('click',()=>{let n=0;Object.keys(B.CARDS).forEach(id=>{if(B.srsAdd(id))n++});B.save();B.route();B.toast(n+' carte aggiunte')});
  $('#reset').addEventListener('click',()=>{if(confirm('Vuoi davvero cancellare tutti i progressi?')&&confirm('Ultima conferma: cancello tutto?')){const th=B.S.theme;B.resetState();B.S.theme=th;B.saveNow();B.toast('Progressi azzerati');B.go('#/home');B.route()}});
  if(window.BSSync)window.BSSync.mountSettings()};
})();
