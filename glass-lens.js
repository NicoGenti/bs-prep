/* glass-lens.js — bs-prep liquid-glass lens engine (engine core, phase P-1).

   PROVENANCE / ATTRIBUTION
   Technique ported from: Glisse (https://github.com/0kzh/glisse)
   Upstream pin: npm package 0.5.0, gitHead 46be5ba0 (the pin is the commit: the
   v0.5.0 git tag points to an older tree, 433fc171).
   Author / copyright: MIT (c) 2026 Kelvin Zhang.
   What is used: ONLY the refraction technique (canvas displacement maps +
   SVG feDisplacementMap filter chain), written here as a logic-equivalent
   vanilla port — not a verbatim TypeScript copy. No upstream source is vendored.
   Full license text and obligations: docs/third-party-notices.md.

   CONTRACT: classic script (no modules, no build step). It publishes
   window.BSLens and, once the document is interactive, bootstraps itself.

   P-1 scope: the engine core — token config, displacement map, rim map, filter
   builder and lens geometry.
   P-2 scope: the mount layer. Each approved surface (`.topbar`, and the mobile
   `.tabbar` when it is displayed) gets the lens where it already has its frost:
   the filter is published as `--lg-filter` and consumed by one declaration per
   surface in styles.css / mobile-glass.css, so the REAL page content scrolling
   under the glass is what bends. No backdrop copy, no covering element and no
   per-frame loop — the browser refilters on its own as the backdrop changes.
   The rim is painted inline over the surface's own background, and every gate
   (support, reduced motion, reduced transparency) and the theme repaint live
   here.

   The `_internals` view on the published object is a test seam for the P-3
   sandbox suite, not part of the public contract. */
