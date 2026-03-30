import { DEFAULT_FILTER_STATE, DEFAULT_MAP_MODE } from '../shared/constants.js';

export function createAppState(eventBus) {
  let state = {
    isMobile: window.matchMedia('(max-width: 600px)').matches,
    activeFilters: structuredClone(DEFAULT_FILTER_STATE),
    mapMode: DEFAULT_MAP_MODE,
    navOpen: false,
    filterSheetOpen: false,
  };

  function getState() {
    return state;
  }

  function patchState(partial) {
    state = { ...state, ...partial };
    eventBus.emit('state:changed', state);
  }

  return {
    getState,
    patchState,
  };
}
