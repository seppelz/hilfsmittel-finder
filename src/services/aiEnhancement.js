// AI-powered product description generation using Google Gemini Flash
// Free tier: 1,500 requests/day, 1M tokens/minute

import { logError, trackEvent } from '../utils/analytics';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const CACHE_KEY_PREFIX = 'ai_description_';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days (descriptions don't change)

/**
 * Check if AI service is available
 * @returns {boolean}
 */
export function isAIAvailable() {
  return Boolean(GEMINI_API_KEY);
}

/**
 * Get cached description if available
 * @param {string} productCode - Product code
 * @returns {object|null} Cached description or null
 */
function getCachedDescription(productCode) {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${productCode}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const data = JSON.parse(cached);
      const age = Date.now() - data.timestamp;
      
      if (age < CACHE_DURATION) {
        return data.description;
      } else {
        // Expired, remove
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    logError('ai_cache_read_error', error);
  }
  
  return null;
}

/**
 * Cache AI-generated description
 * @param {string} productCode - Product code
 * @param {string} description - Generated description
 */
function cacheDescription(productCode, description) {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${productCode}`;
    const data = {
      description,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    logError('ai_cache_write_error', error);
  }
}

/**
 * Detect product category from product code
 * @param {object} product - Product object
 * @returns {string} Category identifier
 */
function detectProductCategory(product) {
  const code = product?.produktartNummer || product?.code || '';
  
  if (code.startsWith('13.')) return 'hearing';
  if (code.startsWith('10.')) return 'mobility';
  if (code.startsWith('25.') || code.startsWith('07.')) return 'vision';
  if (code.startsWith('04.')) return 'bathroom';
  
  return 'general';
}

/**
 * Extract structured user needs from questionnaire
 * @param {object} userContext - User context from questionnaire
 * @returns {string} Formatted user needs string
 */
function extractUserNeeds(userContext) {
  const needs = [];
  
  if (!userContext) return 'Keine spezifischen Angaben';
  
  // Hearing-related needs
  if (userContext.hearing_level === 'severe' || userContext.hearing_level === 'profound') {
    needs.push('Starker Hörverlust (braucht hohe Verstärkung)');
  } else if (userContext.hearing_level === 'moderate') {
    needs.push('Mittlerer Hörverlust');
  } else if (userContext.hearing_level === 'mild') {
    needs.push('Leichter Hörverlust');
  }
  
  if (userContext.hearing_device_type === 'ite' || userContext.hearing_device_type === 'ido') {
    needs.push('Bevorzugt: Im-Ohr-Gerät (unauffällig)');
  } else if (userContext.hearing_device_type === 'bte' || userContext.hearing_device_type === 'hdo') {
    needs.push('Bevorzugt: Hinter-dem-Ohr-Gerät');
  } else if (userContext.hearing_device_type === 'ric') {
    needs.push('Bevorzugt: RIC-Gerät (Receiver-in-Canal)');
  }
  
  if (Array.isArray(userContext.hearing_features)) {
    if (userContext.hearing_features.includes('rechargeable')) {
      needs.push('Wiederaufladbar gewünscht');
    }
    if (userContext.hearing_features.includes('bluetooth')) {
      needs.push('Bluetooth-Verbindung wichtig');
    }
    if (userContext.hearing_features.includes('discreet')) {
      needs.push('Unauffälliges Gerät bevorzugt');
    }
  }
  
  if (Array.isArray(userContext.hearing_situations)) {
    if (userContext.hearing_situations.includes('noise')) {
      needs.push('Geräuschvolle Umgebungen (Restaurant, Straße)');
    }
    if (userContext.hearing_situations.includes('tv')) {
      needs.push('Fernsehen');
    }
    if (userContext.hearing_situations.includes('phone')) {
      needs.push('Telefonieren');
    }
    if (userContext.hearing_situations.includes('music')) {
      needs.push('Musik hören');
    }
  }
  
  // Mobility-related needs
  if (userContext.mobility_ability) {
    const mobilityMap = {
      'limited_walking': 'Kann kurze Strecken gehen, braucht Unterstützung',
      'very_limited': 'Kann nur mit Mühe einige Schritte gehen',
      'no_walking': 'Kann nicht mehr selbstständig gehen'
    };
    const mobility = mobilityMap[userContext.mobility_ability];
    if (mobility) needs.push(mobility);
  }
  
  return needs.length > 0 ? '- ' + needs.join('\n- ') : 'Keine spezifischen Angaben';
}

/**
 * Extract device capabilities from product data
 * @param {object} product - Product object
 * @param {object} decodedInfo - Decoded product information
 * @param {string} category - Product category
 * @returns {string} Formatted device capabilities string
 */
function extractDeviceCapabilities(product, decodedInfo, category) {
  const caps = [];
  const name = (product?.bezeichnung || '').toUpperCase();
  
  // Category-specific capability extraction
  if (category === 'hearing') {
    // Hörgeräte capabilities
    // Power level
    if (name.includes(' HP') || name.includes('(HP')) {
      caps.push('Leistung: HP (High Power - für starken Hörverlust)');
    } else if (name.includes(' UP') || name.includes('(UP')) {
      caps.push('Leistung: UP (Ultra Power - für sehr starken Hörverlust)');
    } else if (name.includes(' SP') || name.includes('(SP')) {
      caps.push('Leistung: SP (Super Power)');
    } else if (name.includes(' M ') || name.includes(' M-') || name.includes('(M)')) {
      caps.push('Leistung: M (Medium - für leichten bis mittleren Hörverlust)');
    }
    
    // Device type
    if (decodedInfo?.deviceType?.de) {
      caps.push(`Bauform: ${decodedInfo.deviceType.de}`);
    }
    
    // Charging
    if (name.includes(' R ') || name.includes(' R-') || name.includes('-R ') || 
        name.includes('LITHIUM') || name.includes('AKKU')) {
      caps.push('Wiederaufladbar (kein Batteriewechsel nötig)');
    }
    
    // Connectivity
    if (name.includes('BLUETOOTH') || name.includes('DIRECT') || name.includes('CONNECT')) {
      caps.push('Bluetooth (direkte Verbindung zu TV, Handy)');
    }
    if (name.includes(' T ') || name.includes('-T ') || name.includes('(T)') || name.includes('TELECOIL')) {
      caps.push('Telefonspule (für Induktionsschleifen)');
    }
    if (name.includes(' AI ') || name.includes('-AI ') || name.includes('(AI)')) {
      caps.push('KI-gestützte Anpassung');
    }
  } else if (category === 'mobility') {
    // Gehhilfen capabilities
    // Device type
    if (name.includes('ROLLATOR')) {
      caps.push('Typ: Rollator (mit Rädern und Bremsen)');
    } else if (name.includes('STOCK') || name.includes('STAB')) {
      caps.push('Typ: Gehstock (für leichte Unterstützung)');
    } else if (name.includes('WAGEN') || name.includes('WALKER')) {
      caps.push('Typ: Gehwagen (sehr stabil)');
    } else if (name.includes('GEHSTÜTZE') || name.includes('KRÜCKE') || name.includes('UNTERARM')) {
      caps.push('Typ: Unterarmgehstützen (für stärkere Unterstützung)');
    } else if (name.includes('GESTELL') || name.includes('GEHBOCK')) {
      caps.push('Typ: Gehgestell (stabil, ohne Räder)');
    }
    
    // Features
    if (name.includes('FALTBAR') || name.includes('KLAPPBAR')) {
      caps.push('Faltbar (platzsparend für Transport)');
    }
    if (name.includes('HÖHENVERSTELLBAR') || name.includes('VERSTELLBAR')) {
      caps.push('Höhenverstellbar (anpassbar an Körpergröße)');
    }
    if (name.includes('BREMSE')) {
      caps.push('Mit Bremsen (für sicheres Anhalten)');
    }
    if (name.includes('SITZ') || name.includes('SITZFLÄCHE')) {
      caps.push('Mit Sitzfläche (für Pausen unterwegs)');
    }
    if (name.includes('KORB') || name.includes('TASCHE')) {
      caps.push('Mit Korb/Tasche (für Einkäufe)');
    }
    if (name.includes('4 RÄDER') || name.includes('4-RÄDER')) {
      caps.push('4 Räder (sehr stabil)');
    } else if (name.includes('3 RÄDER') || name.includes('3-RÄDER')) {
      caps.push('3 Räder (wendig)');
    }
  } else if (category === 'vision') {
    // Sehhilfen capabilities
    if (name.includes('LUPE')) {
      caps.push('Typ: Lupe (Vergrößerungshilfe)');
    }
    if (name.includes('LED') || name.includes('LICHT') || name.includes('BELEUCHT')) {
      caps.push('Mit Beleuchtung (bessere Sicht)');
    }
    if (name.includes('ELEKTRONISCH') || name.includes('DIGITAL')) {
      caps.push('Elektronisch (einstellbare Vergrößerung)');
    }
  } else if (category === 'bathroom') {
    // Badehilfen capabilities
    if (name.includes('DUSCHSITZ') || name.includes('DUSCHSTUHL')) {
      caps.push('Typ: Duschsitz (zum Sitzen beim Duschen)');
    } else if (name.includes('HALTEGRIFF') || name.includes('GRIFF')) {
      caps.push('Typ: Haltegriff (zum Festhalten)');
    } else if (name.includes('BADEWANNENSITZ')) {
      caps.push('Typ: Badewannensitz (erleichtert Baden)');
    }
    if (name.includes('RUTSCHFEST') || name.includes('ANTI-RUTSCH')) {
      caps.push('Rutschfest (erhöhte Sicherheit)');
    }
  }
  
  return caps.length > 0 ? '- ' + caps.join('\n- ') : 'Standardausführung';
}

/**
 * Build prompt for product description
 * @param {object} product - Product object
 * @param {object} userContext - User context from questionnaire
 * @param {object} decodedInfo - Decoded product information
 * @returns {string} Prompt for AI
 */
function buildPrompt(product, userContext, decodedInfo) {
  const productName = product?.bezeichnung || product?.name || 'Produkt';
  const manufacturer = product?.hersteller || 'Hersteller unbekannt';
  const deviceType = decodedInfo?.deviceType?.de || '';
  
  // Detect category and set appropriate expert role
  const category = detectProductCategory(product);
  const expertRole = {
    'hearing': 'Hörgeräte',
    'mobility': 'Gehhilfen und Mobilitätshilfen',
    'vision': 'Sehhilfen',
    'bathroom': 'Badehilfen',
    'general': 'Hilfsmittel'
  }[category];
  
  // Extract structured user needs and device capabilities
  const userNeeds = extractUserNeeds(userContext);
  const deviceCapabilities = extractDeviceCapabilities(product, decodedInfo, category);
  
  const prompt = `Du bist Experte für ${expertRole}. Bewerte dieses Produkt für den Nutzer.

NUTZER-SITUATION:
${userNeeds}

PRODUKT:
${productName}
${deviceType ? `Typ: ${deviceType}` : ''}
${deviceCapabilities}
Hersteller: ${manufacturer}

AUFGABE (max. 80 Wörter):
1. PASSUNG (1 Satz): "Sehr gut geeignet" / "Gut geeignet" / "Eingeschränkt geeignet"
2. HAUPTVORTEILE (2-3 Punkte): Was spricht dafür?
3. ZU BEACHTEN (optional, 1 Punkt): Wichtige Einschränkung?
4. NÄCHSTER SCHRITT (1 Satz): Wie bekomme ich es? (Arzt/Rezept/Beratung)

STIL: Einfache Sprache für Senioren. Direkt und professionell. Keine Begrüßung. Keine Sternchen.`;

  return prompt;
}


/**
 * Call Gemini API to generate product description
 * @param {string} prompt - The prompt to send
 * @returns {Promise<string>} Generated description
 */
async function callGeminiAPI(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }
  
  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.6,  // Slightly lower for more consistent, factual output
        maxOutputTokens: 800,  // Increased to account for thinking mode
        topP: 0.85,
        topK: 40,
        thinkingConfig: {
          thinkingBudget: 0  // Disable thinking mode to save tokens
        }
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH"
        }
      ]
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error('[AI] Product description API error:', response.status, errorData);
    throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
  }
  
  const data = await response.json();
  console.log('[AI] Description API response:', JSON.stringify(data, null, 2));
  
  // Extract text from response
  const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!generatedText) {
    console.error('[AI] No text in response. Full response:', data);
    throw new Error('No text generated from Gemini API');
  }
  
  // Clean up the text: remove any greetings or unwanted phrases
  let cleanedText = generatedText.trim();
  
  // Remove common German greetings at the start
  const greetingsToRemove = [
    /^Guten Tag[!,.]?\s*/i,
    /^Hallo[!,.]?\s*/i,
    /^Sehr geehrte[r]?\s+.*?,\s*/i,
    /^Liebe[r]?\s+.*?,\s*/i,
  ];
  
  greetingsToRemove.forEach(pattern => {
    cleanedText = cleanedText.replace(pattern, '');
  });
  
  return cleanedText.trim();
}

/**
 * Generate AI-powered product description
 * @param {object} product - Product object
 * @param {object} userContext - User context from questionnaire
 * @param {object} decodedInfo - Decoded product information
 * @returns {Promise<string|null>} Generated description or null if failed
 */
export async function generateProductDescription(product, userContext = null, decodedInfo = null) {
  if (!isAIAvailable()) {
    return null;
  }
  
  const productCode = product?.produktartNummer || product?.code;
  
  // Check cache first
  const cached = getCachedDescription(productCode);
  if (cached) {
    trackEvent('ai_description_cache_hit', { productCode });
    return cached;
  }
  
  try {
    trackEvent('ai_description_generation_start', { productCode });
    
    const prompt = buildPrompt(product, userContext, decodedInfo);
    const description = await callGeminiAPI(prompt);
    
    // Cache the result
    cacheDescription(productCode, description);
    
    trackEvent('ai_description_generation_success', { 
      productCode,
      descriptionLength: description.length 
    });
    
    return description;
  } catch (error) {
    logError('ai_description_generation_failed', error, { 
      productCode,
      errorMessage: error.message 
    });
    
    // Return null to fall back to manual description
    return null;
  }
}

/**
 * Generate descriptions for multiple products in batch
 * @param {Array} products - Array of products
 * @param {object} userContext - User context
 * @param {object} decodedInfoMap - Map of product code to decoded info
 * @param {number} maxConcurrent - Max concurrent API calls
 * @returns {Promise<Map>} Map of product code to description
 */
export async function generateBatchDescriptions(products, userContext, decodedInfoMap = {}, maxConcurrent = 3) {
  const results = new Map();
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < products.length; i += maxConcurrent) {
    const batch = products.slice(i, i + maxConcurrent);
    
    const promises = batch.map(async (product) => {
      const productCode = product?.produktartNummer || product?.code;
      const decodedInfo = decodedInfoMap[productCode];
      
      try {
        const description = await generateProductDescription(product, userContext, decodedInfo);
        return { productCode, description };
      } catch (err) {
        logError('batch_description_failed', err, { productCode });
        return { productCode, description: null };
      }
    });
    
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(({ productCode, description }) => {
      if (description) {
        results.set(productCode, description);
      }
    });
  }
  
  return results;
}

/**
 * Clear all cached AI descriptions
 */
export function clearAICache() {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    const aiKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    aiKeys.forEach(key => localStorage.removeItem(key));
    
    trackEvent('ai_cache_cleared', { count: aiKeys.length });
    
    return aiKeys.length;
  } catch (error) {
    logError('ai_cache_clear_error', error);
    return 0;
  }
}

/**
 * Clear cached description for a specific product
 * Useful for testing/debugging
 */
export function clearProductCache(productCode) {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${productCode}`;
    localStorage.removeItem(cacheKey);
    return true;
  } catch (error) {
    logError('ai_cache_clear_product_error', error, { productCode });
    return false;
  }
}

