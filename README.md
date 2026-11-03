# BS Prep

Sito statico, in italiano, per preparare la selezione **Software Engineer** di Bending Spoons. È pratica nello stile descritto pubblicamente dall’azienda (problem solving, fondamenti, system design, coding, colloquio comportamentale, referenze): non contiene le domande reali dei test.

C’è anche una sezione **Inglese tecnico**: vocabolario di software engineering, system design e dati, false friends e errori tipici di chi parla italiano, messaggi Slack/email, design doc, PR e code review, ragionamento ad alta voce e risposte STAR. Le spiegazioni sono in italiano, il materiale da praticare è in inglese. Nella scheda Speaking si può ascoltare domanda e risposta con la sintesi vocale del browser (Web Speech API): se non c’è, il sito resta usabile e non fa richieste di rete.

I progressi restano nel browser (`localStorage`, chiave `bsprep.v1`): lezioni, punteggi e ripasso spaziato SM-2. Le carte usano id stabili (`L:lezione:indice`, `Q:argomento:indice`, `EX:enx-…`, `SP:ens-…`). Per questo gli aggiornamenti automatici non cancellano né riusano gli id esistenti.

![Inglese tecnico](docs/screenshot-english.png)

![Dashboard](docs/screenshot.png)
![Tema scuro](docs/screenshot-dark.png)
![Mobile](docs/screenshot-mobile.png)

## Uso in locale

Non c’è build. Dalla radice del repository:

```bash
python3 -m http.server 8000
```

Apri [http://127.0.0.1:8000](http://127.0.0.1:8000). Funziona anche aprendo `index.html` direttamente: script, stili e dati sono file locali, e il sito non chiama rete da solo. I link a documenti esterni (processo di selezione, LeetCode, NeetCode) si aprono solo se li clicchi.

Dalla home si vedono la prontezza, il ripasso del giorno e le sezioni, compresa Inglese tecnico. «Ultimo aggiornamento contenuti» è la data dell’ultimo giro dello script mensile (all’inizio, la data del materiale iniziale).

Per rifare i test locali:

```bash
node scripts/test-update.mjs
node scripts/test-sync-merge.mjs
node scripts/test-worker.mjs
```

In `sync-config.js` il client id e l’URL del Worker ci sono già: `https://bs-prep-oauth.nicolas-gentilucci.workers.dev`. «Accedi» compare dopo il deploy di Pages. Lo scambio del token funziona solo dopo aver impostato il secret sul Worker.

## GitHub Pages

Il workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) pubblica il sito con le action ufficiali `configure-pages`, `upload-pages-artifact` e `deploy-pages`. Parte a ogni push su `main` e si può lanciare a mano (Actions → **Deploy GitHub Pages** → Run workflow).

### Cosa configurare (una volta)

1. **Secret del modello.** Settings → Secrets and variables → Actions → New repository secret.
   - Nome: `LLM_API_KEY`
   - Valore: la chiave di un’API chat completions compatibile con OpenAI.
2. **Variabili opzionali** (Settings → Secrets and variables → Actions → Variables, non Secrets):
   - `LLM_BASE_URL` — default `https://api.openai.com/v1` (senza barra finale; lo script accetta anche la barra).
   - `LLM_MODEL` — default `gpt-4o-mini`.
3. **Pages.** Settings → Pages → Build and deployment → Source: **GitHub Actions**. Salva. Poi, se il primo deploy è fallito perché Pages non era ancora attivo, rilancia **Deploy GitHub Pages**.

Il sito pubblicato è l’insieme di `index.html`, CSS, JS e dati. Workflow, script e screenshot in `docs/` non vengono caricati.

### Repository privato

GitHub Pages su un repository **privato** richiede **GitHub Pro** o **GitHub Team** (oppure il repository va reso pubblico). Anche con Pro/Team, il sito Pages di un repository privato **è raggiungibile da chiunque abbia l’URL**: l’accesso al codice resta privato, la pagina no.

## Aggiornamento mensile dei contenuti

[`.github/workflows/monthly-update.yml`](.github/workflows/monthly-update.yml) gira il 1° di ogni mese alle 08:00 UTC e si può lanciare a mano: Actions → **Aggiornamento contenuti mensile** → Run workflow.

Lo script [`scripts/update-content.mjs`](scripts/update-content.mjs) (Node, senza dipendenze) chiede al modello di aggiornare nozioni superate e di aggiungere lezioni, carte, quiz, esercizi di inglese e domande di speaking su tecnologie e pratiche di colloquio utili per questa selezione. Poi:

