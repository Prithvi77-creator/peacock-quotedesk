/* ============================================================
   Peacock QuoteDesk — Fleet Master
   Picking an aircraft auto-fills its details and photos, so the
   admin types almost nothing. Specs are INDICATIVE public figures —
   verify/edit per actual aircraft. Photos load from quotedesk/fleet/
   (drop the image files there using the filenames below).
   Keyed by a normalised aircraft name (see fleetKey()).
   ============================================================ */

function fleetKey(s){
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const FLEET = {
  'legacy 500':        { specs: 'Type: Mid-size jet\nSeats: 8–12\nRange: ~5,600 km (3,000 nm)\nCruise: ~Mach 0.80\nCabin: Flat-floor, stand-up', photos: ['fleet/LEGACY 500.jpg'] },
  'legacy 600':        { specs: 'Type: Super-midsize jet\nSeats: 13\nRange: ~6,300 km (3,400 nm)\nCruise: ~830 km/h\nCabin: Three-zone, stand-up', photos: ['fleet/LEGACY 600.jpg'] },
  'legacy 650':        { specs: 'Type: Large jet\nSeats: 14\nRange: ~7,200 km (3,900 nm)\nCruise: ~850 km/h\nCabin: Three-zone, stand-up', photos: ['fleet/LEGACY 650.jpg'] },
  'praetor 600':       { specs: 'Type: Super-midsize jet\nSeats: 12\nRange: ~7,400 km (4,018 nm)\nCruise: ~863 km/h\nCabin: Full flat-floor', photos: ['fleet/PRAETOR 600.jpg'] },
  'phenom 300e':       { specs: 'Type: Light jet\nSeats: 9–10\nRange: ~3,700 km (2,010 nm)\nCruise: ~Mach 0.80\nCabin: Best-selling light jet', photos: ['fleet/PHENOM 300E.jpg'] },
  'challenger 604':    { specs: 'Type: Large jet\nSeats: 12\nRange: ~7,400 km (4,000 nm)\nCruise: ~850 km/h\nCabin: Wide-body', photos: ['fleet/CHALLENGER 604.jpg'] },
  'challenger 605':    { specs: 'Type: Large jet\nSeats: 12\nRange: ~7,500 km (4,000 nm)\nCruise: ~870 km/h\nCabin: Wide-body', photos: ['fleet/CHALLENGER 605.jpg'] },
  'citation cj1':      { specs: 'Type: Light jet\nSeats: 5–6\nRange: ~2,200 km (1,200 nm)\nCruise: ~720 km/h\nCabin: Entry light jet', photos: ['fleet/CITATION CJ1.jpg'] },
  'citation cj2':      { specs: 'Type: Light jet\nSeats: 6–7\nRange: ~2,700 km (1,480 nm)\nCruise: ~745 km/h\nCabin: Light jet', photos: ['fleet/CITATION CJ2.jpg'] },
  'dassault falcon 8x':{ specs: 'Type: Ultra-long-range jet\nSeats: 14–16\nRange: ~11,900 km (6,450 nm)\nCruise: ~Mach 0.80\nEngines: Tri-jet', photos: ['fleet/DASSAULT FALCON 8X.jpg'] },
  'falcon 7x':         { specs: 'Type: Long-range jet\nSeats: 12–14\nRange: ~11,000 km (5,950 nm)\nCruise: ~Mach 0.80\nEngines: Tri-jet', photos: ['fleet/FALCON 7X.jpg'] },
  'falcon 2000lxs':    { specs: 'Type: Large jet\nSeats: 10\nRange: ~7,400 km (4,000 nm)\nCruise: ~Mach 0.80\nCabin: Wide-body', photos: ['fleet/FALCON 2000LXS.jpg'] },
  'global 5000':       { specs: 'Type: Long-range jet\nSeats: 13–16\nRange: ~9,600 km (5,200 nm)\nCruise: ~904 km/h\nCabin: Wide, stand-up', photos: ['fleet/GLOBAL 5000.jpg'] },
  'global 5500':       { specs: 'Type: Long-range jet\nSeats: 16\nRange: ~11,300 km (6,100 nm)\nCruise: ~Mach 0.85\nCabin: Wide, stand-up', photos: ['fleet/GLOBAL 5500.jpg'] },
  'global 6000':       { specs: 'Type: Long-range jet\nSeats: 13–17\nRange: ~11,100 km (6,000 nm)\nCruise: ~Mach 0.85\nCabin: Wide, stand-up', photos: ['fleet/GLOBAL 6000.jpg'] },
  'global 6500':       { specs: 'Type: Long-range jet\nSeats: 17\nRange: ~12,200 km (6,600 nm)\nCruise: ~Mach 0.85\nCabin: Wide, stand-up', photos: ['fleet/GLOBAL 6500.jpg'] },
  'global 7500':       { specs: 'Type: Ultra-long-range jet\nSeats: 17–19\nRange: ~14,260 km (7,700 nm)\nCruise: ~Mach 0.85\nCabin: Four living zones', photos: ['fleet/GLOBAL 7500.jpg'] },
  'g700':              { specs: 'Type: Ultra-long-range jet (Gulfstream)\nSeats: 13–19\nRange: ~13,890 km (7,500 nm)\nCruise: ~Mach 0.85\nCabin: Five living zones', photos: ['fleet/G 700.jpg'] },
  'gulfstream g150':   { specs: 'Type: Mid-size jet\nSeats: 6–8\nRange: ~5,500 km (3,000 nm)\nCruise: ~Mach 0.80\nCabin: Mid-size', photos: ['fleet/GULFSTREAM G 150.jpg'] },
  'king air 200':      { specs: 'Type: Twin turboprop\nSeats: 7–9\nRange: ~3,300 km (1,800 nm)\nCruise: ~540 km/h\nShort-runway capable', photos: ['fleet/KING AIR 200.jpg'] },
  'king air 300':      { specs: 'Type: Twin turboprop\nSeats: 8\nRange: ~3,600 km (1,950 nm)\nCruise: ~580 km/h\nShort-runway capable', photos: ['fleet/KING AIR 300.jpg'] },
  'king air 350':      { specs: 'Type: Twin turboprop\nSeats: 9–11\nRange: ~3,300 km (1,800 nm)\nCruise: ~580 km/h\nShort-runway capable', photos: ['fleet/KING AIR 350.jpg'] },
  'grand caravan 208b':{ specs: 'Type: Single turboprop (utility)\nSeats: 9–12\nRange: ~1,900 km (1,000 nm)\nCruise: ~340 km/h\nUnpaved-strip capable', photos: ['fleet/GRAND CARAVAN 208B.jpg'] },
  'pc 24':             { specs: 'Type: Light jet\nSeats: 8–10\nRange: ~3,700 km (2,000 nm)\nCruise: ~815 km/h\nRough / short-field capable', photos: ['fleet/PC-24.jpg'] },
  'erj 145':           { specs: 'Type: Regional jet\nSeats: 37–50 (fewer in VIP)\nRange: ~2,800 km\nCruise: ~830 km/h\nStand-up cabin', photos: ['fleet/ERJ-145.jpg'] },
  'e190 er':           { specs: 'Type: Regional / VIP jet\nSeats: up to ~100 (fewer in VIP)\nRange: ~4,500 km\nCruise: ~870 km/h\nWide stand-up cabin', photos: ['fleet/E190-ER.jpg'] },
  'akasa 737 max':     { specs: 'Type: Narrow-body airliner\nSeats: 174–189\nRange: ~6,500 km\nCruise: ~840 km/h\nSingle-aisle', photos: ['fleet/AKASA 737 MAX.jpg'] },
  'boeing 737':        { specs: 'Type: Narrow-body airliner\nSeats: 130–189\nRange: ~5,700 km\nCruise: ~840 km/h\nSingle-aisle', photos: ['fleet/BOEING 737.jpg'] },
  'airbus a321':       { specs: 'Type: Narrow-body airliner\nSeats: 180–220\nRange: ~5,900 km\nCruise: ~830 km/h\nSingle-aisle', photos: ['fleet/AIRBUS A321.jpg'] }
};

/* aliases so common shorthand still matches a fleet entry */
const FLEET_ALIASES = {
  'g 700': 'g700', 'gulfstream g700': 'g700', 'gulfstream g 150': 'gulfstream g150', 'g150': 'gulfstream g150',
  'falcon 8x': 'dassault falcon 8x', 'phenom 300': 'phenom 300e', 'e190': 'e190 er', 'e190er': 'e190 er',
  'grand caravan': 'grand caravan 208b', 'caravan 208b': 'grand caravan 208b', 'pc24': 'pc 24'
};

function fleetLookup(name){
  const k = fleetKey(name);
  if (FLEET[k]) return FLEET[k];
  if (FLEET_ALIASES[k] && FLEET[FLEET_ALIASES[k]]) return FLEET[FLEET_ALIASES[k]];
  return null;
}
