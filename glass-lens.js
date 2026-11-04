/* glass-lens.js — bs-prep liquid-glass lens engine (inert skeleton, phase P-0).

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
   auto-initialises. It only publishes window.BSLens. */
(function (root) {
  'use strict';

  var VERSION = '1.0.0-port.0';
  var SOURCE = 'glisse@v0.5.0/46be5ba0';

  var _diagnostics = {
    mounts: 0,
    frames: 0,
    repaints: 0,
    errors: 0
  };

  /* Feature detection only — no UA sniffing, no DOM writes. Returns false
     (never throws) when SVG, a 2d canvas context, or CSS filter url()
     support is missing, including in DOM-less sandboxes (node vm). */
  function isSupported() {
    return (typeof SVGElement !== 'undefined') &&
      (function () {
        try { return !!document.createElement('canvas').getContext('2d'); }
        catch (err) { return false; }
      })() &&
      (function () {
        try { return !!(root.CSS && root.CSS.supports && root.CSS.supports('filter', 'url(#lg-test)')); }
        catch (err) { return false; }
      })();
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

  /** Bootstrap (landed in P-1/P-2): engine setup, gating and auto-init on
      DOMContentLoaded. No-op stub at P-0 — registers nothing. */
  function init() {}

  /** Mount a lens on an approved surface (landed in P-1/P-2): creates the
      generated backdrop and SVG filter. No-op stub at P-0. */
  function mount() {}

  /** Tear down one mounted lens and its generated nodes (landed in P-2).
      No-op stub at P-0. */
  function unmount() {}

  /** Repaint rim/shine and refit geometry after theme or layout changes
      (landed in P-2). No-op stub at P-0. */
  function refresh() {}

  /** Full teardown of injected svg/style/backdrops and observers
      (landed in P-2). No-op stub at P-0. */
  function destroy() {}

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
    _diagnostics: _diagnostics
  };
})(typeof window !== 'undefined' ? window : globalThis);
