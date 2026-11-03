/* Sanificatore HTML per le lezioni. Allowlist stretta, niente DOM del browser:
   il testo resta, i tag non ammessi spariscono (script/svg/style con tutto il contenuto). */
(function (root) {
  'use strict';
  var ALLOW = { p: 1, h3: 1, h4: 1, ul: 1, ol: 1, li: 1, strong: 1, em: 1, b: 1, i: 1, code: 1, pre: 1, table: 1, thead: 1, tbody: 1, tfoot: 1, tr: 1, th: 1, td: 1, br: 1, blockquote: 1, div: 1 };
  var VOID = { br: 1 };
  var DROP = { script: 1, style: 1, iframe: 1, object: 1, embed: 1, svg: 1, math: 1, noscript: 1, template: 1, textarea: 1, title: 1, frameset: 1, noframes: 1, xmp: 1 };
  var VOID_SKIP = { img: 1, link: 1, meta: 1, base: 1, input: 1, source: 1, track: 1, col: 1, wbr: 1, area: 1, param: 1 };
  var CLASS_OK = { callout: 1, muted: 1 };

  function escText(s) {
    return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
        var q = raw.charAt(i);
        if (q === '"' || q === "'") {
          i++;
          var vstart = i;
          while (i < raw.length && raw.charAt(i) !== q) i++;
          value = raw.slice(vstart, i);
          if (i < raw.length) i++;
        } else {
          var ustart = i;
          while (i < raw.length && !/[\s]/.test(raw.charAt(i))) i++;
          value = raw.slice(ustart, i);
        }
      }
      if (name) attrs[name] = value;
    }
    return attrs;
  }

  function classAttr(attrs) {
    var raw = attrs['class'];
    if (!raw) return '';
    var keep = [];
    raw.split(/\s+/).forEach(function (token) {
      if (CLASS_OK[token] && keep.indexOf(token) < 0) keep.push(token);
    });
    return keep.length ? ' class="' + keep.join(' ') + '"' : '';
  }

  function sanitizeLessonHtml(input) {
    var src = String(input == null ? '' : input).replace(/<!--[\s\S]*?-->/g, '');
    var out = '';
    var i = 0;
    var stack = [];
    var drop = [];

    function emitClose(name) {
      out += '</' + name + '>';
    }

    while (i < src.length) {
      var lt = src.indexOf('<', i);
      if (lt < 0) {
        if (!drop.length) out += escText(src.slice(i));
        break;
      }
      if (lt > i && !drop.length) out += escText(src.slice(i, lt));
      if (lt + 1 >= src.length) {
        if (!drop.length) out += '&lt;';
        break;
      }
      var next = src.charAt(lt + 1);
      if (next !== '/' && next !== '!' && !/[A-Za-z]/.test(next)) {
        if (!drop.length) out += '&lt;';
        i = lt + 1;
        continue;
      }
      var gt = src.indexOf('>', lt + 1);
      if (gt < 0) {
        if (!drop.length) out += escText(src.slice(lt));
        break;
      }
      var body = src.slice(lt + 1, gt).trim();
      i = gt + 1;
      if (!body || body.charAt(0) === '!') continue;
      var closing = body.charAt(0) === '/';
      var inner = closing ? body.slice(1).trim() : body.replace(/\/$/, '').trim();
      var nameMatch = /^([A-Za-z][A-Za-z0-9]*)/.exec(inner);
      if (!nameMatch) continue;
      var name = nameMatch[1].toLowerCase();
      if (closing) {
        if (drop.length && drop[drop.length - 1] === name) {
          drop.pop();
          continue;
        }
        if (drop.length) continue;
        for (var s = stack.length - 1; s >= 0; s--) {
          if (stack[s] === name) {
            while (stack.length > s) emitClose(stack.pop());
            break;
          }
        }
        continue;
      }
      if (drop.length) {
        if (DROP[name]) drop.push(name);
        continue;
      }
      if (DROP[name]) {
        drop.push(name);
        continue;
      }
      if (VOID_SKIP[name]) continue;
      if (!ALLOW[name]) continue;
      var attrRaw = inner.slice(nameMatch[0].length);
      var attrs = parseAttrs(attrRaw);
      if (name === 'div' && !classAttr(attrs)) continue;
      out += '<' + name + classAttr(attrs) + '>';
      if (!VOID[name]) stack.push(name);
    }
    while (stack.length) emitClose(stack.pop());
    return out;
  }

  root.BSSanitize = { sanitizeLessonHtml: sanitizeLessonHtml };
})(typeof window !== 'undefined' ? window : globalThis);
