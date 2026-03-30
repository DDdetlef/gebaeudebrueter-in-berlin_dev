export function createLayerController(map, baseLayers = {}) {
  const clusterLayer = L.markerClusterGroup({
    showCoverageOnHover: false,
  });
  let layerControl = null;

  function init() {
    map.addLayer(clusterLayer);
    layerControl = L.control.layers(baseLayers, null, { collapsed: true }).addTo(map);
  }

  function replaceMarkers(markers) {
    clusterLayer.clearLayers();
    clusterLayer.addLayers(markers);
  }

  return {
    init,
    replaceMarkers,
    clusterLayer,
    layerControl,
  };
}
