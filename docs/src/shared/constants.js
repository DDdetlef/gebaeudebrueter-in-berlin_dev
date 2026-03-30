export const INITIAL_VIEW = {
  center: [52.5, 13.4],
  zoom: 11,
};

export const DEFAULT_MAP_MODE = 'normal';

export const DEFAULT_FILTER_STATE = {
  species: [],
  status: [],
  buildingType: [],
};

export const BASEMAPS = {
  positron: {
    key: 'positron',
    label: 'Positron (CARTO)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    options: {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> | <a href="https://opendatacommons.org/licenses/odbl/">ODbL</a> | &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    },
  },
  topPlusOpen: {
    key: 'topPlusOpen',
    label: 'TopPlusOpen (BKG)',
    url: 'https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png',
    options: {
      attribution:
        '&copy; <a href="https://www.bkg.bund.de">Bundesamt f\u00fcr Kartographie und Geod\u00e4sie (BKG)</a> 2026, Datenquellenvermerk: Geobasisdaten der Vermessungsverwaltungen',
      maxZoom: 18,
    },
  },
};

export const SPECIES_META = {
  Mauersegler: { color: '#1f78b4', short: 'M' },
  Sperling: { color: '#33a02c', short: 'S' },
  Schwalbe: { color: '#6a3d9a', short: 'W' },
  Fledermaus: { color: '#000000', short: 'F' },
  Andere: { color: '#ff7f00', short: 'A' },
  unbekannt: { color: '#9e9e9e', short: '?' },
};

export const STATUS_META = {
  sanierung: { label: 'Sanierung', color: '#e31a1c', badge: 'S' },
  kontrolle: { label: 'Kontrolle', color: '#1976d2', badge: 'K' },
  verloren: { label: 'Verloren', color: '#616161', badge: 'x' },
  'ersatzmaßn.': { label: 'Ersatzmaßn.', color: '#f57c00', badge: 'E' },
  'ersatzmassn.': { label: 'Ersatzmaßn.', color: '#f57c00', badge: 'E' },
  ersatz: { label: 'Ersatzmaßn.', color: '#f57c00', badge: 'E' },
  default: { label: 'Unbekannt', color: '#9e9e9e', badge: '' },
};

export const BUILDING_TYPE_META = {
  schule: { label: 'Schule', color: '#fbbf24', icon: '🏫' },
};

export const EVENT_NAMES = {
  FILTER_APPLY: 'filter:apply',
  FILTER_RESET: 'filter:reset',
  LOCATION_REQUEST: 'location:request',
  REPORT_SELECT_ON_MAP: 'report:select-on-map',
};
