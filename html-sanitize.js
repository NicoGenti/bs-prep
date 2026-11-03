/* Sanitizes lesson HTML using a strict allowlist. Browser DOM is not used:
   disallowed tags are removed, including their content for dangerous elements. */
(function (root) {
  'use strict';

  var MAX_INPUT_LENGTH = 1000000;
  var ALLOW = { p: 1, h3: 1, h4: 1, ul: 1, ol: 1, li: 1, strong: 1, em: 1, b: 1, i: 1, code: 1, pre: 1, table: 1, thead: 1, tbody: 1, tfoot: 1, tr: 1, th: 1, td: 1, br: 1, blockquote: 1, div: 1 };
  var VOID = { br: 1 };
  var DROP = { script: 1, style: 1, iframe: 1, object: 1, embed: 1, svg: 1, math: 1, noscript: 1, template: 1, textarea: 1, title: 1, frameset: 1, noframes: 1, xmp: 1 };
  var VOID_SKIP = { img: 1, link: 1, meta: 1, base: 1, input: 1, source: 1, track: 1, col: 1, wbr: 1, area: 1, param: 1 };
  var CLASS_OK = { callout: 1, muted: 1 };

  function escText(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function parseAttrs(raw) {
    var attrs = {};
    var i = 0;
    while (i < raw.length) {
      while (i < raw.length && /[\s\/]/.test(raw.charAt(i))) i++;
      if (i >= raw.length) break;
      var start = i;
      while (i < raw.length && /[^\s=\/]/.test(raw.charAt(i))) i++;
      var name = raw.slice(start, i).toLowerCase();
      while (i < raw.length && raw.charAt(i) === ' ') i++;
      var value = '';
      if (raw.charAt(i) === '=') {
        i++;
        while (i < raw.length && raw.charAt(i) === ' ') i++;
        var quote = raw.charAt(i);
        if (quote === '"' || quote === "'") {
          i++;
          var valueStart = i;
          while (i < raw.length && raw.charAt(i) !== quote) i++;
          value = raw.slice(valueStart, i);
          if (i < raw.length) i++;
        } else {
          var unquotedStart = i;
          while (i < raw.length && !/[\s]/.test(raw.charAt(i))) i++;
          value = raw.slice(unquotedStart, i);
        }
      }
      if (name) attrs[name] = value;
    }
    return attrs;
  }

  function classAttr(attrs) {
    var raw = attrs['class'];
    if (!raw) return '';
    var kept = [];
    raw.split(/\s+/).forEach(function (token) {
      if (CLASS_OK[token] && kept.indexOf(token) < 0) kept.push(token);
    });
    return kept.length ? ' class="' + kept.join(' ') + '"' : '';
  }

  function sanitizeLessonHtml(input) {
    if (input == null) return '';
    if (typeof input !== 'string' && typeof input !== 'number' && typeof input !== 'boolean') return '';
    var source = String(input);
    if (source.length > MAX_INPUT_LENGTH) return '';

    source = source.replace(/<!--[\s\S]*?-->/g, '');
    var output = '';
    var index = 0;
    var stack = [];
    var dropStack = [];

    function emitClose(name) {
      output += '</' + name + '>';
    }

    while (index < source.length) {
      var lt = source.indexOf('<', index);
      if (lt < 0) {
        if (!dropStack.length) output += escText(source.slice(index));
        break;
      }
      if (lt > index && !dropStack.length) output += escText(source.slice(index, lt));
      if (lt + 1 >= source.length) {
        if (!dropStack.length) output += '&lt;';
        break;
      }

      var next = source.charAt(lt + 1);
      if (next !== '/' && next !== '!' && !/[A-Za-z]/.test(next)) {
        if (!dropStack.length) output += '&lt;';
        index = lt + 1;
        continue;
      }

      var gt = source.indexOf('>', lt + 1);
      if (gt < 0) {
        if (!dropStack.length) output += escText(source.slice(lt));
        break;
      }

      var body = source.slice(lt + 1, gt).trim();
      index = gt + 1;
      if (!body || body.charAt(0) === '!') continue;

      var isClosing = body.charAt(0) === '/';
      var inner = isClosing ? body.slice(1).trim() : body.replace(/\/$/, '').trim();
      var nameMatch = /^([A-Za-z][A-Za-z0-9]*)/.exec(inner);
      if (!nameMatch) continue;
      var name = nameMatch[1].toLowerCase();

      if (isClosing) {
        if (dropStack.length && dropStack[dropStack.length - 1] === name) {
          dropStack.pop();
          continue;
        }
        if (dropStack.length) continue;
        for (var i = stack.length - 1; i >= 0; i--) {
          if (stack[i] === name) {
            while (stack.length > i) emitClose(stack.pop());
            break;
          }
        }
        continue;
      }

      if (dropStack.length) {
        if (DROP[name]) dropStack.push(name);
        continue;
      }
      if (DROP[name]) {
        dropStack.push(name);
        continue;
      }
      if (VOID_SKIP[name]) continue;
      if (!ALLOW[name]) continue;

      var attrRaw = inner.slice(nameMatch[0].length);
      var attrs = parseAttrs(attrRaw);
      if (name === 'div' && !classAttr(attrs)) {
        dropStack.push(name);
        continue;
      }

      output += '<' + name + classAttr(attrs) + '>';
      if (!VOID[name]) stack.push(name);
    }

    while (stack.length) emitClose(stack.pop());
    return output;
  }

  root.BSSanitize = { sanitizeLessonHtml: sanitizeLessonHtml };
})(typeof window !== 'undefined' ? window : globalThis);
