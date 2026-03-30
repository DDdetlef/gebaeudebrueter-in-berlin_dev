import { buildMarkerReportUrl, defaultDatabaseUrl } from '../shared/report-utils.js';

export function createPopupLoader() {
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderDescription(value) {
    if (Array.isArray(value) && value.length > 0) {
      return value.map((entry) => escapeHtml(entry)).join('<br>');
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return escapeHtml(value).replace(/\n/g, '<br>');
    }
    return '—';
  }

  function renderPopupHtml(markerData) {
    const species = markerData.species?.join(', ') || '—';
    const status = markerData.status?.join(', ') || '—';
    const address = markerData.address || '—';
    const buildingType = markerData.buildingType || '—';
    const buildingName = markerData.buildingName || '—';
    const firstObservation = markerData.firstObservation || '—';
    const description = renderDescription(markerData.description);
    const reportHref = buildMarkerReportUrl(markerData);
    const webId = markerData?.source?.webId || markerData?.id || '';
    const dbUrl = markerData?.source?.dbUrl || defaultDatabaseUrl(webId);
    const dbLink = dbUrl
      ? `<a href="${escapeHtml(dbUrl)}" target="_blank" rel="noreferrer">${escapeHtml(webId || 'Datenbankeintrag')}</a>`
      : '—';

    return [
      '<div class="popup-card">',
      `<b>Arten</b><br>${escapeHtml(species)}<br><br>`,
      `<b>Status</b><br>${escapeHtml(status)}<br><br>`,
      `<b>Gebäudetyp</b><br>${escapeHtml(buildingType)}<br><br>`,
      `<b>Gebäudename</b><br>${escapeHtml(buildingName)}<br><br>`,
      `<b>Adresse</b><br>${escapeHtml(address)}<br><br>`,
      `<b>Erstbeobachtung</b><br>${escapeHtml(firstObservation)}<br><br>`,
      `<b>Beschreibung</b><br>${description}<br><br>`,
      `<b>Link zur Datenbank</b><br>${dbLink}<br><br>`,
      `<a href="${escapeHtml(reportHref)}" class="gb-report-link" data-report-confirm="1" data-confirm-message="Die Meldung wird im NABU-Online-Formular geöffnet. Fortfahren?" target="_blank" rel="noreferrer">Beobachtung melden</a>`,
      '</div>',
    ].join('');
  }

  return {
    renderPopupHtml,
  };
}
