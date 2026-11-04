'use strict';

/*
 * Sandbox suite for glass-lens.js (phase P-3).
 *
 * jsdom-free: each test evaluates the classic script in a FRESH node:vm
 * context (no cross-test leakage) with mocked globals. Every assertion here is
 * a MOCKED-ENVIRONMENT assertion. Two states in particular cannot be induced
 * in a real browser through CDP media emulation — "no SVG filter support" and
 * "WebKit cannot bend its backdrop" — so they are asserted here only and are
 * never claimed as browser/screenshot evidence.
 *
 * The engine reads the ambient `document`/`SVGElement` globals and publishes
 * onto its root object; in a vm sandbox the contextified global plays the
 * browser's `window` role, so `sandbox.BSLens` is `window.BSLens`.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ENGINE = fs.readFileSync(path.join(__dirname, '..', 'glass-lens.js'), 'utf8');

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/120.0.0.0 Safari/537.36';
const WEBKIT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
  'Version/17.0 Safari/605.1.15';

const PNG_URL = 'data:image/png;base64,AAAA';
let pngSerial = 0;

function makeInlineStyle() {
  const props = new Map();
  return {
    _props: props,
    setProperty(name, value) {
      props.set(name, String(value));
    },
    removeProperty(name) {
      props.delete(name);
    },
    getPropertyValue(name) {
      return props.has(name) ? props.get(name) : '';
    },
    has(name) {
      return props.has(name);
    }
  };
}

function makeElement(tag, options) {
  const opts = options || {};
  const vars = opts.vars || {};
  const computed = {
    display: opts.display === undefined ? 'block' : opts.display,
    visibility: opts.visibility === undefined ? 'visible' : opts.visibility,
    borderTopLeftRadius: opts.radius === undefined ? '14px' : opts.radius,
    getPropertyValue(name) {
      return Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : '';
    }
  };

  const element = {
    tagName: tag,
    id: opts.id || '',
    style: makeInlineStyle(),
    computed,
    children: [],
    parentNode: null,
    firstChild: null,
    offsetWidth: opts.width === undefined ? 240 : opts.width,
    offsetHeight: opts.height === undefined ? 40 : opts.height,
    _attrs: new Map(),
    setAttribute(name, value) {
      element._attrs.set(name, String(value));
      if (name === 'id') element.id = String(value);
    },
    getAttribute(name) {
      return element._attrs.has(name) ? element._attrs.get(name) : null;
    },
    hasAttribute(name) {
      return element._attrs.has(name);
    },
    removeAttribute(name) {
      element._attrs.delete(name);
    },
    appendChild(child) {
      child.parentNode = element;
      element.children.push(child);
      element.firstChild = element.children[0];
      return child;
    },
    insertBefore(child, reference) {
      const at = reference ? element.children.indexOf(reference) : -1;
      if (at === -1) element.children.push(child);
      else element.children.splice(at, 0, child);
      child.parentNode = element;
      element.firstChild = element.children[0];
      return child;
    },
    removeChild(child) {
      const at = element.children.indexOf(child);
      if (at !== -1) element.children.splice(at, 1);
      child.parentNode = null;
      element.firstChild = element.children[0] || null;
      return child;
    },
    addEventListener() {},
    removeEventListener() {}
  };
  return element;
}

function makeCanvas() {
  const context = {
    fillStyle: '#000',
    createImageData(width, height) {
      return { width, height, data: new Uint8ClampedArray(width * height * 4) };
    },
    putImageData() {}
  };
  return {
    width: 0,
    height: 0,
    getContext() {
      return context;
    },
    toDataURL() {
      // A distinct encode per call, like a real canvas: two different maps
      // must not collide on the same data URL, or a repainted rim would be
      // indistinguishable from the previous one.
      pngSerial += 1;
      return `${PNG_URL}${pngSerial}`;
    }
  };
}

function createMedia(initial) {
  const state = Object.assign(
    {
      '(prefers-reduced-motion: reduce)': false,
      '(prefers-reduced-transparency: reduce)': false,
      '(prefers-color-scheme: dark)': false
    },
    initial || {}
  );
  const queries = new Map();

  function query(name) {
    if (!queries.has(name)) {
      const list = {
        media: name,
        _handlers: [],
        get matches() {
          return !!state[name];
        },
        addEventListener(type, handler) {
          if (type === 'change') list._handlers.push(handler);
        },
        removeEventListener(type, handler) {
          const at = list._handlers.indexOf(handler);
          if (at !== -1) list._handlers.splice(at, 1);
        },
        addListener(handler) {
          list._handlers.push(handler);
        },
        removeListener(handler) {
          const at = list._handlers.indexOf(handler);
          if (at !== -1) list._handlers.splice(at, 1);
        }
      };
      queries.set(name, list);
    }
    return queries.get(name);
  }

  return {
    state,
    matchMedia: query,
    set(name, value) {
      state[name] = value;
    },
    fire(name) {
      const list = query(name);
      const handlers = list._handlers.slice();
      for (let i = 0; i < handlers.length; i++) {
        handlers[i]({ media: name, matches: !!state[name] });
      }
    }
  };
}

function makeDocument(surfaces, readyState) {
  const doc = {
    readyState,
    _listeners: [],
    documentElement: makeElement('html'),
    head: makeElement('head'),
    body: makeElement('body'),
    createElement(tag) {
      return tag === 'canvas' ? makeCanvas() : makeElement(tag);
    },
    createElementNS(namespace, tag) {
      return makeElement(tag);
    },
    createTextNode(text) {
      return { nodeValue: text, textContent: text, parentNode: null };
    },
    querySelectorAll(selector) {
      return surfaces[selector] || [];
    },
    addEventListener(type, handler) {
      doc._listeners.push({ type, handler });
    },
    removeEventListener(type, handler) {
      const at = doc._listeners.findIndex(entry => entry.type === type && entry.handler === handler);
      if (at !== -1) doc._listeners.splice(at, 1);
    },
    getElementsByTagName(name) {
      return name === 'head' ? [doc.head] : [];
    }
  };
  return doc;
}

/*
 * Builds one isolated sandbox. Options:
 *   bare          – no document/SVGElement at all (the DOM-less vm path)
 *   svg:false     – SVGElement missing while a document exists
 *   css:false     – CSS.supports() false (no filter url() support)
 *   userAgent     – navigator.userAgent (defaults to Chromium)
 *   noMatchMedia  – omit matchMedia entirely
 *   media         – initial reduced/colour-scheme state
 *   tabbar        – { width, height, display } for the .tabbar stub
 */
