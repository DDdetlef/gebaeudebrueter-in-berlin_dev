const fs = require('fs');
const path = require('path');

const root = process.cwd();
const csvPath = path.join(root, 'Schulsanierung_Stand20260324.csv');
const htmlPath = path.join(root, 'docs', 'GebaeudebrueterMultiMarkers.html');

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

function decodeEscaped(s) {
  if (!s) return '';
  return s
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
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

const csvRaw = fs.readFileSync(csvPath, 'utf8');
const rows = parseCsv(csvRaw, ';');
const dataRows = rows.slice(1).filter((r) => (r[0] || '').trim().length > 0);

const csvRecords = dataRows.map((r, i) => ({
  row: i + 1,
  schulnummer: (r[0] || '').trim(),
  schule: (r[2] || '').trim(),
  adresse: (r[16] || '').trim(),
  plz: (r[17] || '').replace(/\s/g, ''),
  bezirk: (r[18] || '').trim(),
  ot: (r[19] || '').trim()
}));

const bySN = new Map();
for (const r of csvRecords) {
  if (!bySN.has(r.schulnummer)) bySN.set(r.schulnummer, []);
  bySN.get(r.schulnummer).push(r);
}
const csvDupSchulnummer = [...bySN.entries()]
  .filter(([, arr]) => arr.length > 1)
  .map(([schulnummer, arr]) => ({
    schulnummer,
    rows: arr.length,
    variants: [...new Set(arr.map((a) => `${a.schule} | ${a.adresse} | ${a.plz}`))].slice(0, 10)
  }));

const html = fs.readFileSync(htmlPath, 'utf8');
const blocks = html.split('var marker_').slice(1);
const markers = [];
for (const block of blocks) {
  const coordMatch = block.match(/=\s*L\.marker\(\s*\[\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\]/);
  if (!coordMatch) continue;

  const lat = Number(coordMatch[1]);
  const lon = Number(coordMatch[2]);

  const htmlStart = block.indexOf('"html": "');
  if (htmlStart === -1) continue;
  const htmlEnd = block.indexOf('",\n  "iconSize"', htmlStart);
  if (htmlEnd === -1) continue;
  const rawHtml = block.slice(htmlStart + '"html": "'.length, htmlEnd);

  const getAttr = (name) => {
    const mm = rawHtml.match(new RegExp(name + '=\\\\"([^\\\\"]*)\\\\"'));
    return decodeEscaped(mm ? mm[1] : '');
  };

  const getJsonish = (name) => {
    const mm = rawHtml.match(new RegExp(name + '=\\\\u0027([\\s\\S]*?)\\\\u0027'));
    if (!mm) return [];
    try {
      return JSON.parse(decodeEscaped(mm[1]));
    } catch {
      return [];
    }
  };

  markers.push({
    lat,
    lon,
    buildingType: getAttr('data-building-type'),
    buildingName: getAttr('data-building-name'),
    address: getAttr('data-address'),
    species: getJsonish('data-species'),
    statuses: getJsonish('data-statuses')
  });
}

const schoolMarkers = markers.filter((x) => (x.buildingType || '').toLowerCase() === 'schule');
const berlinBBox = { minLat: 52.33, maxLat: 52.68, minLon: 13.08, maxLon: 13.77 };
const outsideBerlin = schoolMarkers.filter(
  (x) => !(x.lat >= berlinBBox.minLat && x.lat <= berlinBBox.maxLat && x.lon >= berlinBBox.minLon && x.lon <= berlinBBox.maxLon)
);
const zeroCoords = schoolMarkers.filter((x) => !Number.isFinite(x.lat) || !Number.isFinite(x.lon) || (x.lat === 0 && x.lon === 0));

const byName = new Map();
for (const sm of schoolMarkers) {
  const k = normalize(sm.buildingName);
  if (!k) continue;
  if (!byName.has(k)) byName.set(k, []);
  byName.get(k).push(sm);
}
const markerNameDuplicates = [...byName.entries()]
  .filter(([, arr]) => arr.length > 1)
  .map(([k, arr]) => ({
    key: k,
    count: arr.length,
    sample: arr.slice(0, 5).map((x) => ({ name: x.buildingName, address: x.address, lat: x.lat, lon: x.lon }))
  }));

const byAddr = new Map();
for (const sm of schoolMarkers) {
  const k = normalize(sm.address);
  if (!k) continue;
  if (!byAddr.has(k)) byAddr.set(k, []);
  byAddr.get(k).push(sm);
}
const markerAddressDuplicates = [...byAddr.entries()]
  .filter(([, arr]) => arr.length > 1)
  .map(([k, arr]) => ({
    key: k,
    count: arr.length,
    sample: arr.slice(0, 5).map((x) => ({ name: x.buildingName, address: x.address, lat: x.lat, lon: x.lon }))
  }));

const unknownSchoolMarkers = schoolMarkers.filter(
  (x) => x.species.length === 1 && (x.species[0] || '').toLowerCase() === 'unbekannt'
);
const unknownSchoolWrongAttrs = unknownSchoolMarkers.filter(
  (x) => !x.statuses.map((s) => s.toLowerCase()).includes('kontrolle') || (x.buildingType || '').toLowerCase() !== 'schule'
);

const zille = schoolMarkers.filter(
  (x) => normalize(x.buildingName).includes(normalize('Schule am Zillepark')) || normalize(x.address).includes(normalize('Bergstr. 5-6'))
);

const csvUniqueSchulnummer = new Set(csvRecords.map((r) => r.schulnummer));
const matchedByHeuristic = new Set();
const csvMarkerCardinality = [];
for (const r of csvRecords) {
  const nameKey = normalize(r.schule);
  const addrKey = normalize(`${r.adresse} ${r.plz}`);
  const matches = schoolMarkers.filter((sm) => {
    const smName = normalize(sm.buildingName);
    const smAddr = normalize(sm.address);
    return smName === nameKey || smAddr.includes(addrKey) || addrKey.includes(smAddr);
  });
  if (matches.length > 0) matchedByHeuristic.add(r.schulnummer);
  csvMarkerCardinality.push({
    schulnummer: r.schulnummer,
    schule: r.schule,
    adresse: r.adresse,
    plz: r.plz,
    matchCount: matches.length,
    markerSamples: matches.slice(0, 3).map((x) => ({
      name: x.buildingName,
      address: x.address,
      lat: x.lat,
      lon: x.lon
    }))
  });
}

const csvZeroMarker = csvMarkerCardinality.filter((x) => x.matchCount === 0);
const csvSingleMarker = csvMarkerCardinality.filter((x) => x.matchCount === 1);
const csvMultiMarker = csvMarkerCardinality.filter((x) => x.matchCount > 1);

const report = {
  csv: {
    rows: csvRecords.length,
    uniqueSchulnummer: csvUniqueSchulnummer.size,
    duplicateSchulnummerEntries: csvDupSchulnummer.length,
    duplicateSchulnummerSamples: csvDupSchulnummer.slice(0, 30)
  },
  markers: {
    total: markers.length,
    schoolMarkers: schoolMarkers.length,
    schoolMarkersOutsideBerlin: outsideBerlin.length,
    schoolMarkersZeroCoords: zeroCoords.length,
    schoolNameDuplicates: markerNameDuplicates.length,
    schoolAddressDuplicates: markerAddressDuplicates.length
  },
  controlQuery: {
    filter: 'Art=unbekannt AND Gebaeudetyp=Schule',
    count: unknownSchoolMarkers.length,
    expected: 232,
    matchesExpected: unknownSchoolMarkers.length === 232,
    wrongAttributeRows: unknownSchoolWrongAttrs.length,
    wrongAttributeSamples: unknownSchoolWrongAttrs.slice(0, 20)
  },
  csvToMarkerCheck: {
    totalCsvRows: csvMarkerCardinality.length,
    zeroMatches: csvZeroMarker.length,
    singleMatches: csvSingleMarker.length,
    multiMatches: csvMultiMarker.length,
    zeroMatchSamples: csvZeroMarker.slice(0, 30),
    multiMatchSamples: csvMultiMarker.slice(0, 30)
  },
  outliers: outsideBerlin.slice(0, 50),
  zillepark: zille,
  duplicateSamples: {
    markerNameDuplicateSamples: markerNameDuplicates.slice(0, 30),
    markerAddressDuplicateSamples: markerAddressDuplicates.slice(0, 30)
  },
  schulnummerParityCheck: {
    possible: false,
    reason: 'Schulnummer ist in Markerdaten nicht enthalten.',
    heuristicMatchedUniqueSchulnummer: matchedByHeuristic.size,
    csvUniqueSchulnummer: csvUniqueSchulnummer.size
  }
};

console.log(JSON.stringify(report, null, 2));
