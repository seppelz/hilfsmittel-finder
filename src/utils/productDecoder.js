// Product name decoder for medical devices
// Translates technical abbreviations into user-friendly German

export const HEARING_AID_TYPES = {
  'IIC': { full: 'Invisible-In-Canal', de: 'Unsichtbar im Gehörgang', icon: '👂', visibility: 'unsichtbar' },
  'CIC': { full: 'Completely-In-Canal', de: 'Komplett im Gehörgang', icon: '👂', visibility: 'sehr diskret' },
  'ITC': { full: 'In-The-Canal', de: 'Im Gehörgang', icon: '👂', visibility: 'diskret' },
  'ITE': { full: 'In-The-Ear', de: 'In der Ohrmuschel', icon: '👂', visibility: 'teilweise sichtbar' },
  'RIC': { full: 'Receiver-In-Canal', de: 'Lautsprecher im Gehörgang', icon: '🎧', visibility: 'dezent' },
  'RITE': { full: 'Receiver-In-The-Ear', de: 'Lautsprecher im Ohr', icon: '🎧', visibility: 'dezent' },
  'mRIC': { full: 'Micro Receiver-In-Canal', de: 'Mini-Lautsprecher im Gehörgang', icon: '🎧', visibility: 'sehr dezent' },
  'miniRITE': { full: 'Mini Receiver-In-The-Ear', de: 'Mini-Lautsprecher im Ohr', icon: '🎧', visibility: 'dezent' },
  'BTE': { full: 'Behind-The-Ear', de: 'Hinter dem Ohr', icon: '🎧', visibility: 'sichtbar' }
};

export const HEARING_AID_FEATURES = {
  'T': { name: 'Telefonspule', description: 'Für besseres Telefonieren', icon: '📞', key: 'T' },
  'R': { name: 'Wiederaufladbar', description: 'Kein Batteriewechsel nötig', icon: '🔋', key: 'R' },
  'Direct': { name: 'Bluetooth', description: 'Verbindung mit Smartphone', icon: '📱', key: 'Direct' },
  'Connect': { name: 'Bluetooth', description: 'Verbindung mit Smartphone', icon: '📱', key: 'Direct' },
  'Bluetooth': { name: 'Bluetooth', description: 'Verbindung mit Smartphone', icon: '📱', key: 'Direct' },
  'BT': { name: 'Bluetooth', description: 'Verbindung mit Smartphone', icon: '📱', key: 'Direct' },
  'AI': { name: 'Künstliche Intelligenz', description: 'Lernt Ihre Vorlieben', icon: '🤖', key: 'AI' },
  'HP': { name: 'Hohe Leistung', description: 'Für starken Hörverlust', icon: '🔊', key: 'HP' },
  'UP': { name: 'Ultra Power', description: 'Für sehr starken Hörverlust', icon: '🔊', key: 'UP' },
  'SP': { name: 'Sehr hohe Leistung', description: 'Für sehr starken Hörverlust', icon: '🔊', key: 'SP' },
  'M': { name: 'Mittlere Leistung', description: 'Für mittleren Hörverlust', icon: '🔉', key: 'M' }
};

export const MOBILITY_AID_TYPES = {
  'Gehstock': { de: 'Gehstock', icon: '🦯', features: ['Leicht', 'Höhenverstellbar'] },
  'Stock': { de: 'Gehstock', icon: '🦯', features: ['Leicht', 'Höhenverstellbar'] },
  'Rollator': { de: 'Rollator', icon: '🛒', features: ['Mit Rädern', 'Mit Bremsen', 'Mit Sitzfläche'] },
  'Gehwagen': { de: 'Gehwagen', icon: '🚶', features: ['Sehr stabil', 'Mit Rädern'] },
  'Walker': { de: 'Gehwagen', icon: '🚶', features: ['Sehr stabil', 'Mit Rädern'] },
  'Gehstütze': { de: 'Unterarmgehstütze', icon: '🦽', features: ['Starke Unterstützung'] },
  'Krücke': { de: 'Unterarmgehstütze', icon: '🦽', features: ['Starke Unterstützung'] },
  'Gehgestell': { de: 'Gehgestell', icon: '⬜', features: ['Sehr stabil', 'Ohne Räder'] },
  'Gehbock': { de: 'Gehbock', icon: '⬜', features: ['Sehr stabil', 'Ohne Räder'] },
  'Rollstuhl': { de: 'Rollstuhl', icon: '♿', features: ['Selbstfahrend', 'Faltbar'] }
};

