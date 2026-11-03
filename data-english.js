/* Inglese tecnico per la selezione e per il lavoro in Bending Spoons.
   Spiegazioni in italiano, materiale da praticare in inglese.
   Gli id (lezioni, carte per indice, enx-*, ens-*) sono stabili: il ripasso SM-2 li usa. */
window.EN_SECTION = {label:'Inglese tecnico', icon:'🇬🇧'};
window.EN_TOPICS = {
  'en-vocab':{label:'Vocabolario tecnico', section:'en'},
  'en-mistakes':{label:'False friends ed errori', section:'en'},
  'en-writing':{label:'Scrittura al lavoro', section:'en'},
  'en-speaking':{label:'Parlare in colloquio', section:'en'}
};
window.EN_LESSONS = [
{id:'en-vocab-swe',topic:'en-vocab',title:'Il vocabolario che usi ogni giorno da software engineer',mins:14,html:String.raw`
<p>In un’azienda che lavora solo in inglese i nomi delle cose non si traducono al volo: si usano i termini precisi. Questa lezione è il nucleo che trovi in PR, incidenti, design doc e colloqui.</p>
<h3>Rilasciare e tornare indietro</h3>
<ul>
<li><b>Deploy / roll out</b>: mettere in produzione. <i>We rolled out the change to 10% of users.</i></li>
<li><b>Rollback</b>: tornare alla versione precedente. Non è un <i>revert</i> del commit: il revert è l’operazione su git, il rollback è l’effetto in produzione.</li>
<li><b>Hotfix</b>: correzione urgente sulla linea di produzione. Un <b>patch</b> è più generico (piccola modifica).</li>
<li><b>Ship</b>: consegnare agli utenti. Informale ma comunissimo: <i>We shipped it on Tuesday.</i></li>
</ul>
<h3>Cambi che non rompono i client</h3>
<p>Una modifica è <b>backward compatible</b> se i client vecchi continuano a funzionare. Il contrario è una <b>breaking change</b>: va versionata o annunciata. Aggiungere un campo opzionale di solito è compatibile; rinominare o cambiare il tipo no.</p>
<h3>Comportamento sotto errori e concorrenza</h3>
<ul>
<li><b>Idempotent</b>: rifare l’operazione non cambia il risultato oltre la prima volta. Fondamentale con i retry.</li>
<li><b>Race condition</b>: il risultato dipende dall’ordine imprevedibile di due operazioni.</li>
<li><b>Deadlock</b>: due parti si aspettano a vicenda e non procede nessuno.</li>
<li><b>Regression</b>: qualcosa che prima funzionava e ora è rotto.</li>
</ul>
<h3>Come ne parli in una review</h3>
<pre>This endpoint is not idempotent: a retry can charge the user twice.
Can we key the request by an idempotency key before we ship it?</pre>
<p class="muted">Nota l’ordine: osservazione concreta, conseguenza, richiesta.</p>`,
cards:[
['Deploy / roll out','Mettere in produzione. "We rolled out the change to 10% of users."'],
['Rollback','Tornare alla versione precedente in produzione. Il revert è l’operazione su git.'],
['Hotfix','Correzione urgente in produzione. Patch è una modifica piccola, non necessariamente urgente.'],
['Ship','Consegnare agli utenti. "We shipped the fix on Tuesday."'],
['Backward compatible','I client vecchi continuano a funzionare. Aggiungere un campo opzionale di solito lo è.'],
['Breaking change','Modifica che rompe i client esistenti. Va versionata o annunciata.'],
['Idempotent','Ripetere l’operazione non ha effetti oltre la prima volta. Serve con i retry.'],
['Race condition','Il risultato dipende dall’ordine non deterministico di due operazioni concorrenti.'],
['Deadlock','Due parti si bloccano a vicenda aspettandosi l’un l’altra.'],
['Regression','Un comportamento che prima era corretto e ora è rotto.'],
['Feature flag','Interruttore per accendere una funzione senza un nuovo deploy, spesso per una percentuale di utenti.'],
['Tech debt','Scorciatoia che oggi velocizza e domani costa. Si nomina insieme a quando la ripaghi.'],
['Root cause','La causa all’origine, non il sintomo. "The root cause was a missing index, not the timeout itself."'],
['Mitigation','Intervento che riduce il danno ora, anche se non è la soluzione definitiva.']
],
check:[
['Quale frase descrive un rollback?',['Cancellare la branch','Tornare in produzione alla versione precedente','Aprire un ticket','Riscrivere il test'],1,'Il rollback è l’effetto in produzione; il revert è il commit che annulla un altro commit.'],
['Una API che con un retry addebita due volte non è…',['backward compatible','idempotent','observable','versioned'],1,'Idempotente significa che ripeterla non cambia il risultato oltre la prima volta.'],
['"We shipped it" significa…',['L’abbiamo solo mergiata','L’abbiamo consegnata agli utenti','L’abbiamo stimata','L’abbiamo documentata'],1,'Ship = farla arrivare a chi la usa.']
]},
{id:'en-vocab-design',topic:'en-vocab',title:'System design e dati: le parole per ragionare ad alta voce',mins:16,html:String.raw`
<p>Nel colloquio di system design perdi punti se dici «è veloce» o «il database è grande». I termini qui sotto sono quelli con cui si ragiona su carta.</p>
<h3>Velocità: due cose diverse</h3>
<ul>
<li><b>Latency</b>: quanto aspetta una singola richiesta. Si cita <b>p50</b> e soprattutto <b>p99</b> (il caso lento che la media nasconde).</li>
<li><b>Throughput</b>: quante richieste completi per unità di tempo (QPS, richieste/secondo).</li>
<li>Puoi avere throughput alto e latency pessima, e il contrario.</li>
</ul>
<h3>Dove si rompe e come cresci</h3>
<p>Il <b>bottleneck</b> è il collo di bottiglia: la risorsa che satura per prima. <b>Scale out</b> (orizzontale) aggiunge macchine; <b>scale up</b> (verticale) ingrandisce una macchina. Uno <b>shard</b> è una partizione dei dati per chiave. Il <b>load balancer</b> distribuisce il traffico.</p>
<h3>Dati che non sono «subito veri»</h3>
<p>La <b>replication lag</b> è il ritardo della replica: le letture possono vedere <b>stale data</b> (dati vecchi). <b>Strong consistency</b> significa leggere ciò che è stato appena scritto; <b>eventual consistency</b> significa che le repliche convergono, ma non all’istante.</p>
<h3>Proteggere il sistema</h3>
<ul>
<li><b>Backpressure</b>: il consumatore lento segnala al produttore di frenare.</li>
<li><b>Circuit breaker</b>: smetti per un po’ di chiamare un servizio che sta fallendo.</li>
<li><b>Rate limit</b>: tetto di richieste per cliente. Risposta tipica: <i>429 Too Many Requests</i>.</li>
<li><b>Fan-out</b>: una azione diventa molte (un post scritto nelle timeline dei follower).</li>
<li><b>Idempotency key</b>: chiave con cui il server riconosce un retry e non rifà il lavoro.</li>
<li><b>Cursor / keyset pagination</b>: pagine ancorate all’ultimo elemento visto, più stabili di offset quando i dati cambiano.</li>
</ul>
<pre>Reads can tolerate stale data, so a replica is fine.
The payment itself needs strong consistency and an idempotency key.</pre>`,
cards:[
['Latency','Tempo di una singola richiesta. Non confonderla con il throughput.'],
['Throughput','Quante operazioni completi per unità di tempo (es. richieste al secondo).'],
['p99 latency','Il 99% delle richieste è più veloce di questo valore. Mostra la coda lenta che la media nasconde.'],
['Bottleneck','La risorsa che satura per prima e limita tutto il sistema.'],
['Scale out','Scalare in orizzontale: aggiungere istanze. Scale up = macchina più grande.'],
['Shard','Partizione dei dati, di solito per una chiave. Serve a distribuire carico e spazio.'],
['Load balancer','Smista il traffico tra più istanze.'],
['Replication lag','Ritardo con cui una replica riceve le scritture. Le letture possono essere stale.'],
['Stale data','Dati non aggiornati, tipici di una replica in ritardo o di una cache vecchia.'],
['Strong consistency','Dopo una scrittura, una lettura vede quel valore. Più costosa della consistenza eventuale.'],
['Eventual consistency','Le repliche convergono se smetti di scrivere, ma non è garantito all’istante.'],
['Backpressure','Il consumatore lento fa frenare il produttore, invece di accumulare lavoro all’infinito.'],
['Circuit breaker','Interrompe per un periodo le chiamate a un servizio che sta fallendo.'],
['Rate limit','Numero massimo di richieste consentite in una finestra. Oltre, di solito 429.'],
['Fan-out','Una scrittura si moltiplica in tante (es. il post finisce nel feed di ogni follower).'],
['Idempotency key','Chiave inviata dal client così il server può ignorare un retry duplicato.'],
['Cursor pagination','Paginazione ancorata all’ultimo id visto. Più stabile di offset/limit se i dati cambiano.']
],
check:[
['p99 misura…',['La media','Una latenza nella coda lenta','Il throughput massimo','Lo spazio disco'],1,'Il 99° percentile descrive le richieste lente, non la media.'],
['Una read replica in ritardo può restituire…',['Sempre l’ultimo valore','Stale data','Un errore 500 obbligatorio','Solo scritture'],1,'Replication lag significa che la replica può essere indietro rispetto alla primaria.'],
['Scale out significa…',['Comprare una CPU più grande','Aggiungere istanze','Cancellare la cache','Spegnere il servizio'],1,'Scale out è orizzontale; scale up è verticale.']
]},
{id:'en-false-friends',topic:'en-mistakes',title:'False friends che ti fanno dire un’altra cosa',mins:12,html:String.raw`
<p>Un false friend non è un errore di grammatica: è una parola che sembra italiana e significa altro. In un colloquio o in un design doc il rischio non è «sembrare straniero», è <b>dire una cosa diversa da quella che pensi</b>.</p>
<table>
<tr><th>Sembra</th><th>In inglese vuol dire</th><th>Per l’italiano usa</th></tr>
<tr><td>actually</td><td>in realtà</td><td>currently, at the moment</td></tr>
<tr><td>eventually</td><td>alla fine, col tempo</td><td>if needed, possibly (eventualmente)</td></tr>
<tr><td>argument</td><td>parametro, oppure discussione</td><td>topic (argomento di un discorso)</td></tr>
<tr><td>library</td><td>libreria software o biblioteca</td><td>bookshop (negozio di libri)</td></tr>
<tr><td>consistent</td><td>coerente, che non si contraddice</td><td>large, substantial (consistente = grosso)</td></tr>
<tr><td>sensible</td><td>ragionevole, di buon senso</td><td>sensitive (sensibile)</td></tr>
<tr><td>control</td><td>comandare, tenere sotto controllo</td><td>check, verify (controllare = verificare)</td></tr>
<tr><td>sympathetic</td><td>comprensivo verso una persona</td><td>nice, likeable (simpatico)</td></tr>
<tr><td>comprehensive</td><td>completo, che copre tutto</td><td>understanding (comprensivo)</td></tr>
<tr><td>attend</td><td>essere presente a</td><td>wait (attendere)</td></tr>
<tr><td>resume</td><td>riprendere; oppure il CV (résumé)</td><td>summarize (riassumere)</td></tr>
<tr><td>fabric</td><td>tessuto; in rete, la trama di collegamenti</td><td>factory (fabbrica)</td></tr>
</table>
<h3>Due che pesano in system design</h3>
<ul>
<li><b>Eventually consistent</b> non significa «forse consistente». Significa «coerente alla fine, non subito».</li>
<li><b>Consistent</b> in CAP e nei database è «tutti vedono gli stessi dati», non «un volume consistente di traffico».</li>
</ul>
<div class="callout">Prima di usare una parola «che assomiglia», prova a sostituirla con un sinonimo inglese. Se non ti viene, probabilmente stai traducendo dall’italiano.</div>`,
cards:[
['Actually','In realtà, di fatto. Non significa attualmente: quello è currently / at the moment.'],
['Eventually','Alla fine, prima o poi. «Eventualmente» si dice if needed o possibly.'],
['Eventually consistent','Le repliche diventano coerenti col tempo, non «forse coerenti».'],
['Argument (in codice)','Parametro di una funzione. L’argomento di un discorso è topic.'],
['Library','Libreria software o biblioteca. Il negozio di libri è a bookshop.'],
['Consistent','Coerente, senza contraddizioni. «Un miglioramento consistente» = a substantial improvement.'],
['Sensible','Ragionevole. Sensibile è sensitive.'],
['Control vs check','Control = comandare o governare. Per «verificare» di’ check o verify.'],
['Sympathetic','Comprensivo (emotivamente). Simpatico è nice o likeable.'],
['Comprehensive','Completo, esaustivo. Comprensivo (di una persona) è understanding.'],
['Attend','Partecipare, essere presente. Attendere è wait. "I will attend the review."'],
['Resume vs summarize','To resume = riprendere. To summarize = riassumere. A résumé è il CV.']
],
check:[
['"The replicas are eventually consistent" significa…',['Forse sono coerenti','Diventano coerenti col tempo','Sono sempre fortemente coerenti','Sono più veloci'],1,'Eventually = alla fine. È il termine tecnico per la consistenza eventuale.'],
['Vuoi dire «attualmente la latency è alta». Quale parola?',['Actually the latency is high','Currently the latency is high','Eventually the latency is high','Sensible latency is high'],1,'Currently = in questo momento. Actually = in realtà.'],
['"Can you control the logs?" detto da un italiano spesso voleva essere…',['Can you delete the logs?','Can you check the logs?','Can you ship the logs?','Can you shard the logs?'],1,'Controllare nel senso di verificare è check, non control.']
]},
{id:'en-it-mistakes',topic:'en-mistakes',title:'Errori tipici di chi ha l’italiano come prima lingua',mins:14,html:String.raw`
<p>Questi non sono false friends: sono calchi dell’italiano. Un madrelingua li nota subito in una PR description o in un colloquio, e a volte cambiano il significato.</p>
<h3>Verbi che non funzionano come in italiano</h3>
<ul>
<li><b>Explain / say / tell.</b> <i>I explained the plan to her.</i> Non <i>I explained her the plan.</i> <i>She told me</i>, non <i>she said me</i>.</li>
<li><b>Depend on</b>, non depend of. <b>According to</b>, non according with.</li>
<li><b>Discuss the design</b>, non discuss about. <b>Listen to the user</b>, non listen the user.</li>
<li><b>Suggest doing</b> o <b>suggest that we do</b>. <i>Suggest him to</i> non si dice.</li>
<li><b>Succeed in fixing</b> o <b>manage to fix</b>. <i>We succeeded to fix</i> è un calco.</li>
</ul>
<h3>Nomi che non hanno il plurale</h3>
<p><b>Information, feedback, advice, software, progress</b> sono non numerabili. Niente <i>-s</i>. Si dice <i>a piece of feedback</i>, <i>some information</i>. <b>People</b> è già plurale: <i>people are</i>.</p>
<h3>Tempi</h3>
<p>Con un momento preciso del passato si usa il past simple, non il present perfect. <i>The build failed yesterday</i>, non <i>the build has failed yesterday</i>. <b>For</b> indica una durata (<i>for three years</i>); <b>since</b> indica l’inizio (<i>since 2022</i>, <i>since yesterday</i>).</p>
<h3>Calchi da togliere</h3>
<ul>
<li><i>I am agree</i> → <b>I agree</b>.</li>
<li><i>I have a doubt</i> → <b>I have a question</b>. <i>Doubt</i> significa che non ci credi.</li>
<li><i>We did a call</i> → <b>we had a call</b>.</li>
<li><i>Too much requests</i> → <b>too many requests</b>. Much con gli innumerevoli, many con quelli che conti.</li>
<li><i>The service it is down</i> → <b>the service is down</b>. Niente soggetto doppio.</li>
<li><i>I am interesting in</i> → <b>I am interested in</b>.</li>
<li><i>I wait your reply</i> → <b>I look forward to your reply</b> oppure <b>I’ll wait for your reply</b>.</li>
</ul>
<pre>I have a question about the rollout.
We have depended on that cache since March, and a retry is not idempotent.</pre>`,
cards:[
['Explain something to someone','Non "explain someone something". Tell someone something, invece, è corretto.'],
['Say vs tell','Tell regge la persona (tell me). Say no: "she said that…", "she said to me".'],
['Depend on / according to','Depend on, non of. According to, non with.'],
['Discuss / listen to','Discuss something, senza about. Listen to something.'],
['Suggest doing','"I suggest shipping it tomorrow" oppure "I suggest that we ship it". Non "suggest him to".'],
['Manage to / succeed in','"We managed to fix it" o "we succeeded in fixing it". Non "succeeded to fix".'],
['Information, feedback, advice','Non numerabili: niente plurale in -s. "Some feedback", "a piece of advice".'],
['People are','People è plurale. "People are blocked", non "people is".'],
['Yesterday → past simple','"It failed yesterday", non "it has failed yesterday".'],
['For vs since','For + durata (for two weeks). Since + inizio (since Monday, since 2024).'],
['I agree / I have a question','Non "I am agree". "I have a doubt" suona come sfiducia: di’ "I have a question".'],
['Too many requests','Many con ciò che conti (requests, users). Much con ciò che non conti (traffic, time).']
],
check:[
['Qual è la frase corretta?',['I explained him the incident','I explained the incident to him','I explained to him the incident yesterday has happened','I said him the incident'],1,'Explain something to someone. Il passato con yesterday è simple past se aggiungi il tempo.'],
['"Feedbacks" e "informations"…',['Sono i plurali normali','Non si usano: i nomi sono non numerabili','Si usano solo in americano','Sono corretti al singolare solo'],1,'Si dice some feedback, some information.'],
['Da marzo a oggi, senza interruzione.',['We depend of it since March','We have depended on it since March','We have depended on it for March','We are depending since March'],1,'Depend on; since + punto di inizio; present perfect se dura fino a ora.']
]},
{id:'en-write-async',topic:'en-writing',title:'Email e Slack: chiari, brevi, con una richiesta',mins:12,html:String.raw`
<p>Bending Spoons lavora in inglese e in modo asincrono: chi legge non è nella tua stanza e non ha il contesto che hai in testa. Un messaggio buono si capisce senza una riunione.</p>
<h3>Prima la conclusione</h3>
<p>Stile <b>BLUF</b> (bottom line up front): la prima frase dice cosa ti serve o cosa è successo. Il contesto viene dopo, per chi vuole approfondire.</p>
<pre>Please review PR 1842 today. It stops a cache stampede on the feed.
Context: under a cold key we rebuild the value once per request.</pre>
<h3>Slack</h3>
<ul>
<li>Un topic per messaggio. I dettagli vanno nel <b>thread</b>, non in dieci messaggi nel canale.</li>
<li>Niente «Hi, are you there?» e poi silenzio: scrivi tutto subito.</li>
<li>Nomina la persona solo se ti serve una azione da lei (<i>@sara can you take the rollout?</i>).</li>
<li>Se è urgente, dillo e di’ cosa succede se nessuno risponde. Se non è urgente, non marchiarlo come tale.</li>
</ul>
<h3>Email un po’ più lunga</h3>
<ol>
<li>Oggetto che informa: <i>Feed cache: need a review today (stampede on cold keys)</i>. Non <i>Quick question</i>.</li>
<li>Prima frase: richiesta o decisione.</li>
<li>Due o tre frasi di contesto, o un link al doc.</li>
<li>Scadenza e cosa consideri «fatto».</li>
<li>Niente scuse per il disturbo. <i>Sorry to bother you</i> allunga e abbassa il messaggio.</li>
</ol>
<h3>Tono</h3>
<p>Diretto non vuol dire brusco. <i>Please</i> e una frase sul perché bastano. Evita <i>I was wondering if maybe you could possibly…</i>: è un calco di cortesia che nasconde la richiesta.</p>
<pre>Could you confirm by Thursday whether we should fail open if Redis is down?
I need it for the design doc, not for a production change.</pre>`,
cards:[
['BLUF','Bottom line up front: la prima frase è la richiesta o la notizia, il contesto viene dopo.'],
['Oggetto di una email','Deve dire l’argomento e, se c’è, l’azione. Non "Quick question" o "Hello".'],
['Thread su Slack','I dettagli stanno nel thread. Il canale resta leggibile.'],
['Un messaggio, una richiesta','Non aprire con "hi" e aspettare. Scrivi contesto breve + cosa ti serve.'],
['Scadenza esplicita','"Today", "by Thursday 15:00 CET". "When you have time" non è una scadenza.'],
['Sorry to bother you','Toglilo. Diretto e cortese: please + il perché.'],
['Could you… ?','Richiesta chiara. Meglio di "I was wondering if maybe you could possibly".'],
['Fail open / fail closed','Se una dipendenza cade: lasci passare (open) o blocchi (closed). Va detto esplicitamente.'],
['FYI vs action','FYI = solo per conoscenza, nessuna azione. Se ti serve qualcosa, non chiamarlo FYI.'],
['@mention','Solo a chi deve fare qualcosa. Menzionare tutti il canale è rumore.'],
['Link, non riassunto infinito','Una frase di contesto e il link al doc o alla PR. Chi vuole legge.'],
['CET nelle scadenze','Con colleghi in fusi diversi, indica il fuso. "Thursday 15:00 CET."']
],
check:[
['Qual è l’apertura migliore su Slack?',['Hi! Are you around?','Please review PR 1842 today: it stops a cache stampede.','Sorry to bother you, quick question.','I wanted to ask you something about a thing.'],1,'Prima la richiesta, poi il perché, con un oggetto concreto.'],
['"When you have time" è debole perché…',['È scortese','Non dice una scadenza e la richiesta slitta','È grammaticalmente sbagliato','Si usa solo via email'],1,'Se ti serve una data, scrivila.'],
['I dettagli di una discussione su Slack vanno…',['In dieci messaggi nel canale','Nel thread','Solo via email','In un messaggio editato all’infinito'],1,'Il thread tiene il canale leggibile.']
]},
{id:'en-write-docs',topic:'en-writing',title:'Design doc, PR e commenti di code review',mins:16,html:String.raw`
<p>Qui l’inglese è uno strumento di pensiero: un documento confuso di solito è un ragionamento confuso. La cultura che Bending Spoons pubblica (feedback diretto, semplificare) si vede proprio in questi testi.</p>
<h3>Design doc, una pagina</h3>
<ol>
<li><b>Problem.</b> Chi soffre, e come lo misuri.</li>
<li><b>Goals / non-goals.</b> Cosa è dentro e, esplicitamente, cosa non farai.</li>
<li><b>Options.</b> Almeno due, con un trade-off ciascuna. L’opzione «non fare nulla» conta.</li>
<li><b>Proposal.</b> Cosa fai e perché.</li>
<li><b>Risks and rollout.</b> Come te ne accorgi se va male, e come torni indietro.</li>
</ol>
<pre>Problem: p99 of GET /feed is 900 ms when the cache is cold (target 200 ms).
Non-goal: we will not redesign the ranking model in this change.
Proposal: single-flight the cache fill. Rollback: flag off, no migration.</pre>
<h3>Descrizione di una PR</h3>
<p>Quattro blocchi bastano: <b>What</b>, <b>Why</b>, <b>How to test</b>, <b>Risk</b>. I reviewer non devono indovinare il contesto dal diff.</p>
<pre>What: single-flight cache fill for the feed.
Why: a cold key was rebuilt once per concurrent request.
How to test: unit test plus a local stampede of 50 parallel GETs.
Risk: low. Flag feed_single_flight, default off. Rollback = flag off.</pre>
<h3>Commenti di review</h3>
<ul>
<li>Parla del codice, non della persona. <i>This can double-charge</i>, non <i>you always forget idempotency</i>.</li>
<li>Di’ se è bloccante. Etichette utili: <b>blocking</b>, <b>suggestion</b>, <b>nit</b> (inezia di stile).</li>
<li>Se proponi un cambiamento, di’ il perché in una frase.</li>
<li>Se qualcosa è buono e non ovvio, dillo. Il feedback non è solo una lista di difetti.</li>
<li>Chiedi quando non sei sicuro: <i>Does this assume a single writer? I might be missing context.</i></li>
</ul>
<pre>Blocking: a retry of POST /charges creates a second payment.
Please store the idempotency key first, or the client cannot safely retry.

Nit: rename tmp to chargeId so the log line is searchable.</pre>
<p>Il nit non tiene bloccata la PR. Il blocking sì.</p>`,
cards:[
['Problem / non-goal','Il doc parte dal problema misurabile e dice anche cosa non farai.'],
['Trade-off','Il costo dell’opzione che scegli, non solo i pregi. "We gain X and give up Y."'],
['What / Why / How to test / Risk','I quattro blocchi di una PR description che un reviewer sa leggere in un minuto.'],
['Blocking','Commento che deve essere risolto prima del merge. Non usarlo per lo stile.'],
['Nit','Inezia: naming, formattazione. Non blocca la PR. Si premette con "Nit:".'],
['Suggestion','Proposta non obbligatoria. Spiega il perché in una frase.'],
['Commenta il codice, non la persona','"This can double-charge", non "you always forget…".'],
['Single-flight','Una sola richiesta ricostruisce la cache; le altre aspettano quel risultato. Evita lo stampede.'],
['Stampede (cache)','Tante richieste contemporanee ricostruiscono la stessa chiave scaduta.'],
['Rollback nel doc','Come spegni la modifica. "Flag off, no migration" è un piano; "we will see" no.'],
['Default off','Il feature flag nasce spento: il deploy non cambia comportamento finché non lo accendi.'],
['Does this assume…?','Modo cortese e preciso per dire che ti manca un’ipotesi. Meglio di "I think this is wrong".']
],
check:[
['Cosa rende bloccante un commento di review?',['Qualsiasi osservazione','Un difetto che non deve andare in produzione, dichiarato come tale','Un nit di naming','Un complimento'],1,'Blocking si riserva a ciò che non va mergiato. Il nit non blocca.'],
['Un non-goal serve a…',['Allungare il documento','Dichiarare cosa lasci fuori, così la review non deraglia','Evitare di scrivere i rischi','Sostituire i test'],1,'I non-goal tengono la discussione sul problema che hai scelto.'],
['Quale PR description è più utile?',['Fixed stuff.','What / why / how to test / risk, con il flag e il rollback.','LGTM','Please merge ASAP'],1,'Il reviewer deve poter provare la modifica e sapere come si torna indietro.']
]},
{id:'en-speak-live',topic:'en-speaking',title:'Pensare ad alta voce e fare domande di chiarimento',mins:14,html:String.raw`
<p>Nel colloquio tecnico l’inglese serve a far vedere il ragionamento, non a recitare una soluzione. Chi ti ascolta vuole seguire i passi. Le frasi qui sotto sono impalcature: riempile col problema vero.</p>
<h3>Aprire</h3>
<ul>
<li><b>Let me restate the problem to check I understood.</b> Poi una frase tua, non il testo riletto pari pari.</li>
<li><b>I’m going to assume… tell me if that’s wrong.</b> Dichiara l’ipotesi.</li>
<li><b>Before I design it, a few questions.</b> Due o tre, non un interrogatorio.</li>
</ul>
<h3>Domande che cambiano il disegno</h3>
<ul>
<li><b>What scale should I design for?</b> Utenti, QPS, dimensione dei dati.</li>
<li><b>What’s the read/write ratio?</b></li>
<li><b>Do reads need to see the latest write, or is slightly stale data acceptable?</b></li>
<li><b>What should happen if this dependency is down?</b> Fail open o fail closed.</li>
<li><b>Is this a one-off script or a lasting API?</b> Cambia quanto investi in struttura.</li>
<li><b>Which is more important here, latency or cost?</b></li>
</ul>
<h3>Mentre ragioni</h3>
<ul>
<li><b>A simple approach would be… The cost is…</b> Prima la soluzione ovvia e la sua complessità.</li>
<li><b>The bottleneck is likely…</b></li>
<li><b>The trade-off is… we gain … and give up …</b></li>
<li><b>What would change my mind is…</b> Mostra che non è un dogma.</li>
<li><b>I’ll walk through a concrete example.</b> Numeri piccoli, poi la stima.</li>
<li><b>I would measure … before adding …</b> È il modo inglese di «simplify»: non aggiungere pezzi senza un segnale.</li>
</ul>
<h3>Se ti blocchi</h3>
<p><b>Let me think for a second.</b> È normale. Meglio di riempire con <i>so… basically… I mean…</i>. Poi: <b>I’ll start from the data model</b> oppure <b>I’ll start from the request path</b>.</p>
<pre>Let me restate it: we need redirects under 50 ms, and writes are much rarer than reads.
I’m assuming stale click-counts are fine. The simple design is a key-value store plus a cache.
The trade-off is that a popular key can become a hotspot. What would change my mind is a write rate close to the read rate.</pre>`,
cards:[
['Let me restate the problem','Apri così per verificare di aver capito, poi riformula con parole tue.'],
['I’m going to assume…','Dichiara l’ipotesi. Invita l’altro a correggerti: "tell me if that’s wrong."'],
['What scale should I design for?','Chiedi utenti, QPS o volume prima di scegliere l’architettura.'],
['Read/write ratio','Quante letture per ogni scrittura. Cambia cache, repliche e modello.'],
['Latest write vs stale','"Do reads need the latest write, or is slightly stale data OK?"'],
['If this dependency is down','Chiedi se il sistema deve fermarsi (fail closed) o degradare (fail open).'],
['One-off vs lasting API','Uno script e un’API pubblica non meritano lo stesso investimento.'],
['A simple approach would be','Parti dalla soluzione ovvia e dilla insieme al costo. Poi migliorala.'],
['The trade-off is','"We gain X and give up Y." Una scelta senza trade-off sembra non ragionata.'],
['What would change my mind','La condizione che ti farebbe scegliere un altro disegno. Mostra giudizio, non testardaggine.'],
['I’ll walk through an example','Un caso numerico piccolo prima della stima grande.'],
['Let me think for a second','Pausa lecita. Meglio del riempitivo "so, basically, I mean".']
],
check:[
['Quale apertura è più utile in un system design?',['I know this one, the answer is microservices.','Let me restate the problem, then I’ll assume a scale and check it with you.','I will start coding.','Whatever you prefer.'],1,'Riformulare e dichiarare le ipotesi fa vedere come ragioni.'],
['"Is slightly stale data acceptable?" serve a decidere…',['Il linguaggio di programmazione','Se puoi leggere da una replica o ti serve strong consistency','Il nome del servizio','La lunghezza del colloquio'],1,'Se i dati vecchi sono accettabili, una replica o una cache diventano opzioni.'],
['Dopo la soluzione semplice conviene…',['Tacere','Dire il costo e il trade-off, e cosa ti farebbe cambiare idea','Aggiungere Kafka per sicurezza','Scusarti per l’inglese'],1,'Costo, trade-off e "what would change my mind" sono il ragionamento che cercano.']
]},
{id:'en-speak-star',topic:'en-speaking',title:'Risposte comportamentali in inglese, con lo STAR',mins:14,html:String.raw`
<p>Le domande comportamentali della selezione sono in inglese. Il contenuto è lo stesso del metodo STAR (situazione, compito, azioni tue, risultato), ma la lingua deve tenere i pesi giusti: poca scena, tante azioni, un numero, e una distinzione netta tra te e il team.</p>
<h3>La forma, in quattro frasi lunghe</h3>
<ul>
<li><b>Situation.</b> <i>A sample reading club wrote its weekly note by hand. It took about 2 hours.</i></li>
<li><b>Task.</b> <i>Nobody owned a template. I took it.</i></li>
<li><b>Action.</b> <i>I drafted one reusable note and a checklist, and piloted a single week. A teammate collected the book list; I wrote the template.</i></li>
<li><b>Result.</b> <i>Prep went from about 2 hours to about 25 minutes. The story is fictional.</i></li>
</ul>
<h3>Frasi che reggono l’onestà</h3>
<p>La guida per i candidati è esplicita sul non esagerare. In inglese si sente subito un <i>I</i> al posto di un <i>we</i> falso.</p>
<ul>
<li><b>I personally…</b> / <b>My part was…</b></li>
<li><b>A teammate did X; I did Y.</b></li>
<li><b>I don’t have the exact figure; my best estimate is… because…</b></li>
<li><b>In hindsight I would…</b> per un errore, senza buttarti giù e senza dare la colpa.</li>
<li><b>The feedback was hard to hear. I changed…</b></li>
</ul>
<h3>Domande che tornano</h3>
<p>Preparane una manciata, non un copione di venti. Tipiche: ownership non richiesto, un fallimento, una semplificazione, un disaccordo, come usi l’AI, perché questo ruolo. In ogni risposta deve esserci un fatto che una referenza potrebbe confermare.</p>
<h3>Lunghezza</h3>
<p>Due o tre minuti a voce. Se superi, taglia la situation, non il result. Chiudi con il numero e, se c’entra, con cosa hai imparato.</p>
<pre>I personally wrote the template and sent the one pilot week.
A teammate collected the book list; I don’t want to take credit for that.
Prep went from about 2 hours to about 25 minutes. Fictional example.</pre>`,
cards:[
['Situation, in one or two sentences','Contesto minimo: team, problema, scala. Non la storia dell’azienda.'],
['I took ownership of…','Modo naturale per dire che hai preso in carico qualcosa, spesso senza che te lo chiedessero.'],
['I personally… / My part was…','Segna il confine del tuo contributo. È quello che vogliono sentire.'],
['A teammate did X; I did Y','La frase più utile per non attribuirti il lavoro degli altri.'],
['I don’t have the exact figure','Stima onesta: "my best estimate is…, because…". Meglio di un numero inventato.'],
['The result was…, which I measured by…','Il risultato deve dire come lo sai, non solo l’aggettivo "better".'],
['In hindsight I would…','Chiusura di un fallimento: cosa faresti diversamente, in concreto.'],
['The feedback was hard to hear','Per una domanda sul feedback difficile. Poi di’ cosa hai cambiato.'],
['I disagreed, and I committed once we decided','Disaccordo + esecuzione. Mostra che sai discutere e poi allinearti.'],
['We removed… and we kept…','Per una storia di semplificazione: cosa hai tolto, non solo cosa hai aggiunto.'],
['Roughly / about','Con una stima: "about 25 minutes", "roughly one in four". Segnala che non è una cifra finta di precisione.'],
['Two to three minutes','Durata utile di una risposta STAR a voce. Se sfori, accorcia la situation.']
],
check:[
['Dove va la maggior parte del tempo in una risposta STAR in inglese?',['Nella situation, con tanti dettagli di contesto','Nelle azioni tue, con il confine rispetto al team','Nella presentazione dell’azienda','Nelle scuse per l’inglese'],1,'Come nella lezione STAR: conta cosa hai fatto tu. In inglese si marca con "I personally".'],
['Non ricordi la cifra esatta. Cosa dici?',['Inventa un numero tondo e sicuro','"I don’t have the exact figure; my best estimate is… because…"','Eviti il risultato','Dici "a lot"'],1,'Una stima difendibile è accettabile; un numero gonfiato no.'],
['"A teammate did X; I did Y" serve a…',['Allungare la risposta','Separare in modo verificabile il tuo contributo','Evitare di dare un risultato','Criticare il collega'],1,'È la frase che tiene insieme onestà e chiarezza.']
]}
];

