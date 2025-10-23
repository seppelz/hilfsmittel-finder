import { logError } from '../utils/analytics';

const isBrowser = typeof window !== 'undefined';
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/proxy';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const API_VERSION_ENDPOINT = `${API_BASE}/Version`;
const STORAGE_KEY = 'gkv_hilfsmittel_cache';
const STORAGE_VERSION_KEY = 'gkv_hilfsmittel_api_version';

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
      productsByGroup: {},
      lastUpdate: null,
      apiVersion: null,
    };
    this.versionPromise = null;

    if (isBrowser) {
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
    this.cache.productsByGroup = {};
    this.cache.lastUpdate = null;
    this.cache.apiVersion = newVersion;
  }

  async ensureLatestVersion() {
    if (!isBrowser) return true;
    if (this.versionPromise) return this.versionPromise;

    this.versionPromise = (async () => {
      try {
        const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
        if (storedVersion && !this.cache.apiVersion) {
          this.cache.apiVersion = storedVersion;
        }

        const response = await this.fetchWithRetry(API_VERSION_ENDPOINT, 2);
        const remoteVersion = response?.version ?? response?.apiVersion ?? null;

        if (!remoteVersion) {
          return true;
        }

        if (this.cache.apiVersion && this.cache.apiVersion === remoteVersion) {
          return true;
        }

        this.resetCache(remoteVersion);
        this.saveToCache();
        return true;
      } catch (error) {
        logError('gkv_api_version_check_failed', error);
        return false;
      } finally {
        this.versionPromise = null;
      }
    })();

    return this.versionPromise;
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

    if (this.cache.productGroups && this.isCacheValid()) {
      return this.cache.productGroups;
    }

    try {
      const data = await this.fetchWithRetry(`${API_BASE}/VerzeichnisTree/1`);
      this.cache.productGroups = data;
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

  async fetchProductsByGroup(groupId) {
    await this.ensureLatestVersion();

    if (this.cache.productsByGroup[groupId] && this.isCacheValid()) {
      return this.cache.productsByGroup[groupId];
    }

    try {
      const data = await this.fetchWithRetry(`${API_BASE}/Produkt?produktgruppe=${groupId}`);
      this.cache.productsByGroup[groupId] = data;
      this.saveToCache();
      return data;
    } catch (error) {
      if (this.cache.productsByGroup[groupId]) {
        console.warn('Using cached products due to API error');
        return this.cache.productsByGroup[groupId];
      }
      throw error;
    }
  }

  async fetchProductsPaginated(groupId, page = 1, pageSize = 20) {
    await this.ensureLatestVersion();
    const data = await this.fetchProductsByGroup(groupId);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      products: data.slice(start, end),
      total: data.length,
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

    const allProducts = [];

    for (const groupId of groups) {
      const groupProducts = await this.fetchProductsByGroup(groupId);
      allProducts.push(...groupProducts.map((product) => ({ ...product, _groupId: groupId })));
    }

    const sortedProducts = allProducts.sort((a, b) => {
      const aCode = a.produktartNummer || a.code || a.bezeichnung || '';
      const bCode = b.produktartNummer || b.code || b.bezeichnung || '';
      return aCode.localeCompare(bCode, 'de');
    });

    const total = sortedProducts.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    const products = sortedProducts.slice(start, end);

    return {
      products,
      total,
      page: safePage,
      pageSize,
      totalPages,
    };
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
