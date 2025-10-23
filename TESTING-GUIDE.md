# GKV API Testing Guide

## Overview

This guide walks you through the complete process of testing and verifying GKV API category codes to ensure all 7 categories return realistic product recommendations.

## Step-by-Step Process

### Step 1: Start Development Server

```bash
npm run dev
```

The dev server should start on `http://localhost:5173`

### Step 2: Open Test Tool

Navigate to: **`http://localhost:5173/test-api.html`** (dev) or **`https://your-domain.vercel.app/test-api.html`** (production)

You should see the GKV API Category Tester interface.

### Step 3: Run Comprehensive Tests

1. Click the **"Test All Categories"** button
2. Wait for all tests to complete (~30-60 seconds)
3. Watch the progress indicator and console output

The tool will test:
- ✅ Hörgeräte (4 code variations)
- ⏳ Gehhilfen (8 code variations)
- ⏳ Sehhilfen (6 code variations)
- ⏳ Badehilfen (5 code variations)
- ⏳ Diabetes (4 code variations)
- ⏳ Inkontinenz (4 code variations)
- ⏳ Pflege (4 code variations)

**Total: 35 API calls**

### Step 4: Review Results

After tests complete, you'll see:

1. **Console Output**: Detailed log of each test
   - ✅ Green = Success (products found)
   - ❌ Red = Failed (no products)
   - Product counts and samples

2. **Summary Table**: Overview of all categories
   - Number of tests per category
   - Number of working codes
   - Best codes ranked by product count

### Step 5: Export Results

1. Click **"Export Results"** button
2. Save the markdown file (e.g., `gkv-api-test-results-2025-10-23.md`)
3. Open the file to review detailed findings

### Step 6: Document Findings

Update `docs/CATEGORY-CODES-VERIFIED.md` with test results:

For each category, fill in:
- **Primary Code**: The code with most products
- **Product Count**: Number of products returned
- **Status**: ✅ Verified or ❌ No Results
- **Recommendation**: Which code to use in the app

Example:
```markdown
### Gehhilfen (Mobility Aids)
**Status**: ✅ Verified
**Primary Code**: `09.12`
- Products: 250+
- Subcategories: 09.12.02 (rollators), 09.12.01 (sticks)
**Recommendation**: Use `09.12` for general mobility, `09.12.02` for rollators
```

### Step 7: Update Decision Tree

Based on verified codes, update `src/data/decisionTree.js`:

**Before** (broken):
```javascript
vision: [
  {
    options: [
      {
        value: 'reading',
        api_criteria: { productGroup: '07' }  // ❌ Returns no products
      }
    ]
  }
]
```

**After** (fixed):
```javascript
vision: [
  {
    options: [
      {
        value: 'reading',
        api_criteria: { productGroup: '25.50' }  // ✅ Returns 80+ products
      }
    ]
  }
]
```

### Step 8: Test in Application

1. Clear browser cache and localStorage:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. Test each category:
   - Select "Gehhilfen" → Answer questions → Verify products shown
   - Select "Sehhilfen" → Answer questions → Verify products shown
   - Select "Badehilfen" → Answer questions → Verify products shown
   - Etc.

3. Verify:
   - ✅ Products are displayed
   - ✅ Products are relevant to category
   - ✅ Product codes match expected pattern
   - ✅ No "Keine Hilfsmittel gefunden" errors

### Step 9: Deploy

Once all categories work:

```bash
git add .
git commit -m "fix: update all category codes with verified GKV API codes

- Tested 7 categories with 35 code variations
- Updated decisionTree.js with working codes
- All categories now return relevant products
- Documented findings in CATEGORY-CODES-VERIFIED.md"

git push
```

## Expected Outcomes

After completing all steps:

### Working Categories
- ✅ **Hörgeräte**: 13.20 (120+ products)
- ✅ **Gehhilfen**: [TO BE VERIFIED]
- ✅ **Sehhilfen**: [TO BE VERIFIED]
- ✅ **Badehilfen**: [TO BE VERIFIED]
- ✅ **Diabetes**: [TO BE VERIFIED]
- ✅ **Inkontinenz**: [TO BE VERIFIED]
- ✅ **Pflege**: [TO BE VERIFIED]

