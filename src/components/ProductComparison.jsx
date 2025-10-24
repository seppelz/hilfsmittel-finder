import { useState, useEffect } from 'react';
import { X, Check, Minus, Sparkles, Scale, TrendingUp, Info } from 'lucide-react';
import { decodeProduct } from '../utils/productDecoder';
import { generateComparisonAnalysis, searchMultipleProductPrices } from '../services/aiEnhancement';

export function ProductComparison({ 
  products, 
  userContext, 
  onClose 
}) {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [productPrices, setProductPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(true);
  
  useEffect(() => {
    if (products.length >= 2) {
      loadAIAnalysis();
      loadProductPrices();
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
  
  // Load prices for all products using batched AI search
  const loadProductPrices = async () => {
    setLoadingPrices(true);
    
    // Separate products into those with API prices and those needing search
    const productsNeedingSearch = [];
    const prices = {};
    
    for (const product of products) {
      const code = product?.produktartNummer || product?.code;
      
      // Skip if product already has price from API
      if (product?.preis || product?.price) {
        prices[code] = product.preis || product.price;
        console.log('[ProductComparison] Using API price for:', code);
      } else {
        productsNeedingSearch.push(product);
      }
    }
    
    // Batch search for products without API prices
    if (productsNeedingSearch.length > 0) {
      console.log('[ProductComparison] Batch searching AI prices for', productsNeedingSearch.length, 'products');
      const aiPrices = await searchMultipleProductPrices(productsNeedingSearch);
      
      // Merge AI prices into prices object
      Object.assign(prices, aiPrices);
    }
    
    setProductPrices(prices);
    setLoadingPrices(false);
    console.log('[ProductComparison] Price loading complete:', Object.keys(prices).length, 'prices available');
  };
  
  // Extract features for comparison
  const comparisonData = products.map(product => {
    const decoded = decodeProduct(product);
    const code = product?.produktartNummer || product?.code;
    
    // Helper: Check if product has a specific feature
    const hasFeature = (featureKey) => {
      return decoded.features && decoded.features.some(f => f.key === featureKey);
    };
    
    // Extract power level from features (not from string matching)
    const powerFeature = decoded.features?.find(f => ['M', 'HP', 'UP', 'SP'].includes(f.key));
    
    // Determine price and source
    const apiPrice = product?.preis || product?.price;
    const aiPrice = productPrices[code];
    const finalPrice = apiPrice || aiPrice;
    const priceSource = apiPrice ? 'API' : (aiPrice ? 'AI' : null);
    
    return {
      product,
      decoded,
      name: product?.bezeichnung || 'Unbekannt',
      code: code,
      manufacturer: product?.hersteller,
      
      // Use decoded features (not manual string parsing)
      powerLevel: powerFeature?.key || null,
      powerDescription: powerFeature?.description || null,
      deviceType: decoded?.deviceType?.de || null,
      
      // Features from decoded object
      rechargeable: hasFeature('R'),
      bluetooth: hasFeature('Direct'),
      telecoil: hasFeature('T'),
      ai: hasFeature('AI'),
      
      // All features for display
      allFeatures: decoded.features || [],
      
      // Price with source tracking
      price: finalPrice,
      priceSource: priceSource,
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
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      Leistungsstufe
                      <div className="group relative">
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                          <strong>Leistungsstufen:</strong><br/>
                          • M = Mittlere Leistung (leichter Hörverlust)<br/>
                          • HP = High Power (starker Hörverlust)<br/>
                          • UP = Ultra Power (sehr starker Hörverlust)<br/>
                          • SP = Super Power (schwerster Hörverlust)
                        </div>
                      </div>
                    </div>
                  </td>
                  {comparisonData.map((item, idx) => (
                    <td key={idx} className="px-6 py-4 text-sm">
                      {item.powerLevel ? (
                        <div className="group relative inline-block">
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800 font-medium cursor-help">
                            {item.powerLevel}
                          </span>
                          {item.powerDescription && (
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                              {item.powerDescription}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Nicht angegeben</span>
                      )}
                    </td>
                  ))}
                </tr>
                
                {/* Bauform - only show if at least one product has a device type */}
                {comparisonData.some(item => item.deviceType) && (
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">Bauform</td>
                    {comparisonData.map((item, idx) => (
                      <td key={idx} className="px-6 py-4 text-sm text-gray-900">
                        {item.deviceType || (
                          <span className="text-gray-400 text-sm">Nicht erkennbar</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )}
                
                {/* All Recognized Features */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      ✨ Erkannte Funktionen
                      <div className="group relative">
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                          Alle automatisch erkannten Funktionen und Eigenschaften des Hörgeräts aus dem Produktnamen
                        </div>
                      </div>
                    </div>
                  </td>
                  {comparisonData.map((item, idx) => (
                    <td key={idx} className="px-6 py-4">
                      {item.allFeatures && item.allFeatures.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {item.allFeatures.map((feature, fIdx) => (
                            <div key={fIdx} className="group relative">
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800 cursor-help">
                                {feature.icon && <span>{feature.icon}</span>}
                                {feature.name}
                              </span>
                              {feature.description && (
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                                  {feature.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Keine erkannt</span>
                      )}
                    </td>
                  ))}
                </tr>
                
                {/* Wiederaufladbar */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      🔋 Wiederaufladbar
                    </div>
                  </td>
                  {comparisonData.map((item, idx) => (
                    <td key={idx} className="px-6 py-4">
                      {item.rechargeable ? (
                        <div className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">Ja</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Minus className="h-5 w-5 text-gray-300" />
                          <span className="text-sm text-gray-500">Nein</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                
                {/* Bluetooth */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      📱 Bluetooth
                    </div>
                  </td>
                  {comparisonData.map((item, idx) => (
                    <td key={idx} className="px-6 py-4">
                      {item.bluetooth ? (
                        <div className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">Ja</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Minus className="h-5 w-5 text-gray-300" />
                          <span className="text-sm text-gray-500">Nein</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                
                {/* Telefonspule */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      📞 Telefonspule (T)
                    </div>
                  </td>
                  {comparisonData.map((item, idx) => (
                    <td key={idx} className="px-6 py-4">
                      {item.telecoil ? (
                        <div className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">Ja</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Minus className="h-5 w-5 text-gray-300" />
                          <span className="text-sm text-gray-500">Nein</span>
                        </div>
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
                    <td key={idx} className="px-6 py-4">
                      {loadingPrices && !item.price ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Sparkles className="h-4 w-4 animate-pulse text-purple-500" />
                          <span>Suche Preis...</span>
                        </div>
                      ) : item.price ? (
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{item.price}</div>
                          {item.priceSource === 'AI' && (
                            <div className="flex items-center gap-1 mt-1">
                              <Sparkles className="h-3 w-3 text-purple-600" />
                              <span className="text-xs text-purple-600">KI-Recherche</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          <div className="font-medium">GKV-Festbetrag</div>
                          <div className="text-xs text-gray-400 mt-1">Zuzahlung: 5-10€</div>
                        </div>
                      )}
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
              Die meisten Hörgeräte haben einen Festbetrag (Zuzahlung: 10% des Preises, min. 5€, max. 10€).
              <br/><br/>
              💡 <strong>Preisinformation:</strong> Preise wurden per KI-Websuche recherchiert und sind unverbindlich. 
              Die GKV übernimmt die Kosten bis zum Festbetrag (~700-800€ pro Gerät). 
              Genaue Preise und Beratung erhalten Sie beim Hörgeräteakustiker.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

