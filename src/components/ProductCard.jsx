import { Check, Info } from 'lucide-react';
import { decodeProduct, getSimplifiedName, generateExplanation } from '../utils/productDecoder';
import { getCategoryIcon, getCategoryName } from '../data/productContexts';

export function ProductCard({ product, selected = false, onSelect }) {
  const code = product?.produktartNummer || product?.code || 'Unbekannt';
  const name = product?.bezeichnung || product?.name || 'Hilfsmittel';
  const description = product?.beschreibung || product?.description;
  const zuzahlung = product?.zuzahlung || '10% des Preises (min. 5€, max. 10€)';
  const hersteller = product?.hersteller || product?.manufacturer;
  
  // Decode product name for user-friendly display
  const decodedInfo = decodeProduct(product);
  const simplifiedName = getSimplifiedName(name);
  const typeExplanation = generateExplanation(decodedInfo);
  const categoryIcon = getCategoryIcon(code);
  const categoryName = getCategoryName(code);
  
  // Additional info that might be available
  const indikation = product?.indikation;
  const anwendungsgebiet = product?.anwendungsgebiet;

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
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 font-mono text-sm text-gray-700">
          {code}
        </span>
        <span className="text-xs text-gray-500">Offizieller Code</span>
      </div>

      <h3 className="text-xl font-bold text-text">{simplifiedName}</h3>
      
      {typeExplanation && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-2xl">{categoryIcon}</span>
          <span className="font-medium text-gray-700">{typeExplanation}</span>
        </div>
      )}
      
      {decodedInfo?.deviceType && (
        <p className="mt-1 text-sm text-gray-600">
          {decodedInfo.deviceType.de}
          {decodedInfo.deviceType.visibility && (
            <span className="ml-2 text-xs text-gray-500">• {decodedInfo.deviceType.visibility}</span>
          )}
        </p>
      )}
      
      {decodedInfo?.features && decodedInfo.features.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {decodedInfo.features.map((feature, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
              title={feature.description}
            >
              <span>{feature.icon}</span>
              <span>{feature.name}</span>
            </span>
          ))}
        </div>
      )}
      
      {description && (
        <p className="mt-2 text-lg text-gray-600">{description}</p>
      )}
      
      {!description && (indikation || anwendungsgebiet) && (
        <div className="mt-2 space-y-1">
          {indikation && (
            <p className="text-base text-gray-600">
              <span className="font-medium">Indikation:</span> {indikation}
            </p>
          )}
          {anwendungsgebiet && (
            <p className="text-base text-gray-600">
              <span className="font-medium">Anwendungsgebiet:</span> {anwendungsgebiet}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-semibold text-green-900">✓ Von der GKV erstattungsfähig</p>
        <p className="mt-1 text-sm text-green-700">Zuzahlung: {zuzahlung}</p>
      </div>

      {hersteller && <p className="mt-4 text-sm text-gray-500">Hersteller: {hersteller}</p>}
      
      {name !== simplifiedName && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
            <Info className="inline h-3 w-3 mr-1" />
            Technischer Name
          </summary>
          <p className="mt-1 text-xs text-gray-500 font-mono">{name}</p>
        </details>
      )}

      {selected && (
        <div className="mt-4 inline-flex items-center gap-2 text-primary">
          <Check className="h-5 w-5" />
          <span className="text-sm font-semibold">Für Antrag ausgewählt</span>
        </div>
      )}
    </button>
  );
}
