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
  onCategoryFilterChange,
  selectedCategoryFilter = null,
  onFeatureFilterChange,
  selectedFeatureFilters = [],
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

  // Extract available features from products for Hörgeräte with counts
  const availableFeatures = useMemo(() => {
    // Only show feature filters for hearing aids
    const isHearingAids = userAnswers?._selectedCategory === 'hearing' || 
                         categories.some(c => c.code.startsWith('13'));
    
    if (!isHearingAids) return { power: [], charging: [], type: [], connectivity: [] };
    
    // Count products for each feature (before any filtering)
    const featureCounts = {};
    
    // We need to count from ALL products, not just current page
    // So we'll use totalResults as a proxy - if we have filters active, show filtered count
    const allProductsForCounting = products; // This will be all products after smart filtering
    
    allProductsForCounting.forEach(product => {
      const name = (product.bezeichnung || product.name || '').toUpperCase();
      
      // Power levels
      if (name.includes(' M ') || name.includes('(M)') || name.includes(' M-')) {
        featureCounts['M'] = (featureCounts['M'] || 0) + 1;
      }
      if (name.includes(' HP') || name.includes('(HP')) {
        featureCounts['HP'] = (featureCounts['HP'] || 0) + 1;
      }
      if (name.includes(' UP') || name.includes('(UP')) {
        featureCounts['UP'] = (featureCounts['UP'] || 0) + 1;
      }
      if (name.includes(' SP') || name.includes('(SP')) {
        featureCounts['SP'] = (featureCounts['SP'] || 0) + 1;
      }
      
      // Rechargeable
      if (name.includes(' R ') || name.includes(' R-') || name.includes('-R ') || 
          name.includes('LITHIUM') || name.includes('AKKU') || name.includes('WIEDERAUFLADBAR')) {
        featureCounts['R'] = (featureCounts['R'] || 0) + 1;
      }
      
      // Device types
      if (name.includes('IIC')) {
        featureCounts['IIC'] = (featureCounts['IIC'] || 0) + 1;
      }
      if (name.includes('CIC') && !name.includes('IIC')) {
        featureCounts['CIC'] = (featureCounts['CIC'] || 0) + 1;
      }
      if (name.includes('ITC')) {
        featureCounts['ITC'] = (featureCounts['ITC'] || 0) + 1;
      }
      if (name.includes('RITE') || name.includes('RIC')) {
        featureCounts['RIC'] = (featureCounts['RIC'] || 0) + 1;
      }
      if (name.includes('BTE') || name.includes('HDO') || name.includes('HdO')) {
        featureCounts['BTE'] = (featureCounts['BTE'] || 0) + 1;
      }
      
      // Connectivity
      if (name.includes('BLUETOOTH') || name.includes('DIRECT') || name.includes('CONNECT')) {
        featureCounts['BLUETOOTH'] = (featureCounts['BLUETOOTH'] || 0) + 1;
      }
      if (name.includes(' T ') || name.includes('-T ') || name.includes('(T)') || name.includes('TELECOIL')) {
        featureCounts['T'] = (featureCounts['T'] || 0) + 1;
      }
      if (name.includes(' AI ') || name.includes('-AI ') || name.includes('(AI)')) {
        featureCounts['AI'] = (featureCounts['AI'] || 0) + 1;
      }
    });
    
    // Group features by category
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
  }, [products, userAnswers, categories, totalResults]);

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
        
        // Hearing criteria
        if (userAnswers.severity === 'moderate') displayedCriteria.push('Mittlerer Hörverlust');
        if (userAnswers.severity === 'severe') displayedCriteria.push('Starker Hörverlust');
        if (userAnswers.severity === 'profound') displayedCriteria.push('Sehr starker Hörverlust');
        if (userAnswers.hearing_aid) displayedCriteria.push('Hörgerät benötigt');
        if (userAnswers.device_type) displayedCriteria.push(`Bauform: ${userAnswers.device_type === 'ido' ? 'Im Ohr' : userAnswers.device_type === 'hdo' ? 'Hinter dem Ohr' : userAnswers.device_type}`);
        if (userAnswers.rechargeable) displayedCriteria.push('Wiederaufladbar bevorzugt');
        if (userAnswers.bluetooth) displayedCriteria.push('Bluetooth gewünscht');
        if (userAnswers.noise_reduction) displayedCriteria.push('Geräuschunterdrückung wichtig');
        if (userAnswers.phone_compatible) displayedCriteria.push('Telefonieren wichtig');
        if (userAnswers.tv_compatible) displayedCriteria.push('Fernsehen wichtig');
        
        // Mobility criteria
        if (userAnswers.walker_needed) displayedCriteria.push('Gehhilfe benötigt');
        if (userAnswers.mobility_support_type === 'rollator') displayedCriteria.push('Rollator bevorzugt');
        if (userAnswers.mobility_support_type === 'walker') displayedCriteria.push('Gehstock bevorzugt');
        if (userAnswers.stairs) displayedCriteria.push('Treppen im Alltag');
        if (userAnswers.indoor) displayedCriteria.push('Für drinnen');
        if (userAnswers.outdoor) displayedCriteria.push('Für draußen');
        
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
            {/* Map questionnaire answers to readable criteria */}
            {userAnswers.severity === 'moderate' && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Mittlerer Hörverlust
              </span>
            )}
            {userAnswers.severity === 'severe' && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Starker Hörverlust
              </span>
            )}
            {userAnswers.severity === 'profound' && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Sehr starker Hörverlust
              </span>
            )}
            {userAnswers.hearing_aid && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Hörgerät benötigt
              </span>
            )}
            {userAnswers.device_type && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Bauform: {userAnswers.device_type === 'ido' ? 'Im Ohr' : userAnswers.device_type === 'hdo' ? 'Hinter dem Ohr' : userAnswers.device_type}
              </span>
            )}
            {userAnswers.rechargeable && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Wiederaufladbar bevorzugt
              </span>
            )}
            {userAnswers.bluetooth && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Bluetooth gewünscht
              </span>
            )}
            {userAnswers.noise_reduction && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Geräuschunterdrückung wichtig
              </span>
            )}
            {userAnswers.phone_compatible && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Telefonieren wichtig
              </span>
            )}
            {userAnswers.tv_compatible && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Fernsehen wichtig
              </span>
            )}
            {/* Mobility criteria */}
            {userAnswers.walker_needed && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Gehhilfe benötigt
              </span>
            )}
            {userAnswers.mobility_support_type === 'rollator' && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Rollator bevorzugt
              </span>
            )}
            {userAnswers.mobility_support_type === 'walker' && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Gehstock bevorzugt
              </span>
            )}
            {userAnswers.stairs && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Treppen im Alltag
              </span>
            )}
            {userAnswers.indoor && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Für drinnen
              </span>
            )}
            {userAnswers.outdoor && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Für draußen
              </span>
            )}
            {/* Bathroom criteria */}
            {userAnswers.shower_chair && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Duschhocker benötigt
              </span>
            )}
            {userAnswers.bath_lift && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Badewannenlift benötigt
              </span>
            )}
            {userAnswers.toilet_seat && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Toilettensitzerhöhung benötigt
              </span>
            )}
            {userAnswers.grab_bars && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Haltegriffe benötigt
              </span>
            )}
            {/* Vision criteria */}
            {userAnswers.magnifier && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Lupe benötigt
              </span>
            )}
            {userAnswers.lighting && (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-800 border border-blue-200">
                ✓ Mit Beleuchtung
              </span>
            )}
            </div>
            <p className="mt-3 text-xs text-blue-700">
              💡 Diese Kriterien wurden bereits bei der Suche berücksichtigt. Nutzen Sie die Filter unten für weitere Verfeinerung.
            </p>
          </div>
        );
      })()}

      {/* Feature Filter for Hearing Aids */}
      {(availableFeatures.power.length > 0 || availableFeatures.charging.length > 0 || 
        availableFeatures.type.length > 0 || availableFeatures.connectivity.length > 0) && (
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
            {availableFeatures.power.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Leistungsstufe</h4>
                <div className="flex flex-wrap gap-2">
                  {availableFeatures.power.map(({ key, count }) => {
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
            {availableFeatures.charging.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Stromversorgung</h4>
                <div className="flex flex-wrap gap-2">
                  {availableFeatures.charging.map(({ key, count }) => {
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
            {availableFeatures.type.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Bauform</h4>
                <div className="flex flex-wrap gap-2">
                  {availableFeatures.type.map(({ key, count }) => {
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
            {availableFeatures.connectivity.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Konnektivität</h4>
                <div className="flex flex-wrap gap-2">
                  {availableFeatures.connectivity.map(({ key, count }) => {
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
