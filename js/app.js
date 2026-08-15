/* ============================================================
   Peacock QuoteDesk — application controller
   Single editor page. Nothing is persisted: fill in a quotation,
   download the PDF, done. "New quotation" clears to a blank one.
   ============================================================ */

let ORG = loadOrg();
let Q = null;                       // current quotation
const M = () => Q.meta;             // shorthand used by inline form handlers

const todayISO = () => new Date().toISOString().slice(0, 10);
const deep = o => JSON.parse(JSON.stringify(o));

/* ================= quote factory ================= */
function newQuote(template){
  const tpl = TEMPLATES[template];
  return {
    meta: {
      template, qno: nextQno(), date: todayISO(), aircraft: '', client: '',
      currency: 'INR', gstRate: tpl.gstDefault, gstEnabled: tpl.gstDefault > 0, multiAircraft: false,
      includeTnc: true, includeMap: false, includeNotes: false, includeAircraftPage: true,
      configuration: '', positioning: ''
    },
    legs: [{ date: '', from: '', to: '', etd: 'TBA', time: '', remarks: '' }],
    costs: deep(tpl.costs),
    postCosts: [],
    options: [],
    aircraftPhotos: [],           // single-aircraft gallery photos
    aircraftDetails: '',          // single-aircraft details / specs
    header: {
      coName: ORG.coName,
      coLine: ORG.coLine,
      coContact: `${escHtml(ORG.coPhones)}<br>${escHtml(ORG.coEmail)}<br>${escHtml(ORG.coWeb)}`
    },
    greeting: tpl.greeting,
    posBar: tpl.posBar,
    metaLabels: {
      aircraft: 'Aircraft:', configuration: 'Configuration:', positioning: 'Positioning:',
      qno: 'Quotation number:', date: 'Date', client: 'Prepared for:'
    },
    flightsTitle: 'Flight Details',
    costTitle: tpl.costTitle,
    tableHeads: { date: 'DATE', from: 'FROM', to: 'TO', etd: 'ETD', time: 'APX.FLY.TIME', remarks: 'REMARKS' },
    notesTitle: 'PLEASE NOTE',
    notes: deep(tpl.notes),
    mapTitle: 'Destination Route Map',
    additionalTitle: 'Additional Information',
    additionalNotes: '',
    tncTitle: 'Peacock Jetlines : Terms and Conditions',
    tnc: deep(TNC_PAGES),
    site: ORG.coWeb,
    signFor: ORG.signFor,
    signRole: ORG.signRole
  };
}

/* ================= editor lifecycle (nothing is persisted) ================= */
function newQuotation(){
  if (Q && !confirm('Start a new blank quotation? The current one will be cleared.')) return;
  Q = newQuote('private');
  loadQuoteIntoUI();
  toast('New quotation started.');
}

function switchTemplate(template){
  if (Q.meta.template === template) return;
  const oldTpl = TEMPLATES[Q.meta.template];
  const dirty = JSON.stringify(Q.costs) !== JSON.stringify(oldTpl.costs)
             || JSON.stringify(Q.notes) !== JSON.stringify(oldTpl.notes);
  if (dirty && !confirm('Switching the quotation type reloads its cost lines, notes and greeting for the new format. Your itinerary and details stay. Continue?')) return;
  const tpl = TEMPLATES[template];
  Q.meta.template = template;
  Q.meta.gstRate = tpl.gstDefault;
  Q.meta.gstEnabled = tpl.gstDefault > 0;
  Q.costs = deep(tpl.costs);
  Q.notes = deep(tpl.notes);
  Q.greeting = tpl.greeting;
  Q.posBar = tpl.posBar;
  Q.costTitle = tpl.costTitle;
  loadQuoteIntoUI();
}

