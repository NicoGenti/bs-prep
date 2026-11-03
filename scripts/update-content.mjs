#!/usr/bin/env node
/**
 * Aggiorna data-lessons.js, data-quiz.js e data-english.js con un modello
 * chat completions compatibile con OpenAI.
 *
 * Non rimuove voci e non riusa gli id esistenti: i progressi SM-2 in
 * localStorage dipendono da quegli id (lezioni, Q:topic:indice, L:lezione:indice,
 * enx-*, ens-*, id dei system design).
 *
 *   LLM_API_KEY          secret obbligatorio (se manca, esce senza errore)
 *   LLM_BASE_URL         default https://api.openai.com/v1
 *   LLM_MODEL            default gpt-4o-mini
 *
 *   node scripts/update-content.mjs [--root dir] [--mock file.json] [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT_FILES = ['data-lessons.js', 'data-quiz.js', 'data-english.js', 'content-meta.js'];
const ID_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;
const URL_RE = /^https:\/\/[^\s"'<>]+$/;
const LIMITS = {
  newTopics: 4,
  newLessons: 8,
  lessonUpdates: 15,
  lessonPatches: 15,
  replacementsPerLesson: 6,
  cardsAppendTotal: 40,
  checksAppendTotal: 24,
  quizAppend: 30,
  quizUpdates: 20,
  behavAppend: 8,
  sdAppend: 4,
  pyAppend: 6,
  bulletAppend: 6,
  checklistAppend: 8,
  algoAppend: 8,
  enExercisesAppend: 20,
  enSpeakAppend: 6,
  maxHtml: 20000,
  minNewHtml: 120,
  maxString: 4000,
  maxFileBytes: 1_500_000,
  maxGrowthRatio: 2.2
};
const FIELDS = new Set([
  'summary', 'lessonPatches', 'lessonUpdates', 'newLessons', 'newTopics',
  'quizUpdates', 'quizAppend', 'behavAppend', 'sdAppend', 'pyAppend',
  'bulletAppend', 'checklistAppend', 'algoAppend', 'enExercisesAppend', 'enSpeakAppend'
]);
const EX_TYPES = new Set(['translate', 'fix', 'concise', 'choice', 'gap']);
const CHECKLISTS = new Set(['cv', 'github', 'refs']);
const DANGEROUS = /<\s*script\b|javascript\s*:|<\s*iframe\b|<\s*object\b|<\s*embed\b|<\s*img\b|<\s*link\b|<\s*meta\b|<\s*style\b|\bon[a-z]+\s*=|url\s*\(/i;

export function loadModel(root) {
  const base = runFile(path.join(root, 'data-lessons.js'));
  const quiz = runFile(path.join(root, 'data-quiz.js'));
  const en = runFile(path.join(root, 'data-english.js'));
  const meta = runFile(path.join(root, 'content-meta.js'));
  for (const [name, value] of [['SECTIONS', base.SECTIONS], ['TOPICS', base.TOPICS], ['LESSONS', base.LESSONS], ['QUIZ', quiz.QUIZ], ['EN_LESSONS', en.EN_LESSONS], ['EN_EX', en.EN_EX], ['EN_SPEAK', en.EN_SPEAK]]) {
    if (value == null) throw new Error('File contenuti incompleto: manca ' + name);
  }
  return {
    sections: base.SECTIONS,
    topics: base.TOPICS,
    lessons: base.LESSONS,
    quiz: quiz.QUIZ,
    behav: quiz.BEHAV_Q,
    traits: quiz.TRAITS,
    sd: quiz.SD_PROMPTS,
    py: quiz.PY_EX,
    algo: quiz.ALGO_TOPICS,
    checklists: quiz.CHECKLISTS,
    bullets: quiz.BULLET_EX,
    enSection: en.EN_SECTION,
    enTopics: en.EN_TOPICS,
    enLessons: en.EN_LESSONS,
    enEx: en.EN_EX,
    enSpeak: en.EN_SPEAK,
    updated: meta.CONTENT_UPDATED || ''
  };
}

function runFile(file) {
  const window = {};
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  return window;
}

export function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
      return true;
    }
    const ak = Object.keys(a), bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (!Object.prototype.hasOwnProperty.call(b, k) || !deepEqual(a[k], b[k])) return false;
    return true;
  }
  return false;
}

function jsString(s) {
  return JSON.stringify(s).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
function isIdent(k) { return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k); }
function emit(value, indent) {
  const pad = '  '.repeat(indent);
  const inner = '  '.repeat(indent + 1);
  if (value === null) return 'null';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Numero non serializzabile');
    return String(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return jsString(value);
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const simple = value.every(v => v === null || ['string', 'number', 'boolean'].includes(typeof v));
    const parts = value.map(v => emit(v, indent + 1));
    const line = '[' + parts.join(', ') + ']';
    if (simple && line.length <= 120) return line;
    return '[\n' + parts.map(p => inner + p).join(',\n') + '\n' + pad + ']';
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value).filter(k => value[k] !== undefined);
    if (!keys.length) return '{}';
    const lines = keys.map(k => inner + (isIdent(k) ? k : jsString(k)) + ': ' + emit(value[k], indent + 1));
    return '{\n' + lines.join(',\n') + '\n' + pad + '}';
  }
  throw new Error('Tipo non serializzabile: ' + typeof value);
}

export function serializeLessons(model) {
  return `/* Contenuti didattici: lezioni, concetti chiave (flashcard) e verifiche di comprensione.
   NB: sono materiali di pratica "nello stile descritto" da Bending Spoons, NON domande reali dei loro test.
   Gli id sono stabili: non rimuoverli e non riusarli. File rigenerabile da scripts/update-content.mjs. */
