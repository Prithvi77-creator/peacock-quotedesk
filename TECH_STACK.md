# Peacock QuoteDesk — Technical Stack

**Product:** Charter Quotation System for Peacock Jetlines (Shivalingam Global Aviation Pvt Ltd)
**Document date:** 4 August 2026  ·  **App version:** v=30 (asset cache tag)
**Repository:** `Prithvi77-creator/peacock-quotedesk`  ·  **Live:** https://prithvi77-creator.github.io/peacock-quotedesk/

---

## 1. Overview

QuoteDesk is a **static, single-page web application** that turns a form into printable, branded A4 charter-quotation pages and exports them to PDF — entirely in the browser. It has **no backend, no database, and no build step**. It is deliberately dependency-light and framework-free so it can be dropped onto any static host today and converted to PHP later with minimal change.

**One-line stack:** Vanilla HTML + CSS + JavaScript → html2canvas + jsPDF for PDF → hosted on GitHub Pages.

---

## 2. Architecture

| Aspect | Design |
|---|---|
| **Type** | Static single-page app (SPA), rendered fully client-side |
| **Model** | Split screen: a **form panel** (left) drives a **live A4 preview** (right) |
| **State** | A single in-memory `Q` object; **stateless** — nothing is saved to disk or server |
| **Output** | Fixed 794×1123 px A4 "pages" in the DOM, screenshotted to a multi-page PDF |
| **Data flow** | `input → Q (state) → render() → preview DOM → html2canvas → jsPDF` |
| **Build** | None. Files are served as-authored. Cache-busting via `?v=N` query strings |

The app runs on `file://` or any static file server. No transpilation, bundling, or package manager is involved.

---

## 3. Languages & paradigm

- **HTML5** — one entry document (`index.html`)
- **CSS3** — one hand-written stylesheet (no Sass/PostCSS/Tailwind)
- **JavaScript (ES2015+)** — plain, no framework, **classic `<script>` tags with global functions** (not ES modules, not TypeScript)
- **Python** — only for the local dev server (`serve.py`); not part of the shipped app

**Not used:** React/Vue/Svelte/Angular, npm/node_modules, Webpack/Vite/Rollup/esbuild, TypeScript, JSX, CSS preprocessors, a CSS framework, or any linter/formatter pipeline.

---

## 4. Project structure

Total shipped payload: **~1.73 MB** (js + css + html). Of that, **~1.44 MB is offline map data** and **157 KB is the base64 logo**; the actual application logic is **~135 KB**.

### JavaScript (loaded in this order)

| # | File | Size | Lines | Purpose |
|---|------|------|-------|---------|
| 1 | `js/assets.js` | 157 KB | 4 | Base64-encoded Peacock logo/emblem (inlined so PDFs are self-contained) |
| 2 | `js/templates.js` | 9 KB | 149 | The 3 quote templates (Private / Medical / Estimated): greeting, cost lines, T&C, defaults |
| 3 | `js/fleet.js` | 6 KB | 58 | **Fleet Master** — 29 aircraft with specs + photo filenames for auto-fill |
| 4 | `js/calc.js` | 3 KB | 83 | Money math: subtotals, GST, non-taxable charges, amount-in-words (INR/USD) |
| 5 | `js/geo.js` | 166 KB | 11 | Vector basemap geometry: **Natural Earth 110m** world + **datameet** India outline (`INDIA_GEO`) |
| 6 | `js/india-admin.js` | 297 KB | 4 | **GADM** India state + district outlines (for close-zoom detail) |
| 7 | `js/cities.js` | 971 KB | 4 | **GeoNames cities15000** gazetteer (~38,800 cities) as a TSV string |
| 8 | `js/map.js` | 16 KB | 326 | SVG route-map engine: projection, basemap, arcs, city resolution |
| 9 | `js/store.js` | 1 KB | 37 | Helpers: quote-number generation, image downscaling |
| 10 | `js/render.js` | 24 KB | 534 | Renders the live preview: all pages, totals, gallery, option pages, page-flow |
| 11 | `js/app.js` | 32 KB | 677 | Application state (`Q`), form rendering, all user interactions, PDF export |

### Other

| File | Size | Lines | Purpose |
|------|------|-------|---------|
| `index.html` | 17 KB | 330 | Entry doc: password gate, editor, A4 preview pages, image resize/crop modal |
| `css/styles.css` | 27 KB | 376 | All styling (editor, preview pages, modal, responsive rules) |
| `serve.py` | — | — | Local dev server (Python `http.server` with no-cache headers), port 8123 |
| `fleet/` | — | — | Drop-folder for the 29 aircraft photos (see `fleet/README.txt`) |

