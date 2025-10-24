import { useState, useEffect } from 'react';
import { X, Check, Minus, Sparkles, Scale, TrendingUp } from 'lucide-react';
import { decodeProduct } from '../utils/productDecoder';
import { generateComparisonAnalysis } from '../services/aiEnhancement';

export function ProductComparison({ 
  products, 
  userContext, 
  onClose 
}) {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  
  useEffect(() => {
    if (products.length >= 2) {
      loadAIAnalysis();
    }
  }, [products]);
  
  const loadAIAnalysis = async () => {
    setLoadingAI(true);
    try {
      const analysis = await generateComparisonAnalysis(products, userContext);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('AI comparison failed:', error);
    } finally {
      setLoadingAI(false);
    }
  };
  
  // Extract features for comparison
  const comparisonData = products.map(product => {
    const decoded = decodeProduct(product);
    const name = (product?.bezeichnung || '').toUpperCase();
    
    return {
      product,
      decoded,
      name: product?.bezeichnung || 'Unbekannt',
      code: product?.produktartNummer || product?.code,
      manufacturer: product?.hersteller,
      powerLevel: name.match(/(HP|UP|SP|M(?:\s|-))/)?.[1] || 'Standard',
      deviceType: decoded?.deviceType?.de || 'Unbekannt',
      rechargeable: name.includes(' R ') || name.includes('LITHIUM') || name.includes('AKKU'),
      bluetooth: name.includes('BLUETOOTH') || name.includes('DIRECT'),
      telecoil: name.includes(' T ') || name.includes('TELECOIL'),
      // Price extraction (format: "ab 1234 EUR" or similar)
      price: product?.preis || product?.price || 'Auf Anfrage',
    };
  });
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="h-7 w-7 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Produktvergleich</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 hover:bg-gray-100 transition"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Vergleichen Sie die wichtigsten Eigenschaften und finden Sie das beste Gerät für Ihre Bedürfnisse.
          </p>
        </div>
        
        {/* Content */}
        <div className="p-8 space-y-8">
          {/* AI Personalized Recommendation */}
          {aiAnalysis && (
            <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Persönliche Empfehlung für Sie
                  </h3>
                  <div className="text-gray-700 whitespace-pre-line">
                    {aiAnalysis}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {loadingAI && (
            <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-gray-400 animate-pulse" />
                <span className="text-gray-600">Analyse läuft...</span>
              </div>
            </div>
          )}
          
          {/* Comparison Table */}
          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-48">
                    Eigenschaft
                  </th>
                  {comparisonData.map((item, idx) => (
                    <th key={idx} className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      <div className="space-y-1">
                        <div className="font-mono text-xs text-gray-500">{item.code}</div>
                        <div className="text-base">{item.name.substring(0, 40)}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Hersteller */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Hersteller</td>
                  {comparisonData.map((item, idx) => (
                    <td key={idx} className="px-6 py-4 text-sm text-gray-900">
                      {item.manufacturer || 'Unbekannt'}
                    </td>
                  ))}
                </tr>
                
                {/* Leistungsstufe */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Leistungsstufe</td>
                  {comparisonData.map((item, idx) => (
                    <td key={idx} className="px-6 py-4 text-sm">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800 font-medium">
                        {item.powerLevel}
                      </span>
                    </td>
                  ))}
                </tr>
                
                {/* Bauform */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Bauform</td>
                  {comparisonData.map((item, idx) => (
                    <td key={idx} className="px-6 py-4 text-sm text-gray-900">
                      {item.deviceType}
                    </td>
                  ))}
                </tr>
                
                {/* Wiederaufladbar */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Wiederaufladbar</td>
                  {comparisonData.map((item, idx) => (
                    <td key={idx} className="px-6 py-4">
                      {item.rechargeable ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Minus className="h-5 w-5 text-gray-300" />
                      )}
                    </td>
                  ))}
                </tr>
                
                {/* Bluetooth */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Bluetooth</td>
                  {comparisonData.map((item, idx) => (
                    <td key={idx} className="px-6 py-4">
                      {item.bluetooth ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Minus className="h-5 w-5 text-gray-300" />
                      )}
                    </td>
                  ))}
                </tr>
                
                {/* Telefonspule */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Telefonspule (T)</td>
                  {comparisonData.map((item, idx) => (
                    <td key={idx} className="px-6 py-4">
                      {item.telecoil ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Minus className="h-5 w-5 text-gray-300" />
                      )}
                    </td>
                  ))}
                </tr>
                
                {/* Preis */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      Preis (ca.)
                    </div>
                  </td>
                  {comparisonData.map((item, idx) => (
                    <td key={idx} className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {item.price}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* GKV Info */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Wichtig:</strong> Alle hier gezeigten Produkte sind von der GKV erstattungsfähig. 
              Zuzahlung: 10% des Preises (mindestens 5€, maximal 10€ pro Hilfsmittel).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

