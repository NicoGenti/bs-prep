/* Contenuti didattici: lezioni, concetti chiave (flashcard) e verifiche di comprensione.
   NB: sono materiali di pratica "nello stile descritto" da Bending Spoons, NON domande reali dei loro test. */
window.SECTIONS = {
  cv:{label:'CV e lettera',icon:'📄'}, ps:{label:'Problem solving',icon:'🧩'},
  tech:{label:'Test tecnici',icon:'💻'}, behav:{label:'Comportamentale',icon:'🗣️'}, refs:{label:'Referenze',icon:'🤝'}
};
window.TOPICS = {
  cv:{label:'CV in inglese',section:'cv'}, cover:{label:'Lettera di presentazione',section:'cv'}, github:{label:'Profilo GitHub',section:'cv'},
  seq:{label:'Successioni numeriche',section:'ps'}, arith:{label:'Percentuali e problemi',section:'ps'}, logic:{label:'Logica e sillogismi',section:'ps'},
  matrix:{label:'Matrici e pattern',section:'ps'}, estim:{label:'Stime (Fermi)',section:'ps'}, algo:{label:'Algoritmi',section:'ps'},
  python:{label:'Python per sviluppatori C#',section:'tech'}, k8s:{label:'Kubernetes',section:'tech'}, grpc:{label:'gRPC vs REST',section:'tech'},
  docker:{label:'Docker',section:'tech'}, sysdesign:{label:'System design',section:'tech'}, simplify:{label:'Semplificare l\u2019architettura',section:'tech'},
  star:{label:'Metodo STAR',section:'behav'}, culture:{label:'Valori e cultura',section:'behav'}, refs:{label:'Referenze',section:'refs'}
};
window.LESSONS = [
/* ================= CV ================= */
{id:'cv-principi',topic:'cv',title:'Come si scrive un CV in inglese che passa lo screening',mins:10,html:String.raw`
<p>Bending Spoons chiede un CV <b>breve, in inglese</b>, con <b>informazioni quantitative</b> (voti, metriche). Chi lo legge ha pochi minuti: il CV deve far capire in 30 secondi <i>cosa hai ottenuto</i>, non solo cosa hai fatto.</p>
<h3>1. Struttura consigliata (1 pagina, massimo 2)</h3>
<ol><li><b>Header</b>: nome, città (Città, Paese), email, link GitHub e LinkedIn.</li>
<li><b>Summary</b> (2 righe, facoltativo): <i>"Software engineer who ships small, measurable improvements…"</i> È solo un modello, non un profilo vero.</li>
<li><b>Experience</b>: in ordine cronologico inverso, 3–5 bullet per ruolo.</li>
<li><b>Projects</b>: 1–3 progetti personali, con link. Vanno bene anche esercizi inventati, purché siano tuoi e li sappia spiegare.</li>
<li><b>Education</b>: titolo, università, <b>voto</b> (es. 110/110) e media se buona: il modulo lo chiede.</li>
<li><b>Skills</b>: una riga per categoria, senza barre di "livello" (non dicono nulla).</li></ol>
<h3>2. La formula del bullet: Verbo + Cosa + Come + Risultato misurabile</h3>
<table><tr><th>Debole</th><th>Forte</th></tr>
<tr><td>Responsible for the weekly notes.</td><td><b>Wrote</b> a shared template for a sample reading club, <b>cutting prep from about 2 hours to about 25 minutes</b>.</td></tr>
<tr><td>Worked on the website.</td><td><b>Rebuilt</b> a sample club homepage as static pages, <b>cutting load time from 4s to 1s</b> in a local test.</td></tr>
<tr><td>Used tools.</td><td><b>Added</b> a checklist to a fictional study group so summaries went out the same day. Numeri di esempio, non un profilo reale.</td></tr></table>
<p>Se non hai il numero esatto, usa una stima onesta e difendibile ("~30%", "about 10k daily users") e <b>sappi spiegare come l'hai calcolata</b>: al colloquio te lo chiederanno, e la loro guida dice chiaramente che non fanno offerte a chi esagera i risultati.</p>
<h3>3. Verbi d'azione utili</h3>
<p><code>Built, Designed, Led, Automated, Reduced, Increased, Migrated, Refactored, Shipped, Optimized, Introduced, Simplified, Mentored, Delivered</code>. Evita <i>"Responsible for", "Worked on", "Helped with", "Involved in"</i>.</p>
<h3>4. Errori da evitare</h3>
<ul><li>Elenchi di tecnologie senza contesto.</li><li>Foto, data di nascita, stato civile (non servono nel formato internazionale).</li><li>Errori di inglese: fai rileggere il CV, la competenza in inglese è un requisito esplicito.</li><li>Gergo interno dell'azienda che nessuno capisce fuori.</li></ul>`,
cards:[['Formula del bullet efficace','Verbo d\u2019azione + cosa + come + risultato misurabile (numero, %, tempo).'],['Lunghezza ideale del CV per Bending Spoons','Breve: 1 pagina (massimo 2), in inglese, con dati quantitativi.'],['Perché non gonfiare i numeri?','La guida ufficiale dice che non fanno offerte se i risultati risultano esagerati: usa stime difendibili.']],
check:[['Quale bullet è più forte?',['Responsible for the Angular frontend.','Rebuilt the Angular checkout, cutting load time by 40% for 50k monthly users.','Worked with Angular and .NET on many features.','Helped the team with frontend tasks.'],1,'Inizia con un verbo d\u2019azione, dice cosa e mostra un impatto misurabile.'],
['Non conosci il numero esatto di un miglioramento. Cosa fai?',['Inventi un numero alto','Ometti ogni dato','Usi una stima onesta (~) che sai spiegare','Scrivi "huge improvement"'],2,'Una stima difendibile è accettabile; un numero inventato è un rischio enorme.'],
['Cosa NON serve in un CV internazionale?',['Link a GitHub','Voto di laurea','Data di nascita e foto','Risultati quantificati'],2,'Nel formato internazionale dati personali come età e foto non servono.']]},
{id:'cv-lettera',topic:'cover',title:'La lettera di presentazione: breve, specifica, onesta',mins:7,html:String.raw`
<p>Per Bending Spoons la lettera è <b>facoltativa ma apprezzata</b>. Indicano cosa dovrebbe contenere: le tue <b>qualità migliori</b>, la tua <b>motivazione</b> e il <b>perché di questo ruolo</b>.</p>
<h3>Struttura in 4 paragrafi (250–350 parole)</h3>
<ol><li><b>Aggancio</b>: chi sei e perché scrivi, in una frase. Niente "To whom it may concern".</li>
<li><b>Prova</b>: 1–2 risultati concreti e misurabili che dimostrano le qualità che cercano (ragionamento, ambizione, ownership).</li>
<li><b>Perché loro, perché questo ruolo</b>: collega qualcosa di specifico dell'annuncio (es. "Amplify your impact with AI", "Simplify relentlessly", ownership dall'idea alla produzione) a qualcosa che hai già fatto.</li>
<li><b>Chiusura</b>: disponibilità, entusiasmo misurato, ringraziamento.</li></ol>
<h3>Esempio di frase "Perché questo ruolo"</h3>
<pre>Your post says engineers should "simplify relentlessly". In a sample project
I kept a three-page static site instead of adding a backend nobody needed.
This sentence is an example, not a real achievement.</pre>
<h3>Regole d'oro</h3><ul><li>Ogni affermazione su di te va accompagnata da un fatto.</li><li>Non ripetere il CV: aggiungi il <i>perché</i>.</li><li>Tono diretto e sobrio: sono attenti all'onestà, evita superlativi.</li></ul>
<p>Nella scheda <b>Lettera</b> trovi un costruttore guidato che assembla una bozza in inglese.</p>`,
cards:[['Cosa deve contenere la lettera secondo la guida di Bending Spoons?','Qualità migliori, motivazione, perché questo ruolo. È facoltativa ma apprezzata.'],['Regola d\u2019oro della lettera','Ogni affermazione su di te è sostenuta da un fatto concreto; non ripetere il CV.']],
check:[['La lettera per Bending Spoons è…',['Obbligatoria','Facoltativa ma apprezzata','Sconsigliata','Richiesta solo per ruoli senior'],1,'La guida la definisce facoltativa ma apprezzata.'],
['Quale frase è più efficace?',['I am a very passionate and hard-working person.','I love technology since I was a child.','For a sample reading club I cut the weekly note from about 2 hours to about 25 minutes with a shared template.','I think I would be perfect for this role.'],2,'Fatti misurabili invece di aggettivi. È un esempio inventato.']]},
{id:'cv-github',topic:'github',title:'Un GitHub che lavora per te',mins:6,html:String.raw`
<p>Il modulo di candidatura ha un campo per il link GitHub. Chi lo apre guarderà 1–2 repo per pochi minuti: rendili leggibili.</p>
<h3>Checklist di un repo "vetrina"</h3>
<ul><li><b>README</b> con: problema risolto, demo (GIF o screenshot), architettura (diagramma), come avviarlo in 1 comando (<code>docker compose up</code>), scelte e trade-off.</li>
<li><b>Pin</b> dei 2–3 repo migliori sul profilo; README del profilo breve.</li>
<li><b>Test</b> e <b>CI</b> (GitHub Actions) con badge verde.</li>
<li>Storia dei commit pulita, messaggi chiari, PR anche nei progetti personali.</li>
<li>Nessun segreto nei file (chiavi API!), licenza, <code>.gitignore</code>.</li></ul>
<h3>Idea di progetto per te</h3>
<p>Va bene anche un progetto piccolo e inventato: il catalogo di un circolo di lettura, con README, un test e la CI. Conta che si capisca il problema, come si avvia e quali scelte hai fatto. Bonus: una piccola parte in <b>Python</b>, se vuoi esercitarti su quel linguaggio.</p>`,
cards:[['Cosa deve avere il README di un repo vetrina?','Problema, demo, architettura, avvio in 1 comando, scelte e trade-off.']],
check:[['Qual è la cosa più dannosa in un repo pubblico?',['Pochi commit','Chiavi API committate','Nessuna stella','README in inglese'],1,'Un segreto committato segnala scarsa attenzione alla sicurezza.']]},
/* ================= PROBLEM SOLVING ================= */
{id:'ps-seq',topic:'seq',title:'Come attaccare una successione numerica',mins:10,html:String.raw`
<p>I test di problem solving, dice la guida, possono sembrare scollegati dal ruolo: misurano quanto in fretta capisci problemi nuovi. Le successioni si risolvono con un <b>metodo</b>, non con l'ispirazione.</p>
<h3>Il metodo in 5 passi</h3>
<ol><li><b>Differenze</b>: calcola le differenze tra termini consecutivi. Costanti → aritmetica.</li>
<li><b>Differenze seconde</b>: se le differenze crescono regolarmente → successione quadratica.</li>
<li><b>Rapporti</b>: se i numeri crescono "troppo" → controlla i rapporti (geometrica, ×2, ×3).</li>
<li><b>Posizioni alterne</b>: se salta su e giù → separa termini pari e dispari: spesso sono due successioni intrecciate.</li>
<li><b>Ricorsioni</b>: ogni termine dipende dai precedenti (somma dei due precedenti, ×2+1…). Poi quadrati/cubi noti (1,4,9,16 / 1,8,27).</li></ol>
<h3>Esempio svolto 1</h3>
<pre>3, 7, 13, 21, 31, ?
differenze:  4, 6, 8, 10   → differenze seconde costanti (2)
prossima differenza = 12   → 31 + 12 = 43</pre>
<h3>Esempio svolto 2</h3>
<pre>2, 20, 4, 17, 8, 14, ?
posizioni dispari: 2, 4, 8   (×2)
posizioni pari:   20, 17, 14 (−3)
il prossimo è in posizione dispari → 16</pre>
<h3>Esempio svolto 3</h3>
<pre>1, 3, 7, 15, 31, ?   → ogni termine = precedente × 2 + 1 → 63</pre>
<h3>Strategia sotto tempo</h3><ul><li>Dai a ogni domanda un budget (es. 60 s). Se a metà budget non vedi il pattern, salta e torna dopo.</li><li>Verifica l'ipotesi su <b>tutti</b> i termini, non solo i primi due: è l'errore più comune.</li></ul>`,
cards:[['Primo passo con una successione','Calcola le differenze consecutive (poi le differenze seconde).'],['La successione va su e giù: cosa provi?','Separa le posizioni pari e dispari: spesso sono due successioni intrecciate.'],['1, 3, 7, 15, 31 → regola?','a(n) = 2·a(n−1) + 1 → 63']],
check:[['5, 8, 13, 20, 29, ?',['38','40','36','42'],1,'Differenze 3,5,7,9 → prossima 11 → 40.'],['1, 10, 2, 20, 4, 40, ?',['8','80','6','60'],0,'Dispari: 1,2,4 (×2) → 8.'],['Qual è l\u2019errore più comune?',['Calcolare troppe differenze','Verificare l\u2019ipotesi solo sui primi termini','Usare carta e penna','Saltare una domanda difficile'],1,'Un\u2019ipotesi va verificata su tutta la successione.']]},
{id:'ps-arith',topic:'arith',title:'Percentuali, velocità e lavoro: i problemi "a parole"',mins:12,html:String.raw`
<h3>Percentuali: pensa in moltiplicatori</h3>
<ul><li>+20% → ×1,20; −15% → ×0,85.</li><li>Variazioni successive si <b>moltiplicano</b>: +10% poi −10% = ×1,1×0,9 = ×0,99 → −1% (non zero!).</li>
<li>Variazione percentuale = (nuovo − vecchio) / vecchio.</li><li>"Il prezzo dopo lo sconto del 20% è 80 €; prezzo originale?" → 80 / 0,8 = 100 € (non 80 × 1,2 = 96!).</li></ul>
<h3>Velocità, tempo, distanza</h3><p>d = v × t. Velocità media su andata e ritorno a 60 e 40 km/h <b>non</b> è 50: è la media armonica 2·60·40/(60+40) = 48 km/h.</p>
<h3>Lavoro combinato</h3><p>Se A finisce in 6 h e B in 3 h, in un'ora fanno 1/6 + 1/3 = 1/2 del lavoro → insieme 2 h. Formula: t = (a·b)/(a+b).</p>
<h3>Miscele e medie</h3><p>Media di 4 voti = 7; quanto serve al quinto per fare 7,4? Totale necessario 5×7,4 = 37; già hai 28 → serve 9.</p>
<h3>Esempio svolto</h3>
<pre>Un abbonamento costa 50 €. Aumenta del 20%, poi viene scontato del 25%.
50 × 1,20 = 60;  60 × 0,75 = 45 €  → complessivamente −10%</pre>
<h3>Trucchi da test</h3><ul><li>Stima prima il risultato: elimina le opzioni impossibili.</li><li>Lavora con le frazioni (1/4, 1/8) invece dei decimali quando puoi.</li><li>Rileggi cosa chiede la domanda: totale, differenza, percentuale?</li></ul>`,
cards:[['+10% poi −10% = ?','×1,1 × 0,9 = 0,99 → −1%'],['Prezzo scontato del 20% = 80 €: prezzo originale?','80 / 0,8 = 100 €'],['A in a ore, B in b ore: insieme?','t = a·b / (a+b)'],['Velocità media andata a v1 e ritorno a v2','Media armonica: 2·v1·v2 / (v1+v2)']],
check:[['Un prezzo sale del 50% e poi scende del 50%. Variazione totale?',['0%','−25%','+25%','−50%'],1,'1,5 × 0,5 = 0,75 → −25%.'],['A dipinge un muro in 4 h, B in 12 h. Insieme?',['8 h','3 h','6 h','2 h'],1,'4·12/16 = 3 h.']]},
{id:'ps-logic',topic:'logic',title:'Sillogismi e deduzione logica',mins:12,html:String.raw`
<p>Nei sillogismi devi valutare se una conclusione <b>segue necessariamente</b> dalle premesse, ignorando ciò che sai del mondo reale. Il trucco è disegnare <b>insiemi</b> (diagrammi di Eulero-Venn) e cercare un <b>controesempio</b>.</p>
<h3>Le 4 forme</h3><ul><li><b>Tutti gli A sono B</b>: A dentro B.</li><li><b>Nessun A è B</b>: A e B disgiunti.</li><li><b>Alcuni A sono B</b>: almeno un elemento in comune.</li><li><b>Alcuni A non sono B</b>: almeno un A fuori da B.</li></ul>
<h3>Regole utili</h3>
<ul><li>Tutti A sono B + Tutti B sono C ⇒ Tutti A sono C. ✅</li>
<li>Tutti A sono B + Nessun B è C ⇒ Nessun A è C. ✅</li>
<li>Alcuni A sono B + Alcuni B sono C ⇒ <b>non</b> segue nulla su A e C. ❌ (i B in comune possono essere diversi)</li>
<li>Tutti A sono B ⇒ <b>non</b> implica che tutti B siano A (errore di conversione).</li>
<li>Tutti A sono B + Alcuni C sono A ⇒ Alcuni C sono B. ✅</li></ul>
<h3>Esempio svolto</h3>
<pre>Premesse: Tutti i server sono macchine. Alcune macchine sono rumorose.
Conclusione: Alcuni server sono rumorosi?
Controesempio: le macchine rumorose possono essere tutte fuori dall'insieme "server".
→ Non segue necessariamente.</pre>
<h3>Problemi di ordinamento</h3><p>"Anna è più alta di Bruno; Carla è più bassa di Bruno; Dario è più alto di Anna." Scrivi una <b>linea</b> e piazza le persone una relazione alla volta: Dario &gt; Anna &gt; Bruno &gt; Carla.</p>
<h3>Bias da evitare</h3><p>La conclusione "suona vera" non significa che segua dalle premesse (belief bias). Bending Spoons cita proprio il resistere ai bias tra le qualità di ragionamento che cerca.</p>`,
cards:[['Alcuni A sono B + Alcuni B sono C ⇒ Alcuni A sono C?','No: non segue necessariamente.'],['Tutti A sono B ⇒ Tutti B sono A?','No: errore di conversione.'],['Come verifichi un sillogismo?','Disegna gli insiemi e cerca un controesempio.'],['Cos\u2019è il belief bias?','Giudicare valida una conclusione perché sembra vera, non perché segue dalle premesse.']],
check:[['Tutti i gatti sono felini. Nessun felino è un rettile. Quindi…',['Alcuni gatti sono rettili','Nessun gatto è un rettile','Non si può dire','Tutti i rettili sono gatti'],1,'A⊂B e B∩C=∅ ⇒ A∩C=∅.'],['Alcuni dev sono designer. Alcuni designer sono manager. Alcuni dev sono manager?',['Sì, segue','No, è falso','Non segue necessariamente','Solo se tutti i designer sono manager'],2,'I designer in comune possono essere diversi.']]},
{id:'ps-matrix',topic:'matrix',title:'Matrici di figure: trovare la regola',mins:8,html:String.raw`
<p>Nei puzzle a matrice 3×3 manca una cella: devi trovare la regola che lega righe e colonne.</p>
<h3>Checklist delle regole più frequenti</h3>
<ol><li><b>Numero</b> di elementi che cresce/decresce lungo riga o colonna.</li><li><b>Forma</b> che compare una volta per riga e per colonna (quadrato latino).</li>
<li><b>Riempimento</b> (pieno/vuoto/rigato) costante per riga o che ruota.</li><li><b>Rotazione</b> di un elemento di un angolo fisso (45°, 90°) a ogni passo.</li>
<li><b>Somma/sottrazione</b> di figure: la terza cella = prima ∪ seconda, o differenza.</li></ol>
<h3>Metodo</h3><ul><li>Analizza <b>una proprietà alla volta</b> (numero, forma, colore, orientamento).</li><li>Verifica la regola su riga 1 e 2 prima di applicarla alla 3.</li><li>Elimina le opzioni che violano anche una sola proprietà.</li></ul>
<h3>Esempio svolto</h3><pre>Riga 1: 1 cerchio, 2 cerchi, 3 cerchi
Riga 2: 1 quadrato, 2 quadrati, 3 quadrati
Riga 3: 1 triangolo, 2 triangoli, ?
Numero: +1 per colonna → 3. Forma: costante per riga → triangolo. Risposta: 3 triangoli.</pre>`,
cards:[['Prime proprietà da controllare in una matrice','Numero, forma, riempimento, rotazione, somma di figure: una alla volta.'],['Cos\u2019è un quadrato latino nei puzzle?','Ogni forma compare una sola volta per riga e per colonna.']],
check:[['Come conviene analizzare una matrice?',['Guardare tutte le proprietà insieme','Una proprietà alla volta, verificando su due righe','Scegliere l\u2019opzione più simmetrica','Partire dalle opzioni'],1,'Isolare le proprietà riduce gli errori.']]},
{id:'ps-estim',topic:'estim',title:'Stime alla Fermi e calcoli "back-of-the-envelope"',mins:10,html:String.raw`
<p>Le stime servono sia nei test di ragionamento sia nel system design. L'obiettivo è l'<b>ordine di grandezza</b> giusto con ipotesi esplicite.</p>
<h3>Metodo</h3><ol><li>Scomponi in fattori moltiplicabili (popolazione × quota × frequenza…).</li><li>Arrotonda a numeri comodi (1, 2, 5 × 10^n).</li><li>Dichiara le ipotesi ad alta voce.</li><li>Controlla la plausibilità finale.</li></ol>
<h3>Numeri da sapere a memoria</h3>
<table><tr><td>Secondi in un giorno</td><td>86.400 ≈ 10<sup>5</sup></td></tr><tr><td>1 milione di richieste/giorno</td><td>≈ 12 richieste/s</td></tr>
<tr><td>Picco</td><td>di solito 2–10× la media</td></tr><tr><td>1 KB × 1 M</td><td>= 1 GB</td></tr><tr><td>Lettura da memoria vs disco vs rete intercontinentale</td><td>~100 ns / ~ms / ~150 ms</td></tr></table>
<h3>Esempio svolto</h3><pre>App con 20 M utenti attivi al giorno, ognuno carica 2 foto da 3 MB:
20 M × 2 × 3 MB = 120 M MB = 120 TB al giorno  →  ~44 PB all'anno
Richieste: 40 M upload / 86.400 s ≈ 460 upload/s di media, picco ~2.000/s</pre>`,
cards:[['Secondi in un giorno (approssimato)','86.400 ≈ 10^5'],['1 M richieste al giorno ≈ quante al secondo?','≈ 12/s (picco 2–10×)'],['Obiettivo di una stima di Fermi','Ordine di grandezza corretto con ipotesi esplicite.']],
check:[['100 M richieste al giorno sono circa…',['100/s','1.200/s','12.000/s','120/s'],1,'100 M / 86.400 ≈ 1.157/s.'],['1 M utenti × 5 KB di profilo =',['5 MB','5 GB','5 TB','500 MB'],1,'5 KB × 10^6 = 5 × 10^9 B = 5 GB.']]},
{id:'ps-algo',topic:'algo',title:'Pattern di algoritmi: i 6 da sapere',mins:15,html:String.raw`
<p>Per i problemi di coding la conoscenza dei <b>pattern</b> conta più della memoria delle soluzioni. Esempi in Python (allenano anche la lacuna principale).</p>
<h3>1. Hashing (dizionario/set) — O(n)</h3><pre>def two_sum(nums, target):
    seen = {}                     # valore -> indice
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i</pre>
<h3>2. Two pointers — array ordinati, palindromi</h3><pre>def is_palindrome(s):
    s = [c.lower() for c in s if c.isalnum()]
    i, j = 0, len(s) - 1
    while i &lt; j:
        if s[i] != s[j]: return False
        i, j = i + 1, j - 1
    return True</pre>
<h3>3. Sliding window — sottoarray/sottostringhe contigue</h3><pre>def longest_unique(s):
    last, start, best = {}, 0, 0
    for i, c in enumerate(s):
        if last.get(c, -1) >= start:
            start = last[c] + 1
        last[c] = i
        best = max(best, i - start + 1)
    return best</pre>
<h3>4. BFS / DFS — grafi, griglie, alberi</h3><pre>from collections import deque
def bfs(graph, start):
    seen, q = {start}, deque([start])
    while q:
        node = q.popleft()
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt); q.append(nxt)
    return seen</pre>
<p>BFS trova il cammino più breve in grafi non pesati; DFS (ricorsiva o con stack) per esplorare/contare componenti.</p>
<h3>5. Programmazione dinamica — sottoproblemi sovrapposti</h3><pre>def climb_stairs(n):          # modi di salire con passi da 1 o 2
    a, b = 1, 1
    for _ in range(n):
        a, b = b, a + b
    return a</pre>
<p>Ricetta: definisci lo stato (dp[i] = …), la transizione, il caso base; poi ottimizza la memoria.</p>
<h3>6. Ricerca binaria — spazio ordinato o monotono</h3><pre>def lower_bound(a, x):
    lo, hi = 0, len(a)
    while lo &lt; hi:
        mid = (lo + hi) // 2
        if a[mid] &lt; x: lo = mid + 1
        else: hi = mid
    return lo</pre>
<h3>Come affrontare un problema al colloquio</h3><ol><li>Riformula e chiedi i vincoli (dimensioni, duplicati, input vuoti).</li><li>Proponi prima la soluzione brute force e la sua complessità.</li><li>Migliora con un pattern; spiega il trade-off.</li><li>Scrivi codice pulito, poi testalo a mano su un esempio e sui casi limite.</li></ol>`,
cards:[['Pattern per "trova una coppia con somma X" in O(n)','Hashing: dizionario dei valori visti.'],['Pattern per sottostringhe contigue','Sliding window con due indici.'],['BFS o DFS per il cammino più breve in grafo non pesato?','BFS.'],['Tre ingredienti della programmazione dinamica','Stato, transizione, caso base.'],['Complessità della ricerca binaria','O(log n)']],
check:[['Trovare la sottostringa più lunga senza ripetizioni: pattern?',['DP','Sliding window','BFS','Ordinamento'],1,'Finestra che scorre con indice di inizio.'],['Primo passo al colloquio di coding?',['Scrivere subito il codice ottimo','Riformulare e chiarire i vincoli','Chiedere la soluzione','Scegliere il linguaggio più veloce'],1,'Capire bene il problema evita di risolvere quello sbagliato.']]},
/* ================= TECH ================= */
{id:'py-1',topic:'python',title:'Python per chi viene da C#: la mappa della sintassi',mins:15,html:String.raw`
<p>Python è a tipizzazione <b>dinamica</b> (i tipi esistono, ma sono controllati a runtime) e usa l'<b>indentazione</b> al posto delle graffe. Ecco la tabella di conversione mentale.</p>
<table><tr><th>C#</th><th>Python</th></tr>
<tr><td><code>var x = 5;</code></td><td><code>x = 5</code></td></tr>
<tr><td><code>List&lt;int&gt; xs = new() {1,2};</code></td><td><code>xs: list[int] = [1, 2]</code></td></tr>
<tr><td><code>Dictionary&lt;string,int&gt;</code></td><td><code>dict[str, int]</code> → <code>{"a": 1}</code></td></tr>
<tr><td><code>HashSet&lt;T&gt;</code></td><td><code>set()</code> / <code>{1, 2}</code></td></tr>
<tr><td><code>null</code></td><td><code>None</code></td></tr>
<tr><td><code>$"Ciao {name}"</code></td><td><code>f"Ciao {name}"</code></td></tr>
<tr><td><code>foreach (var (i, x) in xs.Select((x,i)=&gt;(i,x)))</code></td><td><code>for i, x in enumerate(xs):</code></td></tr>
<tr><td><code>using (var f = File.OpenRead(p))</code></td><td><code>with open(p) as f:</code></td></tr>
<tr><td><code>try {} catch (Exception e) {} finally {}</code></td><td><code>try: … except Exception as e: … finally: …</code></td></tr>
<tr><td><code>record Person(string Name, int Age);</code></td><td><code>@dataclass class Person: name: str; age: int</code></td></tr>
<tr><td><code>params object[] args</code></td><td><code>*args</code>, <code>**kwargs</code></td></tr>
<tr><td>NuGet + .csproj</td><td>pip/uv + <code>pyproject.toml</code>, ambiente virtuale <code>venv</code></td></tr></table>
<h3>Una classe a confronto</h3>
<pre>from dataclasses import dataclass, field

@dataclass
class Order:
    id: int
    items: list[str] = field(default_factory=list)   # mai "= []"!

    @property
    def size(self) -> int:          # come una property C# get-only
        return len(self.items)

    def add(self, item: str) -> None:
        self.items.append(item)     # self è esplicito</pre>
<h3>Divisioni e numeri</h3><p><code>7 / 2 == 3.5</code> (sempre float), <code>7 // 2 == 3</code> (divisione intera), <code>2 ** 10 == 1024</code>. Gli interi non vanno in overflow.</p>
<h3>Verità ("truthiness")</h3><p><code>if items:</code> è falso se la lista è vuota. Sono "falsy": <code>None, 0, "", [], {}, set()</code>.</p>
<h3>Identità e uguaglianza</h3><p><code>==</code> confronta i valori (come <code>Equals</code>), <code>is</code> confronta l'identità (come <code>ReferenceEquals</code>). Usa <code>is</code> solo con <code>None</code>: <code>if x is None:</code>.</p>`,
cards:[['Equivalente Python di using(...)','with open(p) as f: (context manager)'],['7 / 2 e 7 // 2 in Python','3.5 e 3'],['is vs == in Python','is = identità (ReferenceEquals), == = uguaglianza di valore. Usa is solo con None.'],['Equivalente di un record C#','@dataclass (eventualmente frozen=True)'],['Valori "falsy" in Python','None, 0, "", [], {}, set()']],
check:[['Come si scrive l\u2019equivalente di foreach con indice?',['for i in range(xs):','for i, x in enumerate(xs):','xs.forEach((x,i))','for (i, x) of xs'],1,'enumerate restituisce coppie (indice, valore).'],['Cosa stampa print(7 // 2)?',['3.5','3','4','Errore'],1,'// è la divisione intera.'],['Come controlli se x è null?',['x == null','x is None','x === None','isnull(x)'],1,'Si usa is None.']]},
{id:'py-2',topic:'python',title:'Comprehension, generatori e il "LINQ" di Python',mins:15,html:String.raw`
<h3>List/dict/set comprehension = Select + Where</h3>
<pre># C#: nums.Where(x => x % 2 == 0).Select(x => x * x).ToList()
squares = [x * x for x in nums if x % 2 == 0]

# dizionario: ToDictionary
by_id = {u.id: u for u in users}

# set
domains = {email.split("@")[1] for email in emails}</pre>
<h3>Generatori = yield return (lazy)</h3>
<pre>def read_lines(path):
    with open(path) as f:
        for line in f:
            yield line.rstrip()      # come yield return: valutazione pigra

errors = (l for l in read_lines("app.log") if "ERROR" in l)   # generator expression
first_10 = [next(errors) for _ in range(10)]</pre>
<p>Un generatore si consuma <b>una sola volta</b> (come un <code>IEnumerable</code> non materializzato basato su <code>yield</code>, ma senza poterlo reiterare).</p>
<h3>Funzioni built-in che sostituiscono LINQ</h3>
<table><tr><th>LINQ</th><th>Python</th></tr>
<tr><td>Any / All</td><td><code>any(x &gt; 0 for x in xs)</code> / <code>all(...)</code></td></tr>
<tr><td>Sum / Max / Min</td><td><code>sum(xs)</code>, <code>max(xs, key=len)</code></td></tr>
<tr><td>OrderBy</td><td><code>sorted(people, key=lambda p: p.age)</code> (<code>reverse=True</code> per Descending)</td></tr>
<tr><td>GroupBy</td><td><code>collections.defaultdict(list)</code> o <code>itertools.groupby</code> (richiede ordinamento)</td></tr>
<tr><td>Zip</td><td><code>zip(a, b)</code></td></tr>
<tr><td>Count per chiave</td><td><code>collections.Counter(words).most_common(3)</code></td></tr>
<tr><td>Take / Skip</td><td>slicing <code>xs[:3]</code>, <code>xs[3:]</code>; <code>itertools.islice</code> per i generatori</td></tr></table>
<h3>Slicing</h3><pre>xs = [10, 20, 30, 40, 50]
xs[-1]    # 50   (ultimo)
xs[1:3]   # [20, 30]
xs[::-1]  # lista invertita</pre>`,
cards:[['LINQ Where+Select in Python','[f(x) for x in xs if cond(x)]'],['Equivalente di yield return','yield in una funzione → generatore pigro, consumabile una volta.'],['OrderBy in Python','sorted(xs, key=lambda p: p.age)'],['Contare occorrenze in Python','collections.Counter(xs).most_common(n)'],['xs[::-1]','Lista invertita']],
check:[['[x*2 for x in range(4) if x != 2] produce…',['[0, 2, 6]','[0, 2, 4, 6]','[2, 6]','[0, 1, 3]'],0,'x vale 0,1,3 → 0,2,6.'],['Cosa succede iterando due volte lo stesso generatore?',['Riparte da capo','La seconda volta è vuoto','Errore di sintassi','Viene copiato'],1,'Un generatore si consuma una sola volta.']]},
{id:'py-3',topic:'python',title:'Typing, async e le trappole classiche',mins:15,html:String.raw`
<h3>Type hints: documentano, non obbligano</h3>
<pre>from typing import Protocol

def find(users: list["User"], name: str) -> "User | None": ...

class Repository(Protocol):          # interfaccia "strutturale" (duck typing)
    def get(self, id: int) -> dict: ...</pre>
<p>L'interprete <b>non</b> verifica i tipi: serve un type checker (<code>mypy</code>, <code>pyright</code>) in CI. <code>Protocol</code> è come un'interfaccia, ma basta avere i metodi giusti, senza dichiarare "implements".</p>
<h3>async/await: simile a C#, ma con un event loop esplicito</h3>
<pre>import asyncio

async def fetch(i: int) -> int:
    await asyncio.sleep(0.1)        # come await Task.Delay(100)
    return i * 2

async def main():
    results = await asyncio.gather(*(fetch(i) for i in range(5)))  # Task.WhenAll
    print(results)

asyncio.run(main())</pre>
<p>Differenza chiave: una chiamata bloccante (es. <code>time.sleep</code>, <code>requests.get</code>) dentro una coroutine blocca <b>tutto</b> l'event loop. Usa librerie async (<code>httpx</code>, <code>aiohttp</code>) o <code>asyncio.to_thread</code>.</p>
<h3>GIL</h3><p>In CPython i thread non eseguono codice Python CPU-bound in parallelo (Global Interpreter Lock; le build "free-threaded" sono ancora opzionali). Per lavoro CPU-bound usa <code>multiprocessing</code>/<code>ProcessPoolExecutor</code>; per I/O vanno bene thread o asyncio.</p>
<h3>Trappole da conoscere</h3>
<pre># 1. Argomento di default mutabile: condiviso tra le chiamate!
def add(item, acc=[]):     # SBAGLIATO
    acc.append(item); return acc
def add(item, acc=None):   # GIUSTO
    acc = [] if acc is None else acc
    acc.append(item); return acc

# 2. Late binding nelle closure
fs = [lambda: i for i in range(3)]
[f() for f in fs]          # [2, 2, 2]  → fix: lambda i=i: i

# 3. Copia superficiale
grid = [[0] * 3] * 3       # 3 riferimenti alla STESSA lista
grid = [[0] * 3 for _ in range(3)]   # corretto</pre>`,
cards:[['I type hint sono verificati a runtime?','No: servono mypy/pyright.'],['asyncio.gather equivale a…','Task.WhenAll'],['Trappola: def f(x, acc=[])','La lista di default è condivisa tra chiamate; usa None.'],['GIL: cosa implica?','Thread non parallelizzano lavoro CPU-bound Python: usa multiprocessing.'],['[[0]*3]*3: problema?','Tre riferimenti alla stessa lista interna.'],['typing.Protocol','Interfaccia strutturale: basta avere i metodi (duck typing).']],
check:[['Codice CPU-bound in parallelo in CPython standard: cosa usi?',['threading','asyncio','multiprocessing','await'],2,'Il GIL limita i thread per il lavoro CPU-bound.'],['[lambda: i for i in range(3)] chiamate restituiscono…',['[0,1,2]','[2,2,2]','[3,3,3]','Errore'],1,'Late binding: tutte vedono l\u2019ultimo i.'],['time.sleep(1) in una coroutine…',['Sospende solo quella coroutine','Blocca tutto l\u2019event loop','Viene ignorato','Lancia eccezione'],1,'Usa await asyncio.sleep.']]},
{id:'k8s-1',topic:'k8s',title:'Kubernetes: gli oggetti fondamentali',mins:15,html:String.raw`
<p>Conosci già Docker: Kubernetes (K8s) è l'<b>orchestratore</b> che esegue molti container su un cluster di macchine e li mantiene nello <b>stato desiderato</b> che dichiari in YAML.</p>
<h3>Architettura</h3><ul><li><b>Control plane</b>: API server (tutto passa da qui), <b>etcd</b> (database chiave-valore dello stato), scheduler (sceglie il nodo), controller manager (riconcilia stato reale e desiderato).</li><li><b>Nodi worker</b>: <b>kubelet</b> (agente che avvia i pod), container runtime, kube-proxy (rete dei Service).</li></ul>
<h3>Oggetti principali</h3>
<table><tr><th>Oggetto</th><th>A cosa serve</th></tr>
<tr><td>Pod</td><td>Unità minima: 1+ container che condividono rete e volumi. Effimero.</td></tr>
<tr><td>Deployment</td><td>Gestisce ReplicaSet → N repliche di un pod stateless, rolling update e rollback.</td></tr>
<tr><td>Service</td><td>Indirizzo stabile + load balancing verso i pod selezionati per <b>label</b> (ClusterIP, NodePort, LoadBalancer).</td></tr>
<tr><td>Ingress</td><td>Routing HTTP(S) dall'esterno (host/path → Service).</td></tr>
<tr><td>ConfigMap / Secret</td><td>Configurazione / dati sensibili (i Secret sono solo base64 di default, non cifrati!).</td></tr>
<tr><td>StatefulSet</td><td>Pod con identità e storage stabili (database).</td></tr>
<tr><td>DaemonSet</td><td>Un pod per nodo (agent di log/monitoring).</td></tr>
<tr><td>Job / CronJob</td><td>Lavori batch / pianificati.</td></tr>
<tr><td>PersistentVolumeClaim</td><td>Richiesta di storage persistente.</td></tr>
<tr><td>HorizontalPodAutoscaler</td><td>Scala il numero di repliche su CPU/metriche.</td></tr></table>
<h3>Un Deployment + Service minimo</h3>
<pre>apiVersion: apps/v1
kind: Deployment
metadata: { name: orders-api }
spec:
  replicas: 3
  selector: { matchLabels: { app: orders } }
  template:
    metadata: { labels: { app: orders } }
    spec:
      containers:
      - name: api
        image: myacr.azurecr.io/orders:1.4.2
        ports: [{ containerPort: 8080 }]
        resources:
          requests: { cpu: 100m, memory: 128Mi }
          limits:   { memory: 256Mi }
        readinessProbe: { httpGet: { path: /health/ready, port: 8080 } }
        livenessProbe:  { httpGet: { path: /health/live,  port: 8080 } }
---
apiVersion: v1
kind: Service
metadata: { name: orders }
spec:
  selector: { app: orders }
  ports: [{ port: 80, targetPort: 8080 }]</pre>`,
cards:[['Pod','Unità minima di K8s: 1+ container con rete e volumi condivisi; effimero.'],['Deployment','Gestisce repliche di pod stateless con rolling update e rollback.'],['Service','IP/DNS stabile e load balancing verso pod selezionati da label.'],['etcd','Database chiave-valore con lo stato del cluster.'],['kubelet','Agente su ogni nodo che avvia e controlla i pod.'],['I Secret sono cifrati di default?','No: solo base64; serve cifratura a riposo/KMS o un vault.'],['StatefulSet vs Deployment','StatefulSet dà identità e storage stabili (DB); Deployment per stateless.']],
check:[['Come un Service sa a quali pod inviare traffico?',['Per nome del pod','Tramite label selector','Per IP fisso','Tramite etcd direttamente'],1,'Il selector seleziona i pod con le label indicate.'],['Per un agente di log su ogni nodo usi…',['Deployment','DaemonSet','Job','StatefulSet'],1,'DaemonSet = un pod per nodo.']]},
{id:'k8s-2',topic:'k8s',title:'Kubernetes in esercizio: probe, risorse, rollout e debug',mins:12,html:String.raw`
<h3>Readiness vs liveness</h3><ul><li><b>Readiness</b>: "posso ricevere traffico?" Se fallisce, il pod esce dal Service ma non viene riavviato (es. warm-up, DB non raggiungibile).</li><li><b>Liveness</b>: "sono vivo?" Se fallisce, il container viene <b>riavviato</b>. Non farla dipendere da servizi esterni, o un DB lento riavvia tutto il cluster.</li><li><b>Startup probe</b>: per app lente ad avviarsi.</li></ul>
<h3>Requests e limits</h3><p><b>requests</b> = quanto viene riservato (usato dallo scheduler); <b>limits</b> = tetto. Superare il limite di memoria → <code>OOMKilled</code>; superare la CPU → throttling.</p>
<h3>Rolling update e rollback</h3><pre>kubectl set image deploy/orders-api api=myacr.azurecr.io/orders:1.4.3
kubectl rollout status deploy/orders-api
kubectl rollout undo deploy/orders-api      # torna alla versione precedente</pre>
<h3>Debug: i comandi che usi davvero</h3><pre>kubectl get pods -n shop                     # stato
kubectl describe pod orders-api-7d9f -n shop # eventi: ImagePullBackOff, OOMKilled…
kubectl logs orders-api-7d9f --previous      # log del container crashato
kubectl exec -it orders-api-7d9f -- sh       # shell nel container
kubectl port-forward svc/orders 8080:80      # test locale</pre>
<table><tr><th>Stato</th><th>Causa tipica</th></tr><tr><td>CrashLoopBackOff</td><td>Il processo esce subito: config mancante, eccezione all'avvio.</td></tr><tr><td>ImagePullBackOff</td><td>Tag sbagliato o credenziali del registry.</td></tr><tr><td>Pending</td><td>Nessun nodo con risorse sufficienti.</td></tr><tr><td>OOMKilled</td><td>Limite di memoria superato.</td></tr></table>
<h3>Approccio dichiarativo</h3><p>Descrivi lo stato in YAML versionato su Git e applicalo con <code>kubectl apply -f</code> (o Helm/Kustomize/GitOps con Argo CD). A differenza di uno script lanciato a mano, il cluster riconcilia continuamente.</p>`,
cards:[['Readiness probe fallisce: cosa succede?','Il pod esce dal bilanciamento del Service, senza riavvio.'],['Liveness probe fallisce: cosa succede?','Il container viene riavviato.'],['OOMKilled','Il container ha superato il limite di memoria.'],['CrashLoopBackOff','Il container si avvia e termina ripetutamente; guarda logs --previous.'],['Rollback di un Deployment','kubectl rollout undo deploy/nome']],
check:[['Il pod non riceve traffico durante il warm-up. Quale probe?',['Liveness','Readiness','Startup','Nessuna'],1,'La readiness controlla l\u2019ingresso nel bilanciamento.'],['Pod in Pending da minuti. Causa probabile?',['Immagine sbagliata','Nessun nodo con risorse sufficienti','Bug nel codice','Liveness fallita'],1,'Lo scheduler non trova spazio.']]},
{id:'grpc-1',topic:'grpc',title:'gRPC vs REST: come funzionano e quando sceglierli',mins:15,html:String.raw`
<h3>REST in breve</h3><p>Risorse identificate da URL, verbi HTTP (<code>GET</code> sicuro e idempotente, <code>PUT</code>/<code>DELETE</code> idempotenti, <code>POST</code> no, <code>PATCH</code> modifica parziale), JSON, codici di stato (201 Created, 404, 409 Conflict, 429 Too Many Requests). Contratto descritto spesso con OpenAPI. Pregi: universale, leggibile, cacheabile via HTTP, ottimo per API pubbliche e browser.</p>
<h3>gRPC in breve</h3><p>Framework RPC su <b>HTTP/2</b> con contratto in <b>Protocol Buffers</b> (<code>.proto</code>), serializzazione binaria compatta e <b>generazione di codice</b> client/server tipizzato (in .NET: <code>Grpc.AspNetCore</code>).</p>
<pre>syntax = "proto3";
service Orders {
  rpc GetOrder (GetOrderRequest) returns (Order);                 // unary
  rpc WatchOrders (WatchRequest) returns (stream OrderEvent);     // server streaming
  rpc Upload (stream Chunk) returns (UploadResult);               // client streaming
  rpc Chat (stream Msg) returns (stream Msg);                     // bidirezionale
}
message GetOrderRequest { int64 id = 1; }
message Order { int64 id = 1; string customer = 2; repeated string items = 3; }</pre>
<h3>Regole di compatibilità dei protobuf</h3><ul><li>I <b>numeri di campo</b> identificano i campi sul filo: non cambiarli e non riusarli (usa <code>reserved</code>).</li><li>Aggiungere un campo è retrocompatibile: i client vecchi lo ignorano.</li><li>In proto3 i campi assenti hanno il valore di default (0, "", false).</li></ul>
<h3>Concetti gRPC importanti</h3><ul><li><b>Deadline</b>: ogni chiamata dovrebbe avere un timeout, che si propaga lungo la catena.</li><li>Codici di stato propri: <code>OK, NOT_FOUND, INVALID_ARGUMENT, DEADLINE_EXCEEDED, UNAVAILABLE</code> (quest'ultimo indica di riprovare).</li><li><b>Metadata</b> = header (es. token di auth).</li><li>Il browser non parla gRPC nativo: serve <b>gRPC-Web</b> o un gateway JSON.</li><li>Le connessioni HTTP/2 sono lunghe e multiplexate: un load balancer L4 manda tutto a un solo backend → serve bilanciamento L7 o lato client.</li></ul>
<h3>Quando usare cosa</h3><table><tr><th>Scenario</th><th>Scelta tipica</th></tr><tr><td>API pubblica per terze parti, browser</td><td>REST</td></tr><tr><td>Comunicazione interna tra microservizi, bassa latenza, contratti forti</td><td>gRPC</td></tr><tr><td>Streaming di eventi in tempo reale tra servizi</td><td>gRPC streaming</td></tr><tr><td>Caching HTTP/CDN importante</td><td>REST</td></tr></table>`,
cards:[['Trasporto e formato di gRPC','HTTP/2 + Protocol Buffers (binario).'],['I 4 tipi di RPC gRPC','Unary, server streaming, client streaming, bidirezionale.'],['Si può riusare un numero di campo protobuf?','No: rompe la compatibilità; usa reserved.'],['Verbi HTTP idempotenti','GET, PUT, DELETE (e HEAD, OPTIONS). POST no.'],['gRPC dal browser','Serve gRPC-Web o un gateway JSON.'],['Perché gRPC richiede bilanciamento L7?','Connessioni HTTP/2 lunghe e multiplexate: L4 le inchioda a un backend.']],
check:[['API pubblica consumata da browser e partner: scelta naturale?',['gRPC','REST','SOAP','TCP raw'],1,'REST è universale e cacheabile.'],['Aggiungere un nuovo campo a un messaggio proto3…',['Rompe tutti i client','È retrocompatibile','Richiede cambiare i numeri','Non è possibile'],1,'I client vecchi ignorano i campi sconosciuti.'],['Quale verbo NON è idempotente?',['PUT','DELETE','POST','GET'],2,'Due POST possono creare due risorse.']]},
{id:'docker-1',topic:'docker',title:'Docker oltre le basi: immagini piccole, sicure e veloci da buildare',mins:12,html:String.raw`
<p>Lo usi già: qui ripassiamo i concetti che spesso emergono nelle domande tecniche.</p>
<h3>Container ≠ VM</h3><p>Un container è un <b>processo isolato</b> (namespace + cgroup) che condivide il kernel dell'host. Un'<b>immagine</b> è un insieme di layer read-only; il container aggiunge un layer scrivibile effimero.</p>
<h3>Multi-stage build per .NET</h3>
<pre>FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY Orders.Api/Orders.Api.csproj Orders.Api/
RUN dotnet restore Orders.Api/Orders.Api.csproj     # layer in cache finché il csproj non cambia
COPY . .
RUN dotnet publish Orders.Api -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
USER app                                             # non root
ENTRYPOINT ["dotnet", "Orders.Api.dll"]</pre>
<h3>Cache dei layer</h3><p>Ogni istruzione crea un layer; se un layer cambia, tutti i successivi vengono ricostruiti. Metti prima ciò che cambia raramente (dipendenze), poi il codice. Usa <code>.dockerignore</code> (bin, obj, .git).</p>
<h3>ENTRYPOINT vs CMD</h3><p>ENTRYPOINT è l'eseguibile; CMD sono argomenti di default sovrascrivibili. Usa la forma JSON (exec) così il processo è PID 1 e riceve <b>SIGTERM</b> per lo spegnimento ordinato.</p>
<h3>Altri punti chiave</h3><ul><li><code>EXPOSE</code> documenta soltanto; è <code>-p 8080:80</code> a pubblicare la porta.</li><li>Volumi (gestiti da Docker) vs bind mount (cartella dell'host).</li><li>In Compose i servizi si trovano per <b>nome DNS</b> sulla rete comune (<code>Server=db</code>).</li><li>Niente segreti in <code>ENV</code>/<code>ARG</code> nell'immagine: finiscono nei layer.</li><li>Evita <code>:latest</code> in produzione: usa tag versionati o digest.</li><li>Log su stdout/stderr, container stateless.</li></ul>`,
cards:[['Container vs VM','Il container è un processo isolato che condivide il kernel; la VM ha un suo kernel.'],['Perché copiare il .csproj prima del codice?','Per sfruttare la cache del layer di restore.'],['EXPOSE pubblica la porta?','No, documenta; serve -p host:container.'],['Perché la forma exec di ENTRYPOINT?','Il processo è PID 1 e riceve SIGTERM per uno shutdown ordinato.'],['Multi-stage build','Compili nello stage SDK e copi solo l\u2019output nell\u2019immagine runtime, più piccola.']],
check:[['Cambi una riga di codice e il restore viene rifatto ogni volta. Perché?',['Docker non ha cache','COPY . . è prima di restore','Manca EXPOSE','Usi multi-stage'],1,'Il layer del codice invalida i successivi.'],['Dove NON mettere una password?',['Secret di Kubernetes','Variabile ENV nel Dockerfile','Vault','Variabile della pipeline'],1,'Resta nei layer dell\u2019immagine.']]},
{id:'sd-1',topic:'sysdesign',title:'System design 1: il metodo e la scalabilità',mins:15,html:String.raw`
<h3>Il metodo in 6 passi (usalo sempre, anche nel template degli esercizi)</h3>
<ol><li><b>Requisiti</b> funzionali (cosa fa) e non funzionali (scala, latenza, disponibilità, consistenza). Fai domande!</li><li><b>Stime</b>: utenti, QPS, storage (vedi lezione sulle stime).</li><li><b>API</b>: endpoint principali.</li><li><b>Modello dati</b> e scelta del database.</li><li><b>Architettura</b> ad alto livello, poi approfondisci il collo di bottiglia.</li><li><b>Trade-off</b>, punti di guasto, cosa faresti dopo. Parti <b>semplice</b> e complica solo quando i numeri lo richiedono.</li></ol>
<h3>Scalare</h3><ul><li><b>Verticale</b>: macchina più grande. Semplice ma con un tetto.</li><li><b>Orizzontale</b>: più istanze dietro un <b>load balancer</b>. Richiede servizi <b>stateless</b> (sessione in Redis/token, non in memoria).</li><li>Database: prima indici e query, poi <b>read replica</b> (attenzione al <b>replication lag</b>), poi cache, infine partizionamento.</li></ul>
<h3>Latenza: misura i percentili</h3><p>La media nasconde i casi lenti: guarda p95/p99. Con molte chiamate in fan-out, la probabilità di incontrare un servizio lento cresce.</p>
<h3>Disponibilità</h3><p>99,9% = ~8,8 ore di down all'anno; 99,99% = ~53 minuti. Due componenti in serie al 99,9% → ~99,8%. Ridondanza e assenza di single point of failure aumentano la disponibilità.</p>`,
cards:[['I 6 passi del system design','Requisiti, stime, API, modello dati, architettura, trade-off.'],['Prerequisito per scalare orizzontalmente','Servizi stateless (stato esterno: DB, cache, token).'],['Perché guardare p99 e non la media?','La media nasconde la coda lenta che gli utenti percepiscono.'],['99,9% di disponibilità','≈ 8,8 ore di disservizio all\u2019anno.'],['Rischio delle read replica','Replication lag: letture non aggiornate.']],
check:[['Primo passo in un colloquio di system design?',['Disegnare Kafka','Chiarire i requisiti','Scegliere Kubernetes','Scrivere SQL'],1,'Senza requisiti si progetta il sistema sbagliato.'],['Le sessioni utente sono in memoria nel server. Problema per scalare?',['Nessuno','Le richieste devono tornare sempre alla stessa istanza','Il DB si satura','Aumenta la sicurezza'],1,'Serve stato esterno per scalare orizzontalmente.']]},
{id:'sd-2',topic:'sysdesign',title:'System design 2: caching',mins:12,html:String.raw`
<h3>Dove si mette una cache</h3><p>Browser → CDN (contenuti statici, file) → cache applicativa (Redis/Memcached) → cache del database.</p>
<h3>Strategie</h3><table><tr><th>Pattern</th><th>Come funziona</th><th>Nota</th></tr>
<tr><td>Cache-aside (lazy)</td><td>L'app legge dalla cache; se manca, legge il DB e popola la cache.</td><td>Il più comune; primo accesso lento.</td></tr>
<tr><td>Write-through</td><td>Scrivi su cache e DB insieme.</td><td>Cache sempre aggiornata, scritture più lente.</td></tr>
<tr><td>Write-behind</td><td>Scrivi in cache, il DB è aggiornato dopo.</td><td>Veloce, rischio di perdita dati.</td></tr></table>
<pre>async Task&lt;Product&gt; GetProduct(int id) {
    var cached = await cache.GetAsync&lt;Product&gt;($"product:{id}");
    if (cached != null) return cached;
    var p = await db.Products.FindAsync(id);
    await cache.SetAsync($"product:{id}", p, TimeSpan.FromMinutes(10)); // TTL
    return p;
}</pre>
<h3>Invalidazione</h3><ul><li><b>TTL</b>: semplice, accetta dati vecchi per un tempo limitato.</li><li>Invalidazione esplicita alla scrittura (cancella la chiave).</li><li><b>Cache stampede</b>: alla scadenza molte richieste colpiscono il DB insieme → lock/single-flight, TTL con jitter.</li><li>Eviction: <b>LRU</b> (rimuove l'elemento usato meno di recente).</li></ul>
<p>Regola pratica: prima <b>misura</b>. Una cache aggiunge complessità e un nuovo modo di avere dati inconsistenti.</p>`,
cards:[['Cache-aside','L\u2019app cerca in cache; in caso di miss legge dal DB e popola la cache.'],['Cache stampede','Molte richieste ricostruiscono insieme una chiave scaduta: usa lock o TTL con jitter.'],['LRU','Eviction dell\u2019elemento usato meno di recente.'],['Write-behind: rischio','Perdita di dati se la cache cade prima della scrittura sul DB.']],
check:[['Strategia di cache più comune per letture?',['Write-behind','Cache-aside','Read-never','Two-phase commit'],1,'Popolata pigramente al primo miss.'],['Alla scadenza della chiave più popolare il DB va in crisi. Fenomeno?',['Replication lag','Cache stampede','Split brain','Deadlock'],1,'Si mitiga con single-flight e jitter.']]},
{id:'sd-3',topic:'sysdesign',title:'System design 3: code e messaggi',mins:12,html:String.raw`
<h3>Perché una coda</h3><ul><li><b>Disaccoppiare</b> produttore e consumatore (se il consumatore è giù, i messaggi aspettano).</li><li><b>Livellare i picchi</b>: i worker smaltiscono al loro ritmo.</li><li>Lavori lunghi in <b>background</b> (elaborazione immagini, email).</li></ul>
<p>Esempi: RabbitMQ, Azure Service Bus, Amazon SQS (code); Kafka (log distribuito, replay, alto throughput, ordine per partizione).</p>
<h3>Garanzie di consegna</h3><ul><li><b>At-most-once</b>: può perdere messaggi.</li><li><b>At-least-once</b> (la più comune): può <b>duplicare</b> → i consumer devono essere <b>idempotenti</b> (es. tabella dei messaggi già processati, upsert).</li><li><b>Exactly-once</b> end-to-end è difficile: in pratica at-least-once + idempotenza.</li></ul>
<h3>Outbox pattern</h3><p>Problema: salvi l'ordine nel DB e pubblichi l'evento; se crash in mezzo, sono inconsistenti. Soluzione: nella <b>stessa transazione</b> scrivi l'ordine e una riga nella tabella <code>Outbox</code>; un processo separato legge l'outbox e pubblica.</p>
<pre>BEGIN TRAN;
  INSERT INTO Orders (...) VALUES (...);
  INSERT INTO Outbox (Type, Payload) VALUES ('OrderCreated', @json);
COMMIT;   -- un relay pubblica poi le righe di Outbox sul broker</pre>
<h3>Altri concetti</h3><ul><li><b>Dead-letter queue</b>: messaggi che falliscono dopo N tentativi.</li><li><b>Back-pressure</b>: rallentare i produttori quando i consumatori non reggono.</li><li>Fan-out pub/sub: un evento, molti abbonati (notifiche, analytics, ricerca).</li></ul>`,
cards:[['At-least-once implica…','Possibili duplicati: consumer idempotenti.'],['Outbox pattern','Scrivi dato + evento nella stessa transazione; un relay pubblica gli eventi.'],['Dead-letter queue','Coda dove finiscono i messaggi falliti dopo N tentativi.'],['Quando Kafka invece di una coda classica?','Alto throughput, replay degli eventi, ordine per partizione, più consumer group.']],
check:[['Il consumer può ricevere lo stesso messaggio due volte. Cosa fai?',['Niente','Lo rendo idempotente','Uso solo HTTP','Disattivo i retry'],1,'Con at-least-once i duplicati sono normali.'],['Problema risolto dall\u2019outbox pattern?',['Latenza di rete','Scrittura DB ed evento non atomiche','Cache stampede','Sharding'],1,'Garantisce che l\u2019evento sia pubblicato se il dato è salvato.']]},
{id:'sd-4',topic:'sysdesign',title:'System design 4: sharding, replicazione e consistenza',mins:15,html:String.raw`
<h3>Replicazione</h3><p>Copie dei dati su più nodi per disponibilità e letture. <b>Leader-follower</b>: scritture sul leader, letture anche sui follower (lag). Replicazione sincrona = più sicura ma più lenta.</p>
<h3>Sharding (partizionamento)</h3><p>Dividi i dati su più database in base a una <b>chiave di partizione</b>.</p><ul><li><b>Per range</b> (es. date): query per intervallo facili, rischio <b>hot spot</b> (tutti scrivono "oggi").</li><li><b>Per hash</b>: distribuzione uniforme, query per range difficili.</li><li><b>Consistent hashing</b>: aggiungendo un nodo si spostano solo ~1/N chiavi invece di quasi tutte.</li><li>Scegli una chiave che compare nella maggior parte delle query (es. <code>user_id</code>), così una richiesta tocca un solo shard.</li></ul>
<h3>Teorema CAP</h3><p>In presenza di una <b>partizione di rete</b> (P) devi scegliere tra <b>consistenza</b> (C: tutti vedono l'ultimo dato, a costo di rifiutare richieste) e <b>disponibilità</b> (A: rispondi sempre, magari con dati vecchi). PACELC aggiunge: anche senza partizioni c'è un trade-off tra latenza e consistenza.</p>
<h3>Modelli di consistenza</h3><ul><li><b>Forte</b>: ogni lettura vede l'ultima scrittura (saldo bancario).</li><li><b>Eventuale</b>: le repliche convergono col tempo (contatore di like, feed).</li><li><b>Read-your-writes</b>: almeno l'utente vede subito le proprie modifiche (es. leggi dal leader per qualche secondo dopo una scrittura).</li></ul>
<h3>Sincronizzazione offline (es. app di note)</h3><p>Più dispositivi modificano la stessa nota offline → conflitti. Strategie: last-write-wins (semplice, perde dati), versioni + merge, CRDT o operational transform per l'editing collaborativo.</p>`,
cards:[['CAP in una frase','Durante una partizione di rete scegli tra consistenza e disponibilità.'],['Consistent hashing: vantaggio','Aggiungere/togliere un nodo sposta solo ~1/N delle chiavi.'],['Hot spot nello sharding','Uno shard riceve troppo traffico (es. chiave per data).'],['Read-your-writes','L\u2019utente vede sempre le proprie scritture.'],['Last-write-wins: difetto','Può perdere modifiche concorrenti.']],
check:[['Contatore di like: modello di consistenza adeguato?',['Forte','Eventuale','Nessuno','Transazioni distribuite'],1,'Piccoli ritardi sono accettabili.'],['Sharding per data di creazione degli ordini: rischio?',['Nessuno','Hot spot sullo shard più recente','Perdita dei dati','Join impossibili'],1,'Tutte le scritture vanno sullo shard di oggi.']]},
{id:'sd-5',topic:'sysdesign',title:'System design 5: rate limiting e resilienza',mins:12,html:String.raw`
<h3>Rate limiting: algoritmi</h3><table><tr><th>Algoritmo</th><th>Idea</th><th>Pro/contro</th></tr>
<tr><td>Fixed window</td><td>Contatore per minuto</td><td>Semplice; picchi doppi al confine della finestra.</td></tr>
<tr><td>Sliding window log/counter</td><td>Finestra mobile</td><td>Preciso; più memoria/calcolo.</td></tr>
<tr><td><b>Token bucket</b></td><td>Secchio di capacità B che si riempie a r token/s; ogni richiesta consuma un token</td><td>Permette burst controllati; molto usato.</td></tr>
<tr><td>Leaky bucket</td><td>Coda svuotata a ritmo costante</td><td>Output regolare.</td></tr></table>
<pre>class TokenBucket:
    def __init__(self, capacity, rate):
        self.capacity, self.rate = capacity, rate
        self.tokens, self.last = capacity, time.monotonic()
    def allow(self):
        now = time.monotonic()
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False   # → HTTP 429 Too Many Requests + header Retry-After</pre>
<p>In un sistema distribuito il contatore sta in uno store condiviso (Redis con operazioni atomiche/script Lua) o si accetta un limite approssimato per istanza.</p>
<h3>Resilienza</h3><ul><li><b>Timeout</b> su ogni chiamata remota.</li><li><b>Retry con backoff esponenziale e jitter</b>, solo su errori transitori e operazioni idempotenti.</li><li><b>Circuit breaker</b>: dopo troppi errori smetti di chiamare il servizio per un po' (in .NET: Polly).</li><li><b>Idempotency key</b> per i POST critici (pagamenti): il server ricorda la chiave e non ripete l'operazione.</li><li><b>Bulkhead</b>: isola le risorse così un guasto non si propaga.</li><li><b>Degradazione</b>: se le raccomandazioni non rispondono, mostra la pagina senza.</li></ul>`,
cards:[['Token bucket','Secchio che si riempie a velocità costante; ogni richiesta consuma un token; consente burst.'],['Codice HTTP per rate limit','429 Too Many Requests (+ Retry-After).'],['Perché il jitter nei retry?','Evita che tutti i client riprovino nello stesso istante.'],['Circuit breaker','Dopo troppi errori interrompe le chiamate per un periodo, poi prova a richiudersi.'],['Idempotency key','Chiave inviata dal client per non ripetere due volte un\u2019operazione (pagamenti).']],
check:[['Algoritmo che consente burst controllati?',['Fixed window','Token bucket','Round robin','LRU'],1,'La capacità del secchio definisce il burst.'],['Retry su POST di pagamento senza precauzioni: rischio?',['Nessuno','Doppio addebito','Latenza minore','Cache miss'],1,'Serve una idempotency key.']]},
{id:'simp-1',topic:'simplify',title:'"Simplify relentlessly": giudizio architetturale',mins:10,html:String.raw`
<p>Tra le responsabilità dell'annuncio c'è <i>"Simplify relentlessly"</i>. Nelle domande di design è un criterio di valutazione implicito: la soluzione più semplice che soddisfa i requisiti batte quella più "impressionante".</p>
<h3>Euristiche</h3><ul><li><b>YAGNI</b>: non costruire per esigenze ipotetiche.</li><li><b>Monolite modulare prima dei microservizi</b> per team piccoli/prodotti giovani: i microservizi risolvono problemi organizzativi e di scala, ma costano in operatività, debugging e consistenza.</li><li><b>Usa servizi gestiti</b> (identity, code, DB) invece di costruirli.</li><li><b>Misura prima di ottimizzare</b>: niente cache/sharding senza dati.</li><li><b>Regola del tre</b>: astrai solo quando un pattern si ripete davvero.</li><li><b>Elimina</b> prima di aggiungere: funzionalità, configurazioni, servizi poco usati.</li><li><b>Reversibilità</b>: le decisioni facili da cambiare si prendono in fretta; quelle irreversibili (schema dati, API pubbliche) con più cura.</li></ul>
<h3>Come rispondere a una domanda di giudizio</h3><ol><li>Riformula il vincolo reale (utenti, team, tempi).</li><li>Proponi l'opzione più semplice che funziona.</li><li>Indica il <b>segnale</b> che ti farebbe passare alla soluzione più complessa ("quando superiamo X QPS…").</li></ol>
<pre>"Per 2.000 utenti e un team di 4 farei un monolite modulare in .NET con
SQL Server e un job in background. Se un modulo dovesse scalare in modo
diverso o un team diventasse indipendente, lo estrarrei come servizio."</pre>`,
cards:[['YAGNI','You Aren\u2019t Gonna Need It: non costruire per esigenze ipotetiche.'],['Regola del tre','Astrai solo alla terza ripetizione reale.'],['Struttura di una risposta di giudizio','Vincolo reale → opzione più semplice → segnale per evolvere.'],['Monolite modulare vs microservizi per team piccolo','Monolite modulare: meno costi operativi, estrai servizi quando serve.']],
check:[['Team di 3, MVP, 500 utenti. Architettura?',['20 microservizi su K8s','Monolite modulare con DB gestito','Event sourcing ovunque','Service mesh'],1,'Semplice e sufficiente; si evolve in seguito.'],['La pagina è lenta. Primo passo?',['Aggiungere Redis','Misurare dove si perde tempo','Riscrivere in Rust','Shardare il DB'],1,'Misura prima di ottimizzare.']]},
/* ================= BEHAVIORAL ================= */
{id:'star-1',topic:'star',title:'Il metodo STAR: raccontare esperienze in modo verificabile',mins:12,html:String.raw`
<p>Nei test e colloqui comportamentali valutano tratti come <b>ownership, ambizione, standard elevati e spirito di squadra</b>. Il modo migliore per dimostrarli è raccontare episodi reali con il metodo STAR.</p>
<table><tr><th>Lettera</th><th>Cosa dire</th><th>Peso</th></tr>
<tr><td><b>S</b>ituation</td><td>Contesto in 1–2 frasi: azienda, team, problema.</td><td>~10%</td></tr>
<tr><td><b>T</b>ask</td><td>Il tuo obiettivo o responsabilità specifica.</td><td>~10%</td></tr>
<tr><td><b>A</b>ction</td><td>Cosa hai fatto <b>tu</b>, passo per passo, e perché. Alternative valutate.</td><td>~60%</td></tr>
<tr><td><b>R</b>esult</td><td>Risultato misurabile + cosa hai imparato.</td><td>~20%</td></tr></table>
<h3>Esempio (in inglese, come al colloquio)</h3>
<pre>S: A sample reading club wrote its weekly note by hand. It took about 2 hours.
T: Nobody owned a template. I volunteered.
A: I drafted one reusable note and a checklist, piloted it for a single week,
   then showed the others. A teammate collected the book list; I wrote the
   template and sent that one pilot.
R: Prep went from about 2 hours to about 25 minutes. I learned to try one
   week before changing the habit. This story is fictional.</pre>
<h3>"Io" vs "noi": l'onestà conta</h3><p>La guida di Bending Spoons è esplicita: non fanno offerte se emergono risultati esagerati. Separa sempre ciò che hai fatto tu da ciò che ha fatto il team ("A teammate handled X; I did Y"). Aspettati domande di approfondimento: "Cosa avresti fatto diversamente?", "Come hai misurato?".</p>
<h3>Prepara un portafoglio di 5–6 storie</h3><p>Copri: ownership (hai preso in carico qualcosa senza che te lo chiedessero), ambizione/alto standard, lavoro di squadra, conflitto/feedback difficile, fallimento e cosa hai imparato, semplificazione. Una storia può coprire più tratti. Usa lo <b>STAR builder</b> per scriverle e la <b>simulazione</b> per esercitarti a voce.</p>
<h3>Durata</h3><p>2–3 minuti a risposta. Allenati con il timer: troppo corta = superficiale, troppo lunga = perdi l'interlocutore.</p>`,
cards:[['STAR','Situation, Task, Action, Result.'],['Quale parte di STAR pesa di più?','Action (~60%): cosa hai fatto tu e perché.'],['Regola io/noi','Separa sempre il tuo contributo da quello del team; non gonfiare.'],['Durata ideale di una risposta comportamentale','2–3 minuti.'],['Quante storie preparare?','5–6, che coprano ownership, ambizione, team, conflitto, fallimento, semplificazione.']],
check:[['Su quale parte di STAR conviene passare più tempo?',['Situation','Task','Action','Nessuna'],2,'L\u2019intervistatore vuole capire il tuo comportamento.'],['Hai guidato un progetto ma il codice l\u2019ha scritto soprattutto un collega. Come lo racconti?',['"I built it"','Separi chiaramente il tuo ruolo e il suo','Non lo racconti','Dici che l\u2019hai scritto insieme'],1,'Precisione e onestà sui contributi.']]},
{id:'culture-1',topic:'culture',title:'Cosa cerca Bending Spoons: valori e processo',mins:10,html:String.raw`
<p>Questa lezione riassume solo ciò che è pubblicato nell'<a href="https://bndspn.com/process-document" target="_blank" rel="noopener">guida ufficiale per i candidati</a> e nell'<a href="https://jobs.bendingspoons.com/positions/69c3ec6cf2164aed6ede175b" target="_blank" rel="noopener">annuncio Software Engineer</a>. Leggi gli originali prima della candidatura.</p>
<h3>Il processo</h3><ol><li><b>Screening</b> di CV (breve, in inglese, con dati quantitativi) e lettera facoltativa.</li><li><b>Task</b>: problem solving, comportamentali e specifici del ruolo; da 1 a 6 ore in totale su più round; alcuni possono essere sorvegliati (schermo/webcam).</li><li><b>2–3 colloqui</b>: problem solving, comportamentale, tecnico.</li><li><b>Referenze</b>.</li><li><b>Decisione</b> di un comitato di assunzione.</li></ol>
<div class="callout">⚠️ Dopo un esito negativo si può ripresentare la candidatura solo dopo <b>12 mesi</b>. Candidati quando sei pronto.</div>
<h3>Le qualità richieste dall'annuncio</h3><ul><li><b>Reasoning ability</b>: ragionare dai principi primi, strutturare in modo netto, resistere ai bias, attenzione ai dettagli.</li><li><b>Drive</b>: ambizione, ownership, standard elevati.</li><li><b>Team spirit</b>.</li><li><b>Inglese</b> fluente.</li></ul>
<p>Danno più peso al <b>potenziale di lungo periodo</b> e alla <b>velocità di apprendimento</b> che alle competenze attuali: per te significa che le lacune (Python, Kubernetes) non sono un ostacolo se mostri di imparare in fretta.</p>
<h3>Le responsabilità del ruolo</h3><ul><li>Ownership dall'idea alla produzione.</li><li>Usare strumenti AI in design, implementazione, test e documentazione ("Amplify your impact with AI").</li><li>Stack diversi: da monoliti a microservizi, da gRPC a REST, da Docker a Kubernetes, da Python a Rust.</li><li>"Simplify relentlessly".</li></ul>
<h3>Radical Candor</h3><p>Tra i loro documenti di cultura c'è <a href="https://bendingspoons.com/documents/Culture&amp;Policies%E2%80%94RadicalCandor.pdf" target="_blank" rel="noopener">Radical Candor</a>. Il concetto (reso noto da Kim Scott) indica un feedback che <b>tiene alla persona</b> e allo stesso tempo <b>la sfida direttamente</b>. Leggi il documento per capire come lo applicano loro e prepara un esempio di feedback difficile dato o ricevuto. Altri documenti sono su <a href="https://bendingspoons.com/careers" target="_blank" rel="noopener">bendingspoons.com/careers</a>.</p>
<h3>Retribuzione indicata (Europa, fuori Londra)</h3><p>66.065–107.837 € tipica, fino a 240.330 € per profili eccezionali (dati dell'annuncio).</p>`,
cards:[['Fasi della selezione Bending Spoons','CV → task (1–6 h, più round) → 2–3 colloqui → referenze → comitato.'],['Quanto attendere dopo un esito negativo?','12 mesi.'],['Le 4 qualità dell\u2019annuncio','Reasoning ability, drive, team spirit, inglese.'],['Cosa pesa di più: competenze attuali o potenziale?','Potenziale di lungo periodo e velocità di apprendimento.'],['Radical Candor (concetto)','Tenere alla persona e sfidarla direttamente nel feedback.']],
check:[['Quante ore di task in totale indica la guida?',['30 minuti','Da 1 a 6 ore su più round','Un giorno intero','Nessun task'],1,'Da 1 a 6 ore in più round.'],['Chi prende la decisione finale?',['Il recruiter','Il manager','Un comitato di assunzione','Il CEO'],2,'Un hiring committee.']]},
/* ================= REFS ================= */
{id:'refs-1',topic:'refs',title:'Scegliere e preparare le referenze',mins:6,html:String.raw`
<p>Il controllo delle referenze arriva verso la fine del processo. Prepararle ora evita ritardi e sorprese.</p>
<h3>Chi scegliere (2–3 persone)</h3><ul><li>Un <b>responsabile diretto</b> (attuale o passato) che ha valutato il tuo lavoro.</li><li>Un <b>collega senior</b> o tech lead con cui hai lavorato a stretto contatto.</li><li>In alternativa: un cliente tecnico o un docente/relatore se l'esperienza è recente.</li></ul>
<h3>Come prepararle</h3><ol><li>Chiedi il permesso <b>prima</b> di indicarle.</li><li>Ricorda loro 2–3 progetti concreti e i risultati (gli stessi del CV: devono coincidere!).</li><li>Spiega cosa cerca l'azienda: ragionamento, ownership, spirito di squadra.</li><li>Verifica che siano disponibili e a loro agio in inglese, se necessario.</li><li>Ringrazia e aggiornale sull'esito.</li></ol>
<p>Coerenza: se nel CV dici di aver guidato una migrazione, la referenza deve poterlo confermare. È un altro motivo per non gonfiare i risultati.</p>`,
cards:[['Quante referenze preparare?','2–3: un responsabile diretto e un collega senior/tech lead.'],['Primo passo prima di indicare una referenza','Chiedere il permesso.'],['Perché ricordare alle referenze i tuoi progetti?','Perché confermino in modo coerente i risultati del CV.']],
check:[['Quale referenza è più utile?',['Un amico di famiglia','Il tuo responsabile diretto','Un recruiter','Un collega conosciuto da una settimana'],1,'Ha valutato direttamente il tuo lavoro.']]}
];
