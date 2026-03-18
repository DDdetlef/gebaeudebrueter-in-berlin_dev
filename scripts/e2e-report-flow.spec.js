const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { test, expect, devices } = require('@playwright/test');

const ROOT_DIR = process.cwd();
const CANDIDATE_TARGET_PATHS = [
  '/docs/GebaeudebrueterMultiMarkers.html',
  '/gebaeudebrueter-in-berlin_dev/docs/GebaeudebrueterMultiMarkers.html'
];

function normalizeTargetPath(rawPath) {
  if (!rawPath) return '';
  return rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
}

function resolveTargetPath() {
  const envTargetPath = normalizeTargetPath(process.env.E2E_TARGET_PATH || '');
  if (envTargetPath) return envTargetPath;

  for (const candidate of CANDIDATE_TARGET_PATHS) {
    const absolute = path.join(ROOT_DIR, candidate.replace(/^\/+/, ''));
    if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) {
      return candidate;
    }
  }

  throw new Error(`Keine Ziel-HTML gefunden. Geprueft: ${CANDIDATE_TARGET_PATHS.join(', ')}`);
}

const TARGET_PATH = resolveTargetPath();

let server;
let baseUrl;

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.ico') return 'image/x-icon';
  if (ext === '.woff') return 'font/woff';
  if (ext === '.woff2') return 'font/woff2';
  return 'application/octet-stream';
}

function toSafeFsPath(urlPath) {
  let normalizedPath = decodeURIComponent(urlPath || '/');
  normalizedPath = normalizedPath.split('?')[0].split('#')[0];
  if (normalizedPath.endsWith('/')) normalizedPath += 'index.html';
  const joined = path.join(ROOT_DIR, normalizedPath.replace(/^\/+/, ''));
  const safe = path.normalize(joined);
  if (!safe.startsWith(path.normalize(ROOT_DIR))) return null;
  return safe;
}

async function firstVisible(locator, maxScan = 12) {
  const count = await locator.count();
  const limit = Math.min(count, maxScan);
  for (let i = 0; i < limit; i += 1) {
    const item = locator.nth(i);
    const visible = await item.isVisible().catch(() => false);
    if (visible) return item;
  }
  return null;
}

async function firstVisibleFromSelectors(page, selectors) {
  for (const selector of selectors) {
    const candidate = await firstVisible(page.locator(selector));
    if (candidate) return candidate;
  }
  return null;
}

function assertReportUrl(url, label) {
  expect(url, `${label}: URL darf nicht leer sein`).toBeTruthy();
  expect(url, `${label}: URL darf kein mailto sein`).not.toMatch(/^mailto:/i);
  expect(url, `${label}: URL soll Fundort-Parameter enthalten`).toMatch(/fundort(?:_|strasse|hausnummer|plz|ort|lat|lng|koordinaten)=/i);
}

async function openAnyMarkerReportLink(page) {
  const selectors = [
    '.leaflet-popup a.gb-report-link:has-text("Beobachtung melden")',
    '#ms-marker-modal a.gb-report-link:has-text("Beobachtung melden")',
    '#ms-marker-modal-body a.gb-report-link:has-text("Beobachtung melden")'
  ];

  for (let attempt = 0; attempt < 14; attempt += 1) {
    const readyLink = await firstVisibleFromSelectors(page, selectors);
    if (readyLink) return readyLink;

    const marker = await firstVisible(page.locator('.leaflet-marker-icon'));
    if (marker) {
      await marker.click({ force: true });
      await page.waitForTimeout(450);
      continue;
    }

    const cluster = await firstVisible(page.locator('.marker-cluster'));
    if (cluster) {
      await cluster.click({ force: true });
      await page.waitForTimeout(500);
      continue;
    }

    const map = page.locator('.leaflet-container').first();
    if (await map.isVisible().catch(() => false)) {
      await map.dblclick({ position: { x: 320, y: 220 } }).catch(() => {});
      await page.waitForTimeout(550);
    }
  }

  throw new Error('Kein Beobachtung melden-Link in Marker-Popup gefunden.');
}

async function openInPopupAndGetUrl(context, page, clickable) {
  const hrefFallback = String((await clickable.getAttribute('href')) || '').trim();
  const beforeUrl = page.url();

  try {
    const popupPromise = context.waitForEvent('page', { timeout: 8000 });
    await clickable.click({ force: true });
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {});
    const url = popup.url() || hrefFallback;
    await popup.close({ runBeforeUnload: true }).catch(() => {});
    return url;
  } catch (error) {
    const currentUrl = page.url();
    if (currentUrl && currentUrl !== beforeUrl) {
      return currentUrl;
    }
    return hrefFallback;
  }
}

