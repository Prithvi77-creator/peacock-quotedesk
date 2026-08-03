/* ============================================================
   Peacock QuoteDesk — preview rendering
   Contract: regions marked [data-edit] are click-to-edit and map
   to a path in the current quote's state; they are (re)built only
   when a quote is loaded or its template switched — never during
   normal updates, so typing is never interrupted. Dynamic regions
   (meta values, flights, costing, options, map, totals) re-render
   from state and are edited through the form panel.
   ============================================================ */

/* ---- state path helpers: "header.coName", "notes.3", "tnc.0.1.items.2" ---- */
function getPath(obj, path){
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
function setPath(obj, path, value){
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] == null ? (o[k] = {}) : o[k]), obj);
  target[last] = value;
}

const $id = id => document.getElementById(id);

/* ============================================================
   STRUCTURAL BUILD — on quote load / template switch
   ============================================================ */
function buildEditableRegions(q){
  // brand images
  document.querySelectorAll('img.js-logo').forEach(img => img.src = LOGO_SRC);
  document.querySelectorAll('img.js-emblem').forEach(img => img.src = EMBLEM_SRC);

  // header block
  bindEdit('pv_co_name', 'header.coName', q);
  bindEdit('pv_co_line', 'header.coLine', q);
  bindEdit('pv_co_contact', 'header.coContact', q);

  // greeting
  bindEdit('pv_greet', 'greeting', q);

  // positioning bar (medical)
  const pos = $id('pv_posbar_wrap');
  pos.hidden = !q.posBar;
  if (q.posBar) bindEdit('pv_posbar', 'posBar', q);

  // meta grid (labels editable, values dynamic)
  const rows = [
    { key: 'aircraft', vid: 'pm_aircraft' },
    ...(q.meta.template === 'medical' ? [
      { key: 'configuration', vid: 'pm_configuration' },
      { key: 'positioning',  vid: 'pm_positioning' }
    ] : []),
    { key: 'qno',  vid: 'pm_qno' },
    { key: 'date', vid: 'pm_date' },
    { key: 'client', vid: 'pm_client' }
  ];
  $id('pv_meta').innerHTML = rows.map(r =>
    `<div class="k" data-edit="metaLabels.${r.key}" data-mrow="${r.key}"></div><div class="v" id="${r.vid}" data-mrow="${r.key}"></div>`
  ).join('');
  rows.forEach(r => {
    const el = document.querySelector(`[data-edit="metaLabels.${r.key}"]`);
    el.innerHTML = q.metaLabels[r.key] || '';
    makeEditable(el, q);
  });

  // section titles + table headers
  bindEdit('pv_flights_title', 'flightsTitle', q);
  bindEdit('pv_cost_title', 'costTitle', q);
  ['date','from','to','etd','time','remarks'].forEach(k => bindEdit('pv_th_' + k, 'tableHeads.' + k, q));

  // footer notes
  bindEdit('pv_notes_title', 'notesTitle', q);
  $id('pv_notes').innerHTML = q.notes.map((n, i) =>
    `<div class="pn" data-edit="notes.${i}"></div>`).join('');
  q.notes.forEach((n, i) => {
    const el = document.querySelector(`#pv_notes [data-edit="notes.${i}"]`);
    el.innerHTML = n; makeEditable(el, q);
  });

  // map page title
  bindEdit('pv_map_title', 'mapTitle', q);

  // additional notes page title
  bindEdit('pv_notes_page_title', 'additionalTitle', q);

  // T&C pages
  const syncEchoes = () => {
    $id('pv_tnc_title2').innerHTML = getPath(q, 'tncTitle') ?? '';
    document.querySelectorAll('.js-site-echo').forEach(el => { el.innerHTML = getPath(q, 'site') ?? ''; });
  };
  bindEdit('pv_tnc_title1', 'tncTitle', q, syncEchoes);
  buildTncPages(q);

  // footer sites + signature (page-2 site is the editable master; others echo it)
  bindEdit('pv_site1', 'site', q, syncEchoes);
  bindEdit('pv_sign_for', 'signFor', q);
  bindEdit('pv_sign_role', 'signRole', q);
  syncEchoes();
}

