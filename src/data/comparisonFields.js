/**
 * Subcategory-specific comparison field definitions
 * Based on analysis of konstruktionsmerkmale across Gehhilfen products
 */

// Comparison field definitions for each subcategory
export const COMPARISON_FIELDS = {
  mobility: {
    // Gehstock - walking sticks (no wheels, no brakes, no seat)
    Gehstock: [
      { key: 'max_weight', label: 'Max. Benutzergewicht', icon: '⚖️' },
      { key: 'handle_height', label: 'Handgriffhöhe', icon: '📐' },
      { key: 'weight', label: 'Gewicht', icon: '⚖️' },
      { key: 'tube_diameter', label: 'Rohrdurchmesser', icon: '⭕' },
      { key: 'material', label: 'Material', icon: '🔩' },
      { key: 'adjustment_levels', label: 'Höhenverstellung', icon: '↕️' },
      { key: 'foldable', label: 'Faltbar', icon: '📦' }
      // NO brakes, seats, wheels, basket for Gehstock
    ],
    
    // Unterarmgehstützen - forearm crutches
    Unterarmgehstuetzen: [
      { key: 'max_weight', label: 'Max. Benutzergewicht', icon: '⚖️' },
      { key: 'handle_height', label: 'Handgriffhöhe', icon: '📐' },
      { key: 'total_height', label: 'Gesamthöhe', icon: '📏' },
      { key: 'weight', label: 'Gewicht', icon: '⚖️' },
      { key: 'tube_diameter', label: 'Rohrdurchmesser', icon: '⭕' },
      { key: 'material', label: 'Material', icon: '🔩' },
      { key: 'adjustment_levels', label: 'Höhenverstellung', icon: '↕️' },
      { key: 'foldable', label: 'Faltbar', icon: '📦' }
    ],
    
    // Rollator - wheeled walker (has brakes, wheels, seat, basket)
    // Based on analysis of real product data (10.46.04.0002, 10.46.04.0003)
    Rollator: [
      { key: 'max_weight', label: 'Max. Belastbarkeit', icon: '⚖️' },
      { key: 'weight', label: 'Eigengewicht', icon: '⚖️' },
      { key: 'body_height', label: 'Empf. Körpergröße', icon: '📏' },
      { key: 'seat_width', label: 'Sitzbreite', icon: '↔️' },
      { key: 'seat_height', label: 'Sitzhöhe', icon: '💺' },
      { key: 'armrest_height', label: 'Höhe Unterarmauflage', icon: '📐' },
      { key: 'armrest_width', label: 'Breite zwischen Unterarmauflagen', icon: '↔️' },
      { key: 'total_width', label: 'Gesamtbreite', icon: '↔️' },
      { key: 'total_length', label: 'Gesamtlänge', icon: '📏' },
      { key: 'total_height', label: 'Gesamthöhe', icon: '📏' },
      { key: 'folded_dimensions', label: 'Faltmaße (BxLxH)', icon: '📦' },
      { key: 'turning_radius', label: 'Wendekreis', icon: '🔄' },
      { key: 'tires', label: 'Bereifung', icon: '🛞' },
      { key: 'basket_capacity', label: 'Max. Zuladung Korb', icon: '🧺' },
      { key: 'material', label: 'Material', icon: '🔩' },
      { key: 'wheels', label: 'Räder', icon: '🔘' },
      { key: 'brakes', label: 'Bremsen', icon: '🛑' },
      { key: 'foldable', label: 'Faltbar', icon: '📦' }
    ],
    
    // Gehgestell - walking frame (no wheels, very stable)
    Gehgestell: [
      { key: 'max_weight', label: 'Max. Benutzergewicht', icon: '⚖️' },
      { key: 'handle_height', label: 'Handgriffhöhe', icon: '📐' },
      { key: 'total_height', label: 'Gesamthöhe', icon: '📏' },
      { key: 'width', label: 'Breite', icon: '↔️' },
      { key: 'weight', label: 'Gewicht', icon: '⚖️' },
      { key: 'material', label: 'Material', icon: '🔩' },
      { key: 'adjustment_levels', label: 'Höhenverstellung', icon: '↕️' },
      { key: 'foldable', label: 'Faltbar', icon: '📦' }
    ],
    
    // Gehwagen - wheeled walker (similar to Rollator)
    Gehwagen: [
      { key: 'max_weight', label: 'Max. Benutzergewicht', icon: '⚖️' },
      { key: 'seat_height', label: 'Sitzhöhe', icon: '💺' },
      { key: 'handle_height', label: 'Handgriffhöhe', icon: '📐' },
      { key: 'total_height', label: 'Gesamthöhe', icon: '📏' },
      { key: 'width', label: 'Breite', icon: '↔️' },
      { key: 'weight', label: 'Gewicht', icon: '⚖️' },
      { key: 'wheels', label: 'Räder', icon: '🔘' },
      { key: 'brakes', label: 'Bremsen', icon: '🛑' },
      { key: 'foldable', label: 'Faltbar', icon: '📦' },
      { key: 'basket', label: 'Korb/Ablage', icon: '🧺' }
    ]
  },
  
  // Hearing aids - all use same fields for now
  hearing: {
    default: [
      { key: 'power_level', label: 'Leistungsstufe', icon: '🔊' },
      { key: 'device_type', label: 'Bauform', icon: '📱' },
      { key: 'battery_type', label: 'Batterie/Akku', icon: '🔋' },
      { key: 'bluetooth', label: 'Bluetooth', icon: '📱' },
      { key: 'telecoil', label: 'Telefonspule', icon: '📞' },
      { key: 'channels', label: 'Kanäle', icon: '🎚️' },
      { key: 'programs', label: 'Programme', icon: '⚙️' }
    ]
  },
  
  // Vision aids - placeholder for future expansion
  vision: {
    default: [
      { key: 'magnification', label: 'Vergrößerung', icon: '🔍' },
      { key: 'light', label: 'Beleuchtung', icon: '💡' },
      { key: 'size', label: 'Größe', icon: '📏' },
      { key: 'battery', label: 'Batteriebetrieb', icon: '🔋' }
    ]
  },
  
  // Bathroom aids - placeholder for future expansion
  bathroom: {
    default: [
      { key: 'max_weight', label: 'Max. Belastung', icon: '⚖️' },
      { key: 'dimensions', label: 'Maße (BxTxH)', icon: '📏' },
      { key: 'material', label: 'Material', icon: '🔩' },
      { key: 'non_slip', label: 'Rutschfest', icon: '🛡️' },
      { key: 'mounting', label: 'Montage', icon: '🔧' }
    ]
  }
};

