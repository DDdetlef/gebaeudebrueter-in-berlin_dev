import { BUILDING_TYPE_META, SPECIES_META, STATUS_META } from '../shared/constants.js';
import { renderSchoolIcon } from '../shared/building-icons.js';

export function createMarkerFactory({ popupLoader }) {

  function statusConfig(statuses) {
    const normalized = (statuses || []).map((status) => String(status).toLowerCase());
    if (normalized.includes('verloren')) {
      return STATUS_META.verloren;
    }
    if (normalized.includes('sanierung')) {
      return STATUS_META.sanierung;
    }
    if (normalized.includes('kontrolle')) {
      return STATUS_META.kontrolle;
    }
    if (normalized.includes('ersatzmaßn.') || normalized.includes('ersatzmassn.') || normalized.includes('ersatz')) {
      return STATUS_META['ersatzmaßn.'];
    }
    return STATUS_META.default;
  }

  function markerFill(species) {
    const values = (species || []).filter((entry) => typeof entry === 'string' && entry.trim().length > 0);
    if (values.length === 0) {
      return SPECIES_META.unbekannt.color;
    }
    if (values.length === 1) {
      return SPECIES_META[values[0]]?.color || SPECIES_META.Andere.color;
    }
    const step = 360 / values.length;
    const segments = values.map((entry, index) => {
      const start = step * index;
      const end = step * (index + 1);
      const color = SPECIES_META[entry]?.color || SPECIES_META.Andere.color;
      return `${color} ${start.toFixed(1)}deg ${end.toFixed(1)}deg`;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }

  function renderSchoolBadge(markerData) {
    if (String(markerData.buildingType || '').toLowerCase() !== 'schule') {
      return '';
    }
    return renderSchoolIcon({ className: 'ms-building-type-icon', title: BUILDING_TYPE_META.schule.label });
  }

  function createMarkerHtml(markerData) {
    const status = statusConfig(markerData.status);
    const fill = markerFill(markerData.species);
    const schoolIcon = renderSchoolBadge(markerData);
    return `<div class="ms-marker" style="--ms-marker-fill:${fill};--ms-status-color:${status.color};"><div class="ms-badge">${status.badge}</div>${schoolIcon}</div>`;
  }

  function makeMarker(markerData) {
    const marker = L.marker(markerData.position, {
      icon: L.divIcon({
        className: 'ms-div-icon',
        html: createMarkerHtml(markerData),
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      }),
      gbData: markerData,
    });

    const popupHtml = popupLoader.renderPopupHtml(markerData);
    marker.bindPopup(popupHtml, {
      autoClose: false,
      closeOnClick: false,
      maxWidth: 320,
    });

    return marker;
  }

  return {
    makeMarker,
  };
}
