# Migration Plan: Repo B as Display Layer (Fetch JSON)

This document defines the safe migration from inline marker HTML to fetched JSON data.

## Current State

- `docs/GebaeudebrueterMultiMarkers.html` contains inline marker definitions.
- `docs/GebaeudebrueterBerlinBySpecies.html` also contains inline marker blocks.
- `docs/src/` already contains a modular app skeleton (`modern.html` + controllers).
- `scripts/qa-school-import-check.js` currently parses HTML to validate school marker rules.

## Target State

- Repo B owns presentation only: Leaflet map rendering, filters, icons, UI.
- Marker data is loaded at runtime via `fetch()` from:
  - `docs/generated/data/fundorte.json`
  - `docs/generated/data/schulen.json`
  - `docs/generated/data/metadata.json`
- No inline marker arrays in production HTML.

## Recommended Structure in Repo B

- `docs/generated/data/` consumed JSON payloads from Repo A
- `docs/src/data/data-loader.js` fetch and metadata consistency checks
- `docs/src/data/normalizers.js` convert raw JSON into marker-controller shape
- `docs/src/markers/marker-controller.js` filter/render only, no source parsing

## Compatibility Rollout (No Downtime)

1. Add JSON loader and normalizers.
2. Keep legacy inline mode as fallback for one release.
3. Add feature flag in bootstrap (`USE_JSON_DATA`).
4. Run smoke checks against both paths.
5. Switch default to JSON path.
6. Remove inline marker payload from HTML and remove legacy parser checks.

## Data Flow in Client

1. Load `metadata.json`.
2. Load `fundorte.json` and `schulen.json` in parallel.
3. Validate count consistency:
  - `fundorte.length === metadata.counts.fundorte`
  - `schulen.length === metadata.counts.schulen`
4. Normalize records into marker-controller data model.
5. Render as Leaflet markers and keep UI filters unchanged.

## Fetch Error Handling

- If one file fails to load: show user-facing error panel, avoid blank map without message.
- If metadata/count mismatch: log warning, continue rendering with actual payload.
- If invalid records found: skip invalid row, report count in console.

## QA Shift: HTML Parsing -> JSON Validation

Replace current HTML-based QA with JSON-based checks.

Current script:
- `scripts/qa-school-import-check.js` parses `docs/GebaeudebrueterMultiMarkers.html`.

New script idea:
- `scripts/qa-school-json-check.js` parses `docs/generated/data/*.json`.

Same rules, cleaner source:
- berlin bbox check
- duplicate school checks
- required defaults for school data
- one csv row => one school marker

## Minimal Bootstrap Integration Plan

In `docs/src/app/bootstrap.js`:

1. import loader and normalizer
2. load JSON before creating filter options
3. pass loaded data to marker controller

Pseudo-flow:

```js
const loaderResult = await loadMapData();
const markerData = normalizeMapData(loaderResult);
const markerController = createMarkerController({ markerFactory, layerController, initialData: markerData });
```

## Definition of Done for Repo B

- Map runs without inline marker data.
- JSON fetch path active in production page.
- Existing filters and popup behavior preserved.
- Version/date/count are visible using `metadata.json`.
- Smoke test passes for map load, filters and report action flow.
