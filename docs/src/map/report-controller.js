import { buildMapSelectionReportUrl, reverseGeocode } from '../shared/report-utils.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function createReportController({ map }) {
  let selectOnMapActive = false;
  let activePopup = null;

  function clearPopup() {
    if (activePopup) {
      map.closePopup(activePopup);
      activePopup = null;
    }
  }

  function setSelectionMode(active) {
    selectOnMapActive = Boolean(active);
    const container = map.getContainer();
    container.style.cursor = selectOnMapActive ? 'crosshair' : '';
  }

  function renderMapSelectionPopup(lat, lng, addressInfo, geocodeFailed) {
    const reportUrl = buildMapSelectionReportUrl({ lat, lng, addressParts: addressInfo });
    const message = geocodeFailed
      ? 'Adresse konnte nicht automatisch ermittelt werden. Das Formular wird mit Koordinaten geöffnet.'
      : 'Bitte prüfen Sie die Adresse. Für eine Korrektur klicken Sie erneut in die Karte.';

    const addressLabel = addressInfo?.full || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    return [
      '<div class="popup-card">',
      '<b>Neuen Fundort melden</b><br><br>',
      `<b>Adresse</b><br>${escapeHtml(addressLabel)}<br><br>`,
      `<div class="popup-hint">${escapeHtml(message)}</div><br>`,
      `<a href="${escapeHtml(reportUrl)}" class="gb-report-link" data-report-confirm="1" data-report-stop-selection="1" data-confirm-message="Die Meldung wird im NABU-Online-Formular geöffnet. Fortfahren?">Standort auswählen</a>`,
      '</div>',
    ].join('');
  }

  async function handleMapClick(event) {
    if (!selectOnMapActive) {
      return;
    }

    const lat = Number(event?.latlng?.lat);
    const lng = Number(event?.latlng?.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }

    clearPopup();

    const loadingPopup = L.popup({ maxWidth: 340 })
      .setLatLng([lat, lng])
      .setContent('<div class="popup-card"><b>Adresse wird ermittelt ...</b></div>')
      .openOn(map);
    activePopup = loadingPopup;

    let addressInfo = {
      street: '',
      houseNumber: '',
      postalCode: '',
      city: 'Berlin',
      full: '',
    };
    let geocodeFailed = false;

    try {
      addressInfo = await reverseGeocode(lat, lng);
    } catch (error) {
      geocodeFailed = true;
      console.warn('[report] reverse geocoding failed:', error);
    }

    const normalizedAddress = {
      ...addressInfo,
      city: 'Berlin',
    };
    const html = renderMapSelectionPopup(lat, lng, normalizedAddress, geocodeFailed);
    const popup = L.popup({ maxWidth: 340 }).setLatLng([lat, lng]).setContent(html).openOn(map);
    activePopup = popup;
  }

  function bind() {
    map.on('click', handleMapClick);
  }

  return {
    bind,
    startSelection() {
      clearPopup();
      setSelectionMode(true);
    },
    stopSelection() {
      setSelectionMode(false);
      clearPopup();
    },
  };
}
