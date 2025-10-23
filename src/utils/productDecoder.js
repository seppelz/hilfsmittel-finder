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
  'T': { name: 'Telefonspule', description: 'Für besseres Telefonieren', icon: '📞' },
  'R': { name: 'Wiederaufladbar', description: 'Kein Batteriewechsel nötig', icon: '🔋' },
  'Direct': { name: 'Bluetooth', description: 'Verbindung mit Smartphone', icon: '📱' },
  'AI': { name: 'Künstliche Intelligenz', description: 'Lernt Ihre Vorlieben', icon: '🤖' },
  'HP': { name: 'Hohe Leistung', description: 'Für starken Hörverlust', icon: '🔊' },
  'SP': { name: 'Sehr hohe Leistung', description: 'Für sehr starken Hörverlust', icon: '🔊' },
  'M': { name: 'Mittlere Leistung', description: 'Für mittleren Hörverlust', icon: '🔉' }
};

export const MOBILITY_AID_TYPES = {
  'Rollator': { de: 'Gehhilfe mit Rädern', icon: '🚶', features: ['Sitzfläche', 'Bremsen'] },
  'Gehstock': { de: 'Einfacher Gehstock', icon: '🦯', features: ['Leicht', 'Höhenverstellbar'] },
  'Rollstuhl': { de: 'Rollstuhl', icon: '♿', features: ['Selbstfahrend', 'Faltbar'] },
  'Walker': { de: 'Gehwagen', icon: '🚶', features: ['Stabil', 'Mit Rädern'] }
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
  
  // Find features
  const features = [];
  for (const [key, value] of Object.entries(HEARING_AID_FEATURES)) {
    // Check for exact matches (avoid false positives)
    const regex = new RegExp(`\\b${key}\\b|${key}(?=-)|${key}$`, 'i');
    if (regex.test(productName)) {
      features.push({ key, ...value });
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
function decodeMobilityAid(productName, productCode) {
  const upperName = productName.toUpperCase();
  const groupCode = productCode ? productCode.substring(0, 5) : '';
  
  let deviceType = null;
  let category = 'Mobilitätshilfe';
  
  // Detect from product code
  if (groupCode === '09.12') {
    category = 'Gehhilfe';
    if (upperName.includes('ROLLATOR')) {
      deviceType = { key: 'Rollator', ...MOBILITY_AID_TYPES.Rollator };
    } else if (upperName.includes('STOCK')) {
      deviceType = { key: 'Gehstock', ...MOBILITY_AID_TYPES.Gehstock };
    }
  } else if (groupCode === '09.24') {
    category = 'Rollstuhl';
    deviceType = { key: 'Rollstuhl', ...MOBILITY_AID_TYPES.Rollstuhl };
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
 * Main decoder function
 * @param {object} product - Product object with name and code
 * @param {string} categoryHint - Category hint from product group
 * @returns {object} Decoded product information
 */
export function decodeProduct(product, categoryHint = null) {
  const productName = product?.bezeichnung || product?.name || '';
  const productCode = product?.produktartNummer || product?.code || '';
  
  if (!productName) {
    return null;
  }
  
  // Determine category from product code
  const groupPrefix = productCode.substring(0, 5);
  
  // Hearing aids: 13.20.x, 07.99.x
  if (groupPrefix === '13.20' || groupPrefix.startsWith('07.99') || categoryHint === 'hearing') {
    return decodeHearingAid(productName);
  }
  
  // Mobility aids: 09.12.x, 09.24.x, 09.40.x
  if (groupPrefix.startsWith('09.') || categoryHint === 'mobility') {
    return decodeMobilityAid(productName, productCode);
  }
  
  // Default: basic extraction
  return {
    deviceType: null,
    features: [],
    brandModel: extractBrandModel(productName),
    category: 'Hilfsmittel'
  };
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

