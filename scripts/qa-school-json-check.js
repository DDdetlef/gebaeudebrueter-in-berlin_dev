const fs = require('fs');
const path = require('path');

const root = process.cwd();
const csvPath = path.join(root, 'Schulsanierung_Stand20260324.csv');
const schulenPath = path.join(root, 'docs', 'generated', 'data', 'schulen.json');
const metadataPath = path.join(root, 'docs', 'generated', 'data', 'metadata.json');
const outPath = path.join(root, 'scripts', 'qa-school-json-report.json');

const BERLIN_BBOX = { minLat: 52.33, maxLat: 52.68, minLon: 13.08, maxLon: 13.77 };

function parseCsv(content, delimiter = ';') {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];
    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === delimiter) {
      row.push(field);
      field = '';
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    if (ch === '\r') continue;
    field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/straße/g, 'str')
    .replace(/str\./g, 'str')
    .replace(/[^a-z0-9]/g, '');
}

function inBerlin(lat, lon) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= BERLIN_BBOX.minLat &&
    lat <= BERLIN_BBOX.maxLat &&
    lon >= BERLIN_BBOX.minLon &&
    lon <= BERLIN_BBOX.maxLon
  );
}

function loadJsonOrEmpty(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

if (!fs.existsSync(schulenPath)) {
  console.error(JSON.stringify({ ok: false, error: 'missing schulen.json', path: schulenPath }, null, 2));
  process.exit(2);
}

const csvRaw = fs.existsSync(csvPath) ? fs.readFileSync(csvPath, 'utf8') : '';
const csvRows = csvRaw ? parseCsv(csvRaw, ';') : [];
const csvData = csvRows.slice(1).filter((r) => (r[0] || '').trim().length > 0);
const csvRecords = csvData.map((r, i) => ({
  csvRowId: i + 1,
  schoolId: (r[0] || '').trim(),
  name: (r[2] || '').trim(),
  address: (r[16] || '').trim(),
  plz: (r[17] || '').replace(/\s/g, ''),
  bezirk: (r[18] || '').trim(),
}));

const schulen = loadJsonOrEmpty(schulenPath, []);
const metadata = loadJsonOrEmpty(metadataPath, {});

const outsideBerlin = schulen.filter((x) => !inBerlin(Number(x.lat), Number(x.lon)));
const invalidCoords = schulen.filter(
  (x) => !Number.isFinite(Number(x.lat)) || !Number.isFinite(Number(x.lon)) || (Number(x.lat) === 0 && Number(x.lon) === 0)
);
const wrongDefaults = schulen.filter(
  (x) => (String(x.art || '').toLowerCase() !== 'unbekannt') || (String(x.status || '').toLowerCase() !== 'kontrolle')
);
const missingSchoolId = schulen.filter((x) => !String(x.schoolId || '').trim());

const bySchoolId = new Map();
for (const s of schulen) {
  const key = String(s.schoolId || '').trim();
  if (!key) continue;
  if (!bySchoolId.has(key)) bySchoolId.set(key, []);
  bySchoolId.get(key).push(s);
}
const duplicateSchoolId = [...bySchoolId.entries()]
  .filter(([, arr]) => arr.length > 1)
  .map(([schoolId, arr]) => ({
    schoolId,
    rows: arr.length,
    names: [...new Set(arr.map((x) => x.name || ''))],
  }));

const byCsvRowId = new Map();
for (const s of schulen) {
  const rowId = Number(s.csvRowId);
  if (!Number.isFinite(rowId)) continue;
  byCsvRowId.set(rowId, (byCsvRowId.get(rowId) || 0) + 1);
}

const csvRowsWithoutMarker = csvRecords
  .filter((r) => (byCsvRowId.get(Number(r.csvRowId)) || 0) === 0)
  .slice(0, 50);
const csvRowsWithMultipleMarkers = [...byCsvRowId.entries()]
  .filter(([, count]) => count > 1)
  .slice(0, 50)
  .map(([csvRowId, count]) => ({ csvRowId, count }));

const heuristicMatches = csvRecords.reduce((acc, row) => {
  const n1 = normalize(row.name);
  const a1 = normalize(`${row.address} ${row.plz}`);
  const hit = schulen.some((s) => {
    const n2 = normalize(s.name || '');
    const a2 = normalize(s.address || '');
    return (n1 && n2 && n1 === n2) || (a1 && a2 && (a1.includes(a2) || a2.includes(a1)));
  });
  return acc + (hit ? 1 : 0);
}, 0);

const report = {
  ok:
    outsideBerlin.length === 0 &&
    invalidCoords.length === 0 &&
    wrongDefaults.length === 0 &&
    missingSchoolId.length === 0 &&
    csvRowsWithoutMarker.length === 0 &&
    csvRowsWithMultipleMarkers.length === 0,
  summary: {
    csvRows: csvRecords.length,
    schulenRows: schulen.length,
    metadataCountSchulen: metadata?.counts?.schulen ?? null,
    heuristicCsvMatches: heuristicMatches,
  },
  checks: {
    outsideBerlin: outsideBerlin.length,
    invalidCoords: invalidCoords.length,
    wrongDefaults: wrongDefaults.length,
    missingSchoolId: missingSchoolId.length,
    duplicateSchoolId: duplicateSchoolId.length,
    csvRowsWithoutMarker: csvRowsWithoutMarker.length,
    csvRowsWithMultipleMarkers: csvRowsWithMultipleMarkers.length,
  },
  samples: {
    outsideBerlin: outsideBerlin.slice(0, 20),
    invalidCoords: invalidCoords.slice(0, 20),
    wrongDefaults: wrongDefaults.slice(0, 20),
    duplicateSchoolId: duplicateSchoolId.slice(0, 20),
    csvRowsWithoutMarker,
    csvRowsWithMultipleMarkers,
  },
};

fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