/**
 * Helper to detect subcategory from product code
 * @param {string} productCode - Product code (zehnSteller)
 * @returns {string|null} Subcategory name
 */
export function detectSubcategory(productCode) {
  if (!productCode) return null;
  
  // Gehhilfen detection - using zehnSteller prefixes
  if (productCode.startsWith('10.50')) return 'Gehstock';
  if (productCode.startsWith('10.46.02')) return 'Unterarmgehstuetzen';
  if (productCode.startsWith('10.46.04') || productCode.startsWith('10.46.03')) return 'Rollator';
  if (productCode.startsWith('10.46.01')) return 'Gehgestell';
  if (productCode.startsWith('10.46.05') || productCode.startsWith('10.46.06')) return 'Gehwagen';
  
  // Hearing aids - all use same fields
  if (productCode.startsWith('13.20') || productCode.startsWith('07.99')) return 'default';
  
  // Vision aids
  if (productCode.startsWith('25.5')) return 'default';
  
  // Bathroom aids
  if (productCode.startsWith('04.4')) return 'default';
  
  return null;
}

/**
 * Get comparison fields for products being compared
 * @param {Array} products - Products to compare
 * @param {string} category - Category (mobility, hearing, vision, bathroom)
 * @returns {Array} Array of field definitions
 */
export function getComparisonFieldsForProducts(products, category) {
  const categoryFields = COMPARISON_FIELDS[category];
  if (!categoryFields) return [];
  
  // Detect subcategory from first product
  const firstProduct = products[0];
  const productCode = firstProduct?.produktartNummer || firstProduct?.zehnSteller || firstProduct?.code;
  const subcategory = detectSubcategory(productCode);
  
  console.log('[comparisonFields] Category:', category, '| Subcategory:', subcategory, '| Product code:', productCode);
  
  // Return fields for that subcategory, or default
  return categoryFields[subcategory] || categoryFields.default || [];
}

