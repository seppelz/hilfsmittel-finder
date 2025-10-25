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
 * Extract key terms from a field label for semantic matching
 * @param {string} label - Field label
 * @returns {Array<string>} Key terms
 */
function extractKeyTerms(label) {
  if (!label) return [];
  
  const lower = label.toLowerCase();
  const terms = [];
  
  // Extract meaningful terms (ignore common words)
  const stopWords = ['der', 'die', 'das', 'mit', 'für', 'bei', 'und', 'oder', 'von', 'zur', 'zum', 'den', 'dem'];
  const words = lower.split(/[\s,/()]+/).filter(w => w.length > 2 && !stopWords.includes(w));
  
  // Add multi-word combinations for better matching
  // Hearing aids specific
  if (lower.includes('anzahl') && lower.includes('kanäl')) terms.push('kanäle');
  if (lower.includes('verstärk') || lower.includes('amplif')) terms.push('verstärkung');
  if (lower.includes('ospl')) terms.push('ospl90');
  if (lower.includes('signal') && lower.includes('verarbeit')) terms.push('signalverarbeitung');
  if (lower.includes('agc') || lower.includes('regelsystem')) terms.push('agc_regelsystem');
  if (lower.includes('programm') && (lower.includes('möglich') || lower.includes('manuell') || lower.includes('hör'))) terms.push('programme');
  if (lower.includes('störschall') || lower.includes('störgeräusch') || lower.includes('noise')) terms.push('störschallunterdrückung');
  if (lower.includes('rückkoppl')) terms.push('rückkopplung');
  if (lower.includes('batterie') || lower.includes('energiequelle')) terms.push('batterie');
  if (lower.includes('telefon') && lower.includes('spule')) terms.push('telefonspule');
  if (lower.includes('audio') && lower.includes('eingang')) terms.push('audioeingang');
  if (lower.includes('mikrofon') && !lower.includes('system')) terms.push('mikrofone');
  if (lower.includes('ausgangs') && (lower.includes('druck') || lower.includes('schall'))) terms.push('ausgangsdruck');
  if (lower.includes('schallaufnahm') || (lower.includes('richt') && lower.includes('charakteristik'))) terms.push('richtcharakteristik');
  if (lower.includes('bauform')) terms.push('bauform');
  if (lower.includes('bauart') && lower.includes('nr')) terms.push('bauartnr');
  if (lower.includes('baugleich') || lower.includes('identisch')) terms.push('baugleich');
  if (lower.includes('klangblend')) terms.push('klangblenden');
  if (lower.includes('fernbedien')) terms.push('fernbedienung');
  if (lower.includes('wireless') || lower.includes('funk')) terms.push('wireless');
  if (lower.includes('datalogg')) terms.push('datalogging');
  if (lower.includes('frequenz') && lower.includes('modifi')) terms.push('frequenzmodifikation');
  if (lower.includes('einstellbar') && lower.includes('parameter')) terms.push('parameter');
  if (lower.includes('tinnitus')) terms.push('tinnitus');
  
  // Mobility aids specific
  if (lower.includes('belastbar') || lower.includes('benutzergewicht')) terms.push('max_belastbarkeit');
  if (lower.includes('eigengewicht') && !lower.includes('max')) terms.push('eigengewicht');
  if (lower.includes('körpergröße')) terms.push('körpergröße');
  if (lower.includes('sitzhöhe')) terms.push('sitzhöhe');
  if (lower.includes('sitzbreite')) terms.push('sitzbreite');
  if (lower.includes('gesamtbreite')) terms.push('gesamtbreite');
  if (lower.includes('gesamtlänge')) terms.push('gesamtlänge');
  if (lower.includes('gesamthöhe')) terms.push('gesamthöhe');
  if (lower.includes('faltmaß')) terms.push('faltmasse');
  if (lower.includes('wendekreis')) terms.push('wendekreis');
  if (lower.includes('bereifung') || (lower.includes('rad') && lower.includes('größe'))) terms.push('bereifung');
  if (lower.includes('korb') && lower.includes('zuladung')) terms.push('korb_zuladung');
  
  // Add individual meaningful words
  words.forEach(word => {
    if (word.length > 4 && !terms.includes(word)) {
      terms.push(word);
    }
  });
  
  return terms;
}

/**
 * Check if two field labels are semantically similar
 * @param {string} label1 - First label
 * @param {string} label2 - Second label
 * @returns {boolean} True if labels refer to the same concept
 */
