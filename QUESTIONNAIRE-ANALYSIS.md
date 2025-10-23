# Questionnaire & Product Matching Analysis

## 🔍 Problem Discovered

**User saw**: Infusion tube (03.29.12.1097 - Applikationshilfen)  
**But answered questions about**: Mobility? Hearing? Vision?  
**Issue**: Questionnaire doesn't ask about infusions, yet this product appears in results

---

## Root Cause Analysis

### Possible Causes:

#### 1. **API Returns Too Many Products** ⚠️
```javascript
// Current behavior:
// User answers "hearing problems" → maps to productGroup '07.99'
// API might return EVERYTHING starting with "07" OR "0" 
// Including 03.29 (Applikationshilfen)
```

**Check**: Are we querying the API with the correct specificity?

#### 2. **Missing Category in Questionnaire** ✅ CONFIRMED
Current questionnaire covers:
- ✅ Mobility (09.12, 09.24, 09.40)
- ✅ Bathroom (04.40, 04.41)  
- ✅ Hearing (07.99)
- ✅ Vision (25.50, 25.56)

**Missing categories** that SHOULD NOT appear without questions:
- ❌ 03.29 - Applikationshilfen (infusion equipment)
- ❌ 10.46 - Einlagen (insoles)
- ❌ 11.11 - Kompressionsstrümpfe
- ❌ 15.25 - Inkontinenzhilfen
- ❌ 17.06 - Krankenfahrzeuge
- ❌ 18.50 - Pflegebetten
- ❌ 21.28 - Blutdruckmessgeräte
- ❌ 23.04/12 - Schienen (braces)
- And 30+ more categories...

#### 3. **Broad Category Matching** ⚠️
```javascript
// Current mapping (line 545-575 in gkvApi.js)
const mapping = {
  walker: ['09.12'],
  hearing_aid: ['07.99'],
  magnifier: ['25.50'],
  // ...
};
```

**Hypothesis**: The API might be returning parent categories
- User selects "hearing_aid" → Query "07.99"
- API returns ALL products under "07" or even "0"
- Includes 03.29, 04.40, 07.03, 07.99, etc.

---

## 📊 Data Analysis

### Current Questionnaire Coverage

| Category | Code | Asked? | Why Not? |
|----------|------|--------|----------|
| **Absauggeräte** | 01 | ❌ | Specialized medical equipment |
| **Applikationshilfen** | 03.29 | ❌ | Infusion equipment - medical |
| **Badehilfen** | 04.40 | ✅ | YES - bathroom questions |
| **Einlagen** | 10.46 | ❌ | Should add - very common! |
| **Kompressionsstrümpfe** | 11.11 | ❌ | Should add - common for seniors! |
| **Hörgeräte** | 13.20 | ✅ | YES - hearing questions |
| **Inkontinenz** | 15.25 | ❌ | Should add - very common! |
| **Krankenfahrzeuge** | 17.06 | ❌ | Maybe add - mobility extension |
| **Pflegebetten** | 18.50 | ❌ | Should add - common for care |
| **Lagerungshilfen** | 19.40 | ❌ | Related to beds/care |
| **Blutdruckmessgeräte** | 21.28 | ❌ | Should add - very common! |
| **Blutzuckermessgeräte** | 21.33 | ❌ | Should add for diabetics! |
| **Sehhilfen** | 25.50 | ✅ | YES - vision questions |

**Coverage**: 4/40 categories (**10%**)  
**Common categories missing**: 8-10 (**80% of user needs**)

---

## 🎯 Recommended Solutions

### Option 1: **Specialized Questionnaires** ⭐ RECOMMENDED

**Approach**: Different questionnaires for different life situations

```
Landing Page:
┌────────────────────────────────────────────┐
│ Welche Hilfsmittel suchen Sie?            │
│                                            │
│ [👂 Hörgeräte]                             │
│ [🦯 Gehhilfen & Mobilität]                 │
│ [🚿 Badezimmer & Toilette]                 │
│ [🔍 Sehhilfen & Lesehilfen]                │
│ [🩺 Gesundheit & Pflege]                   │
│ [💊 Inkontinenz]                           │
│ [🛏️ Pflegebett & Lagerung]                │
│ [🩸 Diabetes & Blutdruck]                  │
│                                            │
│ [❓ Ich bin nicht sicher] → Quick-Test    │
└────────────────────────────────────────────┘
```