function bindEdit(id, path, q, onInput){
  const el = $id(id);
  if (!el) return;
  el.dataset.edit = path;
  el.innerHTML = getPath(q, path) ?? '';
  makeEditable(el, q, onInput);
}
function makeEditable(el, q, onInput){
  el.contentEditable = 'true';
  el.spellcheck = false;
  el.oninput = () => {
    setPath(q, el.dataset.edit, el.innerHTML);
    if (onInput) onInput();
    quoteTouched();               // autosave; no re-render of static regions
  };
}

function buildTncPages(q){
  const wraps = [$id('pv_tnc_body1'), $id('pv_tnc_body2')];
  q.tnc.forEach((page, p) => {
    const host = wraps[p];
    if (!host) return;
    host.innerHTML = page.map((sec, s) => `
      <div class="tc-bar"><div class="tb-red" data-edit="tnc.${p}.${s}.head"></div><div class="tb-navy">&#9992;</div></div>
      ${sec.items.map((it, i) => `<div class="tc-item" data-edit="tnc.${p}.${s}.items.${i}"></div>`).join('')}
    `).join('');
    page.forEach((sec, s) => {
      const h = host.querySelector(`[data-edit="tnc.${p}.${s}.head"]`);
      h.innerHTML = sec.head; makeEditable(h, q);
      sec.items.forEach((it, i) => {
        const el = host.querySelector(`[data-edit="tnc.${p}.${s}.items.${i}"]`);
        el.innerHTML = it; makeEditable(el, q);
      });
    });
  });
}

/* ============================================================
   DYNAMIC RENDER — every state change
   ============================================================ */
function renderPreview(q){
  const cur = q.meta.currency;

  // meta values
  const set = (id, v) => { const el = $id(id); if (el) el.textContent = v; };
  set('pm_aircraft', q.meta.aircraft);
  set('pm_qno', q.meta.qno);
  set('pm_date', fmtDateDisplay(q.meta.date));
  set('pm_client', q.meta.client);
  if (q.meta.template === 'medical'){
    set('pm_configuration', q.meta.configuration || '');
    set('pm_positioning', q.meta.positioning || '');
  }
  // hide client row when empty; hide single-aircraft row in comparison mode
  document.querySelectorAll('[data-mrow="client"]').forEach(el =>
    el.style.display = (q.meta.client || '').trim() ? '' : 'none');
  document.querySelectorAll('[data-mrow="aircraft"]').forEach(el =>
    el.style.display = q.meta.multiAircraft ? 'none' : '');

  // single-aircraft photo gallery page (adaptive grid)
  renderGallery(q);

  // greeting aircraft phrase — mode & template aware; in comparison mode it stays
  // generic (each option names its own aircraft). Survives until the greeting is hand-edited.
  const slot = document.querySelector('#pv_greet [data-slot="aircraft"]');
  if (slot){
    const med = q.meta.template === 'medical';
    if (q.meta.multiAircraft){
      slot.innerHTML = med
        ? 'the <b>following medically-equipped aircraft options</b>'
        : 'the <b>following aircraft options</b>';
    } else {
      const name = escHtml(q.meta.aircraft || '________');
      slot.innerHTML = med ? `the medically equipped <b>${name}</b>` : `the <b>${name}</b> aircraft`;
    }
  }

  // flight legs
  const legs = q.legs.length ? q.legs : [{}];
  $id('pv_legs').innerHTML = legs.map(l => `
    <tr><td>${escHtml(fmtDateDisplay(l.date)) || '&nbsp;'}</td><td>${escHtml(l.from) || '&nbsp;'}</td><td>${escHtml(l.to) || '&nbsp;'}</td>
    <td>${escHtml(l.etd) || '&nbsp;'}</td><td>${escHtml(l.time) || '&nbsp;'}</td><td>${escHtml(l.remarks) || '&nbsp;'}</td></tr>`).join('');

  $id('pv_curtag').textContent = cur;

  // costing / options
  if (q.meta.multiAircraft) renderOptionsPreview(q);
  else renderCostsPreview(q);

  // map page — compact framed map + itinerary summary
  const mapPage = $id('page_map');
  mapPage.hidden = !q.meta.includeMap;
  if (q.meta.includeMap){
    const frame = $id('pv_map_frame');
    frame.innerHTML = buildRouteSVG(q.legs, frame.clientWidth, frame.clientHeight);
    const rs = routeSummary(q);
    $id('pv_map_intro').innerHTML = rs.intro;
    $id('pv_route_summary').innerHTML = rs.rows;
  }

  // additional notes page (form-driven body; shown only when enabled)
  const notesPage = $id('page_notes');
  notesPage.hidden = !q.meta.includeNotes;
  if (q.meta.includeNotes) $id('pv_addl_notes').textContent = q.additionalNotes || '';

  // T&C pages
  document.querySelectorAll('.tncpage').forEach(p => p.hidden = !q.meta.includeTnc);

  renderTotalsBox(q);
  scheduleReflow(q);
}

