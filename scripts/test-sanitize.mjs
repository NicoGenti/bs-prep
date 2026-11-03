import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'html-sanitize.js');
const context = vm.createContext({ window: {}, console });
vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
const sanitize = context.window.BSSanitize.sanitizeLessonHtml;

let failed = 0;
function check(name, cond, detail) {
  if (cond) console.log('ok  ' + name);
  else { failed++; console.error('FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

const cases = [
  ['handler inline', '<p onclick="alert(1)">ciao</p>', '<p>ciao</p>'],
  ['link esterno', '<p>Vedi <a href="https://evil.example/phish" target="_blank">qui</a>.</p>', '<p>Vedi qui.</p>'],
  ['javascript codificato', '<a href="&#106;avascript:alert(1)">x</a>', 'x'],
  ['chiusura article e script', '</article><p>ok</p><script>alert(1)</script>', '<p>ok</p>'],
  ['svg con script', '<svg onload="alert(1)"><script>alert(1)</script></svg>dopo', 'dopo'],
  ['style esterno', '<style>body{background:url(https://evil.example/x)}</style><p class="muted">t</p>', '<p class="muted">t</p>'],
  ['img onerror', '<img src=x onerror=alert(1)>testo', 'testo'],
  ['classe non in elenco', '<p class="callout evil" style="color:red">z</p>', '<p class="callout">z</p>'],
  ['callout ammesso', '<div class="callout"><b>Nota</b></div>', '<div class="callout"><b>Nota</b></div>'],
  ['tabella lezione', '<table><tr><th>A</th><td>B</td></tr></table>', '<table><tr><th>A</th><td>B</td></tr></table>']
];
for (const [name, input, expect] of cases) {
  const got = sanitize(input);
  check(name, got === expect, JSON.stringify(got));
}
check('niente javascript: nel risultato dello script', !/javascript\s*:/i.test(sanitize('<a href="javascript:alert(1)">x</a><script>javascript:alert(1)</script>')));
check('niente tag script', !/<script/i.test(sanitize('<scr<script>ipt>alert(1)</scr</script>ipt>')));

if (failed) {
  console.error(failed + ' controlli falliti');
  process.exit(1);
}
console.log('Sanitize ok.');
