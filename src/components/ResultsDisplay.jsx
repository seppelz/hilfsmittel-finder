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
}) {
  const [selected, setSelected] = useState(selectedProducts);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    
    return products.filter((product) => {
      const code = product?.produktartNummer || product?.code || '';
      return code.startsWith(selectedCategory);
    });
  }, [products, selectedCategory]);
  
  // Get category context based on selected filter or first product
  const categoryContext = useMemo(() => {
    if (selectedCategory) {
      // If filter is active, get context for that specific category
      return getCategoryContext(selectedCategory);
    }
    
    // Otherwise, get context from first product
    const firstProduct = filteredProducts[0] || products[0];
    const productCode = firstProduct?.produktartNummer || firstProduct?.code;
    return productCode ? getCategoryContext(productCode) : null;
  }, [selectedCategory, filteredProducts, products]);

  useEffect(() => {
    setSelected(selectedProducts);
  }, [selectedProducts]);
  
  const handleCategoryFilter = (categoryCode) => {
    setSelectedCategory(selectedCategory === categoryCode ? null : categoryCode);
    trackEvent('category_filter_applied', { category: categoryCode });
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
                !selectedCategory
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
                  selectedCategory === category.code
                    ? 'bg-primary text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
          {selectedCategory && (
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium">{filteredProducts.length}</span> von <span className="font-medium">{totalResults || products.length}</span> Produkten angezeigt
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

      {(totalResults || filteredProducts.length) === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <h3 className="text-2xl font-semibold text-text">Keine Hilfsmittel gefunden</h3>
          <p className="mt-2 text-gray-600">
            Für Ihre Angaben konnten wir keine passenden Hilfsmittel finden. Bitte überprüfen Sie Ihre Antworten.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl bg-primary px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"
            >
              Antworten anpassen
            </button>
          </div>
        </div>
      ) : (
        <ProductList
          products={filteredProducts}
          selectedProducts={selected}
          onToggleProduct={handleSelect}
          pagination={selectedCategory ? null : pagination}
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
