import { logError } from '../utils/analytics';
import { decodeProduct } from '../utils/productDecoder';

const isBrowser = typeof window !== 'undefined';
const apiUrl = (path) => `${API_BASE}?path=${encodeURIComponent(`api/verzeichnis/${path}`)}`;

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/proxy';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for product list
const API_VERSION_ENDPOINT = null;
const STORAGE_KEY = 'gkv_hilfsmittel_cache';
const STORAGE_VERSION_KEY = 'gkv_hilfsmittel_api_version';
const CACHE_SCHEMA_VERSION = '2025-10-23-all-products-v2'; // NEW: Fetch all products approach
const ALL_PRODUCTS_KEY = 'gkv_all_products';
const ALL_PRODUCTS_TIMESTAMP_KEY = 'gkv_all_products_timestamp';

const PLACEHOLDER_NAMES = new Set(['nicht besetzt']);

function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const stringValue = String(value).trim();
  return stringValue.length ? stringValue : null;
}

function isPlaceholder(value) {
  if (!value) return false;
  return PLACEHOLDER_NAMES.has(value.toLowerCase());
}

function splitDisplayValue(value) {
  const normalized = normalizeString(value);
  if (!normalized) return { code: null, name: null };
  const [code, ...rest] = normalized.split(' - ');
  if (rest.length === 0) {
    return { code: null, name: normalized };
  }
  return { code: normalizeString(code), name: normalizeString(rest.join(' - ')) };
}

// NEW: IndexedDB storage helper (larger quota than localStorage)
const DB_NAME = 'gkv_hilfsmittel_db';
const DB_VERSION = 1;
const STORE_NAME = 'products';

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function getCachedProducts() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('all_products');
      
      request.onsuccess = () => {
        const data = request.result;
        if (data && data.timestamp) {
          const age = Date.now() - data.timestamp;
          if (age < CACHE_DURATION) {
            resolve(data.products);
          } else {
            resolve(null); // Expired
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.error('[GKV] IndexedDB error:', error);
    return null;
  }
}

async function setCachedProducts(products) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        products,
        timestamp: Date.now()
      }, 'all_products');
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error('[GKV] Failed to cache products:', request.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('[GKV] IndexedDB error:', error);
    return false;
  }
}

// NEW: Fetch all products and cache them
async function fetchAllProducts() {
  if (!isBrowser) return [];
  
  // Check IndexedDB cache first
  const cached = await getCachedProducts();
  if (cached) {
    console.log(`[GKV] Using cached products (${cached.length} products)`);
    return cached;
  }
  
  // Fetch from API
  console.log('[GKV] Fetching all products from API...');
  const startTime = Date.now();
  
  try {
    const response = await fetch(apiUrl('Produkt'));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const products = Array.isArray(data) ? data : (data.value || []);
    
    const endTime = Date.now();
    console.log(`[GKV] Fetched ${products.length} products in ${endTime - startTime}ms`);
    
    // Cache the results in IndexedDB
    await setCachedProducts(products);
    console.log('[GKV] Products cached in IndexedDB');
    
    return products;
  } catch (error) {
    console.error('[GKV] Failed to fetch products:', error);
    logError(error, 'fetchAllProducts');
    
    // Try to return any cached data as fallback
    const fallback = await getCachedProducts();
    if (fallback) {
      console.log('[GKV] Using expired cache as fallback');
      return fallback;
    }
    
    return [];
  }
}