export const MOBILITY_AID_FEATURES = {
  'faltbar': { name: 'Faltbar', description: 'Platzsparend zusammenklappbar', icon: '📦', key: 'faltbar' },
  'klappbar': { name: 'Faltbar', description: 'Platzsparend zusammenklappbar', icon: '📦', key: 'faltbar' },
  'höhenverstellbar': { name: 'Höhenverstellbar', description: 'An Körpergröße anpassbar', icon: '↕️', key: 'adjustable' },
  'verstellbar': { name: 'Höhenverstellbar', description: 'An Körpergröße anpassbar', icon: '↕️', key: 'adjustable' },
  'bremse': { name: 'Mit Bremsen', description: 'Sicheres Bremsen', icon: '🛑', key: 'brakes' },
  'sitz': { name: 'Mit Sitzfläche', description: 'Zum Ausruhen', icon: '💺', key: 'seat' },
  'sitzfläche': { name: 'Mit Sitzfläche', description: 'Zum Ausruhen', icon: '💺', key: 'seat' },
  'korb': { name: 'Mit Korb', description: 'Für Einkäufe', icon: '🧺', key: 'basket' },
  '4 räder': { name: '4 Räder', description: 'Besonders stabil', icon: '🛞', key: '4wheels' },
  '3 räder': { name: '3 Räder', description: 'Wendiger', icon: '🛞', key: '3wheels' }
};

// Extended features for technical specifications (konstruktionsmerkmale) detection
export const MOBILITY_FEATURES_EXTENDED = {
  // Height adjustment patterns
  'fach höhenverstellbar': { name: 'Höhenverstellbar', description: 'An Körpergröße anpassbar', icon: '↕️', key: 'adjustable' },
  'höhenverstellbar mittels': { name: 'Höhenverstellbar', description: 'An Körpergröße anpassbar', icon: '↕️', key: 'adjustable' },
  '8-fach': { name: 'Höhenverstellbar', description: 'An Körpergröße anpassbar', icon: '↕️', key: 'adjustable' },
  '10-fach': { name: 'Höhenverstellbar', description: 'An Körpergröße anpassbar', icon: '↕️', key: 'adjustable' },
  '11-fach': { name: 'Höhenverstellbar', description: 'An Körpergröße anpassbar', icon: '↕️', key: 'adjustable' },
  '12-fach': { name: 'Höhenverstellbar', description: 'An Körpergröße anpassbar', icon: '↕️', key: 'adjustable' },
  'druckknopf': { name: 'Höhenverstellbar', description: 'An Körpergröße anpassbar', icon: '↕️', key: 'adjustable' },
  'quetschverschraubung': { name: 'Höhenverstellbar', description: 'An Körpergröße anpassbar', icon: '↕️', key: 'adjustable' },
  
  // Foldable patterns
  'zusammenfaltbar': { name: 'Faltbar', description: 'Platzsparend zusammenklappbar', icon: '📦', key: 'faltbar' },
  'zusammenklappbar': { name: 'Faltbar', description: 'Platzsparend zusammenklappbar', icon: '📦', key: 'faltbar' },
  'zerlegbar': { name: 'Faltbar', description: 'Platzsparend zusammenklappbar', icon: '📦', key: 'faltbar' },
  
  // Brakes
  'handbremse': { name: 'Mit Bremsen', description: 'Sicheres Bremsen', icon: '🛑', key: 'brakes' },
  'feststellbremse': { name: 'Mit Bremsen', description: 'Sicheres Bremsen', icon: '🛑', key: 'brakes' },
  'bremssystem': { name: 'Mit Bremsen', description: 'Sicheres Bremsen', icon: '🛑', key: 'brakes' },
  
  // Seat
  'sitzfläche': { name: 'Mit Sitzfläche', description: 'Zum Ausruhen', icon: '💺', key: 'seat' },
  'mit sitz': { name: 'Mit Sitzfläche', description: 'Zum Ausruhen', icon: '💺', key: 'seat' },
  
  // Basket/Storage
  'ablagekorb': { name: 'Mit Korb', description: 'Für Einkäufe', icon: '🧺', key: 'basket' },
  'einkaufskorb': { name: 'Mit Korb', description: 'Für Einkäufe', icon: '🧺', key: 'basket' },
  'ablagetasche': { name: 'Mit Korb', description: 'Für Einkäufe', icon: '🧺', key: 'basket' },
  
  // Wheels
  '4 räder': { name: '4 Räder', description: 'Besonders stabil', icon: '🛞', key: '4wheels' },
  '3 räder': { name: '3 Räder', description: 'Wendiger', icon: '🛞', key: '3wheels' },
  '2 räder': { name: '2 Räder', description: 'Leicht', icon: '🛞', key: '2wheels' }
};

