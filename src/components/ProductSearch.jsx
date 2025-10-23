import { useEffect, useState } from 'react';
import { gkvApi } from '../services/gkvApi';
import { trackEvent, logError } from '../utils/analytics';

export function ProductSearch({ criteria, onResultsFound, page = 1, pageSize = 20, selectedCategoryFilter = null, selectedFeatureFilters = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!criteria) return;

    let isMounted = true;

    async function search() {
      setLoading(true);
      setError(null);

      try {
        const results = await gkvApi.searchProducts(criteria, { page, pageSize }, selectedCategoryFilter, selectedFeatureFilters);
        if (!isMounted) return;

        onResultsFound?.(results);
        trackEvent('product_search_completed', {
          total: results.total,
          page: results.page,
          pageSize,
          categoryFilter: selectedCategoryFilter,
          featureFilters: selectedFeatureFilters,
        });
      } catch (err) {
        logError('product_search_failed', err, { criteria });
        if (!isMounted) return;

        setError('Die Hilfsmitteldaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    search();

    return () => {
      isMounted = false;
    };
  }, [criteria, page, pageSize, onResultsFound, selectedCategoryFilter, selectedFeatureFilters]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-primary" />
        <p className="text-lg text-gray-600">Suche passende Hilfsmittel in der offiziellen Datenbank...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
        {error}
      </div>
    );
  }

  return null;
}
