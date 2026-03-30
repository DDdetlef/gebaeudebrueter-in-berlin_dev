import { createEventBus } from './event-bus.js';
import { createAppState } from './state.js';
import { createMapController } from '../map/map-controller.js';
import { createLayerController } from '../map/layer-controller.js';
import { createLocationController } from '../map/location-controller.js';
import { createReportController } from '../map/report-controller.js';
import { createPopupLoader } from '../markers/popup-loader.js';
import { createMarkerFactory } from '../markers/marker-factory.js';
import { createMarkerController } from '../markers/marker-controller.js';
import { createFilterController } from '../ui/filter-controller.js';
import { createBottomSheetController } from '../ui/bottom-sheet-controller.js';
import { createNavController } from '../ui/nav-controller.js';
import { EVENT_NAMES } from '../shared/constants.js';
import { qs } from '../shared/dom-utils.js';
import { loadMapData } from '../data/data-loader.js';
import { normalizeMapData } from '../data/normalizers.js';
import { openReportUrlWithConfirm } from '../shared/report-utils.js';

function formatGeneratedAt(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) {
    return '';
  }

  const parsedDate = new Date(raw);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleDateString('de-DE');
  }

  const datePart = raw.split('T')[0];
  const maybeDate = new Date(datePart);
  if (!Number.isNaN(maybeDate.getTime())) {
    return maybeDate.toLocaleDateString('de-DE');
  }

  return raw;
}