/* Coalesced page-flow pass. Double-rAF so layout (and any same-frame
   re-renders) settle before measuring; re-armed by every render.
   rAF never fires in a hidden/background tab, so fall back to a timer
   there — layout is still measurable even when not painted. */
let _reflowPending = false;
function scheduleReflow(q){
  if (_reflowPending) return;
  _reflowPending = true;
  const run = () => { _reflowPending = false; flowOptionPages(q); flagOverflows(); fitPreview(); };
  if (document.visibilityState === 'hidden') setTimeout(run, 60);
  else requestAnimationFrame(() => requestAnimationFrame(run));
}
/* Immediate synchronous pass — used right before PDF capture / print. */
function reflowNow(q){
  _reflowPending = false;
  flowOptionPages(q);
  flagOverflows();
  fitPreview();
}

/* Scale the A4 pages down to fit narrow screens. The pages keep their
   fixed 794px width (so PDF capture stays pixel-faithful); only the
   on-screen #pages wrapper is transformed. A negative bottom margin
   reclaims the layout space the scale visually frees. */
function fitPreview(){
  const area = document.querySelector('.preview-area');
  const wrap = $id('pages');
  if (!area || !wrap) return;
  wrap.style.transform = 'none';
  wrap.style.marginBottom = '0';
  const avail = area.clientWidth - 8;
  const s = Math.min(1, avail / 794);
  if (s < 0.999){
    const h = wrap.offsetHeight;                 // natural height (pre-transform)
    wrap.style.transformOrigin = 'top center';
    wrap.style.transform = 'scale(' + s + ')';
    wrap.style.marginBottom = '-' + Math.round(h * (1 - s)) + 'px';
  }
}
/* Temporarily clear the preview scale so html2canvas captures pages at
   full size, then restore it. Returns a restore callback. */
function withUnscaledPreview(fn){
  const wrap = $id('pages');
  const t = wrap.style.transform, m = wrap.style.marginBottom;
  wrap.style.transform = 'none'; wrap.style.marginBottom = '0';
  return Promise.resolve(fn()).finally(() => { wrap.style.transform = t; wrap.style.marginBottom = m; });
}

/* Aircraft page — premium spec sheet: eyebrow + name, spec tiles parsed from
   the details, a featured hero photo, and a thumbnail strip for the rest. */
