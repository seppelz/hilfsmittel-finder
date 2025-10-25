# Removed Products Handling (`istHerausgenommen`)

**Last Updated**: October 25, 2025  
**Status**: Implemented and Active

---

## What is `istHerausgenommen`?

In the GKV Hilfsmittelverzeichnis (German statutory health insurance aids directory), the field **`istHerausgenommen`** indicates whether a product has been **removed** from the active directory.

### Values:
- **`istHerausgenommen: true`** → Product has been officially removed from the directory
- **`istHerausgenommen: false`** → Product is still actively listed

---

## Why This Matters

Products marked as "removed" (`istHerausgenommen: true`):
- ❌ **Are NOT eligible** for standard GKV reimbursement
- ❌ **Should NOT be shown** to users in search results
- ❌ **Cannot be prescribed** through the normal catalog
- ⚠️ May only qualify in exceptional cases based on specific medical/legal criteria

**Bottom line**: We must filter these products out to avoid showing users unavailable options.

---

## Current Implementation

### 1. **Data Fetching** (`scripts/fetch-products.js`)

Products are filtered at the source when fetching from the API:

```javascript
// Filter out removed products (istHerausgenommen: true)
const activeProducts = products.filter(product => {
  return !product.istHerausgenommen;
});
```

**Result**: 
- `public/products.json` contains ONLY active products
- Saves storage space (~2-5% smaller file)
- Metadata tracks how many were removed

**Log output**:
```
✅ Fetched 63,247 products (including removed)
🗑️  Filtered out 2,134 removed products (istHerausgenommen: true)
✅ Keeping 61,113 active products
```

---

### 2. **Runtime Filtering** (`src/services/gkvApi.js`)

**Two layers of protection**:

#### Layer 1: Normalization (Line 173)
```javascript
function normalizeProduct(product) {
  // Filter out removed products (not eligible for GKV reimbursement)
  if (product.istHerausgenommen === true) {
    console.log(`[GKV] Filtered out removed product: ${product.produktartNummer}`);
    return null;
  }
  // ... rest of normalization
}
```

**Result**: Removed products are rejected during data normalization and never make it into the cache.

#### Layer 2: Search Filtering (Line 681)
```javascript
const relevantProducts = allProducts.filter(product => {
  // Safety check: Skip removed products
  if (product.istHerausgenommen === true) {
    console.warn(`[GKV] Removed product found in database: ${product.zehnSteller}`);
    return false;
  }
  // ... rest of filtering
}
```

**Result**: Double-check during search to catch any that slipped through (logged as warning).

---

### 3. **UI Safety Indicator** (`src/components/ProductCard.jsx`)

If a removed product somehow gets displayed (shouldn't happen), we show a prominent warning:

```jsx
{isRemoved && (
  <div className="rounded-xl border-2 border-red-400 bg-red-50 px-4 py-3">
    <p className="font-bold text-red-900">⚠️ Produkt nicht mehr verfügbar</p>
    <p className="text-red-700">
      Dieses Produkt wurde aus dem GKV-Hilfsmittelverzeichnis entfernt 
      und ist nicht mehr für die Erstattung zugelassen.
    </p>
  </div>
)}
```

**Result**: Users are immediately warned if they see a removed product.

---

## Testing

### Manual Test
1. Find a product with `istHerausgenommen: true` in the raw API response
2. Verify it does NOT appear in `public/products.json`
3. Verify it does NOT appear in search results
4. Manually inject it into a result list (for testing)
5. Verify the red warning banner appears in ProductCard

### Automated Check
```javascript
// In browser console
const products = await fetch('/products.json').then(r => r.json());
const removedProducts = products.products.filter(p => p.istHerausgenommen);
console.log(`Found ${removedProducts.length} removed products (should be 0)`);
```

**Expected**: `Found 0 removed products`

---

## Monitoring

### Weekly Fetch Logs
Check GitHub Actions logs for the weekly product update:

```
🗑️  Filtered out 2,134 removed products (istHerausgenommen: true)
```

If this number suddenly changes significantly:
- ✅ Normal: Small fluctuations (±50) are expected
- ⚠️ Warning: Large increase (>500) may indicate mass product removal
- 🚨 Alert: Decrease to 0 may indicate API change or filtering failure

### Runtime Logs
Check browser console during product search:

```
[GKV] Filtered out removed product: 13.20.10.1234
```

- ✅ During normalization: Expected and working correctly
- ⚠️ During search filtering: Indicates a product slipped through normalization (investigate)

---

## Common Questions

### Q: Why filter twice (fetch + runtime)?
**A**: Defense in depth. The fetch-time filter saves space and bandwidth. The runtime filter protects against:
- Cached data from before the fetch-time filter was added
- Manual imports or data corruption
- API changes

### Q: Should we EVER show removed products?
**A**: No, unless you're building an admin/debugging interface. Regular users should NEVER see removed products as they cannot be reimbursed.

### Q: What if a user specifically needs a removed product?
**A**: They would need to work with their doctor and insurance for a special exemption. This is outside the scope of our app, which only shows standard catalog products.

### Q: Can removed products become active again?
**A**: Technically yes, but rare. If the GKV re-adds a product, `istHerausgenommen` would change back to `false` and it would automatically appear in the next weekly update.

---

## Related Files

- `scripts/fetch-products.js` - Filters at source
- `src/services/gkvApi.js` - Runtime filtering (2 layers)
- `src/components/ProductCard.jsx` - UI warning indicator
- `docs/GKV-API-COMPLETE-REFERENCE.md` - Full API documentation

---

## Future Improvements

1. **Analytics**: Track how often removed products are encountered (should be near-zero)
2. **Admin Panel**: Create a debug view showing removed products for analysis
3. **Historical Data**: Track which products were removed when (for research)

---

**Status**: ✅ Fully Implemented and Protected

Users will only see active products eligible for GKV reimbursement.

