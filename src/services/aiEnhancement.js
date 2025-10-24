// AI-powered product description generation using Google Gemini Flash
// Free tier: 1,500 requests/day, 1M tokens/minute

import { logError, trackEvent } from '../utils/analytics';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-latest:generateContent';

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
 * @returns {string} Formatted device capabilities string
 */
function extractDeviceCapabilities(product, decodedInfo) {
  const caps = [];
  const name = (product?.bezeichnung || '').toUpperCase();
  
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
    caps.push('Telefonspule (für Induktionsschleifen in öffentlichen Gebäuden)');
  }
  if (name.includes(' AI ') || name.includes('-AI ') || name.includes('(AI)')) {
    caps.push('KI-gestützte Anpassung');
  }
  
  return caps.length > 0 ? '- ' + caps.join('\n- ') : 'Standardgerät';
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
  
  // Extract structured user needs and device capabilities
  const userNeeds = extractUserNeeds(userContext);
  const deviceCapabilities = extractDeviceCapabilities(product, decodedInfo);
  
  const prompt = `Du bist Experte für Hörgeräte. Vergleiche die Bedürfnisse des Nutzers mit diesem Gerät.

NUTZER-BEDÜRFNISSE:
${userNeeds}

GERÄTE-EIGENSCHAFTEN:
Name: ${productName}
${deviceType ? `Typ: ${deviceType}` : ''}
${deviceCapabilities}
Hersteller: ${manufacturer}

AUFGABE:
1. Bewertung (1 Satz): Wie gut passt das Gerät? (Perfekt geeignet / Gut geeignet / Eingeschränkt geeignet)
2. Wichtigste Vorteile (1-2 Stichpunkte): Was passt besonders gut zu den Bedürfnissen?
3. Eventuelle Einschränkungen (optional, 1 Stichpunkt): Falls etwas nicht optimal passt

STIL: Einfache Sprache, direkte Ansprache ("Sie können...", "Das hilft Ihnen..."), max. 80 Wörter. KEINE Begrüßung.`;

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
        maxOutputTokens: 200,  // Increased for comparison-style descriptions
        topP: 0.85,
        topK: 40
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
    throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
  }
  
  const data = await response.json();
  
  // Extract text from response
  const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!generatedText) {
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
  
  // Build comparison prompt
  const userNeeds = extractUserNeeds(userContext);
  
  const productsInfo = products.map((product, idx) => {
    const name = product?.bezeichnung || 'Produkt';
    const code = product?.produktartNummer || product?.code;
    const decoded = decodeProduct(product);
    const capabilities = extractDeviceCapabilities(product, decoded);
    
    return `
PRODUKT ${idx + 1}: ${name}
Code: ${code}
Hersteller: ${product?.hersteller || 'Unbekannt'}
Eigenschaften:
${capabilities}`;
  }).join('\n\n');
  
  const prompt = `Du bist Experte für Hörgeräte. Vergleiche diese ${products.length} Produkte für den Nutzer.

NUTZER-BEDÜRFNISSE:
${userNeeds}

ZU VERGLEICHENDE PRODUKTE:
${productsInfo}

AUFGABE:
1. Beste Wahl (1 Satz): Welches Produkt passt am besten und warum?
2. Alternative (1 Satz): Wann wäre das andere Produkt besser?
3. Wichtigster Unterschied (1 Satz): Was ist der Hauptunterschied für den Nutzer?

STIL: Einfache Sprache, direkte Empfehlung, max. 100 Wörter. Nutze "Produkt 1", "Produkt 2" etc. zur Referenz.`;

  try {
    const analysis = await callGeminiAPI(prompt);
    trackEvent('ai_comparison_generated', { 
      productCount: products.length,
      success: true 
    });
    return analysis;
  } catch (error) {
    logError('ai_comparison_failed', error);
    return 'Vergleich konnte nicht erstellt werden. Bitte vergleichen Sie die Eigenschaften in der Tabelle.';
  }
}

/**
 * Search for approximate product price using Google Search Grounding
 * @param {object} product - Product object
 * @returns {Promise<string|null>} Price information or null
 */
