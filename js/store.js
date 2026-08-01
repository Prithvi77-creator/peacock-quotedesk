/* ============================================================
   Peacock QuoteDesk — session helpers
   Nothing is persisted to disk. Company details live in memory
   for the current session only; quotation numbers are timestamp
   based so they stay unique without any storage.
   (The PHP phase will add real server-side storage.)
   ============================================================ */

/* ---- company profile (in-memory defaults; editable per session) ---- */
function loadOrg(){ return Object.assign({}, ORG_DEFAULTS); }
function saveOrg(org){ /* no-op: not written to disk */ }

/* ---- quotation numbering: PJL-YYYYMMDD-HHMM (unique, no storage) ---- */
function nextQno(){
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `PJL-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

/* ---- image downscale (aircraft photos → small JPEG data URLs) ---- */
function downscaleImage(file, maxEdge, cb){
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      cb(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => toast('Could not read that image file.');
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
