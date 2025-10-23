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
  
  const prompt = `Du bist ein erfahrener Berater für medizinische Hilfsmittel. Erkläre dieses Produkt in einfacher, freundlicher Sprache für Senioren (65+).

PRODUKT:
Name: ${productName}
Kategorie: ${category}
${deviceType ? `Typ: ${deviceType}` : ''}
Hersteller: ${manufacturer}
${contextStr ? `\nNUTZER-SITUATION:\n${contextStr}` : ''}

AUFGABE:
Schreibe 2-3 kurze, klare Sätze, die erklären:
• Was ist das konkret?
• Wie hilft es im Alltag?
${contextStr ? '• Warum passt es besonders gut zur Situation?' : '• Für wen ist es ideal?'}

STIL:
- Direkt starten (KEIN "Guten Tag" oder Begrüßung)
- Einfache Sprache, keine Fachbegriffe
- Alltagsvergleiche nutzen ("wie ein...", "ähnlich wie...")
- Direkte Ansprache: "Sie können...", "Das hilft Ihnen..."
- Positive, ermutigende Formulierung
- Maximal 3 Sätze (ca. 40-60 Wörter)

Beginne direkt mit der Erklärung des Produkts.`;

  return prompt;
}

/**
 * Add contextual emojis to text for better readability
 * Seniors benefit from visual cues
 * @param {string} text - The text to enhance
 * @returns {string} Text with emojis
 */
function addContextualEmojis(text) {
  const emojiMap = {
    // Features
    'wiederaufladbar': '🔋',
    'aufladen': '🔋',
    'Batterien': '🔋',
    'Bluetooth': '📱',
    'Smartphone': '📱',
    'Telefon': '📞',
    'Handy': '📱',
    
    // Hearing aids
    'Hörgerät': '👂',
    'hören': '👂',
    'Gehörgang': '👂',
    'Ohr': '👂',
    'Ton': '🔊',
    'Lautstärke': '🔊',
    'Geräusch': '🔊',
    
    // Mobility
    'Gehstock': '🦯',
    'Rollator': '🦽',
    'gehen': '🚶',
    'laufen': '🚶',
    'Beine': '🦵',
    'Gleichgewicht': '⚖️',
    'Stabilität': '⚖️',
    
    // Comfort
    'bequem': '😊',
    'leicht': '🪶',
    'einfach': '✨',
    'sicher': '🛡️',
    'Sicherheit': '🛡️',
    
    // Home/Daily
    'Wohnung': '🏠',
    'Zuhause': '🏠',
    'draußen': '🌳',
    'drinnen': '🏠',
    'Bad': '🚿',
    'Küche': '🍳',
    
    // Time
    'Tag': '☀️',
    'Nacht': '🌙',
    'abends': '🌙',
    
    // Positive
    'hilft': '💪',
    'unterstützt': '🤝',
    'perfekt': '⭐',
    'ideal': '⭐',
    'empfehlen': '👍',
  };
  
  let enhancedText = text;
  
  // Add emoji before first occurrence of each keyword
  Object.entries(emojiMap).forEach(([keyword, emoji]) => {
    // Use word boundary to match whole words only
    const regex = new RegExp(`\\b${keyword}`, 'gi');
    let hasReplaced = false;
    
    enhancedText = enhancedText.replace(regex, (match) => {
      // Only add emoji to first occurrence
      if (!hasReplaced) {
        hasReplaced = true;
        return `${emoji} ${match}`;
      }
      return match;
    });
  });
  
  return enhancedText;
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
        temperature: 0.6,  // Slightly lower for more consistent, factual output
        maxOutputTokens: 150,  // Shorter for more concise descriptions
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
  
  // Add contextual emojis for better readability (seniors benefit from visual cues)
  cleanedText = addContextualEmojis(cleanedText);
  
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