export async function searchProductPrice(product) {
  if (!isAIAvailable()) {
    console.warn('[AI] Price search skipped: No API key');
    return null;
  }
  
  const productName = product?.bezeichnung || product?.name;
  const manufacturer = product?.hersteller;
  const code = product?.produktartNummer || product?.code;
  
  if (!productName) {
    console.warn('[AI] Price search skipped: No product name');
    return null;
  }
  
  const prompt = `Suche den aktuellen Verkaufspreis für dieses Hörgerät in Deutschland:

Produkt: ${productName}
Hersteller: ${manufacturer || 'unbekannt'}
GKV-Code: ${code}

Finde den ungefähren Verkaufspreis bei Hörgeräteakustikern oder Online-Shops.
Antworte NUR mit dem Preis im Format "ca. X.XXX €" ODER "Preis nicht gefunden".
Keine weiteren Erklärungen oder Text.`;

  try {
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
          temperature: 0.1,  // Low for factual pricing
          maxOutputTokens: 50,  // Short response
        },
        // Enable Google Search Grounding
        tools: [
          {
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: "MODE_DYNAMIC",
                dynamicThreshold: 0.3
              }
            }
          }
        ]
      })
    });
    
    if (!response.ok) {
      console.warn('[AI] Price search API failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    const priceText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!priceText || priceText.toLowerCase().includes('nicht gefunden')) {
      console.log('[AI] Price not found for:', productName);
      return null;
    }
    
    trackEvent('ai_price_search_success', { 
      product: code,
      foundPrice: true 
    });
    
    console.log('[AI] Price found for', productName, ':', priceText.trim());
    return priceText.trim();
  } catch (error) {
    logError('ai_price_search_failed', error);
    console.error('[AI] Price search error:', error);
    return null;
  }
}

/**
 * Search for prices of multiple products in a single AI request (batch processing)
 * @param {Array} products - Array of product objects
 * @returns {Promise<Object>} Map of product codes to prices { code: price }
 */
export async function searchMultipleProductPrices(products) {
  if (!isAIAvailable()) {
    console.warn('[AI] Batch price search skipped: No API key');
    return {};
  }
  
  if (!products || products.length === 0) {
    return {};
  }
  
  // Build list of products for the prompt
  const productList = products.map((p, idx) => {
    const name = p?.bezeichnung || p?.name || 'Unbekannt';
    const manufacturer = p?.hersteller || 'unbekannt';
    const code = p?.produktartNummer || p?.code || '';
    return `${idx + 1}. Code: ${code} | Produkt: ${name} | Hersteller: ${manufacturer}`;
  }).join('\n');
  
  const prompt = `Suche die aktuellen Verkaufspreise für diese Hörgeräte in Deutschland:

${productList}

Antworte NUR mit JSON im folgenden Format (keine weiteren Erklärungen):
{
  "prices": [
    {"code": "13.20.10.0671", "price": "ca. 1.200 €"},
    {"code": "13.20.10.0672", "price": "ca. 1.500 €"},
    {"code": "13.20.10.0670", "price": "Preis nicht gefunden"}
  ]
}

Wichtig: Für jeden Code MUSS ein Eintrag vorhanden sein. Wenn kein Preis gefunden: "Preis nicht gefunden"`;

  try {
    console.log('[AI] Batch price search for', products.length, 'products');
    
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
          temperature: 0.1,
          maxOutputTokens: 500,  // More tokens for multiple products
        },
        // Enable Google Search Grounding
        tools: [
          {
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: "MODE_DYNAMIC",
                dynamicThreshold: 0.3
              }
            }
          }
        ]
      })
    });
    
    if (!response.ok) {
      console.warn('[AI] Batch price search API failed:', response.status);
      return {};
    }
    
    const data = await response.json();
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      console.warn('[AI] No response text from batch price search');
      return {};
    }
    
    // Parse JSON response
    try {
      // Extract JSON from response (may have markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[AI] No JSON found in response');
        return {};
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      const priceMap = {};
      
      if (parsed.prices && Array.isArray(parsed.prices)) {
        parsed.prices.forEach(item => {
          if (item.code && item.price && !item.price.toLowerCase().includes('nicht gefunden')) {
            priceMap[item.code] = item.price;
          }
        });
      }
      
      console.log('[AI] Batch price search complete:', Object.keys(priceMap).length, 'prices found');
      trackEvent('ai_batch_price_search_success', { 
        productsRequested: products.length,
        pricesFound: Object.keys(priceMap).length
      });
      
      return priceMap;
    } catch (parseError) {
      console.error('[AI] Failed to parse batch price response:', parseError);
      console.log('[AI] Raw response:', responseText);
      return {};
    }
  } catch (error) {
    logError('ai_batch_price_search_failed', error);
    console.error('[AI] Batch price search error:', error);
    return {};
  }
}

