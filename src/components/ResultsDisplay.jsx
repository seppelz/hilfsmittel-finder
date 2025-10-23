import { useEffect, useState } from 'react';
import { trackEvent } from '../utils/analytics';
import { ProductList } from './ProductList';

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
}) {
  const [selected, setSelected] = useState(selectedProducts);

  useEffect(() => {
    setSelected(selectedProducts);
  }, [selectedProducts]);

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
              <p className="text-gray-600">
                Basierend auf Ihren Antworten aus der Kategorie "{getCategoryLabel(products)}".
              </p>
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

      <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
        <strong>Wichtiger Hinweis:</strong> Diese Informationen ersetzen keine ärztliche Beratung. Die endgültige Entscheidung über die Kostenübernahme trifft Ihre Krankenkasse.
      </div>

      {(totalResults || products.length) === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <h3 className="text-2xl font-semibold text-text">Keine Hilfsmittel gefunden</h3>
          <p className="mt-2 text-gray-600">
            Für Ihre Angaben konnten wir keine passenden Hilfsmittel finden. Überprüfen Sie Ihre Antworten oder lassen Sie sich persönlich beraten.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 md:flex-row md:justify-center">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl bg-primary px-5 py-3 text-lg font-semibold text-white hover:bg-blue-700"
            >
              Antworten anpassen
            </button>
            <a
              className="text-lg font-semibold text-primary hover:text-blue-700"
              href="https://hilfsmittelverzeichnis.gkv-spitzenverband.de/home"
              target="_blank"
              rel="noreferrer"
            >
              Offizielles Hilfsmittelverzeichnis
            </a>
            <a
              className="text-lg font-semibold text-primary hover:text-blue-700"
              href="mailto:beratung@aboelo.de?subject=Frage%20zum%20Hilfsmittel-Finder"
            >
              Support kontaktieren
            </a>
          </div>
        </div>
      ) : (
        <ProductList
          products={products}
          selectedProducts={selected}
          onToggleProduct={handleSelect}
          pagination={pagination}
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