window.SECTIONS = ${emit(model.sections, 0)};
window.TOPICS = ${emit(model.topics, 0)};
window.LESSONS = ${emit(model.lessons, 0)};
`;
}
export function serializeQuiz(model) {
  return `/* Banche di domande di pratica (NON domande reali di Bending Spoons).
   Formato quiz: [domanda, opzioni, indice corretto, spiegazione].
   Gli indici sono id di ripasso (Q:argomento:indice): si aggiunge solo in coda.
   File rigenerabile da scripts/update-content.mjs. */
window.QUIZ = ${emit(model.quiz, 0)};
window.BEHAV_Q = ${emit(model.behav, 0)};
window.TRAITS = ${emit(model.traits, 0)};
window.SD_PROMPTS = ${emit(model.sd, 0)};
window.PY_EX = ${emit(model.py, 0)};
window.ALGO_TOPICS = ${emit(model.algo, 0)};
window.CHECKLISTS = ${emit(model.checklists, 0)};
window.BULLET_EX = ${emit(model.bullets, 0)};
`;
}
export function serializeEnglish(model) {
  return `/* Inglese tecnico. Spiegazioni in italiano, pratica in inglese.
   Id stabili: lezioni, carte per indice, enx-*, ens-*. Non riusarli.
   File rigenerabile da scripts/update-content.mjs. */
window.EN_SECTION = ${emit(model.enSection, 0)};
window.EN_TOPICS = ${emit(model.enTopics, 0)};
window.EN_LESSONS = ${emit(model.enLessons, 0)};
window.EN_EX = ${emit(model.enEx, 0)};
window.EN_SPEAK = ${emit(model.enSpeak, 0)};

window.SECTIONS = window.SECTIONS || {};
window.SECTIONS.en = window.EN_SECTION;
window.TOPICS = window.TOPICS || {};
Object.assign(window.TOPICS, window.EN_TOPICS);
window.LESSONS = window.LESSONS || [];
window.EN_LESSONS.forEach(function(lesson){
  if(!window.LESSONS.some(function(existing){return existing.id===lesson.id})) window.LESSONS.push(lesson);
});
`;
}
function serializeMeta(date) {
  return `/* Data dell'ultimo aggiornamento dei contenuti didattici (YYYY-MM-DD). La aggiorna scripts/update-content.mjs. */