export const HEARING_FEATURES_EXTENDED = {
  // Rechargeable
  'wiederaufladbar': { name: 'Wiederaufladbar', description: 'Kein Batteriewechsel nötig', icon: '🔋', key: 'R' },
  'lithium': { name: 'Wiederaufladbar', description: 'Kein Batteriewechsel nötig', icon: '🔋', key: 'R' },
  'akku': { name: 'Wiederaufladbar', description: 'Kein Batteriewechsel nötig', icon: '🔋', key: 'R' },
  'li-ion': { name: 'Wiederaufladbar', description: 'Kein Batteriewechsel nötig', icon: '🔋', key: 'R' },
  
  // Bluetooth/Connectivity
  'bluetooth': { name: 'Bluetooth', description: 'Verbindung mit Smartphone', icon: '📱', key: 'Direct' },
  'wireless': { name: 'Bluetooth', description: 'Verbindung mit Smartphone', icon: '📱', key: 'Direct' },
  'konnektivität': { name: 'Bluetooth', description: 'Verbindung mit Smartphone', icon: '📱', key: 'Direct' },
  'smartphone': { name: 'Bluetooth', description: 'Verbindung mit Smartphone', icon: '📱', key: 'Direct' },
  
  // Telecoil
  'telefonspule': { name: 'Telefonspule', description: 'Für besseres Telefonieren', icon: '📞', key: 'T' },
  't-spule': { name: 'Telefonspule', description: 'Für besseres Telefonieren', icon: '📞', key: 'T' },
  
  // AI/Advanced features
  'künstliche intelligenz': { name: 'Künstliche Intelligenz', description: 'Lernt Ihre Vorlieben', icon: '🤖', key: 'AI' },
  'maschinelles lernen': { name: 'Künstliche Intelligenz', description: 'Lernt Ihre Vorlieben', icon: '🤖', key: 'AI' }
};

export const VISION_FEATURES_EXTENDED = {
  'vergrößerung': { name: 'Mit Vergrößerung', description: 'Vergrößert Text und Bilder', icon: '🔍', key: 'magnification' },
  'beleuchtung': { name: 'Mit Beleuchtung', description: 'Bessere Sicht', icon: '💡', key: 'light' },
  'led': { name: 'LED-Beleuchtung', description: 'Energiesparende Beleuchtung', icon: '💡', key: 'light' },
  'licht': { name: 'Mit Beleuchtung', description: 'Bessere Sicht', icon: '💡', key: 'light' },
  'elektronisch': { name: 'Elektronisch', description: 'Variable Einstellungen', icon: '⚡', key: 'electronic' },
  'digital': { name: 'Elektronisch', description: 'Variable Einstellungen', icon: '⚡', key: 'electronic' },
  'bildschirm': { name: 'Mit Bildschirm', description: 'Großer Bildschirm', icon: '📺', key: 'screen' },
  'monitor': { name: 'Mit Bildschirm', description: 'Großer Bildschirm', icon: '📺', key: 'screen' }
};

