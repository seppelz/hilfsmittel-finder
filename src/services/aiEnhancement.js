// AI-powered product description generation using Google Gemini Flash
// Free tier: 1,500 requests/day, 1M tokens/minute

import { logError, trackEvent } from '../utils/analytics';
import { getComparisonFieldsForProducts } from '../data/comparisonFields';

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
 * Detect both category AND subcategory from products
 * @param {Array} products - Array of products to analyze
 * @returns {object} Object with category and subcategory
 */
function detectProductDetails(products) {
  const firstProduct = products[0];
  const code = firstProduct?.produktartNummer || firstProduct?.code || '';
  const name = (firstProduct?.bezeichnung || '').toUpperCase();
  
  let category = 'general';
  let subcategory = null;
  
  // Hearing aids
  if (code.startsWith('13.')) {
    category = 'hearing';
    // Detect device type from name
    if (name.includes('IIC') || name.includes('INVISIBLE')) {
      subcategory = 'IIC (Invisible In Canal)';
    } else if (name.includes('CIC')) {
      subcategory = 'CIC (Completely In Canal)';
    } else if (name.includes('ITC')) {
      subcategory = 'ITC (In The Canal)';
    } else if (name.includes('ITE')) {
      subcategory = 'ITE (In The Ear)';
    } else if (name.includes('RIC') || name.includes('RITE')) {
      subcategory = 'RIC/RITE (Receiver In Canal)';
    } else if (name.includes('BTE')) {
      subcategory = 'BTE (Behind The Ear)';
    }
  }
  
  // Mobility aids
  else if (code.startsWith('10.') || code.startsWith('09.')) {
    category = 'mobility';
    // Detect device type from name
    if (name.includes('ROLLATOR')) {
      subcategory = 'Rollatoren';
    } else if (name.includes('STOCK') || name.includes('STAB')) {
      subcategory = 'Gehstöcke';
    } else if (name.includes('GEHWAGEN') || name.includes('WALKER')) {
      subcategory = 'Gehwagen';
    } else if (name.includes('GEHSTÜTZE') || name.includes('KRÜCKE') || name.includes('UNTERARM')) {
      subcategory = 'Unterarmgehstützen';
    } else if (name.includes('GESTELL') || name.includes('GEHBOCK')) {
      subcategory = 'Gehgestelle';
    }
  }
  
  // Vision aids
  else if (code.startsWith('25.') || code.startsWith('07.')) {
    category = 'vision';
    if (name.includes('LUPE')) {
      subcategory = 'Lupen';
    } else if (name.includes('BRILLE')) {
      subcategory = 'Sehhilfenbrillen';
    }
  }
  
  // Bathroom aids
  else if (code.startsWith('04.')) {
    category = 'bathroom';
    if (name.includes('DUSCHSITZ') || name.includes('DUSCHSTUHL')) {
      subcategory = 'Duschsitze';
    } else if (name.includes('HALTEGRIFF')) {
      subcategory = 'Haltegriffe';
    } else if (name.includes('BADEWANNENSITZ')) {
      subcategory = 'Badewannensitze';
    }
  }
  
  return { category, subcategory };
}

/**
 * Extract structured user needs from questionnaire
 * @param {object} userContext - User context from questionnaire
 * @returns {string} Formatted user needs string
 */