function areFieldsSimilar(label1, label2) {
  if (label1 === label2) return true;
  
  const terms1 = extractKeyTerms(label1);
  const terms2 = extractKeyTerms(label2);
  
  // Check for significant overlap (at least 2 terms or 1 highly specific term)
  const commonTerms = terms1.filter(t => terms2.includes(t));
  
  if (commonTerms.length >= 2) return true;
  
  // Check for highly specific terms that indicate same field
  const specificTerms = [
    'kanäle', 'ospl90', 'agc_regelsystem', 'signalverarbeitung', 'batterie',
    'bauartnr', 'baugleich', 'datalogging', 'frequenzmodifikation',
    'störschallunterdrückung', 'rückkopplung', 'richtcharakteristik',
    'wendekreis', 'faltmasse', 'körpergröße', 'korb_zuladung'
  ];
  if (commonTerms.some(t => specificTerms.includes(t))) return true;
  
  return false;
}

/**
 * Choose the better label from two similar fields (prefer shorter, cleaner ones)
 * @param {string} label1 - First label
 * @param {string} label2 - Second label
 * @returns {string} Preferred label
 */
function chooseBetterLabel(label1, label2) {
  // Prefer labels without parentheses (they're usually cleaner)
  const hasParens1 = label1.includes('(');
  const hasParens2 = label2.includes('(');
  
  if (hasParens1 && !hasParens2) return label2;
  if (hasParens2 && !hasParens1) return label1;
  
  // Prefer labels without qualifiers like "unabhängiger", "jeweils", etc.
  const hasQualifier1 = /unabhängig|jeweils|einzeln|separat|individuell/i.test(label1);
  const hasQualifier2 = /unabhängig|jeweils|einzeln|separat|individuell/i.test(label2);
  
  if (hasQualifier1 && !hasQualifier2) return label2;
  if (hasQualifier2 && !hasQualifier1) return label1;
  
  // Prefer much shorter labels (significant difference)
  if (label1.length < label2.length * 0.6) return label1;
  if (label2.length < label1.length * 0.6) return label2;
  
  // Prefer labels with standard prefixes
  const standardPrefixes = ['Anzahl der ', 'Anzahl ', 'Typ ', 'Art der '];
  for (const prefix of standardPrefixes) {
    if (label1.startsWith(prefix) && !label2.startsWith(prefix)) return label1;
    if (label2.startsWith(prefix) && !label1.startsWith(prefix)) return label2;
  }
  
  // Prefer shorter overall
  if (label1.length < label2.length) return label1;
  if (label2.length < label1.length) return label2;
  
  // Default to first one
  return label1;
}

/**
 * Discover all available fields from products' konstruktionsmerkmale
 * @param {Array} products - Products to analyze
 * @param {string} category - Category for icon selection
 * @returns {Array} Array of field definitions
 */
export function discoverAllFields(products, category) {
  const allFields = new Map();
  const labelToKey = new Map(); // Track which labels map to which keys
  
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
      
      // Check if we already have a similar field
      let existingKey = null;
      let existingLabel = null;
      
      for (const [label, key] of labelToKey.entries()) {
        if (areFieldsSimilar(merkmal.label, label)) {
          existingKey = key;
          existingLabel = label;
          break;
        }
      }
      
      if (existingKey) {
        // Found similar field - merge them
        const betterLabel = chooseBetterLabel(merkmal.label, existingLabel);
        
        // Update the field with the better label if it changed
        if (betterLabel !== existingLabel) {
          const field = allFields.get(existingKey);
          field.label = betterLabel;
          field.icon = getIconForField(betterLabel, category);
          
          // Update tracking
          labelToKey.delete(existingLabel);
          labelToKey.set(betterLabel, existingKey);
          
          console.log(`[FieldExtractor] Merged similar fields: "${existingLabel}" + "${merkmal.label}" → "${betterLabel}"`);
        }
      } else {
        // New unique field
        const key = normalizeFieldKey(merkmal.label);
        allFields.set(key, {
          key: key,
          label: merkmal.label,
          icon: getIconForField(merkmal.label, category)
        });
        labelToKey.set(merkmal.label, key);
      }
    });
  });
  
  console.log(`[FieldExtractor] Discovered ${allFields.size} unique fields from ${products.length} products (after merging similar fields)`);
  
  return Array.from(allFields.values());
}

/**
 * Extract field value by direct label lookup (with fuzzy matching)
 * @param {Array} konstruktionsmerkmale - Array of {label, value} objects
 * @param {string} fieldLabel - Field label to look for
 * @returns {string|null} Extracted value or null
 */
export function extractFieldByLabel(konstruktionsmerkmale, fieldLabel) {
  if (!konstruktionsmerkmale || konstruktionsmerkmale.length === 0) return null;
  
  // Try exact match first
  let merkmal = konstruktionsmerkmale.find(m => m.label === fieldLabel);
  
  // If no exact match, try fuzzy matching
  if (!merkmal) {
    merkmal = konstruktionsmerkmale.find(m => areFieldsSimilar(m.label, fieldLabel));
  }
  
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

