import { Check } from 'lucide-react';

export function ProductCard({ product, selected = false, onSelect }) {
  const code = product?.produktartNummer || product?.code || 'Unbekannt';
  const name = product?.bezeichnung || product?.name || 'Hilfsmittel';
  const description = product?.beschreibung || product?.description || 'Keine Beschreibung verfügbar.';
  const zuzahlung = product?.zuzahlung || '10% des Preises (min. 5€, max. 10€)';
  const hersteller = product?.hersteller || product?.manufacturer;

  const handleClick = () => {
    onSelect?.(product);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full rounded-3xl border-2 p-6 text-left transition ${
        selected ? 'border-primary bg-blue-50 shadow-lg' : 'border-gray-200 bg-white hover:border-primary/60'
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-full bg-gray-100 px-4 py-1 font-mono text-sm text-gray-700">
          {code}
        </span>
        <span className="text-xs text-gray-500">Offizieller Code</span>
      </div>

      <h3 className="text-2xl font-semibold text-text">{name}</h3>
      <p className="mt-2 text-lg text-gray-600">{description}</p>

      <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-semibold text-green-900">✓ Von der GKV erstattungsfähig</p>
        <p className="mt-1 text-sm text-green-700">Zuzahlung: {zuzahlung}</p>
      </div>

      {hersteller && <p className="mt-4 text-sm text-gray-500">Hersteller: {hersteller}</p>}

      {selected && (
        <div className="mt-4 inline-flex items-center gap-2 text-primary">
          <Check className="h-5 w-5" />
          <span className="text-sm font-semibold">Für Antrag ausgewählt</span>
        </div>
      )}
    </button>
  );
}
