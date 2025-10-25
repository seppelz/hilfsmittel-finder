import { useState, useEffect } from 'react';
import { X, Check, Minus, Sparkles, Scale, Info } from 'lucide-react';
import { decodeProduct } from '../utils/productDecoder';
import { generateComparisonAnalysis } from '../services/aiEnhancement';
import { getComparisonFieldsForProducts } from '../data/comparisonFields';

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
      const result = await generateComparisonAnalysis(products, userContext);
      
      console.log('[ProductComparison] Received result:', result);
      
      // Result is now already a parsed object with {products, recommendation}
      if (result && typeof result === 'object') {
        // Set technical specs directly
        if (result.products) {
          setTechnicalSpecs(result.products);
          console.log('[ProductComparison] Technical specs loaded:', result.products.length, 'products');
        }
        
        // Build recommendation text
        if (result.recommendation) {
          const recText = `**Beste Wahl:** ${result.recommendation.best_choice}\n\n**Alternative:** ${result.recommendation.alternative}\n\n**Wichtigster Unterschied:** ${result.recommendation.key_difference}`;
          setAiAnalysis(recText);
        } else {
          setAiAnalysis('Vergleichen Sie die technischen Daten in der Tabelle.');
        }
      } else {
        // Legacy fallback for old format (string)
        console.log('[ProductComparison] Legacy format detected, using raw text');
        setAiAnalysis(result || 'Vergleich konnte nicht erstellt werden.');
      }
    } catch (error) {
      console.error('AI comparison failed:', error);
      setAiAnalysis('Fehler beim Laden des Vergleichs.');
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
  
  // Merge AI technical specs with manual detection
  const mergedComparisonData = comparisonData.map((item) => {
    // Find matching AI specs for this product
    const aiSpec = technicalSpecs?.find(spec => spec.code === item.code);
    
    // Merge: AI data takes priority, manual detection as fallback
    return {
      ...item,
      // Use AI specs if available, otherwise manual detection
      foldable: aiSpec?.specs?.foldable === "Ja" ? "Ja" : 
                aiSpec?.specs?.foldable === "Nein" ? "Nein" :
                item.foldable ? "Ja (erkannt)" : "Nicht angegeben",
                
      brakes: aiSpec?.specs?.brakes === "Ja" ? "Ja" :
              aiSpec?.specs?.brakes === "Nein" ? "Nein" :
              item.brakes ? "Ja (erkannt)" : "Nicht angegeben",
              
      wheels: aiSpec?.specs?.wheels && aiSpec.specs.wheels !== "Nicht angegeben" 
              ? aiSpec.specs.wheels 
              : (item.wheels && item.wheels !== "Keine Angabe" ? item.wheels : "Nicht angegeben"),
      
      // Technical specs from AI (no manual detection for these)
      max_weight: aiSpec?.specs?.max_weight || null,
      body_height: aiSpec?.specs?.body_height || null,
      seat_height: aiSpec?.specs?.seat_height || null,
      total_height: aiSpec?.specs?.total_height || null,
      width: aiSpec?.specs?.width || null,
      weight: aiSpec?.specs?.weight || null,
      
      // Hearing aids specs
      power_level: aiSpec?.specs?.power_level || null,
      device_type_ai: aiSpec?.specs?.device_type || null,
      battery_type: aiSpec?.specs?.battery_type || null,
      bluetooth_ai: aiSpec?.specs?.bluetooth || null,
      telecoil_ai: aiSpec?.specs?.telecoil || null,
      channels: aiSpec?.specs?.channels || null,
      programs: aiSpec?.specs?.programs || null,
    };
  });
  
  console.log('[ProductComparison] Merged comparison data:', mergedComparisonData);
  
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
                
                {/* DYNAMIC SUBCATEGORY-SPECIFIC FEATURES */}
                {(() => {
                  // Get subcategory-specific fields for these products
                  const relevantFields = getComparisonFieldsForProducts(products, productCategory);
                  
                  // Filter out fields where ALL products have "Nicht angegeben"
                  const visibleFields = relevantFields.filter(field => {
                    const hasValue = mergedComparisonData.some(item => {
                      const value = item[field.key];
                      return value && value !== 'Nicht angegeben' && value !== 'Keine Angabe';
                    });
                    return hasValue;
                  });
                  
                  // Boolean fields (need special rendering with checkmarks)
                  const booleanFields = ['foldable', 'brakes', 'basket'];
                  
                  return visibleFields.map((field, fieldIdx) => {
                    const isBoolean = booleanFields.includes(field.key);
                    const isAlternating = fieldIdx % 2 === 0;
                    
                    return (
                      <tr key={field.key} className={isAlternating ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 text-sm font-semibold text-blue-900">
                          {field.icon} {field.label}
                        </td>
                        {mergedComparisonData.map((item, idx) => {
                          const value = item[field.key];
                          
                          return (
                            <td key={idx} className="px-6 py-4">
                              {isBoolean ? (
                                // Boolean field with checkmarks
                                value === "Ja" || value === "Ja (erkannt)" ? (
                                  <div className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-600" />
                                    <span className="text-sm text-green-700 font-medium">Ja</span>
                                  </div>
                                ) : value === "Nein" ? (
                                  <div className="flex items-center gap-2">
                                    <Minus className="h-5 w-5 text-gray-300" />
                                    <span className="text-sm text-gray-500">Nein</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400 italic">Nicht angegeben</span>
                                )
                              ) : (
                                // Regular text field
                                value && value !== 'Nicht angegeben' && value !== 'Keine Angabe' ? (
                                  <span className="text-sm font-bold text-gray-900">{value}</span>
                                ) : (
                                  <span className="text-sm text-gray-400 italic">Nicht angegeben</span>
                                )
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  });
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

