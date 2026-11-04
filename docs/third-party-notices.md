# Third-party notices

Attribution for techniques and code used in bs-prep. Entries are listed in the
order they were introduced.

## Glisse

- **Upstream:** https://github.com/0kzh/glisse
- **Pinned revision:** commit `46be5ba0` — the `gitHead` of the npm release `0.5.0`.
  The pin is the **commit**, not the tag: the `v0.5.0` git tag points to an older
  tree (`433fc171`), so `46be5ba0` (npm 0.5.0 `gitHead`) is the reference revision.
- **Author / copyright holder:** Kelvin Zhang.
- **What is used:** only the **refraction technique** — canvas displacement maps
  (R = horizontal, G = vertical, 127.5 neutral, Snell n = 1.5 squircle rim) plus an
  SVG `feDisplacementMap` filter chain with chromatic dispersion. The implementation
  in `glass-lens.js` is a **logic-equivalent vanilla port**, not a verbatim
  TypeScript copy; no upstream source files are vendored.
- **License:** MIT. The full upstream license text is reproduced verbatim below.

The ported technique (and any future vendored portion) carries the same MIT
obligations: the copyright notice and permission notice below must be included in
all copies or substantial portions of the derived work, and the software is
provided without warranty of any kind.

```
MIT License

Copyright (c) 2026 Kelvin Zhang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
