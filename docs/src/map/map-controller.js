import { BASEMAPS, INITIAL_VIEW } from '../shared/constants.js';

export function createMapController() {
  let map = null;
  let baseLayers = {};

  function init(containerId = 'map') {
    map = L.map(containerId, {
      zoomControl: true,
      closePopupOnClick: true,
      attributionControl: false,
    }).setView(INITIAL_VIEW.center, INITIAL_VIEW.zoom);

    L.control
      .attribution({
        position: 'bottomleft',
        prefix: false,
      })
      .addTo(map);

    baseLayers = {
      [BASEMAPS.positron.label]: L.tileLayer(BASEMAPS.positron.url, BASEMAPS.positron.options),
      [BASEMAPS.topPlusOpen.label]: L.tileLayer(BASEMAPS.topPlusOpen.url, BASEMAPS.topPlusOpen.options),
    };

    baseLayers[BASEMAPS.positron.label].addTo(map);

    return map;
  }

  function getMap() {
    return map;
  }

  return {
    init,
    getMap,
    getBaseLayers: () => ({ ...baseLayers }),
  };
}
