import { useMemo } from 'react';
import { ProductCard } from './ProductCard';
import { getProductId } from '../utils/productUtils';

export function ProductList({ products = [], selectedProducts = [], onToggleProduct, pagination, userContext = null, comparisonProducts = [], onAddToComparison }) {
  const selectedIds = useMemo(() => {
    return new Set((selectedProducts ?? []).map((item) => getProductId(item)));
  }, [selectedProducts]);

  const comparisonIds = useMemo(() => {
    return new Set((comparisonProducts ?? []).map((item) => getProductId(item)));
  }, [comparisonProducts]);

  if (!products.length) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        {products.map((product) => {
          const id = getProductId(product);
          return (
            <ProductCard
              key={id}
              product={product}
              selected={selectedIds.has(id)}
              onSelect={() => onToggleProduct?.(product)}
              userContext={userContext}
              inComparison={comparisonIds.has(id)}
              onAddToComparison={onAddToComparison}
            />
          );
        })}
      </div>

      {pagination && (
        <PaginationControls {...pagination} />
      )}
    </div>
  );
}

function PaginationControls({ page = 1, pageSize = 20, total = 0, onPageChange, totalPages: totalPagesProp }) {
  const totalPages = totalPagesProp ?? Math.max(1, Math.ceil(total / pageSize));
  const canGoBack = page > 1;
  const canGoForward = page < totalPages;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(start + pageSize - 1, total);

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 md:flex-row md:justify-between" role="navigation" aria-label="Produktsuche pagination">
      <span>
        Seite {page} von {totalPages} · {start.toLocaleString('de-DE')}
        {total > 0 ? `–${end.toLocaleString('de-DE')}` : ''} von {total.toLocaleString('de-DE')} Einträgen
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => canGoBack && onPageChange?.(page - 1)}
          className="rounded-lg border border-gray-200 px-4 py-2 font-semibold text-gray-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Zur vorherigen Seite"
        >
          Zurück
        </button>
        <button
          type="button"
          disabled={!canGoForward}
          onClick={() => canGoForward && onPageChange?.(page + 1)}
          className="rounded-lg border border-gray-200 px-4 py-2 font-semibold text-gray-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Zur nächsten Seite"
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