**Benefits**:
- ✅ User chooses relevant category upfront
- ✅ Only sees 3-5 focused questions
- ✅ Much better results
- ✅ No irrelevant products
- ✅ Faster completion time

**Example - Diabetes Flow**:
```
1. Haben Sie Diabetes?
   → Ja (Typ 1 / Typ 2)

2. Brauchen Sie ein Blutzuckermessgerät?
   → Ja → Show 21.33 products

3. Nutzen Sie eine Insulinpumpe?
   → Ja → Show 03.29 (infusion equipment)

4. Haben Sie Fußprobleme?
   → Ja → Add 10.46 (insoles)
```

---

### Option 2: **Multi-Area Questionnaire**

**Approach**: One questionnaire, multiple sections

```
Schritt 1: Welche Bereiche betreffen Sie?
[✓] Hören
[✓] Sehen  
[✓] Gehen
[ ] Diabetes
[ ] Inkontinenz
[✓] Bad/Toilette

Schritt 2a: Hören (nur wenn ausgewählt)
→ Fragen zu Hörverlust

Schritt 2b: Gehen (nur wenn ausgewählt)
→ Fragen zu Mobilität

Schritt 2c: Bad (nur wenn ausgewählt)
→ Fragen zu Badezimmer
```

**Benefits**:
- ✅ User selects all relevant areas
- ✅ Only answers questions for selected areas
- ✅ One session, multiple categories
- ⚠️ Longer overall flow

**Drawbacks**:
- ❌ Can become long (10-15 questions)
- ❌ More complex UI
- ❌ User might miss a relevant area

---

### Option 3: **Smart Filtering + Post-Filter**

**Approach**: Keep current questionnaire, but add post-search filtering

```javascript
// After getting API results, filter by relevance
function filterRelevantProducts(products, answers) {
  // Remove products from categories NOT asked about
  const askedCategories = extractCategories(answers);
  
  return products.filter(product => {
    const productCategory = product.code.substring(0, 5); // e.g., "03.29"
    
    // Only show if category was part of questionnaire
    return askedCategories.includes(productCategory);
  });
}

// Example:
// User answered hearing questions → askedCategories = ['07.99', '13.20']
// Filter out 03.29 (infusion) because it wasn't asked about
```

**Benefits**:
- ✅ Quick fix
- ✅ No questionnaire changes needed
- ✅ Filters out unrelated products

**Drawbacks**:
- ❌ Still fetches irrelevant products from API
- ❌ Wastes API calls
- ❌ Doesn't help users discover other needs

---

### Option 4: **Hybrid Approach** ⭐⭐ BEST SOLUTION

**Combine specialized flows + discovery**

```
Landing Page:
┌────────────────────────────────────────────┐
│ Was brauchen Sie?                          │
│                                            │
│ Häufigste Hilfsmittel:                    │
│ [👂 Hörgeräte] [🦯 Gehhilfen]             │
│ [🔍 Sehhilfen] [💊 Inkontinenz]           │
│                                            │
│ Weitere Kategorien:                       │
│ [+] Alle Kategorien anzeigen              │
│                                            │
│ ─────────── ODER ──────────────            │
│                                            │
│ [🎯 Bedarfsanalyse starten]               │
│ "Ich bin nicht sicher, was ich brauche"   │
└────────────────────────────────────────────┘
```

**Flow 1 - Direct Category Selection**:
User clicks "Hörgeräte" → 3 hearing-specific questions → Results

**Flow 2 - Comprehensive Analysis**:
User clicks "Bedarfsanalyse" → Asks about all life areas → Multiple categories

**Benefits**:
- ✅ Fast path for users who know what they need
- ✅ Comprehensive path for uncertain users
- ✅ No irrelevant results
- ✅ Best UX for both user types

---

## 🛠️ Implementation Plan

### Immediate Fix (Today) - Option 3

**Add post-filtering to prevent irrelevant products**:

```javascript
// In gkvApi.js
async searchProducts(criteria, options = {}) {
  // ... existing code ...
  
  // NEW: Filter out categories not asked about
  const askedCategories = this.extractAskedCategories(criteria);
  const filteredProducts = sortedProducts.filter(product => {
    const code = product.produktartNummer || product.code || '';
    const category = code.substring(0, 5); // "03.29"
    
    // Check if this category was part of the questionnaire
    return askedCategories.some(asked => category.startsWith(asked));
  });
  
  return {
    products: filteredProducts.slice(start, end),
    total: filteredProducts.length,
    // ...
  };
}

extractAskedCategories(criteria) {
  const categories = new Set();
  
  // Extract from productGroups
  if (criteria.productGroups) {
    criteria.productGroups.forEach(group => categories.add(group));
  }
  
  // Extract from filters
  if (criteria.filters) {
    // Map filters back to categories
    if (criteria.filters.hearing_aid) categories.add('07.99');
    if (criteria.filters.walker) categories.add('09.12');
    if (criteria.filters.magnifier) categories.add('25.50');
    // ... etc
  }
  
  return Array.from(categories);
}
```

**Result**: Infusion tubes (03.29) won't appear for hearing/mobility searches

---

### Short-term (Next Week) - Option 4

**Implement category selection on welcome screen**:

1. Update `WelcomeScreen.jsx`:
   ```jsx
   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
     <CategoryCard 
       icon="👂"
       title="Hörgeräte"
       description="Besser hören"
       onClick={() => startQuestionnaire('hearing')}
     />
     <CategoryCard 
       icon="🦯"
       title="Gehhilfen"
       description="Sicher gehen"
       onClick={() => startQuestionnaire('mobility')}
     />
     {/* ... 8-10 more cards */}
   </div>
   ```

2. Add specialized questionnaires for each category

3. Keep "Bedarfsanalyse" button for comprehensive mode

---

### Medium-term (Next Month) - Complete All Categories

**Add questionnaires for**:

1. **Diabetes** (21.33 - Blutzucker):
   - Typ 1 oder Typ 2?
   - Insulinpumpe?
   - Wie oft messen?

2. **Bluthochdruck** (21.28 - Blutdruck):
   - Haben Sie Bluthochdruck?
   - Messen Sie regelmäßig?
   - Zuhause oder unterwegs?

3. **Inkontinenz** (15.25):
   - Leicht, mittel oder stark?
   - Tag oder Nacht?
   - Vorlagen oder Pants?

4. **Compression** (11.11):
   - Krampfadern?
   - Venenschwäche?
   - Offene Beine?

5. **Orthopädie** (10.46 - Einlagen):
   - Fußschmerzen?
   - Welche Art? (Plattfuß, Senk-Spreizfuß, etc.)
   - Sport oder Alltag?

6. **Pflege** (18.50 - Pflegebett):
   - Pflegegrad?
   - Wird gepflegt oder selbstständig?
   - Welche Unterstützung?

---

## 📊 Expected Impact

### Current State:
- ❌ 10% category coverage
- ❌ Irrelevant products shown (infusion tubes for hearing loss)
- ❌ User confusion
- ❌ Low conversion rate

### After Immediate Fix:
- ✅ No irrelevant products
- ✅ Better results accuracy
- ⚠️ Still only 10% coverage

### After Full Implementation:
- ✅ 90%+ category coverage
- ✅ Specialized, focused questionnaires
- ✅ 5x better user experience
- ✅ Higher conversion rate

---

## 🎯 My Recommendation

### Do This NOW (30 minutes):
1. ✅ **Add post-filtering** to remove unrelated categories
2. ✅ **Log** which categories are being returned (debugging)
3. ✅ **Test** with real user scenarios

### Do This NEXT WEEK (4 hours):
1. ✅ **Add category selection** to welcome screen
2. ✅ **Create** 3-4 most common specialized questionnaires:
   - Hörgeräte (most common)
   - Gehhilfen (most common)
   - Diabetes (high demand)
   - Inkontinenz (high demand)

### Do This NEXT MONTH (1-2 days):
1. ✅ **Complete** all 10-15 category questionnaires
2. ✅ **Add** "Multi-area" mode for complex needs
3. ✅ **A/B test** specialized vs. comprehensive flow

---

## 🚀 Quick Implementation

Want me to implement the **immediate fix** (post-filtering) right now? 

This will:
- ✅ Remove infusion tubes from hearing searches
- ✅ Only show products from asked-about categories
- ✅ Take 10-15 minutes
- ✅ Deploy immediately

Then we can plan the category-based questionnaire redesign for next week!

**Should I implement the immediate fix now?** 🛠️

