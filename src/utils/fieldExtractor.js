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
 * Extract all fields for a product
 * @param {Object} product - Product with konstruktionsmerkmale
 * @param {Array} fieldDefinitions - Field definitions from comparisonFields.js
 * @param {string} category - Category name
 * @returns {Object} Map of fieldKey -> value
 */
export function extractAllFields(product, fieldDefinitions, category) {
  const konstruktionsmerkmale = product.konstruktionsmerkmale || product._preloadedDetails?.konstruktionsmerkmale || [];
  const extracted = {};
  
  console.log(`[FieldExtractor] Extracting ${fieldDefinitions.length} fields from product ${product.produktartNummer || product.zehnSteller || product.id}`);
  console.log(`[FieldExtractor] Available konstruktionsmerkmale:`, konstruktionsmerkmale.length);
  
  for (const field of fieldDefinitions) {
    const value = extractField(konstruktionsmerkmale, field.key, category);
    extracted[field.key] = value || 'Nicht angegeben';
  }
  
  console.log(`[FieldExtractor] Extracted:`, extracted);
  
  return extracted;
}