window.EN_EX = [
{id:'enx-tr-01',type:'translate',topic:'en-vocab',lesson:'en-vocab-design',prompt:'Traduci come lo diresti in un design doc.\n\nLa read replica è in ritardo: una lettura può vedere dati vecchi.',answer:'The read replica is lagging, so a read can see stale data.',explanation:'Replication lag e stale data sono i termini giusti. «Vecchi» qui non è old files: sono dati non ancora aggiornati.'},
{id:'enx-tr-02',type:'translate',topic:'en-vocab',lesson:'en-vocab-swe',prompt:'Traduci come lo diresti in una review.\n\nQuesta POST non è idempotente: un retry può addebitare due volte.',answer:'This POST is not idempotent: a retry can charge the user twice.',explanation:'Idempotent si usa così, senza traduzione. Charge è il verbo giusto per un pagamento, non debit.'},
{id:'enx-tr-03',type:'translate',topic:'en-vocab',lesson:'en-vocab-design',prompt:'Traduci.\n\nIl collo di bottiglia è il database: la CPU satura prima delle API.',answer:'The bottleneck is the database: its CPU saturates before the API does.',explanation:'Bottleneck è il termine. Saturate è naturale; «si riempie» in questo contesto non è fills up.'},
{id:'enx-tr-04',type:'translate',topic:'en-writing',lesson:'en-write-async',prompt:'Traduci in un messaggio Slack, con la richiesta in prima frase.\n\nMi servirebbe una review oggi della PR sul single-flight della cache. Sotto carico una chiave fredda viene ricostruita una volta per richiesta.',answer:'Please review the cache single-flight PR today. Under load, a cold key is rebuilt once per request.',explanation:'Prima la richiesta e il quando. Cold key è la chiave assente o scaduta. Una volta per richiesta = once per request.'},
{id:'enx-tr-05',type:'translate',topic:'en-speaking',lesson:'en-speak-live',prompt:'Traduci una frase da dire ad alta voce nel colloquio.\n\nFammi riformulare il problema, poi ti dico le ipotesi. Dimmi se sbaglio.',answer:'Let me restate the problem, then I’ll state my assumptions. Tell me if I’m wrong.',explanation:'Restate e assumptions sono le parole del colloquio. «Fammi» non si traduce con let me a fare un favore: è l’apertura del ragionamento.'},
{id:'enx-tr-06',type:'translate',topic:'en-speaking',lesson:'en-speak-star',prompt:'Traduci, tenendo distinto il tuo ruolo.\n\nIo ho scritto i template delle pipeline. Un collega ha preparato gli ambienti di test. Non voglio prendermi anche quel merito.',answer:'I wrote the pipeline templates. A teammate set up the test environments; I don’t want to take credit for that.',explanation:'Take credit for è la formula naturale. «Merito» qui non è merit nel senso di valore astratto.'},
{id:'enx-tr-07',type:'translate',topic:'en-vocab',lesson:'en-vocab-swe',prompt:'Traduci.\n\nLa modifica non è retrocompatibile: i client vecchi si rompono se rinominiamo il campo.',answer:'This is not backward compatible: old clients break if we rename the field.',explanation:'Backward compatible è il termine. Break è giusto per un client che smette di funzionare.'},
{id:'enx-tr-08',type:'translate',topic:'en-writing',lesson:'en-write-docs',prompt:'Traduci la riga di rischio di una PR.\n\nRischio basso. Il flag è spento di default. Per tornare indietro basta spegnerlo, non c’è una migrazione.',answer:'Risk: low. The flag is off by default. Rollback is turning the flag off; there is no migration.',explanation:'Default off, flag off e rollback sono le formule da PR. «Basta» non serve tradurlo con just enough: la frase già è corta.'},
{id:'enx-tr-09',type:'translate',topic:'en-mistakes',lesson:'en-false-friends',prompt:'Traduci il senso, non la parola che assomiglia.\n\nAttualmente la p99 è circa 900 ms. Alla fine, con la cache calda, scende.',answer:'Currently the p99 is about 900 ms. Eventually, once the cache is warm, it drops.',explanation:'Attualmente = currently, non actually. Alla fine / col tempo = eventually. About segnala la stima.'},
{id:'enx-tr-10',type:'translate',topic:'en-speaking',lesson:'en-speak-live',prompt:'Traduci una domanda di chiarimento.\n\nLe letture devono vedere l’ultima scrittura, o va bene un dato leggermente vecchio?',answer:'Do reads need to see the latest write, or is slightly stale data acceptable?',explanation:'Latest write e slightly stale data fanno scegliere tra strong consistency e una replica.'},
{id:'enx-tr-11',type:'translate',topic:'en-writing',lesson:'en-write-docs',prompt:'Traduci un commento di review, tono diretto ma sul codice.\n\nQuesto è bloccante: se Redis cade, l’API risponde 500 a tutte le letture. Possiamo degradare e servire la copia stale?',answer:'Blocking: if Redis is down, the API returns 500 on every read. Can we degrade and serve the stale copy instead?',explanation:'Blocking si mette in testa. Degrade è il verbo del servizio che perde una funzione ma resta su. Serve, non «servire» nel senso di servizio al tavolo.'},
{id:'enx-tr-12',type:'translate',topic:'en-vocab',lesson:'en-vocab-design',prompt:'Traduci.\n\nMettiamo un tetto di 1000 richieste al minuto per API key. Oltre, rispondiamo 429.',answer:'Let’s rate-limit each API key to 1,000 requests per minute. Above that, we return 429.',explanation:'Rate-limit è il verbo. 429 è Too Many Requests. In inglese le migliaia prendono la virgola: 1,000.'},

{id:'enx-fx-01',type:'fix',topic:'en-mistakes',lesson:'en-it-mistakes',prompt:'Correggi.\n\nI explained him the rollout plan yesterday.',answer:'I explained the rollout plan to him yesterday.',explanation:'Explain something to someone. Yesterday vuole il past simple, che in questa frase c’è già (explained).'},
{id:'enx-fx-02',type:'fix',topic:'en-mistakes',lesson:'en-it-mistakes',prompt:'Correggi.\n\nThe service it depends of Redis since two years.',answer:'The service has depended on Redis for two years.',explanation:'Niente soggetto doppio. Depend on. For + durata. Present perfect perché la dipendenza continua.'},
{id:'enx-fx-03',type:'fix',topic:'en-mistakes',lesson:'en-it-mistakes',prompt:'Correggi.\n\nShe said me that the feedbacks was useful.',answer:'She told me that the feedback was useful.',explanation:'Tell me, non say me. Feedback è non numerabile e singolare: was resta, feedbacks no.'},
{id:'enx-fx-04',type:'fix',topic:'en-mistakes',lesson:'en-it-mistakes',prompt:'Correggi.\n\nI am agree with the proposal, but I have a doubt on the sharding key.',answer:'I agree with the proposal, but I have a question about the sharding key.',explanation:'I agree, non I am agree. Doubt suona come «non ci credo». Una domanda di design è a question about.'},
{id:'enx-fx-05',type:'fix',topic:'en-mistakes',lesson:'en-false-friends',prompt:'Correggi il false friend: l’autore voleva dire «in realtà».\n\nActually the cluster is fine, but eventually we should check the lag. (contesto: il cluster in questo momento non sta bene, e «eventualmente» vorrebbe dire «se serve»)',answer:'Currently the cluster is not fine. If needed, we should check the lag.',explanation:'La frase originale dice il contrario di ciò che l’autore italiano intende. Currently = ora; if needed = eventualmente. Actually = in realtà; eventually = alla fine.'},
{id:'enx-fx-06',type:'fix',topic:'en-mistakes',lesson:'en-it-mistakes',prompt:'Correggi.\n\nWe succeeded to fix the regression and we did a call for discuss about it.',answer:'We managed to fix the regression, and we had a call to discuss it.',explanation:'Manage to fix, oppure succeed in fixing. Have a call. Discuss it, senza about. For discuss non è inglese.'},
{id:'enx-fx-07',type:'fix',topic:'en-mistakes',lesson:'en-it-mistakes',prompt:'Correggi.\n\nThere are too much informations in the doc. People is not going to read it.',answer:'There is too much information in the doc. People are not going to read it.',explanation:'Information è non numerabile: too much, singolare. People è plurale: are.'},
{id:'enx-fx-08',type:'fix',topic:'en-mistakes',lesson:'en-it-mistakes',prompt:'Correggi.\n\nI suggest him to rollback. According with the graph, the latency has spiked yesterday.',answer:'I suggest that he roll back. According to the graph, the latency spiked yesterday.',explanation:'Suggest that + verbo base, non suggest him to. According to. Con yesterday, past simple: spiked, non has spiked.'},
{id:'enx-fx-09',type:'fix',topic:'en-writing',lesson:'en-write-async',prompt:'Correggi.\n\nSorry to bother you, I wait your reply on if we should fail open.',answer:'Please reply on whether we should fail open.',explanation:'Togli la scusa. Wait your reply manca di for ed è vago. Whether introduce una scelta tra alternative. Fail open resta invariato.'},
{id:'enx-fx-10',type:'fix',topic:'en-mistakes',lesson:'en-false-friends',prompt:'Correggi.\n\nPlease control if the library is consistent with the diagram. It is a very consistent change.',answer:'Please check whether the diagram matches the design. It is a substantial change.',explanation:'Controllare = check. Consistent non vuol dire «grosso». Due usi sbagliati nella stessa frase: il primo voleva «verificare se coincide», il secondo «cambiamento grosso».'},

{id:'enx-co-01',type:'concise',topic:'en-writing',lesson:'en-write-async',prompt:'Riscrivi in due frasi, richiesta prima.\n\nHi team, I hope you are all doing well and sorry to ping you. I was wondering if maybe someone could, when you have a moment, take a look at the PR I opened yesterday about the cache, because I think there might be an issue with cold keys but I am not totally sure. Thanks a lot, no rush at all.',answer:'Please review yesterday’s cache PR today. I think a cold key is rebuilt once per request; I want a second pair of eyes before we turn the flag on.',explanation:'Togli convenevoli, scuse e «no rush», che contraddice il bisogno di una review. Resta il cosa, il dubbio, il quando.'},
{id:'enx-co-02',type:'concise',topic:'en-writing',lesson:'en-write-docs',prompt:'Comprimi in una PR description a quattro righe (what / why / test / risk).\n\nSo basically what this PR does is it changes the feed endpoint so that instead of everybody recomputing the cache value when it is missing, only one request does it and the others wait. I did this because yesterday we had an incident where the database got saturated. You can test it by running the new unit test. I don’t think it is very risky because there is a flag.',answer:'What: single-flight the feed cache fill.\nWhy: a miss was rebuilt once per request and saturated the database.\nHow to test: the new unit test.\nRisk: low. Flag off by default; rollback is flag off.',explanation:'Le etichette what/why/test/risk sostituiscono "so basically". Il flag e il rollback stanno nel rischio.'},
{id:'enx-co-03',type:'concise',topic:'en-speaking',lesson:'en-speak-live',prompt:'Riscrivi come apertura di un colloquio di system design, in 3 frasi.\n\nOk so I think maybe the way I would do this, if I understand correctly, and sorry if I don’t, is probably we need something that is scalable and reliable and fast, so maybe microservices and Kafka and a cache, but I can also do something else if you want.',answer:'Let me restate it: short links, very fast redirects, far more reads than writes.\nI’ll assume 100 million new links a month and that click counts can be slightly stale.\nA simple design is a key-value store plus a cache; tell me if those assumptions are wrong.',explanation:'Numeri e ipotesi al posto degli aggettivi (scalable, reliable, fast) e della lista di tecnologie.'},
{id:'enx-co-04',type:'concise',topic:'en-writing',lesson:'en-write-docs',prompt:'Riscrivi come commento di review, una frase di problema e una di richiesta.\n\nI was looking at this function and I am not sure but I think that if the client retries the POST we might actually insert two payments, which is not great, so maybe we should consider possibly looking into idempotency or something like that.',answer:'Blocking: a retry of this POST can insert two payments. Please store an idempotency key and return the original result on a duplicate.',explanation:'Di’ che è blocking, il fallo concreto, e la richiesta. Togli "maybe", "possibly", "or something".'},
{id:'enx-co-05',type:'concise',topic:'en-speaking',lesson:'en-speak-star',prompt:'Accorcia a uno STAR pronunciabile in circa 45 secondi.\n\nWell, at my company, which is a nice place and has many teams and I have been there for a while, there was a period where deployments were kind of slow and people were a bit unhappy and the process had many steps that were manual and different people did different things, and I sort of helped a bit with the team to improve things, and in the end it was better than before.',answer:'A sample reading club spent about 2 hours on its weekly note.\nI wrote one template and piloted a single week. A teammate collected the book list.\nPrep went from about 2 hours to about 25 minutes.',explanation:'Servono un esempio concreto, cosa hai fatto tu, il confine col collega, e un numero. La storia è inventata.'},
{id:'enx-co-06',type:'concise',topic:'en-writing',lesson:'en-write-docs',prompt:'Riscrivi il paragrafo di proposal in tre righe.\n\nWe thought about many things including a full rewrite, a new database, Kafka, and also doing nothing. In the end we believe the best and most sensible thing, all things considered, is to add an index and measure again before building a pipeline.',answer:'Options: a new pipeline, a rewrite, or only an index.\nProposal: add the index and measure p99 for a week.\nWe will not add a queue unless the index misses the 200 ms target.',explanation:'Le opzioni stanno in una riga. La proposal è l’azione più piccola, con la condizione che ti farebbe fare di più. È anche "simplify".'},
{id:'enx-co-07',type:'concise',topic:'en-writing',lesson:'en-write-async',prompt:'Riscrivi l’email (oggetto + 3 frasi).\n\nSubject: Quick question\n\nHello, I hope this email finds you well. I wanted to reach out regarding the document I shared last week about the notification service. If you have time it would be great to know if you agree with failing closed when the provider is down, because I am a bit blocked. Thank you so much for your time.',answer:'Subject: Notifications doc: fail closed when the provider is down?\n\nPlease confirm by Thursday if we should fail closed when the push provider is down.\nI am blocked on the design doc until we decide.\nThe rest of the doc is unchanged.',explanation:'L’oggetto porta la decisione. La prima frase ha richiesta e scadenza. "I hope this email finds you well" non aggiunge nulla.'},
{id:'enx-co-08',type:'concise',topic:'en-speaking',lesson:'en-speak-live',prompt:'Riscrivi il ragionamento in 3 frasi, con trade-off.\n\nI would put a cache because caches are good and fast and everyone uses Redis, so it will be better, and I don’t see real downsides, maybe just that it can be stale sometimes but that is ok I guess.',answer:'I would put a cache in front of the feed reads, which are the bulk of the traffic.\nWe gain lower p99 and give up freshness: a reader can see stale data for the TTL.\nWhat would change my mind is a product requirement to show the latest write immediately.',explanation:'"Caches are good" non è un ragionamento. Di’ cosa guadagni, cosa cedi, e cosa ti farebbe cambiare idea.'},
{id:'enx-co-09',type:'concise',topic:'en-writing',lesson:'en-write-docs',prompt:'Riscrivi come nit, non come se fosse un incidente.\n\nThis variable name is completely unacceptable and makes the whole module look careless. You should rename it immediately before anyone else sees this PR.',answer:'Nit: rename `tmp` to `chargeId` so the log line is searchable. Not blocking.',explanation:'Un naming è un nit. Parla del codice e del perché, senza giudicare la persona.'},
{id:'enx-co-10',type:'concise',topic:'en-speaking',lesson:'en-speak-star',prompt:'Riscrivi la chiusura di un fallimento, due frasi.\n\nIt was a disaster and basically my fault even if other people were also involved in some ways, and I felt really bad, and the users were angry, and I learned that I should be better.',answer:'I shipped a sample migration without a dry run, and about 3% of fictional accounts failed to log in for 20 minutes.\nIn hindsight I would rehearse it on a copy and keep the old path behind a flag.',explanation:'Un fatto, un numero, e cosa faresti diversamente. "I should be better" non è un apprendimento verificabile. Esempio inventato.'},

{id:'enx-ch-01',type:'choice',topic:'en-mistakes',lesson:'en-false-friends',prompt:'Vuoi dire «in realtà non è un bug della cache». Quale frase è corretta?',options:['Actually, it is not a cache bug.','Currently, it is not a cache bug.','Eventually, it is not a cache bug.','Sensitively, it is not a cache bug.'],answer:0,explanation:'Actually = in realtà. Currently = in questo momento. Eventually = col tempo.'},
{id:'enx-ch-02',type:'choice',topic:'en-mistakes',lesson:'en-false-friends',prompt:'In un design doc, «le repliche convergono ma non subito» si dice…',options:['The replicas are possibly consistent.','The replicas are eventually consistent.','The replicas are actually consistent.','The replicas are comprehensively consistent.'],answer:1,explanation:'Eventually consistent è il termine. Possibly consistent non esiste come garanzia.'},
{id:'enx-ch-03',type:'choice',topic:'en-vocab',lesson:'en-vocab-swe',prompt:'Quale commento usa i termini giusti?',options:['This API is not idempotent: a retry creates a second charge.','This API is not identical: a retry creates a second charge.','This API is not backward: a retry creates a second charge.','This API is not consistent: a retry creates a second charge.'],answer:0,explanation:'Il problema del retry è l’idempotenza. Consistent parlerebbe di dati che divergono, non del doppio addebito.'},
{id:'enx-ch-04',type:'choice',topic:'en-vocab',lesson:'en-vocab-design',prompt:'La risorsa che satura per prima è…',options:['the bottleneck','the backpressure','the fan-out','the cursor'],answer:0,explanation:'Bottleneck = collo di bottiglia. Backpressure è il segnale di frenare. Fan-out è moltiplicare un lavoro.'},
{id:'enx-ch-05',type:'choice',topic:'en-vocab',lesson:'en-vocab-design',prompt:'Vuoi descrivere il 99° percentile della latenza.',options:['The throughput is p99.','The p99 latency is 900 ms.','The average is the p99.','The deadlock is 900 ms.'],answer:1,explanation:'p99 è una latency, non un throughput e non la media.'},
{id:'enx-ch-06',type:'choice',topic:'en-writing',lesson:'en-write-docs',prompt:'Quale etichetta metti a un rename puramente estetico?',options:['Blocking','Nit','Incident','Rollback'],answer:1,explanation:'Nit = inezia, non blocca il merge. Blocking è per un difetto che non deve andare in produzione.'},
{id:'enx-ch-07',type:'choice',topic:'en-writing',lesson:'en-write-async',prompt:'Quale oggetto di email è utile?',options:['Quick question','Hello','Feed p99: confirm fail-open by Thursday','FYI thanks'],answer:2,explanation:'L’oggetto dice l’argomento, la decisione e la scadenza.'},
{id:'enx-ch-08',type:'choice',topic:'en-speaking',lesson:'en-speak-live',prompt:'Quale domanda cambia davvero il disegno?',options:['Do you like Kafka?','Is slightly stale data acceptable on this read?','Should I speak louder?','How many years have you worked here?'],answer:1,explanation:'Se il dato stale è accettabile, replica e cache diventano lecite. La preferenza per Kafka no.'},
{id:'enx-ch-09',type:'choice',topic:'en-speaking',lesson:'en-speak-star',prompt:'Quale frase separa in modo onesto il contributo?',options:['I did the whole project myself, basically.','A teammate owned the test environments; I owned the templates and the rollout.','We kind of all did everything together.','The team shipped it, I was around.'],answer:1,explanation:'Nomina le due parti. Né ti prendi tutto, né sparisci nel we.'},
{id:'enx-ch-10',type:'choice',topic:'en-mistakes',lesson:'en-it-mistakes',prompt:'Quale frase è corretta?',options:['I explained him the trade-off.','I explained the trade-off to him.','I explained to him the trade-off yesterday has been hard.','I said him the trade-off.'],answer:1,explanation:'Explain something to someone. Say non regge la persona senza to.'},
{id:'enx-ch-11',type:'choice',topic:'en-vocab',lesson:'en-vocab-swe',prompt:'Aggiungere un campo opzionale, senza cambiare quelli esistenti, di solito è…',options:['a breaking change','backward compatible','a deadlock','a rollback'],answer:1,explanation:'I client vecchi ignorano il campo nuovo. Rinominare o cambiare tipo, invece, è breaking.'},
{id:'enx-ch-12',type:'choice',topic:'en-writing',lesson:'en-write-docs',prompt:'Quale riga descrive un rollback vero?',options:['We will see if users complain.','Rollback: turn flag feed_single_flight off. No migration.','Rollback: rewrite the service in another language.','Rollback means we delete the repository.'],answer:1,explanation:'Il rollback è un gesto operativo immediato. Uno flag da spegnere, senza migrazione da disfare, è un piano.'},

{id:'enx-gp-01',type:'gap',topic:'en-vocab',lesson:'en-vocab-swe',prompt:'This change is not backward ___: old clients break if we rename the field.',options:['compatible','consistent','available','idempotent'],answer:0,explanation:'Backward compatible = i client vecchi continuano a funzionare. Le altre parole parlano di dati, uptime o retry.'},
{id:'enx-gp-02',type:'gap',topic:'en-vocab',lesson:'en-vocab-design',prompt:'The read replica is lagging, so you may see ___ data.',options:['stale','strong','idempotent','synthetic'],answer:0,explanation:'Stale data = dati non ancora allineati alla primaria. Strong consistency è l’opposto.'},
{id:'enx-gp-03',type:'gap',topic:'en-vocab',lesson:'en-vocab-design',prompt:'If the provider is failing, the circuit ___ stops calling it for a while.',options:['breaker','breaker flag','balance','shard'],answer:0,explanation:'Circuit breaker. Non è un feature flag né uno shard.'},
{id:'enx-gp-04',type:'gap',topic:'en-vocab',lesson:'en-vocab-design',prompt:'Above 1,000 requests per minute we return ___.',options:['429','201','301','100'],answer:0,explanation:'429 Too Many Requests è la risposta tipica di un rate limit. 201 è Created, 301 è un redirect.'},
{id:'enx-gp-05',type:'gap',topic:'en-mistakes',lesson:'en-false-friends',prompt:'___ the p99 is 900 ms; this morning it was 200.',options:['Currently','Actually','Eventually','Comprehensively'],answer:0,explanation:'Stai parlando di adesso, in contrasto con stamattina: currently. Actually sarebbe «in realtà».'},
{id:'enx-gp-06',type:'gap',topic:'en-mistakes',lesson:'en-it-mistakes',prompt:'The service has depended ___ Redis ___ March.',options:['on / since','of / since','on / for','of / for'],answer:0,explanation:'Depend on. Since + il punto d’inizio (March). For vorrebbe una durata: for three years.'},
{id:'enx-gp-07',type:'gap',topic:'en-mistakes',lesson:'en-it-mistakes',prompt:'I ___ the incident to her yesterday.',options:['explained','explained her','said her','told to'],answer:0,explanation:'Explained the incident to her. Told her the incident sarebbe stato tell, senza to. Said non regge her da solo.'},
{id:'enx-gp-08',type:'gap',topic:'en-writing',lesson:'en-write-docs',prompt:'___: a retry can create two charges. Please require an idempotency key.',options:['Blocking','Nit','FYI','Subject'],answer:0,explanation:'È un difetto che non deve andare in produzione: blocking. Un nit non sarebbe abbastanza.'},
{id:'enx-gp-09',type:'gap',topic:'en-speaking',lesson:'en-speak-live',prompt:'The ___ is higher freshness versus lower database load. We gain p99 and give up the latest write.',options:['trade-off','bottleneck','hotfix','resume'],answer:0,explanation:'Stai nominando cosa guadagni e cosa cedi: è un trade-off, non ancora il bottleneck.'},
{id:'enx-gp-10',type:'gap',topic:'en-speaking',lesson:'en-speak-star',prompt:'A teammate owned the test environments; I don’t want to take ___ for that work.',options:['credit','control','resume','fabric'],answer:0,explanation:'Take credit for = prendersi il merito. È la formula standard, ed è quella che ti tiene onesto.'}
];

