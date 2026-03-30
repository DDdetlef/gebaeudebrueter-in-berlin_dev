const REPORT_FORM_BASE_URL =
  'https://berlin.nabu.de/wir-ueber-uns/bezirksgruppen/steglitz-zehlendorf/projekte/gebaeudebrueter/12400.html';

function toSafeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseAddress(address) {
  const raw = toSafeString(address);
  if (!raw) {
    return {
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',
      full: '',
    };
  }

  const parts = raw.split(',').map((entry) => entry.trim()).filter(Boolean);
  const streetPart = parts[0] || '';
  const cityPart = parts[parts.length - 1] || '';

  const streetMatch = streetPart.match(/^(.*?)(\s+\d+[a-zA-Z\-\/]*)?$/);
  const cityMatch = cityPart.match(/^(\d{5})\s+(.+)$/);

  return {
    street: toSafeString(streetMatch?.[1] || streetPart),
    houseNumber: toSafeString((streetMatch?.[2] || '').trim()),
    postalCode: toSafeString(cityMatch?.[1] || ''),
    city: toSafeString(cityMatch?.[2] || cityPart),
    full: raw,
  };
}

function toLatLngString(value, digits = 6) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '';
  }
  return value.toFixed(digits);
}

function appendIfPresent(url, key, value) {
  const clean = toSafeString(value);
  if (!clean) {
    return;
  }
  url.searchParams.set(key, clean);
}

function formatCompactBerlinAddress({ street = '', houseNumber = '', postalCode = '' } = {}) {
  const streetLine = [toSafeString(street), toSafeString(houseNumber)].filter(Boolean).join(' ').trim();
  const plzLine = [toSafeString(postalCode), 'Berlin'].filter(Boolean).join(', ').trim();
  return [streetLine, plzLine].filter(Boolean).join(', ');
}

function buildReportUrl({
  fundortId = '',
  lat = null,
  lng = null,
  street = '',
  houseNumber = '',
  postalCode = '',
  city = '',
  address = '',
  species = '',
}) {
  const url = new URL(REPORT_FORM_BASE_URL);

  appendIfPresent(url, 'fundort_id', fundortId);
  appendIfPresent(url, 'fundortstrasse', street);
  appendIfPresent(url, 'fundorthausnummer', houseNumber);
  appendIfPresent(url, 'fundortplz', postalCode);
  appendIfPresent(url, 'fundortort', city);
  appendIfPresent(url, 'fundortadresse', address);
  appendIfPresent(url, 'fundortart', species);

  const latString = toLatLngString(lat);
  const lngString = toLatLngString(lng);
  if (latString && lngString) {
    url.searchParams.set('fundortlat', latString);
    url.searchParams.set('fundortlng', lngString);
    url.searchParams.set('fundortkoordinaten', `${latString},${lngString}`);
  }

  return url.toString();
}

export function buildMarkerReportUrl(markerData) {
  const id = toSafeString(markerData?.source?.webId || markerData?.id || '');
  const coords = Array.isArray(markerData?.position) ? markerData.position : [];
  const parsed = parseAddress(markerData?.address || '');

  return buildReportUrl({
    fundortId: id,
    lat: Number(coords[0]),
    lng: Number(coords[1]),
    street: parsed.street,
    houseNumber: parsed.houseNumber,
    postalCode: parsed.postalCode,
    city: parsed.city,
    address: parsed.full,
    species: (markerData?.species || []).join(', '),
  });
}

export function buildMapSelectionReportUrl({ lat, lng, addressParts }) {
  const parsed = addressParts || {};
  return buildReportUrl({
    lat,
    lng,
    street: parsed.street || '',
    houseNumber: parsed.houseNumber || '',
    postalCode: parsed.postalCode || '',
    city: parsed.city || '',
    address: parsed.full || '',
  });
}

export async function reverseGeocode(lat, lng) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('zoom', '18');
  url.searchParams.set('addressdetails', '1');

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'de',
    },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed (${response.status})`);
  }

  const payload = await response.json();
  const address = payload?.address || {};

  const street = toSafeString(address.road || address.pedestrian || address.footway || '');
  const houseNumber = toSafeString(address.house_number || '');
  const postalCode = toSafeString(address.postcode || '');
  const city = 'Berlin';
  const full = formatCompactBerlinAddress({ street, houseNumber, postalCode });

  return {
    street,
    houseNumber,
    postalCode,
    city,
    full,
  };
}

export function openReportUrlWithConfirm(url, confirmMessage) {
  if (!toSafeString(url)) {
    return { ok: false, reason: 'missing-url' };
  }

  const defaultMessage =
    'Die Meldung wird im NABU-Online-Formular geöffnet. Möchten Sie fortfahren?';
  const approved = window.confirm(confirmMessage || defaultMessage);
  if (!approved) {
    return { ok: false, reason: 'cancelled' };
  }

  const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (!openedWindow) {
    return { ok: false, reason: 'popup-blocked' };
  }

  return { ok: true };
}

export function defaultDatabaseUrl(webId) {
  const id = toSafeString(webId);
  if (!id) {
    return '';
  }
  return `http://www.gebaeudebrueter-in-berlin.de/index.php?ID=${encodeURIComponent(id)}`;
}
