const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dataDir = path.join(root, 'docs', 'generated', 'data');
const fundortePath = path.join(dataDir, 'fundorte.json');
const schulenPath = path.join(dataDir, 'schulen.json');
const outPath = path.join(root, 'scripts', 'marker-duplicate-analysis.json');

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeAddress(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/straße/g, 'str')
    .replace(/str\./g, 'str')
    .replace(/[^a-z0-9]/g, '');
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function keyExact(lat, lon) {
  return `${Number(lat).toFixed(6)}|${Number(lon).toFixed(6)}`;
}

if (!fs.existsSync(fundortePath) || !fs.existsSync(schulenPath)) {
  console.error(JSON.stringify({ ok: false, error: 'missing generated data files' }, null, 2));
  process.exit(2);
}

const fundorte = loadJson(fundortePath).map((item) => ({
  dataset: 'fundorte',
  id: String(item.id || ''),
  lat: Number(item.lat),
  lon: Number(item.lon),
  address: String(item.address || ''),
  schoolId: item?.source?.schoolId ? String(item.source.schoolId) : null,
  csvRowId: item?.source?.csvRowId ? Number(item.source.csvRowId) : null,
  buildingType: String(item.buildingType || ''),
}));

const schulen = loadJson(schulenPath).map((item) => ({
  dataset: 'schulen',
  id: `school-${String(item.schoolId || '')}-${Number(item.csvRowId)}`,
  lat: Number(item.lat),
  lon: Number(item.lon),
  address: String(item.address || ''),
  schoolId: item.schoolId ? String(item.schoolId) : null,
  csvRowId: Number(item.csvRowId),
  buildingType: 'schule',
}));

const combined = [...fundorte, ...schulen];

const exactBuckets = new Map();
for (const entry of combined) {
  const key = keyExact(entry.lat, entry.lon);
  const list = exactBuckets.get(key) || [];
  list.push(entry);
  exactBuckets.set(key, list);
}

const exactCrossDataset = [];
for (const [key, entries] of exactBuckets.entries()) {
  const hasFundorte = entries.some((x) => x.dataset === 'fundorte');
  const hasSchulen = entries.some((x) => x.dataset === 'schulen');
  if (hasFundorte && hasSchulen) {
    exactCrossDataset.push({
      key,
      count: entries.length,
      addresses: [...new Set(entries.map((x) => x.address))],
      entries: entries.map((x) => ({ dataset: x.dataset, id: x.id, schoolId: x.schoolId, csvRowId: x.csvRowId })),
    });
  }
}

const addressBuckets = new Map();
for (const entry of combined) {
  const key = normalizeAddress(entry.address);
  if (!key) continue;
  const list = addressBuckets.get(key) || [];
  list.push(entry);
  addressBuckets.set(key, list);
}

const addressCrossDataset = [];
for (const entries of addressBuckets.values()) {
  const hasFundorte = entries.some((x) => x.dataset === 'fundorte');
  const hasSchulen = entries.some((x) => x.dataset === 'schulen');
  if (hasFundorte && hasSchulen) {
    addressCrossDataset.push({
      address: entries[0].address,
      count: entries.length,
      entries: entries.map((x) => ({ dataset: x.dataset, id: x.id, schoolId: x.schoolId, csvRowId: x.csvRowId })),
    });
  }
}

const nearPairs = [];
for (const s of schulen) {
  for (const f of fundorte) {
    const d = haversineMeters(s.lat, s.lon, f.lat, f.lon);
    if (d <= 2) {
      nearPairs.push({
        distanceMeters: Number(d.toFixed(3)),
        school: { id: s.id, schoolId: s.schoolId, csvRowId: s.csvRowId, address: s.address },
        fundort: { id: f.id, schoolId: f.schoolId, csvRowId: f.csvRowId, address: f.address, buildingType: f.buildingType },
      });
    }
  }
}

nearPairs.sort((a, b) => a.distanceMeters - b.distanceMeters);

const schoolIdsSharedAcrossDatasets = [];
const fundorteBySchoolId = new Map();
const schulenBySchoolId = new Map();
for (const f of fundorte) {
  if (!f.schoolId) continue;
  const list = fundorteBySchoolId.get(f.schoolId) || [];
  list.push(f);
  fundorteBySchoolId.set(f.schoolId, list);
}
for (const s of schulen) {
  if (!s.schoolId) continue;
  const list = schulenBySchoolId.get(s.schoolId) || [];
  list.push(s);
  schulenBySchoolId.set(s.schoolId, list);
}

for (const [schoolId, sch] of schulenBySchoolId.entries()) {
  const f = fundorteBySchoolId.get(schoolId);
  if (f && f.length > 0) {
    schoolIdsSharedAcrossDatasets.push({
      schoolId,
      fundorteRows: f.length,
      schulenRows: sch.length,
    });
  }
}

schoolIdsSharedAcrossDatasets.sort((a, b) => (b.fundorteRows + b.schulenRows) - (a.fundorteRows + a.schulenRows));

const report = {
  ok: true,
  summary: {
    legacyMarkerBaseline: 2668,
    fundorteRows: fundorte.length,
    schulenRows: schulen.length,
    combinedRows: combined.length,
    inflationVsLegacy: combined.length - 2668,
    exactCrossDatasetClusters: exactCrossDataset.length,
    addressCrossDatasetClusters: addressCrossDataset.length,
    nearPairsLe2m: nearPairs.length,
    sharedSchoolIdsAcrossDatasets: schoolIdsSharedAcrossDatasets.length,
  },
  findings: {
    exactCrossDatasetTop: exactCrossDataset.slice(0, 100),
    addressCrossDatasetTop: addressCrossDataset.slice(0, 100),
    nearPairsTop: nearPairs.slice(0, 200),
    sharedSchoolIdsTop: schoolIdsSharedAcrossDatasets.slice(0, 200),
  },
};

fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report.summary, null, 2));
