// AI-powered product description generation using Google Gemini Flash
// Free tier: 1,500 requests/day, 1M tokens/minute

import { logError, trackEvent } from '../utils/analytics';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

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
 * Build prompt for product description
 * @param {object} product - Product object
 * @param {object} userContext - User context from questionnaire
 * @param {object} decodedInfo - Decoded product information
 * @returns {string} Prompt for AI
 */
function buildPrompt(product, userContext, decodedInfo) {
  const productName = product?.bezeichnung || product?.name || 'Produkt';
  const category = decodedInfo?.category || 'Hilfsmittel';
  const manufacturer = product?.hersteller || 'Hersteller unbekannt';
  const deviceType = decodedInfo?.deviceType?.de || '';
  
  // Build user context string
  let contextStr = '';
  if (userContext) {
    if (userContext.mobility_ability) {
      const mobilityMap = {
        'limited_walking': 'kann kurze Strecken gehen, braucht Unterstützung',
        'very_limited': 'kann nur mit Mühe einige Schritte gehen',
        'no_walking': 'kann nicht mehr selbstständig gehen'
      };
      contextStr += `Mobilität: ${mobilityMap[userContext.mobility_ability] || userContext.mobility_ability}. `;
    }
    if (userContext.hearing_level) {
      const hearingMap = {
        'mild': 'leichter Hörverlust',
        'moderate': 'mittlerer Hörverlust',
        'severe': 'starker Hörverlust'
      };
      contextStr += `Hörvermögen: ${hearingMap[userContext.hearing_level] || userContext.hearing_level}. `;
    }
  }
  
  const prompt = `Du bist ein freundlicher Berater für medizinische Hilfsmittel in Deutschland.

Erkläre dieses Produkt für Senioren (65+) in einfacher, warmer Sprache:

Produktname: ${productName}
Kategorie: ${category}
${deviceType ? `Typ: ${deviceType}` : ''}
Hersteller: ${manufacturer}
${contextStr ? `Situation des Nutzers: ${contextStr}` : ''}

Erstelle eine kurze, verständliche Beschreibung (2-3 Sätze):
1. Was ist das und wofür ist es?
2. Wie hilft es im Alltag?
3. ${contextStr ? 'Warum passt es zur Situation des Nutzers?' : 'Für wen ist es besonders geeignet?'}

Wichtig:
- Keine Fachbegriffe
- Vergleiche mit Alltagsgegenständen
- Warmer, geduldiger Ton
- Maximal 3 Sätze
- Direkte Ansprache ("Sie können...", "Ihnen hilft...")`;

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
  
  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
        temperature: 0.7,
        maxOutputTokens: 200,
        topP: 0.8,
        topK: 40
      }
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
  
  return generatedText.trim();
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
      } catch (error) {
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
  } catch (error) {
    logError('ai_cache_clear_error', error);
  }
}

