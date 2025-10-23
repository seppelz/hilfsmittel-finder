import { logError } from '../utils/analytics';

const isBrowser = typeof window !== 'undefined';
const apiUrl = (path) => `${API_BASE}?path=${encodeURIComponent(`api/verzeichnis/${path}`)}`;

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/proxy';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const API_VERSION_ENDPOINT = null;
const STORAGE_KEY = 'gkv_hilfsmittel_cache';
const STORAGE_VERSION_KEY = 'gkv_hilfsmittel_api_version';
const CACHE_SCHEMA_VERSION = '2025-10-23-guid-products';

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
    normalizeString(product.erleuterungstext),
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

  return normalizedProduct;
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

    const guid = this.cache.xStellerToGuid?.[groupId];

    try {
      let response;
      let fetchError = null;

      // Try GUID-based request first
      if (guid) {
        try {
          response = await this.fetchWithRetry(
            apiUrl(`Produkt?produktgruppe=${guid}&skip=0&take=${safeLimit}&$count=true`),
          );
        } catch (error) {
          console.warn(`[gkvApi] GUID-based fetch failed for ${groupId} (${guid}), trying xSteller fallback`);
          fetchError = error;
        }
      }

      // Fallback to produktgruppennummer if GUID failed or not available
      if (!response) {
        try {
          response = await this.fetchWithRetry(
            apiUrl(`Produkt?produktgruppennummer=${groupId}&skip=0&take=${safeLimit}&$count=true`),
          );
        } catch (error) {
          console.warn(`[gkvApi] xSteller-based fetch also failed for ${groupId}`);
          throw fetchError || error;
        }
      }

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

  async searchProducts(criteria, options = {}) {
    await this.ensureLatestVersion();
    if (!criteria) return { products: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };

    const { page = 1, pageSize = 20 } = options;

    const groupsSource = Array.isArray(criteria.productGroups) ? criteria.productGroups : [];
    const mappedGroups = this.mapCriteriaToGroups(criteria.filters ?? criteria);
    const groups = [...new Set([...(groupsSource ?? []), ...mappedGroups])];

    if (groups.length === 0) {
      return { products: [], total: 0, page, pageSize, totalPages: 1 };
    }

    // Fixed: Fetch ALL products from all groups (up to 500 per group)
    // Then paginate the combined results
    const perGroupTake = Math.min(500, pageSize * 10); // Enough for multiple pages
    const productMap = new Map();

    for (const groupId of groups) {
      const { items } = await this.fetchProductsByGroup(groupId, { limit: perGroupTake });

      items.forEach((product) => {
        const productId = product.id || product.produktId || product.zehnSteller || product.displayName;
        if (!productId || productMap.has(productId)) return;
        productMap.set(productId, { ...product, _groupId: groupId });
      });
    }

    // CRITICAL FIX: Filter products to only show categories that were asked about
    // This prevents infusion tubes (03.29) from appearing in hearing searches (13.20)
    const allowedCategories = this.extractAllowedCategories(groups);
    
    // Always log for debugging (even in production)
    console.log('🔍 [gkvApi.searchProducts] Groups queried:', groups);
    console.log('🔍 [gkvApi.searchProducts] Allowed categories:', allowedCategories);
    console.log('🔍 [gkvApi.searchProducts] Total products before filter:', productMap.size);
    
    const allProducts = Array.from(productMap.values());
    const relevantProducts = allProducts.filter(product => {
      const code = product.produktartNummer || product.code || '';
      if (!code) return false;
      
      // Check if product category matches any asked category
      return allowedCategories.some(category => code.startsWith(category));
    });
    
    console.log('✅ [gkvApi.searchProducts] Products after filter:', relevantProducts.length);

    const sortedProducts = relevantProducts.sort((a, b) => {
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

    return {
      products,
      total: totalUnique,
      page: safePage,
      pageSize,
      totalPages,
      categories: Array.from(categories.values()),
    };
  }

  getCategoryName(code) {
    // Comprehensive GKV Hilfsmittelverzeichnis category mapping
    const categoryMap = {
      // 01 - Absauggeräte
      '01': 'Absauggeräte',
      
      // 03 - Applikationshilfen
      '03.29': 'Applikationshilfen',
      
      // 04 - Badehilfen
      '04.40': 'Badehilfen',
      '04.41': 'Toilettenhilfen',
      
      // 05 - Bandagen
      '05': 'Bandagen',
      
      // 07 - Blindenhilfsmittel & Sehhilfen
      '07.03': 'Sehhilfen',
      '07.99': 'Hörhilfen',
      
      // 09 - Gehhilfen & Mobilitätshilfen
      '09.12': 'Gehhilfen',
      '09.24': 'Rollstühle',
      '09.40': 'Treppensteighilfen',
      
      // 10 - Einlagen
      '10.46': 'Einlagen',
      
      // 11 - Hilfsmittel zur Kompressionstherapie
      '11.11': 'Kompressionsstrümpfe',
      '11.31': 'Kompressionsbinden',
      
      // 12 - Hilfsmittel bei Tracheostoma
      '12.24': 'Tracheostoma-Hilfsmittel',
      
      // 13 - Hörhilfen
      '13.20': 'Hörgeräte',
      
      // 14 - Inhalations- und Atemtherapiegeräte
      '14': 'Inhalationsgeräte',
      
      // 15 - Inkontinenzhilfen
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
      
      // 25 - Sehhilfen
      '25.50': 'Lesehilfen',
      '25.56': 'Lupen',
      
      // 26 - Sitzhilfen
      '26': 'Sitzhilfen',
      
      // 29 - Stomaartikel
      '29.26': 'Stomabeutel',
      
      // 31 - Therapeutische Bewegungsgeräte
      '31.03': 'Bewegungsgeräte',
      
      // 32 - Pflegeartikel
      '32.99': 'Pflegehilfsmittel',
      
      // 33 - Urinale
      '33.40': 'Urinflaschen',
      
      // 50 - Hilfsmittel gegen Dekubitus
      '50.45': 'Dekubitus-Hilfsmittel',
      
      // 51 - Inkontinenz
      '51.40': 'Inkontinenzvorlagen',
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
      walker: ['09.12'],
      walker_needed: ['09.12'],
      rollator: ['09.12.02'],
      wheelchair_needed: ['09.24'],
      fulltime: ['09.24.01'],
      stairs: ['09.40'],
      shower_chair: ['04.40.04'],
      bath_lift: ['04.40'],
      toilet_seat: ['04.41'],
      grab_bars: ['04.40.01'],
      hearing_aid: ['07.99'],
      severity: ['07.99'],
      magnifier: ['25.50'],
      lighting: ['25.56'],
      vision_aids: ['25'],
      incontinence: ['51.40'],
      compression: ['11.31'],
      care_beds: ['18.50'],
      measurement: ['22.50', '22.51'],
      indoor: ['09.12', '09.24'],
      outdoor: ['09.12.02', '09.24'],
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
    return this.fetchWithRetry(`${API_BASE}/Produkt/${productId}`);
  }
}

export const gkvApi = new GKVApiService();