### What Success Looks Like

For each category:
1. At least 1 working code identified
2. 20+ products returned
3. Products are relevant (correct category)
4. Sample products have proper names and codes
5. Application displays products correctly

## Troubleshooting

### Issue: All Tests Fail

**Symptom**: Every category shows ❌ Failed

**Solutions**:
1. Check dev server is running (`npm run dev`)
2. Verify you're on `localhost:5173` (not `file://`)
3. Check Network tab in DevTools for errors
4. Try "Test Hörgeräte (13.20)" button (known working)
5. If that works, run "Test All Categories" again

### Issue: Some Categories Have No Results

**Symptom**: Specific categories show 0 products for all codes

**Solutions**:
1. Review exported results for error messages
2. Try parent categories (e.g., `09` instead of `09.12.02`)
3. Use "Fetch Category Tree" to find valid codes
4. Check `docs/GKV-API-REFERENCE.md` for alternative codes
5. Search GKV website for correct category names

### Issue: Results Are Inconsistent

**Symptom**: Different results on repeated runs

**Solutions**:
1. Clear browser cache and reload
2. Close other tabs/windows
3. Check GKV API status (might be rate limiting)
4. Add longer delays in test script (currently 200ms)

### Issue: Products Don't Match Category

**Symptom**: Code returns products from wrong category

**Solutions**:
1. Try more specific codes (deeper hierarchy)
2. Enable post-filter in application
3. Document code as "mixed results" 
4. Use fallback to broader category

## Files to Update

After testing, you should have modified:

1. ✅ `docs/CATEGORY-CODES-VERIFIED.md` - Verified codes documented
2. ✅ `docs/GKV-API-REFERENCE.md` - API details filled in
3. ✅ `src/data/decisionTree.js` - Updated with working codes
4. 📄 `gkv-api-test-results-YYYY-MM-DD.md` - Exported test results

## Advanced: Testing Specific Scenarios

### Test Single Category
```javascript
// In browser console on test-api.html
testSingleCategory('09.12');  // Test specific code
```

### Test Category Tree
Click "Fetch Category Tree" button to download complete GKV hierarchy. Results appear in browser console.

### Custom Test
Add codes to test script:
```javascript
// In test-api.html, modify TEST_CATEGORIES object
'CustomCategory': [
  '99.99',  // Your custom code
]
```

## Timeline

Estimated time to complete:

- ⏱️ **5 min**: Run test suite
- ⏱️ **10 min**: Review and document results  
- ⏱️ **15 min**: Update decisionTree.js
- ⏱️ **10 min**: Test in application
- ⏱️ **5 min**: Deploy

**Total: ~45 minutes**

## Success Criteria

You're done when:

- [x] All 7 categories tested
- [x] At least 1 working code per category
- [x] Results documented in CATEGORY-CODES-VERIFIED.md
- [x] decisionTree.js updated
- [x] Application tested and working
- [x] No "Keine Hilfsmittel gefunden" errors
- [x] Products are relevant for each category

## Next Steps After Testing

1. **Add Questionnaires** for categories without them:
   - Diabetes
   - Inkontinenz
   - Pflege

2. **Optimize Category Selection**:
   - Remove "Coming Soon" labels
   - Enable all category cards

3. **Enhance Product Display**:
   - Add category-specific context
   - Improve product decoders
   - Add images if available

4. **Monitor Production**:
   - Track search success rates
   - Monitor for empty results
   - Collect user feedback

## Support

If you encounter issues:
1. Check browser console for errors
2. Review Network tab for API failures
3. Export and review test results
4. Check `docs/GKV-API-REFERENCE.md` for API details
5. Verify GKV API is accessible

## Summary

This testing process ensures that all categories in the Hilfsmittel-Finder return real, relevant products from the GKV API. By systematically testing code variations and documenting results, we eliminate guesswork and provide users with accurate recommendations.

**Ready to start? Open `http://localhost:5173/test-api.html` and click "Test All Categories"!** 🚀

