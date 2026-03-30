export function createMarkerController({ markerFactory, layerController, initialData = [] }) {
  const SPECIES_UNKNOWN = 'unbekannt';

  const demoData = [
    {
      id: 'demo-1',
      position: [52.52, 13.405],
      species: ['Sperling'],
      status: ['Kontrolle'],
      address: 'Musterstraße 1, Berlin',
    },
    {
      id: 'demo-2',
      position: [52.5, 13.37],
      species: ['Mauersegler'],
      status: ['Sanierung'],
      address: 'Musterstraße 2, Berlin',
    },
  ];
  const allMarkerData = Array.isArray(initialData) && initialData.length > 0 ? initialData : demoData;
  let currentFilter = { species: [], status: [], buildingType: [] };
  let currentMode = 'normal';

  function uniqueSorted(values) {
    return [...new Set(values.filter((entry) => typeof entry === 'string' && entry.length > 0))].sort((a, b) =>
      a.localeCompare(b, 'de')
    );
  }

  function isSchoolRecord(item) {
    if (String(item.buildingType || '').toLowerCase() === 'schule') {
      return true;
    }
    return String(item?.source?.dataset || '').toLowerCase() === 'schulen';
  }

  function buildFilteredDataset() {
    return allMarkerData.filter((item) => {
      if (currentMode === 'schulsanierung' && !isSchoolRecord(item)) {
        return false;
      }
      const filterState = currentFilter;
      const speciesOk = filterState.species.length === 0 || item.species.some((sp) => filterState.species.includes(sp));
      const statusOk = filterState.status.length === 0 || item.status.some((st) => filterState.status.includes(st));
      const buildingOk =
        !Array.isArray(filterState.buildingType) ||
        filterState.buildingType.length === 0 ||
        filterState.buildingType.includes(item.buildingType || '');
      return speciesOk && statusOk && buildingOk;
    });
  }

  function renderFiltered() {
    const filtered = buildFilteredDataset();

    const leafletMarkers = filtered.map(markerFactory.makeMarker);
    layerController.replaceMarkers(leafletMarkers);
  }

  function applyFilter(filterState) {
    currentFilter = {
      species: Array.isArray(filterState?.species) ? filterState.species : [],
      status: Array.isArray(filterState?.status) ? filterState.status : [],
      buildingType: Array.isArray(filterState?.buildingType) ? filterState.buildingType : [],
    };
    renderFiltered();
  }

  function setMode(mode) {
    currentMode = mode === 'schulsanierung' ? 'schulsanierung' : 'normal';
    renderFiltered();
  }

  return {
    applyFilter,
    setMode,
    getFilterOptions: () => ({
      species: uniqueSorted([...allMarkerData.flatMap((item) => item.species || []), SPECIES_UNKNOWN]),
      status: uniqueSorted(allMarkerData.flatMap((item) => item.status || [])),
      buildingType: uniqueSorted(allMarkerData.map((item) => item.buildingType || '')),
    }),
  };
}
