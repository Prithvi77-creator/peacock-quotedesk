# Peacock QuoteDesk — Charter Quotation System

Production single-page quotation system for Peacock Jetlines (Shivalingam Global Aviation
Pvt Ltd). Plain HTML/CSS/JS — no build step, no framework, no backend yet.

## Run it

Open `index.html` in a browser, or serve the folder over HTTP:

```bash
python3 -m http.server 8123 -d quotedesk
```

Internet is needed for the Poppins font and the two PDF libraries (html2canvas, jsPDF,
loaded from cdnjs). Without internet the app still works; use Print → Save as PDF.

## What it does

- **Dashboard** — saved quotations with status chips (draft / sent / accepted / expired /
  revised), stats, open / duplicate / delete, JSON backup export & import.
- **Editor** — form panel + live A4 preview. Three templates matching the existing
  proformas: **Private charter**, **Medical** (GST-exempt, positioning section, medical
  cost heads), **Estimated cost**. Optional **multi-aircraft comparison** (photo, details,
  price per option; auto-flows onto a continuation page), optional **route-map page**
  (offline SVG diagram; schematic fallback for unknown cities), optional T&C pages.
- **Everything is editable** — form fields drive the data; every text on the pages
  (company header, titles, notes, T&C, signature) is click-to-edit. Company details are
  saved as defaults for future quotations (Company & branding section).
- **Storage** — quotations live in browser localStorage (`pjl.*` keys). Autosaved draft
  survives refresh. Use Export backup to move data between computers/browsers.
- **PDF** — one-click A4 PDF named `Quote-<Aircraft>-<Route>-<QuotationNo>.pdf`.

## Files

```
index.html        app shell (dashboard + editor + A4 page markup)
css/styles.css    all styles incl. print stylesheet
js/assets.js      logo/emblem as data URIs (keeps PDF export canvas-safe on file://)
js/templates.js   the 3 proforma templates, T&C text, org defaults, fleet list
js/calc.js        totals, INR/USD formatting, amount-in-words
js/map.js         city gazetteer + SVG route diagram
js/store.js       localStorage persistence, backup, image downscaling
js/render.js      preview rendering, click-to-edit binding, page-flow/overflow
js/app.js         controller: views, form, save/load, PDF, init
```

## Converting to PHP (planned phase 2)

1. Rename `index.html` → `index.php`.
2. Prepend the login gate from the prototype `../xyz.php` (lines 1–95: session,
   password hash, login form) — everything after `/* logged in */` is this app unchanged.
3. Upload the folder to the subdomain webroot (e.g. `quotes.peacockjetlines.com`).
4. Later: swap `js/store.js` internals for fetch calls to a small PHP/MySQL API —
   the rest of the app doesn't need to change.

## Notes

- Quotation numbers: `PJL-YYYYMMDD-NN`, per-day counter per browser, always editable.
- Aircraft photos are downscaled to ≤640 px JPEG before storing to respect the
  ~5 MB localStorage quota; quota errors surface as toasts.
- A yellow "Content exceeds A4" pill appears on any page whose content is longer than
  the sheet — reduce rows or shorten text before generating the PDF.
