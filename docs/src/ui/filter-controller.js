import { BUILDING_TYPE_META, EVENT_NAMES, SPECIES_META, STATUS_META } from '../shared/constants.js';
import { renderSchoolIcon } from '../shared/building-icons.js';
import { qsa } from '../shared/dom-utils.js';

export function createFilterController({ root, options, eventBus }) {
  function renderCheckboxList(title, key, entries) {
    return [
      `<fieldset class="filter-group"><legend>${title}</legend>`,
      ...entries.map((entry) => {
        const value = typeof entry === 'string' ? entry : entry.value;
        const label = typeof entry === 'string' ? entry : entry.label;
        const id = `filter-${key}-${value || 'leer'}`;
        const hint = renderHint(key, value);
        return `<label for="${id}" class="check-row"><input id="${id}" data-filter-key="${key}" type="checkbox" value="${value}"><span class="filter-label"><span class="filter-label-text">${label}</span>${hint}</span></label>`;
      }),
      '</fieldset>',
    ].join('');
  }

  function renderHint(key, rawValue) {
    const value = String(rawValue || '');
    if (key === 'species') {
      const meta = SPECIES_META[value] || SPECIES_META.Andere;
      return `<span class="filter-hint" aria-hidden="true"><span class="filter-swatch filter-swatch-filled" style="--filter-color:${meta.color}"></span></span>`;
    }
    if (key === 'status') {
      const normalized = value.toLowerCase();
      const meta = STATUS_META[normalized] || STATUS_META.default;
      return `<span class="filter-hint" aria-hidden="true"><span class="filter-swatch filter-swatch-ring" style="--filter-color:${meta.color}"></span></span>`;
    }
    if (key === 'buildingType') {
      const normalized = value.toLowerCase();
      const meta = BUILDING_TYPE_META[normalized];
      if (meta) {
        if (normalized === 'schule') {
          return `<span class="filter-hint" aria-hidden="true">${renderSchoolIcon({ className: 'filter-building-type-icon', title: meta.label })}</span>`;
        }
        return `<span class="filter-hint" aria-hidden="true"><span class="filter-swatch filter-swatch-filled" style="--filter-color:${meta.color}"></span></span>`;
      }
    }
    return '<span class="filter-hint" aria-hidden="true"><span class="filter-swatch filter-swatch-filled" style="--filter-color:#9e9e9e"></span></span>';
  }

  function render() {
    const buildingTypes = (options.buildingType || [])
      .filter((entry) => typeof entry === 'string' && entry.trim().length > 0)
      .map((entry) => ({
        value: entry,
        label: entry.toLowerCase() === 'schule' ? 'Schule' : entry,
      }));

    root.innerHTML = [
      renderCheckboxList('Arten', 'species', options.species),
      renderCheckboxList('Status', 'status', options.status),
      buildingTypes.length > 0 ? renderCheckboxList('Gebäudetyp', 'buildingType', buildingTypes) : '',
    ].join('');
  }

  function readStateFromDom() {
    const selected = { species: [], status: [], buildingType: [] };
    qsa('input[type="checkbox"][data-filter-key]', root).forEach((input) => {
      if (input.checked) {
        const key = input.getAttribute('data-filter-key');
        selected[key].push(input.value);
      }
    });
    return selected;
  }

  function bind() {
    return {
      apply: () => eventBus.emit(EVENT_NAMES.FILTER_APPLY, readStateFromDom()),
      reset: () => {
        qsa('input[type="checkbox"]', root).forEach((node) => {
          node.checked = false;
        });
        eventBus.emit(EVENT_NAMES.FILTER_RESET);
      },
    };
  }

  render();

  return {
    bind,
  };
}
