# Vision Aids Questionnaire Improvements

## Date: October 25, 2025

---

## 🎯 Problem

**Before**: Vision aids (Sehhilfen) questionnaire had only 1 simple question with 3 generic options. Users got 92 unfiltered results with no way to narrow them down.

**Complaint**: "Should we present more filter options in sehhilfen? The user cannot filter"

---

## ✅ Solution

Created a comprehensive 3-question questionnaire that filters products based on actual lens specifications:

### New Questionnaire Structure

#### Question 1: Lens Purpose
**"Wofür brauchen Sie die Sehhilfe?"**
- Nur zum Lesen / Nahsicht → Single vision (near)
- Nur für die Ferne → Single vision (distance)
- Für Nah und Fern → Multifocal/Bifocal

#### Question 2: Prescription Strength
**"Wie stark ist Ihre Sehschwäche?"**
- Leichte Sehschwäche (bis ±6 Dioptrien)
- Mittlere Sehschwäche (±6 bis ±10 Dioptrien)
- Starke Sehschwäche (über ±10 Dioptrien)
- Weiß ich nicht / Egal

#### Question 3: Astigmatism
**"Haben Sie eine Hornhautverkrümmung (Astigmatismus)?"**
- Ja, leichte Verkrümmung (bis 2 Dioptrien Zylinder)
- Ja, stärkere Verkrümmung (über 2 Dioptrien Zylinder)
- Nein / Weiß ich nicht

---

## 📊 Product Analysis

### Vision Products in Database (25.21.xx.xxxx)

**Total**: 99 products

**Types**:
1. **Einstärkengläser** (Single vision lenses) - Most common
   - For ONE distance (near OR far)
   - Examples: "Einstärkengläser, sphärisch ≤ ±6,0 dpt, cyl ≤ +2,0 dpt"

2. **Mehrstärkengläser** (Multifocal/Bifocal lenses)
   - For BOTH distances (near AND far)
   - Examples: "Mehrstärkengläser, Fernteil sphärisch ≤ ±6,0 dpt, cyl ≤ +4,0 dpt"

3. **Lentikulargläser** (Lenticular lenses)
   - For very high prescriptions
   - Examples: "Einstärken-Lentikulargläser"

**Technical Specifications in Product Names**:
- **Diopter (sphärisch)**: ≤ ±6,0 dpt | > ±6,0 dpt < ±10,0 dpt | ≥ ±10,0 dpt
- **Cylinder (cyl)**: ≤ +2,0 dpt | > 2,0 dpt ≤ +4,0 dpt
- **High index**: "hochbrechend" for strong prescriptions

---

## 🔧 Implementation

### 1. Updated Questionnaire (`src/data/decisionTree.js`)

**Before** (Lines 257-280):
```javascript
vision: [
  {
    id: 'vision_issue',
    question: 'Welche Seh-Schwierigkeiten haben Sie?',
    type: 'multiple-choice',
    options: [
      { text: 'Ich kann kleine Schrift nicht mehr lesen...', 
        api_criteria: { productGroup: '25', magnifier: true } },
      // ... 2 more generic options
    ],
  },
],
```

**After**:
```javascript
vision: [
  {
    id: 'vision_type',
    question: 'Wofür brauchen Sie die Sehhilfe?',
    type: 'single-choice',
    options: [
      { text: 'Nur zum Lesen / Nahsicht...', 
        api_criteria: { productGroup: '25.21.01', lens_type: 'single_vision_near' } },
      { text: 'Nur für die Ferne...', 
        api_criteria: { productGroup: '25.21.01', lens_type: 'single_vision_far' } },
      { text: 'Für Nah und Fern (Gleitsicht / Bifokal)', 
        api_criteria: { productGroup: '25.21.02', lens_type: 'multifocal' } },
    ],
  },
  {
    id: 'vision_strength',
    question: 'Wie stark ist Ihre Sehschwäche?',
    // ... diopter_range criteria
  },
  {
    id: 'vision_astigmatism',
    question: 'Haben Sie eine Hornhautverkrümmung?',
    // ... cylinder_range criteria
  },
],
```

### 2. Added Filtering Logic (`src/services/gkvApi.js`)

**In `filterByFeatures()` function** (Lines 399-426):
```javascript
// Vision aids / Sehhilfen matching (category 25.xx)
const isVisionAids = productCode.startsWith('25.');

if (isVisionAids) {
  // Lens type matching (+20 points)
  if (criteria.lens_type) {
    if (targetType.includes('single_vision') && productName.includes('einstärkengläser')) score += 20;
    if (targetType.includes('multifocal') && productName.includes('mehrstärkengläser')) score += 20;
  }
  
  // Diopter range matching (+15 points)
  if (criteria.diopter_range) {
    if (criteria.diopter_range === 'low' && productName.includes('≤ ±6,0 dpt')) score += 15;
    if (criteria.diopter_range === 'medium' && productName.includes('> ±6,0 dpt')) score += 15;
    if (criteria.diopter_range === 'high' && productName.includes('≥ ±10,0 dpt')) score += 15;
  }
  
  // Cylinder range matching (+10 points)
  if (criteria.cylinder_range) {
    if (criteria.cylinder_range === 'low' && productName.includes('cyl ≤ +2,0 dpt')) score += 10;
    if (criteria.cylinder_range === 'high' && productName.includes('cyl > 2,0 dpt')) score += 10;
  }
}
```