export const BATHROOM_FEATURES_EXTENDED = {
  'rutschfest': { name: 'Rutschfest', description: 'Erhöhte Sicherheit', icon: '🛡️', key: 'non-slip' },
  'anti-rutsch': { name: 'Rutschfest', description: 'Erhöhte Sicherheit', icon: '🛡️', key: 'non-slip' },
  'höhenverstellbar': { name: 'Höhenverstellbar', description: 'An Körpergröße anpassbar', icon: '↕️', key: 'adjustable' },
  'mit rückenlehne': { name: 'Mit Rückenlehne', description: 'Bequemer sitzen', icon: '💺', key: 'backrest' },
  'rückenlehne': { name: 'Mit Rückenlehne', description: 'Bequemer sitzen', icon: '💺', key: 'backrest' },
  'mit armlehne': { name: 'Mit Armlehnen', description: 'Erleichtert Aufstehen', icon: '🪑', key: 'armrests' },
  'armlehne': { name: 'Mit Armlehnen', description: 'Erleichtert Aufstehen', icon: '🪑', key: 'armrests' },
  'gepolstert': { name: 'Gepolstert', description: 'Erhöhter Komfort', icon: '🛋️', key: 'padded' },
  'wandmontage': { name: 'Wandmontage', description: 'Fest installiert', icon: '🔧', key: 'wall-mounted' }
};

export const BATHROOM_AID_TYPES = {
  'Duschhocker': { de: 'Sitz für die Dusche', icon: '🚿', features: ['Rutschfest', 'Höhenverstellbar'] },
  'Duschstuhl': { de: 'Stuhl für die Dusche', icon: '🚿', features: ['Mit Rückenlehne', 'Stabil'] },
  'Badewannenlift': { de: 'Hebt Sie in die Badewanne', icon: '🛁', features: ['Elektrisch', 'Sicher'] },
  'Wannenlifter': { de: 'Einstiegshilfe Badewanne', icon: '🛁', features: ['Erleichtert Ein-/Ausstieg'] },
  'Haltegriff': { de: 'Griff zum Festhalten', icon: '🔧', features: ['Wandmontage', 'Stabil'] },
  'Toilettensitzerhöhung': { de: 'Erhöht die Toilette', icon: '🚽', features: ['Erleichtert Aufstehen'] },
  'Toilettenaufsatz': { de: 'Aufsatz für Toilette', icon: '🚽', features: ['Mit/ohne Armlehnen'] }
};

export const VISION_AID_TYPES = {
  'Lupe': { de: 'Vergrößerungsglas', icon: '🔍', features: ['Tragbar', 'Mit Licht'] },
  'Handleupe': { de: 'Lupe mit Griff', icon: '🔍', features: ['Mobil', 'Einfach zu halten'] },
  'Standlupe': { de: 'Lupe zum Hinstellen', icon: '🔍', features: ['Freihändig', 'Stabil'] },
  'Lesegerät': { de: 'Elektronische Lesehilfe', icon: '📺', features: ['Bildschirm', 'Variable Vergrößerung'] },
  'Bildschirmlesegerät': { de: 'Liest Text auf Bildschirm vor', icon: '📺', features: ['Elektronisch', 'Hohe Vergrößerung'] },
  'Lupenbrille': { de: 'Brille mit Vergrößerung', icon: '👓', features: ['Freihändig', 'Dauerhaft tragbar'] }
};