/* Push all Q state into form + preview (full rebuild). */
function loadQuoteIntoUI(){
  const $ = id => document.getElementById(id);
  _lastFleetKey = null;                 // let the next aircraft pick auto-fill
  document.querySelectorAll('#tpl_seg button').forEach(b =>
    b.classList.toggle('active', b.dataset.tpl === Q.meta.template));
  $('f_qno').value = Q.meta.qno;
  $('f_date').value = Q.meta.date;
  $('f_aircraft').value = Q.meta.aircraft;
  $('f_cur').value = Q.meta.currency;
  $('f_client').value = Q.meta.client;
  $('f_gst').value = Q.meta.gstRate;
  $('f_tnc').checked = Q.meta.includeTnc;
  $('f_map').checked = Q.meta.includeMap;
  $('f_notes').checked = Q.meta.includeNotes;
  $('f_aircraftpage').checked = Q.meta.includeAircraftPage !== false;
  $('f_multi').checked = Q.meta.multiAircraft;
  $('f_configuration').value = Q.meta.configuration || '';
  $('f_positioning').value = Q.meta.positioning || '';
  $('f_addl_notes').value = Q.additionalNotes || '';
  $('f_ac_details').value = Q.aircraftDetails || '';
  $('med_fields').hidden = Q.meta.template !== 'medical';
  $('notes_field').hidden = !Q.meta.includeNotes;
  $('opt_section').hidden = !Q.meta.multiAircraft;
  $('ac_photo_field').hidden = Q.meta.multiAircraft;
  syncAircraftField();
  $('cost_h2').firstChild.textContent = Q.meta.multiAircraft ? 'Common charges (all options) ' : 'Costing ';
  syncGstUI();
  renderFormLegs(); renderFormCosts(); renderFormPostCosts(); renderFormOptions(); updateAircraftPhotoUI();
  buildEditableRegions(Q);
  upd();
}

/* Re-render dynamic preview. Called on every form change. */
function upd(){
  renderPreview(Q);
}
/* Hook for inline preview edits (render.js). No persistence, so nothing to do. */
function quoteTouched(){ /* stateless: nothing is saved */ }

function curChanged(){
  const sel = document.getElementById('f_cur');
  Q.meta.currency = sel.value;
  // convenience: USD (international) drops GST; INR restores it (except medical)
  if (sel.value === 'USD') Q.meta.gstEnabled = false;
  else if (Q.meta.template !== 'medical') Q.meta.gstEnabled = true;
  syncGstUI();
  upd();
}
function onGstToggle(){
  Q.meta.gstEnabled = document.getElementById('f_gst_on').checked;
  syncGstUI();
  upd();
}
function syncGstUI(){
  document.getElementById('f_gst_on').checked = Q.meta.gstEnabled;
  document.getElementById('gst_rate_wrap').hidden = !Q.meta.gstEnabled;
}
function onMultiToggle(){
  Q.meta.multiAircraft = document.getElementById('f_multi').checked;
  if (Q.meta.multiAircraft && !Q.options.length) Q.options.push(blankOption());
  document.getElementById('opt_section').hidden = !Q.meta.multiAircraft;
  document.getElementById('ac_photo_field').hidden = Q.meta.multiAircraft;
  syncAircraftField();
  document.getElementById('cost_h2').firstChild.textContent =
    Q.meta.multiAircraft ? 'Common charges (all options) ' : 'Costing ';
  renderFormOptions();
  upd();
}
// The single top-level Aircraft field is redundant in comparison mode (each option
// names its own aircraft), so hide it and let Currency take the full row.
function syncAircraftField(){
  document.getElementById('ac_name_field').hidden = Q.meta.multiAircraft;
  document.getElementById('ac_cur_row').classList.toggle('solo', Q.meta.multiAircraft);
}

/* ===== Fleet Master: pick an aircraft → auto-fill its details + photos ===== */
let _lastFleetKey = null;
function onAircraftChange(){
  if (Q.meta.multiAircraft) return;                 // single-aircraft only
  const entry = fleetLookup(Q.meta.aircraft);
  const key = entry ? fleetKey(Q.meta.aircraft) : null;
  if (!entry || key === _lastFleetKey) return;      // only when it changes to a known aircraft
  _lastFleetKey = key;
  // details — fill from the fleet spec
  Q.aircraftDetails = entry.specs;
  document.getElementById('f_ac_details').value = entry.specs;
  // photos — load the fleet images that actually exist (graceful if files not added yet)
  Q.aircraftPhotos = [];
  (entry.photos || []).forEach(src => {
    const img = new Image();
    img.onload = () => { Q.aircraftPhotos.push(mkPhoto(src)); updateAircraftPhotoUI(); upd(); };
    img.onerror = () => {};                          // file not present — skip silently
    img.src = src;
  });
  updateAircraftPhotoUI();
  upd();
  toast('Loaded details for ' + (Q.meta.aircraft || 'aircraft') + '. Edit anything as needed.');
}

