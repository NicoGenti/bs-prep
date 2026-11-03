'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

require('../html-sanitize.js');
const sanitize = globalThis.BSSanitize.sanitizeLessonHtml;

function assertSafe(output) {
  assert.doesNotMatch(output, /<script/i);
  assert.doesNotMatch(output, /on\w+\s*=/i);
  assert.doesNotMatch(output, /javascript:/i);
  assert.doesNotMatch(output, /<iframe/i);
  assert.doesNotMatch(output, /<svg/i);
  assert.doesNotMatch(output, /<style/i);
}

test('removes script tags and their content', () => {
  const output = sanitize('<p>Safe</p><script>alert(1)</script>');
  assert.equal(output, '<p>Safe</p>');
});

test('removes event handlers and dangerous URLs', () => {
  const inputs = [
    '<img src=x onerror=alert(1)>',
    '<a href="javascript:alert(1)">click</a>',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<svg onload=alert(1)></svg>',
    '<div onclick=alert(1)>text</div>'
  ];
  inputs.forEach(input => assertSafe(sanitize(input)));
});

test('drops content of dangerous container tags', () => {
  const output = sanitize('<style>p{}</style><p>Safe</p>');
  assert.equal(output, '<p>Safe</p>');
});

test('allows only whitelisted class values', () => {
  assert.equal(sanitize('<div class="callout evil">Text</div>'), '<div class="callout">Text</div>');
  assert.equal(sanitize('<div class="evil">Text</div>'), '');
});

test('escapes text, ampersands and angle brackets', () => {
  assert.equal(sanitize('Tom & Jerry <b>bold</b>'), 'Tom &amp; Jerry <b>bold</b>');
  assert.equal(sanitize('1 < 2 > 0'), '1 &lt; 2 &gt; 0');
});

test('neutralizes malformed and mutation-XSS-like input', () => {
  const inputs = [
    '<p><script>alert(1)',
    '<p></p><noscript><p title="</noscript><img src=x onerror=alert(1)>">',
    '<math><mtext><table><mglyph><style><!--</style><img src=x onerror=alert(1)>',
    '<p title="</p><script>alert(1)</script>">Text'
  ];
  inputs.forEach(input => assertSafe(sanitize(input)));
});

test('rejects oversized input', () => {
  assert.equal(sanitize('<p>' + 'a'.repeat(1000001) + '</p>'), '');
});

test('returns an empty string for non-text input', () => {
  assert.equal(sanitize(null), '');
  assert.equal(sanitize(undefined), '');
  assert.equal(sanitize({ evil: true }), '');
  assert.equal(sanitize(['<script>alert(1)</script>']), '');
});