function createHarness(options) {
  const opts = options || {};
  const media = createMedia(opts.media);
  const record = { raf: 0, scheduled: 0, observers: [] };
  const sandbox = {
    console,
    devicePixelRatio: 1,
    getComputedStyle(element) {
      return element && element.computed ? element.computed : makeElement('span').computed;
    },
    addEventListener() {},
    removeEventListener() {},
    requestAnimationFrame() {
      record.raf += 1;
      return 1;
    },
    cancelAnimationFrame() {},
    setTimeout() {
      record.scheduled += 1;
      return 1;
    },
    clearTimeout() {},
    requestIdleCallback() {
      record.scheduled += 1;
      return 1;
    },
    cancelIdleCallback() {}
  };

  if (opts.userAgent !== null) {
    sandbox.navigator = { userAgent: opts.userAgent || CHROME_UA };
  }
  if (opts.svg !== false) {
    sandbox.SVGElement = function SVGElement() {};
  }
  sandbox.CSS = {
    supports() {
      return opts.css !== false;
    }
  };
  if (!opts.noMatchMedia) sandbox.matchMedia = media.matchMedia;

  function makeObserverClass() {
    function Observer(callback) {
      this.callback = callback;
      this.targets = [];
      this.disconnected = false;
      record.observers.push(this);
    }
    Observer.prototype.observe = function observe(target) {
      this.targets.push(target);
    };
    Observer.prototype.disconnect = function disconnect() {
      this.disconnected = true;
    };
    return Observer;
  }
  sandbox.ResizeObserver = makeObserverClass();
  sandbox.MutationObserver = makeObserverClass();

  let document = null;
  let topbar = null;
  let tabbar = null;

  if (!opts.bare) {
    topbar = makeElement('.topbar', { width: 240, height: 40, display: 'block' });
    tabbar = makeElement(
      '.tabbar',
      Object.assign({ width: 320, height: 56, display: 'none' }, opts.tabbar || {})
    );
    const surfaces = {
      '.topbar': [topbar],
      '.tabbar': [tabbar]
    };
    document = makeDocument(surfaces, opts.readyState || 'complete');
    sandbox.document = document;
  }

  const context = vm.createContext(sandbox);
  vm.runInContext(ENGINE, context, { filename: 'glass-lens.js' });

  return {
    sandbox,
    context,
    document,
    topbar,
    tabbar,
    media,
    record,
    BSLens: sandbox.BSLens
  };
}

function inline(element, name) {
  return element.style.getPropertyValue(name);
}