---

## 5. Third-party dependencies (runtime)

Only **two** JavaScript libraries, both loaded from CDN (cdnjs), plus one web font.

| Dependency | Version | Source | Purpose |
|---|---|---|---|
| **html2canvas** | 1.4.1 | cdnjs | Rasterises each A4 preview page (DOM) to a `<canvas>` |
| **jsPDF** | 2.5.1 | cdnjs | Assembles the canvas images into a multi-page A4 PDF |
| **Google Fonts — Poppins** | — | fonts.googleapis.com | Brand typeface (weights 300–700) |

There are **no other runtime dependencies** and **no local `node_modules`**.

---

## 6. External services / APIs

| Service | Provider | Auth | Where | Purpose |
|---|---|---|---|---|
| **Photon** (`photon.komoot.io`) | Komoot / OpenStreetMap | **None (keyless)** | Editor only, via `fetch()` | City **autocomplete**: type a place → pick the exact match → its precise coordinates are stored on the flight leg |

- Called only while editing (debounced, on the From/To city fields). **Not** needed for PDF export or map rendering — the picked coordinates are stored in-memory.
- **Graceful degradation:** if offline or blocked, the field behaves as a plain text box and the map falls back to the bundled offline gazetteer.
- **Fair-use** public endpoint; can be swapped for a keyed provider (e.g. Geoapify) later, ideally proxied through the planned PHP backend.

---

## 7. Map subsystem

Fully offline rendering; only the optional autocomplete is online.

- **Renderer:** custom **SVG** with an equirectangular projection (cos-latitude corrected, aspect-matched to the frame) — `js/map.js`. No tiles, no map library (no Leaflet/Mapbox GL).
- **Basemap geometry (bundled):**
  - **Natural Earth 110m** — world country outlines (`geo.js`)
  - **datameet** — official India outline incl. J&K / Ladakh / Arunachal (`geo.js`, `INDIA_GEO`)
  - **GADM** — India state + district boundaries, Douglas–Peucker simplified, shown on close zoom (`india-admin.js`)
- **City coordinates:** **GeoNames cities15000** gazetteer (~38,800 cities, India-biased for name collisions) as a TSV blob (`cities.js`), plus the live Photon lookup which takes precedence when the admin picks a suggestion.
- **Output:** an inline SVG route map with departure/arrival pins and directional flight arcs, sized to roughly half a page.

---

## 8. Image subsystem

All image handling is client-side; no uploads leave the browser.

- **Ingestion:** `<input type="file">` → `FileReader` → drawn to a `<canvas>` and **downscaled** (aircraft photos ≤1100 px, option photos ≤900 px) to keep PDFs light.
- **Storage:** photos are held as **base64 data-URLs** in the `Q` object — never uploaded.
- **Per-photo framing model:** each photo is an object `{ src, fit, zoom, x, y, orig }`:
  - `fit` — `cover` (fill) or `contain` (show whole)
  - `zoom` + `x,y` — magnification and focal point (drag-to-reposition)
  - `orig` — the pre-crop original, kept so a crop can be reset
- **Crop tool:** a `<canvas>`-based crop cuts the source to a draggable/resizable selection and re-encodes to JPEG; **Reset** restores `orig`.

---

## 9. Data model & state

A single global **`Q`** object holds the entire quotation in memory:

- `meta` — template, quote no., date, aircraft, client, currency, GST rate/on-off, comparison-mode flag, and per-page include toggles
- `legs[]` — flight sectors (`from`, `to`, times, remarks, and picked `fromCoord`/`toCoord`)
- `costs[]`, `postCosts[]` — taxable cost lines and GST-free charges
- `options[]` — comparison-quote aircraft (name, year, seats, specs, price, photos)
- `aircraftPhotos[]`, `aircraftDetails` — single-aircraft gallery
- `greeting`, `tnc`, `additionalNotes`, `header`, `site` — editable document content

**Persistence:** none for quotations (stateless by design). `sessionStorage` holds only the password-gate flag (`pjl.auth`). No `localStorage`, cookies, or server storage.

---

## 10. PDF generation pipeline