/**
 * Determine if a product is highly recommended for the user
 * @param {object} product - Product object
 * @param {object} userContext - User context from questionnaire
 * @param {object} decodedInfo - Decoded product information
 * @returns {boolean} True if highly recommended
 */
export function isHighlyRecommended(product, userContext, decodedInfo) {
  if (!userContext || !decodedInfo) return false;
  
  let score = 0;
  const features = decodedInfo.features || [];
  const deviceType = decodedInfo.deviceType?.de || '';
  
  // Convert features array to searchable string
  // Features can be objects {name, icon, description} or strings
  const featureString = features
    .map(f => typeof f === 'string' ? f : (f?.name || ''))
    .join(' ')
    .toLowerCase();
  
  // Check hearing aid context
  if (userContext.hearing_level) {
    // Rechargeable is great for seniors
    if (featureString.includes('wiederaufladbar') || featureString.includes('rechargeable')) {
      score += 2;
    }
    
    // Bluetooth good if they have smartphone
    if (featureString.includes('bluetooth')) {
      score += 1;
    }
    
    // For severe hearing loss, prefer HP/SP
    if (userContext.hearing_level === 'severe') {
      if (deviceType.includes('High Power') || deviceType.includes('Super Power')) {
        score += 2;
      }
    }
    
    // For mild/moderate, prefer discreet options
    if (userContext.hearing_level === 'mild' || userContext.hearing_level === 'moderate') {
      if (deviceType.includes('Unsichtbar') || deviceType.includes('Im Gehörgang')) {
        score += 2;
      }
    }
  }
  
  // Check mobility context
  if (userContext.mobility_ability) {
    const deviceTypeLower = String(deviceType).toLowerCase();
    
    // Lightweight is important
    if (deviceTypeLower.includes('leicht')) {
      score += 2;
    }
    
    // For very limited mobility, prefer stable options
    if (userContext.mobility_ability === 'very_limited' || userContext.mobility_ability === 'no_walking') {
      if (deviceTypeLower.includes('stabil') || deviceTypeLower.includes('vier')) {
        score += 2;
      }
    }
    
    // For limited walking, prefer lightweight with wheels
    if (userContext.mobility_ability === 'limited_walking') {
      if (deviceTypeLower.includes('rollator') || deviceTypeLower.includes('räder')) {
        score += 2;
      }
    }
  }
  
  // High recommendation threshold
  return score >= 3;
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  if (typeof window === 'undefined') return null;
  
  try {
    const keys = Object.keys(localStorage);
    const aiKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    const stats = {
      total: aiKeys.length,
      oldestTimestamp: null,
      newestTimestamp: null,
      totalSize: 0
    };
    
    aiKeys.forEach(key => {
      const data = JSON.parse(localStorage.getItem(key));
      if (data.timestamp) {
        if (!stats.oldestTimestamp || data.timestamp < stats.oldestTimestamp) {
          stats.oldestTimestamp = data.timestamp;
        }
        if (!stats.newestTimestamp || data.timestamp > stats.newestTimestamp) {
          stats.newestTimestamp = data.timestamp;
        }
      }
      stats.totalSize += key.length + JSON.stringify(data).length;
    });
    
    return stats;
  } catch (error) {
    logError('ai_cache_stats_error', error);
    return null;
  }
}

