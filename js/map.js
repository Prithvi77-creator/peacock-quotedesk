/* ============================================================
   Peacock QuoteDesk — stylized SVG route diagram
   Offline-safe: no tiles, no APIs, no country borders.
   Known cities → geographic auto-fit plot; any unknown city →
   clean schematic chain, so the PDF never shows a broken map.
   ============================================================ */

/* [lat, lon] — Indian cities/airports first, then common international */
const CITY_COORDS = {
  'delhi':[28.61,77.20],'new delhi':[28.61,77.20],'del':[28.61,77.20],
  'mumbai':[19.09,72.87],'bom':[19.09,72.87],'chhatrapati shivaji':[19.09,72.87],'juhu':[19.10,72.83],
  'chennai':[13.00,80.18],'maa':[13.00,80.18],
  'kolkata':[22.65,88.45],'ccu':[22.65,88.45],'netaji subash':[22.65,88.45],'netaji subhash':[22.65,88.45],
  'bangalore':[13.20,77.71],'bengaluru':[13.20,77.71],'blr':[13.20,77.71],'hal':[12.95,77.67],
  'hyderabad':[17.24,78.43],'hyd':[17.24,78.43],'shamshabad':[17.24,78.43],
  'goa':[15.38,73.83],'goi':[15.38,73.83],'dabolim':[15.38,73.83],'mopa':[15.74,73.86],
  'ahmedabad':[23.07,72.63],'amd':[23.07,72.63],
  'pune':[18.58,73.92],'pnq':[18.58,73.92],
  'jaipur':[26.82,75.81],'jai':[26.82,75.81],
  'lucknow':[26.76,80.88],'lko':[26.76,80.88],
  'srinagar':[33.99,74.77],'sxr':[33.99,74.77],
  'leh':[34.14,77.55],'ixl':[34.14,77.55],
  'chandigarh':[30.67,76.79],'ixc':[30.67,76.79],
  'amritsar':[31.71,74.80],'atq':[31.71,74.80],
  'dehradun':[30.19,78.18],'ded':[30.19,78.18],'jolly grant':[30.19,78.18],
  'shimla':[31.08,77.07],'kullu':[31.88,77.15],'bhuntar':[31.88,77.15],'dharamshala':[32.17,76.26],'kangra':[32.17,76.26],
  'varanasi':[25.45,82.86],'vns':[25.45,82.86],
  'prayagraj':[25.44,81.73],'allahabad':[25.44,81.73],
  'agra':[27.16,77.96],'kanpur':[26.40,80.41],'gaya':[24.74,84.95],'patna':[25.59,85.09],
  'bhopal':[23.29,77.34],'indore':[22.72,75.80],'raipur':[21.18,81.74],'ranchi':[23.31,85.32],
  'bhubaneswar':[20.24,85.82],'bbi':[20.24,85.82],
  'nagpur':[21.09,79.05],'nag':[21.09,79.05],
  'surat':[21.11,72.74],'rajkot':[22.31,70.78],'vadodara':[22.33,73.23],'bhavnagar':[21.75,72.19],
  'udaipur':[24.62,73.90],'jodhpur':[26.25,73.05],'jaisalmer':[26.89,70.86],'bikaner':[28.07,73.20],
  'kochi':[10.15,76.40],'cochin':[10.15,76.40],'cok':[10.15,76.40],
  'thiruvananthapuram':[8.48,76.92],'trivandrum':[8.48,76.92],'trv':[8.48,76.92],
  'coimbatore':[11.03,77.04],'cjb':[11.03,77.04],
  'madurai':[9.83,78.09],'tirupati':[13.63,79.54],'vijayawada':[16.53,80.80],
  'visakhapatnam':[17.72,83.22],'vizag':[17.72,83.22],
  'mangalore':[12.96,74.89],'hubli':[15.36,75.08],'belgaum':[15.86,74.62],
  'guwahati':[26.11,91.59],'gau':[26.11,91.59],
  'bagdogra':[26.68,88.33],'ixb':[26.68,88.33],'siliguri':[26.68,88.33],'darjeeling':[26.68,88.33],
  'imphal':[24.76,93.90],'agartala':[23.89,91.24],'aizawl':[23.84,92.62],'shillong':[25.70,91.98],
  'dibrugarh':[27.48,95.02],'jorhat':[26.73,94.18],'silchar':[24.91,92.98],
  'port blair':[11.64,92.73],'ixz':[11.64,92.73],
  'katra':[32.99,74.95],'jammu':[32.69,74.84],
  'kandla':[23.11,70.10],'porbandar':[21.65,69.66],'diu':[20.71,70.92],
  'dubai':[25.25,55.36],'dxb':[25.25,55.36],'al maktoum':[24.90,55.16],'dwc':[24.90,55.16],
  'abu dhabi':[24.43,54.65],'auh':[24.43,54.65],'sharjah':[25.33,55.52],'shj':[25.33,55.52],
  'doha':[25.27,51.61],'doh':[25.27,51.61],
  'muscat':[23.59,58.28],'mct':[23.59,58.28],
  'riyadh':[24.96,46.70],'jeddah':[21.68,39.16],
  'singapore':[1.36,103.99],'sin':[1.36,103.99],'seletar':[1.42,103.87],
  'bangkok':[13.69,100.75],'bkk':[13.69,100.75],'don mueang':[13.91,100.60],
  'kathmandu':[27.70,85.36],'ktm':[27.70,85.36],
  'colombo':[7.18,79.88],'cmb':[7.18,79.88],
  'male':[4.19,73.53],'mle':[4.19,73.53],'maldives':[4.19,73.53],
  'dhaka':[23.84,90.40],'dac':[23.84,90.40],
  'yangon':[16.91,96.13],'hong kong':[22.31,113.91],'hkg':[22.31,113.91],
  'kuala lumpur':[2.75,101.71],'kul':[2.75,101.71],
  'almaty':[43.35,77.04],'tashkent':[41.26,69.28],'baku':[40.47,50.05],
  'london':[51.47,-0.46],'lhr':[51.47,-0.46],'luton':[51.87,-0.37],'farnborough':[51.28,-0.78],
  'paris':[49.01,2.55],'le bourget':[48.96,2.44],'geneva':[46.24,6.11],'zurich':[47.46,8.55],
  'frankfurt':[50.03,8.57],'moscow':[55.97,37.41],'istanbul':[41.28,28.75]
};

