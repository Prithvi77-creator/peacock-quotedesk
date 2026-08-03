/* ============================================================
   Peacock QuoteDesk — geographic route map
   Offline vector basemap (world land + official India outline +
   India state/district detail) with a comprehensive city gazetteer
   (GeoNames cities15000). No tiles, no APIs — stays PDF-crisp.
   ============================================================ */

/* Lazy-parsed gazetteer: normalised city/state name -> [lat, lon].
   Source data lives in cities.js as a compact "name\tlat\tlon" string. */
let _cityMap = null;
function cityMap(){
  if (_cityMap) return _cityMap;
  _cityMap = new Map();
  const s = CITY_DB;
  let i = 0;
  while (i < s.length){
    let nl = s.indexOf('\n', i); if (nl < 0) nl = s.length;
    const t1 = s.indexOf('\t', i);
    const t2 = t1 >= 0 ? s.indexOf('\t', t1 + 1) : -1;
    if (t1 >= 0 && t2 >= 0 && t2 < nl){
      _cityMap.set(s.slice(i, t1), [ +s.slice(t1 + 1, t2), +s.slice(t2 + 1, nl) ]);
    }
    i = nl + 1;
  }
  return _cityMap;
}

/* airport / alternate names → the city they serve (checked before the gazetteer) */
const CITY_ALIASES = {
  'netaji subhas chandra bose':'kolkata','netaji subhas':'kolkata','netaji subash':'kolkata',
  'chhatrapati shivaji maharaj':'mumbai','chhatrapati shivaji':'mumbai','sahar':'mumbai',
  'indira gandhi':'delhi','kempegowda':'bengaluru','bangalore':'bengaluru',
  'rajiv gandhi':'hyderabad','shamshabad':'hyderabad','begumpet':'hyderabad',
  'sardar vallabhbhai patel':'ahmedabad','jolly grant':'dehradun',
  'lokpriya gopinath bordoloi':'guwahati','al maktoum':'dubai','maktoum':'dubai',
  'bombay':'mumbai','madras':'chennai','calcutta':'kolkata','trivandrum':'thiruvananthapuram',
  'calicut':'kozhikode','pondicherry':'puducherry','gurgaon':'gurugram','new york':'new york city'
};
/* common IATA codes → city key */
const IATA = {
  DEL:'delhi',BOM:'mumbai',MAA:'chennai',CCU:'kolkata',BLR:'bengaluru',HYD:'hyderabad',GOI:'goa',
  GOX:'goa',AMD:'ahmedabad',PNQ:'pune',COK:'kochi',JAI:'jaipur',LKO:'lucknow',IXC:'chandigarh',
  ATQ:'amritsar',SXR:'srinagar',IXL:'leh',IXB:'siliguri',GAU:'guwahati',PAT:'patna',BBI:'bhubaneswar',
  NAG:'nagpur',IDR:'indore',VNS:'varanasi',TRV:'thiruvananthapuram',IXZ:'port blair',JDH:'jodhpur',
  DXB:'dubai',DWC:'dubai',AUH:'abu dhabi',SHJ:'sharjah',DOH:'doha',MCT:'muscat',RUH:'riyadh',
  SIN:'singapore',BKK:'bangkok',KUL:'kuala lumpur',HKG:'hong kong',CMB:'colombo',KTM:'kathmandu',
  MLE:'male',DAC:'dhaka',LHR:'london',CDG:'paris',JFK:'new york city'
};

