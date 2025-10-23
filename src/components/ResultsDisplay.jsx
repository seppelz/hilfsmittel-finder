import { useEffect, useState, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { ProductList } from './ProductList';
import { getCategoryContext } from '../data/productContexts';

const getProductId = (product) =>
  product?.id ??
  product?.uuid ??
  product?.produktId ??
  product?.produktartId ??
  product?.produktartNummer ??
  product?.code;

export function ResultsDisplay({
  products,
  totalResults = 0,
  insuranceType,
  pflegegrad,
  selectedProducts = [],
  onProductsSelected,
  onGenerateLetter,
  onBack,
  pagination,
  userAnswers = null,
  categories = [],
  onCategoryFilterChange,
  selectedCategoryFilter = null,
  onFeatureFilterChange,
  selectedFeatureFilters = [],
}) {
  const [selected, setSelected] = useState(selectedProducts);
  
  // Get category context based on selected filter, user's category, or first product
  const categoryContext = useMemo(() => {
    if (selectedCategoryFilter) {
      // If filter is active, get context for that specific category
      return getCategoryContext(selectedCategoryFilter);
    }
    
    // Try to get context from user's originally selected category
    if (userAnswers?._selectedCategory) {
      const categoryMap = {
        hearing: '13',
        mobility: '10',
        bathroom: '04',
        vision: '25',
      };
      const categoryCode = categoryMap[userAnswers._selectedCategory];
      if (categoryCode) {
        return getCategoryContext(categoryCode);
      }
    }
    
    // Fallback: get context from first product
    const firstProduct = products[0];
    const productCode = firstProduct?.produktartNummer || firstProduct?.code;
    return productCode ? getCategoryContext(productCode) : null;
  }, [selectedCategoryFilter, products, userAnswers]);

  useEffect(() => {
    setSelected(selectedProducts);
  }, [selectedProducts]);
  
  const handleCategoryFilter = (categoryCode) => {
    onCategoryFilterChange?.(categoryCode);
    trackEvent('category_filter_applied', { category: categoryCode });
  };

  // Extract available features from products for Hörgeräte
  const availableFeatures = useMemo(() => {
    // Only show feature filters for hearing aids
    const isHearingAids = userAnswers?._selectedCategory === 'hearing' || 
                         categories.some(c => c.code.startsWith('13'));
    
    if (!isHearingAids) return [];
    
    const features = new Set();
    products.forEach(product => {
      const name = (product.bezeichnung || product.name || '').toUpperCase();
      
      // Power levels
      if (name.includes(' HP') || name.includes('(HP')) features.add('HP');
      if (name.includes(' UP') || name.includes('(UP')) features.add('UP');
      if (name.includes(' SP') || name.includes('(SP')) features.add('SP');
      
      // Rechargeable
      if (name.includes(' R') || name.includes('-R') || name.includes('LITHIUM') || 
          name.includes('AKKU') || name.includes('WIEDERAUFLADBAR')) {
        features.add('R');
      }
      
      // Device types
      if (name.includes('IIC')) features.add('IIC');
      if (name.includes('CIC') && !name.includes('IIC')) features.add('CIC');
      if (name.includes('ITC')) features.add('ITC');
      if (name.includes('RITE') || name.includes('RIC')) features.add('RIC');
      if (name.includes('BTE') || name.includes('HDO')) features.add('BTE');
    });
    
    return Array.from(features).sort();
  }, [products, userAnswers, categories]);

  const handleFeatureToggle = (feature) => {
    const newFeatures = selectedFeatureFilters.includes(feature) 
      ? selectedFeatureFilters.filter(f => f !== feature)
      : [...selectedFeatureFilters, feature];
    
    onFeatureFilterChange?.(newFeatures);
    trackEvent('feature_filter_toggled', { feature, active: !selectedFeatureFilters.includes(feature) });
  };

  const handleSelect = (product) => {
    setSelected((prev) => {
      const productId = getProductId(product);
      const exists = prev.find((item) => getProductId(item) === productId);
      if (exists) {
        const updated = prev.filter((item) => getProductId(item) !== productId);
        onProductsSelected?.(updated);
        trackEvent('product_unselected', { productId });
        return updated;
      }
      const updated = [...prev, product];
      onProductsSelected?.(updated);
      trackEvent('product_selected', { productId });
      return updated;
    });
  };

  return (
    <section className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <header className="rounded-3xl bg-white p-6 shadow">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onBack}
            className="self-start text-lg font-semibold text-primary hover:text-blue-700"
          >
            Zurück zu den Fragen
          </button>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-text">Ihre empfohlenen Hilfsmittel</h2>
              <p className="text-gray-600">Basierend auf Ihren Antworten.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-primary">
                {totalResults || products.length} Treffer
              </span>
              {pflegegrad && (
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  Pflegegrad {pflegegrad}
                </span>
              )}
              {insuranceType && (
                <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">
                  Versicherung: {insuranceType.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Category Filter */}
      {categories && categories.length > 1 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="font-semibold text-gray-900">Nach Kategorie filtern:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryFilter(null)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                !selectedCategoryFilter
                  ? 'bg-primary text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle Kategorien ({totalResults || products.length})
            </button>
            {categories.map((category) => (
              <button
                key={category.code}
                onClick={() => handleCategoryFilter(category.code)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCategoryFilter === category.code
                    ? 'bg-primary text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
          {selectedCategoryFilter && (
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium">{products.length}</span> von <span className="font-medium">{totalResults}</span> Produkten in dieser Kategorie
            </div>
          )}
        </div>
      )}

      {/* Feature Filter for Hearing Aids */}
      {availableFeatures.length > 0 && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Filter className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-gray-900">Nach Eigenschaften filtern:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableFeatures.map((feature) => {
              const featureLabels = {
                'HP': 'High Power (Starker Hörverlust)',
                'UP': 'Ultra Power (Sehr starker Hörverlust)',
                'SP': 'Super Power (Extrem starker Hörverlust)',
                'R': 'Wiederaufladbar (R-Modell)',
                'IIC': 'IIC (Unsichtbar im Ohr)',
                'CIC': 'CIC (Komplett im Ohr)',
                'ITC': 'ITC (Im-Ohr-Kanal)',
                'RIC': 'RIC/RITE (Receiver-in-canal)',
                'BTE': 'BTE/HdO (Hinter dem Ohr)',
              };
              
              const isSelected = selectedFeatureFilters.includes(feature);
              
              return (
                <button
                  key={feature}
                  onClick={() => handleFeatureToggle(feature)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-white text-gray-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  {featureLabels[feature] || feature}
                </button>
              );
            })}
          </div>
          {selectedFeatureFilters.length > 0 && (
            <div className="mt-3 text-sm text-purple-700">
              <span className="font-medium">{products.length}</span> von <span className="font-medium">{totalResults}</span> Produkten entsprechen den Kriterien
            </div>
          )}
        </div>
      )}
      
      {categoryContext && (
        <div className="rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-4xl">{categoryContext.icon}</span>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-text">{categoryContext.name}</h3>
              <p className="mt-2 text-base leading-relaxed text-gray-700">{categoryContext.explanation}</p>
              
              {categoryContext.selectionTips && categoryContext.selectionTips.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-800">💡 Auswahlhilfe:</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    {categoryContext.selectionTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
        <strong>Wichtiger Hinweis:</strong> Diese Informationen ersetzen keine ärztliche Beratung. Die endgültige Entscheidung über die Kostenübernahme trifft Ihre Krankenkasse.
      </div>

      {(totalResults || products.length) === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <h3 className="text-2xl font-semibold text-text">Keine Hilfsmittel gefunden</h3>
          <p className="mt-2 text-gray-600">
            {selectedFeatureFilters.length > 0 
              ? 'Für Ihre gewählten Filter konnten wir keine passenden Hilfsmittel finden. Versuchen Sie, weniger Filter auszuwählen.'
              : 'Für Ihre Angaben konnten wir keine passenden Hilfsmittel finden. Bitte überprüfen Sie Ihre Antworten.'}
          </p>
          <div className="mt-6">
            {selectedFeatureFilters.length > 0 ? (
              <button
                type="button"
                onClick={() => onFeatureFilterChange?.([])}
                className="rounded-xl bg-purple-600 px-6 py-3 text-lg font-semibold text-white hover:bg-purple-700"
              >
                Filter zurücksetzen
              </button>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl bg-primary px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"
              >
                Antworten anpassen
              </button>
            )}
          </div>
        </div>
      ) : (
        <ProductList
          products={products}
          selectedProducts={selected}
          onToggleProduct={handleSelect}
          pagination={selectedCategoryFilter || selectedFeatureFilters.length > 0 ? null : pagination}
          userContext={userAnswers}
        />
      )}

      <footer className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <p className="text-gray-600">
          Ausgewählt für Ihren Antrag: <strong>{selected.length}</strong> Hilfsmittel
        </p>
        <button
          type="button"
          onClick={onGenerateLetter}
          disabled={selected.length === 0}
          className="rounded-xl bg-secondary px-6 py-4 text-lg font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Antragsschreiben erstellen
        </button>
      </footer>
    </section>
  );
}
