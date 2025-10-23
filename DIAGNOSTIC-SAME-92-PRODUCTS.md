# Diagnostic: Same 92 Products Issue

## Date: October 23, 2025

---

## 🐛 Critical Discovery

**User Report**: ALL categories return the SAME 92 products!

```
Hörgeräte: 92 products
Gehhilfen: 92 products  
Sehhilfen: 92 products
Badehilfen: 92 products

→ ALL THE SAME 92 PRODUCTS!
```

---

## 🔍 Root Cause Hypotheses

### Hypothesis A: Cache Corruption
**Theory**: The localStorage cache is corrupted and returning the same 92 products for all queries.

**Evidence**:
- Always exactly 92 products
- Regardless of category queried
- Suggests cached data being reused incorrectly

**Test**: Clear cache and retry

### Hypothesis B: API Returning Fallback Data
**Theory**: The GKV API is returning a default/fallback result set when queries fail or categories don't exist.

**Evidence**:
- API might not have data for categories `09.12`, `07`, `04.40`, etc.
- Returns same "sample" products as fallback
- Our category codes might be completely wrong

**Test**: Check API response logs

### Hypothesis C: GUID Mapping Wrong
**Theory**: All category codes map to the same GUID, so we're querying the same thing every time.

**Evidence**:
- GUID-based requests implemented recently
- Mapping might be broken
- All xSteller codes → same GUID

**Test**: Check GUID mapping logs

---

## ✅ Enhanced Diagnostic Logging Added

### What We'll See Now:

#### 1. Cache Status
```
🔍 [fetchProductsByGroup] Requesting group: 09.12, limit: 200, cached: true
✅ [fetchProductsByGroup] Using cached data for 09.12 (92 items)
```

#### 2. GUID Mapping
```
🔍 [fetchProductsByGroup] GUID for 09.12: a1b2c3d4-...
```

#### 3. API Requests
```
📡 [API] Fetching with GUID: /api/proxy/Produkt?produktgruppe=a1b2c3d4...
✅ [API] GUID fetch successful, got 92 products
```

#### 4. Product Breakdown
```
🔍 [gkvApi] Sample products from API: [
  { code: '13.20.12.1234', name: 'Hörgerät...', group: '13.20' },
  { code: '04.40.05.5678', name: 'Badehilfe...', group: '04.40' },
  ...
]

📊 [gkvApi] Products by category: {
  '13.20': 45,  // Hearing aids
  '04.40': 20,  // Bathroom aids
  '09.12': 15,  // Mobility aids
  '07.99': 12   // Vision aids
}
```

This will tell us EXACTLY what's wrong!

---

## 🚀 Testing Instructions

### Step 1: Clear Cache (Important!)
Open browser console and run:
```javascript
localStorage.clear();
location.reload();
```

### Step 2: Test Each Category

**A) Hörgeräte**:
1. Select "Hörgeräte"
2. Answer questions
3. **Copy ALL console logs** (Ctrl+A in console, Ctrl+C)
4. Share with me

**B) Gehhilfen**:
1. **Refresh page** (to start fresh)
2. Select "Gehhilfen"  
3. Answer questions
4. **Copy ALL console logs**
5. Share with me

**C) Note the Pattern**:
- Do you see "Using cached data" for both?
- Are the GUIDs the same or different?
- Are the API URLs the same or different?
- Does the "Products by category" breakdown change?

---

## 📊 Expected Outcomes

### Scenario A: Cache Corruption

**Logs will show**:
```
// First test (Hörgeräte):
📡 [API] Fetching with GUID: ...produktgruppe=GUID-A...
📊 Products by category: { '13.20': 45, '04.40': 20, ... }

// Second test (Gehhilfen):
✅ Using cached data for 09.12 (92 items)  ← Reusing cache!
📊 Products by category: { '13.20': 45, '04.40': 20, ... }  ← SAME!
```

**Solution**: Clear cache after each category change, or fix cache key to include category.

### Scenario B: API Returns Mixed Products

**Logs will show**:
```
// Hörgeräte:
📡 [API] Fetching: ...produktgruppe=GUID-A...
📊 Products by category: { '13.20': 92 }  ← Only hearing!

// Gehhilfen:
📡 [API] Fetching: ...produktgruppe=GUID-B...  ← Different GUID!
📊 Products by category: { '13.20': 45, '04.40': 20, '09.12': 15, ... }  ← Mixed!
```

**Solution**: API is returning mixed results. Post-filter is correct, we need it.

### Scenario C: All Map to Same GUID

**Logs will show**:
```
// Hörgeräte:
🔍 GUID for 13.20: a1b2c3d4-5678-...
📡 [API] Fetching: ...produktgruppe=a1b2c3d4...

// Gehhilfen:
🔍 GUID for 09.12: a1b2c3d4-5678-...  ← SAME GUID!
📡 [API] Fetching: ...produktgruppe=a1b2c3d4...  ← SAME URL!
```

**Solution**: GUID mapping is broken, all codes map to same GUID.

### Scenario D: Category Codes Don't Exist

**Logs will show**:
```
🔍 GUID for 09.12: NOT FOUND
📡 [API] Fetching with xSteller: ...produktgruppennummer=09.12...
⚠️ xSteller-based fetch also failed for 09.12
→ Using cached data (fallback to old cached products)
```

**Solution**: Category codes are completely wrong, API doesn't recognize them.

---

## 🎯 Likely Solution (Prediction)

Based on the pattern, I predict:

### Most Likely: Cache + API Mixed Results

1. First query (Hörgeräte) fetches 92 products from API
2. These 92 products are a MIX of categories (the API is broken or our query is too broad)
3. Cache stores these 92 products
4. Subsequent queries use cached data (same 92 products)
5. Post-filter was CORRECT in removing them, but now we have nothing

**Fix**:
```javascript
// Option 1: Don't cache mixed results
if (categoryCounts shows mix) {
  console.warn('API returned mixed categories, not caching');
  return without caching;
}

// Option 2: Fix the API query to be more specific
// Use different API endpoint or parameters

// Option 3: Accept mixed results, improve post-filter
// Filter by the actual category we want, not what we queried
```

---

## 📦 Build Status

✅ **Build successful**: 266.27 KB gzipped  
✅ **Enhanced logging added**:
  - Cache status
  - GUID mapping
  - API URLs
  - Product breakdown by category
✅ **Ready for comprehensive diagnostics**

---

## 🚀 Deployment

```bash
git add .
git commit -m "debug: comprehensive API and cache logging"
git push
```

---

## Next Steps

1. **Deploy** this build
2. **Clear cache**: `localStorage.clear()` in console
3. **Test Hörgeräte** - Copy ALL logs
4. **Refresh + Clear cache again**
5. **Test Gehhilfen** - Copy ALL logs
6. **Share logs with me**
7. **I'll identify the exact issue**
8. **Apply the correct fix**

The logs will reveal everything! 🔍

---

## Temporary Workaround (If Urgent)

If you need a quick fix right now:

```javascript
// Add to start of app
window.clearProductCache = () => {
  localStorage.removeItem('gkvApi_cache');
  console.log('Cache cleared!');
  location.reload();
};

// Then before each test:
// 1. Open console
// 2. Type: clearProductCache()
// 3. Test category
```

This ensures each test starts fresh.

---

## Summary

**Problem**: Same 92 products for all categories  
**Cause**: Unknown (cache? API? GUID mapping?)  
**Solution**: Comprehensive logging to diagnose  
**Status**: ✅ Ready to deploy and test  

**Once you share the logs, I'll know exactly what's wrong and fix it permanently!** 🎯

