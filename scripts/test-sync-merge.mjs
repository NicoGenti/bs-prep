import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'sync-merge.js');
const context = vm.createContext({ window: {}, console });
vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
const { mergeProgress, sanitizeProgress, applyStamps, parseGist } = context.window.BSMerge;

let failed = 0;
function check(name, cond, detail) {
  if (cond) console.log('ok  ' + name);
  else { failed++; console.error('FAIL ' + name + (detail ? ' — ' + detail : '')); }
}
function card(at, n, extra) {
  return Object.assign({ ef: 2.5, int: n ? 3 : 0, reps: n, due: '2026-12-01', n, lapses: 0, last: '2026-11-01', at }, extra || {});
}

const local = {
  v: 1,
  srs: { 'L:cv-principi:0': card('2026-11-01T10:00:00Z', 2), 'Q:python:0': card('2026-11-02T10:00:00Z', 4) },
  lessons: { 'cv-principi': { done: true, score: 0.8, date: '2026-11-01', at: '2026-11-01T10:00:00Z' } },
  checks: { 'cv:0': true },
  texts: { cl_name: 'Ada' },
  stories: [{ id: 's1', title: 'Pipeline', s: 'locale' }],
  psHistory: [{ date: '2026-11-01T09:00:00.000Z', type: 'mix', n: 10, correct: 7 }],
  stamps: {
    'srs:L:cv-principi:0': '2026-11-01T10:00:00Z',
    'srs:Q:python:0': '2026-11-02T10:00:00Z',
    'lesson:cv-principi': '2026-11-01T10:00:00Z',
    'check:cv:0': '2026-11-01T10:00:00Z',
    'text:cl_name': '2026-11-01T10:00:00Z',
    'story:s1': '2026-11-01T10:00:00Z'
  }
};
const remote = {
  v: 1,
  srs: {
    'L:cv-principi:0': card('2026-11-03T10:00:00Z', 1, { lapses: 1, reps: 0, due: '2026-11-03' }),
    'EX:enx-tr-01': card('2026-11-03T11:00:00Z', 3)
  },
  lessons: { 'en-vocab-swe': { done: true, score: 1, date: '2026-11-03', at: '2026-11-03T11:00:00Z' } },
  checks: { 'cv:1': true },
  texts: { cl_name: 'Nico' },
  stories: [{ id: 's1', title: 'Pipeline', s: 'remoto' }, { id: 's2', title: 'Nuova', s: 'solo remoto' }],
  psHistory: [{ date: '2026-11-02T09:00:00.000Z', type: 'logic', n: 5, correct: 4 }],
  stamps: {
    'srs:L:cv-principi:0': '2026-11-03T10:00:00Z',
    'srs:EX:enx-tr-01': '2026-11-03T11:00:00Z',
    'lesson:en-vocab-swe': '2026-11-03T11:00:00Z',
    'check:cv:1': '2026-11-03T11:00:00Z',
    'text:cl_name': '2026-10-01T10:00:00Z',
    'story:s1': '2026-11-04T10:00:00Z',
    'story:s2': '2026-11-04T10:00:00Z'
  }
};
const merged = mergeProgress(local, remote);
check('tiene la carta solo locale', merged.srs['Q:python:0'] && merged.srs['Q:python:0'].n === 4);
check('tiene la carta solo remota', merged.srs['EX:enx-tr-01'] && merged.srs['EX:enx-tr-01'].n === 3);
check('la carta più recente vince anche con meno ripetizioni', merged.srs['L:cv-principi:0'].at === '2026-11-03T10:00:00.000Z' && merged.srs['L:cv-principi:0'].reps === 0);
check('unisce le lezioni', merged.lessons['cv-principi'].done && merged.lessons['en-vocab-swe'].done);
check('unisce le spunte', merged.checks['cv:0'] && merged.checks['cv:1']);
check('il testo più recente resta', merged.texts.cl_name === 'Ada');
check('la storia più recente vince e l’altra resta', merged.stories.find(s => s.id === 's1').s === 'remoto' && merged.stories.some(s => s.id === 's2'));
check('unisce lo storico', merged.psHistory.length === 2);

const tie = mergeProgress(
  { v: 1, srs: { a: card('2026-11-01T00:00:00Z', 5) } },
  { v: 1, srs: { a: card('2026-11-01T00:00:00Z', 1) } }
);
check('a parità di tempo tiene più ripetizioni', tie.srs.a.n === 5);

const dirty = JSON.parse('{"v":1,"srs":{"ok":{"ef":2.5,"int":1,"reps":1,"due":"2026-11-01","n":1,"lapses":0,"at":"2026-11-01T00:00:00Z"}}}');
dirty.srs['__proto__'] = { polluted: true };
dirty.srs.constructor = { polluted: true };
const clean = mergeProgress({ v: 1, srs: {} }, dirty);
check('ignora chiavi pericolose', clean.srs.ok && !Object.hasOwn(clean.srs, '__proto__') && !Object.hasOwn(clean.srs, 'constructor') && !Object.prototype.polluted);

const junk = parseGist('{"app":"altro","data":{"v":1}}');
check('rifiuta un file che non è di BS Prep', junk == null);
const parsed = parseGist(JSON.stringify({ app: 'bs-prep', v: 1, data: { v: 1, srs: { a: card('2026-11-01T00:00:00Z', 2) } } }));
check('legge il Gist e tiene la carta', parsed && parsed.srs.a.n === 2);
check('rifiuta un Gist enorme', parseGist('{"app":"bs-prep","data":{"v":1' + 'x'.repeat(1600000)) == null);
check('versione sconosciuta rifiutata', sanitizeProgress({ v: 9, srs: {} }) == null);

const prev = { v: 1, srs: { a: card('2026-11-01T00:00:00Z', 1) }, checks: {}, stamps: {} };
const next = { v: 1, srs: { a: card('2026-11-01T00:00:00Z', 1), b: card('2026-11-02T00:00:00Z', 2) }, checks: { 'cv:0': true }, stamps: {} };
applyStamps(prev, next, '2026-11-03T12:00:00.000Z');
check('marca solo ciò che è cambiato', next.stamps['srs:b'] === '2026-11-03T12:00:00.000Z' && next.stamps['srs:a'] == null && next.stamps['check:cv:0']);
applyStamps(next, next, '2026-11-04T12:00:00.000Z');
check('un secondo passaggio identico non sposta i timestamp', next.stamps['srs:b'] === '2026-11-03T12:00:00.000Z');

if (failed) {
  console.error(failed + ' controlli falliti');
  process.exit(1);
}
console.log('Merge ok.');
