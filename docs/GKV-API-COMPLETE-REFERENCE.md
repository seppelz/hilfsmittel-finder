# GKV API Complete Reference
**Source**: [bundesAPI/hilfsmittel-api Python Client Documentation](https://github.com/bundesAPI/hilfsmittel-api/blob/main/python-client/docs/)

## API Base URL
```
https://hilfsmittel-api.gkv-spitzenverband.de/api/verzeichnis
```

## Endpoints

### 1. `/Produkt` - ALL Products
```
GET /Produkt
```
**Description**: "Kompaktliste aller Produkte"  
**Warning**: ⚠️ Returns over 30MB of data!  
**Return Type**: `[Produkt]` (array of products)  
**Filtering**: ❌ NO filtering supported - returns ALL products

**Important**: This is why our `produktgruppennummer` parameter was ignored!

---

### 2. `/Produkt/{id}` - Single Product
```
GET /Produkt/{id}
```
**Description**: Details for a specific product  
**Parameter**: `id` (string) - Product GUID  
**Return Type**: `DetailProdukt`

---

### 3. `/Produktgruppe/{id}` - Product Group
```
GET /Produktgruppe/{id}
```
**Description**: Details for a Produktgruppe (2-digit level)  
**Parameter**: `id` (string) - Produktgruppe GUID  
**Return Type**: `Produktgruppe`

**Produktgruppe Properties**:
- `id`: ID of the product group
- `bezeichnung`: Name of the product group
- `nummer`: Number (first digits of 10-digit code)
- `definition`: Description text
- `indikation`: Indication
- `aufnahme_datum`: Date added
- `aenderungs_datum`: Last modified date

**⚠️ Note**: Documentation doesn't show a `products` or `produkte` array!

---

### 4. `/Untergruppe/{id}` - Subgroup
```
GET /Untergruppe/{id}
```
**Description**: Details for an Untergruppe (6-digit level)  
**Parameter**: `id` (string) - Untergruppe GUID  
**Return Type**: `Untergruppe`

**Untergruppe Properties**:
- `id`: ID of the subgroup
- `bezeichnung`: Name
- `sechs_steller`: 6-digit code
- `produktgruppe_id`: Parent product group ID
- `aufnahme_datum`: Date added
- `aenderungs_datum`: Last modified date

**⚠️ Note**: Documentation doesn't show a `products` array!

---

### 5. `/Produktart/{id}` - Product Type
```
GET /Produktart/{id}
```
**Description**: Details for a Produktart (7-digit level)  
**Parameter**: `id` (string) - Produktart GUID  
**Return Type**: `Produktart`

**Produktart Properties**:
- `id`: ID of the product type
- `bezeichnung`: Name
- `beschreibung`: Description
- `sieben_steller`: 7-digit code
- `untergruppe_id`: Parent subgroup ID
- `indikation`: Indication

**⚠️ Note**: Documentation doesn't show a `products` array!

---

### 6. `/VerzeichnisTree/{level}` - Tree Structure
```
GET /VerzeichnisTree/{level}
```
**Description**: Load all nodes in the product tree up to given level  
**Parameter**: `level` (integer) - Tree level (1-4)  
**Return Type**: `BaumKnoten` (tree node)

**BaumKnoten (Tree Node) Properties**:
- `id`: Node ID (GUID)
- `parent_id`: Parent node ID
- `display_value`: Node name
- `x_steller_display_value`: x-Steller description
- `x_steller`: x-Steller code (e.g., "13.20")
- `level`: Level in tree

---

## Data Models

### Produkt (Product)
```javascript
{
  "id": "guid",
  "zehn_steller": "13.20.12.1234",  // 10-digit code
  "name": "Product name",
  "display_name": "13.20.12.1234 - Product name",
  "produktart_id": "guid",  // Links to Produktart
  "hersteller_name": "Manufacturer",
  "artikelnummern": ["art1", "art2"],  // Article numbers
  "typen_ausfuehrungen": ["type1"],  // Types/variants
  "ist_herausgenommen": false,  // Is removed?
  "aufnahme_datum": "2023-01-01",
  "aenderungs_datum": "2024-01-01"
}
```

### DetailProdukt (Detailed Product)
Extended product with additional fields:
- All `Produkt` fields
- `kontruktionsmerkmale`: Construction features

---

## Hierarchy Structure

```
Level 1: Produktgruppe (2-digit, e.g., "13")
  └─ Level 2: Anwendungsort (4-digit, e.g., "13.20")
      └─ Level 3: Untergruppe (6-digit, e.g., "13.20.12")
          └─ Level 4: Produktart (7-digit, e.g., "13.20.12.1")
              └─ Products (10-digit, e.g., "13.20.12.1234")
```

---

## Critical Insights

### 1. `/Produkt` Has NO Filtering
The documentation explicitly states `/Produkt` returns "Kompaktliste aller Produkte" (compact list of ALL products).

**This explains why all our queries returned the same products** - the `produktgruppennummer` parameter doesn't exist and was ignored!

### 2. Hierarchical Endpoints Return Metadata Only?
The documented models for `Produktgruppe`, `Untergruppe`, and `Produktart` **do not include a products array**.

This suggests they return:
- ✅ Category metadata (name, description, dates)
- ❌ NOT a list of products

### 3. Products Link to Produktart
The `Produkt` model has a `produktart_id` field, which links each product to its category.

**Possible approach**:
1. Fetch ALL products from `/Produkt` (30MB, cache it)
2. Filter client-side by matching `produktart_id` or parsing `zehn_steller`

### 4. Tree Navigation Required
To map x-Steller codes (e.g., "13.20") to GUIDs, we must:
1. Fetch `/VerzeichnisTree/4`
2. Traverse nodes to find the desired category
3. Extract the `id` (GUID)
4. Use GUID for subsequent queries

---

## Two Possible Strategies

### Strategy A: Fetch ALL Products Once (Client-Side Filtering)
```javascript
// 1. Fetch complete product list (30MB, cache for 24h)
const allProducts = await fetch('/api/verzeichnis/Produkt');

// 2. Filter by zehn_steller prefix
const hearingAids = allProducts.filter(p => 
  p.zehn_steller?.startsWith('13.20')
);
```

**Pros**:
- ✅ Simple, no tree navigation needed
- ✅ Works with all categories
- ✅ Fast after initial load

**Cons**:
- ❌ Large initial download (30MB)
- ❌ All products at once, not paginated

### Strategy B: Tree Navigation + Hierarchical Endpoints (Test Needed)
```javascript
// 1. Fetch tree
const tree = await fetch('/api/verzeichnis/VerzeichnisTree/4');

// 2. Find node
const node = findNode(tree, '13.20');

// 3. Query endpoint (might return products?)
const result = await fetch(`/api/verzeichnis/Produktgruppe/${node.id}`);
```

**Pros**:
- ✅ Uses intended API structure
- ✅ Might return category-specific data

**Cons**:
- ❌ Documentation suggests no products returned
- ❌ More complex tree navigation
- ⚠️ Needs testing to confirm

---

## Test Priority

Our test tool will reveal:
1. ✅ Does `/Produktgruppe/{id}` return products (not documented)?
2. ✅ What's the actual response structure?
3. ✅ Should we use Strategy A (fetch all) or B (tree navigation)?

---

## Next Steps

1. **Run test tool**: `test-api-correct.html`
2. **Analyze response**: Does `/Produktgruppe/{id}` include products?
3. **Choose strategy**: 
   - If hierarchical endpoints work → Use Strategy B
   - If they don't → Use Strategy A (fetch all, filter client-side)
4. **Update app** with working approach

---

**Last Updated**: October 23, 2025  
**Documentation Source**: bundesAPI Python Client (official)