export const INCONTINENCE_TYPES = {
  'Pants': { de: 'Inkontinenz-Unterhose', icon: '🩲', features: ['Wie normale Unterwäsche', 'Einfach anzuziehen'] },
  'Einlagen': { de: 'Saugeinlagen', icon: '🩹', features: ['Diskret', 'Verschiedene Stärken'] },
  'Vorlagen': { de: 'Saugvorlagen', icon: '🩹', features: ['Für starke Inkontinenz', 'Hohe Saugkraft'] },
  'Windeln': { de: 'Inkontinenz-Windeln', icon: '🩲', features: ['Für schwere Inkontinenz', 'Rundum-Schutz'] }
};

export const COMPRESSION_TYPES = {
  'Kompressionsstrumpf': { de: 'Stützstrumpf', icon: '🧦', features: ['Fördert Durchblutung', 'Verschiedene Klassen'] },
  'Kompressionsstrümpfe': { de: 'Stützstrümpfe', icon: '🧦', features: ['Gegen Venenleiden', 'Medizinisch wirksam'] }
};

export const BED_TYPES = {
  'Pflegebett': { de: 'Bett für Pflegebedürftige', icon: '🛏️', features: ['Höhenverstellbar', 'Elektrisch'] },
  'Krankenbett': { de: 'Medizinisches Bett', icon: '🛏️', features: ['Mit Aufrichtfunktion', 'Für Pflege'] }
};

export const MEASUREMENT_DEVICE_TYPES = {
  'Blutdruckmessgerät': { de: 'Misst Blutdruck', icon: '🩺', features: ['Digital', 'Einfache Bedienung'] },
  'Blutzuckermessgerät': { de: 'Misst Blutzucker', icon: '💉', features: ['Für Diabetiker', 'Schnell und präzise'] }
};

/**
 * Decode product name for hearing aids
 * @param {string} productName - Technical product name
 * @returns {object} Decoded information
 */
function decodeHearingAid(productName) {
  const upperName = productName.toUpperCase();
  
  // Find device type
  let deviceType = null;
  for (const [key, value] of Object.entries(HEARING_AID_TYPES)) {
    if (upperName.includes(key)) {
      deviceType = { key, ...value };
      break;
    }
  }
  
  // Find features with deduplication by key
  const features = [];
  const seenKeys = new Set();
  
  for (const [searchKey, value] of Object.entries(HEARING_AID_FEATURES)) {
    // Check for exact matches (avoid false positives)
    const regex = new RegExp(`\\b${searchKey}\\b|${searchKey}(?=-)|${searchKey}$`, 'i');
    if (regex.test(productName) && !seenKeys.has(value.key)) {
      features.push({ key: value.key, ...value });
      seenKeys.add(value.key);
    }
  }
  
  // Extract brand and model
  const brandModel = extractBrandModel(productName);
  
  return {
    deviceType,
    features,
    brandModel,
    category: 'Hörgerät'
  };
}

/**
 * Decode product name for mobility aids
 * @param {string} productName - Technical product name
 * @returns {object} Decoded information
 */
function decodeMobilityAid(productName) {
  const upperName = productName.toUpperCase();
  const lowerName = productName.toLowerCase();
  
  // Detect device type
  let deviceType = null;
  for (const [key, value] of Object.entries(MOBILITY_AID_TYPES)) {
    if (upperName.includes(key.toUpperCase())) {
      deviceType = { key, ...value };
      break;
    }
  }
  
  // Detect features with deduplication
  const features = [];
  const seenKeys = new Set();
  
  for (const [searchKey, value] of Object.entries(MOBILITY_AID_FEATURES)) {
    if (lowerName.includes(searchKey) && !seenKeys.has(value.key)) {
      features.push({ key: value.key, ...value });
      seenKeys.add(value.key);
    }
  }
  
  return {
    deviceType,
    features,
    brandModel: extractBrandModel(productName),
    category: 'Gehhilfe'
  };
}