/**
 * Generate AI-powered comparison analysis for multiple products
 * @param {Array} products - Array of 2-3 products to compare
 * @param {Object} userContext - User context from questionnaire
 * @returns {Promise<string>} Comparison analysis
 */
export async function generateComparisonAnalysis(products, userContext) {
  if (!isAIAvailable() || products.length < 2) {
    return null;
  }
  
  // Import here to avoid circular dependency
  const { decodeProduct } = await import('../utils/productDecoder');
  
  // Detect category from first product
  const category = detectProductCategory(products[0]);
  const expertRole = {
    'hearing': 'Hörgeräte',
    'mobility': 'Gehhilfen und Mobilitätshilfen',
    'vision': 'Sehhilfen',
    'bathroom': 'Badehilfen',
    'general': 'Hilfsmittel'
  }[category];
  
  // Build comparison prompt
  const userNeeds = extractUserNeeds(userContext);
  
  const productsInfo = products.map((product, idx) => {
    const name = product?.bezeichnung || 'Produkt';
    const code = product?.produktartNummer || product?.code;
    const decoded = decodeProduct(product);
    const capabilities = extractDeviceCapabilities(product, decoded, category);
    
    return `
PRODUKT ${idx + 1}: ${name}
Code: ${code}
Hersteller: ${product?.hersteller || 'Unbekannt'}
Erkannte Eigenschaften:
${capabilities}`;
  }).join('\n\n');
  
  // Category-specific comparison focus
  const comparisonFocus = {
    'hearing': 'Leistungsstufen, Bauform, Wiederaufladbarkeit, Bluetooth',
    'mobility': 'Belastbarkeit, Körpergröße, Sitzhöhe, Maße, Gewicht, Faltbarkeit, Bremsen',
    'vision': 'Vergrößerung, Beleuchtung, Größe',
    'bathroom': 'Belastbarkeit, Maße, Rutschfestigkeit, Montage'
  }[category] || 'Technische Spezifikationen';
  
  const prompt = `Du bist Experte für ${expertRole}. Vergleiche diese ${products.length} Produkte für den Nutzer.

NUTZER-BEDÜRFNISSE:
${userNeeds}

ZU VERGLEICHENDE PRODUKTE:
${productsInfo}

WICHTIG: Suche im Internet nach den genauen technischen Unterschieden zwischen diesen Produkten anhand ihrer Hilfsmittelnummern (Codes).
Relevante technische Daten: ${comparisonFocus}

AUFGABE:
1. Beste Wahl (1-2 Sätze): Welches Produkt passt am besten zu den Bedürfnissen und warum? Nenne konkrete technische Unterschiede (z.B. Belastbarkeit, Körpergröße, Maße).
2. Alternative (1 Satz): Wann wäre das andere Produkt besser? (z.B. "Produkt 2 ist für kleinere/größere Personen geeignet")
3. Wichtigster Unterschied (1 Satz): Was ist der Hauptunterschied für den Nutzer?

STIL: Einfache Sprache, direkte Empfehlung mit konkreten technischen Daten, max. 120 Wörter. Nutze "Produkt 1", "Produkt 2" etc. zur Referenz.`;

  try {
    // Use Google Search Grounding for technical specs research
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,  // Balanced for factual comparison
          maxOutputTokens: 1000,
          topP: 0.85,
          topK: 40,
          thinkingConfig: {
            thinkingBudget: 0  // Disable thinking mode
          }
        },
        tools: [
          {
            googleSearch: {}  // Enable Google Search Grounding
          }
        ],
        safetySettings: [
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH"
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] Comparison API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    const analysis = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!analysis) {
      console.error('[AI] No comparison text in response:', data);
      throw new Error('No comparison text generated');
    }
    
    trackEvent('ai_comparison_generated', { 
      productCount: products.length,
      category: category,
      success: true 
    });
    
    return analysis;
  } catch (error) {
    logError('ai_comparison_failed', error);
    console.error('[AI] Comparison error:', error);
    return 'Vergleich konnte nicht erstellt werden. Bitte vergleichen Sie die Eigenschaften in der Tabelle.';
  }
}
