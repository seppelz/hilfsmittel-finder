import { useState, useEffect } from 'react';
import { Check, Info, Sparkles, Award, Scale } from 'lucide-react';
import { decodeProduct, getSimplifiedName, generateExplanation } from '../utils/productDecoder';
import { getCategoryIcon, getCategoryName } from '../data/productContexts';
import { generateProductDescription, isAIAvailable, isHighlyRecommended } from '../services/aiEnhancement';
import { gkvApi } from '../services/gkvApi';

export function ProductCard({ product, selected = false, onSelect, userContext = null, onAddToComparison = null, inComparison = false }) {
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
  
  // Check if highly recommended for user
  const isRecommended = isHighlyRecommended(product, userContext, decodedInfo);
  
  // Additional info that might be available
  const indikation = product?.indikation;
  const anwendungsgebiet = product?.anwendungsgebiet;
  
  // Extract basic metadata from API (produktart, typenAusfuehrungen, nutzungsdauer)
  const produktart = product?.produktart;
  const typenAusfuehrungen = product?.typenAusfuehrungen;
  const nutzungsdauer = product?.nutzungsdauer;
  
  // AI-generated description state
  const [aiDescription, setAiDescription] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAI, setShowAI] = useState(false);
  
  // State for product details
  const [fullProductDetails, setFullProductDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Auto-generate AI description when card becomes visible (for selected products)
  useEffect(() => {
    if (selected && isAIAvailable() && !aiDescription && !loadingAI) {
      loadAIDescription();
    }
  }, [selected]);
  
  const loadAIDescription = async () => {
    if (loadingAI || aiDescription) return;
    
    setLoadingAI(true);
    try {
      // Ensure we have full product details before generating AI description
      let details = fullProductDetails;
      if (!details) {
        console.log('[ProductCard] Loading full details for AI...');
        details = await loadFullProductDetails();
      }
      
      // Merge konstruktionsmerkmale with product for AI
      const enrichedProduct = details?.konstruktionsmerkmale
        ? { ...product, konstruktionsmerkmale: details.konstruktionsmerkmale }
        : product;
      
      console.log('[ProductCard] Generating AI with konstruktionsmerkmale:', enrichedProduct.konstruktionsmerkmale?.length || 0, 'fields');
      
      const generated = await generateProductDescription(enrichedProduct, userContext, decodedInfo);
      if (generated) {
        setAiDescription(generated);
        setShowAI(true);
      }
    } catch (error) {
      console.error('Failed to generate AI description:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  // Function to fetch full product details (konstruktionsmerkmale)
  const loadFullProductDetails = async () => {
    if (loadingDetails || fullProductDetails) return fullProductDetails;
    
    const productId = product?.id;
    if (!productId) {
      console.warn('[ProductCard] No product ID available for fetching details');
      return null;
    }
    
    setLoadingDetails(true);
    try {
      console.log('[ProductCard] Fetching full details for product ID:', productId);
      const details = await gkvApi.getProductDetails(productId);
      console.log('[ProductCard] Full details received:', details);
      setFullProductDetails(details);
      return details; // Return the fetched details
    } catch (error) {
      console.error('[ProductCard] Failed to fetch full product details:', error);
      return null;
    } finally {
      setLoadingDetails(false);
    }
  };

  // Auto-load details immediately when card is selected
  useEffect(() => {
    if (selected && !fullProductDetails && !loadingDetails) {
      loadFullProductDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

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
      
      {/* Besonders empfohlen Badge */}
      {isRecommended && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-2 shadow-sm">
          <Award className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-bold text-amber-900">⭐ Besonders empfohlen für Ihre Situation</span>
        </div>
      )}
      
      {typeExplanation && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-2xl">{categoryIcon}</span>
          <span className="font-medium text-gray-700">{typeExplanation}</span>
        </div>
      )}
      
      {/* Feature badges */}
      {decodedInfo?.features && decodedInfo.features.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {decodedInfo.features.map((feature, idx) => (
            <div key={idx} className="group relative">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 px-3 py-1 text-xs font-semibold text-purple-800 shadow-sm border border-purple-200 cursor-help">
                {feature.icon && <span>{feature.icon}</span>}
                {feature.name}
              </span>
              {/* Tooltip on hover */}
              {feature.description && (
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                  {feature.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Original description or indikation */}
      {!showAI && description && (
        <p className="mt-2 text-lg text-gray-600">{description}</p>
      )}
      
      {!showAI && !description && (indikation || anwendungsgebiet) && (
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

      {/* Technische Details - Always visible, auto-loaded */}
      {(loadingDetails || fullProductDetails?.konstruktionsmerkmale?.length > 0 || produktart || typenAusfuehrungen?.length > 0 || nutzungsdauer) && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 Technische Details</h3>
          
          <div className="space-y-1 rounded-lg bg-gray-50 p-4">
            {loadingDetails && (
              <p className="text-sm text-gray-600 text-center py-4">
                ⏳ Lade Details...
              </p>
            )}
            
            {!loadingDetails && fullProductDetails?.konstruktionsmerkmale && fullProductDetails.konstruktionsmerkmale.length > 0 && (
              <div className="space-y-2">
                {fullProductDetails.konstruktionsmerkmale.map((merkmal, idx) => {
                  // Special handling for "Freitext" - show without label
                  if (merkmal.label === 'Freitext') {
                    return (
                      <p key={idx} className="text-sm text-gray-700">
                        {merkmal.value}
                      </p>
                    );
                  }
                  // Regular fields: show label and value
                  return (
                    <div key={idx} className="text-sm">
                      <span className="font-semibold text-gray-700">{merkmal.label}:</span>{' '}
                      <span className="text-gray-600">{merkmal.value}</span>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Show existing basic info if available */}
            {(produktart || typenAusfuehrungen?.length > 0 || nutzungsdauer) && (
              <div className={fullProductDetails?.konstruktionsmerkmale?.length > 0 ? "mt-3 pt-3 border-t border-gray-200 space-y-2" : "space-y-2"}>
                {produktart && (
                  <p className="text-xs text-gray-600">
                    <strong>Produktart:</strong> {produktart}
                  </p>
                )}
                
                {typenAusfuehrungen && typenAusfuehrungen.length > 0 && (
                  <p className="text-xs text-gray-600">
                    <strong>Verfügbare Ausführungen:</strong> {typenAusfuehrungen.join(', ')}
                  </p>
                )}
                
                {nutzungsdauer && (
                  <p className="text-xs text-gray-600">
                    <strong>Nutzungsdauer:</strong> {nutzungsdauer}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI-Generated Description - Show AFTER API data */}
      {showAI && aiDescription && (
        <div className="mt-3 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="h-5 w-5 flex-shrink-0 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-900 mb-1">KI-Erklärung für Sie:</p>
              <p className="text-base leading-relaxed text-gray-700">{aiDescription}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Show AI button if not selected and AI is available - Show AFTER API data */}
      {!showAI && !selected && isAIAvailable() && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            loadAIDescription();
          }}
          disabled={loadingAI}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-wait"
        >
          <Sparkles className="h-4 w-4" />
          {loadingAI ? 'Wird erklärt...' : 'KI-Erklärung anzeigen'}
        </button>
      )}

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

      {/* Comparison Action */}
      {onAddToComparison && (
        <div 
          className="mt-3 pt-3 border-t border-gray-200"
          onClick={(e) => e.stopPropagation()} // Prevent card selection
        >
          <button
            type="button"
            onClick={() => onAddToComparison(product)}
            className={`w-full rounded-xl px-4 py-2 text-sm font-medium transition ${
              inComparison 
                ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-600 border-2 border-gray-200'
            }`}
          >
            {inComparison ? (
              <>
                <Check className="inline h-4 w-4 mr-1" />
                Im Vergleich
              </>
            ) : (
              <>
                <Scale className="inline h-4 w-4 mr-1" />
                Zum Vergleich hinzufügen
              </>
            )}
          </button>
        </div>
      )}
    </button>
  );
}