function normalizeProduct(product) {
  if (!product || typeof product !== 'object') return null;
  if (product.istHerausgenommen) return null;

  const displayParts = splitDisplayValue(product.displayName);
  const nameCandidates = [
    normalizeString(product.bezeichnung),
    normalizeString(product.name),
    displayParts.name,
  ].filter(Boolean);

  const cleanName = nameCandidates.find((candidate) => !isPlaceholder(candidate));
  if (!cleanName) {
    return null;
  }

  const codeCandidates = [
    normalizeString(product.zehnSteller),
    normalizeString(product.produktartNummer),
    displayParts.code,
    normalizeString(product.code),
  ].filter(Boolean);
  const cleanCode = codeCandidates[0] ?? null;

  const manufacturer = normalizeString(
    product.hersteller ?? product.herstellerName ?? product.hersteller_bezeichnung,
  );

  const normalizedProduct = {
    ...product,
    bezeichnung: cleanName,
    name: cleanName,
  };

  if (cleanCode) {
    normalizedProduct.produktartNummer = cleanCode;
    normalizedProduct.zehnSteller = product.zehnSteller ?? cleanCode;
    normalizedProduct.code = product.code ?? cleanCode;
  }

  if (manufacturer) {
    normalizedProduct.hersteller = manufacturer;
  }

  // Try multiple fields for description
  const descriptionCandidates = [
    normalizeString(product.beschreibung),
    normalizeString(product.description),
    normalizeString(product.produktbeschreibung),
    normalizeString(product.indikation),
    normalizeString(product.anwendungsgebiet),
    normalizeString(Array.isArray(product.typenAusfuehrungen) && product.typenAusfuehrungen.length 
      ? product.typenAusfuehrungen.join(' | ') 
      : null),
  ].filter(Boolean);

  if (descriptionCandidates.length) {
    normalizedProduct.beschreibung = descriptionCandidates[0];
  }

  // Log missing descriptions for debugging (only in development)
  if (!normalizedProduct.beschreibung && !import.meta.env.PROD) {
    console.log('[gkvApi] Product missing description:', {
      name: cleanName,
      code: cleanCode,
      availableFields: Object.keys(product)
    });
  }

  // Extract Produktart
  if (product.produktart || product.Produktart) {
    normalizedProduct.produktart = product.produktart || product.Produktart;
  }

  // Extract Typen/Ausführungen (different product versions/types)
  if (Array.isArray(product.typenAusfuehrungen) && product.typenAusfuehrungen.length > 0) {
    normalizedProduct.typenAusfuehrungen = product.typenAusfuehrungen;
    if (!import.meta.env.PROD && cleanCode?.startsWith('10.')) {
      console.log('[gkvApi] ✅ Found', product.typenAusfuehrungen.length, 'Typen/Ausführungen for', cleanCode);
    }
  }

  // Extract Nutzungsdauer (usage duration/lifespan)
  if (product.nutzungsdauer) {
    normalizedProduct.nutzungsdauer = product.nutzungsdauer;
    if (!import.meta.env.PROD && cleanCode?.startsWith('10.')) {
      console.log('[gkvApi] ✅ Nutzungsdauer for', cleanCode, ':', product.nutzungsdauer);
    }
  }

  // Extract Technische Daten if available
  if (product.technischeDaten || product.technische_daten) {
    normalizedProduct.technischeDaten = product.technischeDaten || product.technische_daten;
  }

  // Add price normalization
  const price = normalizeString(
    product.preis ?? 
    product.price ?? 
    product.festbetrag ?? 
    product.hoechstbetrag
  );

  if (price) {
    normalizedProduct.preis = price;
  }

  return normalizedProduct;
}

/**
 * Filter products by features and score them based on match quality
 * @param {Array} products - Array of products to filter
 * @param {Object} criteria - Search criteria from questionnaire
 * @returns {Array} Filtered and scored products (top 200)
 */
function filterByFeatures(products, criteria) {
  try {
    // If no specific criteria, return all products
    if (!criteria || Object.keys(criteria).length === 0) {
      return products;
    }

    // Score each product based on criteria match
    const scoredProducts = products.map(product => {
      try {
        let score = 0;
        const decoded = decodeProduct(product);
        const productName = (product.bezeichnung || product.name || '').toLowerCase();
        const productDesc = (product.beschreibung || '').toLowerCase();
        const searchText = `${productName} ${productDesc}`;

        // Device type matching (high priority: +20 points)
        if (criteria.device_type) {
          const targetType = criteria.device_type.toLowerCase();
          if (decoded.deviceType && typeof decoded.deviceType === 'string' && decoded.deviceType.toLowerCase().includes(targetType)) {
            score += 20;
          }
          // Also check product name directly
          if (targetType === 'hdo' && searchText.includes('hinter dem ohr')) score += 15;
          if (targetType === 'ido' && (searchText.includes('im ohr') || searchText.includes('ido'))) score += 15;
        }

        // Feature matching (medium priority: +10 points each)
        if (criteria.rechargeable) {
          const hasFeature = (decoded.features && decoded.features.some(f => f.name === 'Wiederaufladbar')) ||
                            searchText.includes('wiederaufladbar') ||
                            searchText.includes('akku') ||
                            searchText.includes('lithium');
          if (hasFeature) score += 10;
        }

        if (criteria.bluetooth) {
          const hasFeature = (decoded.features && decoded.features.some(f => f.name === 'Bluetooth')) ||
                            searchText.includes('bluetooth') ||
                            searchText.includes('wireless') ||
                            searchText.includes('connect');
          if (hasFeature) score += 10;
        }

        if (criteria.automatic) {
          const hasFeature = searchText.includes('automatisch') ||
                            searchText.includes('auto') ||
                            searchText.includes('selbstanpassend');
          if (hasFeature) score += 10;
        }

        // Situation-based features (medium priority: +10 points each)
        if (criteria.noise_reduction) {
          const hasFeature = searchText.includes('geräusch') ||
                            searchText.includes('störschall') ||
                            searchText.includes('noise') ||
                            searchText.includes('richtwirkung');
          if (hasFeature) score += 10;
        }

        if (criteria.phone_compatible) {
          const hasFeature = searchText.includes('telefon') ||
                            searchText.includes('phone') ||
                            searchText.includes('telecoil');
          if (hasFeature) score += 10;
        }

        if (criteria.tv_compatible) {
          const hasFeature = searchText.includes('fernseh') ||
                            searchText.includes('tv') ||
                            searchText.includes('streaming');
          if (hasFeature) score += 10;
        }

        // Severity-based scoring (low priority: +5 points for appropriate devices)
        if (criteria.severity) {
          if (criteria.severity === 'severe' && searchText.includes('power')) score += 5;
          if (criteria.severity === 'mild' && (searchText.includes('basic') || searchText.includes('standard'))) score += 5;
        }

        // Gehhilfen / Mobility aid matching (category 10.xx)
        const productCode = product.zehnSteller || product.produktartNummer || product.code || '';
        const isGehhilfen = productCode.startsWith('10.');

        if (isGehhilfen && criteria.device_type) {
          const targetType = criteria.device_type.toLowerCase();
          
          // Device type matching (+20 points)
          if (targetType === 'gehstock' && (productName.includes('stock') || productName.includes('stab'))) score += 20;
          if (targetType === 'rollator' && productName.includes('rollator')) score += 20;
          if (targetType === 'gehwagen' && (productName.includes('wagen') || productName.includes('walker'))) score += 20;
          if (targetType === 'unterarmgehstuetzen' && (productName.includes('gehstütze') || productName.includes('krücke'))) score += 20;
          if (targetType === 'gehgestell' && (productName.includes('gestell') || productName.includes('gehbock'))) score += 20;
        }

        if (isGehhilfen) {
          // Feature matching (+10 points each)
          if (criteria.foldable && (productName.includes('faltbar') || productName.includes('klappbar'))) score += 10;
          if (criteria.adjustable && (productName.includes('höhenverstellbar') || productName.includes('verstellbar'))) score += 10;
          if (criteria.brakes && productName.includes('bremse')) score += 10;
          if (criteria.seat && (productName.includes('sitz') || productName.includes('sitzfläche'))) score += 10;
          if (criteria.basket && (productName.includes('korb') || productName.includes('tasche'))) score += 10;
          
          // Usage scenarios (+5 points each)
          if (criteria.indoor && (productName.includes('innen') || productName.includes('wohnung'))) score += 5;
          if (criteria.outdoor && (productName.includes('außen') || productName.includes('outdoor'))) score += 5;
          if (criteria.robust && (productName.includes('robust') || productName.includes('gelände'))) score += 5;
        }

        // Bonus for products with more features overall
        if (decoded.features && decoded.features.length >= 3) score += 5;

        return { product, score };
      } catch (error) {
        console.error('[GKV] Error scoring product:', product?.bezeichnung || 'unknown', error);
        return { product, score: 0 };
      }
    });

    // Sort by score (highest first) and return top 200
    const topProducts = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, 200)
      .map(item => item.product);

    console.log('[GKV] Smart filtering: Reduced', products.length, 'products to top', topProducts.length, 'matches');
    
    return topProducts;
  } catch (error) {
    console.error('[GKV] Smart filtering failed, returning all products:', error);
    return products.slice(0, 200); // Return first 200 as fallback
  }
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (error) {
    logError('gkv_cache_parse_failed', error);
    return null;
  }
}

