# Verified GKV Category Codes

## Purpose

This document maps user-facing category names to verified working GKV API category codes.

**Status**: 🔄 In Progress - Run `test-api.html` to populate this document

**Last Updated**: [DATE TO BE FILLED]

---

## Quick Reference Table

| Category | German Name | Primary Code | Product Count | Status | Notes |
|----------|-------------|--------------|---------------|--------|-------|
| Hearing | Hörgeräte | 13.20 | 120+ | ✅ Verified | Working correctly |
| Mobility | Gehhilfen | ??? | ??? | ⏳ Testing | Run tests to verify |
| Vision | Sehhilfen | ??? | ??? | ⏳ Testing | Run tests to verify |
| Bathroom | Badehilfen | ??? | ??? | ⏳ Testing | Run tests to verify |
| Diabetes | Diabetes | ??? | ??? | ⏳ Testing | Run tests to verify |
| Incontinence | Inkontinenz | ??? | ??? | ⏳ Testing | Run tests to verify |
| Care | Pflege | ??? | ??? | ⏳ Testing | Run tests to verify |

---

## Detailed Category Mappings

### 1. Hörgeräte (Hearing Aids)

**Status**: ✅ Verified and Working

**Primary Code**: `13.20`
- Products: 120+
- Subcategories tested:
  - `13.20.12`: Specific hearing aid devices
  - `13`: Base category (use 13.20 for better results)

**Recommendation**: Use `13.20` in questionnaires

**Sample Products**:
- 13.20.12.xxxx: Various hearing aid models
- Manufacturers: KIND, Phonak, Oticon, Starkey, etc.

**Integration**:
```javascript
// src/data/decisionTree.js
hearing: [{
  api_criteria: { productGroup: '13.20' }
}]
```

---

### 2. Gehhilfen (Mobility Aids)

**Status**: ⏳ To Be Verified

**Codes to Test**:
- `09.12`: Walking aids (general)
- `09.12.01`: Walking sticks
- `09.12.02`: Rollators
- `09.12.03`: Walking frames
- `09.24`: Wheelchairs
- `09.24.01`: Manual wheelchairs
- `10.46`: Einlagen (insoles)

**Expected Results**: [TO BE FILLED AFTER TESTING]

**Recommendation**: [TO BE DETERMINED]

---

### 3. Sehhilfen (Vision Aids)

**Status**: ⏳ To Be Verified

**Codes to Test**:
- `07`: Vision aids (base)
- `07.99`: Other vision aids
- `07.11`: Reading aids
- `25.50`: Magnifiers
- `25.56`: Lighting aids

**Expected Results**: [TO BE FILLED AFTER TESTING]

**Recommendation**: [TO BE DETERMINED]

**Notes**:
- Previous code `25.xx` returned no results
- Testing `07.xx` series as primary alternative

---

### 4. Badehilfen (Bathroom Aids)

**Status**: ⏳ To Be Verified

**Codes to Test**:
- `04.40`: Bath aids (general)
- `04.40.01`: Grab bars
- `04.40.04`: Shower chairs
- `04.41`: Toilet aids

**Expected Results**: [TO BE FILLED AFTER TESTING]

**Current Issues**:
- Only 1 product found with current codes
- Need to test broader categories

**Recommendation**: [TO BE DETERMINED]

---

### 5. Diabetes (Diabetes Supplies)

**Status**: ⏳ To Be Verified

**Codes to Test**:
- `21.33`: Insulin pumps
- `21.34`: Blood glucose meters
- `21`: Medical devices (base)
- `22.50`: Diabetes supplies

**Expected Results**: [TO BE FILLED AFTER TESTING]

**Recommendation**: [TO BE DETERMINED]

**Notes**:
- Questionnaire not yet implemented
- Will add after code verification

---

### 6. Inkontinenz (Incontinence Products)

**Status**: ⏳ To Be Verified

**Codes to Test**:
- `15.25`: Incontinence products
- `15.25.01`: Pads
- `15.25.02`: Pants
- `15`: Absorption products (base)

**Expected Results**: [TO BE FILLED AFTER TESTING]

**Recommendation**: [TO BE DETERMINED]

**Notes**:
- Questionnaire not yet implemented
- Will add after code verification

---

### 7. Pflege (Care/Nursing)

**Status**: ⏳ To Be Verified

**Codes to Test**:
- `18.50`: Care beds
- `18.51`: Bed accessories
- `19.40`: Positioning aids
- `18`: Care equipment (base)

**Expected Results**: [TO BE FILLED AFTER TESTING]

**Recommendation**: [TO BE DETERMINED]

**Notes**:
- Questionnaire not yet implemented
- Will add after code verification

---

## Testing Instructions

1. **Run Test Suite**:
   ```bash
   npm run dev
   # Navigate to http://localhost:5173/test-api.html
   # Click "Test All Categories"
   ```

2. **Review Results**:
   - Check summary table
   - Note product counts
   - Export results to markdown

3. **Update This Document**:
   - Fill in verified codes
   - Add product counts
   - Note any issues or limitations
   - Update recommendations

4. **Update Application Code**:
   - Update `src/data/decisionTree.js` with verified codes
   - Test in application
   - Verify results are relevant

---

## Code Selection Guidelines

### When Multiple Codes Work

1. **Prefer Most Specific**: Use deepest hierarchy level that has products
   - Example: `09.12.02` (rollators) over `09.12` (all walking aids)

2. **Consider Product Count**: Balance specificity with variety
   - Too specific: Very few products, limited choice
   - Too broad: Many irrelevant products, harder to filter

3. **Match User Intent**: Align code with questionnaire focus
   - If asking about rollators specifically, use rollator code
   - If general walking aids, use broader code

### When No Codes Work

1. **Try Parent Categories**: Go up hierarchy
   - `09.12.02` → `09.12` → `09`

2. **Try Related Categories**: Check adjacent codes
   - If `07.xx` fails, try `25.xx` or `06.xx`

3. **Search Category Tree**: Use "Fetch Category Tree" in test tool
   - Find exact category names
   - Locate xSteller codes

4. **Document Alternative**: If category truly missing:
   - Document in this file
   - Add note in questionnaire
   - Consider disable category temporarily

---

## Update History

- **[DATE]**: Initial document created
- **[DATE]**: Test results for Hörgeräte confirmed (13.20 works)
- **[DATE]**: [TO BE FILLED AS UPDATES MADE]

---

## Related Documents

- `GKV-API-REFERENCE.md`: Detailed API documentation
- `API-TESTING-INSTRUCTIONS.md`: How to run tests
- `API-GUIDE.md`: Original API guide
- `src/data/decisionTree.js`: Implementation

---

## Next Steps

- [ ] Run comprehensive test suite
- [ ] Document results for all 7 categories
- [ ] Update `decisionTree.js` with verified codes
- [ ] Test in application
- [ ] Verify product relevance
- [ ] Deploy updated code
- [ ] Monitor for any issues

