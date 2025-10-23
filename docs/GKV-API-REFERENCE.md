# GKV API Reference

## Overview

This document contains verified information about the GKV-Spitzenverband Hilfsmittelverzeichnis API endpoints and response formats.

**Last Updated**: [TO BE FILLED AFTER TESTING]

## Base URL

```
https://hilfsmittelverzeichnis.gkv-spitzenverband.de/api/verzeichnis
```

**Proxy Endpoint** (used in application):
```
/api/proxy?path=api/verzeichnis/...
```

## Endpoints

### 1. Product Query by Category

**Endpoint**: `GET /Produkt`

**Parameters**:
- `produktgruppennummer` (string): Category code (e.g., "13.20")
- `skip` (number): Pagination offset (default: 0)
- `take` (number): Number of results (default: 20, max: 500)
- `$count` (boolean): Include total count (default: true)

**Example**:
```
GET /Produkt?produktgruppennummer=13.20&skip=0&take=20&$count=true
```

**Response Format**:
```json
{
  "value": [...],
  "count": 120,
  "@odata.count": 120
}
```

or plain array:
```json
[...]
```

### 2. Category Tree

**Endpoint**: `GET /VerzeichnisTree/4`

Returns the complete hierarchy of product categories.

**Response**: Array of category nodes with nested children.

## Verified Category Codes

> **Note**: Fill this section after running the test suite via `test-api.html`

### Working Codes (Verified)

#### Hörgeräte (Hearing Aids)
- **13.20**: ✅ Working (120+ products)
- Status: Confirmed

[TO BE FILLED WITH TEST RESULTS]

#### Gehhilfen (Mobility Aids)
[TO BE FILLED WITH TEST RESULTS]

#### Sehhilfen (Vision Aids)
[TO BE FILLED WITH TEST RESULTS]

#### Badehilfen (Bathroom Aids)
[TO BE FILLED WITH TEST RESULTS]

#### Diabetes
[TO BE FILLED WITH TEST RESULTS]

#### Inkontinenz (Incontinence)
[TO BE FILLED WITH TEST RESULTS]

#### Pflege (Care/Nursing)
[TO BE FILLED WITH TEST RESULTS]

## Response Format Details

### Product Object Structure

```typescript
interface Product {
  // Primary identifiers
  id?: string;
  produktId?: string;
  zehnSteller?: string;
  produktartNummer?: string;  // Product code (e.g., "13.20.12.1234")
  
  // Names and descriptions
  bezeichnung?: string;       // Primary name
  name?: string;              // Alternative name
  displayName?: string;
  beschreibung?: string;      // Description
  erleuterungstext?: string;  // Explanation text
  
  // Manufacturer
  hersteller?: string;
  herstellerName?: string;
  
  // Categorization
  produktgruppe?: string;     // GUID reference
  produktgruppennummer?: string; // xSteller code
  
  // Status
  istHerausgenommen?: boolean; // If true, product removed from catalog
  
  // Other fields vary by product type
}
```

### Common Patterns

1. **Product Count**:
   - Check `count`, `Count`, or `@odata.count`
   - Fallback to `value.length` or array length

2. **Product Array**:
   - Response might be `data.value` or direct array
   - Always check both formats

3. **Empty Results**:
   - Empty array: Category exists but no products
   - HTTP error: Category might not exist
   - Check response status and format

## Rate Limiting

- No official rate limits documented
- Recommendation: 200ms delay between requests
- Implemented in test tool to be safe

## Error Handling

### HTTP Status Codes

- **200 OK**: Success, products returned
- **204 No Content**: Category exists, no products
- **400 Bad Request**: Invalid parameters
- **404 Not Found**: Endpoint or category doesn't exist
- **500 Internal Server Error**: API error
- **502 Bad Gateway**: Proxy error (check GKV service status)

### Common Errors

1. **Category doesn't exist**: Returns empty array
2. **Invalid code format**: HTTP 400
3. **API down**: HTTP 502/503

## Testing Methodology

Tests performed using:
- Browser-based test tool (`test-api.html`)
- Existing proxy setup (`/api/proxy`)
- Systematic testing of code variations
- Product count and sample data verification

## Notes

- **GUID vs xSteller**: Currently using `produktgruppennummer` (xSteller) exclusively
  - GUID-based queries (`produktgruppe=GUID`) returned incorrect results
  - See `BUGFIX-GUID-VS-XSTELLER.md` for details

- **Cache Strategy**: 
  - Products cached by category code
  - 24-hour cache duration
  - Schema version for invalidation

- **Code Hierarchy**:
  - Format: `XX.YY.ZZ.NNNN`
  - XX: Main category
  - YY: Subcategory
  - ZZ: Sub-subcategory
  - NNNN: Specific product

- **Best Practice**:
  - Start with most specific code
  - Fall back to parent if no results
  - Example: Try `09.12.02` → `09.12` → `09`

## Future Work

- [ ] Test all 40+ GKV categories
- [ ] Document GUID mapping once working
- [ ] Test pagination beyond 500 products
- [ ] Verify product update frequency
- [ ] Test alternative query methods (search, filter)
- [ ] Document product image availability