function normCity(s){
  return String(s || '').toLowerCase().replace(/[.'’`]/g,'').replace(/[-_/]/g,' ').replace(/\s+/g,' ').trim();
}
function stripAirport(s){
  return s.replace(/\b(international|intl|int l|int|airport|apt|aerodrome|airbase|air base|airfield|afs|afb|domestic|terminal)\b/g,' ').replace(/\s+/g,' ').trim();
}

/* Resolve free-text place → coords. Exact matching only (no loose substring),
   so it never mis-plots. Tries full name, airport-stripped, each comma part,
   aliases, then IATA. Returns {name, ll:[lat,lon]} or null (→ schematic). */
function resolveCity(name){
  const raw = String(name || '').trim();
  if (!raw) return null;
  const db = cityMap();
  const cand = [];
  const full = normCity(raw);
  cand.push(full, stripAirport(full));
  raw.split(',').forEach(p => { const n = stripAirport(normCity(p)); if (n) cand.push(n); });
  for (const c of cand){
    if (!c) continue;
    const alias = CITY_ALIASES[c];
    if (alias && db.has(alias)) return { name: raw, ll: db.get(alias) };
    if (db.has(c)) return { name: raw, ll: db.get(c) };
  }
  const up = raw.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(up) && IATA[up] && db.has(IATA[up])) return { name: raw, ll: db.get(IATA[up]) };
  return null;
}

/* short label for a node: first comma-part, title-cased, trimmed */
function cityLabel(name){
  const p = String(name || '').split(',')[0].trim();
  return p.length > 22 ? p.slice(0, 21) + '…' : p;
}

/* Build the SVG. legs: [{from,to,date,time}] — geographic if every city resolves,
   otherwise a schematic chain of unique stops. Returns SVG string. */
/* small jet silhouette, nose pointing +x (east); rotated to each leg's heading */
const PLANE_PATH = 'M13 0 L-5 5 L-1 1.5 L-11 1.5 L-13 4 L-9 0 L-13 -4 L-11 -1.5 L-1 -1.5 L-5 -5 Z';

/* per-polygon lon/lat bounding boxes, computed once for fast view culling */
let _geoBBoxes = null;
function geoBBoxes(){
  if (_geoBBoxes) return _geoBBoxes;
  _geoBBoxes = WORLD_GEO.map(rings => {
    let a = 180, b = 90, c = -180, d = -90;
    for (const ring of rings) for (let i = 0; i < ring.length; i++){
      const lon = ring[i][0], lat = ring[i][1];
      if (lon < a) a = lon; if (lat < b) b = lat;
      if (lon > c) c = lon; if (lat > d) d = lat;
    }
    return [a, b, c, d];
  });
  return _geoBBoxes;
}

/* memoize: only rebuild when the itinerary or frame size changes */
let _mapKey = null, _mapSVG = '';
function buildRouteSVG(legs, W, H){
  W = Math.max(320, Math.round(W || 706)); H = Math.max(320, Math.round(H || 820));
  const active = legs.filter(l => (l.from || '').trim() && (l.to || '').trim());
  const key = W + 'x' + H + '|' + JSON.stringify(active.map(l => [l.from, l.to, l.date, l.time]));
  if (key === _mapKey) return _mapSVG;
  _mapKey = key;
  let svg;
  if (!active.length){
    svg = svgFrame(W, H, `<text x="${W/2}" y="${H/2}" text-anchor="middle" font-size="15" fill="#7089a8" font-family="Poppins,sans-serif">Add flight legs to see the route</text>`);
  } else {
    const resolved = active.map(l => ({ ...l, F: resolveCity(l.from), T: resolveCity(l.to) }));
    svg = resolved.every(l => l.F && l.T) ? geoMapSVG(resolved, W, H) : chainSVG(active, W, H);
  }
  _mapSVG = svg;
  return svg;
}

function svgFrame(W, H, inner){
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" font-family="Poppins,sans-serif">
    <defs>
      <linearGradient id="pjl-sea" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stop-color="#eef7ff"/><stop offset="0.55" stop-color="#dcedfb"/><stop offset="1" stop-color="#cbe1f4"/>
      </linearGradient>
      <linearGradient id="pjl-arc" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#14304f"/><stop offset="1" stop-color="#ee3a4e"/>
      </linearGradient>
      <radialGradient id="pjl-vig" cx="0.5" cy="0.42" r="0.75">
        <stop offset="0.6" stop-color="#000000" stop-opacity="0"/><stop offset="1" stop-color="#0f2440" stop-opacity="0.06"/>
      </radialGradient>
      <marker id="pjl-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill="#ee3a4e"/></marker>
    </defs>
    <rect x="-2" y="-2" width="${W+4}" height="${H+4}" fill="url(#pjl-sea)"/>
    ${inner}
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#pjl-vig)" pointer-events="none"/>
  </svg>`;
}

let _indiaBBox = null;
function indiaBBox(){
  if (_indiaBBox) return _indiaBBox;
  let a = 180, b = 90, c = -180, d = -90;
  for (const rings of INDIA_GEO) for (const ring of rings) for (const [lon, lat] of ring){
    if (lon < a) a = lon; if (lat < b) b = lat; if (lon > c) c = lon; if (lat > d) d = lat;
  }
  _indiaBBox = [a, b, c, d];
  return _indiaBBox;
}
function polysPath(polys, Plon){
  let d = '';
  for (const rings of polys) for (const ring of rings){
    for (let j = 0; j < ring.length; j++){
      const p = Plon(ring[j][0], ring[j][1]);
      d += (j ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    }
    d += 'Z';
  }
  return d;
}

/* per-polygon bbox cache for any polygon array (world / states / districts) */
const _bboxCache = new WeakMap();
function bboxesOf(polys){
  let c = _bboxCache.get(polys);
  if (c) return c;
  c = polys.map(rings => {
    let a = 180, b = 90, cc = -180, d = -90;
    for (const ring of rings) for (let j = 0; j < ring.length; j++){
      const lon = ring[j][0], lat = ring[j][1];
      if (lon < a) a = lon; if (lat < b) b = lat; if (lon > cc) cc = lon; if (lat > d) d = lat;
    }
    return [a, b, cc, d];
  });
  _bboxCache.set(polys, c);
  return c;
}
/* stroke (no fill) the outlines of polygons intersecting the visible window */
function strokePolys(polys, win, Plon, color, width, opacity){
  const bb = bboxesOf(polys);
  let out = '';
  for (let i = 0; i < polys.length; i++){
    const b = bb[i];
    if (b[2] < win[0] || b[0] > win[1] || b[3] < win[2] || b[1] > win[3]) continue;
    out += `<path d="${polysPath([polys[i]], Plon)}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}"/>`;
  }
  return out;
}

/* Real geographic map: projected country outlines + the route on top. */
function geoMapSVG(legs, W, H){
  const stops = new Map();
  legs.forEach(l => [l.F, l.T].forEach(c => {
    const k = c.ll.join(',');
    if (!stops.has(k)) stops.set(k, { ll: c.ll, name: cityLabel(c.name) });
  }));
  const pts = [...stops.values()];
  const lats = pts.map(p => p.ll[0]), lons = pts.map(p => p.ll[1]);
  let minLat = Math.min(...lats), maxLat = Math.max(...lats);
  let minLon = Math.min(...lons), maxLon = Math.max(...lons);
  // half-spans (with a minimum) + modest padding, then expand the shorter axis
  // to match the frame's aspect so the map fills it with no wasted margin.
  const cLat = (minLat + maxLat) / 2, cLon = (minLon + maxLon) / 2;
  let hLat = Math.max((maxLat - minLat) / 2, 1.75) * 1.35;
  let hLon = Math.max((maxLon - minLon) / 2, 1.75) * 1.35;
  const midLat = cLat, kx = Math.cos(midLat * Math.PI / 180);
  const frameAR = W / H;
  if ((hLon * kx) / hLat < frameAR) hLon = hLat * frameAR / kx;   // route too tall → widen
  else hLat = hLon * kx / frameAR;                                 // route too wide → heighten
  minLat = cLat - hLat; maxLat = cLat + hLat; minLon = cLon - hLon; maxLon = cLon + hLon;
  const PAD = 4, IW = W - PAD*2, IH = H - PAD*2;
  const sc = Math.min(IW / ((maxLon - minLon) * kx), IH / (maxLat - minLat));
  const usedW = (maxLon - minLon) * kx * sc, usedH = (maxLat - minLat) * sc;
  const ox = PAD + (IW - usedW)/2, oy = PAD + (IH - usedH)/2;
  const Plon = (lon, lat) => [ ox + (lon - minLon) * kx * sc, oy + (maxLat - lat) * sc ];
  const P = ll => Plon(ll[1], ll[0]);

  // visible window ≈ the aspect-matched bbox
  const wLonMin = minLon, wLonMax = maxLon, wLatMin = minLat, wLatMax = maxLat;

  // neighbouring land (context), culled to the visible window
  const bb = geoBBoxes();
  let land = '';
  for (let i = 0; i < WORLD_GEO.length; i++){
    const b = bb[i];
    if (b[2] < wLonMin || b[0] > wLonMax || b[3] < wLatMin || b[1] > wLatMax) continue;
    land += `<path d="${polysPath([WORLD_GEO[i]], Plon)}" fill="#e7ebe2" stroke="#c4d0dd" stroke-width="0.6" fill-rule="evenodd"/>`;
  }

  // India — official outline on top (always depicted correctly), with state /
  // district detail drawn on the fill so close-up routes are never a plain map.
  const ib = indiaBBox();
  const win = [wLonMin, wLonMax, wLatMin, wLatMax];
  const viewSpan = wLatMax - wLatMin;              // vertical extent = zoom proxy
  let india = '';
  if (!(ib[2] < wLonMin || ib[0] > wLonMax || ib[3] < wLatMin || ib[1] > wLatMax)){
    const dp = polysPath(INDIA_GEO, Plon);
    let admin = '';
    if (viewSpan < 22){
      if (viewSpan < 6) admin += strokePolys(DISTRICTS_GEO, win, Plon, '#d1d8cb', 0.5, 0.85);
      admin += strokePolys(STATES_GEO, win, Plon, '#a9b5c4', 0.8, 1);
    }
    india = `<path d="${dp}" fill="#f4efe1" stroke="#ffffff" stroke-width="2.6" fill-rule="evenodd"/>`
          + admin
          + `<path d="${dp}" fill="none" stroke="#33465f" stroke-width="1.1" fill-rule="evenodd"/>`;
  }

  // route: soft casing + gradient arc + plane badge + beacon pins + haloed labels
  let casings = '', arcs = '', planes = '', nodes = '', labels = '';
  legs.forEach((l, i) => {
    const a = P(l.F.ll), b = P(l.T.ll);
    const mx = (a[0]+b[0])/2, my = (a[1]+b[1])/2;
    const dx = b[0]-a[0], dy = b[1]-a[1], len = Math.hypot(dx, dy) || 1;
    const side = i % 2 === 0 ? -1 : 1;
    const off = Math.min(0.20 * len + 12, 66) * side;
    const cx = mx + (-dy/len) * off, cy = my + (dx/len) * off;
    const d = `M${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    casings += `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.9"/>`;
    arcs += `<path d="${d}" fill="none" stroke="url(#pjl-arc)" stroke-width="2.8" stroke-linecap="round" stroke-dasharray="1 7" stroke-dashoffset="0"/>`;
    arcs += `<path d="${d}" fill="none" stroke="#16324f" stroke-width="1.6" stroke-linecap="round" marker-end="url(#pjl-arr)"/>`;
    const pmx = 0.25*a[0] + 0.5*cx + 0.25*b[0], pmy = 0.25*a[1] + 0.5*cy + 0.25*b[1];
    const ang = Math.atan2(b[1]-a[1], b[0]-a[0]) * 180 / Math.PI;
    planes += `<g transform="translate(${pmx.toFixed(1)} ${pmy.toFixed(1)}) rotate(${ang.toFixed(1)})"><circle r="9" fill="#fff" opacity="0.95"/><circle r="9" fill="none" stroke="#dfe7ef" stroke-width="1"/><path d="${PLANE_PATH}" fill="#14304f" transform="scale(0.62)"/></g>`;
    const tag = [l.time ? l.time + ' hrs' : '', fmtDateDisplay(l.date)].filter(Boolean).join(' · ');
    if (tag) labels += `<text x="${cx.toFixed(1)}" y="${(cy + (side<0 ? -12 : 20)).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="500" fill="#33455f" paint-order="stroke" stroke="#fff" stroke-width="2.6" stroke-linejoin="round">${escHtml(tag)}</text>`;
  });
  pts.forEach(p => {
    const [x, y] = P(p.ll);
    nodes += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="#ee3a4e" opacity="0.16"/>`
           + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.2" fill="#fff"/>`
           + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="#ee3a4e"/>`;
    const anchor = x > W - 100 ? 'end' : (x < 100 ? 'start' : 'middle');
    const lx = anchor === 'end' ? x - 10 : (anchor === 'start' ? x + 10 : x);
    const ly = y < 54 ? y + 20 : y - 12;
    labels += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" font-size="12.5" font-weight="700" letter-spacing="0.2" fill="#0f2440" paint-order="stroke" stroke="#fff" stroke-width="3.4" stroke-linejoin="round">${escHtml(p.name)}</text>`;
  });

  return svgFrame(W, H, land + india + casings + arcs + planes + nodes + labels);
}

