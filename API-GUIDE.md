# Hilfsmittel API Guide

## Endpoints
- **`/api/verzeichnis/VerzeichnisTree/4`**: Returns the full product group tree, including nested children. Every node exposes an `id` (GUID) and `xSteller` code. Cache this tree locally to build a `{ xSteller -> id }` lookup.
- **`/api/verzeichnis/Produkt`**: Provides paginated product lists. Preferred usage:
  - `?produktgruppe=<GUID>&skip=0&take=50&$count=true`
  - Fallback: `?produktgruppennummer=<xSteller>&skip=0&take=50&$count=true` if no GUID match exists.
  - The response may be either an array or an object with `value` and count metadata (`count`, `Count`, `total`).

## Fetch Strategy
- Resolve the end-user group code to the corresponding GUID by walking the tree once and memoizing descendants with a helper like `indexGroupTree()`.
- Attempt the GUID-based `Produkt` request first. If it fails (404, 500, etc.), retry with the `produktgruppennummer` endpoint before surfacing an error.
- Normalize results:
  - Skip entries with `istHerausgenommen: true` or placeholder names such as `"Nicht besetzt"`.
  - Derive display metadata from `displayName`, `name`, `bezeichnung`, `herstellerName`, `erleuterungstext`, and `typenAusfuehrungen`.

## Caching
- Client cache payloads in `localStorage` under `gkv_hilfsmittel_cache`, tagging them with a schema version (e.g., `CACHE_SCHEMA_VERSION = "2025-10-23-products"`). Bump the schema when normalization changes to force a refresh.
- Persist `{ xSteller -> GUID }` mappings alongside cached product groups for quick lookup without re-downloading the tree.
- Service workers must evict outdated caches. When `public/sw.js` changes or API semantics shift, increment cache names (`CACHE_NAME`, `API_CACHE_NAME`) or unregister the worker to avoid serving stale data.

## Proxy Usage
- The Next.js API route `api/proxy.js` forwards requests to `https://hilfsmittel-api.gkv-spitzenverband.de`. All front-end calls should flow through this proxy (`/api/proxy?path=...`) so that CORS headers and logging are handled centrally.
- Pass query parameters untouched. Example:
  ```js
  const url = `/api/proxy?path=${encodeURIComponent('api/verzeichnis/Produkt')}&produktgruppe=${guid}&skip=0&take=50&$count=true`;
  fetch(url);
  ```

## Troubleshooting
- If the UI shows “Die Hilfsmitteldaten konnten nicht geladen werden…”, clear local storage and unregister the service worker to purge stale responses.
- Inspect the console for `[gkvApi] Produktabruf fehlgeschlagen` warnings to see which endpoint variant failed and why.
- Use the PowerShell helper `scripts/dump_products.ps1` to capture raw payloads for a given GUID when debugging data quality.
