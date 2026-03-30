function cleanArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry) => typeof entry === 'string' && entry.trim().length > 0);
}

function toString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function toKey(lat, lon) {
  return `${Number(lat).toFixed(6)}|${Number(lon).toFixed(6)}`;
}

function normalizeAddress(value) {
  return toString(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/straße/g, 'str')
    .replace(/str\./g, 'str')
    .replace(/[^a-z0-9]/g, '');
}

function toMarkerItem(record) {
  const source = record.source || null;
  const sourceWebId = source?.webId || record.id;
  return {
    id: record.id,
    position: [record.lat, record.lon],
    species: cleanArray(record.species),
    status: cleanArray(record.statuses),
    address: record.address || 'Adresse unbekannt',
    buildingType: record.buildingType || '',
    buildingName: record.buildingName || '',
    firstObservation: toString(record.erstbeobachtung),
    description: toString(record.beschreibung),
    bezirk: record.bezirk || '',
    source: source
      ? {
          ...source,
          dbUrl:
            source.dbUrl ||
            (sourceWebId
              ? `http://www.gebaeudebrueter-in-berlin.de/index.php?ID=${encodeURIComponent(String(sourceWebId))}`
              : ''),
        }
      : null,
  };
}

function schoolToMarkerItem(record) {
  return {
    id: `school-${toString(record.schoolId)}-${Number(record.csvRowId)}`,
    position: [record.lat, record.lon],
    species: ['unbekannt'],
    status: [toString(record.status, 'Kontrolle')],
    address: toString(record.address, 'Adresse unbekannt'),
    buildingType: 'schule',
    buildingName: toString(record.name),
    bezirk: toString(record.bezirk),
    source: {
      dataset: 'schulen',
      schoolId: toString(record.schoolId),
      csvRowId: Number(record.csvRowId),
    },
    firstObservation: '',
    description: '',
  };
}

export function normalizeMapData({ fundorte, schulen }) {
  const primary = (fundorte || []).map(toMarkerItem);

  // Fundorte is the primary marker source. We only append school records
  // when a corresponding position/address is missing in fundorte.
  const fundorteCoordKeys = new Set(primary.map((item) => toKey(item.position[0], item.position[1])));
  const fundorteAddressKeys = new Set(primary.map((item) => normalizeAddress(item.address)).filter(Boolean));

  const schoolFallback = (schulen || [])
    .map(schoolToMarkerItem)
    .filter((item) => {
      const coordKey = toKey(item.position[0], item.position[1]);
      if (fundorteCoordKeys.has(coordKey)) {
        return false;
      }
      const addressKey = normalizeAddress(item.address);
      return !addressKey || !fundorteAddressKeys.has(addressKey);
    });

  return [...primary, ...schoolFallback];
}