const ERROR_MESSAGES = {
  network: 'Keine Internetverbindung. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
  api_down: 'Die Hilfsmitteldatenbank ist vorübergehend nicht erreichbar. Bitte versuchen Sie es in einigen Minuten erneut.',
};

class GKVApiService {
  constructor() {
    this.cache = {
      productGroups: null,
      xStellerToGuid: null,
      productsByGroup: {},
      lastUpdate: null,
      apiVersion: null,
    };
    this.versionPromise = null;

    if (isBrowser) {
      const storedSchema = localStorage.getItem(STORAGE_VERSION_KEY);
      if (storedSchema !== CACHE_SCHEMA_VERSION) {
        this.resetCache(CACHE_SCHEMA_VERSION);
        this.saveToCache();
      }
      this.loadFromCache();
    }
  }

  isCacheValid() {
    if (!this.cache.lastUpdate) return false;
    return Date.now() - this.cache.lastUpdate < CACHE_DURATION;
  }

  loadFromCache() {
    if (!isBrowser) return false;

    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const data = safeParse(cached);
        if (data) {
          this.cache = {
            productGroups: data.productGroups ?? null,
            xStellerToGuid: data.xStellerToGuid ?? null,
            productsByGroup: data.productsByGroup ?? {},
            lastUpdate: data.lastUpdate ?? null,
            apiVersion: data.apiVersion ?? null,
          };
          return this.isCacheValid();
        }
      }
    } catch (error) {
      logError('gkv_cache_load_failed', error);
    }
    return false;
  }

  saveToCache() {
    if (!isBrowser) return;

    try {
      this.cache.lastUpdate = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
      if (this.cache.apiVersion) {
        localStorage.setItem(STORAGE_VERSION_KEY, this.cache.apiVersion);
      }
    } catch (error) {
      logError('gkv_cache_save_failed', error);
    }
  }

  resetCache(newVersion = null) {
    this.cache.productGroups = null;
    this.cache.xStellerToGuid = null;
    this.cache.productsByGroup = {};
    this.cache.lastUpdate = null;
    this.cache.apiVersion = newVersion;
  }

  indexGroupTree(node, map = {}) {
    if (!node) return map;

    if (node.id && node.xSteller) {
      map[node.xSteller] = node.id;
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        this.indexGroupTree(child, map);
      }
    }

    return map;
  }

  async ensureLatestVersion() {
    if (!isBrowser) return true;
    return true;
  }

  async fetchWithRetry(url, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        const isLastAttempt = attempt === retries - 1;
        if (isLastAttempt) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }

    throw new Error(ERROR_MESSAGES.api_down);
  }

  async fetchProductGroups() {
    await this.ensureLatestVersion();

    if (this.cache.productGroups && this.cache.xStellerToGuid && this.isCacheValid()) {
      return this.cache.productGroups;
    }

    try {
      const data = await this.fetchWithRetry(apiUrl('VerzeichnisTree/4'));
      
      // Build xSteller -> GUID mapping from the tree
      const mapping = {};
      if (Array.isArray(data)) {
        for (const rootNode of data) {
          this.indexGroupTree(rootNode, mapping);
        }
      } else {
        this.indexGroupTree(data, mapping);
      }
      
      this.cache.productGroups = data;
      this.cache.xStellerToGuid = mapping;
      this.saveToCache();
      return data;
    } catch (error) {
      if (this.cache.productGroups) {
        console.warn('Using cached product groups due to API error');
        return this.cache.productGroups;
      }
      throw error;
    }
  }

  async fetchProductsByGroup(groupId, { limit } = {}) {
    await this.ensureLatestVersion();

    const safeLimit = Math.max(1, limit ?? 100);
    const cached = this.cache.productsByGroup[groupId];
    
    if (cached && cached.limit >= safeLimit && this.isCacheValid()) {
      return {
        items: cached.items.slice(0, safeLimit),
        total: cached.total,
      };
    }

    // Ensure tree is loaded to get GUID mappings
    if (!this.cache.xStellerToGuid) {
      await this.fetchProductGroups();
    }

    try {
      // CRITICAL FIX: GUID queries return wrong products (mixed categories)
      // Force use of xSteller (produktgruppennummer) which returns correct results
      const url = apiUrl(`Produkt?produktgruppennummer=${groupId}&skip=0&take=${safeLimit}&$count=true`);
      const response = await this.fetchWithRetry(url);

      const items = Array.isArray(response) ? response : response.value ?? [];
      const normalizedItems = items.map((item) => normalizeProduct(item)).filter(Boolean);
      const total = Array.isArray(response)
        ? normalizedItems.length
        : response.Count ?? response.count ?? response.total ?? normalizedItems.length;

      this.cache.productsByGroup[groupId] = {
        items: normalizedItems,
        total,
        limit: safeLimit,
        schemaVersion: CACHE_SCHEMA_VERSION,
      };
      this.saveToCache();

      return { items: normalizedItems, total };
    } catch (error) {
      if (cached) {
        console.warn('Using cached products due to API error');
        return {
          items: cached.items.slice(0, safeLimit),
          total: cached.total,
        };
      }
      throw error;
    }
  }

  async fetchProductsPaginated(groupId, page = 1, pageSize = 20) {
    await this.ensureLatestVersion();
    const take = Math.max(page * pageSize, pageSize);
    const { items, total } = await this.fetchProductsByGroup(groupId, { limit: take });
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      products: items.slice(start, end),
      total,
    };
  }

  async searchProducts(criteria, options = {}, selectedCategoryFilter = null, selectedFeatureFilters = []) {
    await this.ensureLatestVersion();
    if (!criteria) return { products: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };

    const { page = 1, pageSize = 20 } = options;

    const groupsSource = Array.isArray(criteria.productGroups) ? criteria.productGroups : [];
    const mappedGroups = this.mapCriteriaToGroups(criteria.filters ?? criteria);
    const groups = [...new Set([...(groupsSource ?? []), ...mappedGroups])];

    if (groups.length === 0) {
      return { products: [], total: 0, page, pageSize, totalPages: 1 };
    }

    // NEW APPROACH: Fetch ALL products from API and filter client-side
    console.log('[GKV] Searching with groups:', groups);
    if (selectedCategoryFilter) {
      console.log('[GKV] Category filter requested:', selectedCategoryFilter);
    }
    if (selectedFeatureFilters && selectedFeatureFilters.length > 0) {
      console.log('[GKV] Feature filters requested:', selectedFeatureFilters);
    }
    const allProducts = await fetchAllProducts();
    console.log('[GKV] Total products available:', allProducts.length);
    
    // Determine which category prefixes to filter for
    const allowedCategories = this.extractAllowedCategories(groups);
    console.log('[GKV] Allowed category prefixes:', allowedCategories);
    
    // Filter products by category
    const relevantProducts = allProducts.filter(product => {
      // Skip placeholders (already filtered in normalize, but double-check)
      if (product.istHerausgenommen) return false;
      
      const code = product.zehnSteller || '';
      if (!code) return false;
      
      // Check if product category matches any queried category
      return allowedCategories.some(category => code.startsWith(category));
    });
    
    console.log('[GKV] Filtered to', relevantProducts.length, 'relevant products');
    
    // DIAGNOSTIC: Check what codes actually exist in the database
    if (relevantProducts.length === 0 && allowedCategories.length > 0) {
      const prefix = allowedCategories[0].substring(0, 2); // e.g., "09" from "09.12"
      const codesWithPrefix = allProducts.filter(p => {
        const code = p.zehnSteller || '';
        return code.startsWith(prefix);
      });
      console.log(`[GKV] DIAGNOSTIC: Found ${codesWithPrefix.length} products with prefix "${prefix}"`);
      if (codesWithPrefix.length > 0) {
        console.log('[GKV] Sample codes:', codesWithPrefix.slice(0, 5).map(p => p.zehnSteller));
      } else {
        // Check what prefixes DO exist
        const prefixCounts = {};
        allProducts.forEach(p => {
          const code = p.zehnSteller || '';
          if (code) {
            const pre = code.substring(0, 2);
            prefixCounts[pre] = (prefixCounts[pre] || 0) + 1;
          }
        });
        const top10 = Object.entries(prefixCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        console.log('[GKV] Top 10 prefixes in database:', top10);
      }
    }

    // Normalize and sort products
    const normalizedProducts = relevantProducts
      .map(product => normalizeProduct(product))
      .filter(Boolean);
    
    // Apply smart filtering if we have many products (hearing aids with 27k+ products)
    let filteredProducts = normalizedProducts;
    const filters = criteria.filters ?? criteria;
    if (normalizedProducts.length > 1000 && filters) {
      console.log('[GKV] Smart filtering criteria:', filters);
      console.log('[GKV] Applying smart filtering for', normalizedProducts.length, 'products');
      filteredProducts = filterByFeatures(normalizedProducts, filters);
    }
    
    // Apply selected category filter BEFORE pagination
    if (selectedCategoryFilter) {
      const beforeFilterCount = filteredProducts.length;
      filteredProducts = filteredProducts.filter(product => {
        const code = product.zehnSteller || product.produktartNummer || product.code || '';
        return code.startsWith(selectedCategoryFilter);
      });
      console.log('[GKV] Category filter applied:', selectedCategoryFilter, '→', filteredProducts.length, 'products (from', beforeFilterCount, ')');
    }
    
    // Apply feature filters BEFORE pagination (for hearing aids)
    if (selectedFeatureFilters && selectedFeatureFilters.length > 0) {
      const beforeFilterCount = filteredProducts.length;
      filteredProducts = filteredProducts.filter(product => {
        const name = (product.bezeichnung || product.name || '').toUpperCase();
        
        return selectedFeatureFilters.every(feature => {
          switch (feature) {
            // Power levels
            case 'M': return name.includes(' M ') || name.includes('(M)') || name.includes(' M-');
            case 'HP': return name.includes(' HP') || name.includes('(HP');
            case 'UP': return name.includes(' UP') || name.includes('(UP');
            case 'SP': return name.includes(' SP') || name.includes('(SP');
            // Charging
            case 'R': return name.includes(' R ') || name.includes(' R-') || name.includes('-R ') || 
                            name.includes('LITHIUM') || name.includes('AKKU') || name.includes('WIEDERAUFLADBAR');
            // Device types
            case 'IIC': return name.includes('IIC');
            case 'CIC': return name.includes('CIC') && !name.includes('IIC');
            case 'ITC': return name.includes('ITC');
            case 'RIC': return name.includes('RITE') || name.includes('RIC');
            case 'BTE': return name.includes('BTE') || name.includes('HDO') || name.includes('HdO');
            // Connectivity
            case 'BLUETOOTH': return name.includes('BLUETOOTH') || name.includes('DIRECT') || name.includes('CONNECT');
            case 'T': return name.includes(' T ') || name.includes('-T ') || name.includes('(T)') || name.includes('TELECOIL');
            case 'AI': return name.includes(' AI ') || name.includes('-AI ') || name.includes('(AI)');
            // Gehhilfen device types
            case 'GEHSTOCK': return name.includes('STOCK') || name.includes('STAB');
            case 'ROLLATOR': return name.includes('ROLLATOR');
            case 'GEHWAGEN': return name.includes('WAGEN') || name.includes('WALKER');
            case 'GEHSTUETZEN': return name.includes('GEHSTÜTZE') || name.includes('KRÜCKE');
            // Gehhilfen features
            case 'FALTBAR': return name.includes('FALTBAR') || name.includes('KLAPPBAR');
            case 'HOEHENVERSTELLBAR': return name.includes('HÖHENVERSTELLBAR') || name.includes('VERSTELLBAR');
            case 'BREMSEN': return name.includes('BREMSE');
            case 'SITZFLAECHE': return name.includes('SITZ') || name.includes('SITZFLÄCHE');
            case 'KORB': return name.includes('KORB') || name.includes('TASCHE');
            case '4RAEDER': return name.includes('4 RÄDER') || name.includes('4-RÄDER');
            case '3RAEDER': return name.includes('3 RÄDER') || name.includes('3-RÄDER');
            default: return true;
          }
        });
      });
      console.log('[GKV] Feature filters applied:', selectedFeatureFilters, '→', filteredProducts.length, 'products (from', beforeFilterCount, ')');
    }
    
    const sortedProducts = filteredProducts.sort((a, b) => {
      const aCode = a.produktartNummer || a.code || a.bezeichnung || '';
      const bCode = b.produktartNummer || b.code || b.bezeichnung || '';
      return aCode.localeCompare(bCode, 'de');
    });

    const totalUnique = sortedProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalUnique / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    const products = sortedProducts.slice(start, end);

    // Extract unique categories from products for filtering
    const categories = new Map();
    sortedProducts.forEach((product) => {
      const code = product.produktartNummer || product.code || '';
      const categoryCode = code.split('.').slice(0, 2).join('.');  // e.g., "13.20" from "13.20.12.2189"
      
      if (categoryCode && !categories.has(categoryCode)) {
        const categoryName = this.getCategoryName(categoryCode);
        categories.set(categoryCode, {
          code: categoryCode,
          name: categoryName,
          count: sortedProducts.filter(p => {
            const pCode = p.produktartNummer || p.code || '';
            return pCode.startsWith(categoryCode);
          }).length
        });
      }
    });

    // Extract feature counts from ALL sorted products (not just current page)
    const featureCounts = {};
    sortedProducts.forEach(product => {
      const name = (product.bezeichnung || product.name || '').toUpperCase();
      
      // Power levels
      if (name.includes(' M ') || name.includes('(M)') || name.includes(' M-')) {
        featureCounts['M'] = (featureCounts['M'] || 0) + 1;
      }
      if (name.includes(' HP') || name.includes('(HP')) {
        featureCounts['HP'] = (featureCounts['HP'] || 0) + 1;
      }
      if (name.includes(' UP') || name.includes('(UP')) {
        featureCounts['UP'] = (featureCounts['UP'] || 0) + 1;
      }
      if (name.includes(' SP') || name.includes('(SP')) {
        featureCounts['SP'] = (featureCounts['SP'] || 0) + 1;
      }
      
      // Rechargeable
      if (name.includes(' R ') || name.includes(' R-') || name.includes('-R ') || 
          name.includes('LITHIUM') || name.includes('AKKU') || name.includes('WIEDERAUFLADBAR')) {
        featureCounts['R'] = (featureCounts['R'] || 0) + 1;
      }
      
      // Device types
      if (name.includes('IIC')) {
        featureCounts['IIC'] = (featureCounts['IIC'] || 0) + 1;
      }
      if (name.includes('CIC') && !name.includes('IIC')) {
        featureCounts['CIC'] = (featureCounts['CIC'] || 0) + 1;
      }
      if (name.includes('ITC')) {
        featureCounts['ITC'] = (featureCounts['ITC'] || 0) + 1;
      }
      if (name.includes('RITE') || name.includes('RIC')) {
        featureCounts['RIC'] = (featureCounts['RIC'] || 0) + 1;
      }
      if (name.includes('BTE') || name.includes('HDO') || name.includes('HdO')) {
        featureCounts['BTE'] = (featureCounts['BTE'] || 0) + 1;
      }
      
      // Connectivity
      if (name.includes('BLUETOOTH') || name.includes('DIRECT') || name.includes('CONNECT')) {
        featureCounts['BLUETOOTH'] = (featureCounts['BLUETOOTH'] || 0) + 1;
      }
      if (name.includes(' T ') || name.includes('-T ') || name.includes('(T)') || name.includes('TELECOIL')) {
        featureCounts['T'] = (featureCounts['T'] || 0) + 1;
      }
      if (name.includes(' AI ') || name.includes('-AI ') || name.includes('(AI)')) {
        featureCounts['AI'] = (featureCounts['AI'] || 0) + 1;
      }
      
      // Gehhilfen device types
      if (name.includes('STOCK') || name.includes('STAB')) {
        featureCounts['GEHSTOCK'] = (featureCounts['GEHSTOCK'] || 0) + 1;
      }
      if (name.includes('ROLLATOR')) {
        featureCounts['ROLLATOR'] = (featureCounts['ROLLATOR'] || 0) + 1;
      }
      if (name.includes('WAGEN') || name.includes('WALKER')) {
        featureCounts['GEHWAGEN'] = (featureCounts['GEHWAGEN'] || 0) + 1;
      }
      if (name.includes('GEHSTÜTZE') || name.includes('KRÜCKE') || name.includes('UNTERARM')) {
        featureCounts['GEHSTUETZEN'] = (featureCounts['GEHSTUETZEN'] || 0) + 1;
      }
      if (name.includes('GESTELL') || name.includes('GEHBOCK')) {
        featureCounts['GEHGESTELL'] = (featureCounts['GEHGESTELL'] || 0) + 1;
      }
      
      // Gehhilfen features
      if (name.includes('FALTBAR') || name.includes('KLAPPBAR')) {
        featureCounts['FALTBAR'] = (featureCounts['FALTBAR'] || 0) + 1;
      }
      if (name.includes('HÖHENVERSTELLBAR') || name.includes('VERSTELLBAR')) {
        featureCounts['HOEHENVERSTELLBAR'] = (featureCounts['HOEHENVERSTELLBAR'] || 0) + 1;
      }
      if (name.includes('BREMSE')) {
        featureCounts['BREMSEN'] = (featureCounts['BREMSEN'] || 0) + 1;
      }
      if (name.includes('SITZ') || name.includes('SITZFLÄCHE')) {
        featureCounts['SITZFLAECHE'] = (featureCounts['SITZFLAECHE'] || 0) + 1;
      }
      if (name.includes('KORB') || name.includes('TASCHE')) {
        featureCounts['KORB'] = (featureCounts['KORB'] || 0) + 1;
      }
      if (name.includes('4 RÄDER') || name.includes('4-RÄDER')) {
        featureCounts['4RAEDER'] = (featureCounts['4RAEDER'] || 0) + 1;
      }
      if (name.includes('3 RÄDER') || name.includes('3-RÄDER')) {
        featureCounts['3RAEDER'] = (featureCounts['3RAEDER'] || 0) + 1;
      }
    });

    console.log('[GKV] Returning', products.length, 'products for page', safePage);

    return {
      products,
      total: totalUnique,
      page: safePage,
      pageSize,
      totalPages,
      categories: Array.from(categories.values()),
      featureCounts, // Add feature counts from ALL products
    };
  }

  getCategoryName(code) {
    // Official GKV Hilfsmittelverzeichnis category mapping
    // Source: https://md-bund.de/fileadmin/dokumente/Publikationen/GKV/Begutachtungsgrundlagen_GKV/BGL_Hilfsmittel_240111.pdf
    const categoryMap = {
      // 01 - Absauggeräte
      '01': 'Absauggeräte',
      '01.01': 'Elektrische Absauggeräte',
      '01.02': 'Manuelle Absauggeräte',
      
      // 02 - Adaptionshilfen
      '02': 'Adaptionshilfen',
      '02.01': 'Adapter und Verbindungselemente',
      
      // 03 - Applikationshilfen
      '03': 'Applikationshilfen',
      '03.01': 'Inhalationshilfen',
      '03.02': 'Injektionshilfen',
      '03.29': 'Applikationshilfen',
      
      // 04 - Bade- und Duschhilfen
      '04': 'Bade- und Duschhilfen',
      '04.01': 'Badewannenbretter',
      '04.02': 'Duschhocker',
      '04.03': 'Haltegriffe',
      '04.40': 'Badehilfen',
      '04.40.01': 'Einstiegshilfen',
      '04.40.02': 'Badewannensitze',
      '04.40.03': 'Badewannenlifter',
      '04.40.04': 'Duschsitze',
      '04.41': 'Toilettenhilfen',
      
      // 05 - Bandagen
      '05': 'Bandagen',
      '05.01': 'Arm- und Beinbandagen',
      '05.02': 'Rückenbandagen',
      
      // 09 - Elektrostimulationsgeräte (NOT Gehhilfen!)
      '09': 'Elektrostimulationsgeräte',
      '09.01': 'Therapeutische Geräte',
      '09.02': 'Reizstromgeräte',
      
      // 10 - Gehhilfen (CORRECT CATEGORY FOR WALKING AIDS!)
      '10': 'Gehhilfen',
      '10.01': 'Gehstöcke',
      '10.02': 'Unterarmgehstützen',
      '10.03': 'Rollatoren',
      '10.04': 'Gehböcke',
      '10.05': 'Gehgestelle',
      '10.06': 'Gehwagen',
      '10.46': 'Einlagen',
      
      // 11 - Hilfsmittel zur Kompressionstherapie
      '11': 'Kompressionstherapie',
      '11.11': 'Kompressionsstrümpfe',
      '11.31': 'Kompressionsbinden',
      
      // 12 - Hilfsmittel bei Tracheostoma
      '12': 'Tracheostoma-Hilfsmittel',
      '12.24': 'Tracheostoma-Hilfsmittel',
      
      // 13 - Hörhilfen
      '13': 'Hörhilfen',
      '13.01': 'Luftleitungshörgeräte',
      '13.02': 'Knochenleitungshörgeräte',
      '13.03': 'Hörgeräte-Zubehör',
      '13.20': 'Hörgeräte',
      
      // 14 - Inhalations- und Atemtherapiegeräte
      '14': 'Inhalationsgeräte',
      
      // 15 - Inkontinenzhilfen
      '15': 'Inkontinenzhilfen',
      '15.01': 'Aufsaugende Hilfsmittel',
      '15.02': 'Ableitende Systeme',
      '15.03': 'Beckenboden-Therapiegeräte',
      '15.25': 'Inkontinenzartikel',
      
      // 16 - Kommunikationshilfen
      '16': 'Kommunikationshilfen',
      
      // 17 - Kranken-/Behindertenfahrzeuge
      '17.06': 'Krankenfahrzeuge',
      '17.18': 'Elektromobile',
      
      // 18 - Krankenpflegeartikel
      '18.50': 'Pflegebetten',
      '18.99': 'Krankenpflegeartikel',
      
      // 19 - Lagerungshilfen
      '19.40': 'Lagerungshilfen',
      '19.99': 'Lagerungskissen',
      
      // 20 - Messgeräte für Körperzustände/-funktionen
      '20': 'Körpermessgeräte',
      
      // 21 - Messgeräte
      '21.28': 'Blutdruckmessgeräte',
      '21.33': 'Blutzuckermessgeräte',
      
      // 22 - Mobilitätshilfen
      '22': 'Mobilitätshilfen',
      
      // 23 - Orthesen/Schienen
      '23.04': 'Armschienen',
      '23.12': 'Beinschienen',
      '23.14': 'Handschienen',
      
      // 24 - Prothesen
      '24.71': 'Beinprothesen',
      
      // 25 - Sehhilfen / Blindenhilfsmittel
      '25': 'Sehhilfen',
      '25.01': 'Brillengläser',
      '25.02': 'Kontaktlinsen',
      '25.03': 'Vergrößernde Sehhilfen',
      '25.21': 'Lupen',
      '25.22': 'Handlupen',
      '25.23': 'Standlupen',
      '25.24': 'Lupenleuchten',
      '25.50': 'Lesehilfen',
      '25.56': 'Lupen - Verschiedene',
      '25.99': 'Sehhilfen - Sonstige',
      
      // 26 - Sitzhilfen
      '26': 'Sitzhilfen',
      
      // 29 - Stomaartikel
      '29': 'Stomaartikel',
      '29.26': 'Stomabeutel',
      
      // 30 - Diabetes-Hilfsmittel / Glukosemanagement
      '30': 'Diabetes-Hilfsmittel',
      '30.01': 'Blutzuckermessgeräte',
      '30.02': 'Verbrauchsmaterialien',
      
      // 31 - Therapeutische Bewegungsgeräte
      '31.03': 'Bewegungsgeräte',
      
      // 32 - Pflegeartikel
      '32.99': 'Pflegehilfsmittel',
      
      // 33 - Urinale
      '33.40': 'Urinflaschen',
      
      // 50 - Pflegehilfsmittel zur Erleichterung der Pflege
      '50': 'Pflegehilfsmittel',
      '50.01': 'Bettschutze',
      '50.02': 'Pflegebetten',
      '50.45': 'Dekubitus-Hilfsmittel',
      
      // 51 - Inkontinenz
      '51': 'Inkontinenzhilfen',
      '51.40': 'Inkontinenzvorlagen',
      
      // 52 - Pflegehilfsmittel zur selbständigeren Lebensführung
      '52': 'Hilfsmittel für selbständige Lebensführung',
      '52.01': 'Greifhilfen',
      '52.02': 'Mobilitätshilfen',
      
      // 54 - Zum Verbrauch bestimmte Pflegehilfsmittel
      '54': 'Verbrauchsmaterialien Pflege',
      '54.01': 'Einmalhandschuhe',
      '54.02': 'Desinfektionsmittel',
    };
    
    // Try exact match first
    if (categoryMap[code]) {
      return categoryMap[code];
    }
    
    // Try two-digit prefix (e.g., "13" from "13.20")
    const prefix = code.split('.')[0];
    if (categoryMap[prefix]) {
      return categoryMap[prefix];
    }
    
    // Fallback to technical name
    return `Kategorie ${code}`;
  }

  extractAllowedCategories(groups) {
    // Convert product group codes to allowed category prefixes
    // This ensures we only show products from categories that were actually asked about
    const categories = new Set();
    
    groups.forEach(group => {
      // Extract category code (first 5 chars: "09.12", "13.20", etc.)
      if (group) {
        // For codes like "09.12.02", extract "09.12"
        const parts = group.split('.');
        if (parts.length >= 2) {
          categories.add(`${parts[0]}.${parts[1]}`);
        }
        // Also add the full group for exact matches
        categories.add(group);
      }
    });
    
    return Array.from(categories);
  }

  mapCriteriaToGroups(criteria = {}) {
    const groups = new Set();

    const addGroups = (value) => {
      if (!value) return;
      const values = Array.isArray(value) ? value : [value];
      values.filter(Boolean).forEach((group) => groups.add(group));
    };

    // Direct product group assignment
    if (Array.isArray(criteria.productGroups)) {
      addGroups(criteria.productGroups);
    }

    const mapping = {
      walker: ['10'],
      walker_needed: ['10'],
      rollator: ['10.03'],
      wheelchair_needed: ['22'],
      fulltime: ['22'],
      stairs: ['10'],
      shower_chair: ['04.40.04'],
      bath_lift: ['04.40'],
      toilet_seat: ['04.41'],
      grab_bars: ['04.40.01'],
      hearing_aid: ['13'],
      severity: ['13'],
      magnifier: ['25.50'],
      lighting: ['25.56'],
      vision_aids: ['25'],
      incontinence: ['51.40'],
      compression: ['11.31'],
      care_beds: ['18.50'],
      measurement: ['22.50', '22.51'],
      indoor: ['10'],
      outdoor: ['10'],
    };

    for (const [key, value] of Object.entries(criteria)) {
      if (value === undefined || value === null) continue;

      const mapped = mapping[key];
      if (!mapped) continue;

      if (typeof value === 'boolean' && !value) {
        continue;
      }

      if (Array.isArray(value)) {
        const truthy = value.filter(Boolean);
        if (!truthy.length) continue;
      }

      mapped.forEach((group) => groups.add(group));
    }

    return Array.from(groups);
  }

  async getProductDetails(productId) {
    // Use apiUrl helper to properly route through proxy
    return this.fetchWithRetry(apiUrl(`Produkt/${productId}`));
  }
}

export const gkvApi = new GKVApiService();