(function (root) {
  'use strict';

  var VERSION = '1.0.0-port.1';
  var SOURCE = 'glisse@v0.5.0/46be5ba0';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* Subtle defaults, mirrored by the injected CSS tokens in P-2. The two
     references are the values the filter's factors are calibrated to, so at
     the defaults the three passes use the pinned 1.035 / 1.0 / 0.965 split. */
  var BEND_REFERENCE = 0.30;
  var DISPERSION_REFERENCE = 0.25;
  var RIM_SHINE = 0.30;
  var RIM_SHINE_OUTER = 0.13;

  /* The rim light iOS draws: a line brightest at the very edge and gone 1.22px
     in, over the glass's 0.5px edge line. */
  var RIM_WIDTH = 1.22;
  var EDGE_WIDTH = 0.5;

  /* How far the generated backdrop reaches past the lens on every side. */
  var RIM_MARGIN = 32;
  var MAP_SAMPLES = 128;
  var MAP_CACHE_LIMIT = 24;
  var RIM_CACHE_LIMIT = 16;

  /* Standalone box for buildSvgFilter calls that supply no shape (tests). */
  var FILTER_BOX = { width: 128, height: 48, radius: 14 };

  var _diagnostics = {
    supports: false,
    mounts: 0,
    frames: 0,
    repaints: 0,
    maps: 0,
    filters: 0,
    backdrops: 0,
    rims: 0,
    skipped: 0,
    errors: 0
  };

  /* Feature detection only — no DOM writes. Returns false (never throws) when
     SVG, a 2d canvas context, or CSS filter url() support is missing,
     including in DOM-less sandboxes (node vm). `isWebKit` below is the one
     place this engine reads the UA, and it is a capability split, not a
     feature test. */
  function isSupported() {
    var supported = (typeof SVGElement !== 'undefined') &&
      (function () {
        try { return !!document.createElement('canvas').getContext('2d'); }
        catch (err) { return false; }
      })() &&
      (function () {
        try { return !!(root.CSS && root.CSS.supports && root.CSS.supports('filter', 'url(#lg-test)')); }
        catch (err) { return false; }
      })();
    _diagnostics.supports = supported;
    return supported;
  }

  /* Defensive contract: media-query evaluation is best-effort. A missing
     matchMedia (older engines, mock/sandbox environments) or any throw is
     treated as "effects off" — isEnabled() returns false instead of throwing,
     so the lens can never mount by accident. */
  function isEnabled() {
    try {
      if (typeof root.matchMedia !== 'function') return false;
      if (root.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      if (root.matchMedia('(prefers-reduced-transparency: reduce)').matches) return false;
      return true;
    } catch (err) {
      return false;
    }
  }

  /* ---- engine split ------------------------------------------------------ */

  /* The one UA read in this file, and it exists because upstream's does:
     lens.ts:289-291 (`boxUnits`) draws exactly this line. WebKit — Safari,
     and every browser on iOS, which are all WebKit underneath — puts an SVG
     filter on HTML in bounding-box units and paints none of its output
     outside the element (lens.ts:28-34), so a bend built in px would land at
     the wrong scale and clipped. There the glass keeps its frost and paints
     its rim, and does not bend. Chromium and Gecko are excluded from this
     branch by the Chromium token, as upstream does; whether the bend mounts
     is backdropCapable's separate call. Everything else in this engine is a
     feature check. */
  function isWebKit() {
    try {
      var browser = root.navigator;
      var agent = browser && browser.userAgent ? String(browser.userAgent) : '';
      return /AppleWebKit\//.test(agent) && !/Chrom(?:e|ium)\//.test(agent);
    } catch (err) {
      return false;
    }
  }

  /* Whether this engine can bend its own backdrop: the platform must accept a
     filter reference inside `backdrop-filter`, AND it must be a Chromium
     engine. This is upstream-parity — it mirrors `refractsBackdrop`
     (refraction.ts:209) — because the url-reference render path is only
     proven on Blink: WebKit cannot paint the filter's output outside the
     element (see isWebKit), and Gecko's url-reference rendering cannot be
     verified in this rig. Both therefore join in the frost + rim only, so the
     untested render path is never mounted. Any throw, or a missing
     CSS.supports, reads as "no bend" — the rim still paints, because the rim
     needs no filter. */
  function backdropCapable() {
    var capable = false;
    try {
      var css = root.CSS;
      var browser = root.navigator;
      var agent = browser && browser.userAgent ? String(browser.userAgent) : '';
      capable = !!(css && typeof css.supports === 'function' &&
        css.supports('backdrop-filter', 'url(#lg-probe)') &&
        /Chrom(?:e|ium)\//.test(agent));
    } catch (err) {
      _diagnostics.errors += 1;
      capable = false;
    }
    return capable;
  }

  /* ---- plumbing ---------------------------------------------------------- */

  function documentRef() {
    return root && root.document ? root.document : null;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  /* Signed distance to a rounded rectangle centred on the origin; negative
     inside. Shared by the displacement map and the rim painter. */
  function distance(x, y, halfWidth, halfHeight, radius) {
    var qx = Math.abs(x) - halfWidth + radius;
    var qy = Math.abs(y) - halfHeight + radius;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
  }

  function readStyle(element) {
    var getter = root.getComputedStyle;
    if (typeof getter !== 'function' || !element) return null;
    try {
      return getter.call(root, element);
    } catch (err) {
      _diagnostics.errors += 1;
      return null;
    }
  }

  function readNumber(style, name, fallback) {
    if (!style || typeof style.getPropertyValue !== 'function') return fallback;
    var parsed = parseFloat(style.getPropertyValue(name));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  /* Lens settings, read off a surface at fit time and again on every repaint,
     so a token changed from CSS or script takes effect on the next pass. Each
     token falls back to the subtle default when it is missing or not a
     number; nothing here can throw. */
  function config(element) {
    var style = readStyle(element);
    return {
      bend: Math.max(0, readNumber(style, '--lg-bend', BEND_REFERENCE)),
      dispersion: Math.max(0, readNumber(style, '--lg-dispersion', DISPERSION_REFERENCE)),
      shine: clamp(readNumber(style, '--lg-rim-shine', RIM_SHINE), 0, 1),
      shineOuter: clamp(readNumber(style, '--lg-rim-shine-outer', RIM_SHINE_OUTER), 0, 1)
    };
  }

  function configKey(settings) {
    return [settings.bend, settings.dispersion, settings.shine, settings.shineOuter].join('|');
  }

  /* A surface's size and corner radius, in CSS px, or null while it has no
     size. The radius handles the % form the stylesheets may use. */
  function track(element, style) {
    if (!element) return null;
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    if (!width || !height) return null;
    var computed = style || readStyle(element);
    var corner = computed ? String(computed.borderTopLeftRadius || '0px') : '0px';
    var raw = corner.slice(-1) === '%'
      ? (Math.min(width, height) * parseFloat(corner)) / 100
      : parseFloat(corner);
    if (!Number.isFinite(raw) || raw < 0) raw = 0;
    return {
      width: width,
      height: height,
      radius: Math.min(width / 2, height / 2, raw)
    };
  }

  /* Bounded caches: insertion-ordered FIFO eviction. Keys are deterministic
     strings of every input that changes the pixels. */
  function remember(cache, key, value, limit) {
    cache.set(key, value);
    while (cache.size > limit) {
      var oldest = cache.keys().next();
      if (oldest.done) break;
      cache.delete(oldest.value);
    }
    return value;
  }

  function svgElement(name, attributes) {
    var doc = documentRef();
    if (!doc || typeof doc.createElementNS !== 'function') return null;
    var element = doc.createElementNS(SVG_NS, name);
    if (!element) return null;
    if (attributes) {
      for (var key in attributes) {
        if (!Object.prototype.hasOwnProperty.call(attributes, key)) continue;
        var value = attributes[key];
        if (value === undefined || value === null) continue;
        element.setAttribute(key, String(value));
      }
    }
    return element;
  }

  function attach(parent, child) {
    if (parent && child && typeof parent.appendChild === 'function') parent.appendChild(child);
    return child;
  }

  /* Canvas → PNG data URL. An empty string means the canvas refused to
     encode; the painters treat that as "no map" rather than throwing. */
  function pngDataURL(canvas) {
    try {
      var url = canvas.toDataURL();
      return url && url.indexOf('data:image') === 0 ? url : '';
    } catch (err) {
      _diagnostics.errors += 1;
      return '';
    }
  }

  /* ---- displacement map -------------------------------------------------- */

  /* Snell's law through the rim: a quarter-power squircle surface, light
     entering at an index of 1.5, sampled 128 times across the bevel.
     `maximum` is the longest pull and becomes the displacement scale. */
  function profile(bezel, thickness) {
    var samples = new Float32Array(MAP_SAMPLES);
    var maximum = 0;
    for (var i = 0; i < samples.length; i++) {
      var t = Math.max(0.001, i / (samples.length - 1));
      var surface = Math.pow(1 - Math.pow(1 - t, 4), 0.25);
      var incident = Math.atan(Math.pow(1 - t, 3) / Math.pow(surface, 3));
      var refracted = Math.asin(Math.sin(incident) / 1.5);
      samples[i] = Math.tan(incident - refracted) * (thickness + surface * bezel);
      maximum = Math.max(maximum, samples[i]);
    }
    return { samples: samples, maximum: maximum };
  }

  /* Paints the lens's maps: a displacement field for the filter, and the two
     rim highlights the surface paints over its frost. Returns PNG data URLs,
     or null when the environment has no canvas. The field is greys only —
     128 neutral, red for the pull across, green for the pull down — because
     a wide-gamut Chromium converts a map's colours before displacing by
     them, and an alpha of 255 keeps the field opaque everywhere. */
  function paintMap(shape, density) {
    var doc = documentRef();
    if (!doc || !shape || !shape.width || !shape.height) return null;

    var width = shape.width;
    var height = shape.height;
    var radius = clamp(shape.radius || 0, 0, Math.min(width, height) / 2);
    var pixels = density || Math.min(root.devicePixelRatio || 1, 2);
    var columns = Math.max(1, Math.ceil(width * pixels));
    var rows = Math.max(1, Math.ceil(height * pixels));
    var bezel = clamp(Math.min(width, height) * 0.12, 4, 10);
    var thickness = clamp(Math.min(width, height) * 0.2, 8, 24);
    var curve = profile(bezel, thickness);
    if (!(curve.maximum > 0)) return null;

    var canvas = doc.createElement('canvas');
    if (!canvas) return null;
    canvas.width = columns;
    canvas.height = rows;
    var context = canvas.getContext ? canvas.getContext('2d') : null;
    if (!context) return null;

    var field = context.createImageData(columns, rows);
    var shine = context.createImageData(columns, rows);
    var bright = context.createImageData(columns, rows);
    if (!field || !shine || !bright) return null;

    var samples = curve.samples;
    var maximum = curve.maximum;
    var quarter = Math.SQRT1_2;

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < columns; x++) {
        var px = ((x + 0.5) * width) / columns - width / 2;
        var py = ((y + 0.5) * height) / rows - height / 2;
        var qx = Math.abs(px) - (width / 2 - radius);
        var qy = Math.abs(py) - (height / 2 - radius);
        var ox = Math.max(qx, 0);
        var oy = Math.max(qy, 0);
        var length = Math.hypot(ox, oy);
        var depth = radius - (length + Math.min(Math.max(qx, qy), 0));
        var nx = length > 0 ? (ox / length) * Math.sign(px) : qx > qy ? Math.sign(px) : 0;
        var ny = length > 0 ? (oy / length) * Math.sign(py) : qx > qy ? 0 : Math.sign(py);

        // The pull at this point, from the Snell profile along the bevel.
        var shift = 0;
        if (depth >= 0 && depth < bezel) {
          var sample = (depth / bezel) * (samples.length - 1);
          var lower = Math.floor(sample);
          var a = samples[lower];
          var b = samples[Math.min(lower + 1, samples.length - 1)];
          shift = a + (b - a) * (sample - lower);
        }

        var at = (y * columns + x) * 4;
        field.data[at] = Math.round(127.5 + ((nx * shift) / maximum) * 127.5);
        field.data[at + 1] = Math.round(127.5 + ((ny * shift) / maximum) * 127.5);
        field.data[at + 2] = 128;
        field.data[at + 3] = 255;

        // The rim highlight: a light from the top left and its reflection.
        var light = -(nx + ny) * quarter;
        var glint = Math.pow(Math.max(light, 0), 3);
        var reflected = Math.pow(Math.max(-light, 0), 3);
        shine.data[at] = shine.data[at + 1] = shine.data[at + 2] = 255;

        var alpha = 0;
        if (depth >= 0) {
          var bands = [
            Math.exp(-Math.pow((depth - 0.18) / 0.22, 2)),
            Math.exp(-Math.pow((depth - 0.42) / 0.22, 2)),
            Math.exp(-Math.pow((depth - 0.66) / 0.22, 2))
          ];
          var peak = Math.max(bands[0], bands[1], bands[2]);
          alpha = peak * (0.06 + 0.8 * glint + 0.35 * reflected) * 0.85;
          for (var channel = 0; channel < 3; channel++) {
            shine.data[at + channel] = Math.round(255 * (0.65 + 0.35 * (peak ? bands[channel] / peak : 0)));
          }
          // The brighter rim a light page shows: a wider white line inside.
          var wide = [
            Math.exp(-Math.pow((depth - 0.4) / 0.4, 2)),
            Math.exp(-Math.pow((depth - 0.5) / 0.4, 2)),
            Math.exp(-Math.pow((depth - 0.6) / 0.4, 2))
          ];
          var top = Math.max(wide[0], wide[1], wide[2]);
          for (var tint = 0; tint < 3; tint++) {
            bright.data[at + tint] = Math.round(255 * (0.85 + 0.15 * (top ? wide[tint] / top : 0)));
          }
          bright.data[at + 3] = Math.round(clamp(top * (0.55 + 0.3 * glint + 0.15 * reflected), 0, 1) * 255);
        }
        shine.data[at + 3] = Math.round(clamp(alpha, 0, 1) * 255);
      }
    }

    context.putImageData(field, 0, 0);
    var displacement = pngDataURL(canvas);
    context.putImageData(shine, 0, 0);
    var highlight = pngDataURL(canvas);
    context.putImageData(bright, 0, 0);
    var brightHighlight = pngDataURL(canvas);
    if (!displacement) return null;

    _diagnostics.maps += 1;
    return {
      columns: columns,
      rows: rows,
      density: pixels,
      displacement: displacement,
      highlight: highlight,
      brightHighlight: brightHighlight,
      scale: maximum * 2
    };
  }

  /* The displacement pixels depend only on the lens's size, corner radius and
     pixel density; the tokens scale the filter, not the map, so they stay out
     of this key. The cache is FIFO-capped so a resize storm cannot grow it. */
  var mapCache = new Map();

  function mapFor(shape, density) {
    var pixels = density || Math.min(root.devicePixelRatio || 1, 2);
    var key = ['map', shape.width, shape.height, shape.radius, pixels].join('|');
    var cached = mapCache.get(key);
    if (cached) return cached;
    var painted = paintMap(shape, pixels);
    return painted ? remember(mapCache, key, painted, MAP_CACHE_LIMIT) : null;
  }

  /* ---- rim map ----------------------------------------------------------- */

  /* The light on the rim, white over the edge line, at `density` pixels to
     the CSS px. Returns RGBA bytes: brightest along the lit sides, gone over
     the corners between, a little wider where the light faces. */
  function rimMap(shape, shine, density, edge) {
    var width = shape.width;
    var height = shape.height;
    var columns = Math.max(1, Math.round(width * density));
    var rows = Math.max(1, Math.round(height * density));
    var data = new Uint8ClampedArray(columns * rows * 4);
    var halfWidth = width / 2;
    var halfHeight = height / 2;
    var corner = clamp(shape.radius || 0, 0, Math.min(halfWidth, halfHeight));
    var half = 0.5 / density;

    for (var row = 0; row < rows; row++) {
      for (var column = 0; column < columns; column++) {
        var x = ((column + 0.5) / columns) * width - halfWidth;
        var y = ((row + 0.5) / rows) * height - halfHeight;
        var depth = -distance(x, y, halfWidth, halfHeight, corner);
        if (depth < -half || depth > 2 * RIM_WIDTH) continue;

        // The nearest edge's outward normal.
        var qx = Math.abs(x) - halfWidth + corner;
        var qy = Math.abs(y) - halfHeight + corner;
        var nx = 0;
        var ny = 0;
        if (qx > 0 && qy > 0) {
          var length = Math.hypot(qx, qy);
          nx = (Math.sign(x) * qx) / length;
          ny = (Math.sign(y) * qy) / length;
        } else if (qx > qy) {
          nx = Math.sign(x);
        } else {
          ny = Math.sign(y);
        }

        // 1 along the lit sides, sqrt 2 on the corners they meet at, 0 on
        // the others; the light fades out along the first 1.22px.
        var facing = Math.abs(nx + ny);
        var along = Math.max(0, depth) / (RIM_WIDTH * Math.sqrt(Math.max(1, facing)));
        var cover = clamp((depth + half) * density, 0, 1);
        var lined = clamp((Math.min(EDGE_WIDTH, depth + half) - Math.max(0, depth - half)) * density, 0, 1);
        var light = along < 1 ? shine * Math.pow(Math.min(1, facing), 1.5) * (1 - Math.pow(along, 1.5)) * cover : 0;
        var line = edge[3] * lined * (1 - light);
        var alpha = light + line;
        if (alpha <= 0) continue;

        var i = (row * columns + column) * 4;
        for (var channel = 0; channel < 3; channel++) {
          data[i + channel] = Math.round((255 * light + edge[channel] * line) / alpha);
        }
        data[i + 3] = Math.round(255 * alpha);
      }
    }
    return { columns: columns, rows: rows, data: data };
  }

  /* A CSS colour as sRGB bytes and alpha, by the canvas's own parsing. The
     `#0000` sentinel is written first, and read back, because a rejected
     assignment leaves `fillStyle` untouched: an unparsable `--lg-edge` thus
     reads back identical to the sentinel and becomes fully transparent,
     instead of the opaque black the hex branch would otherwise derive from
     it. */
  function parseColour(context, colour) {
    var value;
    var sentinel;
    try {
      context.fillStyle = '#0000';
      sentinel = String(context.fillStyle);
      context.fillStyle = colour || 'transparent';
      value = String(context.fillStyle);
    } catch (err) {
      return [0, 0, 0, 0];
    }
    if (!value || value === sentinel) return [0, 0, 0, 0];
    if (value.charAt(0) === '#') {
      var hex = [1, 3, 5].map(function (at) { return parseInt(value.slice(at, at + 2), 16); });
      return [hex[0] || 0, hex[1] || 0, hex[2] || 0, 1];
    }
    var parts = (value.match(/[\d.]+/g) || []).map(Number);
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0, parts.length > 3 ? parts[3] : 1];
  }

  /* One scratch canvas only, for CSS colour parsing. */
  var palette;

  function paletteContext() {
    if (palette !== undefined) return palette;
    try {
      var doc = documentRef();
      var canvas = doc && doc.createElement ? doc.createElement('canvas') : null;
      palette = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    } catch (err) {
      palette = null;
    }
    return palette;
  }

  var rimCache = new Map();

  /* The rim light as a CSS background image, plus the key it was made for.
     `dark` picks --lg-rim-shine-outer over --lg-rim-shine; both are read on
     every repaint, so a theme flip only needs another call. Returns null when
     the surface cannot be measured or styled yet, and never throws. */
  function buildRim(element, dark) {
    var style = readStyle(element);
    if (!style) {
      _diagnostics.skipped += 1;
      return null;
    }
    var shape = track(element, style);
    if (!shape) {
      _diagnostics.skipped += 1;
      return null;
    }
    var settings = config(element);
    var shine = dark ? settings.shineOuter : settings.shine;
    var edge = [0, 0, 0, 0];
    var context = paletteContext();
    if (context) {
      var named = String(style.getPropertyValue('--lg-edge') || '').trim() || 'transparent';
      edge = parseColour(context, named);
    }
    var density = Math.min(root.devicePixelRatio || 1, 3);
    var key = [shape.width, shape.height, shape.radius, shine, edge.join(','), density].join('|');
    var cached = rimCache.get(key);
    if (cached) return cached;

    var pixels = rimMap(shape, shine, density, edge);
    var doc = documentRef();
    var canvas = doc && doc.createElement ? doc.createElement('canvas') : null;
    if (!canvas) {
      _diagnostics.skipped += 1;
      return null;
    }
    canvas.width = pixels.columns;
    canvas.height = pixels.rows;
    var drawing = canvas.getContext ? canvas.getContext('2d') : null;
    if (!drawing) {
      _diagnostics.skipped += 1;
      return null;
    }
    var image = drawing.createImageData(pixels.columns, pixels.rows);
    if (!image) {
      _diagnostics.skipped += 1;
      return null;
    }
    image.data.set(pixels.data);
    drawing.putImageData(image, 0, 0);
    var png = pngDataURL(canvas);
    if (!png) {
      _diagnostics.skipped += 1;
      return null;
    }

    _diagnostics.rims += 1;
    return remember(rimCache, key, {
      key: key,
      url: 'url("' + png + '")',
      shine: shine,
      density: density,
      width: shape.width,
      height: shape.height,
      radius: shape.radius
    }, RIM_CACHE_LIMIT);
  }

  /* ---- filter ------------------------------------------------------------ */

  var filterSerial = 0;

  /* A new id for every built filter. WebKit keeps drawing a filter's previous
     output until the id changes, so the P-2 mount layer mints one of these on
     each move-ready rebuild; the serial only grows and retains nothing. */
  function nextFilterId() {
    filterSerial += 1;
    return 'bslens-filter-' + filterSerial;
  }

  /* Builds (but does not insert) the filter that bends the backdrop: the
     displacement map as an feImage, then one pass per colour — red 3.5%
     further than green, blue 3.5% less — each isolated with an feColorMatrix
     and added back with arithmetic composites. The box is always
     userSpaceOnUse with explicit px, as in the pinned source's backdrop path,
     so no bounding-box compensation applies.

     The three factors are the pinned selection path's 1.035 / 1.0 / 0.965 at
     the reference dispersion of 0.25; --lg-dispersion widens or narrows the
     split linearly around it, and --lg-bend scales the map's own maximum
     reach around the 0.30 reference. At the defaults the three scales are
     exactly map.scale x 1.035 / 1.0 / 0.965. */
  function buildSvgFilter(id, options) {
    var doc = documentRef();
    if (!doc || typeof doc.createElementNS !== 'function') return null;

    var opts = options || {};
    var shape = opts.shape || FILTER_BOX;
    var density = opts.density || Math.min(root.devicePixelRatio || 1, 2);
    var map = opts.map || mapFor(shape, density);
    if (!map) {
      _diagnostics.skipped += 1;
      return null;
    }
    var region = opts.region || { x: 0, y: 0, width: shape.width, height: shape.height };
    var mapBox = opts.mapBox || { x: 0, y: 0, width: shape.width, height: shape.height };
    var settings = opts.config || (opts.glass ? config(opts.glass) : config(null));
    var bend = settings.bend / BEND_REFERENCE;
    var split = settings.dispersion / DISPERSION_REFERENCE;
    var strength = map.scale * (Number.isFinite(bend) ? bend : 1);

    var filter = svgElement('filter', {
      id: id,
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
      filterUnits: 'userSpaceOnUse',
      primitiveUnits: 'userSpaceOnUse',
      'color-interpolation-filters': 'sRGB'
    });
    if (!filter) return null;

    attach(filter, svgElement('feImage', {
      href: map.displacement,
      x: mapBox.x,
      y: mapBox.y,
      width: mapBox.width,
      height: mapBox.height,
      preserveAspectRatio: 'none',
      result: 'field'
    }));

    var channels = [
      ['r', 1.035, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'],
      ['g', 1, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0'],
      ['b', 0.965, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0']
    ];
    var factors = [];
    for (var i = 0; i < channels.length; i++) {
      var name = channels[i][0];
      var factor = 1 + (channels[i][1] - 1) * (Number.isFinite(split) ? split : 1);
      factors.push({ name: name, factor: factor, scale: strength * factor });
      attach(filter, svgElement('feDisplacementMap', {
        in: 'SourceGraphic',
        in2: 'field',
        scale: strength * factor,
        xChannelSelector: 'R',
        yChannelSelector: 'G',
        result: name + '-ray'
      }));
      attach(filter, svgElement('feColorMatrix', {
        in: name + '-ray',
        type: 'matrix',
        values: channels[i][2],
        result: name
      }));
    }
    attach(filter, svgElement('feComposite', { in: 'r', in2: 'g', operator: 'arithmetic', k2: 1, k3: 1, result: 'rg' }));
    attach(filter, svgElement('feComposite', { in: 'rg', in2: 'b', operator: 'arithmetic', k2: 1, k3: 1 }));

    _diagnostics.filters += 1;
    return {
      id: id,
      /* Deterministic key of every input that shaped this filter, so the P-2
         mount layer can tell a rebuild from a re-id. */
      key: [shape.width, shape.height, shape.radius, density, configKey(settings)].join('|'),
      element: filter,
      url: 'url("#' + id + '")',
      region: region,
      mapBox: mapBox,
      shape: shape,
      config: settings,
      scale: strength,
      factors: factors
    };
  }

  /* ---- geometry and follow loop ------------------------------------------ */

  function rectOf(element) {
    if (!element || typeof element.getBoundingClientRect !== 'function') return null;
    try {
      var box = element.getBoundingClientRect();
      if (!box || !box.width || !box.height) return null;
      return { left: box.left, top: box.top, width: box.width, height: box.height };
    } catch (err) {
      _diagnostics.errors += 1;
      return null;
    }
  }

  /* Geometry for one lens, with no DOM writes: the backdrop is the lens's
     viewport rect grown by the rim margin, and the filter's map box is the
     lens rect in the backdrop's own coordinates. Kept from P-1 as the
     geometry contract for a dedicated backdrop; the live-backdrop mount
     landed in P-2 needs no such box (the filter is drawn over the surface
     itself), so nothing in the mount layer calls this. Returns null when the
     lens is not measurable. */
  function mountLens(glassEl, backdropEl) {
    var shape = track(glassEl);
    if (!shape) {
      _diagnostics.skipped += 1;
      return null;
    }
    var at = rectOf(glassEl);
    if (!at) {
      _diagnostics.skipped += 1;
      return null;
    }
    var margin = RIM_MARGIN;
    var box = {
      left: at.left - margin,
      top: at.top - margin,
      width: at.width + margin * 2,
      height: at.height + margin * 2
    };
    // A backdrop already in the layout supplies its own origin; before P-2
    // inserts it, the box above stands in (so the map sits one margin in).
    var origin = backdropEl ? rectOf(backdropEl) : null;
    var from = origin || box;
    return {
      glass: glassEl,
      backdrop: backdropEl || null,
      shape: shape,
      margin: margin,
      density: Math.min(root.devicePixelRatio || 1, 2),
      config: config(glassEl),
      box: box,
      region: { x: 0, y: 0, width: box.width, height: box.height },
      mapBox: {
        x: at.left - from.left,
        y: at.top - from.top,
        width: at.width,
        height: at.height
      }
    };
  }

  /* ---- attached surfaces (P-2) ------------------------------------------- */

  /* P-2 design delta, USER-APPROVED: there is no follow loop any more. P-1
     drove one rAF that re-read every lens's rect and rebuilt its filter; with
     the lens living on the surface's own `backdrop-filter` the browser
     refilters the backdrop by itself whenever the content under it changes,
     so nothing here needs a frame. `follow()` and `stopFollow()` stay for the
     published contract and are event-driven no-ops: `follow()` reports
     whether anything is attached. `_diagnostics.frames` staying at 0 in
     steady state is the evidence that no frame loop is running, not a bug. */

  var STYLE_ID = 'bslens-styles';
  var DEFS_ID = 'lg-defs';
  var SURFACE_SELECTORS = ['.topbar', '.tabbar'];
  var BACKDROP_CACHE_LIMIT = 8;
  var BATCH_FALLBACK_MS = 32;

  /* Prepended to <head> while mounted: the four token defaults and the
     surface hook, and nothing else. No background, no blur, no saturate, no
     `--ui-*`, no `!important` — the frost stays the app's declaration, and
     the rim is painted inline (see applyRim for why it cannot be a rule). */
  var STYLE_TEXT = ':root{--lg-bend:.30;--lg-dispersion:.25;--lg-rim-shine:.30;--lg-rim-shine-outer:.13}' +
    '.topbar,.tabbar{--lg-rim:none}';

  var records = [];
  var started = false;
  /* The support probe's result, latched by the first init() and never
     re-taken: a browser that cannot bend its backdrop does not gain the
     ability mid-page, and a second probe after the first paint only adds
     noise. `null` is "not decided yet"; destroy() puts it back to `null` so a
     remounted engine starts from a clean probe. */
  var supportLatch = null;
  /* Set by destroy() so a DOMContentLoaded that lands after a teardown can
     never resurrect the engine: the boot runner checks it before init(). */
  var bootCancelled = false;
  var eventsBound = false;
  var boundEvents = [];
  var mediaWatches = [];
  var styleEl = null;
  var defsEl = null;
  var defsContainer = null;
  var themeObserver = null;
  var idleHandle = 0;
  var idleMode = '';
  var backdropSerial = 0;
  var backdrops = new Map();

  function pageHidden() {
    var doc = documentRef();
    return !!(doc && doc.visibilityState && doc.visibilityState !== 'visible');
  }

  function listen(target, type, handler) {
    if (!target || typeof target.addEventListener !== 'function') return false;
    try {
      target.addEventListener(type, handler, false);
      return true;
    } catch (err) {
      _diagnostics.errors += 1;
      return false;
    }
  }

  function bind(target, type, handler) {
    if (listen(target, type, handler)) boundEvents.push({ target: target, type: type, handler: handler });
  }

  /* A media query watched for as long as the engine lives, with the old
     addListener form for engines that predate addEventListener('change'). */
  function watch(query, handler) {
    if (typeof root.matchMedia !== 'function') return null;
    var media;
    try {
      media = root.matchMedia(query);
    } catch (err) {
      return null;
    }
    if (!media) return null;
    try {
      if (typeof media.addEventListener === 'function') media.addEventListener('change', handler);
      else if (typeof media.addListener === 'function') media.addListener(handler);
      else return null;
    } catch (err) {
      return null;
    }
    mediaWatches.push({ media: media, handler: handler });
    return media;
  }

  /* Both gates, live: the plan's reduced-motion and reduced-transparency
     queries each mount/unmount on toggle. */
  function watchGates() {
    watch('(prefers-reduced-motion: reduce)', applyGate);
    watch('(prefers-reduced-transparency: reduce)', applyGate);
  }

  function gated() {
    return !isEnabled();
  }

  function darkNow() {
    var doc = documentRef();
    var element = doc && doc.documentElement;
    var theme = element && typeof element.getAttribute === 'function'
      ? element.getAttribute('data-theme')
      : null;
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    try {
      return !!(root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (err) {
      return false;
    }
  }

  function visibleSurface(element) {
    if (!element || !element.offsetWidth || !element.offsetHeight) return false;
    var style = readStyle(element);
    if (!style) return false;
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return true;
  }

  /* The approved surfaces that are on screen right now, in document order per
     selector. `.tabbar` is `display:none` above the mobile breakpoint, so this
     is what keeps the mobile lens mobile — re-asked on every refit. */
  function approvedSurfaces() {
    var doc = documentRef();
    if (!doc || typeof doc.querySelectorAll !== 'function') return [];
    var found = [];
    for (var i = 0; i < SURFACE_SELECTORS.length; i++) {
      var list;
      try {
        list = doc.querySelectorAll(SURFACE_SELECTORS[i]);
      } catch (err) {
        continue;
      }
      for (var j = 0; j < list.length; j++) {
        var element = list[j];
        if (visibleSurface(element) && found.indexOf(element) === -1) found.push(element);
      }
    }
    return found;
  }

  function ensureStyle() {
    if (styleEl && styleEl.parentNode) return styleEl;
    var doc = documentRef();
    var head = doc && (doc.head || (doc.getElementsByTagName && doc.getElementsByTagName('head')[0]));
    if (!head || typeof doc.createElement !== 'function') return null;
    var element = doc.createElement('style');
    if (!element) return null;
    element.id = STYLE_ID;
    element.appendChild(doc.createTextNode(STYLE_TEXT));
    head.insertBefore(element, head.firstChild);
    styleEl = element;
    return element;
  }

  /* One hidden `<svg id="lg-defs">` on body, the only node this engine adds
     outside the surfaces and the style. Its filters are the only children. */
  function ensureDefs() {
    if (defsContainer && defsEl && defsEl.parentNode) return defsContainer;
    var doc = documentRef();
    if (!doc || !doc.body) return null;
    var svg = svgElement('svg', { id: DEFS_ID, width: 0, height: 0, 'aria-hidden': 'true' });
    var defs = svgElement('defs', {});
    if (!svg || !defs) return null;
    svg.setAttribute('style', 'position:absolute;pointer-events:none');
    attach(svg, defs);
    attach(doc.body, svg);
    defsEl = svg;
    defsContainer = defs;
    return defsContainer;
  }

  function releaseChrome() {
    if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    styleEl = null;
    if (defsEl && defsEl.parentNode) defsEl.parentNode.removeChild(defsEl);
    defsEl = null;
    defsContainer = null;
  }

  /* ---- the rim ----------------------------------------------------------- */

  /* The rim light P-1 already knows how to draw, painted as the surface's own
     background image — inline, and only inline. styles.css declares
     `background:var(--glass)` on the surface, and a shorthand declared later
     resets background-image, so an injected rule prepended to <head> loses the
     cascade (the rim would never paint) and one appended to <head> wins over
     the app's own background (the frost would go). Inline longhands beat both,
     and removeProperty() on teardown hands the surface back untouched.
     `--lg-rim` carries the same image as the published token upstream sets. */
  function applyRim(record, dark) {
    var element = record.el;
    var rim = buildRim(element, dark);
    if (!rim) return false;
    var key = rim.key + '|' + (dark ? 'dark' : 'light');
    if (record.rimKey === key) return true;
    element.style.setProperty('--lg-rim', rim.url);
    element.style.setProperty('background-image', rim.url);
    element.style.setProperty('background-size', '100% 100%');
    element.style.setProperty('background-position', '0 0');
    element.style.setProperty('background-repeat', 'no-repeat');
    if (element.setAttribute && element.hasAttribute && !element.hasAttribute('data-rim')) {
      element.setAttribute('data-rim', '');
    }
    record.rimKey = key;
    _diagnostics.repaints += 1;
    return true;
  }

  /* ---- the bend ---------------------------------------------------------- */

  function releaseEntry(entry) {
    if (!entry) return;
    entry.refs = Math.max(0, entry.refs - 1);
    if (entry.refs > 0) return;
    if (entry.element && entry.element.parentNode) entry.element.parentNode.removeChild(entry.element);
    backdrops.forEach(function (value, key) {
      if (value === entry) backdrops.delete(key);
    });
  }

  function rememberBackdrop(key, entry) {
    backdrops.set(key, entry);
    while (backdrops.size > BACKDROP_CACHE_LIMIT) {
      var oldest = backdrops.keys().next();
      if (oldest.done) break;
      var value = backdrops.get(oldest.value);
      // A surface still points at this filter: evicting it would leave a
      // mounted surface referencing a removed node, so FIFO stops here.
      if (value && value.refs > 0) break;
      backdrops.delete(oldest.value);
      if (value && value.element && value.element.parentNode) {
        value.element.parentNode.removeChild(value.element);
      }
    }
  }

  function dropBackdrop(record) {
    var entry = record.backdrop;
    record.backdrop = null;
    record.backdropKey = '';
    releaseEntry(entry);
  }

  /* Bends the surface's own backdrop: a single-lens filter in px over the
     surface's box (x:0 y:0 across/down, `box` false — upstream
     fitBackdropLens :857-878 and its `place(..., false)`), published as
     `--lg-filter`. Built once per geometry+config key and shared by any
     surface fitting the same key; a refit that finds the same key keeps the
     same id (no churn), a refit with a new key mints the next id. */
  function applyBackdrop(record) {
    var element = record.el;
    if (!element || !backdropCapable()) return false;
    var settings = config(element);
    var shape = track(element);
    if (!shape) {
      _diagnostics.skipped += 1;
      return false;
    }
    var density = Math.min(root.devicePixelRatio || 1, 2);
    var key = [shape.width, shape.height, shape.radius, density, configKey(settings)].join('|');
    if (record.backdropKey === key && record.backdrop) return true;

    var entry = backdrops.get(key);
    if (!entry) {
      backdropSerial += 1;
      var built = buildSvgFilter('bslens-backdrop-' + backdropSerial, {
        shape: shape,
        density: density,
        config: settings,
        region: { x: 0, y: 0, width: shape.width, height: shape.height },
        mapBox: { x: 0, y: 0, width: shape.width, height: shape.height }
      });
      if (!built) return false;
      var container = ensureDefs();
      if (!container) return false;
      attach(container, built.element);
      entry = {
        id: built.id,
        url: built.url,
        element: built.element,
        key: key,
        reach: built.scale,
        dispersion: settings.dispersion,
        refs: 0
      };
      rememberBackdrop(key, entry);
      _diagnostics.backdrops += 1;
    }

    var previous = record.backdrop;
    element.style.setProperty('--lg-filter', entry.url);
    record.backdrop = entry;
    record.backdropKey = key;
    entry.refs += 1;
    if (previous && previous !== entry) releaseEntry(previous);
    return true;
  }

  /* ---- attach, refit, detach --------------------------------------------- */

  function observeSurface(record) {
    var element = record.el;
    if (typeof root.ResizeObserver === 'function' && !record.resize) {
      try {
        record.resize = new root.ResizeObserver(schedule);
        record.resize.observe(element);
      } catch (err) {
        record.resize = null;
        _diagnostics.errors += 1;
      }
    }
    if (typeof root.MutationObserver === 'function' && !record.observer) {
      try {
        // Read-only: app.js:162 toggles `.scrolled` on the topbar as it scrolls.
        record.observer = new root.MutationObserver(schedule);
        record.observer.observe(element, { attributes: true, attributeFilter: ['class'] });
      } catch (err) {
        record.observer = null;
        _diagnostics.errors += 1;
      }
    }
  }

  function attachRecord(element) {
    var record = { el: element, backdrop: null, backdropKey: '', rimKey: '', resize: null, observer: null };
    if (!applyRim(record, darkNow())) return null;
    applyBackdrop(record);
    observeSurface(record);
    records.push(record);
    _diagnostics.mounts += 1;
    return record;
  }

  function teardownRecord(record) {
    var element = record.el;
    if (element && element.style && typeof element.style.removeProperty === 'function') {
      element.style.removeProperty('--lg-filter');
      element.style.removeProperty('--lg-rim');
      element.style.removeProperty('background-image');
      element.style.removeProperty('background-size');
      element.style.removeProperty('background-position');
      element.style.removeProperty('background-repeat');
    }
    if (element && element.removeAttribute) element.removeAttribute('data-rim');
    dropBackdrop(record);
    if (record.resize) {
      record.resize.disconnect();
      record.resize = null;
    }
    if (record.observer) {
      record.observer.disconnect();
      record.observer = null;
    }
  }

  /* Reconciles the attached set with what is on screen: a surface that went
     away (the tabbar above the breakpoint) is handed back, a surface that
     appeared is picked up, and the rest are refitted. */
  function syncSurfaces() {
    if (!started || gated() || supportLatch === false) return 0;
    var surfaces = approvedSurfaces();
    for (var i = records.length - 1; i >= 0; i--) {
      if (surfaces.indexOf(records[i].el) === -1) {
        teardownRecord(records[i]);
        records.splice(i, 1);
      }
    }
    if (!surfaces.length) {
      if (styleEl || defsEl) releaseChrome();
      return 0;
    }
    ensureStyle();
    for (var j = 0; j < surfaces.length; j++) {
      var element = surfaces[j];
      var record = null;
      for (var k = 0; k < records.length; k++) {
        if (records[k].el === element) {
          record = records[k];
          break;
        }
      }
      if (!record) {
        attachRecord(element);
        continue;
      }
      if (applyRim(record, darkNow())) applyBackdrop(record);
    }
    return records.length;
  }

  function repaintRims() {
    if (!started) return;
    var dark = darkNow();
    for (var i = 0; i < records.length; i++) {
      if (visibleSurface(records[i].el)) applyRim(records[i], dark);
    }
  }

  function unmountAll() {
    for (var i = 0; i < records.length; i++) teardownRecord(records[i]);
    records.length = 0;
    releaseChrome();
  }

  /* Refit batching: one idle callback (or one short timer where
     requestIdleCallback is missing) for a burst of resize/orientation/scroll
     class changes, never one refit per event. */
  function schedule() {
    if (!started || idleHandle) return;
    if (typeof root.requestIdleCallback === 'function') {
      try {
        idleHandle = root.requestIdleCallback(runScheduled, { timeout: 120 });
        idleMode = 'idle';
        return;
      } catch (err) {
        idleHandle = 0;
      }
    }
    if (typeof root.setTimeout !== 'function') return;
    idleHandle = root.setTimeout(runScheduled, BATCH_FALLBACK_MS);
    idleMode = 'timeout';
  }

  function runScheduled() {
    idleHandle = 0;
    idleMode = '';
    if (!started || gated()) return;
    syncSurfaces();
  }

  function cancelScheduled() {
    if (!idleHandle) return;
    try {
      if (idleMode === 'idle' && typeof root.cancelIdleCallback === 'function') {
        root.cancelIdleCallback(idleHandle);
      } else if (typeof root.clearTimeout === 'function') {
        root.clearTimeout(idleHandle);
      }
    } catch (err) {
      // A callback that still fires finds `started` false or nothing attached.
    }
    idleHandle = 0;
    idleMode = '';
  }

  function applyGate() {
    if (!started) return;
    if (gated()) {
      unmountAll();
      return;
    }
    syncSurfaces();
  }

  function onVisibility() {
    if (pageHidden()) {
      stopFollow();
      return;
    }
    if (started && !gated()) follow();
  }

  /* Theme reactivity is the engine's own: the app's data-theme attribute and
     the colour-scheme query, nothing from app.js/theme-boot.js. */
  function observeTheme() {
    var doc = documentRef();
    var element = doc && doc.documentElement;
    if (element && typeof root.MutationObserver === 'function' && !themeObserver) {
      try {
        themeObserver = new root.MutationObserver(repaintRims);
        themeObserver.observe(element, { attributes: true, attributeFilter: ['data-theme'] });
      } catch (err) {
        themeObserver = null;
        _diagnostics.errors += 1;
      }
    }
    watch('(prefers-color-scheme: dark)', repaintRims);
  }

  function bindEvents() {
    if (eventsBound) return;
    eventsBound = true;
    bind(root, 'resize', schedule);
    bind(root, 'orientationchange', schedule);
    bind(root, 'hashchange', schedule);
    var doc = documentRef();
    if (doc) bind(doc, 'visibilitychange', onVisibility);
    observeTheme();
  }

  function releaseEvents() {
    for (var i = 0; i < boundEvents.length; i++) {
      var entry = boundEvents[i];
      try {
        entry.target.removeEventListener(entry.type, entry.handler, false);
      } catch (err) {
        // Nothing left to detach.
      }
    }
    boundEvents.length = 0;
    for (var j = 0; j < mediaWatches.length; j++) {
      var watchEntry = mediaWatches[j];
      try {
        if (typeof watchEntry.media.removeEventListener === 'function') {
          watchEntry.media.removeEventListener('change', watchEntry.handler);
        } else if (typeof watchEntry.media.removeListener === 'function') {
          watchEntry.media.removeListener(watchEntry.handler);
        }
      } catch (err) {
        // Nothing left to detach.
      }
    }
    mediaWatches.length = 0;
    if (themeObserver) {
      themeObserver.disconnect();
      themeObserver = null;
    }
    eventsBound = false;
  }

  /* ---- follow contract (event-driven, see the P-2 note above) ------------ */

  function follow() {
    return records.length > 0;
  }

  function stopFollow() {
    return false;
  }

  /* ---- lifecycle --------------------------------------------------------- */

  /* Bootstrap: feature gate first, and its answer is latched. When
     unsupported this returns before any DOM write and before any listener, so
     an unsupported engine sees exactly the P-1 world — no style, no svg, no
     inline property, no observer. The latch is what keeps the PUBLIC contract
     honest: a later mount()/refresh() cannot mount either. */
  function init() {
    if (started) return records.length > 0;
    started = true;
    if (supportLatch === null) supportLatch = isSupported();
    if (!supportLatch) {
      _diagnostics.skipped += 1;
      return false;
    }
    watchGates();
    bindEvents();
    if (gated()) return false;
    return syncSurfaces() > 0;
  }

  /** Attach the lens to every approved surface on screen; returns the count. */
  function mount() {
    if (!started) return init();
    if (supportLatch === false) {
      _diagnostics.skipped += 1;
      return 0;
    }
    if (gated()) return 0;
    return syncSurfaces();
  }

  /** Hand one surface back (or all of them when called with no argument). */
  function unmount(target) {
    if (!target) {
      unmountAll();
      return 0;
    }
    for (var i = records.length - 1; i >= 0; i--) {
      if (records[i].el === target) {
        teardownRecord(records[i]);
        records.splice(i, 1);
      }
    }
    return records.length;
  }

  /** Refit geometry, the rim and the bend now (batched callers use schedule). */
  function refresh() {
    if (supportLatch === false) {
      _diagnostics.skipped += 1;
      return 0;
    }
    return syncSurfaces();
  }

  /* Full teardown: every node, property, timer, observer, listener and cache.
     The caches hold PNG data URLs and parsed palettes keyed by geometry; they
     are worthless once the engine is down and would otherwise pin megabytes
     for the life of the page. The latched support decision is cleared too, so
     a later init() probes again instead of inheriting a stale verdict. */
  function destroy() {
    bootCancelled = true;
    cancelScheduled();
    unmountAll();
    releaseEvents();
    backdrops.clear();
    mapCache.clear();
    rimCache.clear();
    palette = undefined;
    supportLatch = null;
    started = false;
    return true;
  }

  root.BSLens = {
    VERSION: VERSION,
    SOURCE: SOURCE,
    isSupported: isSupported,
    isEnabled: isEnabled,
    init: init,
    mount: mount,
    unmount: unmount,
    refresh: refresh,
    destroy: destroy,
    _diagnostics: _diagnostics,
    /* Test seam for the P-3 sandbox suite; not part of the published contract. */
    _internals: {
      config: config,
      configKey: configKey,
      track: track,
      profile: profile,
      paintMap: paintMap,
      buildSvgFilter: buildSvgFilter,
      buildRim: buildRim,
      mountLens: mountLens,
      nextFilterId: nextFilterId,
      follow: follow,
      stopFollow: stopFollow,
      isWebKit: isWebKit,
      backdropCapable: backdropCapable,
      visibleSurface: visibleSurface
    }
  };

  /* Auto-init: the script is the last one in the document, but it still runs
     while the tree is parsing, so the paint is complete by DOMContentLoaded.
     A sandbox with no document stays inert. The runner is guarded by
     `bootCancelled`: a teardown that happens before the document finishes
     parsing must not be undone by a DOMContentLoaded that lands afterwards. */
  function boot() {
    var doc = documentRef();
    if (!doc || !doc.documentElement) return;
    function run() {
      if (bootCancelled) return;
      try {
        init();
      } catch (err) {
        _diagnostics.errors += 1;
        try {
          destroy();
        } catch (inner) {
          // Nothing left to undo.
        }
      }
    }
    if (doc.readyState === 'loading' && typeof doc.addEventListener === 'function') {
      doc.addEventListener('DOMContentLoaded', run, false);
      return;
    }
    run();
  }

  boot();
})(typeof window !== 'undefined' ? window : globalThis);
