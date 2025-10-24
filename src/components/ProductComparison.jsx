import { useState, useEffect } from 'react';
import { X, Check, Minus, Sparkles, Scale, Info } from 'lucide-react';
import { decodeProduct } from '../utils/productDecoder';
import { generateComparisonAnalysis } from '../services/aiEnhancement';

export function ProductComparison({ 
  products, 
  userContext, 
  onClose 
}) {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [technicalSpecs, setTechnicalSpecs] = useState(null);
  
  useEffect(() => {
    if (products.length >= 2) {
      loadAIAnalysis();
    }
  }, [products]);
  
  const loadAIAnalysis = async () => {
    setLoadingAI(true);
    try {
      const analysis = await generateComparisonAnalysis(products, userContext);
      
      // Try to parse JSON from response
      try {
        // Extract JSON from response (might have markdown code blocks)
        const jsonMatch = analysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('[ProductComparison] Parsed JSON:', parsed);
          
          // Separate specs and recommendation
          if (parsed.products) {
            setTechnicalSpecs(parsed.products);
            console.log('[ProductComparison] Technical specs loaded:', parsed.products.length, 'products');
          }
          
          // Build recommendation text
          if (parsed.recommendation) {
            const recText = `**Beste Wahl:** ${parsed.recommendation.best_choice}\n\n**Alternative:** ${parsed.recommendation.alternative}\n\n**Wichtigster Unterschied:** ${parsed.recommendation.key_difference}`;
            setAiAnalysis(recText);
          } else {
            // Fallback to raw text if no recommendation structure
            setAiAnalysis(analysis);
          }
        } else {
          // Fallback: use raw text if no JSON
          console.log('[ProductComparison] No JSON found, using raw text');
          setAiAnalysis(analysis);
        }
      } catch (parseError) {
        console.error('[ProductComparison] JSON parse failed, using raw text:', parseError);
        setAiAnalysis(analysis);
      }
    } catch (error) {
      console.error('AI comparison failed:', error);
    } finally {
      setLoadingAI(false);
    }
  };
  
  // Detect category from first product
  const detectCategory = (code) => {
    if (code.startsWith('13.')) return 'hearing';
    if (code.startsWith('10.') || code.startsWith('09.')) return 'mobility';
    if (code.startsWith('25.') || code.startsWith('07.')) return 'vision';
    if (code.startsWith('04.')) return 'bathroom';
    return 'general';
  };
  
  // Extract features for comparison
  const comparisonData = products.map(product => {
    const decoded = decodeProduct(product);
    const code = product?.produktartNummer || product?.code;
    const name = product?.bezeichnung || '';
    
    // Helper: Check if product has a specific feature
    const hasFeature = (featureKey) => {
      return decoded.features && decoded.features.some(f => f.key === featureKey);
    };
    
    // Hearing aids features
    const powerFeature = decoded.features?.find(f => ['M', 'HP', 'UP', 'SP'].includes(f.key));
    
    // Mobility aids features (from product name)
    const isFoldable = name.toUpperCase().includes('FALTBAR') || name.toUpperCase().includes('KLAPPBAR');
    const isHeightAdjustable = name.toUpperCase().includes('HÖHENVERSTELLBAR') || name.toUpperCase().includes('VERSTELLBAR');
    const hasBrakes = name.toUpperCase().includes('BREMSE');
    const hasSeat = name.toUpperCase().includes('SITZ') || name.toUpperCase().includes('SITZFLÄCHE');
    const hasBasket = name.toUpperCase().includes('KORB') || name.toUpperCase().includes('TASCHE');
    const has4Wheels = name.toUpperCase().includes('4 RÄDER') || name.toUpperCase().includes('4-RÄDER') || name.toUpperCase().includes('VIERRÄD');
    const has3Wheels = name.toUpperCase().includes('3 RÄDER') || name.toUpperCase().includes('3-RÄDER') || name.toUpperCase().includes('DREIRÄD');
    
    return {
      product,
      decoded,
      name: product?.bezeichnung || 'Unbekannt',
      code: code,
      manufacturer: product?.hersteller,
      
      // Hearing aids features
      powerLevel: powerFeature?.key || null,
      powerDescription: powerFeature?.description || null,
      deviceType: decoded?.deviceType?.de || null,
      rechargeable: hasFeature('R'),
      bluetooth: hasFeature('Direct'),
      telecoil: hasFeature('T'),
      ai: hasFeature('AI'),
      
      // Mobility aids features
      foldable: isFoldable,
      heightAdjustable: isHeightAdjustable,
      brakes: hasBrakes,
      seat: hasSeat,
      basket: hasBasket,
      wheels: has4Wheels ? '4 Räder' : (has3Wheels ? '3 Räder' : 'Keine Angabe'),
      
      // All features for display
      allFeatures: decoded.features || [],
    };
  });
  
  const productCategory = comparisonData.length > 0 
    ? detectCategory(comparisonData[0].code) 
    : 'general';
  
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
                
                {/* Category-Specific Features */}
                
                {/* HÖRGERÄTE FEATURES */}
                {productCategory === 'hearing' && (
                  <>
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
                  </>
                )}
                
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
                
                {productCategory === 'hearing' && (
                  <>
                    {/* Wiederaufladbar */}
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        🔋 Wiederaufladbar
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
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        📱 Bluetooth
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
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        📞 Telefonspule (T)
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
                  </>
                )}
                
                {/* GEHHILFEN FEATURES */}
                {productCategory === 'mobility' && (
                  <>
                    {/* Faltbar */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          🚪 Faltbar
                          <div className="group relative">
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                              Kann zusammengeklappt werden für einfachen Transport und Lagerung
                            </div>
                          </div>
                        </div>
                      </td>
                      {comparisonData.map((item, idx) => (
                        <td key={idx} className="px-6 py-4">
                          {item.foldable ? (
                            <div className="flex items-center gap-2">
                              <Check className="h-5 w-5 text-green-600" />
                              <span className="text-sm text-green-700 font-medium">Ja</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Minus className="h-5 w-5 text-gray-300" />
                              <span className="text-sm text-gray-500">Nein / Nicht erkennbar</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                    
                    {/* Höhenverstellbar */}
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          📏 Höhenverstellbar
                          <div className="group relative">
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                              Kann an die Körpergröße angepasst werden
                            </div>
                          </div>
                        </div>
                      </td>
                      {comparisonData.map((item, idx) => (
                        <td key={idx} className="px-6 py-4">
                          {item.heightAdjustable ? (
                            <div className="flex items-center gap-2">
                              <Check className="h-5 w-5 text-green-600" />
                              <span className="text-sm text-green-700 font-medium">Ja</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Minus className="h-5 w-5 text-gray-300" />
                              <span className="text-sm text-gray-500">Nein / Nicht erkennbar</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                    
                    {/* Bremsen */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          🛑 Bremsen
                          <div className="group relative">
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                              Bremssystem für sicheres Anhalten (typisch bei Rollatoren)
                            </div>
                          </div>
                        </div>
                      </td>
                      {comparisonData.map((item, idx) => (
                        <td key={idx} className="px-6 py-4">
                          {item.brakes ? (
                            <div className="flex items-center gap-2">
                              <Check className="h-5 w-5 text-green-600" />
                              <span className="text-sm text-green-700 font-medium">Ja</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Minus className="h-5 w-5 text-gray-300" />
                              <span className="text-sm text-gray-500">Nein / Nicht erkennbar</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                    
                    {/* Sitzfläche */}
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          💺 Sitzfläche
                          <div className="group relative">
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                              Eingebaute Sitzfläche für Pausen unterwegs (typisch bei Rollatoren)
                            </div>
                          </div>
                        </div>
                      </td>
                      {comparisonData.map((item, idx) => (
                        <td key={idx} className="px-6 py-4">
                          {item.seat ? (
                            <div className="flex items-center gap-2">
                              <Check className="h-5 w-5 text-green-600" />
                              <span className="text-sm text-green-700 font-medium">Ja</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Minus className="h-5 w-5 text-gray-300" />
                              <span className="text-sm text-gray-500">Nein / Nicht erkennbar</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                    
                    {/* Korb/Tasche */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          🛒 Korb/Tasche
                          <div className="group relative">
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                              Einkaufskorb oder Tasche für Transport von Gegenständen
                            </div>
                          </div>
                        </div>
                      </td>
                      {comparisonData.map((item, idx) => (
                        <td key={idx} className="px-6 py-4">
                          {item.basket ? (
                            <div className="flex items-center gap-2">
                              <Check className="h-5 w-5 text-green-600" />
                              <span className="text-sm text-green-700 font-medium">Ja</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Minus className="h-5 w-5 text-gray-300" />
                              <span className="text-sm text-gray-500">Nein / Nicht erkennbar</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                    
                    {/* Räder */}
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          🔘 Räder
                          <div className="group relative">
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                              Anzahl der Räder (4 Räder = mehr Stabilität, 3 Räder = wendiger)
                            </div>
                          </div>
                        </div>
                      </td>
                      {comparisonData.map((item, idx) => (
                        <td key={idx} className="px-6 py-4">
                          <span className="text-sm text-gray-900">{item.wheels}</span>
                        </td>
                      ))}
                    </tr>
                  </>
                )}
                
                {/* Dynamic Technical Specifications from AI */}
                {technicalSpecs && technicalSpecs.length > 0 && (() => {
                  console.log('[ProductComparison] Rendering dynamic specs for', technicalSpecs.length, 'products');
                  
                  // Extract all unique spec keys
                  const allSpecKeys = new Set();
                  technicalSpecs.forEach(product => {
                    if (product.specs) {
                      Object.keys(product.specs).forEach(key => allSpecKeys.add(key));
                    }
                  });
                  
                  // Map keys to German labels
                  const specLabels = {
                    'max_weight': 'Max. Benutzergewicht',
                    'body_height': 'Körpergröße',
                    'seat_height': 'Sitzhöhe',
                    'total_height': 'Gesamthöhe',
                    'width': 'Breite',
                    'weight': 'Gewicht',
                    'power_level': 'Leistungsstufe (AI)',
                    'device_type': 'Bauform (AI)',
                    'battery_type': 'Batterie/Akku',
                    'bluetooth': 'Bluetooth (AI)',
                    'telecoil': 'Telefonspule (AI)',
                    'channels': 'Kanäle',
                    'programs': 'Programme',
                    'magnification': 'Vergrößerung',
                    'light': 'Beleuchtung',
                    'material': 'Material',
                    'dimensions': 'Maße',
                    'mounting': 'Montage',
                    'foldable': 'Faltbar (AI)',
                    'brakes': 'Bremsen (AI)',
                    'wheels': 'Räder (AI)',
                    'non_slip': 'Rutschfest',
                    'battery': 'Batteriebetrieb',
                    'size': 'Größe'
                  };
                  
                  // Create rows for each spec
                  const specRows = Array.from(allSpecKeys).map((specKey, idx) => {
                    const label = specLabels[specKey] || specKey;
                    const isEvenRow = idx % 2 === 0;
                    
                    return (
                      <tr key={`spec-${specKey}`} className={isEvenRow ? "bg-blue-50" : "bg-white"}>
                        <td className="px-6 py-4 text-sm font-semibold text-blue-900">
                          🔍 {label}
                        </td>
                        {technicalSpecs.map((productSpec, prodIdx) => {
                          const value = productSpec.specs?.[specKey];
                          const code = productSpec.code;
                          
                          return (
                            <td key={prodIdx} className="px-6 py-4">
                              {value && value !== "Nicht angegeben" ? (
                                <span className="text-sm font-semibold text-gray-900">{value}</span>
                              ) : (
                                <span className="text-sm text-gray-400 italic">Nicht angegeben</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  });
                  
                  return specRows;
                })()}
                
                {/* GKV Erstattung */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    ✓ GKV Erstattung
                  </td>
                  {comparisonData.map((item, idx) => (
                    <td key={idx} className="px-6 py-4">
                      <div className="text-sm text-green-700">
                        <div className="font-medium flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-600" />
                          Erstattungsfähig
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Zuzahlung: 5-10€</div>
                      </div>
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
              <br/><br/>
              {productCategory === 'hearing' && (
                <>
                  💡 <strong>Kostenübernahme:</strong> Die GKV übernimmt die Kosten bis zum Festbetrag (ca. 700-800€ pro Gerät). 
                  Ihre Zuzahlung beträgt 10% des Preises (mind. 5€, max. 10€). 
                  Genaue Beratung zu Kosten und Auswahl erhalten Sie beim Fachakustiker mit Ihrem Rezept.
                </>
              )}
              {productCategory === 'mobility' && (
                <>
                  💡 <strong>Nächster Schritt:</strong> Holen Sie sich ein Rezept von Ihrem Hausarzt oder Orthopäden. 
                  Lassen Sie sich dann im Sanitätshaus ausführlich beraten und probieren Sie die Gehhilfen aus. 
                  Die GKV übernimmt in der Regel die vollen Kosten. Ihre Zuzahlung: 5-10€.
                </>
              )}
              {productCategory === 'vision' && (
                <>
                  💡 <strong>Nächster Schritt:</strong> Rezept vom Augenarzt holen und im Fachgeschäft beraten lassen. 
                  Die GKV übernimmt die Kosten für erstattungsfähige Sehhilfen. Ihre Zuzahlung: 5-10€.
                </>
              )}
              {productCategory === 'bathroom' && (
                <>
                  💡 <strong>Nächster Schritt:</strong> Rezept vom Hausarzt holen und im Sanitätshaus beraten lassen. 
                  Die GKV übernimmt die Kosten für erstattungsfähige Badehilfen. Ihre Zuzahlung: 5-10€.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

