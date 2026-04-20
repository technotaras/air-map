import fs from 'node:fs';
import path from 'node:path';
import mgrs from 'mgrs';
const { toPoint } = mgrs;

const ROOT = path.resolve(import.meta.dirname, '..');
const MANIFEST = path.join(ROOT, 'data', 'manifest.json');
const OUT_DIR = path.join(ROOT, 'src', 'data');
const OUT_FILE = path.join(OUT_DIR, 'points.json');

// Chornomorsk commercial sea port (approximate)
const PORT_LON = 30.65;
const PORT_LAT = 46.30;

function extractMGRS(text) {
  let m = text.match(/(\d{2})\s*([A-Z])?\s*([A-Z]{2})\s+(\d{4,5})\s+(\d{4,5})/i);
  if (m) {
    return normalize(m[1], m[2] || 'T', m[3], m[4], m[5]);
  }
  m = text.match(/(\d{2})\s*([A-Z])?\s*([A-Z]{2})\s*(\d{8,10})/i);
  if (m) {
    const d = m[4];
    const half = Math.floor(d.length / 2);
    return normalize(m[1], m[2] || 'T', m[3], d.slice(0, half), d.slice(half));
  }
  return null;
}

function normalize(zone, band, square, e, n) {
  e = e.padEnd(5, '0').slice(0, 5);
  n = n.padEnd(5, '0').slice(0, 5);
  return `${zone}${band.toUpperCase()}${square.toUpperCase()}${e}${n}`;
}

function extractTargetType(text) {
  const m = text.match(/Тип цілі:\s*(\S+)/i);
  if (m) return m[1].replace(/[.,;:]$/, '');
  const lower = text.toLowerCase();
  if (lower.includes('шахед')) return 'Шахед';
  if (lower.includes('гербера')) return 'Гербера';
  if (lower.includes('орлан')) return 'Орлан';
  return null;
}

function visibleComment(raw) {
  return raw
    .split('\n')
    .filter(line => !line.trim().startsWith('#'))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Deterministic jitter around port for entries without coordinates
function jitter(seed) {
  const angle = ((seed * 137.5) % 360) * (Math.PI / 180);
  const r = 0.04 + (seed % 5) * 0.015; // ~4–10 km from center
  return {
    lat: PORT_LAT + r * Math.cos(angle),
    lon: PORT_LON + r * Math.sin(angle),
  };
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const points = [];
const diagnostics = [];

manifest.entries.forEach((entry, i) => {
  const commentAbs = path.join(ROOT, 'data', entry.comment_file);
  const raw = fs.existsSync(commentAbs) ? fs.readFileSync(commentAbs, 'utf8') : '';
  const visible = visibleComment(raw);
  const mgrsStr = extractMGRS(visible);
  const targetType = extractTargetType(visible);

  let lat, lon, hasRealCoords = false, coordError = null;
  if (mgrsStr) {
    try {
      const [lng, lt] = toPoint(mgrsStr);
      lat = lt;
      lon = lng;
      hasRealCoords = true;
    } catch (err) {
      coordError = err.message;
    }
  }
  if (!hasRealCoords) {
    const j = jitter(i);
    lat = j.lat;
    lon = j.lon;
  }

  points.push({
    id: entry.id,
    lat,
    lon,
    targetType,
    hasCoords: hasRealCoords,
    videoUrl: `${entry.id}/video.mp4`,
    comment: visible,
  });

  diagnostics.push({
    id: entry.id,
    mgrs: mgrsStr,
    targetType,
    hasCoords: hasRealCoords,
    ...(coordError ? { error: coordError } : {}),
    latLon: hasRealCoords ? [lat.toFixed(5), lon.toFixed(5)] : 'jittered',
  });
});

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(points, null, 2));

console.log(`Wrote ${points.length} points → ${path.relative(ROOT, OUT_FILE)}`);
console.table(diagnostics);
