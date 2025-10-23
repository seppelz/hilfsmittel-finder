# GKV API - Method Testing Strategy

## Problem Confirmed ✅

Your test results **definitively proved** that the API returns identical products for ALL category codes:
- 35 different codes tested (13.20, 09.12, 07.99, etc.)
- ALL returned the same 16 products
- Same samples: "Gehwagen ergoRehaE S", "Opn 2 CIC 85", "TF7-1 CIC 115/50"

**This means `produktgruppennummer` parameter is being IGNORED by the API.**

## bundesAPI Documentation Insights

From [https://github.com/bundesAPI/hilfsmittel-api](https://github.com/bundesAPI/hilfsmittel-api):

### x-Steller Hierarchy
- **2 digits**: Produktgruppe (e.g., `13`)
- **4 digits**: Anwendungsort (e.g., `13.20`)
- **6 digits**: Untergruppe (e.g., `13.20.12`)
- **7 digits**: Produktart (e.g., `13.20.12.1`)
- **10 digits**: Individual product (e.g., `13.20.12.1234`)

### Their Examples
```bash
# Get ALL products (no filtering shown!)
produkte=$(curl https://hilfsmittel-api.gkv-spitzenverband.de/api/verzeichnis/Produkt)

# Get tree structure
produktgruppen=$(curl https://hilfsmittel-api.gkv-spitzenverband.de/api/verzeichnis/VerzeichnisTree/1)

# Get specific product by GUID
produkt=$(curl https://hilfsmittel-api.gkv-spitzenverband.de/api/verzeichnis/Produkt/a7c4a796-6f96-42fb-971b-d2947549707d)
```

**Key observation**: No examples of filtering by category code!

## New Test Tool: 5 Alternative Methods

Created `public/test-api-methods.html` to systematically test different API access patterns:

### Method 1: Fetch ALL Products
```
GET /Produkt?$skip=0&$take=100&$count=true
```
- Get complete product list without filters
- Analyze product code distribution
- If there are thousands of products, this might not be practical
- But we can client-side filter by code prefix

### Method 2: VerzeichnisTree → GUID → Products
```
1. GET /VerzeichnisTree/4
2. Find category node (e.g., Hörgeräte with xSteller=13.20)
3. Extract GUID from node
4. GET /Produkt?produktgruppe={GUID}
```
- Use the tree structure to navigate properly
- Use GUIDs instead of x-Steller codes
- This is the "official" hierarchical approach

### Method 3: OData $filter Syntax
```
GET /Produkt?$filter=startswith(produktartNummer, '13.20')
GET /Produkt?$filter=contains(produktartNummer, '13.20')
GET /Produkt?$filter=produktartNummer eq '13.20.12.1234'
```
- The API might support OData filtering
- More sophisticated than simple query parameters

### Method 4: Exact Product Code Query
```
GET /Produkt?produktartNummer=13.20.12.1234
```
- Try querying by exact 10-digit product codes
- First get sample codes, then test retrieval

### Method 5: Tree Node Children
```
GET /VerzeichnisTree/4/{categoryGUID}
```
- Get children of a specific category node
- The tree might contain product references directly

## What We Expect to Find

### Best Case Scenario
- **Method 2 works**: Tree navigation + GUID-based queries return category-specific products
- This would mean we need to update our app to:
  1. Cache the tree structure
  2. Map x-Steller codes to GUIDs
  3. Use GUIDs for product queries

### Likely Scenario
- **Method 1 shows limited dataset**: The API only has a few hundred products total
- We can fetch all and filter client-side by product code prefix
- This would explain why our current approach doesn't work (parameter not needed for small dataset)

### Worst Case Scenario
- **Only individual product GUIDs work**: No category filtering supported
- We'd need to build a complete product index from the tree
- Or use alternative data sources

## Testing Workflow

1. **Deploy updated tool**:
   ```bash
   git add .
   git commit -m "feat: add comprehensive API method testing tool"
   git push
   ```

2. **Access in production**:
   - Go to: `https://your-app.vercel.app/test-api-methods.html`

3. **Run "Test All Methods" button**

4. **Analyze results**:
   - Which method returns category-specific products?
   - How many total products are in the database?
   - What's the actual structure we should use?

5. **Update application** based on findings:
   - If Method 2 works → Implement tree-based navigation
   - If Method 1 works → Implement client-side filtering
   - If nothing works → Consider alternative data sources

## Why Hörgeräte "Works"

Your app shows hearing aid results only because:
1. The API's unfiltered response includes ~16 mixed products
2. By pure luck, 2-3 of these are hearing aids (13.xx codes)
3. Your post-filter removes non-hearing-aid products
4. Users see 2-3 relevant results

For other categories:
- The random 16 products don't include those category types
- Post-filter removes everything
- Users see "No results"

## Next Steps

1. **Deploy** the new test tool
2. **Run tests** to find the correct API access method
3. **Share results** - specifically which method returns category-specific products
4. **Implement the working method** in the application
5. **Verify all categories** return correct products

---

**Created**: October 23, 2025  
**Status**: Ready for testing - awaiting deployment and results