async function triggerSubmitSelection(page, mode) {
  const primary = ['#ms-submit-btn', '#ms-submit-btn-header', '#ms-submit-btn-sheet'];
  for (const selector of primary) {
    const btn = await firstVisible(page.locator(selector));
    if (btn) {
      await btn.click({ force: true });
      return selector;
    }
  }

  if (mode === 'mobile') {
    const filterFab = await firstVisible(page.locator('#ms-filter-fab'));
    if (filterFab) {
      await filterFab.click({ force: true });
      await page.waitForTimeout(250);
      const submitSheetBtn = await firstVisible(page.locator('#ms-submit-btn-sheet'));
      if (submitSheetBtn) {
        await submitSheetBtn.click({ force: true });
        return '#ms-submit-btn-sheet';
      }
    }
  }

  const textButton = await firstVisible(page.getByRole('button', { name: /Fundort melden/i }));
  if (textButton) {
    await textButton.click({ force: true });
    return 'button:Fundort melden';
  }

  throw new Error(`Kein Submit-Einstieg gefunden für Modus ${mode}`);
}

async function clickMapCenter(page) {
  const map = page.locator('.leaflet-container').first();
  await map.waitFor({ state: 'visible', timeout: 20000 });
  const box = await map.boundingBox();
  if (!box) throw new Error('Map-Bounding-Box fehlt');
  const x = box.x + Math.floor(box.width * 0.54);
  const y = box.y + Math.floor(box.height * 0.54);
  await page.mouse.click(x, y);
}

async function waitForNewLocationLink(page) {
  const selectors = [
    '.leaflet-popup a.gb-report-link:has-text("Standort auswählen")',
    '#ms-marker-modal a.gb-report-link:has-text("Standort auswählen")',
    '#ms-marker-modal-body a.gb-report-link:has-text("Standort auswählen")'
  ];

  const started = Date.now();
  while (Date.now() - started < 20000) {
    const link = await firstVisibleFromSelectors(page, selectors);
    if (link) return link;
    await page.waitForTimeout(250);
  }
  throw new Error('Kein Standort auswählen-Link gefunden');
}

async function runFullFlow(page, context, mode) {
  const reversePayload = {
    address: {
      road: 'Teststrasse',
      house_number: '10',
      postcode: '10115',
      city: 'Berlin'
    },
    display_name: 'Teststrasse 10, 10115 Berlin'
  };

  await context.route(/https:\/\/nominatim\.openstreetmap\.org\/reverse.*/i, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(reversePayload)
    });
  });

  await page.goto(`${baseUrl}${TARGET_PATH}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('.leaflet-container', { timeout: 20000 });
  await page.waitForFunction(() => !!window.__MS_CONTROLS_READY, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(600);

  const existingLink = await openAnyMarkerReportLink(page);
  const existingHref = String((await existingLink.getAttribute('href')) || '').trim();
  assertReportUrl(existingHref, `${mode}/bestehender-fundort-href`);
  expect(existingHref, `${mode}/bestehender-fundort soll Fundort-ID enthalten`).toMatch(/fundort_id=/i);

  const existingPopupUrl = await openInPopupAndGetUrl(context, page, existingLink);
  assertReportUrl(existingPopupUrl, `${mode}/bestehender-fundort-popup`);

  const markerModalClose = await firstVisible(page.locator('#ms-marker-modal:not(.ms-hidden) button[aria-label="Schließen"], #ms-marker-modal:not(.ms-hidden) button:has-text("Schließen")'));
  if (markerModalClose) {
    await markerModalClose.click({ force: true });
    await page.waitForTimeout(180);
  }

  const submitSelector = await triggerSubmitSelection(page, mode);
  await page.waitForTimeout(300);
  await clickMapCenter(page);

  const newLocationLink = await waitForNewLocationLink(page);
  const newLocationHref = String((await newLocationLink.getAttribute('href')) || '').trim();
  assertReportUrl(newLocationHref, `${mode}/neuer-fundort-href`);
  expect(newLocationHref, `${mode}/neuer-fundort soll Koordinaten enthalten`).toMatch(/fundortlat=.*fundortlng=/i);
  expect(newLocationHref, `${mode}/neuer-fundort soll Adresse enthalten`).toMatch(/fundortstrasse=.*fundortplz=/i);

  const newLocationPopupUrl = await openInPopupAndGetUrl(context, page, newLocationLink);
  assertReportUrl(newLocationPopupUrl, `${mode}/neuer-fundort-popup`);

  test.info().annotations.push({
    type: `e2e-${mode}`,
    description: `submitEntry=${submitSelector} existing=${existingPopupUrl} new=${newLocationPopupUrl}`
  });
}

test.describe.configure({ mode: 'serial' });
test.setTimeout(120000);

test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    try {
      const filePath = toSafeFsPath(req.url || '/');
      if (!filePath) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': getContentType(filePath),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      });
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Server error');
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address !== 'object') {
    throw new Error('Lokaler Testserver konnte nicht gestartet werden.');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  if (!server) return;
  await new Promise((resolve) => server.close(() => resolve()));
});

test('Desktop E2E: bestehender + neuer Fundort melden nur via Online-Formular', async ({ page, context }) => {
  await runFullFlow(page, context, 'desktop');
});

test.use({ ...devices['iPhone 12'] });
test('Mobil E2E: bestehender + neuer Fundort melden nur via Online-Formular', async ({ page, context }) => {
  await runFullFlow(page, context, 'mobile');
});
