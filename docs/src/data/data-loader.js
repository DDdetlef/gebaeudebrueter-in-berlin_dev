const DEFAULT_PATHS = {
  metadata: './generated/data/metadata.json',
  fundorte: './generated/data/fundorte.json',
  schulen: './generated/data/schulen.json',
};

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while loading ${url}`);
  }
  return response.json();
}

function validateCounts(metadata, fundorte, schulen) {
  const warnings = [];
  const counts = metadata?.counts || {};
  if (typeof counts.fundorte === 'number' && counts.fundorte !== fundorte.length) {
    warnings.push(
      `fundorte count mismatch: metadata=${counts.fundorte}, loaded=${fundorte.length}`
    );
  }
  if (typeof counts.schulen === 'number' && counts.schulen !== schulen.length) {
    warnings.push(
      `schulen count mismatch: metadata=${counts.schulen}, loaded=${schulen.length}`
    );
  }
  return warnings;
}

export async function loadMapData(paths = DEFAULT_PATHS) {
  const metadata = await fetchJson(paths.metadata);
  const [fundorte, schulen] = await Promise.all([
    fetchJson(paths.fundorte),
    fetchJson(paths.schulen),
  ]);

  const warnings = validateCounts(metadata, fundorte, schulen);

  return {
    metadata,
    fundorte,
    schulen,
    warnings,
  };
}