/**
 * Decode product name for bathroom aids
 * @param {string} productName - Technical product name
 * @param {string} productCode - Product code
 * @returns {object} Decoded information
 */
function decodeBathroomAid(productName, productCode) {
  const upperName = productName.toUpperCase();
  const groupCode = productCode ? productCode.substring(0, 5) : '';
  
  let deviceType = null;
  let category = 'Badehilfe';
  
  // Detect from product name keywords
  for (const [key, value] of Object.entries(BATHROOM_AID_TYPES)) {
    if (upperName.includes(key.toUpperCase())) {
      deviceType = { key, ...value };
      break;
    }
  }
  
  // Specific category from code
  if (groupCode === '04.41') {
    category = 'Toilettensitzerhöhung';
    if (!deviceType) {
      deviceType = { key: 'Toilettensitzerhöhung', ...BATHROOM_AID_TYPES.Toilettensitzerhöhung };
    }
  }
  
  return {
    deviceType,
    features: deviceType?.features || [],
    brandModel: extractBrandModel(productName),
    category
  };
}

/**
 * Decode product name for vision aids
 * @param {string} productName - Technical product name
 * @returns {object} Decoded information
 */
function decodeVisionAid(productName) {
  const upperName = productName.toUpperCase();
  
  let deviceType = null;
  const category = 'Sehhilfe';
  
  // Detect from product name keywords
  for (const [key, value] of Object.entries(VISION_AID_TYPES)) {
    if (upperName.includes(key.toUpperCase())) {
      deviceType = { key, ...value };
      break;
    }
  }
  
  return {
    deviceType,
    features: deviceType?.features || [],
    brandModel: extractBrandModel(productName),
    category
  };
}

/**
 * Decode product name for incontinence products
 * @param {string} productName - Technical product name
 * @returns {object} Decoded information
 */
function decodeIncontinenceProduct(productName) {
  const upperName = productName.toUpperCase();
  
  let deviceType = null;
  const category = 'Inkontinenzartikel';
  
  // Detect from product name keywords
  for (const [key, value] of Object.entries(INCONTINENCE_TYPES)) {
    if (upperName.includes(key.toUpperCase())) {
      deviceType = { key, ...value };
      break;
    }
  }
  
  return {
    deviceType,
    features: deviceType?.features || [],
    brandModel: extractBrandModel(productName),
    category
  };
}

/**
 * Decode product name for compression therapy
 * @param {string} productName - Technical product name
 * @returns {object} Decoded information
 */
function decodeCompressionTherapy(productName) {
  const upperName = productName.toUpperCase();
  
  let deviceType = null;
  const category = 'Kompressionstherapie';
  
  // Detect from product name keywords
  for (const [key, value] of Object.entries(COMPRESSION_TYPES)) {
    if (upperName.includes(key.toUpperCase())) {
      deviceType = { key, ...value };
      break;
    }
  }
  
  return {
    deviceType,
    features: deviceType?.features || [],
    brandModel: extractBrandModel(productName),
    category
  };
}

/**
 * Decode product name for care beds
 * @param {string} productName - Technical product name
 * @returns {object} Decoded information
 */
function decodeCareBed(productName) {
  const upperName = productName.toUpperCase();
  
  let deviceType = null;
  const category = 'Pflegebett';
  
  // Detect from product name keywords
  for (const [key, value] of Object.entries(BED_TYPES)) {
    if (upperName.includes(key.toUpperCase())) {
      deviceType = { key, ...value };
      break;
    }
  }
  
  return {
    deviceType,
    features: deviceType?.features || [],
    brandModel: extractBrandModel(productName),
    category
  };
}

/**
 * Decode product name for measurement devices
 * @param {string} productName - Technical product name
 * @returns {object} Decoded information
 */