- controlla lo schema JSON;
- rifiuta id già usati, rimozioni, indici fuori posto, HTML pericoloso e crescite assurde;
- esegue `node --check` sui file generati e li ricarica;
- se un controllo fallisce, **non scrive nulla** e il workflow si ferma senza commit;
- se `LLM_API_KEY` manca, scrive un messaggio chiaro ed esce senza errore (nessun commit);
- se c’è materiale nuovo, aggiorna la data «Ultimo aggiornamento contenuti» e il workflow fa commit su `main` con messaggio `chore: aggiornamento contenuti YYYY-MM-DD`.

Un commit fatto con `GITHUB_TOKEN` non rilancia gli altri workflow. Per questo, se il commit c’è, lo stesso workflow chiama il deploy di Pages (`workflow_call`).

Gli id già in uso non si toccano: si aggiungono id nuovi (il modello è istruito a prefissarli con `auto-` e la data) oppure si corregge solo il testo, carte e domande restano allo stesso indice.

## Accesso GitHub (opzionale)

Chiunque abbia un account GitHub può salvare i progressi in un **Gist segreto del proprio account**. Senza accesso il sito funziona tutto in locale, esattamente come prima: lezioni, quiz, ripasso SM-2 ed export/import JSON non dipendono dal login.

Il sito è statico, quindi non può custodire il client secret. Lo scambio `code` → token lo fa un Cloudflare Worker in [`worker/`](worker/). Chiede solo lo scope `gist`, controlla `state` (firmato, a scadenza, senza memorizzarlo) e l’origine CORS. Non scrive log e non tiene il token: lo rimanda al browser, che da lì parla solo con `api.github.com`.

Il token resta in `localStorage` (`bsprep.oauth`), separato dai progressi. In impostazioni è spiegato: serve solo a leggere e scrivere i Gist, ed «Esci» lo cancella. All’accesso il sito cerca o crea `bs-prep-progress.json`, scarica i dati, li unisce a quelli locali (per ogni voce vince il timestamp più recente; una carta SM-2 presente su un solo lato non si perde) e poi riscrive il Gist. I salvataggi partono qualche secondo dopo una modifica, quando la scheda va in secondo piano, e da «Sincronizza ora». Se la rete manca, i progressi restano sul dispositivo e il tentativo si ripete.

Un Gist segreto **non è privato**: non è in elenco sul profilo, ma chi ha il link può leggerlo.

### Configurazione

L’OAuth App c’è già. Il client id `Ov23lia3NGyf7VDiuuJN` è in `sync-config.js` e in `worker/wrangler.toml` (è pubblico). `ALLOWED_ORIGIN` è `https://nicogenti.github.io`: il browser manda quell’origin, senza `/bs-prep/`. Il worker accetta comunque il callback `https://nicogenti.github.io/bs-prep/` e rifiuta gli altri path sullo stesso host.

Manca solo Cloudflare. In ordine:

1. **Account Cloudflare** gratuito, se non c’è già.
2. **API token** con il permesso di modificare i Workers (template «Edit Cloudflare Workers»). Copia anche l’Account ID dalla pagina Workers.
3. **Secret del repository** (Settings → Secrets and variables → Actions), usati solo dal workflow di deploy:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   Se mancano, [`.github/workflows/deploy-worker.yml`](.github/workflows/deploy-worker.yml) scrive un messaggio ed esce senza errore. Parte da solo quando cambia `worker/**`, oppure a mano da Actions → **Deploy Cloudflare Worker**.
4. **Segreto del worker.** Il client id è già una variabile in `wrangler.toml`. Il client secret va solo in Cloudflare: Worker `bs-prep-oauth` → Settings → Variables and Secrets → aggiungi `GITHUB_CLIENT_SECRET`. Non va nel repository e non va chiesto in chat.
5. L’URL del Worker in `sync-config.js` è già `https://bs-prep-oauth.nicolas-gentilucci.workers.dev`. Dopo il deploy di Pages compare «Accedi».

Callback dell’OAuth App, se va ricontrollata: Homepage URL e Authorization callback URL entrambi `https://nicogenti.github.io/bs-prep/`.

La Content-Security-Policy consente script solo dal sito, e le connessioni verso `api.github.com` e `https://*.workers.dev`. Un dominio custom del worker va aggiunto a `connect-src` in `index.html`.