function extractUserNeeds(userContext) {
  const needs = [];
  
  if (!userContext) {
    console.warn('[extractUserNeeds] userContext is null/undefined');
    return 'Keine spezifischen Angaben';
  }
  
  console.log('[extractUserNeeds] Processing userContext:', Object.keys(userContext));
  
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
  if (userContext.mobility_level) {
    const mobilityLevelMap = {
      'needs_light_support': 'Braucht leichte Unterstützung beim Gehen (kurze Strecken)',
      'needs_moderate_support': 'Braucht mittlere Unterstützung (große Anstrengung beim Gehen)',
      'needs_strong_support': 'Braucht starke Unterstützung (nur wenige Schritte möglich)'
    };
    const level = mobilityLevelMap[userContext.mobility_level];
    if (level) needs.push(level);
  }
  
  if (userContext.mobility_device_type) {
    const deviceTypeMap = {
      'gehstock': 'Bevorzugt: Gehstock (leichte Unterstützung)',
      'unterarmgehstuetzen': 'Bevorzugt: Unterarmgehstützen (stärkere Unterstützung)',
      'rollator': 'Bevorzugt: Rollator (mit Rädern und Bremsen)',
      'gehgestell': 'Bevorzugt: Gehgestell/Gehbock (stabil, ohne Räder)',
      'gehwagen': 'Bevorzugt: Gehwagen (mit Rädern, sehr stabil)'
    };
    const device = deviceTypeMap[userContext.mobility_device_type];
    if (device) needs.push(device);
  }
  
  if (Array.isArray(userContext.mobility_features)) {
    if (userContext.mobility_features.includes('adjustable')) {
      needs.push('Höhenverstellbar gewünscht');
    }
    if (userContext.mobility_features.includes('foldable')) {
      needs.push('Faltbar/Zusammenklappbar bevorzugt');
    }
    if (userContext.mobility_features.includes('lightweight')) {
      needs.push('Leicht und einfach zu handhaben');
    }
    if (userContext.mobility_features.includes('brakes')) {
      needs.push('Bremsen wichtig');
    }
    if (userContext.mobility_features.includes('seat')) {
      needs.push('Sitzfläche gewünscht (zum Ausruhen)');
    }
    if (userContext.mobility_features.includes('basket')) {
      needs.push('Korb/Ablagefläche wichtig');
    }
  }
  
  if (Array.isArray(userContext.mobility_usage)) {
    if (userContext.mobility_usage.includes('indoor')) {
      needs.push('Hauptsächlich für Innenräume');
    }
    if (userContext.mobility_usage.includes('outdoor')) {
      needs.push('Für draußen/längere Strecken');
    }
    if (userContext.mobility_usage.includes('stairs')) {
      needs.push('Auch für Treppen geeignet sein');
    }
    if (userContext.mobility_usage.includes('uneven_terrain')) {
      needs.push('Für unebenes Gelände (Kopfsteinpflaster, Waldwege)');
    }
  }
  
  // Vision-related needs (new questionnaire)
  if (userContext.vision_type) {
    const visionTypeMap = {
      'reading_only': 'Braucht Brille nur zum Lesen / für die Nähe (Zeitung, Handy, Medikamente)',
      'distance_only': 'Braucht Brille nur für die Ferne (Autofahren, Fernsehen, Gesichter erkennen)',
      'both': 'Braucht Brille für Nah und Fern (Gleitsichtbrille / Bifokalbrille)'
    };
    const type = visionTypeMap[userContext.vision_type];
    if (type) needs.push(type);
  }
  
  if (userContext.vision_strength) {
    const strengthMap = {
      'low': 'Leichte Sehschwäche (bis ±6 Dioptrien)',
      'medium': 'Mittlere Sehschwäche (±6 bis ±10 Dioptrien)',
      'high': 'Starke Sehschwäche (über ±10 Dioptrien, benötigt hochbrechende Gläser)'
    };
    const strength = strengthMap[userContext.vision_strength];
    if (strength && userContext.vision_strength !== 'any') needs.push(strength);
  }
  
  if (userContext.vision_astigmatism) {
    const astigmatismMap = {
      'mild': 'Hat leichte Hornhautverkrümmung (Zylinder bis 2 Dioptrien)',
      'moderate': 'Hat stärkere Hornhautverkrümmung (Zylinder über 2 Dioptrien)'
    };
    const astigmatism = astigmatismMap[userContext.vision_astigmatism];
    if (astigmatism && userContext.vision_astigmatism !== 'none') needs.push(astigmatism);
  }
  
  // Legacy vision needs (old questionnaire - fallback)
  if (Array.isArray(userContext.vision_issue)) {
    if (userContext.vision_issue.includes('reading')) {
      needs.push('Kann kleine Schrift nicht mehr lesen (Zeitung, Medikamente)');
    }
    if (userContext.vision_issue.includes('lighting')) {
      needs.push('Braucht mehr Licht zum Lesen');
    }
    if (userContext.vision_issue.includes('blurry')) {
      needs.push('Sieht verschwommen');
    }
  }
  
  // Bathroom-related needs (new detailed questionnaire)
  if (userContext.bathroom_location) {
    const locationMap = {
      'shower': 'Braucht Sitzgelegenheit in der Dusche (kann nicht lange stehen)',
      'bathtub_entry': 'Braucht Hilfe beim Ein- und Aussteigen aus der Badewanne',
      'bathtub_lift': 'Braucht Unterstützung beim Hinsetzen und Aufstehen in der Badewanne',
      'toilet': 'Braucht Unterstützung an der Toilette'
    };
    const location = locationMap[userContext.bathroom_location];
    if (location) needs.push(location);
  }
  
  if (userContext.bathroom_shower_type) {
    const typeMap = {
      'wall_mounted': 'Bevorzugt: Wandmontierter Duschsitz (fest installiert, sehr stabil)',
      'foldable': 'Bevorzugt: Klappbarer Duschsitz (platzsparend)',
      'freestanding': 'Bevorzugt: Freistehender Duschsitz (keine Montage nötig)'
    };
    const type = typeMap[userContext.bathroom_shower_type];
    if (type) needs.push(type);
  }
  
  if (userContext.bathroom_bathtub_features) {
    const featMap = {
      'electric': 'Bevorzugt: Elektrisch betrieben (einfache Bedienung per Knopfdruck)',
      'manual': 'Bevorzugt: Ohne Stromanschluss (wasserbetrieben oder manuell)'
    };
    const feat = featMap[userContext.bathroom_bathtub_features];
    if (feat && userContext.bathroom_bathtub_features !== 'any') needs.push(feat);
  }
  
  if (Array.isArray(userContext.bathroom_features)) {
    if (userContext.bathroom_features.includes('backrest')) {
      needs.push('Wichtig: Mit Rückenlehne (für mehr Komfort und Sicherheit)');
    }
    if (userContext.bathroom_features.includes('armrests')) {
      needs.push('Wichtig: Mit Armlehnen (zum Abstützen beim Aufstehen)');
    }
    if (userContext.bathroom_features.includes('high_capacity')) {
      needs.push('Wichtig: Hohe Tragkraft benötigt (über 150 kg)');
    }
    if (userContext.bathroom_features.includes('padded')) {
      needs.push('Wichtig: Gepolstert gewünscht (bequem für längeres Sitzen)');
    }
  }
  
  // Legacy bathroom needs (old questionnaire - fallback)
  if (Array.isArray(userContext.bathroom_issue)) {
    if (userContext.bathroom_issue.includes('shower_standing')) {
      needs.push('Kann nicht lange stehen beim Duschen');
    }
    if (userContext.bathroom_issue.includes('bathtub_access')) {
      needs.push('Ein- und Aussteigen aus Badewanne ist schwierig');
    }
    if (userContext.bathroom_issue.includes('toilet_standing')) {
      needs.push('Aufstehen von der Toilette ist schwierig');
    }
    if (userContext.bathroom_issue.includes('grab_bars')) {
      needs.push('Braucht Haltegriffe');
    }
  }
  
  const result = needs.length > 0 ? '- ' + needs.join('\n- ') : 'Keine spezifischen Angaben';
  console.log('[extractUserNeeds] Extracted needs count:', needs.length, 'Result:', result);
  return result;
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
  
  // Build Konstruktionsmerkmale section (technical details from API)
  let konstruktionsmerkmaleText = '';
  if (product.konstruktionsmerkmale && product.konstruktionsmerkmale.length > 0) {
    const freitextField = product.konstruktionsmerkmale.find(m => m.label === 'Freitext');
    const otherFields = product.konstruktionsmerkmale.filter(m => m.label !== 'Freitext');
    
    if (freitextField) {
      konstruktionsmerkmaleText += `\nTECHNISCHE BESCHREIBUNG:\n${freitextField.value}`;
    }
    if (otherFields.length > 0) {
      konstruktionsmerkmaleText += `\n\nSPEZIFIKATIONEN:\n${otherFields.map(m => `- ${m.label}: ${m.value}`).join('\n')}`;
    }
  }
  
  // Build Merkmale section if available (from list endpoint)
  let merkmaleText = '';
  if (product.merkmale && product.merkmale.length > 0) {
    merkmaleText = `\nMERKMALE & AUSSTATTUNG:\n${product.merkmale.map(m => `- ${m}`).join('\n')}`;
  }
  
  // Add Produktart if available
  const produktartText = product.produktart ? `\nProduktart: ${product.produktart}` : '';
  
  // Add available Ausführungen if present
  const ausfuehrungenText = product.typenAusfuehrungen && product.typenAusfuehrungen.length > 0
    ? `\nVerfügbare Ausführungen: ${product.typenAusfuehrungen.join(', ')}`
    : '';
  
  // Add Nutzungsdauer if available
  const nutzungsdauerText = product.nutzungsdauer
    ? `\nNutzungsdauer: ${product.nutzungsdauer}`
    : '';
  
  const prompt = `Du bist Experte für ${expertRole}. Vergleiche dieses Produkt mit den Anforderungen des Nutzers.

NUTZER-SITUATION:
${userNeeds}

PRODUKT:
${productName}
${deviceType ? `Typ: ${deviceType}` : ''}${produktartText}${konstruktionsmerkmaleText}${merkmaleText}${ausfuehrungenText}${nutzungsdauerText}

Erkannte Eigenschaften:
${deviceCapabilities}

Hersteller: ${manufacturer}

AUFGABE (max. 80 Wörter):
1. EIGNUNG (1 Satz): Bewerte die Passung zu den Nutzer-Anforderungen oben - "Sehr gut geeignet" / "Gut geeignet" / "Eingeschränkt geeignet"
2. WARUM PASSEND (2-3 Punkte): Welche Produkteigenschaften erfüllen die Nutzer-Anforderungen?
3. UNTERSCHIEDE (optional, 1-2 Punkte): Was bietet das Produkt anders als gewünscht?

WICHTIG:
- NUTZE NUR die "TECHNISCHE BESCHREIBUNG" und "SPEZIFIKATIONEN" oben
- NIEMALS Features erfinden oder annehmen! 
  * FALSCH: "faltbar (da Aluminiumrohr)" - Material bedeutet NICHT automatisch faltbar!
  * FALSCH: "höhenverstellbar" wenn nur "ablängen" oder "durch Ablängen" steht - das ist NICHT verstellbar!
- Wenn "höhenanpassbar durch Ablängen" steht: Erwähne explizit "nur durch Ablängen, nicht einfach verstellbar"

STIL: Einfache Sprache für Senioren. Direkt und sachlich. Keine Begrüßung. Keine Sternchen. Keine Ratschläge zu nächsten Schritten.`;

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
  const { extractAllFields, discoverAllFields } = await import('../utils/fieldExtractor');
  
  // Detect both category AND subcategory
  const { category, subcategory } = detectProductDetails(products);
  
  // Build expert role with subcategory
  let expertRole = 'Hilfsmittel';
  if (category === 'hearing') {
    expertRole = subcategory ? `Hörgeräte (speziell ${subcategory})` : 'Hörgeräte';
  } else if (category === 'mobility') {
    expertRole = subcategory ? `Gehhilfen (speziell ${subcategory})` : 'Gehhilfen';
  } else if (category === 'vision') {
    expertRole = subcategory ? `Sehhilfen (speziell ${subcategory})` : 'Sehhilfen';
  } else if (category === 'bathroom') {
    expertRole = subcategory ? `Badehilfen (speziell ${subcategory})` : 'Badehilfen';
  }
  
  // STEP 1: Discover ALL available fields from products
  console.log('[AI] Step 1: Discovering all available fields from konstruktionsmerkmale');
  const discoveredFields = discoverAllFields(products, category);
  
  // Get subcategory-specific static fields
  const staticFields = getComparisonFieldsForProducts(products, category);
  
  // Use discovered fields (which includes everything) for extraction
  const allFields = discoveredFields.length > staticFields.length ? discoveredFields : staticFields;
  
  console.log(`[AI] Using ${allFields.length} fields for extraction (${staticFields.length} static, ${discoveredFields.length} discovered)`);
  
  // STEP 2: Extract directly from konstruktionsmerkmale
  console.log('[AI] Step 2: Extracting fields directly from konstruktionsmerkmale');
  const directlyExtracted = products.map(product => ({
    code: product.produktartNummer || product.zehnSteller,
    name: product.bezeichnung || product.name,
    specs: extractAllFields(product, allFields, category),
    konstruktionsmerkmale: product.konstruktionsmerkmale || product._preloadedDetails?.konstruktionsmerkmale || []
  }));
  
  console.log('[AI] Directly extracted specs:', directlyExtracted);
  
  // STEP 3: Identify missing fields (where all products have "Nicht angegeben")
  const missingFields = allFields.filter(field => {
    return directlyExtracted.every(p => 
      p.specs[field.key] === 'Nicht angegeben' || !p.specs[field.key]
    );
  });
  
  console.log('[AI] Missing fields that need AI search:', missingFields.map(f => f.label));
  
  // STEP 4: Build comparison prompt for missing fields OR just generate recommendation
  const userNeeds = extractUserNeeds(userContext);
  
  console.log('[AI] User context received:', userContext);
  console.log('[AI] Extracted user needs:', userNeeds);
  
  // Build product info for AI prompt (only if we need AI for missing fields or recommendation)
  const productsInfo = products.map((product, idx) => {
    const name = product?.bezeichnung || 'Produkt';
    const code = product?.produktartNummer || product?.code;
    const extractedSpecs = directlyExtracted[idx].specs;
    const konstruktionsmerkmale = directlyExtracted[idx].konstruktionsmerkmale || [];
    
    // Show what we already extracted
    const extractedText = Object.entries(extractedSpecs)
      .filter(([, value]) => value !== 'Nicht angegeben')
      .map(([key, value]) => {
        const field = allFields.find(f => f.key === key);
        return `- ${field?.label || key}: ${value}`;
      })
      .join('\n');
    
    // Include FULL konstruktionsmerkmale for AI context
    const kmText = konstruktionsmerkmale
      .filter(m => m.label && m.value)
      .map(m => `- ${m.label}: ${m.value}`)
      .join('\n');
    
    return `
PRODUKT ${idx + 1}: ${name}
Code: ${code}
Hersteller: ${product?.hersteller || 'Unbekannt'}

KONSTRUKTIONSMERKMALE (Vollständig):
${kmText || 'Keine verfügbar'}

BEREITS EXTRAHIERTE DATEN:
${extractedText || 'Keine Daten direkt verfügbar'}
${missingFields.length > 0 ? `\nNOCH FEHLENDE DATEN (bitte im Internet suchen):\n${missingFields.map(f => `- ${f.label}`).join('\n')}` : ''}`;
  }).join('\n\n');
  
  // Build AI prompt - simplified since we already have most data
  const prompt = `Du bist Experte für ${expertRole}. 

NUTZER-BEDÜRFNISSE:
${userNeeds}

PRODUKTE ZUM VERGLEICHEN:
${productsInfo}

AUFGABE:
${missingFields.length > 0 ? 
  `1. Suche im Internet nach den NOCH FEHLENDEN DATEN für jedes Produkt anhand der Hilfsmittelnummern (Codes).
2. Erstelle eine Empfehlung basierend auf den vorhandenen und gefundenen Daten.` :
  `Erstelle eine Empfehlung basierend auf den bereits vorhandenen Daten.`}

Antworte mit einem JSON-Objekt in DIESEM EXAKTEN FORMAT:

{
  "products": [
    {
      "code": "${products[0]?.produktartNummer || products[0]?.code}",
      "specs": {
        ${missingFields.map(s => `"${s.key}": "Wert hier oder 'Nicht angegeben'"`).join(',\n        ')}
      }
    },
    {
      "code": "${products[1]?.produktartNummer || products[1]?.code}",
      "specs": {
        ${missingFields.map(s => `"${s.key}": "Wert hier oder 'Nicht angegeben'"`).join(',\n        ')}
      }
    }
  ],
  "recommendation": {
    "best_choice": "Welches Produkt passt am besten und warum? (konkrete technische Unterschiede nennen)",
    "alternative": "Wann wäre das andere Produkt besser?",
    "key_difference": "Was ist der Hauptunterschied für den Nutzer?"
  }
}

WICHTIG:
- JSON MUSS VALIDE sein
- Für fehlende Daten: Suche im Internet nach den Hilfsmittelnummern
- Wenn NICHT gefunden: "Nicht angegeben"
- NIEMALS RATEN! Nur eindeutig dokumentierte Werte angeben
- Recommendation in einfacher Sprache für Senioren (max. 2-3 Sätze pro Feld)
- Nutze die BEREITS EXTRAHIERTEN DATEN aus der Produktbeschreibung oben für den Vergleich`;

  try {
    console.log('[AI] Generating structured comparison with specs for:', expertRole);
    console.log('[AI] Full prompt being sent to AI:');
    console.log(prompt.substring(0, 1000) + '...');
    
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
          temperature: 0.3,  // Lower for more structured output
          maxOutputTokens: 2000,  // Increased for JSON response with specs
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
    const analysisText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!analysisText) {
      console.error('[AI] No comparison text in response:', data);
      throw new Error('No comparison text generated');
    }
    
    console.log('[AI] Comparison response received, length:', analysisText.length);
    
    // STEP 4: Parse AI response and merge with direct extraction
    let aiParsed = null;
    try {
      // Extract JSON from response (it might have markdown code blocks)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiParsed = JSON.parse(jsonMatch[0]);
        console.log('[AI] Successfully parsed JSON response');
      }
    } catch (parseError) {
      console.error('[AI] Failed to parse JSON response:', parseError);
    }
    
    // STEP 5: Merge direct extraction (priority) with AI results (fallback)
    const finalProducts = directlyExtracted.map((extracted, idx) => {
      const aiProduct = aiParsed?.products?.[idx];
      const mergedSpecs = { ...extracted.specs }; // Start with direct extraction
      
      // Add AI-found values for missing fields
      if (aiProduct?.specs) {
        for (const field of missingFields) {
          if (aiProduct.specs[field.key] && aiProduct.specs[field.key] !== 'Nicht angegeben') {
            mergedSpecs[field.key] = aiProduct.specs[field.key];
            console.log(`[AI] Filled missing field "${field.label}" for product ${extracted.code}: ${aiProduct.specs[field.key]}`);
          }
        }
      }
      
      return {
        code: extracted.code,
        name: extracted.name,
        specs: mergedSpecs
      };
    });
    
    // Build final result object
    const result = {
      products: finalProducts,
      recommendation: aiParsed?.recommendation || {
        best_choice: 'Beide Produkte sind von der GKV erstattungsfähig. Vergleichen Sie die technischen Daten in der Tabelle.',
        alternative: 'Sprechen Sie mit Ihrem Arzt oder Sanitätshaus über Ihre spezifischen Bedürfnisse.',
        key_difference: 'Siehe Vergleichstabelle unten für Details.'
      }
    };
    
    console.log('[AI] Final merged result:', result);
    
    trackEvent('ai_comparison_generated', { 
      productCount: products.length,
      category: category,
      subcategory: subcategory,
      directlyExtractedFields: allFields.length - missingFields.length,
      aiSearchedFields: missingFields.length,
      success: true 
    });
    
    return result;
  } catch (error) {
    logError('ai_comparison_failed', error);
    console.error('[AI] Comparison error:', error);
    
    // Return direct extraction only if AI fails
    return {
      products: directlyExtracted,
      recommendation: {
        best_choice: 'Beide Produkte sind von der GKV erstattungsfähig.',
        alternative: 'Vergleichen Sie die technischen Daten in der Tabelle unten.',
        key_difference: 'Sprechen Sie mit Ihrem Arzt für eine persönliche Empfehlung.'
      }
    };
  }
}
