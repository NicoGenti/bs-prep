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

   CONTRACT: classic script (no modules, no build step). Loading this file is
   side-effect-free: it registers no listeners, mutates no DOM node, and never
   auto-initialises. It only publishes window.BSLens.

   P-1 scope: the engine core — token config, displacement map, rim map, filter
   builder and lens geometry. Nothing is mounted and no node is inserted yet;
   P-2 adds the generated backdrop, the defs container and the lifecycle.
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
    rims: 0,
    skipped: 0,
    errors: 0
  };

  /* Feature detection only — no UA sniffing, no DOM writes. Returns false
     (never throws) when SVG, a 2d canvas context, or CSS filter url()
     support is missing, including in DOM-less sandboxes (node vm). */
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

  /* A CSS colour as sRGB bytes and alpha, by the canvas's own parsing. */
  function parseColour(context, colour) {
    var value;
    try {
      context.fillStyle = '#0000';
      context.fillStyle = colour || 'transparent';
      value = String(context.fillStyle);
    } catch (err) {
      return [0, 0, 0, 0];
    }
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
     lens rect in the backdrop's own coordinates. The P-2 mount layer
     positions the backdrop from `box`, then hands `region` and `mapBox` to
     buildSvgFilter. Returns null when either box is not measurable. */
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

  /* Lenses the loop drives. P-2 pushes on mount and splices on unmount. */
  var mountedLenses = [];
  var frameHandle = 0;
  var following = false;

  function pageHidden() {
    var doc = documentRef();
    return !!(doc && doc.visibilityState && doc.visibilityState !== 'visible');
  }

  function requestFrame() {
    var schedule = root.requestAnimationFrame;
    if (typeof schedule !== 'function') return 0;
    try {
      return schedule.call(root, frame);
    } catch (err) {
      return 0;
    }
  }

  function frame() {
    frameHandle = 0;
    if (!following) return;
    if (pageHidden()) {
      following = false;
      return;
    }
    _diagnostics.frames += 1;
    for (var i = 0; i < mountedLenses.length; i++) {
      var lens = mountedLenses[i];
      if (lens && typeof lens.update === 'function') {
        try {
          lens.update();
        } catch (err) {
          _diagnostics.errors += 1;
        }
      }
    }
    frameHandle = requestFrame();
  }

  /* One rAF loop for every mounted lens. Idempotent: calling it while the
     loop runs changes nothing. It refuses to start while nothing is mounted
     (P-2 starts it on the first mount) and pauses while the page is hidden;
     the P-2 lifecycle calls it again when the page becomes visible. */
  function follow() {
    if (following) return true;
    if (!mountedLenses.length) return false;
    if (pageHidden()) return false;
    following = true;
    frameHandle = requestFrame();
    return true;
  }

  function stopFollow() {
    following = false;
    if (frameHandle && typeof root.cancelAnimationFrame === 'function') {
      try {
        root.cancelAnimationFrame.call(root, frameHandle);
      } catch (err) {
        // A frame that cannot be cancelled will see `following` false and stop.
      }
    }
    frameHandle = 0;
  }

  /* ---- lifecycle (P-2 lands the DOM half) -------------------------------- */

  /** Bootstrap (lands in P-2): engine setup, gating and auto-init on
      DOMContentLoaded. No-op stub until then — registers nothing. */
  function init() {}

  /** Mount a lens on an approved surface (lands in P-2): creates the
      generated backdrop, inserts the filter built here, and starts follow(). */
  function mount() {}

  /** Tear down one mounted lens and its generated nodes (lands in P-2). */
  function unmount() {}

  /** Repaint the rim and refit geometry after theme or layout changes
      (lands in P-2). */
  function refresh() {}

  /** Full teardown. P-1 owns the loop; P-2 adds the generated layer. */
  function destroy() {
    stopFollow();
    mountedLenses.length = 0;
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
      stopFollow: stopFollow
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
