# Toilet Aids Category Code Fix

## Issue Discovered During Testing

**Date**: During bathroom aids testing
**Reporter**: User testing

### Problem

User selected toilet aids in the bathroom questionnaire:
- Location: "An der Toilette"
- Features: "Mit Rückenlehne"

**Result**: 0 products found

```
Ihre Angaben aus dem Fragebogen:
✓ Toilette
✓ Mit Rückenlehne

Keine Hilfsmittel gefunden
```

**Impact**: Users cannot find toilet seat elevations (Toilettensitzerhöhung), which are a common need for elderly people and those with mobility issues.

## Root Cause

**Wrong category code in questionnaire**:
- Questionnaire used: `04.41` (Toilettenhilfen)
- **Actual products are in**: `33.40` (Toilettensitzerhöhung)
- Result: Category `04.41` has **0 products** in the database

### Category Analysis

Searched the database for toilet-related products:

```
04.41 - Toilettenhilfen:           0 products ❌
33.40 - Toilettensitzerhöhung:   282 products ✅
```

**Sample products in 33.40:**
- Toilettensitzerhöhung Vitaline
- Toilettensitzerhöhung Cosby
- Toilettensitzerhöhung Ashby Standard
- Toilettensitzerhöhung Ashby De Luxe
- Toilettensitzerhöhung Derby Standard

These are exactly what users need when they select "toilet" support!

## Solution

Updated the toilet option to use the correct category code.

### Fix 1: Update Questionnaire (src/data/decisionTree.js)

**Before** (line 146-151):
```javascript
{
  text: 'An der Toilette',
  value: 'toilet',
  leads_to: 'bathroom_features',
  api_criteria: { productGroup: '04.41', bath_type: 'toilet' },
}
```

**After**:
```javascript
{
  text: 'An der Toilette (Toilettensitzerhöhung)',
  value: 'toilet',
  leads_to: 'bathroom_features',
  api_criteria: { productGroup: '33.40', bath_type: 'toilet' },
}
```

**Changes**:
- Updated category from `04.41` → `33.40`
- Added "(Toilettensitzerhöhung)" to clarify what products are shown
- Users now understand they'll see toilet seat elevations

### Fix 2: Update Category Mapping (src/services/gkvApi.js)

**Before** (line 1251):
```javascript
toilet_seat: ['04.41'],
```

**After**:
```javascript
toilet_seat: ['33.40'],
```

### Fix 3: Update Smart Filtering (src/services/gkvApi.js)

**Before** (line 428-438):
```javascript
// Bathroom aids matching (category 04.xx)
const isBathroomAids = productCode.startsWith('04.');

if (isBathroomAids) {
  if (criteria.bath_type) {
    const targetType = criteria.bath_type.toLowerCase();
    if (targetType === 'shower' && productCode.startsWith('04.40.03')) score += 25;
    if (targetType === 'bathtub_entry' && productCode.startsWith('04.40.05')) score += 25;
    if (targetType === 'bathtub_lift' && productCode.startsWith('04.40.01')) score += 25;
    if (targetType === 'toilet' && productCode.startsWith('04.41')) score += 25;
  }
```

**After**:
```javascript
// Bathroom aids matching (category 04.xx and 33.40 for toilet)
const isBathroomAids = productCode.startsWith('04.') || productCode.startsWith('33.40');

if (isBathroomAids) {
  if (criteria.bath_type) {
    const targetType = criteria.bath_type.toLowerCase();
    if (targetType === 'shower' && productCode.startsWith('04.40.03')) score += 25;
    if (targetType === 'bathtub_entry' && productCode.startsWith('04.40.05')) score += 25;
    if (targetType === 'bathtub_lift' && productCode.startsWith('04.40.01')) score += 25;
    if (targetType === 'toilet' && productCode.startsWith('33.40')) score += 25;
  }
```

**Changes**:
- Extended bathroom aids detection to include `33.40`
- Updated toilet matching from `04.41` → `33.40`

## Updated Bathroom Category Overview

After this fix, the complete bathroom aids category structure is:

| Location | Category | Products | Description |
|----------|----------|----------|-------------|
| Dusche (Shower) | 04.40.03 | 118 | Duschklappsitz (shower seats) |
| Badewanne (Entry) | 04.40.05 | 238 | Wanneneinsteighilfe (entry aids) |
| Badewanne (Lift) | 04.40.01 | 11 | Badewannenlifter (bathtub lifts) |
| **Toilette** | **33.40** | **282** | **Toilettensitzerhöhung (toilet seat elevations)** |
| **Total** | | **649** | **All bathroom aids** |

## What Are Toilettensitzerhöhungen?

**German**: Toilettensitzerhöhung
**English**: Toilet seat riser / elevation

**Purpose**: Raises the toilet seat by 5-15 cm to make:
- Sitting down easier
- Standing up easier
- Less strain on knees and hips

**Common features**:
- Various heights (5 cm, 10 cm, 15 cm)
- With or without armrests
- With or without backrest
- Easy to install (clamps onto existing toilet)
- GKV-reimbursable with prescription

**Target users**:
- Elderly people with limited mobility
- People recovering from hip/knee surgery
- People with arthritis
- Anyone who has difficulty standing from low positions

## Expected Behavior After Fix

When user selects "An der Toilette (Toilettensitzerhöhung)":

```
✓ Toilette
✓ Mit Rückenlehne (if selected)
✓ Mit Armlehnen (if selected)
✓ Hohe Tragkraft (if selected)

Results: ~282 products shown
Filtered by selected features (backrest, armrests, etc.)
```

## Testing Verification

Test the toilet aids path:

1. **Basic Search**:
   - [ ] Select "An der Toilette"
   - [ ] Don't select any features
   - [ ] See ~282 products

2. **With Backrest**:
   - [ ] Select "An der Toilette"
   - [ ] Select "Mit Rückenlehne"
   - [ ] Products with "Rücken" or "Lehne" scored higher

3. **With Armrests**:
   - [ ] Select "An der Toilette"
   - [ ] Select "Mit Armlehnen"
   - [ ] Products with "Armlehne" scored higher

4. **Multiple Features**:
   - [ ] Select all features
   - [ ] See products sorted by best match
   - [ ] AI comparison references user's needs

## Files Modified

1. `src/data/decisionTree.js` - Updated toilet category from 04.41 to 33.40
2. `src/services/gkvApi.js` - Updated category mapping and filtering logic

## Why This Happened

The category code `04.41` exists in the GKV directory structure but has no products assigned to it yet. The actual toilet seat products are catalogued under category `33` (Adaptionshilfen / Adaptation aids) → subcategory `33.40` (Toilettensitzerhöhungen).

This is similar to how vision aids were in `25.21` instead of just `25` - the GKV has a very detailed hierarchical structure, and we need to use the exact subcategories where products actually exist.

## Status

✅ **FIXED** - Toilet aids now correctly use category 33.40 with 282 products available