test('publishes the BSLens contract (10 public keys, VERSION/SOURCE strings)', () => {
  const harn = createHarness({ bare: true });
  const lens = harn.BSLens;
  assert.equal(typeof lens, 'object');
  // The published contract: ten keys. `_internals` is the documented,
  // test-only seam and is asserted separately so it can never masquerade as
  // public API.
  assert.deepEqual(
    Object.keys(lens)
      .filter(key => key !== '_internals')
      .sort(),
    [
      'SOURCE',
      'VERSION',
      '_diagnostics',
      'destroy',
      'init',
      'isEnabled',
      'isSupported',
      'mount',
      'refresh',
      'unmount'
    ]
  );
  assert.equal(typeof lens._internals, 'object');
  assert.equal(typeof lens.VERSION, 'string');
  assert.match(lens.VERSION, /^\d+\.\d+\.\d+/);
  assert.equal(lens.SOURCE, 'glisse@v0.5.0/46be5ba0');
  assert.equal(typeof lens._diagnostics, 'object');
});

test('feature and preference predicates are booleans that never throw', () => {
  // isSupported(): false in a bare sandbox, false when SVG or CSS filter
  // support is missing, true with the canvas + CSS.supports mocks.
  assert.equal(createHarness({ bare: true }).BSLens.isSupported(), false);
  assert.equal(createHarness({ svg: false }).BSLens.isSupported(), false);
  assert.equal(createHarness({ css: false }).BSLens.isSupported(), false);

  const supported = createHarness();
  assert.equal(typeof supported.BSLens.isSupported(), 'boolean');
  assert.equal(supported.BSLens.isSupported(), true);
  assert.equal(supported.BSLens._diagnostics.supports, true);

  // isEnabled(): both reduced gates clear → true; either gate set → false;
  // absent matchMedia → false, never a throw.
  assert.equal(createHarness().BSLens.isEnabled(), true);
  assert.equal(
    createHarness({ media: { '(prefers-reduced-motion: reduce)': true } }).BSLens.isEnabled(),
    false
  );
  assert.equal(
    createHarness({ media: { '(prefers-reduced-transparency: reduce)': true } })
      .BSLens.isEnabled(),
    false
  );
  assert.equal(createHarness({ noMatchMedia: true }).BSLens.isEnabled(), false);
});

test('unsupported init() performs zero DOM side effects', () => {
  const harn = createHarness({ css: false });
  assert.equal(harn.BSLens.isSupported(), false);
  assert.equal(harn.BSLens.init(), false);

  assert.equal(harn.topbar.style._props.size, 0);
  assert.equal(harn.topbar.hasAttribute('data-rim'), false);
  assert.equal(harn.document.body.children.length, 0);
  assert.equal(harn.document.head.children.length, 0);
  assert.equal(harn.document.body.children.filter(el => el.id === 'lg-defs').length, 0);
  assert.equal(harn.document.head.children.filter(el => el.id === 'bslens-styles').length, 0);
});

test('mount() and refresh() after an unsupported init() mutate nothing', () => {
  const harn = createHarness({ css: false });
  assert.equal(harn.BSLens.isSupported(), false);
  assert.equal(harn.BSLens.init(), false);
  const skipped = harn.BSLens._diagnostics.skipped;

  // The latch: support cannot appear mid-page, so a now-passing probe does
  // not talk the already-decided engine into mounting.
  harn.sandbox.CSS.supports = () => true;
  assert.equal(harn.BSLens.init(), false);

  // The finding-2 path: the public API must stay inert after that init.
  assert.equal(harn.BSLens.mount(), 0);
  assert.equal(harn.BSLens.refresh(), 0);
  assert.equal(harn.BSLens._diagnostics.skipped, skipped + 2);

  assert.equal(harn.topbar.style._props.size, 0);
  assert.equal(harn.tabbar.style._props.size, 0);
  assert.equal(harn.topbar.hasAttribute('data-rim'), false);
  assert.equal(harn.document.head.children.length, 0);
  assert.equal(harn.document.body.children.length, 0);
  assert.equal(harn.BSLens._diagnostics.mounts, 0);
  assert.equal(harn.BSLens._diagnostics.backdrops, 0);
  assert.equal(harn.BSLens._diagnostics.rims, 0);
});