function renderGallery(q){
  const page = $id('page_gallery');
  const photos = (q.aircraftPhotos || []);
  const details = (q.aircraftDetails || '').trim();
  const name = (q.meta.aircraft || '').trim();
  const show = !q.meta.multiAircraft && q.meta.includeAircraftPage !== false && (photos.length > 0 || !!details);
  page.hidden = !show;
  if (!show) return;

  // split details into spec tiles ("Label: value") and free description lines,
  // de-duplicating by label / content so repeated lines never clutter the page
  const tiles = [], desc = [], seenK = new Set(), seenD = new Set();
  details.split('\n').forEach(raw => {
    const line = raw.trim(); if (!line) return;
    const i = line.indexOf(':');
    if (i > 0 && i <= 22){
      const label = line.slice(0, i).trim(), kl = label.toLowerCase();
      if (seenK.has(kl)) return;
      seenK.add(kl);
      tiles.push([label, line.slice(i + 1).trim()]);
    } else {
      const dl = line.toLowerCase();
      if (seenD.has(dl)) return;
      seenD.add(dl);
      desc.push(line);
    }
  });

  const cap = v => v ? v.charAt(0).toUpperCase() + v.slice(1) : v;
  // balanced column count so rows are even (no lone item / ragged wrap)
  const n = tiles.length;
  const cols = n <= 3 ? n : (n === 4 ? 2 : (n <= 6 ? 3 : 4));
  const specsHtml = tiles.length
    ? `<div class="ac-specband" style="grid-template-columns:repeat(${cols},1fr)">${tiles.map((t, idx) =>
        `<div class="ac-si${idx % cols === 0 ? ' first-col' : ''}"><div class="ac-si-k">${escHtml(t[0])}</div><div class="ac-si-v">${escHtml(cap(t[1]))}</div></div>`).join('')}</div>`
    : '';

  // photos use fixed, count-based heights (never stretched to fill, so images
  // are shaped consistently and not oddly cropped). The whole media block is
  // centred vertically by CSS, so there is no gap between photos and specs and
  // no dead space at the foot of the page.
  //   1  → one wide feature;  2 → two stacked;  3+ → a feature + a row of the rest.
  let photosHtml = '';
  if (photos.length){
    const n = photos.length;
    const box = (p, h) => `<div class="ac-shot" style="height:${h}px"><img src="${p}" alt=""></div>`;
    let inner;
    if (n === 1){
      inner = box(photos[0], 500);
    } else if (n === 2){
      inner = `<div class="ac-stack">${box(photos[0], 320)}${box(photos[1], 320)}</div>`;
    } else {
      const rest = photos.slice(1);
      const cols = Math.min(rest.length, 4);
      const heroH = n === 3 ? 350 : (n === 4 ? 330 : 310);
      const rowH  = n === 3 ? 215 : (n === 4 ? 172 : 150);
      inner = box(photos[0], heroH)
        + `<div class="ac-grid" style="grid-template-columns:repeat(${cols},1fr); grid-auto-rows:${rowH}px">`
        + rest.map(p => `<div class="ac-shot"><img src="${p}" alt=""></div>`).join('')
        + `</div>`;
    }
    photosHtml = `<div class="ac-photos">${inner}</div>`;
  }
  const descHtml = desc.length
    ? `<div class="ac-desc">${desc.map(escHtml).join('<br>')}</div>` : '';

  // title pinned at top; photos + specs + description centred as one block
  $id('pv_gallery').innerHTML =
    `<div class="ac-eyebrow">Charter Aircraft</div>` +
    `<div class="ac-name">${escHtml(name) || 'Aircraft'}</div>` +
    `<div class="ac-media">${photosHtml + specsHtml + descHtml}</div>`;
}

/* Itinerary summary shown beneath the compact map. */
function routeSummary(q){
  const legs = q.legs.filter(l => (l.from || '').trim() || (l.to || '').trim());
  if (!legs.length) return { intro: '', rows: '' };
  const rows = legs.map((l, i) => `
    <div class="rs-row">
      <span class="rs-idx">${i + 1}</span>
      <span class="rs-date">${escHtml(fmtDateDisplay(l.date)) || '—'}</span>
      <span class="rs-sector"><b>${escHtml(l.from) || '—'}</b><span class="rs-arrow">→</span><b>${escHtml(l.to) || '—'}</b></span>
      <span class="rs-time">${(l.time || '').trim() ? escHtml(l.time) + ' hrs' : ''}</span>
    </div>`).join('');
  const first = legs[0].from, last = legs[legs.length - 1].to;
  const intro = `${legs.length} flight sector${legs.length > 1 ? 's' : ''}`
    + (first && last ? ` &middot; ${escHtml(first)} &rarr; ${escHtml(last)}` : '');
  return { intro, rows: `<div class="rs-title">Itinerary</div>${rows}` };
}