async function run() {
  const eventBus = createEventBus();
  const state = createAppState(eventBus);

  const mapController = createMapController();
  const map = mapController.init('map');
  const appShell = qs('#app');

  const layerController = createLayerController(map, mapController.getBaseLayers());
  layerController.init();

  const popupLoader = createPopupLoader();
  const markerFactory = createMarkerFactory({ popupLoader });

  let initialData = [];
  let loadedMetadata = null;
  try {
    const loaded = await loadMapData();
    initialData = normalizeMapData(loaded);
    loadedMetadata = loaded.metadata || null;
    if (loaded.warnings.length > 0) {
      console.warn('[map-data] metadata warnings:', loaded.warnings);
    }
  } catch (error) {
    console.warn('[map-data] JSON loading failed, fallback to demo data:', error);
  }

  const markerController = createMarkerController({ markerFactory, layerController, initialData });

  const filterRoot = qs('[data-role="filter-root"]');
  const filterController = createFilterController({
    root: filterRoot,
    options: markerController.getFilterOptions(),
    eventBus,
  });

  const bottomSheetController = createBottomSheetController({
    sheetElement: qs('[data-role="filter-sheet"]'),
    state,
  });

  const navController = createNavController({
    sheetElement: qs('[data-role="nav-sheet"]'),
    backdropElement: qs('[data-role="nav-backdrop"]'),
    state,
  });

  const locationController = createLocationController({ map, eventBus });
  locationController.bind();
  const reportController = createReportController({ map });
  reportController.bind();
  let popupOpen = false;

  function syncSourceAttributionVisibility() {
    const currentState = state.getState();
    const shouldHide = currentState.navOpen || currentState.filterSheetOpen || popupOpen;
    appShell?.classList.toggle('sources-hidden', shouldHide);
  }

  eventBus.on('state:changed', syncSourceAttributionVisibility);
  map.on('popupopen', () => {
    popupOpen = true;
    syncSourceAttributionVisibility();
  });
  map.on('popupclose', () => {
    popupOpen = false;
    syncSourceAttributionVisibility();
  });
  map.on('click', () => {
    if (state.getState().navOpen) {
      navController.close();
    }
    if (state.getState().filterSheetOpen) {
      bottomSheetController.close();
    }
  });

  const dataGeneratedAtEl = qs('[data-role="data-generated-at"]');
  if (dataGeneratedAtEl) {
    const formattedDate = formatGeneratedAt(loadedMetadata?.generated_at || loadedMetadata?.generatedAt);
    dataGeneratedAtEl.textContent = formattedDate ? `Datenstand: ${formattedDate}` : '';
  }

  function updateModeUi(mode) {
    const indicator = qs('[data-role="mode-indicator"]');
    if (indicator) {
      indicator.textContent = mode === 'schulsanierung' ? 'Modus: Projekt Schulsanierung' : 'Modus: Gemeldete Fundorte';
    }
    document.querySelectorAll('[data-mode-button]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-mode-button') === mode);
    });
  }

  function applyMapMode(mode) {
    const nextMode = mode === 'schulsanierung' ? 'schulsanierung' : 'normal';
    state.patchState({ mapMode: nextMode });
    markerController.setMode(nextMode);
    updateModeUi(nextMode);
  }

  eventBus.on(EVENT_NAMES.FILTER_APPLY, (filterState) => {
    state.patchState({ activeFilters: filterState });
    markerController.applyFilter(filterState);
    bottomSheetController.close();
  });

  eventBus.on(EVENT_NAMES.FILTER_RESET, () => {
    const emptyFilter = { species: [], status: [], buildingType: [] };
    state.patchState({ activeFilters: emptyFilter });
    markerController.applyFilter(emptyFilter);
  });

  eventBus.on(EVENT_NAMES.REPORT_SELECT_ON_MAP, () => {
    reportController.startSelection();
    navController.close();
  });

  applyMapMode(state.getState().mapMode);
  markerController.applyFilter(state.getState().activeFilters);

  const filterBindings = filterController.bind();

  function closePanelsOnOutsidePointer(target) {
    if (state.getState().navOpen) {
      const inNav = target?.closest('[data-role="nav-sheet"]');
      const navToggle = target?.closest('[data-action="toggle-nav"]');
      if (!inNav && !navToggle) {
        navController.close();
      }
    }

    if (state.getState().filterSheetOpen) {
      const inFilter = target?.closest('[data-role="filter-sheet"]');
      const filterOpenTrigger = target?.closest('[data-action="open-filter"]');
      if (!inFilter && !filterOpenTrigger) {
        bottomSheetController.close();
      }
    }
  }

  document.addEventListener('pointerdown', (event) => {
    const pointerTarget = event.target instanceof Element ? event.target : null;
    closePanelsOnOutsidePointer(pointerTarget);
  });

  document.addEventListener('click', (event) => {
    const clickTarget = event.target instanceof Element ? event.target : null;
    closePanelsOnOutsidePointer(clickTarget);

    const reportLink = event.target.closest('a.gb-report-link[data-report-confirm="1"]');
    if (reportLink) {
      event.preventDefault();
      if (reportLink.hasAttribute('data-report-stop-selection')) {
        reportController.stopSelection();
      }
      const href = reportLink.getAttribute('href') || '';
      const confirmMessage = reportLink.getAttribute('data-confirm-message') || '';
      const result = openReportUrlWithConfirm(href, confirmMessage);
      if (!result.ok && result.reason === 'popup-blocked') {
        window.alert('Das Online-Formular konnte nicht geöffnet werden. Bitte erlauben Sie Pop-ups für diese Seite.');
      }
      return;
    }

    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) {
      return;
    }
    const action = actionEl.getAttribute('data-action');
    if (action === 'toggle-nav') {
      navController.open();
    }
    if (action === 'close-nav') {
      navController.close();
    }
    if (action === 'open-filter') {
      reportController.stopSelection();
      navController.close();
      bottomSheetController.open();
    }
    if (action === 'close-filter') {
      bottomSheetController.close();
    }
    if (action === 'apply-filter') {
      filterBindings.apply();
    }
    if (action === 'reset-filter') {
      filterBindings.reset();
    }
    if (action === 'locate') {
      eventBus.emit(EVENT_NAMES.LOCATION_REQUEST);
    }
    if (action === 'report-site') {
      bottomSheetController.close();
      navController.close();
      eventBus.emit(EVENT_NAMES.REPORT_SELECT_ON_MAP);
    }
    if (action === 'mode-normal') {
      reportController.stopSelection();
      applyMapMode('normal');
      navController.close();
    }
    if (action === 'mode-schulsanierung') {
      reportController.stopSelection();
      applyMapMode('schulsanierung');
      navController.close();
    }
  });

  syncSourceAttributionVisibility();
}

run().catch((error) => {
  console.error('[bootstrap] fatal startup error:', error);
});
