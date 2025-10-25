/**
 * Direct field extraction from konstruktionsmerkmale
 * Extracts structured data directly from API fields before calling AI
 */

/**
 * Field extraction patterns for each category/subcategory
 * Maps comparison field keys to konstruktionsmerkmale label patterns
 */
const FIELD_PATTERNS = {
  mobility: {
    // Patterns that work for all mobility subcategories
    max_weight: ['Max. Belastbarkeit', 'Maximale Belastbarkeit', 'Max. Benutzergewicht'],
    weight: ['Eigengewicht', 'Gewicht'],
    body_height: ['Empf. Körpergröße', 'Körpergröße'],
    material: ['Material'],
    foldable: ['Faltbar', 'faltbar'], // Boolean - look for "ja" / "nein"
    
    // Rollator-specific
    seat_height: ['Sitzhöhe'],
    seat_width: ['Sitzbreite'],
    armrest_height: ['Höhe der Unterarmauflage', 'Verstellbare Höhe der Unterarmauflage'],
    armrest_width: ['Breite zwischen den Unterarmauflagen'],
    total_width: ['Gesamtbreite'],
    total_length: ['Gesamtlänge'],
    total_height: ['Gesamthöhe'],
    folded_dimensions: ['Faltmaße'],
    turning_radius: ['Wendekreis'],
    tires: ['Bereifung'],
    basket_capacity: ['Max. Zuladung Korb'],
    brakes: ['Bremsen', 'Bremse'], // Boolean or descriptive
    wheels: ['Räder', 'Anzahl Räder'],
    basket: ['Korb', 'Ablage'],
    
    // Gehstock/Unterarmgehstützen-specific
    handle_height: ['Handgriffhöhe', 'Griffhöhe'],
    tube_diameter: ['Rohrdurchmesser'],
    adjustment_levels: ['höhenverstellbar', 'Höhenverstellung', 'fach höhenverstellbar']
  },
  
  hearing: {
    // Direct mappings from konstruktionsmerkmale labels
    power_level: ['Verstärkung', 'OSPL90'],
    device_type: ['Bauform'],
    battery_type: ['Batterietyp', 'Batterie'],
    bluetooth: ['Bluetooth', 'Audioeingang'], // Check for "ja"
    telecoil: ['Telefonspule'], // Check for "ja"
    channels: ['Anzahl der Kanäle', 'Kanäle'],
    programs: ['Schaltung mehrerer Programme möglich', 'Programme'],
    microphones: ['Mikrofone'],
    signal_processing: ['Signalverarbeitung'],
    agc_systems: ['AGC-Regelsysteme']
  },
  
  vision: {
    magnification: ['Vergrößerung'],
    light: ['Beleuchtung'],
    size: ['Größe', 'Maße'],
    battery: ['Batterie', 'Stromversorgung']
  },
  
  bathroom: {
    max_weight: ['Max. Belastbarkeit', 'Maximale Belastung'],
    dimensions: ['Maße', 'Abmessungen'],
    material: ['Material'],
    non_slip: ['Rutschfest', 'rutschsicher'],
    mounting: ['Montage', 'Befestigung']
  }
};

/**
 * Extract field value from konstruktionsmerkmale
 * @param {Array} konstruktionsmerkmale - Array of {label, value} objects
 * @param {string} fieldKey - Field key (e.g., 'max_weight', 'channels')
 * @param {string} category - Category (mobility, hearing, etc.)
 * @returns {string|null} Extracted value or null
 */
export function extractField(konstruktionsmerkmale, fieldKey, category) {
  if (!konstruktionsmerkmale || konstruktionsmerkmale.length === 0) return null;
  
  const patterns = FIELD_PATTERNS[category];
  if (!patterns || !patterns[fieldKey]) return null;
  
  const labelPatterns = patterns[fieldKey];
  
  // Search for matching label
  for (const merkmal of konstruktionsmerkmale) {
    const label = merkmal.label?.toLowerCase() || '';
    const value = merkmal.value || '';
    
    // Check if any pattern matches this label
    for (const pattern of labelPatterns) {
      if (label.includes(pattern.toLowerCase())) {
        // Found a match - return cleaned value
        const cleaned = cleanValue(value, fieldKey);
        console.log(`[FieldExtractor] Matched "${pattern}" in label "${merkmal.label}" -> "${cleaned}"`);
        return cleaned;
      }
    }
  }
  
  return null;
}