window.CONTENT_UPDATED = ${jsString(date)};
`;
}

function dangerous(s, where, errors) {
  if (typeof s !== 'string') return;
  if (DANGEROUS.test(s)) errors.push(where + ': HTML non consentito (script, iframe, immagini esterne, handler)');
}

function str(value, where, errors, min, max) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) {
    errors.push(where + `: attesa una stringa di ${min}–${max} caratteri`);
    return '';
  }
  dangerous(value, where, errors);
  return value;
}

function optionsOf(value, where, errors) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 6) {
    errors.push(where + ': servono da 2 a 6 opzioni');
    return [];
  }
  value.forEach((o, i) => str(o, where + '.options[' + i + ']', errors, 1, 400));
  return value;
}

function answerIndex(value, options, where, errors) {
  if (!Number.isInteger(value) || value < 0 || value >= options.length) errors.push(where + ': indice risposta fuori range');
}

export function validateAndApply(before, payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { errors: ['La risposta del modello non è un oggetto JSON'] };
  }
  for (const k of Object.keys(payload)) if (!FIELDS.has(k)) errors.push('Campo non ammesso: ' + k);
  if (typeof payload.summary !== 'string' || !payload.summary.trim() || payload.summary.length > 800) {
    errors.push('summary: descrizione breve obbligatoria (max 800 caratteri)');
  } else dangerous(payload.summary, 'summary', errors);

  const take = (key, max) => {
    if (payload[key] == null) return [];
    if (!Array.isArray(payload[key])) { errors.push(key + ' deve essere un array'); return []; }
    if (payload[key].length > max) errors.push(key + ' supera il limite di ' + max);
    return payload[key];
  };
  const newTopics = take('newTopics', LIMITS.newTopics);
  const lessonPatches = take('lessonPatches', LIMITS.lessonPatches);
  const lessonUpdates = take('lessonUpdates', LIMITS.lessonUpdates);
  const newLessons = take('newLessons', LIMITS.newLessons);
  const quizUpdates = take('quizUpdates', LIMITS.quizUpdates);
  const quizAppend = take('quizAppend', LIMITS.quizAppend);
  const behavAppend = take('behavAppend', LIMITS.behavAppend);
  const sdAppend = take('sdAppend', LIMITS.sdAppend);
  const pyAppend = take('pyAppend', LIMITS.pyAppend);
  const bulletAppend = take('bulletAppend', LIMITS.bulletAppend);
  const checklistAppend = take('checklistAppend', LIMITS.checklistAppend);
  const algoAppend = take('algoAppend', LIMITS.algoAppend);
  const enExercisesAppend = take('enExercisesAppend', LIMITS.enExercisesAppend);
  const enSpeakAppend = take('enSpeakAppend', LIMITS.enSpeakAppend);

  const model = structuredClone(before);
  const lessonIds = new Set([...model.lessons, ...model.enLessons].map(l => l.id));
  const exIds = new Set(model.enEx.map(e => e.id));
  const speakIds = new Set(model.enSpeak.map(s => s.id));
  const sdIds = new Set(model.sd.map(p => p.id));
  const algoUrls = new Set(model.algo.flatMap(g => (g[1] || []).map(p => p[1])));

  const sectionNames = new Set([...Object.keys(model.sections), 'en']);
  for (const t of newTopics) {
    if (!t || typeof t !== 'object') { errors.push('newTopics: elemento non oggetto'); continue; }
    if (!ID_RE.test(t.id || '') || model.topics[t.id] || model.enTopics[t.id]) errors.push('newTopics: id mancante, illegale o già usato (' + t.id + ')');
    str(t.label, 'newTopics.' + t.id + '.label', errors, 2, 80);
    if (!sectionNames.has(t.section)) errors.push('newTopics: sezione inesistente ' + t.section);
    if (errors.length) continue;
  }
  if (errors.length) return { errors };
  for (const t of newTopics) {
    const row = { label: t.label, section: t.section };
    if (t.section === 'en') model.enTopics[t.id] = row;
    else model.topics[t.id] = row;
  }
  const topicSection = id => model.topics[id]?.section || model.enTopics[id]?.section || null;
  const findLesson = id => model.lessons.find(l => l.id === id) || model.enLessons.find(l => l.id === id) || null;

  let cardAdds = 0;
  let checkAdds = 0;
  for (const p of lessonPatches) {
    const lesson = p && findLesson(p.id);
    if (!lesson) { errors.push('lessonPatches: lezione inesistente ' + (p && p.id)); continue; }
    const reps = Array.isArray(p.htmlReplacements) ? p.htmlReplacements : null;
    if (!reps || reps.length > LIMITS.replacementsPerLesson) { errors.push('lessonPatches.' + p.id + ': htmlReplacements assente o troppo lungo'); continue; }
    let html = lesson.html;
    const original = html;
    for (const r of reps) {
      const find = r && r.find;
      const replace = r && r.replace;
      if (typeof find !== 'string' || find.length < 8 || find.length > 500) { errors.push('lessonPatches.' + p.id + ': find deve essere 8–500 caratteri'); continue; }
      str(replace, 'lessonPatches.' + p.id + '.replace', errors, 1, LIMITS.maxHtml);
      const n = html.split(find).length - 1;
      if (n !== 1) errors.push('lessonPatches.' + p.id + ': il testo da sostituire compare ' + n + ' volte (ne serve una)');
      else html = html.replace(find, replace);
    }
    if (html.length < original.length * 0.6) errors.push('lessonPatches.' + p.id + ': la lezione si accorcia troppo');
    if (html.length > LIMITS.maxHtml) errors.push('lessonPatches.' + p.id + ': HTML troppo lungo');
    if (!errors.length) lesson.html = html;
  }

  for (const u of lessonUpdates) {
    const lesson = u && findLesson(u.id);
    if (!lesson) { errors.push('lessonUpdates: lezione inesistente ' + (u && u.id)); continue; }
    if (u.title != null) lesson.title = str(u.title, 'lessonUpdates.' + u.id + '.title', errors, 8, 140) || lesson.title;
    if (u.mins != null) {
      if (!Number.isInteger(u.mins) || u.mins < 3 || u.mins > 45) errors.push('lessonUpdates.' + u.id + ': mins fra 3 e 45');
      else lesson.mins = u.mins;
    }
    for (const c of u.cardUpdates || []) {
      if (!lesson.cards || !Number.isInteger(c.index) || c.index < 0 || c.index >= lesson.cards.length) errors.push('lessonUpdates.' + u.id + ': indice carta invalido');
      else {
        const front = str(c.front, 'card.front', errors, 1, 500);
        const back = str(c.back, 'card.back', errors, 1, 800);
        if (front && back) lesson.cards[c.index] = [front, back];
      }
    }
    for (const c of u.checkUpdates || []) {
      if (!lesson.check || !Number.isInteger(c.index) || c.index < 0 || c.index >= lesson.check.length) errors.push('lessonUpdates.' + u.id + ': indice verifica invalido');
      else {
        const q = str(c.question, 'check.question', errors, 4, 400);
        const opts = optionsOf(c.options, 'check.' + u.id, errors);
        answerIndex(c.answer, opts, 'check.' + u.id, errors);
        const expl = str(c.explanation, 'check.explanation', errors, 4, 600);
        if (q && opts.length && expl) lesson.check[c.index] = [q, opts, c.answer, expl];
      }
    }
    const appendCards = u.cardsAppend || [];
    const appendChecks = u.checksAppend || [];
    if (!Array.isArray(appendCards) || !Array.isArray(appendChecks)) errors.push('lessonUpdates.' + u.id + ': append non è un array');
    cardAdds += appendCards.length;
    checkAdds += appendChecks.length;
    if (!lesson.cards) lesson.cards = [];
    if (!lesson.check) lesson.check = [];
    for (const card of appendCards) {
      if (!Array.isArray(card) || card.length !== 2) errors.push('cardsAppend: carta [fronte, retro]');
      else {
        const front = str(card[0], 'cardsAppend.front', errors, 1, 500);
        const back = str(card[1], 'cardsAppend.back', errors, 1, 800);
        if (front && back) lesson.cards.push([front, back]);
      }
    }
    for (const check of appendChecks) {
      if (!Array.isArray(check) || check.length !== 4) errors.push('checksAppend: [domanda, opzioni, indice, spiegazione]');
      else {
        const q = str(check[0], 'checksAppend.q', errors, 4, 400);
        const opts = optionsOf(check[1], 'checksAppend', errors);
        answerIndex(check[2], opts, 'checksAppend', errors);
        const expl = str(check[3], 'checksAppend.expl', errors, 4, 600);
        if (q && opts.length && expl) lesson.check.push([q, opts, check[2], expl]);
      }
    }
  }
  if (cardAdds > LIMITS.cardsAppendTotal) errors.push('Troppe carte aggiunte in un solo giro');
  if (checkAdds > LIMITS.checksAppendTotal) errors.push('Troppe verifiche aggiunte in un solo giro');

  for (const l of newLessons) {
    if (!l || typeof l !== 'object') { errors.push('newLessons: elemento non oggetto'); continue; }
    if (!ID_RE.test(l.id || '') || lessonIds.has(l.id)) errors.push('newLessons: id mancante, illegale o già usato (' + l.id + ')');
    else lessonIds.add(l.id);
    if (!topicSection(l.topic)) errors.push('newLessons.' + l.id + ': topic inesistente ' + l.topic);
    const title = str(l.title, 'newLessons.title', errors, 8, 140);
    if (!Number.isInteger(l.mins) || l.mins < 3 || l.mins > 45) errors.push('newLessons.' + l.id + ': mins fra 3 e 45');
    const html = str(l.html, 'newLessons.html', errors, LIMITS.minNewHtml, LIMITS.maxHtml);
    if (!Array.isArray(l.cards) || l.cards.length < 1 || l.cards.length > 20) errors.push('newLessons.' + l.id + ': da 1 a 20 carte');
    if (!Array.isArray(l.check) || l.check.length < 1 || l.check.length > 8) errors.push('newLessons.' + l.id + ': da 1 a 8 verifiche');
    const cards = [];
    const checks = [];
    for (const card of l.cards || []) {
      if (!Array.isArray(card) || card.length !== 2) errors.push('newLessons.cards');
      else {
        const front = str(card[0], 'new.card.front', errors, 1, 500);
        const back = str(card[1], 'new.card.back', errors, 1, 800);
        if (front && back) cards.push([front, back]);
      }
    }
    for (const check of l.check || []) {
      if (!Array.isArray(check) || check.length !== 4) errors.push('newLessons.check');
      else {
        const q = str(check[0], 'new.check.q', errors, 4, 400);
        const opts = optionsOf(check[1], 'new.check', errors);
        answerIndex(check[2], opts, 'new.check', errors);
        const expl = str(check[3], 'new.check.expl', errors, 4, 600);
        if (q && opts.length && expl) checks.push([q, opts, check[2], expl]);
      }
    }
    if (errors.length) continue;
    const row = { id: l.id, topic: l.topic, title, mins: l.mins, html, cards, check: checks };
    if (topicSection(l.topic) === 'en') model.enLessons.push(row);
    else model.lessons.push(row);
  }

  const quizTuple = (q, where) => {
    const question = str(q.question, where + '.question', errors, 8, 400);
    const opts = optionsOf(q.options, where, errors);
    answerIndex(q.answer, opts, where, errors);
    const expl = str(q.explanation, where + '.explanation', errors, 4, 800);
    return question && opts.length && expl ? [question, opts, q.answer, expl] : null;
  };
  for (const q of quizUpdates) {
    const arr = q && model.quiz[q.topic];
    if (!arr || !Number.isInteger(q.index) || q.index < 0 || q.index >= arr.length) errors.push('quizUpdates: topic o indice invalido');
    else {
      const row = quizTuple(q, 'quizUpdates');
      if (row) arr[q.index] = row;
    }
  }
  for (const q of quizAppend) {
    const arr = q && model.quiz[q.topic];
    if (!arr) errors.push('quizAppend: topic senza banca esistente (' + (q && q.topic) + ')');
    else {
      const row = quizTuple(q, 'quizAppend');
      if (row) arr.push(row);
    }
  }
  for (const q of behavAppend) {
    if (!q || !Object.prototype.hasOwnProperty.call(model.traits, q.trait)) errors.push('behavAppend: tratto inesistente');
    else {
      const question = str(q.question, 'behavAppend', errors, 12, 400);
      if (question) model.behav.push([q.trait, question]);
    }
  }
  for (const p of sdAppend) {
    if (!p || !ID_RE.test(p.id || '') || sdIds.has(p.id)) errors.push('sdAppend: id mancante o già usato');
    else sdIds.add(p.id);
    const title = str(p && p.title, 'sd.title', errors, 4, 140);
    const brief = str(p && p.brief, 'sd.brief', errors, 20, 800);
    const outline = str(p && p.outline, 'sd.outline', errors, 40, 8000);
    if (title && brief && outline) model.sd.push({ id: p.id, title, brief, outline });
  }
  for (const p of pyAppend) {
    const t = str(p && p.t, 'py.t', errors, 3, 80);
    const d = str(p && p.d, 'py.d', errors, 12, 600);
    const s = str(p && p.s, 'py.s', errors, 8, 4000);
    if (t && d && s) model.py.push({ t, d, s });
  }
  for (const b of bulletAppend) {
    const weak = str(b && b.weak, 'bullet.weak', errors, 8, 300);
    const strong = str(b && b.strong, 'bullet.strong', errors, 12, 400);
    if (weak && strong) model.bullets.push([weak, strong]);
  }
  for (const c of checklistAppend) {
    if (!c || !CHECKLISTS.has(c.list) || !model.checklists[c.list]) errors.push('checklistAppend: lista inesistente');
    else {
      const item = str(c.item, 'checklist', errors, 8, 240);
      if (item) model.checklists[c.list].push(item);
    }
  }
  for (const a of algoAppend) {
    const name = str(a && a.name, 'algo.name', errors, 3, 120);
    if (!a || typeof a.url !== 'string' || !URL_RE.test(a.url) || algoUrls.has(a.url)) errors.push('algoAppend: URL https mancante o già presente');
    else algoUrls.add(a.url);
    const group = str(a && a.group, 'algo.group', errors, 3, 80);
    if (!name || !group || !URL_RE.test(a.url || '')) continue;
    let bucket = model.algo.find(g => g[0] === group);
    if (!bucket) { bucket = [group, []]; model.algo.push(bucket); }
    bucket[1].push([name, a.url]);
  }

  const knownLessons = new Set([...model.lessons, ...model.enLessons].map(l => l.id));
  for (const e of enExercisesAppend) {
    if (!e || !ID_RE.test(e.id || '') || exIds.has(e.id)) errors.push('enExercisesAppend: id mancante o già usato (' + (e && e.id) + ')');
    else exIds.add(e.id);
    if (!EX_TYPES.has(e.type)) errors.push('enExercisesAppend: type invalido');
    if (topicSection(e.topic) !== 'en') errors.push('enExercisesAppend: il topic deve essere della sezione inglese');
    if (!knownLessons.has(e.lesson)) errors.push('enExercisesAppend: lezione inesistente ' + (e && e.lesson));
    const prompt = str(e.prompt, 'enEx.prompt', errors, 8, 1200);
    const explanation = str(e.explanation, 'enEx.explanation', errors, 8, 800);
    if (e.type === 'choice' || e.type === 'gap') {
      const opts = optionsOf(e.options, 'enEx.' + (e && e.id), errors);
      answerIndex(e.answer, opts, 'enEx.' + (e && e.id), errors);
      if (prompt && explanation && opts.length && !errors.some(x => x.startsWith('enEx') || x.startsWith('enExercisesAppend: id'))) {
        model.enEx.push({ id: e.id, type: e.type, topic: e.topic, lesson: e.lesson, prompt, options: opts, answer: e.answer, explanation });
      }
    } else {
      const answer = str(e.answer, 'enEx.answer', errors, 2, 2000);
      if (prompt && explanation && answer) model.enEx.push({ id: e.id, type: e.type, topic: e.topic, lesson: e.lesson, prompt, answer, explanation });
    }
  }
  for (const s of enSpeakAppend) {
    if (!s || !ID_RE.test(s.id || '') || speakIds.has(s.id)) errors.push('enSpeakAppend: id mancante o già usato');
    else speakIds.add(s.id);
    const kind = str(s && s.kind, 'speak.kind', errors, 3, 40);
    const question = str(s && s.question, 'speak.question', errors, 12, 400);
    const sample = str(s && s.sample, 'speak.sample', errors, 40, 2500);
    const coaching = str(s && s.coaching, 'speak.coaching', errors, 12, 600);
    const notes = str(s && s.notes, 'speak.notes', errors, 12, 600);
    if (kind && question && sample && coaching && notes) model.enSpeak.push({ id: s.id, kind, question, sample, coaching, notes, lesson: 'en-speak-star' });
  }

  if (errors.length) return { errors };
  try { assertStable(before, model); }
  catch (e) { return { errors: [e.message] }; }
  return { errors: [], model };
}

export function countItems(model) {
  const lessons = [...model.lessons, ...model.enLessons];
  return lessons.length
    + lessons.reduce((n, l) => n + (l.cards?.length || 0) + (l.check?.length || 0), 0)
    + Object.values(model.quiz).reduce((n, a) => n + a.length, 0)
    + model.behav.length + model.sd.length + model.py.length + model.bullets.length
    + model.algo.reduce((n, g) => n + g[1].length, 0)
    + Object.values(model.checklists).reduce((n, a) => n + a.length, 0)
    + model.enEx.length + model.enSpeak.length;
}

export function assertStable(before, after) {
  const errors = [];
  const bLessons = [...before.lessons, ...before.enLessons];
  const aLessons = [...after.lessons, ...after.enLessons];
  const bIds = bLessons.map(l => l.id);
  const aIds = aLessons.map(l => l.id);
  if (new Set(aIds).size !== aIds.length) errors.push('Id lezione duplicato');
  for (const id of bIds) if (!aIds.includes(id)) errors.push('Lezione rimossa: ' + id);
  for (let i = 0; i < before.lessons.length; i++) if (after.lessons[i]?.id !== before.lessons[i].id) { errors.push('Ordine lezioni base spostato all’indice ' + i); break; }
  for (let i = 0; i < before.enLessons.length; i++) if (after.enLessons[i]?.id !== before.enLessons[i].id) { errors.push('Ordine lezioni di inglese spostato all’indice ' + i); break; }
  const byId = new Map(aLessons.map(l => [l.id, l]));
  for (const old of bLessons) {
    const now = byId.get(old.id);
    if (!now) continue;
    if (now.topic !== old.topic) errors.push('Topic cambiato per ' + old.id);
    if ((now.cards || []).length < (old.cards || []).length) errors.push('Carte rimosse da ' + old.id);
    if ((now.check || []).length < (old.check || []).length) errors.push('Verifiche rimosse da ' + old.id);
  }
  for (const id of aIds) if (!bIds.includes(id) && !ID_RE.test(id)) errors.push('Nuovo id lezione illegale: ' + id);
  for (const topic of Object.keys(before.quiz)) {
    if (!after.quiz[topic]) errors.push('Banca quiz rimossa: ' + topic);
    else if (after.quiz[topic].length < before.quiz[topic].length) errors.push('Domande quiz rimosse: ' + topic);
  }
  for (const topic of Object.keys(after.quiz)) if (!before.quiz[topic]) errors.push('Banca quiz nuova non prevista: ' + topic);
  if (after.behav.length < before.behav.length) errors.push('Domande comportamentali rimosse');
  if (after.py.length < before.py.length) errors.push('Esercizi Python rimossi');
  if (after.bullets.length < before.bullets.length) errors.push('Bullet rimossi');
  const bSd = before.sd.map(p => p.id);
  const aSd = after.sd.map(p => p.id);
  for (const id of bSd) if (!aSd.includes(id)) errors.push('System design rimosso: ' + id);
  for (let i = 0; i < bSd.length; i++) if (aSd[i] !== bSd[i]) { errors.push('Ordine system design spostato'); break; }
  for (const list of Object.keys(before.checklists)) {
    if (!after.checklists[list] || after.checklists[list].length < before.checklists[list].length) errors.push('Checklist accorciata: ' + list);
  }
  const bUrls = before.algo.flatMap(g => g[1].map(p => p[1]));
  const aUrls = after.algo.flatMap(g => g[1].map(p => p[1]));
  for (const u of bUrls) if (!aUrls.includes(u)) errors.push('Problema di algoritmi rimosso: ' + u);
  const bEx = before.enEx.map(e => e.id);
  const aEx = after.enEx.map(e => e.id);
  if (new Set(aEx).size !== aEx.length) errors.push('Id esercizio inglese duplicato');
  for (const id of bEx) if (!aEx.includes(id)) errors.push('Esercizio inglese rimosso: ' + id);
  for (let i = 0; i < bEx.length; i++) if (aEx[i] !== bEx[i]) { errors.push('Ordine esercizi inglese spostato'); break; }
  const bSp = before.enSpeak.map(s => s.id);
  const aSp = after.enSpeak.map(s => s.id);
  if (new Set(aSp).size !== aSp.length) errors.push('Id speaking duplicato');
  for (const id of bSp) if (!aSp.includes(id)) errors.push('Speaking rimosso: ' + id);
  for (let i = 0; i < bSp.length; i++) if (aSp[i] !== bSp[i]) { errors.push('Ordine speaking spostato'); break; }
  for (const topic of Object.keys(before.topics)) if (!after.topics[topic]) errors.push('Topic rimosso: ' + topic);
  for (const topic of Object.keys(before.enTopics)) if (!after.enTopics[topic]) errors.push('Topic inglese rimosso: ' + topic);
  const bCount = countItems(before);
  const aCount = countItems(after);
  if (aCount < bCount * 0.98) errors.push('Rimosso più di una piccola frazione di voci (' + bCount + ' → ' + aCount + ')');
  if (bCount - aCount > Math.max(3, Math.floor(bCount * 0.02))) errors.push('Rimozioni sopra la soglia di sicurezza');
  if (errors.length) throw new Error(errors.join('\n'));
}

function catalog(model) {
  const lessons = [...model.lessons, ...model.enLessons].map(l => ({
    id: l.id, topic: l.topic, title: l.title, cards: (l.cards || []).length, checks: (l.check || []).length,
    cardFronts: (l.cards || []).map(c => c[0])
  }));
  const quiz = {};
  for (const [topic, rows] of Object.entries(model.quiz)) quiz[topic] = rows.map((q, i) => ({ i, q: q[0] }));
  return {
    today: new Date().toISOString().slice(0, 10),
    sections: model.sections,
    enSection: model.enSection,
    topics: { ...model.topics, ...model.enTopics },
    lessons,
    quiz,
    traits: model.traits,
    systemDesign: model.sd.map(p => ({ id: p.id, title: p.title })),
    pythonExercises: model.py.map(p => p.t),
    englishExercises: model.enEx.map(e => ({ id: e.id, type: e.type })),
    speaking: model.enSpeak.map(s => s.id)
  };
}

const SYSTEM = `Sei il curatore di BS Prep, un sito statico in italiano per preparare la selezione Software Engineer di Bending Spoons (problem solving, fondamenti di informatica, system design, coding, comportamentale, inglese tecnico di lavoro).
Rispondi SOLO con un oggetto JSON, senza markdown.
Regole:
- Testi didattici in italiano. Negli esercizi di inglese la consegna e la spiegazione sono in italiano; frasi da praticare, opzioni e risposte modello sono in inglese.
- NON riusare e NON modificare gli id esistenti. NON eliminare voci. Puoi solo aggiungere id nuovi oppure correggere il testo di una voce esistente (stesso id, stesso indice).
- Gli id nuovi corrispondono a /^[a-z0-9][a-z0-9-]{0,80}$/ e iniziano con auto- più la data (es. auto-2026-12-01-cache).
- Per le lezioni esistenti preferisci cardsAppend / checksAppend. Usa lessonPatches solo se "find" è una citazione esatta e unica (almeno 8 caratteri) già presente nell'HTML. Se non sei sicuro, ometti la patch.
- quizAppend aggiunge in coda a una banca GIÀ presente (python, k8s, grpc, docker, sysdesign, simplify). Non creare topic di quiz nuovi.
- enExercisesAppend: type è translate | fix | concise | choice | gap. choice e gap hanno options (array) e answer (indice). Gli altri hanno answer (stringa). topic è un topic della sezione en. lesson è un id lezione esistente o creato in questo JSON.
- Aggiorna nozioni superate e aggiungi materiale su tecnologie e pratiche di colloquio attuali, rilevanti per quella selezione. Pochi elementi, curati, non un dump. Se non hai nulla di solido, restituisci solo summary e array vuoti.
- Vietato: tag script, iframe, img, handler on*, javascript:.
Schema (tutti gli array sono opzionali tranne summary):
{"summary":"...","newTopics":[{"id":"...","label":"...","section":"tech|en|..."}],"lessonPatches":[{"id":"...","htmlReplacements":[{"find":"...","replace":"..."}]}],"lessonUpdates":[{"id":"...","title":"...","mins":10,"cardUpdates":[{"index":0,"front":"...","back":"..."}],"checkUpdates":[{"index":0,"question":"...","options":["..."],"answer":0,"explanation":"..."}],"cardsAppend":[["fronte","retro"]],"checksAppend":[["domanda",["a","b","c","d"],1,"spiegazione"]]}],"newLessons":[{"id":"...","topic":"...","title":"...","mins":10,"html":"<p>...</p>","cards":[["f","b"]],"check":[["domanda",["a","b","c","d"],0,"spiegazione"]]}],"quizUpdates":[{"topic":"python","index":0,"question":"...","options":["..."],"answer":0,"explanation":"..."}],"quizAppend":[{"topic":"python","question":"...","options":["..."],"answer":1,"explanation":"..."}],"behavAppend":[{"trait":"ownership","question":"..."}],"sdAppend":[{"id":"...","title":"...","brief":"...","outline":"<ul>...</ul>"}],"pyAppend":[{"t":"...","d":"...","s":"..."}],"bulletAppend":[{"weak":"...","strong":"..."}],"checklistAppend":[{"list":"cv","item":"..."}],"algoAppend":[{"group":"Array e hashing","name":"...","url":"https://leetcode.com/problems/..."}],"enExercisesAppend":[{"id":"...","type":"translate","topic":"en-writing","lesson":"en-write-async","prompt":"...","answer":"...","explanation":"..."}],"enSpeakAppend":[{"id":"...","kind":"...","question":"...","sample":"...","coaching":"...","notes":"..."}]}`;

function extractJson(raw) {
  let t = String(raw || '').trim();
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(t); } catch { /* continua */ }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(t.slice(start, end + 1));
  throw new Error('La risposta del modello non contiene un JSON oggetto');
}

async function callModel(model) {
  const key = process.env.LLM_API_KEY;
  const base = (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const name = process.env.LLM_MODEL || 'gpt-4o-mini';
  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: 'Catalogo attuale (non duplicare questi id). Aggiorna e estendi.\n' + JSON.stringify(catalog(model)) }
  ];
  const send = async format => {
    const body = { model: name, temperature: 0.4, max_tokens: 8000, messages };
    if (format) body.response_format = { type: 'json_object' };
    const res = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000)
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  };
  let out = await send(true);
  if (!out.ok && out.status === 400 && /response_format|json_object|max_tokens/i.test(out.text)) out = await send(false);
  if (!out.ok) throw new Error('LLM HTTP ' + out.status + ': ' + out.text.slice(0, 400));
  let data;
  try { data = JSON.parse(out.text); }
  catch { throw new Error('Risposta HTTP del provider non JSON'); }
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('Il modello ha risposto senza contenuto');
  return extractJson(content);
}

function semanticallyChanged(before, after) {
  return !deepEqual(
    [before.sections, before.topics, before.lessons, before.quiz, before.behav, before.traits, before.sd, before.py, before.algo, before.checklists, before.bullets, before.enSection, before.enTopics, before.enLessons, before.enEx, before.enSpeak],
    [after.sections, after.topics, after.lessons, after.quiz, after.behav, after.traits, after.sd, after.py, after.algo, after.checklists, after.bullets, after.enSection, after.enTopics, after.enLessons, after.enEx, after.enSpeak]
  );
}

function checkSyntax(file) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
}

export function writeModel(root, before, after, date) {
  const plan = [];
  if (!deepEqual([before.sections, before.topics, before.lessons], [after.sections, after.topics, after.lessons])) plan.push(['data-lessons.js', serializeLessons(after)]);
  if (!deepEqual([before.quiz, before.behav, before.traits, before.sd, before.py, before.algo, before.checklists, before.bullets], [after.quiz, after.behav, after.traits, after.sd, after.py, after.algo, after.checklists, after.bullets])) plan.push(['data-quiz.js', serializeQuiz(after)]);
  if (!deepEqual([before.enSection, before.enTopics, before.enLessons, before.enEx, before.enSpeak], [after.enSection, after.enTopics, after.enLessons, after.enEx, after.enSpeak])) plan.push(['data-english.js', serializeEnglish(after)]);
  if (before.updated !== date) plan.push(['content-meta.js', serializeMeta(date)]);
  for (const [, text] of plan) {
    if (Buffer.byteLength(text) > LIMITS.maxFileBytes) throw new Error('File generato oltre il limite di dimensione');
  }
  const backup = new Map();
  for (const [name] of plan) {
    const file = path.join(root, name);
    backup.set(file, fs.readFileSync(file));
    const prev = backup.get(file).length;
    const next = Buffer.byteLength(plan.find(p => p[0] === name)[1]);
    if (prev > 0 && next > prev * LIMITS.maxGrowthRatio && next - prev > 250_000) {
      throw new Error(name + ' cresce troppo (' + prev + ' → ' + next + ' byte)');
    }
  }
  try {
    for (const [name, text] of plan) fs.writeFileSync(path.join(root, name), text);
    for (const [name] of plan) checkSyntax(path.join(root, name));
    const loaded = loadModel(root);
    assertStable(before, loaded);
    if (!deepEqual(
      [after.sections, after.topics, after.lessons, after.quiz, after.behav, after.sd, after.py, after.algo, after.checklists, after.bullets, after.enSection, after.enTopics, after.enLessons, after.enEx, after.enSpeak],
      [loaded.sections, loaded.topics, loaded.lessons, loaded.quiz, loaded.behav, loaded.sd, loaded.py, loaded.algo, loaded.checklists, loaded.bullets, loaded.enSection, loaded.enTopics, loaded.enLessons, loaded.enEx, loaded.enSpeak]
    )) throw new Error('Il file rigenerato non coincide con il modello validato');
    if (loaded.updated !== date) throw new Error('Data di aggiornamento non scritta');
    const combined = {};
    const context = vm.createContext({ window: combined, console });
    for (const name of ['data-lessons.js', 'data-quiz.js', 'data-english.js']) {
      vm.runInContext(fs.readFileSync(path.join(root, name), 'utf8'), context, { filename: name });
    }
    const ids = combined.LESSONS.map(l => l.id);
    if (new Set(ids).size !== ids.length) throw new Error('Id lezione duplicato dopo il merge');
    if (combined.LESSONS.length !== after.lessons.length + after.enLessons.length) throw new Error('Merge lezioni incompleto');
  } catch (error) {
    for (const [file, buf] of backup) fs.writeFileSync(file, buf);
    throw error;
  }
  return plan.map(p => p[0]);
}

export async function run(options) {
  const root = options.root;
  if (!options.mock && !process.env.LLM_API_KEY) {
    const msg = 'LLM_API_KEY assente: aggiornamento contenuti saltato. Aggiungi il secret LLM_API_KEY in Settings → Secrets and variables → Actions. Variabili opzionali: LLM_BASE_URL (default https://api.openai.com/v1) e LLM_MODEL (default gpt-4o-mini).';
    console.log(msg);
    return { code: 0, changed: false, message: msg };
  }
  const before = loadModel(root);
  let payload;
  if (options.mock) payload = extractJson(fs.readFileSync(options.mock, 'utf8'));
  else payload = await callModel(before);
  const applied = validateAndApply(before, payload);
  if (applied.errors.length) {
    console.error('Validazione fallita, nessun file è stato modificato:');
    for (const e of applied.errors) console.error('- ' + e);
    return { code: 1, changed: false, errors: applied.errors };
  }
  if (!semanticallyChanged(before, applied.model)) {
    console.log('Nessuna modifica di contenuto. ' + (payload.summary || ''));
    return { code: 0, changed: false, summary: payload.summary };
  }
  const date = new Date().toISOString().slice(0, 10);
  if (options.dryRun) {
    console.log('Dry-run valido, file non scritti. ' + payload.summary);
    console.log('Voci: ' + countItems(before) + ' → ' + countItems(applied.model));
    return { code: 0, changed: true, dryRun: true, summary: payload.summary };
  }
  const files = writeModel(root, before, applied.model, date);
  console.log('Contenuti aggiornati (' + date + '): ' + files.join(', '));
  console.log(payload.summary);
  return { code: 0, changed: true, files, summary: payload.summary };
}

function parseArgs(argv) {
  const out = { root: process.cwd(), mock: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--root') out.root = path.resolve(argv[++i] || '');
    else if (a === '--mock') out.mock = path.resolve(argv[++i] || '');
    else throw new Error('Argomento sconosciuto: ' + a);
  }
  if (!out.root) throw new Error('--root richiede un percorso');
  if (argv.includes('--mock') && !out.mock) throw new Error('--mock richiede un file');
  return out;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  run(parseArgs(process.argv)).then(result => {
    process.exitCode = result.code;
  }).catch(error => {
    console.error(error && error.message ? error.message : error);
    process.exitCode = 1;
  });
}