function decodeMeasurementDevice(productName) {
  const upperName = productName.toUpperCase();
  
  let deviceType = null;
  const category = 'Messgerät';
  
  // Detect from product name keywords
  for (const [key, value] of Object.entries(MEASUREMENT_DEVICE_TYPES)) {
    if (upperName.includes(key.toUpperCase())) {
      deviceType = { key, ...value };
      break;
    }
  }
  
  return {
    deviceType,
    features: deviceType?.features || [],
    brandModel: extractBrandModel(productName),
    category
  };
}

/**
 * Extract brand and model from product name
 * @param {string} productName - Full product name
 * @returns {object} Brand and model
 */
function extractBrandModel(productName) {
  // Common patterns: "Brand Model 123" or "Model-123"
  const parts = productName.split(/[\s-]/);
  
  if (parts.length >= 2) {
    return {
      brand: parts[0],
      model: parts.slice(1).join(' ').replace(/\s+/g, ' ')
    };
  }
  
  return {
    brand: null,
    model: productName
  };
}

/**
 * Extract features from konstruktionsmerkmale (technical details)
 * @param {Array} konstruktionsmerkmale - Technical specifications
 * @param {string} category - Product category
 * @returns {Array} Detected features
 */
export function extractFeaturesFromSpecs(konstruktionsmerkmale, category) {
  if (!konstruktionsmerkmale || !Array.isArray(konstruktionsmerkmale)) {
    return [];
  }
  
  // Combine all text fields
  const allText = konstruktionsmerkmale
    .map(m => `${m.label || ''} ${m.value || ''}`)
    .join(' ')
    .toLowerCase();
  
  const features = [];
  const seenKeys = new Set();
  
  // Select appropriate feature dictionary based on category
  const featureDict = {
    'mobility': MOBILITY_FEATURES_EXTENDED,
    'Gehhilfe': MOBILITY_FEATURES_EXTENDED,
    'hearing': HEARING_FEATURES_EXTENDED,
    'Hörgerät': HEARING_FEATURES_EXTENDED,
    'vision': VISION_FEATURES_EXTENDED,
    'Sehhilfe': VISION_FEATURES_EXTENDED,
    'bathroom': BATHROOM_FEATURES_EXTENDED,
    'Badehilfe': BATHROOM_FEATURES_EXTENDED,
  }[category] || {};
  
  // Search for features in technical text
  for (const [searchKey, value] of Object.entries(featureDict)) {
    if (allText.includes(searchKey) && !seenKeys.has(value.key)) {
      features.push({ key: value.key, ...value });
      seenKeys.add(value.key);
    }
  }
  
  return features;
}

/**
 * Merge name-based and spec-based features (deduplication by key)
 * @param {Array} nameFeatures - Features detected from product name
 * @param {Array} specFeatures - Features detected from technical specs
 * @returns {Array} Merged and deduplicated features
 */
function mergeFeatures(nameFeatures, specFeatures) {
  const merged = new Map();
  
  // Add name-based features first
  nameFeatures.forEach(f => {
    if (f && f.key) {
      merged.set(f.key, f);
    }
  });
  
  // Add spec-based features (don't override existing)
  specFeatures.forEach(f => {
    if (f && f.key && !merged.has(f.key)) {
      merged.set(f.key, f);
    }
  });
  
  return Array.from(merged.values());
}

/**
 * Main decoder function
 * @param {object} product - Product object with name and code
 * @param {string} categoryHint - Category hint from product group
 * @param {Array} konstruktionsmerkmale - Optional technical specifications for enhanced detection
 * @returns {object} Decoded product information
 */
