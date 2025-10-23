# GKV API Testing Instructions

## Overview

This document describes how to use the API testing tool to systematically verify which category codes work with the GKV Hilfsmittelverzeichnis API.

## Quick Start

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open the test tool**:
   - Development: `http://localhost:5173/test-api.html`
   - Production: `https://your-domain.vercel.app/test-api.html`

3. **Run tests**:
   - Click "Test All Categories" to test all 7 categories
   - Wait for tests to complete (takes ~30 seconds)
   - Review results in the test output

4. **Export results**:
   - Click "Export Results" to download a markdown file
   - Results will be saved as `gkv-api-test-results-YYYY-MM-DD.md`

## Test Categories

The tool tests the following categories with multiple code variations:

1. **Hörgeräte** (Hearing Aids)
   - Tests codes: 13.20, 13.20.12, 13, 13.99

2. **Gehhilfen** (Mobility Aids)
   - Tests codes: 09.12, 09.12.02, 09.12.01, 09.12.03, 09.24, 09.24.01, 09, 10.46

3. **Sehhilfen** (Vision Aids)
   - Tests codes: 07, 07.99, 07.11, 25.50, 25.56, 25

4. **Badehilfen** (Bathroom Aids)
   - Tests codes: 04.40, 04.40.01, 04.40.04, 04.41, 04

5. **Diabetes** (Diabetes Supplies)
   - Tests codes: 21.33, 21.34, 21, 22.50

6. **Inkontinenz** (Incontinence Products)
   - Tests codes: 15.25, 15.25.01, 15.25.02, 15

7. **Pflege** (Care/Nursing)
   - Tests codes: 18.50, 18.51, 19.40, 18

## Understanding Results

### Success Indicators
- ✅ Green checkmark = Code returns products
- Product count shown (e.g., "120 products found")
- Sample products listed

### Failure Indicators
- ❌ Red X = Code returns no products or errors
- Error message shown if applicable

### Summary Table
After all tests complete, a summary table shows:
- **Category**: User-facing category name
- **Tested**: Number of codes tested
- **Working**: Number of codes that returned products
- **Best Codes**: Top 3 codes by product count

## Next Steps

1. **Analyze Results**:
   - Identify which codes return the most products for each category
   - Note codes that return no results
   - Check sample products to verify relevance

2. **Update Category Mappings**:
   - Use working codes to update `src/data/decisionTree.js`
   - Replace placeholder codes with verified working codes
   - Document choices in `CATEGORY-CODES-VERIFIED.md`

3. **Verify in Application**:
   - Test each category in the actual application
   - Ensure products are relevant and well-formatted
   - Check that category filters work correctly

## Advanced Features

### Test Single Category
Click individual category buttons to test specific codes quickly.

### Fetch Category Tree
Click "Fetch Category Tree" to download the complete GKV category hierarchy. Results are logged to browser console.

### Export Results
Export test results as markdown for documentation and review.

## Troubleshooting

### No Results for Any Category
- Check that dev server is running
- Verify proxy is working: Check Network tab in DevTools
- Ensure you're accessing via localhost (not file://)

### API Errors (HTTP 500, 502)
- GKV API might be temporarily down
- Try again in a few minutes
- Check API status at hilfsmittelverzeichnis.gkv-spitzenverband.de

### Unexpected Results
- Some categories might use different code structures
- Try parent categories (e.g., "09" instead of "09.12.02")
- Check browser console for detailed error messages

## Expected Workflow

```
1. Run Tests (30 seconds)
   ↓
2. Review Summary Table
   ↓
3. Export Results to Markdown
   ↓
4. Document Findings in CATEGORY-CODES-VERIFIED.md
   ↓
5. Update decisionTree.js with Working Codes
   ↓
6. Test in Application
   ↓
7. Deploy Updated Code
```

## Notes

- Tests include small delays (200ms) between requests to avoid rate limiting
- The tool uses the existing `/api/proxy` endpoint
- All results are stored in browser memory until page refresh
- Export results before closing the browser to save findings