1. The preview is built as real DOM: fixed **A4 pages (794×1123 px)**, scaled down on screen with a CSS transform (so narrow screens fit) but captured at full size.
2. On export, the transform is cleared, each `.page` is rendered with **html2canvas** (high scale factor for crisp text), and the images are placed into an A4 **jsPDF** document — one page per sheet.
3. All assets are inlined (base64 logo, data-URL photos, inline SVG map), so capture is fully self-contained and deterministic.

---

## 11. Templates & document pages

Three quotation templates (Private charter / Medical / Estimated) each define their own greeting, cost lines, and terms. The generated document assembles these pages, in order, based on toggles:

`page1` (letter + costing) → `page_gallery` **or** `opt_gallery_pages` (one aircraft page per comparison option) → `page_notes` (optional) → `page_map` (optional) → `page2` / `page3` (Terms & Conditions).

Long content re-flows automatically onto continuation pages.

---

## 12. Authentication & security

- **Password gate:** a client-side gate (password `1249`) with a `sessionStorage` flag.
- **Important:** this is a **deterrent, not real security** — the check is in client JS and can be bypassed by a technical user. Real access control requires the planned server-side (PHP) gate.
- **Data privacy:** photos and quote data never leave the browser; the only outbound request is the optional Photon city lookup (a place-name string).

---

## 13. Hosting, build & deployment

| Concern | Tooling |
|---|---|
| **Host** | GitHub Pages (static, free) — served from `main` branch root |
| **Repo** | `Prithvi77-creator/peacock-quotedesk` |
| **Deploy** | `git push` → GitHub Pages rebuild (via `gh` CLI / git; credentials in macOS keychain) |
| **Build step** | None — files are deployed as-is |
| **Cache-busting** | `?v=N` query string on every css/js reference (bumped on each change; currently **v=30**) |

---

## 14. Local development

- **Server:** `serve.py` — a Python `http.server` subclass that sends `Cache-Control: no-store` headers, on port **8123** (avoids stale-cache issues during editing). `python3 -m http.server 8123` also works.
- **Config:** `.claude/launch.json` defines the `quotedesk` server for tooling.
- **Workflow:** edit files → bump `?v=N` in `index.html` → hard-refresh.

---

## 15. Browser APIs used

`fetch` (Photon), **Canvas 2D** (downscale + crop), `FileReader`, **SVG**, `ResizeObserver` (preview auto-scaling), and pointer/mouse/touch events (image drag, crop box move/resize). Requires a modern evergreen browser (Chrome, Safari, Edge, Firefox).

---

## 16. Performance & payload notes

- **~1.73 MB** total, dominated by offline geodata (**~1.44 MB**: cities 971 KB + India admin 297 KB + world/India outlines 166 KB) and the base64 logo (157 KB).
- All data is bundled, so after first load the app works with only the optional Photon call needing the network.
- Trade-off: the offline gazetteer/geometry is what makes the map work without a maps API — at the cost of a heavier first load.

---

## 17. Third-party data attribution & licensing

| Data / library | Source | Licence (typical) |
|---|---|---|
| Country outlines | Natural Earth (1:110m) | Public domain |
| India outline | datameet | Open data (community) |
| India states/districts | GADM | Free for non-commercial / academic — **review terms for commercial use** |
| City gazetteer | GeoNames (cities15000) | CC BY 4.0 (attribution) |
| Geocoding | Photon / OpenStreetMap | ODbL (OSM data); Photon public API fair-use |
| html2canvas | — | MIT |
| jsPDF | — | MIT |
| Poppins | Google Fonts | SIL Open Font License |

> **Note:** GADM's licence restricts commercial redistribution. For a commercial product, confirm the terms or substitute an openly-licensed source (e.g. Natural Earth admin-1, OSM boundaries).

---

## 18. Known limitations

- Client-side password only (not secure until PHP).
- Photon is a shared public endpoint (fair-use; no SLA) — fine for low volume, replace with a keyed provider for scale.
- Stateless: quotes aren't saved — closing the tab discards the working quotation (by design).
- Heavy first load due to bundled geodata.

---

## 19. Roadmap / planned

- **PHP conversion:** rename `index.html` → `index.php`, add a real server-side login gate, and (optionally) proxy the geocoding/static-map API through PHP so keys stay server-side. The vanilla, build-free structure was chosen specifically to make this migration low-friction.
- **Optional map upgrade:** move from Photon to a keyed provider (Geoapify/Mapbox) and/or a static-map-image basemap.
- **Fleet photos:** drop the 29 real aircraft images into `fleet/` (filenames in `fleet/README.txt`) to activate Fleet Master auto-photos.