/**
 * Clean and normalize extracted value
 * @param {string} value - Raw value from konstruktionsmerkmale
 * @param {string} fieldKey - Field key for context
 * @returns {string} Cleaned value
 */
function cleanValue(value, fieldKey) {
  if (!value) return 'Nicht angegeben';
  
  const trimmed = value.trim();
  
  // Handle boolean fields
  const booleanFields = ['foldable', 'bluetooth', 'telecoil', 'brakes', 'non_slip', 'basket'];
  if (booleanFields.includes(fieldKey)) {
    const lower = trimmed.toLowerCase();
    if (lower === 'ja' || lower === 'yes' || lower === 'vorhanden') return 'Ja';
    if (lower === 'nein' || lower === 'no' || lower === 'nicht vorhanden') return 'Nein';
    // If it's descriptive (not just ja/nein), return it as-is
    if (trimmed.length > 10) return trimmed;
  }
  
  // Handle "k.A." or empty
  if (trimmed === 'k.A.' || trimmed === '' || trimmed === '-') {
    return 'Nicht angegeben';
  }
  
  return trimmed;
}

/**
 * Normalize field label to consistent key format
 * @param {string} label - Field label from konstruktionsmerkmale
 * @returns {string} Normalized key
 */
export function normalizeFieldKey(label) {
  if (!label) return 'unknown';
  
  return label
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Get appropriate icon for a field based on its label
 * @param {string} label - Field label
 * @param {string} category - Category for context
 * @returns {string} Emoji icon
 */
export function getIconForField(label, category) {
  const lowerLabel = label.toLowerCase();
  
  // Weight/Load related
  if (lowerLabel.includes('belast') || lowerLabel.includes('gewicht') || lowerLabel.includes('zuladung')) {
    return '⚖️';
  }
  
  // Height/Length/Dimensions
  if (lowerLabel.includes('höhe') || lowerLabel.includes('länge') || lowerLabel.includes('maß') || 
      lowerLabel.includes('körpergröße') || lowerLabel.includes('abmessung')) {
    return '📏';
  }
  
  // Width
  if (lowerLabel.includes('breite')) {
    return '↔️';
  }
  
  // Material
  if (lowerLabel.includes('material')) {
    return '🔩';
  }
  
  // Wheels/Tires
  if (lowerLabel.includes('rad') || lowerLabel.includes('räder') || lowerLabel.includes('bereifung')) {
    return '🛞';
  }
  
  // Brakes
  if (lowerLabel.includes('brems')) {
    return '🛑';
  }
  
  // Seat related
  if (lowerLabel.includes('sitz')) {
    return '💺';
  }
  
  // Basket/Storage
  if (lowerLabel.includes('korb') || lowerLabel.includes('ablage') || lowerLabel.includes('tasche')) {
    return '🧺';
  }
  
  // Folding/Compact
  if (lowerLabel.includes('falt') || lowerLabel.includes('klapp')) {
    return '📦';
  }
  
  // Turning/Radius
  if (lowerLabel.includes('wende') || lowerLabel.includes('radius')) {
    return '🔄';
  }
  
  // Armrest
  if (lowerLabel.includes('unterarm') || lowerLabel.includes('armauflage')) {
    return '📐';
  }
  
  // Handle/Grip
  if (lowerLabel.includes('griff') || lowerLabel.includes('handgriff')) {
    return '✋';
  }
  
  // Diameter
  if (lowerLabel.includes('durchmesser')) {
    return '⭕';
  }
  
  // Adjustment/Levels
  if (lowerLabel.includes('verstell') || lowerLabel.includes('stufe')) {
    return '↕️';
  }
  
  // Hearing aids specific
  if (category === 'hearing') {
    if (lowerLabel.includes('kanal') || lowerLabel.includes('channel')) return '🎚️';
    if (lowerLabel.includes('programm')) return '⚙️';
    if (lowerLabel.includes('batterie') || lowerLabel.includes('akku')) return '🔋';
    if (lowerLabel.includes('bluetooth')) return '📱';
    if (lowerLabel.includes('telefon') || lowerLabel.includes('spule')) return '📞';
    if (lowerLabel.includes('verstärk') || lowerLabel.includes('leistung')) return '🔊';
    if (lowerLabel.includes('bauform')) return '📱';
    if (lowerLabel.includes('mikrofon')) return '🎤';
  }
  
  // Vision aids specific
  if (category === 'vision') {
    if (lowerLabel.includes('vergrößer') || lowerLabel.includes('lupe')) return '🔍';
    if (lowerLabel.includes('licht') || lowerLabel.includes('beleucht')) return '💡';
  }
  
  // Bathroom aids specific
  if (category === 'bathroom') {
    if (lowerLabel.includes('rutsch')) return '🛡️';
    if (lowerLabel.includes('montag') || lowerLabel.includes('befestig')) return '🔧';
  }
  
  // Default
  return '📋';
}

/**
 * Discover all available fields from products' konstruktionsmerkmale
 * @param {Array} products - Products to analyze
 * @param {string} category - Category for icon selection
 * @returns {Array} Array of field definitions
 */
export function discoverAllFields(products, category) {
  const allFields = new Map();
  
  products.forEach(product => {
    const km = product.konstruktionsmerkmale || product._preloadedDetails?.konstruktionsmerkmale || [];
    km.forEach(merkmal => {
      // Skip Freitext fields (all variations)
      if (!merkmal.label || 
          merkmal.label.toLowerCase().includes('freitext') || 
          merkmal.label.toLowerCase().includes('sonstige merkmale')) {
        return;
      }
      
      // Skip fields with empty values across all products (noise reduction)
      if (!merkmal.value || merkmal.value.trim() === '' || merkmal.value === '-' || merkmal.value === 'k.A.') {
        return;
      }
      
      if (!allFields.has(merkmal.label)) {
        allFields.set(merkmal.label, {
          key: normalizeFieldKey(merkmal.label),
          label: merkmal.label,
          icon: getIconForField(merkmal.label, category)
        });
      }
    });
  });
  
  console.log(`[FieldExtractor] Discovered ${allFields.size} unique fields from ${products.length} products`);
  
  return Array.from(allFields.values());
}

/**
 * Extract field value by direct label lookup
 * @param {Array} konstruktionsmerkmale - Array of {label, value} objects
 * @param {string} fieldLabel - Exact field label to look for
 * @returns {string|null} Extracted value or null
 */
export function extractFieldByLabel(konstruktionsmerkmale, fieldLabel) {
  if (!konstruktionsmerkmale || konstruktionsmerkmale.length === 0) return null;
  
  const merkmal = konstruktionsmerkmale.find(m => m.label === fieldLabel);
  if (merkmal && merkmal.value) {
    return cleanValue(merkmal.value, '');
  }
  
  return null;
}

/**
 * Extract all fields for a product
 * @param {Object} product - Product with konstruktionsmerkmale
 * @param {Array} fieldDefinitions - Field definitions from comparisonFields.js or dynamic discovery
 * @param {string} category - Category name
 * @returns {Object} Map of fieldKey -> value
 */
export function extractAllFields(product, fieldDefinitions, category) {
  const konstruktionsmerkmale = product.konstruktionsmerkmale || product._preloadedDetails?.konstruktionsmerkmale || [];
  const extracted = {};
  
  console.log(`[FieldExtractor] Extracting ${fieldDefinitions.length} fields from product ${product.produktartNummer || product.zehnSteller || product.id}`);
  console.log(`[FieldExtractor] Available konstruktionsmerkmale:`, konstruktionsmerkmale.length);
  
  for (const field of fieldDefinitions) {
    // Try pattern matching first (for static fields)
    let value = extractField(konstruktionsmerkmale, field.key, category);
    
    // If no match via pattern, try direct label lookup (for dynamic fields)
    if (!value && field.label) {
      value = extractFieldByLabel(konstruktionsmerkmale, field.label);
    }
    
    extracted[field.key] = value || 'Nicht angegeben';
  }
  
  console.log(`[FieldExtractor] Extracted:`, extracted);
  
  return extracted;
}