/* Schematic fallback: unique stops in order of first appearance on a gentle curve */
function chainSVG(legs, W, H){
  const order = [];
  legs.forEach(l => {
    [l.from, l.to].forEach(n => {
      const k = cityLabel(n).toLowerCase();
      if (!order.some(o => o.k === k)) order.push({ k, name: cityLabel(n) });
    });
  });
  const n = order.length;
  const PADX = 90, span = W - PADX*2;
  const pos = order.map((o, i) => {
    const x = n === 1 ? W/2 : PADX + span * (i/(n-1));
    const y = H/2 + Math.sin((i/(Math.max(n-1,1))) * Math.PI) * -46 + 30;
    return { ...o, x, y };
  });
  const at = k => pos.find(p => p.k === k);
  let arcs = '', nodes = '', labels = '';
  legs.forEach((l, i) => {
    const a = at(cityLabel(l.from).toLowerCase()), b = at(cityLabel(l.to).toLowerCase());
    if (!a || !b) return;
    const mx = (a.x+b.x)/2;
    const side = a.x <= b.x ? -1 : 1;               // outbound above, return below
    const cy = (a.y+b.y)/2 + side * (46 + Math.abs(b.x-a.x)*0.10);
    arcs += `<path d="M${a.x} ${a.y} Q${mx} ${cy.toFixed(1)} ${b.x} ${b.y}" fill="none" stroke="#0f2440" stroke-width="2.4" marker-end="url(#arr)" opacity="0.85"/>`;
    const tag = [l.time ? l.time + ' hrs' : '', fmtDateDisplay(l.date)].filter(Boolean).join(' · ');
    if (tag) labels += `<text x="${mx}" y="${(cy + (side<0? -8:16)).toFixed(1)}" text-anchor="middle" font-size="10.5" fill="#6b7a92" font-family="Poppins,sans-serif">${escHtml(tag)}</text>`;
  });
  pos.forEach(p => {
    nodes += `<circle cx="${p.x}" cy="${p.y}" r="6" fill="#ee3a4e" stroke="#fff" stroke-width="2.4"/>`;
    labels += `<text x="${p.x}" y="${p.y + 24}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#0f2440" paint-order="stroke" stroke="#fff" stroke-width="3.2" stroke-linejoin="round">${escHtml(p.name)}</text>`;
  });
  const note = `<text x="${W/2}" y="26" text-anchor="middle" font-size="11" fill="#7089a8">Schematic route — one or more places not recognised for map plotting</text>`;
  return svgFrame(W, H, note + arcs + nodes + labels);
}
