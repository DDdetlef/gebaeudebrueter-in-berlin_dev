const SCHOOL_ICON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3zm0 13L5 12.18V16c0 2.76 3.13 5 7 5s7-2.24 7-5v-3.82L12 16z"/></svg>';

export function renderSchoolIcon({ className = 'ms-building-type-icon', title = 'Schule' } = {}) {
  return `<span class="${className}" title="${title}">${SCHOOL_ICON_SVG}</span>`;
}