function resolveCity(name){
  const raw = String(name || '').trim();
  if (!raw) return null;
  let s = raw.toLowerCase()
    .replace(/int(ernationa)?l?\.?\s+airport/g,' ')
    .replace(/\bairport\b/g,' ')
    .replace(/[().]/g,' ')
    .replace(/\s+/g,' ').trim();
  if (CITY_COORDS[s]) return { name: raw, ll: CITY_COORDS[s] };
  // try each comma-separated part, longest keys first so 'new delhi' beats 'delhi'
  const keys = Object.keys(CITY_COORDS).sort((a,b) => b.length - a.length);
  const parts = s.split(',').map(p => p.trim()).filter(Boolean);
  for (const part of [s, ...parts]){
    for (const k of keys){
      if (part === k || part.includes(k)) return { name: raw, ll: CITY_COORDS[k] };
    }
  }
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
  const spanLat = Math.max(maxLat - minLat, 2.5), spanLon = Math.max(maxLon - minLon, 2.5);
  // generous padding so real land fills the frame around the route
  minLat -= spanLat * 0.45; maxLat += spanLat * 0.45;
  minLon -= spanLon * 0.40; maxLon += spanLon * 0.40;
  const PAD = 4, IW = W - PAD*2, IH = H - PAD*2;
  const midLat = (minLat + maxLat) / 2, kx = Math.cos(midLat * Math.PI/180);
  const sc = Math.min(IW / ((maxLon - minLon) * kx), IH / (maxLat - minLat));
  const usedW = (maxLon - minLon) * kx * sc, usedH = (maxLat - minLat) * sc;
  const ox = PAD + (IW - usedW)/2, oy = PAD + (IH - usedH)/2;
  const Plon = (lon, lat) => [ ox + (lon - minLon) * kx * sc, oy + (maxLat - lat) * sc ];
  const P = ll => Plon(ll[1], ll[0]);

  // visible lon/lat window (inverse-project the frame corners)
  const wLonMin = minLon + (0 - ox) / (kx * sc);
  const wLonMax = minLon + (W - ox) / (kx * sc);
  const wLatMax = maxLat - (0 - oy) / sc;
  const wLatMin = maxLat - (H - oy) / sc;

  // neighbouring land (context), culled to the visible window
  const bb = geoBBoxes();
  let land = '';
  for (let i = 0; i < WORLD_GEO.length; i++){
    const b = bb[i];
    if (b[2] < wLonMin || b[0] > wLonMax || b[3] < wLatMin || b[1] > wLatMax) continue;
    land += `<path d="${polysPath([WORLD_GEO[i]], Plon)}" fill="#e7ebe2" stroke="#c4d0dd" stroke-width="0.6" fill-rule="evenodd"/>`;
  }

  // India — official outline drawn on top so it is always depicted correctly
  const ib = indiaBBox();
  let india = '';
  if (!(ib[2] < wLonMin || ib[0] > wLonMax || ib[3] < wLatMin || ib[1] > wLatMax)){
    const dp = polysPath(INDIA_GEO, Plon);
    india = `<path d="${dp}" fill="#f4efe1" stroke="#ffffff" stroke-width="2.4" fill-rule="evenodd"/>`
          + `<path d="${dp}" fill="none" stroke="#33465f" stroke-width="1" fill-rule="evenodd"/>`;
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
