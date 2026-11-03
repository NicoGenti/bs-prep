/* Generatori procedurali di esercizi di problem solving (pratica nello stile descritto, non domande reali). */
(function(){
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const fmt=(x,d)=>Number(x).toLocaleString('it-IT',{maximumFractionDigits:d==null?2:d});
function build(correct,distractors,n){ // returns {opts, ans}
  n=n||4;const set=[correct];
  for(const d of distractors){if(set.length>=n)break;if(d!==undefined&&d!==null&&!set.includes(d)&&String(d)!=='NaN')set.push(d)}
  let guard=0;while(set.length<n&&guard++<50){const c=typeof correct==='number'?correct+R(-12,12):correct+'?';if(!set.includes(c))set.push(c)}
  const opts=shuffle(set);return {opts,ans:opts.indexOf(correct)};
}
function numOpts(ans,ds){return build(ans,ds.filter(x=>Number.isFinite(x)&&x!==ans))}

/* ---------- SUCCESSIONI ---------- */
function seq(){
  const kind=R(0,5);let t=[],ans,expl;
  if(kind===0){const a=R(-10,30),d=pick([-7,-5,-4,-3,3,4,6,7,8,9,11,12,13]);for(let i=0;i<5;i++)t.push(a+i*d);ans=a+5*d;expl=`Successione aritmetica: si aggiunge sempre ${d}. ${t[4]} + (${d}) = ${ans}.`}
  else if(kind===1){const a=R(1,5),r=pick([2,3]);for(let i=0;i<5;i++)t.push(a*r**i);ans=a*r**5;expl=`Successione geometrica: ogni termine è il precedente × ${r}. ${t[4]} × ${r} = ${ans}.`}
  else if(kind===2){const a=R(1,10),d0=R(1,5),k=R(1,3);t=[a];for(let i=1;i<5;i++)t.push(t[i-1]+d0+k*(i-1));ans=t[4]+d0+k*4;const df=t.slice(1).map((x,i)=>x-t[i]);expl=`Le differenze sono ${df.join(', ')}: crescono di ${k} (differenze seconde costanti). Prossima differenza ${d0+k*4} → ${ans}.`}
  else if(kind===3){const a=R(1,4),m=2,b=R(20,40),d=R(2,5);const len=pick([6,7]);for(let i=0;i<len;i++)t.push(i%2===0?a*m**(i/2):b-d*((i-1)/2));const i=len;ans=i%2===0?a*m**(i/2):b-d*((i-1)/2);expl=`Due successioni intrecciate: posizioni dispari ${a}, ${a*2}, ${a*4}… (×2); posizioni pari ${b}, ${b-d}, ${b-2*d}… (−${d}). Il termine mancante è in posizione ${i+1} → ${ans}.`}
  else if(kind===4){if(Math.random()<.5){const a=R(1,4),c=pick([1,2,3,-1]);t=[a];for(let i=1;i<5;i++)t.push(t[i-1]*2+c);ans=t[4]*2+c;expl=`Ogni termine = precedente × 2 ${c>=0?'+':'−'} ${Math.abs(c)}. ${t[4]} × 2 ${c>=0?'+':'−'} ${Math.abs(c)} = ${ans}.`}else{const a=R(1,5),b=R(1,6);t=[a,b];for(let i=2;i<6;i++)t.push(t[i-1]+t[i-2]);ans=t[4]+t[5];expl=`Ogni termine è la somma dei due precedenti: ${t[4]} + ${t[5]} = ${ans}.`}}
  else{const s=R(1,4),k=pick([-2,-1,0,1,2,3]);for(let i=0;i<5;i++)t.push((i+s)**2+k);ans=(5+s)**2+k;expl=`Quadrati${k===0?'':(k>0?' + '+k:' − '+(-k))}: ${s}², ${s+1}², ${s+2}²… ${k?'con '+(k>0?'+':'')+k+' ':''}→ ${5+s}²${k===0?'':(k>0?' + '+k:' − '+(-k))} = ${ans}.`}
  const last=t[t.length-1],prev=t[t.length-2];
  const o=numOpts(ans,[ans+1,ans-1,ans+2,last+(last-prev),ans+(last-prev),ans-2,ans*2,last+1]);
  return {topic:'seq',q:`Qual è il prossimo numero?<div class="big"><b>${t.join(', ')}, ?</b></div>`,opts:o.opts.map(String),ans:o.ans,expl};
}

/* ---------- PERCENTUALI E PROBLEMI ---------- */
function arith(){
  const kind=R(0,5);
  if(kind===0){const P=R(2,15)*20,a=pick([10,20,25,30,40,50]),b=pick([10,20,25,30,50]);const f=P*(1+a/100)*(1-b/100);const o=numOpts(+f.toFixed(2),[+(P*(1+(a-b)/100)).toFixed(2),P,+(P*(1+a/100)).toFixed(2),+(f+P*0.05).toFixed(2)]);
    return {topic:'arith',q:`Un abbonamento costa ${fmt(P)} €. Il prezzo aumenta del ${a}% e poi viene scontato del ${b}%. Quanto costa ora?`,opts:o.opts.map(x=>fmt(x)+' €'),ans:o.ans,expl:`Le percentuali si moltiplicano: ${P} × ${fmt(1+a/100)} × ${fmt(1-b/100)} = ${fmt(f)} €. Non si sommano (${a}−${b}).`}}
  if(kind===1){const O=R(3,30)*10,d=pick([10,20,25,40,50]);const X=O*(1-d/100);const o=numOpts(O,[+(X*(1+d/100)).toFixed(2),X+d,+(X/(d/100)).toFixed(2),O+10]);
    return {topic:'arith',q:`Dopo uno sconto del ${d}%, una licenza software costa ${fmt(X)} €. Qual era il prezzo originale?`,opts:o.opts.map(x=>fmt(x)+' €'),ans:o.ans,expl:`Prezzo scontato = originale × ${fmt(1-d/100)} → originale = ${fmt(X)} / ${fmt(1-d/100)} = ${fmt(O)} €. Sbagliato: ${fmt(X)} × ${fmt(1+d/100)}.`}}
  if(kind===2){const pairs=[];for(let a=2;a<=12;a++)for(let b=a+1;b<=24;b++){const t=a*b/(a+b);if(Math.abs(t*2-Math.round(t*2))<1e-9)pairs.push([a,b,t])}const [a,b,t]=pick(pairs);const h=x=>{const H=Math.floor(x),M=Math.round((x-H)*60);return M?`${H} h ${M} min`:`${H} h`};const o=build(h(t),[h((a+b)/2),h(Math.abs(b-a)||1),h(t+1),h(Math.max(t-1,0.5)),h(a)]);
    return {topic:'arith',q:`Una pipeline A elabora un lotto di dati in ${a} ore, una pipeline B in ${b} ore. Lavorando in parallelo sullo stesso lotto, quanto impiegano?`,opts:o.opts,ans:o.ans,expl:`In un'ora fanno 1/${a} + 1/${b} del lavoro. t = ${a}·${b}/(${a}+${b}) = ${fmt(t)} h = ${h(t)}.`}}
  if(kind===3){const [v1,v2,v]=pick([[60,40,48],[30,60,40],[40,120,60],[20,30,24],[60,90,72],[50,75,60],[80,120,96],[45,90,60]]);const o=numOpts(v,[(v1+v2)/2,v+5,v-4,Math.max(v1,v2)-10]);
    return {topic:'arith',q:`Vai in ufficio a ${v1} km/h e torni sulla stessa strada a ${v2} km/h. Qual è la velocità media sull'intero percorso?`,opts:o.opts.map(x=>fmt(x)+' km/h'),ans:o.ans,expl:`Non è la media aritmetica (${fmt((v1+v2)/2)}). Con distanza d: tempo = d/${v1} + d/${v2}; velocità = 2d / tempo = 2·${v1}·${v2}/(${v1}+${v2}) = ${v} km/h.`}}
  if(kind===4){const n=R(3,6),m=R(8,20),t=m+R(1,3);const need=(n+1)*t-n*m;const o=numOpts(need,[t,need-1,need+n,t+(t-m)]);
    return {topic:'arith',q:`Nelle prime ${n} settimane il team ha chiuso in media ${m} ticket a settimana. Quanti ticket deve chiudere la settimana successiva per portare la media a ${t}?`,opts:o.opts.map(String),ans:o.ans,expl:`Totale richiesto: ${n+1} × ${t} = ${(n+1)*t}. Già chiusi: ${n} × ${m} = ${n*m}. Servono ${(n+1)*t} − ${n*m} = ${need}.`}}
  const A=R(2,25)*40,ch=pick([-25,-20,-10,15,25,50,12.5,-37.5]);const B=A*(1+ch/100);const o=build(fmt(ch,1)+'%',[fmt(-ch,1)+'%',fmt(+(((B-A)/B)*100).toFixed(1),1)+'%',fmt(ch*2,1)+'%',fmt(ch/2,1)+'%']);
  return {topic:'arith',q:`Gli utenti attivi passano da ${fmt(A)} a ${fmt(B)}. Qual è la variazione percentuale?`,opts:o.opts.map(x=>x.startsWith('-')?x:'+'+x),ans:o.ans,expl:`(nuovo − vecchio) / vecchio = (${fmt(B)} − ${fmt(A)}) / ${fmt(A)} = ${fmt(ch,1)}%. Si divide per il valore <b>iniziale</b>.`};
}

/* ---------- LOGICA ---------- */
const TERMS=['zorbi','flik','trumi','balti','quenti','morpi','dravi','sneli','vupi','krali','gromi','tesli'];
const SYL=[
 ['Tutti i {A} sono {B}.','Tutti i {B} sono {C}.','Tutti i {A} sono {C}.',true,'A ⊂ B ⊂ C, quindi A ⊂ C.'],
 ['Tutti i {A} sono {B}.','Nessun {B} è {C}.','Nessun {A} è {C}.',true,'A sta dentro B, e B è disgiunto da C: anche A lo è.'],
 ['Alcuni {A} sono {B}.','Alcuni {B} sono {C}.','Alcuni {A} sono {C}.',false,'I B che sono A possono essere diversi dai B che sono C: controesempio possibile.'],
 ['Tutti i {A} sono {B}.','Alcuni {B} sono {C}.','Alcuni {A} sono {C}.',false,'I B che sono C potrebbero stare tutti fuori da A.'],
 ['Tutti i {A} sono {B}.','Alcuni {C} sono {A}.','Alcuni {C} sono {B}.',true,'Quei C che sono A sono anche B.'],
 ['Tutti i {A} sono {B}.','—','Tutti i {B} sono {A}.',false,'Errore di conversione: A ⊂ B non implica B ⊂ A.'],
 ['Nessun {A} è {B}.','Tutti i {C} sono {B}.','Nessun {C} è {A}.',true,'C sta dentro B, e B è disgiunto da A.'],
 ['Tutti i {A} sono {B}.','Nessun {C} è {A}.','Nessun {C} è {B}.',false,'C può stare in B fuori da A: controesempio possibile.'],
 ['Alcuni {A} non sono {B}.','Tutti i {C} sono {B}.','Alcuni {A} non sono {C}.',true,'Un A fuori da B è anche fuori da C (perché C ⊂ B).'],
 ['Tutti i {A} sono {B}.','Tutti i {C} sono {B}.','Alcuni {A} sono {C}.',false,'A e C possono essere due parti separate di B.'],
 ['Nessun {A} è {B}.','Alcuni {C} sono {A}.','Alcuni {C} non sono {B}.',true,'I C che sono A non possono essere B.'],
 ['Alcuni {A} sono {B}.','Tutti i {B} sono {C}.','Alcuni {A} sono {C}.',true,'Gli A che sono B sono anche C.']
];
const COND=[
 ['Se il build passa, il deploy parte.','Il build passa.','Il deploy parte.',true,'Modus ponens: P→Q, P ⇒ Q.'],
 ['Se il build passa, il deploy parte.','Il deploy non è partito.','Il build non è passato.',true,'Modus tollens: P→Q, non Q ⇒ non P.'],
 ['Se il build passa, il deploy parte.','Il deploy è partito.','Il build è passato.',false,'Affermazione del conseguente: il deploy potrebbe essere partito per altri motivi (es. manualmente).'],
 ['Se il build passa, il deploy parte.','Il build non è passato.','Il deploy non parte.',false,'Negazione dell\u2019antecedente: P→Q non dice cosa succede se P è falso.'],
 ['Se la cache è piena, le risposte rallentano.','Le risposte non sono rallentate.','La cache non è piena.',true,'Modus tollens.'],
 ['Se un test fallisce, la PR viene bloccata.','La PR è stata bloccata.','Un test è fallito.',false,'Affermazione del conseguente: la PR può essere bloccata per una review negativa.'],
 ['Solo se hai i permessi puoi fare merge.','Marco ha fatto merge.','Marco ha i permessi.',true,'"Solo se P, Q" significa Q→P; Q è vero quindi P.'],
 ['Solo se hai i permessi puoi fare merge.','Giulia ha i permessi.','Giulia ha fatto merge.',false,'Avere i permessi è necessario, non sufficiente.']
];
const NAMES=['Anna','Bruno','Carla','Dario','Elena','Fabio','Giulia'];
function logic(){
  const kind=R(0,2);
  const yes='Segue necessariamente',no='Non segue necessariamente';
  if(kind===0){const s=pick(SYL);const [A,B,C]=shuffle(TERMS).slice(0,3);const f=x=>x.replace(/\{A\}/g,A).replace(/\{B\}/g,B).replace(/\{C\}/g,C);
    const opts=[yes,no];return {topic:'logic',q:`<p>Premesse:</p><ul><li>${f(s[0])}</li>${s[1]!=='—'?`<li>${f(s[1])}</li>`:''}</ul><p>Conclusione: <b>${f(s[2])}</b></p>`,opts,ans:s[3]?0:1,expl:s[4].replace(/A/g,A).replace(/B/g,B).replace(/C/g,C)+' (Le parole inventate evitano il belief bias.)'}}
  if(kind===1){const s=pick(COND);return {topic:'logic',q:`<p>Premesse:</p><ul><li>${s[0]}</li><li>${s[1]}</li></ul><p>Conclusione: <b>${s[2]}</b></p>`,opts:[yes,no],ans:s[3]?0:1,expl:s[4]}}
  const n=R(4,5);const order=shuffle(NAMES).slice(0,n);
  const ctx=pick([{bef:'è arrivato/a in ufficio prima di',aft:'è arrivato/a in ufficio dopo',first:'arrivato/a per primo/a',last:'arrivato/a per ultimo/a',pos:'arrivato/a'},{bef:'ha finito il test prima di',aft:'ha finito il test dopo',first:'ha finito per primo/a',last:'ha finito per ultimo/a',pos:'ha finito'}]);
  const rel=[];for(let i=0;i<n-1;i++)rel.push(Math.random()<.5?`${order[i]} ${ctx.bef} ${order[i+1]}.`:`${order[i+1]} ${ctx.aft} ${order[i]}.`);
  rel.push(`Nessuno è arrivato/a insieme a un altro.`.replace('è arrivato/a insieme a un altro','ha pari merito con un altro'));
  const pos=R(1,n);const ask=pos===1?`Chi ${ctx.first.startsWith('ha')?'':'è '}${ctx.first}?`:pos===n?`Chi ${ctx.last.startsWith('ha')?'':'è '}${ctx.last}?`:`Chi ${ctx.pos.startsWith('ha')?'':'è '}${ctx.pos} in posizione ${pos}?`;
  const opts=shuffle(order.slice());
  return {topic:'logic',q:`<p>Sai che:</p><ul>${shuffle(rel.slice(0,-1)).map(r=>'<li>'+r+'</li>').join('')}<li>${rel[rel.length-1]}</li></ul><p>${ask}</p>`,opts,ans:opts.indexOf(order[pos-1]),expl:`Metti in fila le relazioni una alla volta su una linea: ${order.join(' → ')}. In posizione ${pos}: ${order[pos-1]}.`};
}

/* ---------- MATRICI ---------- */
const SHAPES=['circle','square','triangle','diamond'];
const SH_IT={circle:'cerchi',square:'quadrati',triangle:'triangoli',diamond:'rombi'};
function shapeSvg(sh,x,y,s,fill){const st=`stroke="currentColor" stroke-width="3" fill="${fill==='solid'?'currentColor':'none'}"`;
  if(sh==='circle')return `<circle cx="${x}" cy="${y}" r="${s/2}" ${st}/>`;
  if(sh==='square')return `<rect x="${x-s/2}" y="${y-s/2}" width="${s}" height="${s}" ${st}/>`;
  if(sh==='triangle')return `<polygon points="${x},${y-s/2} ${x+s/2},${y+s/2} ${x-s/2},${y+s/2}" ${st}/>`;
  return `<polygon points="${x},${y-s/2} ${x+s/2},${y} ${x},${y+s/2} ${x-s/2},${y}" ${st}/>`;}
function cellSvg(c){let inner='';
  if(c.arrow!=null){inner=`<g transform="rotate(${c.arrow} 50 50)"><line x1="50" y1="78" x2="50" y2="24" stroke="currentColor" stroke-width="6"/><polygon points="50,14 64,34 36,34" fill="currentColor"/></g>`}
  else{const pos={1:[[50,50]],2:[[30,50],[70,50]],3:[[50,27],[28,70],[72,70]],4:[[30,30],[70,30],[30,70],[70,70]]}[c.count];const s=c.count===1?40:c.count===2?30:24;inner=pos.map(p=>shapeSvg(c.shape,p[0],p[1],s,c.fill)).join('')}
  return `<svg class="cell" viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;}
const ckey=c=>JSON.stringify(c);
function matrix(){
  const cells=[];let expl,correct,variants=[];
  if(Math.random()<.7){
    const S=shuffle(SHAPES).slice(0,3);const latin=Math.random()<.5;const cntRule=R(0,1);const fillRule=R(0,2);
    for(let r=0;r<3;r++)for(let c=0;c<3;c++){cells.push({shape:S[latin?(r+c)%3:r],count:cntRule===0?c+1:r+1,fill:fillRule===0?(c===1?'solid':'outline'):fillRule===1?(r%2?'solid':'outline'):'outline'})}
    correct=cells[8];
    const others=SHAPES.filter(s=>s!==correct.shape);
    variants=[{...correct,shape:others[0]},{...correct,shape:others[1]},{...correct,count:correct.count===3?2:3},{...correct,count:correct.count===1?2:(correct.count===4?3:4)},{...correct,fill:correct.fill==='solid'?'outline':'solid'},{...correct,shape:others[2],fill:correct.fill==='solid'?'outline':'solid'}];
    expl=`Numero: ${cntRule===0?'1, 2, 3 da sinistra a destra in ogni riga':'1, 2, 3 dall\u2019alto in basso (costante nella riga)'}. Forma: ${latin?'ogni forma compare una volta per riga e per colonna (quadrato latino)':'costante in ogni riga'}. Riempimento: ${fillRule===0?'pieno solo nella colonna centrale':fillRule===1?'pieno solo nella riga centrale':'sempre vuoto'}. Quindi: ${correct.count} ${SH_IT[correct.shape]}, ${correct.fill==='solid'?'pieni':'vuoti'}.`;
  }else{
    const step=pick([45,90,135]),start=pick([0,45,90]);for(let i=0;i<9;i++)cells.push({arrow:(start+i*step)%360});correct=cells[8];
    variants=[1,2,3,4,5,6,7].map(k=>({arrow:(correct.arrow+k*45)%360}));
    expl=`La freccia ruota di ${step}° in senso orario a ogni cella, leggendo riga per riga (sinistra→destra, poi a capo). L'ultima cella è a ${correct.arrow}°.`;
  }
  const seen=new Set([ckey(correct)]);const ds=[];for(const v of shuffle(variants)){const k=ckey(v);if(!seen.has(k)){seen.add(k);ds.push(v)}if(ds.length===5)break}
  const opts=shuffle([correct,...ds]);
  const grid=cells.map((c,i)=>i===8?`<svg class="cell" viewBox="0 0 100 100"><text x="50" y="64" text-anchor="middle" font-size="44" fill="currentColor">?</text></svg>`:cellSvg(c)).join('');
  return {topic:'matrix',svg:true,q:`<p>Quale figura completa la matrice?</p><div class="mgrid">${grid}</div>`,opts:opts.map(cellSvg),ans:opts.indexOf(correct),expl,_keys:opts.map(ckey),_correctKey:ckey(correct)};
}

/* ---------- STIME ---------- */
function sig(x){if(x===0)return 0;const p=Math.pow(10,Math.floor(Math.log10(Math.abs(x)))-1);return Math.round(x/p)*p}
function magOpts(ans,unit){const vals=[ans,ans*10,ans/10,ans*100].map(sig);const o=build(vals[0],vals.slice(1));return {opts:o.opts.map(v=>'≈ '+fmt(v,v<1?3:0)+' '+unit),ans:o.ans}}
function estim(){
  const kind=R(0,3);
  if(kind===0){const M=pick([5,10,20,50,100,200,500]);const qps=M*1e6/86400;const o=magOpts(qps,'richieste/s');
    return {topic:'estim',q:`Un servizio riceve ${M} milioni di richieste al giorno, distribuite in modo uniforme. Quante richieste al secondo in media, circa?`,...o,expl:`${M}·10⁶ / 86.400 s ≈ ${fmt(sig(qps),0)}/s. Scorciatoia: 1 M/giorno ≈ 12/s. Il picco reale è spesso 2–10× la media.`}}
  if(kind===1){const U=pick([1,2,5,10,20,50]),p=pick([1,2,3,5]),s=pick([2,3,4,5]);const tb=U*1e6*p*s/1e6;const o=magOpts(tb,'TB/giorno');
    return {topic:'estim',q:`${U} milioni di utenti attivi al giorno caricano in media ${p} foto da ${s} MB ciascuna. Quanto storage nuovo serve al giorno?`,...o,expl:`${U}·10⁶ × ${p} × ${s} MB = ${fmt(U*p*s)}·10⁶ MB = ${fmt(tb)} TB al giorno (1 TB = 10⁶ MB).`}}
  if(kind===2){const N=pick([10,50,100,200,500]),b=pick([2,4,5,8]);const gbps=N*1000*b/1000;const o=magOpts(gbps,'Gbps');
    return {topic:'estim',q:`${N}.000 utenti guardano contemporaneamente un video a ${b} Mbps. Quanta banda in uscita serve in totale?`,...o,expl:`${N}.000 × ${b} Mbps = ${fmt(N*1000*b)} Mbps = ${fmt(gbps)} Gbps.`}}
  const P=pick([100,200,400,500,1000])*1000,q=pick([10,20,25,40]),K=pick([200,250,400,500]);const bars=P*q/100/K;const o=magOpts(bars,'bar');
  return {topic:'estim',q:`Una città ha ${fmt(P)} abitanti. Ogni giorno il ${q}% di loro beve un caffè al bar. Un bar serve in media ${K} caffè al giorno. Quanti bar ci sono, circa?`,...o,expl:`Caffè al giorno: ${fmt(P)} × ${q}% = ${fmt(P*q/100)}. Bar: ${fmt(P*q/100)} / ${K} ≈ ${fmt(bars,0)}. Scomporre in fattori e dichiarare le ipotesi è il metodo delle stime di Fermi.`};
}
window.GEN={seq,arith,logic,matrix,estim};
window.GEN_LABELS={seq:'Successioni',arith:'Percentuali e problemi',logic:'Logica',matrix:'Matrici',estim:'Stime'};
})();