/* single-aircraft photos (multiple) — shown on a dedicated gallery page */
function updateAircraftPhotoUI(){
  const list = document.getElementById('ac_photos_list');
  list.innerHTML = Q.aircraftPhotos.map((p, i) =>
    `<div class="ac-thumb"><img src="${photoSrc(p)}" style="${photoFrameStyle(p)}" alt="">`
    + `<button type="button" class="ac-thumb-edit" title="Resize / reframe" onclick="adjustAircraftPhoto(${i})">&#9713;</button>`
    + `<button type="button" class="ac-thumb-x" title="Remove" onclick="removeAircraftPhoto(${i})">✕</button></div>`
  ).join('') || '<span class="ph" style="align-self:center">no photos yet</span>';
}
function onAircraftPhotos(input){
  const files = [...(input.files || [])];
  input.value = '';
  if (!files.length) return;
  let pending = files.length;
  files.forEach(f => downscaleImage(f, 1100, dataUrl => {
    Q.aircraftPhotos.push(mkPhoto(dataUrl));
    if (--pending === 0){ updateAircraftPhotoUI(); upd(); }
  }));
}
function adjustAircraftPhoto(i){ openPhotoAdjust(Q.aircraftPhotos, i, () => { updateAircraftPhotoUI(); upd(); }); }
function removeAircraftPhoto(i){ Q.aircraftPhotos.splice(i, 1); updateAircraftPhotoUI(); upd(); }
function onNotesToggle(){
  Q.meta.includeNotes = document.getElementById('f_notes').checked;
  document.getElementById('notes_field').hidden = !Q.meta.includeNotes;
  upd();
}