function renderCostsPreview(q){
  $id('pv_optwrap').innerHTML = '';
  const cur = q.meta.currency;
  const gstOn = q.meta.gstEnabled, gstRate = parseFloat(q.meta.gstRate) || 0;
  const t = computeTotals(q.costs, gstOn, gstRate, q.postCosts);
  const rowHtml = c => `<div class="crow"><span class="cl">${escHtml(c.label) || '&nbsp;'}</span><span class="cv">${fmtMoney(parseFloat(c.amount) || 0, cur)}</span></div>`;
  const rows = q.costs.filter(c => (c.label || '').trim() || c.amount !== '').map(rowHtml).join('');
  const postRows = q.postCosts.filter(c => (c.label || '').trim() || c.amount !== '').map(rowHtml).join('');
  $id('pv_costs').innerHTML = rows +
    `<div class="crow sub"><span class="cl">Sub Total</span><span class="cv">${fmtMoney(t.sub, cur)}</span></div>` +
    (gstOn && gstRate > 0 ? `<div class="crow sub"><span class="cl">GST@${gstRate}%</span><span class="cv">${fmtMoney(t.gst, cur)}</span></div>` : '') +
    postRows +
    `<div class="crow grand"><span class="cl">All Inclusive Charter Package in ${cur}${gstOn && gstRate > 0 ? ` incl. ${gstRate}% GST` : ''}</span><span class="cv">${fmtMoney(t.total, cur)}</span></div>`;
  $id('pv_words').textContent = t.total > 0 ? 'Amount in words: ' + amountInWords(t.total, cur) : '';
}

function renderOptionsPreview(q){
  const cur = q.meta.currency;
  const gstOn = q.meta.gstEnabled, gstRate = parseFloat(q.meta.gstRate) || 0;
  const opts = q.options.filter(o => (o.name || '').trim() || o.price !== '');
  const commons = q.costs.filter(c => (c.label || '').trim() && parseFloat(c.amount));
  const posts = q.postCosts.filter(c => (c.label || '').trim() && parseFloat(c.amount));

  const blocks = opts.map((o, i) => {
    const specs = [
      ['Year', o.year], ['Seats', o.seats],
      ...String(o.specs || '').split('\n').filter(Boolean).map(line => {
        const m = line.split(':');
        return m.length > 1 ? [m[0].trim(), m.slice(1).join(':').trim()] : ['', line.trim()];
      })
    ].filter(s => s[1]);
    const photos = Array.isArray(o.photos) ? o.photos : (o.photo ? [o.photo] : []);
    const photoHtml = photos.length
      ? `<div class="ob-photos${photos.length === 1 ? ' single' : ''}">${photos.map(p => `<img src="${p}" alt="">`).join('')}</div>`
      : '';
    return `<div class="opt-block">
      <div class="ob-head"><span class="ob-num">${i + 1}</span><span class="ob-name">${escHtml(o.name) || 'Aircraft'}</span>
        <span class="ob-price">${curSymbol(cur)} ${fmtMoney(parseFloat(o.price) || 0, cur)}</span></div>
      <div class="ob-body">
        ${photoHtml}
        <div class="ob-specs">${specs.map(s => `${s[0] ? `<span class="sk">${escHtml(s[0])}:</span>` : '<span class="sk"></span>'}<span class="sv2">${escHtml(s[1])}</span>`).join('')}</div>
      </div>
      ${(o.remarks || '').trim() ? `<div class="ob-remarks">${escHtml(o.remarks)}</div>` : ''}
    </div>`;
  }).join('');

  const extraRow = (c, note) => `<div class="crow"><span class="cl">${escHtml(c.label)} <span style="color:#6b7a92;font-size:11px">(${note})</span></span><span class="cv">${fmtMoney(parseFloat(c.amount) || 0, cur)}</span></div>`;
  const commonRows = (commons.length || posts.length) ? `<div class="costlist opt-totals">
      ${commons.map(c => extraRow(c, 'added to every option')).join('')}
      ${posts.map(c => extraRow(c, 'GST-free, every option')).join('')}
    </div>` : '';

  const compare = opts.length ? `<div class="costlist opt-totals">
      ${opts.map((o, i) => {
        const t = computeOptionTotals(o, commons, gstOn, gstRate, posts);
        return `<div class="crow ${i === 0 ? 'sub' : ''}"><span class="cl">Option ${i + 1} — ${escHtml(o.name) || 'Aircraft'}${gstOn && gstRate > 0 ? ` (incl. ${gstRate}% GST)` : ''}</span><span class="cv">${curSymbol(cur)} ${fmtMoney(t.total, cur)}</span></div>`;
      }).join('')}
    </div>` : '';

  $id('pv_costs').innerHTML = '';
  $id('pv_words').textContent = '';
  $id('pv_optwrap').innerHTML = blocks + commonRows + compare;
}