**In feature filters** (Lines 785-797):
Added constants for UI filtering:
- `EINSTAERKEN`, `MEHRSTAERKEN`, `LENTIKULAR` - lens types
- `DIOPTER_LOW`, `DIOPTER_MEDIUM`, `DIOPTER_HIGH` - prescription strength
- `CYL_LOW`, `CYL_HIGH` - astigmatism levels

---

## 📈 Expected Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Questions** | 1 generic question | 3 specific questions |
| **Filtering** | None (92 unfiltered results) | Smart filtering by lens type, strength, astigmatism |
| **User Experience** | Overwhelming | Targeted results |
| **Product Match** | Random 92 products | Scored by relevance (top 200) |
| **Category Codes** | Wrong (`25`, `25.03`) | Correct (`25.21.01`, `25.21.02`) |

### Example User Journeys

**User 1: Reading glasses**
1. Selects "Nur zum Lesen / Nahsicht"
2. Selects "Leichte Sehschwäche"
3. Selects "Nein / Weiß ich nicht"
→ Gets single vision lenses with low diopter values

**User 2: Bifocals with strong prescription**
1. Selects "Für Nah und Fern (Gleitsicht / Bifokal)"
2. Selects "Starke Sehschwäche"
3. Selects "Ja, stärkere Verkrümmung"
→ Gets multifocal lenses with high diopters and high cylinder values

---

## 🎓 User-Friendly Design

### Helpful Info Text
Added `info` property to questions for user guidance:

**Question 2 info**:
> "Falls Sie Ihre Dioptrienwerte kennen, wählen Sie die passende Stärke. Ansonsten wählen Sie 'Leicht' für schwache Brillen oder 'Stark' für dicke Brillen."

**Question 3 info**:
> "Falls Ihr Rezept einen 'Zylinder'-Wert (cyl) hat, wählen Sie 'Ja'. Ansonsten 'Weiß nicht'."

### Always Include "Don't Know" Option
Both technical questions have a "Weiß ich nicht / Egal" option that doesn't filter, ensuring users aren't forced to guess.

---

## 🧪 Testing

### Test Cases

1. **Single vision (reading), low diopter, no astigmatism**
   - Should show: "Einstärkengläser, sphärisch ≤ ±6,0 dpt, cyl ≤ +2,0 dpt"
   - Should NOT show: Mehrstärkengläser or high diopter products

2. **Multifocal, high diopter, high astigmatism**
   - Should show: "Mehrstärkengläser hochbrechend, Fernteil sphärisch ≥ ±10,0 dpt, cyl > 2,0 dpt"
   - Should NOT show: Einstärkengläser or low diopter products

3. **Any lens, don't know strength, don't know astigmatism**
   - Should show: All 92 vision products (no filtering)

### Manual Test
1. Navigate to Sehhilfen questionnaire
2. Answer all 3 questions with specific choices
3. Verify results are filtered to relevant products only
4. Check that product names match the selected criteria

---

## 📊 Impact

**Before**:
- 😞 Users overwhelmed with 92 unfiltered results
- ❌ No way to narrow down options
- ❌ Random product order

**After**:
- ✅ Targeted results based on prescription needs
- ✅ Smart filtering by 3 key criteria
- ✅ Products scored by relevance
- ✅ User-friendly explanations
- ✅ "Don't know" options for flexibility

---

## 🚀 Ready to Deploy

**Files Changed**:
1. `src/data/decisionTree.js` - Expanded vision questionnaire (3 questions)
2. `src/services/gkvApi.js` - Added vision-specific filtering logic

**Status**: ✅ No linter errors, ready to test and deploy

---

## 📝 Future Improvements

**Potential additions**:
1. **Coating preferences**: Anti-glare, blue light filter, photochromic
2. **Frame type**: Full rim, semi-rimless, rimless
3. **Material preferences**: Plastic, metal, titanium
4. **Special use cases**: Computer work, driving, sports

**Note**: Current products are primarily lenses (Gläser), not frames. Frame options would require different product category codes.

---

**Summary**: Transformed a basic 1-question vision aids questionnaire into a comprehensive 3-question system that intelligently filters 92 products based on actual lens specifications (type, diopter strength, astigmatism). Users now get targeted, relevant results instead of an overwhelming unfiltered list.

---

*Date: October 25, 2025*  
*Related: BUGFIX-VISION-AIDS-CATEGORY-CODE.md (Category code fix)*

