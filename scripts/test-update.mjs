#!/usr/bin/env node
/* Prove locali dello script di aggiornamento: round-trip, mock valido, mock rifiutati. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadModel, deepEqual, assertStable, validateAndApply, serializeLessons, serializeQuiz, serializeEnglish, writeModel } from './update-content.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const script = path.join(here, 'update-content.mjs');
let failed = 0;

function check(name, cond, detail) {
  if (cond) console.log('ok  ' + name);
  else { failed++; console.error('FAIL ' + name + (detail ? ' — ' + detail : '')); }
}
function tempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bs-prep-'));
  for (const name of ['index.html', 'styles.css', 'app.js', 'views-core.js', 'views-sections.js', 'generators.js', 'data-lessons.js', 'data-quiz.js', 'data-english.js', 'content-meta.js']) {
    fs.copyFileSync(path.join(repo, name), path.join(dir, name));
  }
  return dir;
}
function hash(dir) {
  return ['data-lessons.js', 'data-quiz.js', 'data-english.js', 'content-meta.js'].map(n => fs.readFileSync(path.join(dir, n), 'utf8')).join('\n--\n');
}
function runCli(dir, args, env) {
  return spawnSync(process.execPath, [script, '--root', dir, ...args], {
    encoding: 'utf8',
    env: { ...process.env, LLM_API_KEY: '', LLM_BASE_URL: '', LLM_MODEL: '', ...env }
  });
}

const original = loadModel(repo);
const roundDir = tempRepo();
fs.writeFileSync(path.join(roundDir, 'data-lessons.js'), serializeLessons(original));
fs.writeFileSync(path.join(roundDir, 'data-quiz.js'), serializeQuiz(original));
fs.writeFileSync(path.join(roundDir, 'data-english.js'), serializeEnglish(original));
const round = loadModel(roundDir);
check('round-trip lezioni', deepEqual(original.lessons, round.lessons));
check('round-trip quiz', deepEqual(original.quiz, round.quiz));
check('round-trip inglese', deepEqual([original.enLessons, original.enEx, original.enSpeak, original.enTopics], [round.enLessons, round.enEx, round.enSpeak, round.enTopics]));
check('round-trip system design e checklist', deepEqual([original.sd, original.py, original.algo, original.checklists, original.bullets, original.behav, original.traits], [round.sd, round.py, round.algo, round.checklists, round.bullets, round.behav, round.traits]));
try { assertStable(original, round); check('round-trip invarianti', true); }
catch (e) { check('round-trip invarianti', false, e.message); }

const lesson = original.lessons.find(l => l.id === 'cv-principi');
const find = 'Responsible for the weekly notes.';
check('stringa di patch presente una volta', lesson.html.split(find).length - 1 === 1);

const good = {
  summary: 'Aggiunta di prova per il test locale.',
  lessonPatches: [{ id: 'cv-principi', htmlReplacements: [{ find, replace: 'Owned the CI/CD pipelines.' }] }],
  lessonUpdates: [{ id: 'cv-principi', cardsAppend: [['Carta aggiunta dal test', 'Resta in coda, senza spostare le carte già presenti.']] }],
  newLessons: [{
    id: 'auto-test-lesson',
    topic: 'python',
    title: 'Lezione di prova sull’aggiornamento',
    mins: 8,
    html: '<p>Contenuto di prova in italiano su Python e sui type hint, con un esempio: list[int]. Serve solo a verificare che una lezione nuova finisca in coda.</p>',
    cards: [['Nuova carta', 'Spiegazione breve in italiano.']],
    check: [['Domanda di prova sulla lezione?', ['Prima', 'Seconda', 'Terza', 'Quarta'], 1, 'La seconda è quella attesa.']]
  }],
  quizAppend: [{ topic: 'python', question: 'Domanda nuova di prova sul GIL?', options: ['threading', 'multiprocessing', 'asyncio', 'yield'], answer: 1, explanation: 'Il GIL limita i thread sul CPU-bound.' }],
  enExercisesAppend: [{
    id: 'enx-auto-test-01',
    type: 'translate',
    topic: 'en-writing',
    lesson: 'en-write-async',
    prompt: 'Traduci.\n\nMi serve una review oggi.',
    answer: 'Please review this today.',
    explanation: 'La richiesta va in prima frase, con la scadenza.'
  }],
  enSpeakAppend: [{
    id: 'ens-auto-test-01',
    kind: 'Prova',
    question: 'State one trade-off in a single sentence.',
    sample: 'We gain a lower p99 and give up reading the latest write.',
    coaching: 'Una frase sola, con gain e give up.',
    notes: 'È il trade-off di una cache.'
  }]
};
const goodDir = tempRepo();
const beforeGood = hash(goodDir);
const mockGood = path.join(goodDir, 'good.json');
fs.writeFileSync(mockGood, JSON.stringify(good));
const goodRun = runCli(goodDir, ['--mock', mockGood]);
check('mock valido esce 0', goodRun.status === 0, goodRun.stdout + goodRun.stderr);
const after = loadModel(goodDir);
check('patch HTML applicata', after.lessons.find(l => l.id === 'cv-principi').html.includes('Owned the CI/CD pipelines.'));
check('carta aggiunta in coda', after.lessons.find(l => l.id === 'cv-principi').cards.at(-1)[0] === 'Carta aggiunta dal test');
check('carte precedenti intatte', deepEqual(original.lessons.find(l => l.id === 'cv-principi').cards, after.lessons.find(l => l.id === 'cv-principi').cards.slice(0, -1)));
check('lezione nuova in coda', after.lessons.at(-1).id === 'auto-test-lesson' && after.lessons.map(l => l.id).slice(0, original.lessons.length).join() === original.lessons.map(l => l.id).join());
check('quiz aggiunto in coda senza spostare', after.quiz.python.length === original.quiz.python.length + 1 && deepEqual(after.quiz.python[0], original.quiz.python[0]));
check('esercizio e speaking nuovi', after.enEx.at(-1).id === 'enx-auto-test-01' && after.enSpeak.at(-1).id === 'ens-auto-test-01');
check('id inglesi precedenti nello stesso ordine', after.enEx.slice(0, -1).map(e => e.id).join() === original.enEx.map(e => e.id).join());
check('data contenuti scritta', /^\d{4}-\d{2}-\d{2}$/.test(after.updated));
check('i file sono cambiati', hash(goodDir) !== beforeGood);
try { assertStable(original, after); check('invarianti dopo il mock valido', true); }
catch (e) { check('invarianti dopo il mock valido', false, e.message); }

function expectReject(name, payload) {
  const dir = tempRepo();
  const snap = hash(dir);
  const mock = path.join(dir, 'bad.json');
  fs.writeFileSync(mock, typeof payload === 'string' ? payload : JSON.stringify(payload));
  const run = runCli(dir, ['--mock', mock]);
  check(name + ' esce 1', run.status === 1, run.stdout + run.stderr);
  check(name + ' non scrive', hash(dir) === snap);
}

const stubLesson = {
  id: 'auto-test-lesson', topic: 'python', title: 'Lezione di prova sull’aggiornamento', mins: 8,
  html: '<p>Contenuto di prova in italiano su Python e sui type hint, con un esempio abbastanza lungo da superare il minimo.</p>',
  cards: [['Nuova carta', 'Spiegazione.']],
  check: [['Domanda di prova sulla lezione?', ['Prima', 'Seconda', 'Terza'], 1, 'Perché la seconda.']]
};
expectReject('id lezione riusato', { summary: 'no', newLessons: [{ ...stubLesson, id: 'cv-principi' }] });
expectReject('JSON non valido', '{');
expectReject('campo distruttivo', { summary: 'no', deleteLessonIds: ['cv-principi'] });
expectReject('indice quiz inesistente', { summary: 'no', quizUpdates: [{ topic: 'python', index: 9999, question: 'Domanda lunga abbastanza?', options: ['a', 'b'], answer: 0, explanation: 'Perché no.' }] });
expectReject('id esercizio riusato', { summary: 'no', enExercisesAppend: [{ id: 'enx-tr-01', type: 'translate', topic: 'en-writing', lesson: 'en-write-async', prompt: 'Traduci questa frase di prova.', answer: 'Hello there', explanation: 'Solo una prova di collisione.' }] });
expectReject('HTML pericoloso', { summary: 'no', newLessons: [{ ...stubLesson, id: 'auto-test-xss', html: '<p>Testo italiano di prova sufficientemente lungo per la lezione nuova.</p><script>alert(1)</script>' }] });
expectReject('troppe lezioni nuove', { summary: 'no', newLessons: Array.from({ length: 9 }, (_, i) => ({ ...stubLesson, id: 'auto-test-n-' + i })) });
expectReject('patch non univoca', { summary: 'no', lessonPatches: [{ id: 'cv-principi', htmlReplacements: [{ find: 'the', replace: 'THE' }] }] });

const shrunk = structuredClone(original);
shrunk.quiz.python.pop();
let threw = false;
try { assertStable(original, shrunk); } catch { threw = true; }
check('una rimozione di quiz è rifiutata', threw);

const missingKey = runCli(tempRepo(), []);
check('senza API key esce 0', missingKey.status === 0, missingKey.stdout + missingKey.stderr);
check('senza API key il messaggio è chiaro', /LLM_API_KEY assente/.test(missingKey.stdout));

const dry = tempRepo();
const dryMock = path.join(dry, 'good.json');
fs.writeFileSync(dryMock, JSON.stringify(good));
const drySnap = hash(dry);
const dryRun = runCli(dry, ['--mock', dryMock, '--dry-run']);
check('dry-run esce 0', dryRun.status === 0, dryRun.stdout + dryRun.stderr);
check('dry-run non scrive', hash(dry) === drySnap);

const direct = validateAndApply(original, { summary: 'x', quizAppend: [{ topic: 'nope', question: 'Domanda inesistente?', options: ['a', 'b'], answer: 0, explanation: 'Non esiste il topic.' }] });
check('topic quiz sconosciuto rifiutato', direct.errors.length > 0);

try {
  const dir = tempRepo();
  const applied = validateAndApply(original, good);
  if (applied.errors.length) throw new Error(applied.errors.join('; '));
  writeModel(dir, original, applied.model, '2026-11-03');
  check('writeModel ricarica e resta stabile', deepEqual(loadModel(dir).quiz.python.at(-1)[0], 'Domanda nuova di prova sul GIL?'));
} catch (e) {
  check('writeModel ricarica e resta stabile', false, e.message);
}

if (failed) {
  console.error(failed + ' controlli falliti');
  process.exit(1);
}
console.log('Tutti i controlli dello script sono passati.');
