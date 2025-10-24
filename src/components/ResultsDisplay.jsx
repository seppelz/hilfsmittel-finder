import { useEffect, useState, useMemo } from 'react';
import { Filter, Scale } from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { ProductList } from './ProductList';
import { getCategoryContext } from '../data/productContexts';
import { ProductComparison } from './ProductComparison';

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
  featureCounts = {},
  comparisonProducts = [],
  onAddToComparison,
  onRemoveFromComparison,
  onShowComparison,
  showComparison = false,
  onCloseComparison,
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

  // Extract available features from products for Hörgeräte and Gehhilfen with counts
  const availableFeatures = useMemo(() => {
    const isHearingAids = userAnswers?._selectedCategory === 'hearing' || 
                         categories.some(c => c.code.startsWith('13'));
    const isGehhilfen = userAnswers?._selectedCategory === 'mobility' ||
                       categories.some(c => c.code.startsWith('10'));
    
    // Gehhilfen feature structure
    if (isGehhilfen) {
      return {
        deviceType: [
          { key: 'GEHSTOCK', count: featureCounts['GEHSTOCK'] || 0 },
          { key: 'ROLLATOR', count: featureCounts['ROLLATOR'] || 0 },
          { key: 'GEHWAGEN', count: featureCounts['GEHWAGEN'] || 0 },
          { key: 'GEHSTUETZEN', count: featureCounts['GEHSTUETZEN'] || 0 },
        ].filter(f => f.count > 0),
        features: [
          { key: 'FALTBAR', count: featureCounts['FALTBAR'] || 0 },
          { key: 'HOEHENVERSTELLBAR', count: featureCounts['HOEHENVERSTELLBAR'] || 0 },
          { key: 'BREMSEN', count: featureCounts['BREMSEN'] || 0 },
          { key: 'SITZFLAECHE', count: featureCounts['SITZFLAECHE'] || 0 },
          { key: 'KORB', count: featureCounts['KORB'] || 0 },
        ].filter(f => f.count > 0),
        wheels: [
          { key: '4RAEDER', count: featureCounts['4RAEDER'] || 0 },
          { key: '3RAEDER', count: featureCounts['3RAEDER'] || 0 },
        ].filter(f => f.count > 0),
      };
    }
    
    // Hörgeräte feature structure
    if (isHearingAids) {
      return {
        power: [
          { key: 'M', count: featureCounts['M'] || 0 },
          { key: 'HP', count: featureCounts['HP'] || 0 },
          { key: 'UP', count: featureCounts['UP'] || 0 },
          { key: 'SP', count: featureCounts['SP'] || 0 },
        ].filter(f => f.count > 0),
        charging: [
          { key: 'R', count: featureCounts['R'] || 0 },
        ].filter(f => f.count > 0),
        type: [
          { key: 'IIC', count: featureCounts['IIC'] || 0 },
          { key: 'CIC', count: featureCounts['CIC'] || 0 },
          { key: 'ITC', count: featureCounts['ITC'] || 0 },
          { key: 'RIC', count: featureCounts['RIC'] || 0 },
          { key: 'BTE', count: featureCounts['BTE'] || 0 },
        ].filter(f => f.count > 0),
        connectivity: [
          { key: 'BLUETOOTH', count: featureCounts['BLUETOOTH'] || 0 },
          { key: 'T', count: featureCounts['T'] || 0 },
          { key: 'AI', count: featureCounts['AI'] || 0 },
        ].filter(f => f.count > 0),
      };
    }
    
    // Always return defined arrays to prevent undefined errors
    return { deviceType: [], features: [], wheels: [], power: [], charging: [], type: [], connectivity: [] };
  }, [featureCounts, userAnswers, categories]);

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
    <section className={`mx-auto max-w-5xl space-y-10 px-4 ${comparisonProducts && comparisonProducts.length > 0 ? 'py-10 pb-48' : 'py-10'}`}>
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
      
      {/* Category Filter - Always show if we have categories OR if a filter is active */}
      {categories && (categories.length > 1 || selectedCategoryFilter) && (
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

      {/* Questionnaire Criteria Summary */}
      {userAnswers && Object.keys(userAnswers).length > 1 && (() => {
        // Debug: Log what's in userAnswers
        console.log('[ResultsDisplay] userAnswers:', userAnswers);
        
        // Collect all displayed criteria
        const displayedCriteria = [];
        
        // Hearing criteria (use actual field names from questionnaire)
        if (userAnswers.hearing_level === 'mild') displayedCriteria.push('Leichter Hörverlust');
        if (userAnswers.hearing_level === 'moderate') displayedCriteria.push('Mittlerer Hörverlust');
        if (userAnswers.hearing_level === 'severe') displayedCriteria.push('Starker Hörverlust');
        if (userAnswers.hearing_level === 'profound') displayedCriteria.push('Sehr starker Hörverlust');
        
        // Device type
        if (userAnswers.hearing_device_type) {
          const deviceTypeLabels = {
            'ite': 'Im Ohr (ITE)',
            'ido': 'Im Ohr',
            'hdo': 'Hinter dem Ohr',
            'bte': 'Hinter dem Ohr (BTE)',
            'ric': 'Receiver-in-Canal (RIC)',
            'any': 'Keine Präferenz'
          };
          displayedCriteria.push(`Bauform: ${deviceTypeLabels[userAnswers.hearing_device_type] || userAnswers.hearing_device_type}`);
        }
        
        // Features (stored as array)
        if (Array.isArray(userAnswers.hearing_features)) {
          userAnswers.hearing_features.forEach(feature => {
            const featureLabels = {
              'rechargeable': 'Wiederaufladbar bevorzugt',
              'bluetooth': 'Bluetooth gewünscht',
              'automatic': 'Automatische Anpassung',
              'discreet': 'Unauffällig gewünscht'
            };
            if (featureLabels[feature]) displayedCriteria.push(featureLabels[feature]);
          });
        }
        
        // Situations (stored as array)
        if (Array.isArray(userAnswers.hearing_situations)) {
          userAnswers.hearing_situations.forEach(situation => {
            const situationLabels = {
              'noise': 'Geräuschunterdrückung wichtig',
              'phone': 'Telefonieren wichtig',
              'tv': 'Fernsehen wichtig',
              'conversation': 'Gespräche wichtig',
              'music': 'Musik wichtig'
            };
            if (situationLabels[situation]) displayedCriteria.push(situationLabels[situation]);
          });
        }
        
        // Mobility criteria (Gehhilfen)
        if (userAnswers.mobility_level) {
          const mobilityLabels = {
            'needs_light_support': 'Leichte Gehunterstützung',
            'needs_moderate_support': 'Mittlere Gehunterstützung',
            'needs_strong_support': 'Starke Gehunterstützung',
          };
          if (mobilityLabels[userAnswers.mobility_level]) {
            displayedCriteria.push(mobilityLabels[userAnswers.mobility_level]);
          }
        }
        
        if (userAnswers.mobility_device_type) {
          const deviceLabels = {
            'gehstock': 'Gehstock',
            'rollator': 'Rollator',
            'gehwagen': 'Gehwagen',
            'unterarmgehstuetzen': 'Unterarmgehstützen',
            'gehgestell': 'Gehgestell/Gehbock',
            'any': 'Beliebiger Typ'
          };
          if (deviceLabels[userAnswers.mobility_device_type]) {
            displayedCriteria.push(`Gerätetyp: ${deviceLabels[userAnswers.mobility_device_type]}`);
          }
        }
        
        // Mobility features (stored as array)
        if (Array.isArray(userAnswers.mobility_features)) {
          userAnswers.mobility_features.forEach(feature => {
            const featureLabels = {
              'foldable': 'Faltbar bevorzugt',
              'adjustable': 'Höhenverstellbar',
              'brakes': 'Mit Bremsen',
              'seat': 'Mit Sitzfläche',
              'basket': 'Mit Korb',
            };
            if (featureLabels[feature]) displayedCriteria.push(featureLabels[feature]);
          });
        }
        
        // Mobility usage (stored as array)
        if (Array.isArray(userAnswers.mobility_usage)) {
          userAnswers.mobility_usage.forEach(usage => {
            const usageLabels = {
              'indoor': 'Für drinnen',
              'outdoor': 'Für draußen',
              'terrain': 'Für unebenes Gelände',
              'longdistance': 'Für längere Strecken',
            };
            if (usageLabels[usage]) displayedCriteria.push(usageLabels[usage]);
          });
        }
        
        // Bathroom criteria
        if (userAnswers.shower_chair) displayedCriteria.push('Duschhocker benötigt');
        if (userAnswers.bath_lift) displayedCriteria.push('Badewannenlift benötigt');
        if (userAnswers.toilet_seat) displayedCriteria.push('Toilettensitzerhöhung benötigt');
        if (userAnswers.grab_bars) displayedCriteria.push('Haltegriffe benötigt');
        
        // Vision criteria
        if (userAnswers.magnifier) displayedCriteria.push('Lupe benötigt');
        if (userAnswers.lighting) displayedCriteria.push('Mit Beleuchtung');
        
        console.log('[ResultsDisplay] Displayed criteria:', displayedCriteria);
        
        // Only show section if we have criteria to display
        if (displayedCriteria.length === 0) return null;
        
        return (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="font-semibold text-gray-900">Ihre Angaben aus dem Fragebogen:</span>
            </div>
            <div className="flex flex-wrap gap-2">
            {/* Render all collected criteria as badges */}
            {displayedCriteria.map((criterion, index) => (
              <span key={index} className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ {criterion}
              </span>
            ))}
            </div>
            <p className="mt-3 text-xs text-blue-700">
              💡 Diese Kriterien wurden bereits bei der Suche berücksichtigt. Nutzen Sie die Filter unten für weitere Verfeinerung.
            </p>
          </div>
        );
      })()}

      {/* Feature Filter for Hearing Aids */}
      {(availableFeatures.power?.length > 0 || availableFeatures.charging?.length > 0 || 
        availableFeatures.type?.length > 0 || availableFeatures.connectivity?.length > 0) && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Nach Eigenschaften filtern:</span>
            </div>
            {selectedFeatureFilters.length > 0 && (
              <button
                onClick={() => onFeatureFilterChange?.([])}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium underline"
              >
                Alle Filter zurücksetzen
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Power Level */}
            {availableFeatures.power?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Leistungsstufe</h4>
                <div className="flex flex-wrap gap-2">
                  {(availableFeatures.power || []).map(({ key, count }) => {
                    const featureInfo = {
                      'M': { label: 'M', tooltip: 'Mittlere Leistung - für leichten bis mittleren Hörverlust' },
                      'HP': { label: 'HP', tooltip: 'High Power - für starken Hörverlust' },
                      'UP': { label: 'UP', tooltip: 'Ultra Power - für sehr starken Hörverlust' },
                      'SP': { label: 'SP', tooltip: 'Super Power - für extrem starken Hörverlust' },
                    };
                    const info = featureInfo[key];
                    const isSelected = selectedFeatureFilters.includes(key);
                    
                    return (
                      <button
                        key={key}
                        onClick={() => handleFeatureToggle(key)}
                        title={info?.tooltip}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-white text-gray-700 hover:bg-purple-100 border border-purple-200'
                        }`}
                      >
                        {info?.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Charging */}
            {availableFeatures.charging?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Stromversorgung</h4>
                <div className="flex flex-wrap gap-2">
                  {(availableFeatures.charging || []).map(({ key, count }) => {
                    const featureInfo = {
                      'R': { label: '🔋 Wiederaufladbar', tooltip: 'Kein Batteriewechsel nötig - einfach aufladen wie ein Handy' },
                    };
                    const info = featureInfo[key];
                    const isSelected = selectedFeatureFilters.includes(key);
                    
                    return (
                      <button
                        key={key}
                        onClick={() => handleFeatureToggle(key)}
                        title={info?.tooltip}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-white text-gray-700 hover:bg-purple-100 border border-purple-200'
                        }`}
                      >
                        {info?.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Device Type */}
            {availableFeatures.type?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Bauform</h4>
                <div className="flex flex-wrap gap-2">
                  {(availableFeatures.type || []).map(({ key, count }) => {
                    const featureInfo = {
                      'IIC': { label: 'IIC', tooltip: 'Invisible-In-Canal - komplett unsichtbar im Gehörgang' },
                      'CIC': { label: 'CIC', tooltip: 'Completely-In-Canal - sehr diskret im Gehörgang' },
                      'ITC': { label: 'ITC', tooltip: 'In-The-Canal - diskret im Gehörgang' },
                      'RIC': { label: 'RIC', tooltip: 'Receiver-In-Canal - Lautsprecher im Gehörgang, sehr beliebt' },
                      'BTE': { label: 'BTE/HdO', tooltip: 'Behind-The-Ear / Hinter dem Ohr - robuste Bauform' },
                    };
                    const info = featureInfo[key];
                    const isSelected = selectedFeatureFilters.includes(key);
                    
                    return (
                      <button
                        key={key}
                        onClick={() => handleFeatureToggle(key)}
                        title={info?.tooltip}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-white text-gray-700 hover:bg-purple-100 border border-purple-200'
                        }`}
                      >
                        {info?.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Connectivity */}
            {availableFeatures.connectivity?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Konnektivität</h4>
                <div className="flex flex-wrap gap-2">
                  {(availableFeatures.connectivity || []).map(({ key, count }) => {
                    const featureInfo = {
                      'BLUETOOTH': { label: '📱 Bluetooth', tooltip: 'Verbindung mit Smartphone, Tablet und TV' },
                      'T': { label: '☎️ T-Spule', tooltip: 'Telefonspule - ideal für Telefonate und Induktionsschleifen' },
                      'AI': { label: '🤖 AI', tooltip: 'Künstliche Intelligenz - lernt Ihre Hörpräferenzen' },
                    };
                    const info = featureInfo[key];
                    const isSelected = selectedFeatureFilters.includes(key);
                    
                    return (
                      <button
                        key={key}
                        onClick={() => handleFeatureToggle(key)}
                        title={info?.tooltip}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-white text-gray-700 hover:bg-purple-100 border border-purple-200'
                        }`}
                      >
                        {info?.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {selectedFeatureFilters.length > 0 && (
            <div className="mt-4 pt-4 border-t border-purple-200 text-sm text-purple-700">
              <span className="font-medium">{products.length}</span> von <span className="font-medium">{totalResults}</span> Produkten entsprechen den Kriterien
            </div>
          )}
        </div>
      )}
      
      {/* Feature Filter for Gehhilfen */}
      {(availableFeatures.deviceType?.length > 0 || availableFeatures.features?.length > 0 || 
        availableFeatures.wheels?.length > 0) && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-gray-900">Nach Eigenschaften filtern:</span>
            </div>
            {selectedFeatureFilters.length > 0 && (
              <button
                onClick={() => onFeatureFilterChange?.([])}
                className="text-sm text-green-600 hover:text-green-800 font-medium underline"
              >
                Alle Filter zurücksetzen
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Device Type */}
            {availableFeatures.deviceType?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Gehhilfen-Typ</h4>
                <div className="flex flex-wrap gap-2">
                  {(availableFeatures.deviceType || []).map(({ key, count }) => {
                    const featureInfo = {
                      'GEHSTOCK': { label: '🦯 Gehstock', tooltip: 'Leichte Unterstützung beim Gehen' },
                      'ROLLATOR': { label: '🛒 Rollator', tooltip: 'Mit Rädern, Bremsen und oft Sitzfläche' },
                      'GEHWAGEN': { label: '🚶 Gehwagen', tooltip: 'Sehr stabil, mit Rädern' },
                      'GEHSTUETZEN': { label: '🦽 Unterarmgehstützen', tooltip: 'Stärkere Unterstützung' },
                    };
                    const info = featureInfo[key];
                    const isSelected = selectedFeatureFilters.includes(key);
                    
                    return (
                      <button
                        key={key}
                        onClick={() => handleFeatureToggle(key)}
                        title={info?.tooltip}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          isSelected
                            ? 'bg-green-600 text-white shadow'
                            : 'bg-white text-gray-700 hover:bg-green-100 border border-green-200'
                        }`}
                      >
                        {info?.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Features */}
            {availableFeatures.features?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Eigenschaften</h4>
                <div className="flex flex-wrap gap-2">
                  {(availableFeatures.features || []).map(({ key, count }) => {
                    const featureInfo = {
                      'FALTBAR': { label: '📦 Faltbar', tooltip: 'Platzsparend für Transport und Lagerung' },
                      'HOEHENVERSTELLBAR': { label: '↕️ Höhenverstellbar', tooltip: 'Anpassbar an Ihre Körpergröße' },
                      'BREMSEN': { label: '🛑 Mit Bremsen', tooltip: 'Sicher bremsen beim Gehen' },
                      'SITZFLAECHE': { label: '💺 Mit Sitzfläche', tooltip: 'Zum Ausruhen unterwegs' },
                      'KORB': { label: '🧺 Mit Korb', tooltip: 'Für Einkäufe oder persönliche Gegenstände' },
                    };
                    const info = featureInfo[key];
                    const isSelected = selectedFeatureFilters.includes(key);
                    
                    return (
                      <button
                        key={key}
                        onClick={() => handleFeatureToggle(key)}
                        title={info?.tooltip}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          isSelected
                            ? 'bg-green-600 text-white shadow'
                            : 'bg-white text-gray-700 hover:bg-green-100 border border-green-200'
                        }`}
                      >
                        {info?.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Wheels */}
            {availableFeatures.wheels?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Räder</h4>
                <div className="flex flex-wrap gap-2">
                  {(availableFeatures.wheels || []).map(({ key, count }) => {
                    const featureInfo = {
                      '4RAEDER': { label: '🛞 4 Räder', tooltip: 'Besonders stabil' },
                      '3RAEDER': { label: '🛞 3 Räder', tooltip: 'Wendiger und leichter' },
                    };
                    const info = featureInfo[key];
                    const isSelected = selectedFeatureFilters.includes(key);
                    
                    return (
                      <button
                        key={key}
                        onClick={() => handleFeatureToggle(key)}
                        title={info?.tooltip}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          isSelected
                            ? 'bg-green-600 text-white shadow'
                            : 'bg-white text-gray-700 hover:bg-green-100 border border-green-200'
                        }`}
                      >
                        {info?.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {selectedFeatureFilters.length > 0 && (
            <div className="mt-4 pt-4 border-t border-green-200 text-sm text-green-700">
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
          comparisonProducts={comparisonProducts}
          onAddToComparison={onAddToComparison}
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

      {/* Floating Comparison Indicator */}
      {comparisonProducts && comparisonProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-4xl w-full px-4">
          <div className="rounded-2xl border-2 border-purple-300 bg-purple-50 shadow-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-purple-900">
                  {comparisonProducts.length} {comparisonProducts.length === 1 ? 'Produkt' : 'Produkte'} zum Vergleich
                </span>
              </div>
              
              <button
                onClick={() => comparisonProducts.forEach(p => onRemoveFromComparison(p))}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Alle entfernen
              </button>
            </div>

            {/* Product Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {comparisonProducts.map((product) => {
                const code = product?.produktartNummer || product?.code || 'Unbekannt';
                const name = product?.bezeichnung || product?.name || 'Produkt';
                const manufacturer = product?.hersteller;
                
                return (
                  <div 
                    key={code}
                    className="relative bg-white rounded-xl p-3 border-2 border-purple-200 shadow-sm"
                  >
                    <button
                      onClick={() => onRemoveFromComparison(product)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition shadow-md"
                      title="Aus Vergleich entfernen"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    <div className="font-mono text-xs text-gray-500 mb-1">{code}</div>
                    <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                      {name}
                    </div>
                    {manufacturer && (
                      <div className="text-xs text-gray-600">
                        {manufacturer}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Placeholder for remaining slots */}
              {comparisonProducts.length < 3 && (
                <div className="bg-white/50 rounded-xl p-3 border-2 border-dashed border-purple-200 flex items-center justify-center text-sm text-gray-500">
                  <div className="text-center">
                    <Scale className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                    <div>Produkt hinzufügen</div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={onShowComparison}
                disabled={comparisonProducts.length < 2}
                className={`flex-1 rounded-xl px-6 py-3 font-semibold transition ${
                  comparisonProducts.length >= 2
                    ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {comparisonProducts.length < 2 ? (
                  <>Vergleichen (min. 2 Produkte)</>
                ) : (
                  <>
                    <Scale className="inline h-5 w-5 mr-2" />
                    Jetzt vergleichen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && comparisonProducts.length >= 2 && (
        <ProductComparison
          products={comparisonProducts}
          userContext={userAnswers}
          onClose={onCloseComparison}
        />
      )}
    </section>
  );
}