window.EN_SPEAK = [
{id:'ens-own-01',kind:'Ownership',question:'Tell me about a time you took ownership of a problem nobody had asked you to solve.',coaching:'Marca il momento in cui l’hai preso tu, non il team. Una frase deve essere «nobody asked me». Chiudi con un numero.',sample:'A sample reading club wrote its weekly note by hand, and it took about 2 hours. Nobody owned a template, so I took it. I drafted one note and a checklist, then piloted a single week. A teammate collected the book list; I wrote the template and sent that pilot. Prep went from about 2 hours to about 25 minutes. This story is fictional.',notes:'Situation corta, "I took it", confine col collega, un numero. Non dire "we improved the process". È un esempio inventato.'},
{id:'ens-fail-01',kind:'Fallimento',question:'Tell me about a mistake you made and what you would do differently.',coaching:'Un fatto tuo, il danno misurabile, e "in hindsight". Niente "it was basically fine" e niente colpe agli altri.',sample:'I shipped a sample migration without a dry run. About 3% of fictional accounts could not log in for 20 minutes. I rolled back, then wrote a checklist: rehearse on a copy, keep the old path behind a flag, and watch the error rate for 15 minutes before turning the flag fully on. In hindsight the flag should have existed before the first attempt, not after the incident. This story is fictional.',notes:'Il numero rende il danno concreto. La lezione è operativa (flag, dry run), non un aggettivo su di te. Esempio inventato.'},
{id:'ens-simp-01',kind:'Semplificare',question:'Tell me about a time you made a system simpler, or decided not to build something.',coaching:'Cosa hai tolto o non costruito, e il segnale che ti avrebbe fatto cambiare idea. È la versione parlata di "simplify relentlessly".',sample:'The feed was slow on a cold cache, and the first proposal was a new queue plus a separate recomputation service. I pushed back. We added a single-flight around the existing cache and an index on the query that missed. p99 went from about 900 ms to under 200 ms. What would have changed my mind was missing that target after a week of measurement; we never needed the queue.',notes:'Nomina l’opzione scartata. "What would have changed my mind" mostra che non è pigrizia.'},
{id:'ens-conf-01',kind:'Disaccordo',question:'Tell me about a technical disagreement. How did you handle it, and what did you do once the decision was made?',coaching:'La tua posizione, come l’hai argomentata, la decisione, e il fatto che poi l’hai eseguita. Senza rimproverare chi ha deciso.',sample:'I wanted to fail open if the recommendation service timed out; my teammate wanted to fail closed, because a empty screen was worse than a stale one in their view. I wrote a one-page note with the p99 and the user impact of each option. We chose fail open with a 30-second stale cache. I disagreed with part of it, and I still implemented that decision the same week, including the metric that would tell us if stale recommendations hurt retention.',notes:'"I disagreed, and I implemented it" è il punto. Il doc di una pagina è l’azione, non il volume della voce.'},
{id:'ens-ai-01',kind:'Uso dell’AI',question:'How do you use AI tools in your engineering work? Give a concrete example and say how you checked the result.',coaching:'Uno caso vero: cosa hai delegato, come hai verificato, un effetto misurabile. Devono capire che non incolli alla cieca.',sample:'I use an assistant as a second pass, not as the author. On a flaky integration test, I asked it for hypotheses, then I reproduced the race locally and fixed the missing lock myself. I also keep a small benchmark when I use a model for a repetitive edit: last quarter that workflow drafted about 30% of our routine pull requests, and I rejected the ones that changed behavior without a test. If I cannot explain the diff, I do not ship it.',notes:'C’è un esempio, una verifica umana, e un numero. "I rejected the ones…" è la frase che li rassicura.'},
{id:'ens-mot-01',kind:'Motivazione',question:'Why Bending Spoons, and why a software engineering role here rather than somewhere else?',coaching:'Due fatti specifici pubblicati da loro (ownership fino alla produzione, simplify, AI, potenziale più che stack) collegati a qualcosa che hai già fatto. Niente "I love technology".',sample:'Two things in your posting match how I already work. You ask engineers to own a problem from the idea to production: that is what I did with our release pipelines, from the first pilot to the rollout. You also say to amplify impact with AI and to simplify. I want a place where using a model is normal, and where I am expected to delete a queue instead of adding one. I am applying now because the bar you describe, reasoning and learning speed, is the work I want to be judged on.',notes:'Collega un fatto tuo a una frase loro. Non recitare benefit o la città.'},
{id:'ens-des-01',kind:'System design',question:'Design a URL shortener. Talk me through your reasoning. Start with questions.',coaching:'Due ipotesi a voce, la soluzione semplice, un trade-off. Non elencare tecnologie. I numeri possono essere di ordine di grandezza.',sample:'Let me restate it: create a short code, and redirect as fast as possible. I will assume about 100 million new links a month, roughly 40 writes per second, and about 100 times more reads. I will also assume click analytics can be slightly stale. A simple design is an API that writes code and URL to a key-value store, a cache for hot codes, and a queue for click counts. The trade-off of a cache is staleness versus p99. What would change my mind is a write rate close to the read rate, or a requirement for strong consistency on the click counter.',notes:'Restate, numeri, semplice, trade-off, what would change my mind. È lo stesso scheletro della lezione sul ragionare ad alta voce.'},
{id:'ens-clar-01',kind:'Domande',question:'You are about to design a notification system. Which clarifying questions do you ask, and why?',coaching:'Tre domande, ciascuna con la conseguenza sul disegno. Meglio tre precise che otto vaghe.',sample:'First, what is the peak rate, and is a marketing campaign 10 times the average? That decides whether a queue is actually needed. Second, which channels are in scope now, push, email, or SMS? I would not build three workers if only push is in the first release. Third, may we deliver the same notification twice, or do we need an idempotency key? If duplicates are unacceptable, the consumer has to be idempotent and I will say so before drawing the queue. I would rather ask these than start from Kafka.',notes:'Ogni domanda è legata a una scelta. L’ultima frase è il giudizio: non parti dallo strumento.'}
];

window.SECTIONS = window.SECTIONS || {};
window.SECTIONS.en = window.EN_SECTION;
window.TOPICS = window.TOPICS || {};
Object.assign(window.TOPICS, window.EN_TOPICS);
window.LESSONS = window.LESSONS || [];
window.EN_LESSONS.forEach(function(lesson){
  if(!window.LESSONS.some(function(existing){return existing.id===lesson.id})) window.LESSONS.push(lesson);
});
