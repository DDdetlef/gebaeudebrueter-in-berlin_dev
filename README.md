# Dieser Version ersetzt die ältere Version "Gebaeudebruter-test"

# Gebäudebrüter in Berlin – GitHub Pages (Display)

Dieses Repository enthält nur die statischen Dateien für die Veröffentlichung der Karte über GitHub Pages.

Quelle der in der Karte angezeigten Daten ist die **Online-Datenbank "Gebäudebrüter in Berlin"** des Projekts Gebäudebrüter im **NABU Landesverband Berlin** und der NABU Bezirksgruppe Steglitz-Zehlendorf.
ULR: http://gebaeudebrueter-in-berlin.de/index.php

## Inhalt

- `docs/index.html` (Weiterleitung)
- `docs/GebaeudebrueterMultiMarkers.html` (aktive Karte)
- `docs/assets/` (JS/CSS-Assets)
- `docs/images/` (Bilder)
- `docs/gb_feedback.js`
- `docs/smoke-check.md`

## Generator-Repository

Die Datenpipeline (Scraping, Bereinigung, Geocoding, Transformation, Kartengenerierung) wurde ausgelagert nach:

- `https://github.com/nabu-berlin/gebaeudebrueter-map-generator`

Dort werden neue Karten erzeugt und anschließend nach `docs/` dieses Repositories publiziert.

## Lokale Vorschau

```powershell
python -m http.server 8000
```

Dann öffnen:

- `http://localhost:8000/docs/`
- oder direkt `http://localhost:8000/docs/GebaeudebrueterMultiMarkers.html`

## Feedback
Anregungen, Kritik und Fehlermeldungen unter "Issues" posten.