/* ================= form: legs / costs / options ================= */
function renderFormLegs(){
  document.getElementById('legs').innerHTML = Q.legs.map((l, i) => `
  <div class="leg-card">
    <div class="leg-head"><span>LEG ${i + 1}</span><button class="del" onclick="delLeg(${i})">✕ remove</button></div>
    <div class="grid2">
      <div class="field" style="margin:0"><label>Date</label><input type="date" value="${l.date}" oninput="Q.legs[${i}].date=this.value;upd()"></div>
      <div class="field" style="margin:0"><label>ETD</label><input value="${escHtml(l.etd)}" placeholder="TBA / 09:00" oninput="Q.legs[${i}].etd=this.value;upd()"></div>
    </div>
    <div class="grid2" style="margin-top:8px">
      <div class="field city-field" style="margin:0"><label>From</label><input class="city-input" data-leg="${i}" data-fld="from" autocomplete="off" value="${escHtml(l.from)}" placeholder="Type a city…" oninput="onCityInput(this,${i},'from')" onblur="cityBlur()"></div>
      <div class="field city-field" style="margin:0"><label>To</label><input class="city-input" data-leg="${i}" data-fld="to" autocomplete="off" value="${escHtml(l.to)}" placeholder="Type a city…" oninput="onCityInput(this,${i},'to')" onblur="cityBlur()"></div>
    </div>
    <div class="grid2" style="margin-top:8px">
      <div class="field" style="margin:0"><label>Approx. fly time</label><input value="${escHtml(l.time)}" placeholder="2:15" oninput="Q.legs[${i}].time=this.value;upd()"></div>
      <div class="field" style="margin:0"><label>Remarks / Pax</label><input value="${escHtml(l.remarks)}" placeholder="e.g. 8 pax" oninput="Q.legs[${i}].remarks=this.value;upd()"></div>
    </div>
  </div>`).join('');
}
function renderFormCosts(){
  document.getElementById('costs').innerHTML = Q.costs.map((c, i) => `
  <div class="cost-row">
    <input value="${escHtml(c.label)}" placeholder="Description" oninput="Q.costs[${i}].label=this.value;upd()">
    <input type="number" min="0" step="1" value="${c.amount === '' ? '' : c.amount}" placeholder="Amount" oninput="Q.costs[${i}].amount=this.value;upd()">
    <button class="del" onclick="delCost(${i})">✕</button>
  </div>`).join('');
}
function renderFormPostCosts(){
  document.getElementById('postcosts').innerHTML = Q.postCosts.map((c, i) => `
  <div class="cost-row">
    <input value="${escHtml(c.label)}" placeholder="Description (GST-free)" oninput="Q.postCosts[${i}].label=this.value;upd()">
    <input type="number" min="0" step="1" value="${c.amount === '' ? '' : c.amount}" placeholder="Amount" oninput="Q.postCosts[${i}].amount=this.value;upd()">
    <button class="del" onclick="delPostCost(${i})">✕</button>
  </div>`).join('');
}
function blankOption(){ return { name: '', year: '', seats: '', specs: '', price: '', remarks: '', photos: [] }; }
function renderFormOptions(){
  document.getElementById('options').innerHTML = Q.options.map((o, i) => `
  <div class="opt-card">
    <div class="leg-head"><span>OPTION ${i + 1}</span><button class="del" onclick="delOption(${i})">✕ remove</button></div>
    <div class="grid2">
      <div class="field" style="margin:0"><label>Aircraft</label><input list="aclist" value="${escHtml(o.name)}" oninput="Q.options[${i}].name=this.value;upd()"></div>
      <div class="field" style="margin:0"><label>Price (${Q.meta.currency})</label><input type="number" min="0" step="1" value="${o.price === '' ? '' : o.price}" oninput="Q.options[${i}].price=this.value;upd()"></div>
    </div>
    <div class="grid2" style="margin-top:8px">
      <div class="field" style="margin:0"><label>Year of manufacture</label><input value="${escHtml(o.year)}" oninput="Q.options[${i}].year=this.value;upd()"></div>
      <div class="field" style="margin:0"><label>Seats</label><input value="${escHtml(o.seats)}" oninput="Q.options[${i}].seats=this.value;upd()"></div>
    </div>
    <div class="field" style="margin:8px 0 0"><label>Key details (one per line, "Label: value")</label>
      <textarea rows="2" placeholder="WiFi: Yes&#10;Refurbished: 2022" oninput="Q.options[${i}].specs=this.value;upd()">${escHtml(o.specs)}</textarea></div>
    <div class="field" style="margin:8px 0 0"><label>Remarks</label><input value="${escHtml(o.remarks)}" oninput="Q.options[${i}].remarks=this.value;upd()"></div>
    <div class="field" style="margin:8px 0 0"><label>Photos (optional — select one or several)</label>
      <div class="ac-photos-list">${(o.photos || []).map((p, j) =>
        `<div class="ac-thumb"><img src="${photoSrc(p)}" style="${photoFrameStyle(p)}" alt="">`
        + `<button type="button" class="ac-thumb-edit" title="Resize / reframe" onclick="adjustOptionPhoto(${i}, ${j})">&#9713;</button>`
        + `<button type="button" class="ac-thumb-x" title="Remove" onclick="delOptionPhoto(${i}, ${j})">✕</button></div>`
      ).join('') || '<span class="ph" style="align-self:center">no photos yet</span>'}</div>
      <label class="addbtn" style="display:block; text-align:center; margin-top:8px; cursor:pointer">+ Add photos
        <input type="file" accept="image/*" multiple onchange="onOptionPhoto(this, ${i})" hidden></label>
    </div>
  </div>`).join('');
}
function onOptionPhoto(input, i){
  const files = [...(input.files || [])];
  input.value = '';
  if (!files.length) return;
  if (!Array.isArray(Q.options[i].photos)) Q.options[i].photos = [];
  let pending = files.length;
  files.forEach(f => downscaleImage(f, 900, dataUrl => {
    Q.options[i].photos.push(mkPhoto(dataUrl));
    if (--pending === 0){ renderFormOptions(); upd(); }
  }));
}
function delOptionPhoto(i, j){ Q.options[i].photos.splice(j, 1); renderFormOptions(); upd(); }
function adjustOptionPhoto(oi, j){ openPhotoAdjust(Q.options[oi].photos, j, () => { renderFormOptions(); upd(); }); }

/* ===== image resize / reframe modal — set how a photo fills its frame ===== */
let _pa = null;   // { arr, idx, p, onChange, drag }
function openPhotoAdjust(arr, idx, onChange){
  let p = arr[idx];
  if (typeof p === 'string' || !p){ p = mkPhoto(photoSrc(p)); arr[idx] = p; }  // upgrade legacy string
  if (p.fit == null) p.fit = 'cover';
  if (p.zoom == null) p.zoom = 1;
  if (p.x == null) p.x = 50;
  if (p.y == null) p.y = 50;
  _pa = { arr, idx, p, onChange };
  const m = document.getElementById('photo_adjust');
  m.hidden = false;
  paSetCropMode(false);
  paSyncControls();
  paRenderPreview();
}
function paSyncControls(){
  const p = _pa.p;
  document.getElementById('pa_zoom').value = p.zoom;
  document.querySelectorAll('#pa_fitseg [data-fit]').forEach(b =>
    b.classList.toggle('active', b.dataset.fit === (p.fit || 'cover')));
}
function paRenderPreview(){
  const img = document.getElementById('pa_img');
  img.src = photoSrc(_pa.p);
  img.style.cssText = photoFrameStyle(_pa.p);
}
function paSetFit(fit){ _pa.p.fit = fit; paSyncControls(); paRenderPreview(); }
function paSetZoom(v){ _pa.p.zoom = parseFloat(v) || 1; paRenderPreview(); }
function paReset(){ Object.assign(_pa.p, { fit: 'cover', zoom: 1, x: 50, y: 50 }); paSyncControls(); paRenderPreview(); }
function paDone(){
  // leaving via Done/backdrop while cropping = don't apply the crop; keep prior framing
  if (_paCropMode && _paCropSnap && _pa) Object.assign(_pa.p, _paCropSnap);
  _paCropSnap = null;
  paSetCropMode(false);
  const m = document.getElementById('photo_adjust');
  m.hidden = true;
  if (_pa && _pa.onChange) _pa.onChange();
  _pa = null;
}
// drag the preview to pan the focal point (0–100%)
function paDragStart(e){
  if (!_pa || _paCropMode) return;
  e.preventDefault();
  const frame = document.getElementById('pa_frame');
  const move = ev => {
    const pt = ev.touches ? ev.touches[0] : ev;
    if (paDragStart._last){
      const dx = pt.clientX - paDragStart._last.x, dy = pt.clientY - paDragStart._last.y;
      const k = 0.28;   // sensitivity: dragging the image follows the cursor
      _pa.p.x = Math.max(0, Math.min(100, _pa.p.x - dx * k));
      _pa.p.y = Math.max(0, Math.min(100, _pa.p.y - dy * k));
      paRenderPreview();
    }
    paDragStart._last = { x: pt.clientX, y: pt.clientY };
  };
  const up = () => {
    paDragStart._last = null;
    window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up);
    window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up);
  };
  paDragStart._last = null;
  window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  window.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', up);
}

/* ---- crop: select a region of the source image and cut to it ---- */
let _paCropMode = false, _paCrop = null, _paCropSnap = null;
function paSetCropMode(on){
  _paCropMode = on;
  const g = id => { const e = document.getElementById(id); if (e) e.hidden = false; };
  const h = id => { const e = document.getElementById(id); if (e) e.hidden = true; };
  (on ? g : h)('pa_crop'); (on ? g : h)('pa_cropbar');
  (on ? h : g)('pa_normal');
  const fr = document.getElementById('pa_frame'); if (fr) fr.classList.toggle('cropping', on);
}
// the rect (in frame px) that a "contain"-fitted image actually occupies
function imgDisplayRect(frame, natW, natH){
  const fw = frame.clientWidth, fh = frame.clientHeight;
  const af = fw / fh, ai = natW / natH;
  let w, h;
  if (ai > af){ w = fw; h = fw / ai; } else { h = fh; w = fh * ai; }
  return { x: (fw - w) / 2, y: (fh - h) / 2, w, h };
}
function setCropBox(x, y, w, h){
  const b = document.getElementById('pa_crop_box');
  b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.width = w + 'px'; b.style.height = h + 'px';
}
function paCropStart(){
  if (!_pa) return;
  const img = document.getElementById('pa_img');
  const natW = img.naturalWidth || 1500, natH = img.naturalHeight || 1000;
  // snapshot only the framing; Cancel/Done restore that (a Reset to the original sticks)
  _paCropSnap = { fit: _pa.p.fit, zoom: _pa.p.zoom, x: _pa.p.x, y: _pa.p.y };
  Object.assign(_pa.p, { fit: 'contain', zoom: 1, x: 50, y: 50 });   // show the whole image to crop from
  paRenderPreview();
  const frame = document.getElementById('pa_frame');
  const r = imgDisplayRect(frame, natW, natH);
  _paCrop = { natW, natH, imgRect: r };
  setCropBox(r.x, r.y, r.w, r.h);          // default selection = whole image
  paSetCropMode(true);
}
function paCropCancel(){
  if (_paCropSnap) Object.assign(_pa.p, _paCropSnap);
  paSetCropMode(false); paSyncControls(); paRenderPreview();
}
// restore the original (pre-crop) photo and reset the selection to the whole image
function paCropReset(){
  if (!_pa) return;
  const restore = _pa.p.orig || photoSrc(_pa.p);
  _pa.p.src = restore;
  Object.assign(_pa.p, { fit: 'contain', zoom: 1, x: 50, y: 50 });
  paRenderPreview();
  const probe = new Image();
  probe.onload = () => {
    const frame = document.getElementById('pa_frame');
    const r = imgDisplayRect(frame, probe.naturalWidth, probe.naturalHeight);
    _paCrop = { natW: probe.naturalWidth, natH: probe.naturalHeight, imgRect: r };
    setCropBox(r.x, r.y, r.w, r.h);
  };
  probe.src = restore;
}
function paCropApply(){
  const frame = document.getElementById('pa_frame'), box = document.getElementById('pa_crop_box');
  const fr = frame.getBoundingClientRect(), br = box.getBoundingClientRect();
  const { natW, natH, imgRect } = _paCrop;
  const bx = br.left - fr.left, by = br.top - fr.top;
  const fx = (bx - imgRect.x) / imgRect.w, fy = (by - imgRect.y) / imgRect.h;
  const fw = br.width / imgRect.w, fh = br.height / imgRect.h;
  const sx = Math.max(0, fx * natW), sy = Math.max(0, fy * natH);
  const sw = Math.min(natW - sx, fw * natW), sh = Math.min(natH - sy, fh * natH);
  if (sw < 8 || sh < 8){ paCropCancel(); return; }
  if (!_pa.p.orig) _pa.p.orig = photoSrc(_pa.p);   // keep the original so a crop can be reset
  const src = new Image();
  src.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = Math.round(sw); cv.height = Math.round(sh);
    cv.getContext('2d').drawImage(src, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
    let out; try { out = cv.toDataURL('image/jpeg', 0.9); } catch (e) { out = null; }
    if (out) _pa.p.src = out;
    Object.assign(_pa.p, { fit: 'cover', zoom: 1, x: 50, y: 50 });   // fresh image → reset framing
    _paCropSnap = null;
    paSetCropMode(false); paSyncControls(); paRenderPreview();
  };
  src.src = photoSrc(_pa.p);
}
function paPtr(e){ const t = e.touches ? e.touches[0] : e; return { x: t.clientX, y: t.clientY }; }
function paCropDown(ev, mode){
  ev.preventDefault(); ev.stopPropagation();
  const box = document.getElementById('pa_crop_box');
  const start = { x: box.offsetLeft, y: box.offsetTop, w: box.offsetWidth, h: box.offsetHeight };
  const p0 = paPtr(ev), ir = _paCrop.imgRect, MIN = 26;
  const move = e => {
    const p = paPtr(e), dx = p.x - p0.x, dy = p.y - p0.y;
    let x = start.x, y = start.y, w = start.w, h = start.h;
    if (mode === 'move'){ x += dx; y += dy; }
    else {
      if (mode.indexOf('l') >= 0){ x += dx; w -= dx; }
      if (mode.indexOf('r') >= 0){ w += dx; }
      if (mode.indexOf('t') >= 0){ y += dy; h -= dy; }
      if (mode.indexOf('b') >= 0){ h += dy; }
    }
    if (w < MIN){ if (mode.indexOf('l') >= 0) x = start.x + start.w - MIN; w = MIN; }
    if (h < MIN){ if (mode.indexOf('t') >= 0) y = start.y + start.h - MIN; h = MIN; }
    if (x < ir.x){ if (mode === 'move') x = ir.x; else { w += x - ir.x; x = ir.x; } }
    if (y < ir.y){ if (mode === 'move') y = ir.y; else { h += y - ir.y; y = ir.y; } }
    if (x + w > ir.x + ir.w){ if (mode === 'move') x = ir.x + ir.w - w; else w = ir.x + ir.w - x; }
    if (y + h > ir.y + ir.h){ if (mode === 'move') y = ir.y + ir.h - h; else h = ir.y + ir.h - y; }
    setCropBox(x, y, w, h);
  };
  const up = () => {
    window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up);
    window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up);
  };
  window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  window.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', up);
}

function addLeg(){ Q.legs.push({ date: '', from: '', to: '', etd: 'TBA', time: '', remarks: '', fromCoord: null, toCoord: null }); renderFormLegs(); upd(); }
function delLeg(i){ Q.legs.splice(i, 1); renderFormLegs(); upd(); }

/* ===== city search (Photon · OpenStreetMap) — pick a place → store exact coords =====
   The map then plots the chosen point precisely; free-typed names still fall back to
   the offline gazetteer, and if the search is offline the field just behaves normally. */
let _acTimer = null, _acSeq = 0, _acEl = null, _acFeats = [];
function getCityAC(){
  let ac = document.getElementById('city_ac');
  if (!ac){ ac = document.createElement('div'); ac.id = 'city_ac'; ac.className = 'city-ac'; ac.hidden = true; }
  return ac;
}
function hideCityAC(){ const ac = document.getElementById('city_ac'); if (ac) ac.hidden = true; }
function cityBlur(){ setTimeout(hideCityAC, 160); }   // delay so an item's mousedown registers first
function onCityInput(el, i, fld){
  Q.legs[i][fld] = el.value;
  Q.legs[i][fld + 'Coord'] = null;      // a manual edit invalidates any previously picked location
  upd();
  cityAutocomplete(el, i, fld);
}
function cityAutocomplete(el, i, fld){
  _acEl = el;
  clearTimeout(_acTimer);
  const q = el.value.trim();
  if (q.length < 3){ hideCityAC(); return; }
  _acTimer = setTimeout(async () => {
    const seq = ++_acSeq;
    let feats = [];
    try {
      const r = await fetch('https://photon.komoot.io/api/?limit=6&lang=en&q=' + encodeURIComponent(q));
      const j = await r.json();
      feats = (j.features || []).filter(f => f.geometry && f.geometry.coordinates);
    } catch (e) { return; }             // offline / blocked — leave the field as a plain input
    if (seq !== _acSeq || _acEl !== el) return;   // a newer keystroke superseded this query
    showCityAC(el, i, fld, feats);
  }, 260);
}
function acType(p){
  const v = (p.osm_value || '').toLowerCase();
  if (v.indexOf('aerodrome') >= 0 || v.indexOf('airport') >= 0) return 'airport';
  if (['city', 'town', 'village', 'hamlet'].indexOf(v) >= 0) return v;
  return '';
}
function showCityAC(el, i, fld, feats){
  const ac = getCityAC();
  if (!feats.length){ hideCityAC(); return; }
  _acFeats = feats;
  ac.innerHTML = feats.map((f, k) => {
    const p = f.properties;
    const sub = [p.state, p.country].filter(Boolean).join(', ');
    const typ = acType(p);
    return `<div class="city-ac-item" onmousedown="pickCity(event,${k},${i},'${fld}')">`
      + `<span class="ci-name">${escHtml(p.name || '')}${typ ? ` <span class="ci-typ">${escHtml(typ)}</span>` : ''}</span>`
      + `<span class="ci-sub">${escHtml(sub)}</span></div>`;
  }).join('');
  const field = el.closest('.city-field') || el.parentElement;
  field.appendChild(ac);
  ac.hidden = false;
}
function pickCity(ev, k, i, fld){
  ev.preventDefault();
  const f = _acFeats[k]; if (!f) return;
  const c = f.geometry.coordinates;    // [lon, lat]
  Q.legs[i][fld] = f.properties.name || '';
  Q.legs[i][fld + 'Coord'] = [c[1], c[0]];
  const input = document.querySelector('.city-input[data-leg="' + i + '"][data-fld="' + fld + '"]');
  if (input) input.value = Q.legs[i][fld];
  hideCityAC();
  upd();
}
function addCost(){ Q.costs.push({ label: '', amount: '' }); renderFormCosts(); upd(); }
function delCost(i){ Q.costs.splice(i, 1); renderFormCosts(); upd(); }
function addPostCost(){ Q.postCosts.push({ label: '', amount: '' }); renderFormPostCosts(); upd(); }
function delPostCost(i){ Q.postCosts.splice(i, 1); renderFormPostCosts(); upd(); }
function addOption(){ Q.options.push(blankOption()); renderFormOptions(); upd(); }
function delOption(i){ Q.options.splice(i, 1); renderFormOptions(); upd(); }

/* ================= company details (in-memory for this session) ================= */
const ORG_FIELDS = { s_coName: 'coName', s_coLine: 'coLine', s_coPhones: 'coPhones', s_coEmail: 'coEmail', s_coWeb: 'coWeb', s_signFor: 'signFor' };
function seedSettingsInputs(){
  Object.entries(ORG_FIELDS).forEach(([id, key]) => {
    const el = document.getElementById(id);
    el.value = ORG[key] || '';
    el.oninput = () => { ORG[key] = el.value; };
  });
}
function applyOrgToQuote(){
  Q.header = {
    coName: ORG.coName,
    coLine: ORG.coLine,
    coContact: `${escHtml(ORG.coPhones)}<br>${escHtml(ORG.coEmail)}<br>${escHtml(ORG.coWeb)}`
  };
  Q.site = ORG.coWeb;
  Q.signFor = ORG.signFor;
  buildEditableRegions(Q);
  upd();
  toast('Company details applied to this quotation.');
}

/* ================= PDF ================= */
async function downloadPDF(){
  const btn = document.getElementById('dlbtn');
  btn.disabled = true; btn.textContent = 'Generating…';
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  reflowNow(Q);
  await new Promise(r => setTimeout(r, 150));
  // capture at natural size regardless of the on-screen preview scale
  const wrap = document.getElementById('pages');
  const savedTransform = wrap.style.transform, savedMargin = wrap.style.marginBottom;
  wrap.style.transform = 'none'; wrap.style.marginBottom = '0';
  wrap.classList.add('exporting');   // hide the editor-only overflow warning from the PDF
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pages = [...document.querySelectorAll('#pages .page')].filter(p => !p.hidden);
    for (let i = 0; i < pages.length; i++){
      const canvas = await html2canvas(pages[i], { scale: 2.4, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const img = canvas.toDataURL('image/jpeg', 0.92);
      if (i > 0) pdf.addPage();
      pdf.addImage(img, 'JPEG', 0, 0, 210, 297);
    }
    const acRaw = Q.meta.multiAircraft
      ? (Q.options.map(o => o.name).find(Boolean) || 'Options')
      : (Q.meta.aircraft || 'Aircraft');
    const ac = acRaw.replace(/[^\w ]+/g, '').trim().replace(/ +/g, ' ');
    const route = Q.legs.length && Q.legs[0].from ? '-' + Q.legs[0].from.split(',')[0].replace(/[^\w ]+/g, '').trim() : '';
    pdf.save(`Quote-${ac}${route}-${Q.meta.qno}.pdf`);
    toast('PDF downloaded — ready to share with the client.');
  } catch (e){
    console.error(e);
    toast('PDF generation failed here — use your browser’s Print → Save as PDF instead.');
  }
  wrap.classList.remove('exporting');
  wrap.style.transform = savedTransform; wrap.style.marginBottom = savedMargin;
  fitPreview();
  btn.disabled = false; btn.innerHTML = '&#11015;&nbsp; Download PDF';
}

/* ================= toast ================= */
let _toastTimer;
function toast(msg, ms){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), ms || 4200);
}

/* ================= password gate ================= */
/* Client-side deterrent only — NOT real security (the value lives in the page).
   Real access control comes with the PHP/server phase. */
const APP_PASSWORD = '5001';
function submitGate(e){
  if (e) e.preventDefault();
  const inp = document.getElementById('gate_pw');
  if (inp.value === APP_PASSWORD){
    try { sessionStorage.setItem('pjl.auth', '1'); } catch (_){ }
    document.getElementById('gate').hidden = true;
    return false;
  }
  document.getElementById('gate_err').hidden = false;
  inp.value = '';
  inp.focus();
  return false;
}

/* ================= resizable editor panel ================= */
function initResizer(){
  const resizer = document.getElementById('resizer');
  if (!resizer) return;
  const MIN = 320, MAX = 760;
  let dragging = false;
  const apply = clientX => {
    const w = Math.max(MIN, Math.min(MAX, clientX));
    document.documentElement.style.setProperty('--panel-w', w + 'px');
    fitPreview();
  };
  const move = e => { if (dragging) apply(e.touches ? e.touches[0].clientX : e.clientX); };
  const stop = () => { if (!dragging) return; dragging = false; resizer.classList.remove('dragging'); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
  resizer.addEventListener('mousedown', e => { dragging = true; resizer.classList.add('dragging'); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; e.preventDefault(); });
  resizer.addEventListener('touchstart', () => { dragging = true; resizer.classList.add('dragging'); }, { passive: true });
  window.addEventListener('mousemove', move);
  window.addEventListener('touchmove', move, { passive: true });
  window.addEventListener('mouseup', stop);
  window.addEventListener('touchend', stop);
  resizer.addEventListener('dblclick', () => { document.documentElement.style.setProperty('--panel-w', '440px'); fitPreview(); });
}

/* ================= init ================= */
(function init(){
  initResizer();
  document.querySelectorAll('img.js-logo').forEach(img => img.src = LOGO_SRC);
  document.querySelectorAll('img.js-emblem').forEach(img => img.src = EMBLEM_SRC);
  document.getElementById('aclist').innerHTML = AIRCRAFT_LIST.map(a => `<option>${a}</option>`).join('');
  seedSettingsInputs();
  Q = newQuote('private');
  loadQuoteIntoUI();
  // webfont metrics differ from the fallback — re-measure page flow once it loads
  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(() => { if (Q) scheduleReflow(Q); });
  }
  document.addEventListener('visibilitychange', () => {
    if (Q && document.visibilityState === 'visible') scheduleReflow(Q);
  });
  // keep the preview fitted to its container however the size changes —
  // window resize, device rotation, breakpoint stacking, or panel drag.
  let _resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeT);
    _resizeT = setTimeout(fitPreview, 120);
  });
  if (window.ResizeObserver){
    const area = document.querySelector('.preview-area');
    if (area) new ResizeObserver(() => fitPreview()).observe(area);
  }
  window.addEventListener('beforeprint', () => { if (Q) reflowNow(Q); });
})();