test('supported init mounts the topbar lens and prepends one style + one defs', () => {
  const harn = createHarness();
  assert.equal(harn.BSLens.init(), true);

  const filter = inline(harn.topbar, '--lg-filter');
  assert.match(filter, /^url\("#bslens-backdrop-\d+"\)$/);
  assert.match(inline(harn.topbar, 'background-image'), /^url\("data:image\/png/);
  assert.equal(harn.topbar.hasAttribute('data-rim'), true);
  assert.equal(inline(harn.topbar, 'background-size'), '100% 100%');

  const styles = harn.document.head.children.filter(el => el.id === 'bslens-styles');
  assert.equal(styles.length, 1);
  assert.equal(harn.document.head.children[0].id, 'bslens-styles');

  const defs = harn.document.body.children.filter(el => el.id === 'lg-defs');
  assert.equal(defs.length, 1);
  assert.equal(harn.document.body.children.length, 1);

  // `.tabbar` is display:none in this stub, so it must get nothing.
  assert.equal(harn.tabbar.style._props.size, 0);
  assert.equal(harn.tabbar.hasAttribute('data-rim'), false);
});

test('a visible tabbar mounts a second lens: two surfaces, two filters, two rims', () => {
  const harn = createHarness({ tabbar: { width: 390, height: 56, display: 'flex' } });
  assert.equal(harn.BSLens.init(), true);

  const filterUrl = /^url\("#bslens-backdrop-\d+"\)$/;
  const topbarFilter = inline(harn.topbar, '--lg-filter');
  const tabbarFilter = inline(harn.tabbar, '--lg-filter');
  assert.match(topbarFilter, filterUrl);
  assert.match(tabbarFilter, filterUrl);
  // Different geometry means a different map, so the two lenses are distinct.
  assert.notEqual(tabbarFilter, topbarFilter);

  for (const surface of [harn.topbar, harn.tabbar]) {
    assert.match(inline(surface, 'background-image'), /^url\("data:image\/png/);
    assert.equal(inline(surface, 'background-size'), '100% 100%');
    assert.equal(surface.hasAttribute('data-rim'), true);
  }

  const defs = harn.document.body.children.filter(el => el.id === 'lg-defs');
  assert.equal(defs.length, 1);
  assert.equal(defs[0].children.length, 1, 'one <defs>');
  assert.equal(defs[0].children[0].children.length, 2, 'one filter per lens');

  assert.equal(harn.BSLens._diagnostics.mounts, 2);
  assert.equal(harn.BSLens._diagnostics.backdrops, 2);
  assert.equal(harn.BSLens._diagnostics.rims, 2);
});

test('a theme flip repaints the rim once per change, via data-theme and the colour-scheme query', () => {
  const harn = createHarness();
  assert.equal(harn.BSLens.init(), true);

  const html = harn.document.documentElement;
  const themeObserver = harn.record.observers.find(
    observer => observer.targets.indexOf(html) !== -1
  );
  assert.ok(themeObserver, 'a data-theme observer is registered on <html>');

  const before = harn.BSLens._diagnostics.repaints;
  const lightRim = inline(harn.topbar, 'background-image');
  assert.match(lightRim, /^url\("data:image\/png/);

  html.setAttribute('data-theme', 'dark');
  themeObserver.callback();
  assert.equal(harn.BSLens._diagnostics.repaints, before + 1);
  const darkRim = inline(harn.topbar, 'background-image');
  assert.notEqual(darkRim, lightRim, 'a dark rim repaints the background image');

  // A second tick with no theme change is a no-op, not a second repaint.
  themeObserver.callback();
  assert.equal(harn.BSLens._diagnostics.repaints, before + 1);
  assert.equal(inline(harn.topbar, 'background-image'), darkRim);

  // The colour-scheme query is the other driver: with no data-theme the
  // system preference decides, and the cached light rim comes back verbatim.
  html.removeAttribute('data-theme');
  harn.media.set('(prefers-color-scheme: dark)', false);
  harn.media.fire('(prefers-color-scheme: dark)');
  assert.equal(harn.BSLens._diagnostics.repaints, before + 2);
  assert.equal(inline(harn.topbar, 'background-image'), lightRim);
  assert.equal(harn.BSLens._diagnostics.frames, 0);
});

test('WebKit capability exclusion: rim paints, --lg-filter never does', () => {
  const harn = createHarness({ userAgent: WEBKIT_UA });
  assert.equal(harn.BSLens.init(), true);

  assert.equal(inline(harn.topbar, '--lg-filter'), '');
  assert.equal(harn.topbar.style.has('--lg-filter'), false);
  assert.match(inline(harn.topbar, 'background-image'), /^url\("data:image\/png/);
  assert.equal(harn.topbar.hasAttribute('data-rim'), true);
});

test('reduced motion or transparency toggles unmount and remount live', () => {
  const harn = createHarness();
  assert.equal(harn.BSLens.init(), true);
  assert.equal(harn.topbar.style.has('--lg-filter'), true);

  for (const query of [
    '(prefers-reduced-motion: reduce)',
    '(prefers-reduced-transparency: reduce)'
  ]) {
    harn.media.set(query, true);
    harn.media.fire(query);

    assert.equal(harn.topbar.style._props.size, 0);
    assert.equal(harn.topbar.hasAttribute('data-rim'), false);
    assert.equal(harn.document.body.children.length, 0);
    assert.equal(harn.document.head.children.length, 0);

    harn.media.set(query, false);
    harn.media.fire(query);

    assert.equal(harn.topbar.style.has('--lg-filter'), true);
    assert.equal(harn.topbar.hasAttribute('data-rim'), true);
    assert.equal(
      harn.document.head.children.filter(el => el.id === 'bslens-styles').length,
      1
    );
    assert.equal(harn.document.body.children.filter(el => el.id === 'lg-defs').length, 1);
  }
});

test('destroy() removes every node, property and observer, and is idempotent', () => {
  const harn = createHarness();
  assert.equal(harn.BSLens.init(), true);
  assert.ok(harn.record.observers.length >= 2);

  assert.equal(harn.BSLens.destroy(), true);
  assert.equal(harn.topbar.style._props.size, 0);
  assert.equal(harn.topbar.hasAttribute('data-rim'), false);
  assert.equal(harn.document.body.children.length, 0);
  assert.equal(harn.document.head.children.length, 0);
  for (const observer of harn.record.observers) {
    assert.equal(observer.disconnected, true);
  }

  assert.doesNotThrow(() => harn.BSLens.destroy());
  assert.equal(harn.BSLens.destroy(), true);
});

test('destroy() is complete: a fresh init() remounts, a late DOMContentLoaded never does', () => {
  // 1. Teardown clears the caches and the latched probe, so the next init is
  // a clean remount: new nodes, no duplicate filters, no stale rim.
  const harn = createHarness();
  assert.equal(harn.BSLens.init(), true);
  const firstFilter = inline(harn.topbar, '--lg-filter');
  const firstRim = inline(harn.topbar, 'background-image');

  assert.equal(harn.BSLens.destroy(), true);
  assert.equal(harn.BSLens.init(), true);

  const secondFilter = inline(harn.topbar, '--lg-filter');
  assert.match(secondFilter, /^url\("#bslens-backdrop-\d+"\)$/);
  assert.notEqual(secondFilter, firstFilter, 'a fresh filter, not the removed one');
  assert.notEqual(inline(harn.topbar, 'background-image'), firstRim, 'a fresh rim');
  assert.equal(harn.topbar.hasAttribute('data-rim'), true);
  assert.equal(harn.topbar.style._props.size, 6);

  assert.equal(
    harn.document.head.children.filter(el => el.id === 'bslens-styles').length,
    1
  );
  const defs = harn.document.body.children.filter(el => el.id === 'lg-defs');
  assert.equal(defs.length, 1);
  assert.equal(defs[0].children.length, 1, 'one <defs>');
  assert.equal(defs[0].children[0].children.length, 1, 'one filter, not two');
  assert.equal(harn.BSLens._diagnostics.mounts, 2);
  // The map cache went with the teardown, so the remount repaints its map
  // instead of reusing the data URL the destroyed lens owned.
  assert.equal(harn.BSLens._diagnostics.maps, 2);

  // 2. A boot still pending when destroy() runs is cancelled: the flag the
  // runner reads keeps the parser's DOMContentLoaded from re-mounting.
  const late = createHarness({ readyState: 'loading' });
  assert.equal(late.document._listeners.filter(entry => entry.type === 'DOMContentLoaded').length, 1);

  assert.equal(late.BSLens.destroy(), true);
  for (const entry of late.document._listeners) {
    if (entry.type === 'DOMContentLoaded') entry.handler();
  }

  assert.equal(late.document.head.children.length, 0);
  assert.equal(late.document.body.children.length, 0);
  assert.equal(late.topbar.style._props.size, 0);
  assert.equal(late.BSLens._diagnostics.mounts, 0);
});

test('filter ids are stable across a no-op refit, re-minted on geometry change, and no rAF runs', () => {
  const harn = createHarness();
  assert.equal(harn.BSLens.init(), true);

  const first = inline(harn.topbar, '--lg-filter');
  assert.match(first, /bslens-backdrop-1/);

  harn.BSLens.refresh();
  assert.equal(inline(harn.topbar, '--lg-filter'), first);

  harn.topbar.offsetWidth = 300;
  harn.BSLens.refresh();
  const second = inline(harn.topbar, '--lg-filter');
  assert.notEqual(second, first);
  assert.match(second, /bslens-backdrop-2/);

  assert.equal(harn.BSLens._diagnostics.frames, 0);
  assert.equal(harn.record.raf, 0);
});
