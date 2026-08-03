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
      includeTnc: true, includeMap: false, includeNotes: false,
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
  $('f_multi').checked = Q.meta.multiAircraft;
  $('f_configuration').value = Q.meta.configuration || '';
  $('f_positioning').value = Q.meta.positioning || '';
  $('f_addl_notes').value = Q.additionalNotes || '';
  $('f_ac_details').value = Q.aircraftDetails || '';
  $('med_fields').hidden = Q.meta.template !== 'medical';
  $('notes_field').hidden = !Q.meta.includeNotes;
  $('opt_section').hidden = !Q.meta.multiAircraft;
  $('ac_photo_field').hidden = Q.meta.multiAircraft;
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
  document.getElementById('cost_h2').firstChild.textContent =
    Q.meta.multiAircraft ? 'Common charges (all options) ' : 'Costing ';
  renderFormOptions();
  upd();
}

/* single-aircraft photos (multiple) — shown on a dedicated gallery page */
function updateAircraftPhotoUI(){
  const list = document.getElementById('ac_photos_list');
  list.innerHTML = Q.aircraftPhotos.map((p, i) =>
    `<div class="ac-thumb"><img src="${p}" alt=""><button type="button" class="ac-thumb-x" title="Remove" onclick="removeAircraftPhoto(${i})">✕</button></div>`
  ).join('') || '<span class="ph" style="align-self:center">no photos yet</span>';
}
function onAircraftPhotos(input){
  const files = [...(input.files || [])];
  input.value = '';
  if (!files.length) return;
  let pending = files.length;
  files.forEach(f => downscaleImage(f, 1100, dataUrl => {
    Q.aircraftPhotos.push(dataUrl);
    if (--pending === 0){ updateAircraftPhotoUI(); upd(); }
  }));
}
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
      <div class="field" style="margin:0"><label>From</label><input value="${escHtml(l.from)}" placeholder="City / Airport" oninput="Q.legs[${i}].from=this.value;upd()"></div>
      <div class="field" style="margin:0"><label>To</label><input value="${escHtml(l.to)}" placeholder="City / Airport" oninput="Q.legs[${i}].to=this.value;upd()"></div>
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
    <input type="number" value="${c.amount === '' ? '' : c.amount}" placeholder="Amount" oninput="Q.costs[${i}].amount=this.value;upd()">
    <button class="del" onclick="delCost(${i})">✕</button>
  </div>`).join('');
}
function renderFormPostCosts(){
  document.getElementById('postcosts').innerHTML = Q.postCosts.map((c, i) => `
  <div class="cost-row">
    <input value="${escHtml(c.label)}" placeholder="Description (GST-free)" oninput="Q.postCosts[${i}].label=this.value;upd()">
    <input type="number" value="${c.amount === '' ? '' : c.amount}" placeholder="Amount" oninput="Q.postCosts[${i}].amount=this.value;upd()">
    <button class="del" onclick="delPostCost(${i})">✕</button>
  </div>`).join('');
}
function blankOption(){ return { name: '', year: '', seats: '', specs: '', price: '', remarks: '', photo: '' }; }
function renderFormOptions(){
  document.getElementById('options').innerHTML = Q.options.map((o, i) => `
  <div class="opt-card">
    <div class="leg-head"><span>OPTION ${i + 1}</span><button class="del" onclick="delOption(${i})">✕ remove</button></div>
    <div class="grid2">
      <div class="field" style="margin:0"><label>Aircraft</label><input list="aclist" value="${escHtml(o.name)}" oninput="Q.options[${i}].name=this.value;upd()"></div>
      <div class="field" style="margin:0"><label>Price (${Q.meta.currency})</label><input type="number" value="${o.price === '' ? '' : o.price}" oninput="Q.options[${i}].price=this.value;upd()"></div>
    </div>
    <div class="grid2" style="margin-top:8px">
      <div class="field" style="margin:0"><label>Year of manufacture</label><input value="${escHtml(o.year)}" oninput="Q.options[${i}].year=this.value;upd()"></div>
      <div class="field" style="margin:0"><label>Seats</label><input value="${escHtml(o.seats)}" oninput="Q.options[${i}].seats=this.value;upd()"></div>
    </div>
    <div class="field" style="margin:8px 0 0"><label>Key details (one per line, "Label: value")</label>
      <textarea rows="2" placeholder="WiFi: Yes&#10;Refurbished: 2022" oninput="Q.options[${i}].specs=this.value;upd()">${escHtml(o.specs)}</textarea></div>
    <div class="field" style="margin:8px 0 0"><label>Remarks</label><input value="${escHtml(o.remarks)}" oninput="Q.options[${i}].remarks=this.value;upd()"></div>
    <div class="field" style="margin:8px 0 0"><label>Photo</label>
      <div class="photo-drop">
        ${o.photo ? `<img src="${o.photo}" alt="">` : '<span class="ph">no photo</span>'}
        <input type="file" accept="image/*" style="border:none;padding:4px 0;background:none" onchange="onOptionPhoto(this, ${i})">
      </div>
    </div>
  </div>`).join('');
}
function onOptionPhoto(input, i){
  const file = input.files && input.files[0];
  if (!file) return;
  downscaleImage(file, 640, dataUrl => {
    Q.options[i].photo = dataUrl;
    renderFormOptions();
    upd();
  });
}

function addLeg(){ Q.legs.push({ date: '', from: '', to: '', etd: 'TBA', time: '', remarks: '' }); renderFormLegs(); upd(); }
function delLeg(i){ Q.legs.splice(i, 1); renderFormLegs(); upd(); }
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
const APP_PASSWORD = '1249';
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
  // keep the preview fitted to the viewport as it changes (rotate / resize)
  let _resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeT);
    _resizeT = setTimeout(fitPreview, 120);
  });
  window.addEventListener('beforeprint', () => { if (Q) reflowNow(Q); });
})();