export function decodeProduct(product, categoryHint = null, konstruktionsmerkmale = null) {
  const productName = product?.bezeichnung || product?.name || '';
  const productCode = product?.produktartNummer || product?.code || '';
  
  if (!productName) {
    return null;
  }
  
  // Determine category from product code
  const groupPrefix = productCode.substring(0, 5);
  
  let decodedInfo = null;
  let category = null;
  
  // Hearing aids: 13.20.x, 07.99.x
  if (groupPrefix === '13.20' || groupPrefix.startsWith('07.99') || categoryHint === 'hearing') {
    decodedInfo = decodeHearingAid(productName);
    category = 'hearing';
  }
  // Mobility aids / Gehhilfen: 10.xx (primary), 09.xx (legacy)
  else if (groupPrefix.startsWith('10.') || groupPrefix.startsWith('09.') || categoryHint === 'mobility') {
    decodedInfo = decodeMobilityAid(productName);
    category = 'mobility';
  }
  // Bathroom aids: 04.40.x, 04.41.x
  else if (groupPrefix.startsWith('04.4') || categoryHint === 'bathroom') {
    decodedInfo = decodeBathroomAid(productName, productCode);
    category = 'bathroom';
  }
  // Vision aids: 25.50.x, 25.56.x
  else if (groupPrefix.startsWith('25.5') || categoryHint === 'vision') {
    decodedInfo = decodeVisionAid(productName);
    category = 'vision';
  }
  // Incontinence products: 51.40.x
  else if (groupPrefix.startsWith('51.4') || categoryHint === 'incontinence') {
    decodedInfo = decodeIncontinenceProduct(productName);
    category = 'incontinence';
  }
  // Compression therapy: 11.31.x
  else if (groupPrefix.startsWith('11.3') || categoryHint === 'compression') {
    decodedInfo = decodeCompressionTherapy(productName);
    category = 'compression';
  }
  // Care beds: 18.50.x
  else if (groupPrefix.startsWith('18.5') || categoryHint === 'bed') {
    decodedInfo = decodeCareBed(productName);
    category = 'bed';
  }
  // Measurement devices: 22.50.x, 22.51.x
  else if (groupPrefix.startsWith('22.5') || categoryHint === 'measurement') {
    decodedInfo = decodeMeasurementDevice(productName);
    category = 'measurement';
  }
  // Default: basic extraction
  else {
    decodedInfo = {
      deviceType: null,
      features: [],
      brandModel: extractBrandModel(productName),
      category: 'Hilfsmittel'
    };
  }
  
  // If we have konstruktionsmerkmale, extract features from specs and merge
  if (konstruktionsmerkmale && category) {
    const specFeatures = extractFeaturesFromSpecs(konstruktionsmerkmale, category);
    const nameFeatures = decodedInfo?.features || [];
    const mergedFeatures = mergeFeatures(nameFeatures, specFeatures);
    
    return {
      ...decodedInfo,
      features: mergedFeatures
    };
  }
  
  return decodedInfo;
}

/**
 * Generate user-friendly explanation
 * @param {object} decodedInfo - Output from decodeProduct
 * @returns {string} Plain German explanation
 */
export function generateExplanation(decodedInfo) {
  if (!decodedInfo) {
    return '';
  }
  
  const parts = [];
  
  // Category and type
  if (decodedInfo.category) {
    parts.push(decodedInfo.category);
  }
  
  if (decodedInfo.deviceType?.de) {
    parts.push(`- ${decodedInfo.deviceType.de}`);
  }
  
  return parts.join(' ');
}

/**
 * Get simple product name (brand + model without technical codes)
 * @param {string} productName - Full technical name
 * @returns {string} Simplified name
 */
export function getSimplifiedName(productName) {
  if (!productName) {
    return 'Hilfsmittel';
  }
  
  // Remove common technical suffixes and patterns
  let simplified = productName
    .replace(/\s+\d{3,}[-/]\d+/g, '') // Remove "123/45" patterns
    .replace(/\s+\([^)]+\)/g, '') // Remove parentheses content
    .replace(/\s+SR\d+/gi, '') // Remove SR numbers
    .replace(/\s+DVIR/gi, '') // Remove DVIR
    .replace(/\s+[A-Z]{2,}$/g, '') // Remove trailing abbreviations
    .trim();
  
  return simplified || productName;
}