function renderTotalsBox(q){
  const cur = q.meta.currency, sym = curSymbol(cur);
  const gstOn = q.meta.gstEnabled, gstRate = parseFloat(q.meta.gstRate) || 0;
  if (q.meta.multiAircraft){
    const opts = q.options.filter(o => (o.name || '').trim() || o.price !== '');
    const commons = q.costs.filter(c => (c.label || '').trim() && parseFloat(c.amount));
    const posts = q.postCosts.filter(c => (c.label || '').trim() && parseFloat(c.amount));
    $id('t_rows').innerHTML = opts.length
      ? opts.map((o, i) => {
          const t = computeOptionTotals(o, commons, gstOn, gstRate, posts);
          return `<div class="trow"><span>Opt ${i + 1} · ${escHtml(o.name) || '—'}</span><span>${sym} ${fmtMoney(t.total, cur)}</span></div>`;
        }).join('') + `<div class="trow grand"><span>${opts.length} option${opts.length > 1 ? 's' : ''} all-inclusive</span><span>&nbsp;</span></div>`
      : '<div class="trow"><span>No aircraft options yet</span><span>—</span></div>';
  } else {
    const t = computeTotals(q.costs, gstOn, gstRate, q.postCosts);
    $id('t_rows').innerHTML =
      `<div class="trow"><span>Sub Total</span><span>${sym} ${fmtMoney(t.sub, cur)}</span></div>` +
      (gstOn ? `<div class="trow"><span>GST @ ${gstRate}%</span><span>${sym} ${fmtMoney(t.gst, cur)}</span></div>` : `<div class="trow"><span>GST</span><span>Not charged</span></div>`) +
      (t.post > 0 ? `<div class="trow"><span>GST-free charges</span><span>${sym} ${fmtMoney(t.post, cur)}</span></div>` : '') +
      `<div class="trow grand"><span>All Inclusive</span><span>${sym} ${fmtMoney(t.total, cur)}</span></div>`;
  }
}

/* ============================================================
   PAGE FLOW & OVERFLOW
   ============================================================ */
/* Flow overflowing option blocks onto a continuation page.
   The originals never leave page 1 — overflowing ones are hidden there
   and CLONED onto the continuation page. Idempotent by construction:
   every pass first removes old continuation pages and unhides all
   originals, so repeated runs (or runs after a rebuild) can't lose or
   duplicate content. */
function flowOptionPages(q){
  document.querySelectorAll('.page.opt-cont').forEach(p => p.remove());
  const optwrap = $id('pv_optwrap');
  [...optwrap.children].forEach(el => { el.style.display = ''; });
  if (!q.meta.multiAircraft) return;
  const page1 = $id('page1');
  const body = page1.querySelector('.q-body');
  const overflowed = [];
  let guard = 0;
  while (body.scrollHeight > body.clientHeight + 2 && guard++ < 30){
    const visible = [...optwrap.children].filter(el => el.style.display !== 'none');
    if (visible.length <= 1) break;
    const last = visible[visible.length - 1];
    last.style.display = 'none';
    overflowed.unshift(last);
  }
  if (!overflowed.length) return;
  const cont = document.createElement('div');
  cont.className = 'page opt-cont';
  cont.innerHTML = `<div class="overflow-flag">Content exceeds A4 — reduce rows</div>
    <div class="t-header"><img src="${LOGO_SRC}" alt=""><div class="t-title">Aircraft Options (contd.)</div></div>
    <div class="t-body opt-cont-body" style="padding-top:16px"></div>
    <div class="t-footer"><div class="redrule"></div><div class="site">${getPath(q, 'site') || ''}</div></div>`;
  page1.after(cont);
  const dest = cont.querySelector('.opt-cont-body');
  overflowed.forEach(el => {
    const clone = el.cloneNode(true);
    clone.style.display = '';
    dest.appendChild(clone);
  });
}

function flagOverflows(){
  document.querySelectorAll('#pages .page').forEach(p => {
    if (p.hidden) return;
    const body = p.querySelector('.q-body, .t-body, .map-body, .opt-cont-body');
    const over = body && body.scrollHeight > body.clientHeight + 2;
    p.classList.toggle('overflowing', !!over);
  });
}
