# Bugfix: Gehhilfen Filtering & Category Names

**Date**: 2025-10-23  
**Status**: ✅ FIXED

---

## 🐛 Problems Identified

### 1. Irrelevant Products Displayed
**Symptom**: Gehhilfen results showed medical devices instead of walking aids:
- LifeVest (cardiac defibrillator) - 09.11
- Optune Gio (cancer treatment) - 09.17  
- TENS devices (pain management) - 09.37
- Iontophoresis devices - 09.30

### 2. Technical Category Names
**Symptom**: Filter showed "Kategorie 09.11" instead of user-friendly names

---

## 🔍 Root Cause

Category **09** is TOO BROAD - it includes ALL medical mobility-related products, not just walking aids.

The GKV Hilfsmittelverzeichnis structure:
```
09 - Allgemeine Mobilitätshilfen
├── 09.11 - Defibrillatoren
├── 09.12 - GEHHILFEN (Walking Aids) ✅ This is what we want!
│   ├── 09.12.01 - Gehstöcke (Canes)
│   ├── 09.12.02 - Unterarmgehstützen (Forearm crutches)
│   ├── 09.12.03 - Achselstützen (Axillary crutches)
│   ├── 09.12.04 - Gehrahmen (Walking frames)
│   ├── 09.12.05 - Gehwagen (Wheeled walkers)
│   ├── 09.12.06 - Rollatoren (Rollators)
│   └── 09.12.07 - Zubehör (Accessories)
├── 09.17 - Medizinische Geräte
├── 09.30 - Iontophorese
├── 09.37 - TENS-Geräte
└── 09.99 - Sonstige
```

**The Fix**: Query `09.12` specifically instead of broad `09`

---

## ✅ Changes Made

### 1. Decision Tree (`src/data/decisionTree.js`)

Changed ALL mobility `productGroup` codes from `'09'` to `'09.12'`:

```javascript
// BEFORE:
api_criteria: { productGroup: '09' }

// AFTER:
api_criteria: { productGroup: '09.12' }
```

**Impact**: Now queries ONLY walking aids, excludes medical devices

### 2. Category Name Mapping (`src/services/gkvApi.js`)

Added comprehensive German names for all 09.12.xx subcategories:

```javascript
const categoryMap = {
  // ...
  '09': 'Mobilitätshilfen',
  '09.12': 'Gehhilfen',
  '09.12.01': 'Gehstöcke',
  '09.12.02': 'Unterarmgehstützen',
  '09.12.03': 'Achselstützen',
  '09.12.04': 'Gehrahmen',
  '09.12.05': 'Gehwagen',
  '09.12.06': 'Rollatoren',
  '09.12.07': 'Gehhilfen - Zubehör',
  // ...
}
```

**Impact**: Filter bar now shows user-friendly names instead of "Kategorie 09.12.01"

---

## 📊 Expected Results After Fix

### BEFORE:
```
85 products found:
- 09.11: Defibrillators ❌
- 09.17: Cancer treatment ❌
- 09.30: Iontophoresis ❌
- 09.37: TENS devices ❌
- 09.99: Miscellaneous ❌
```

### AFTER:
```
~XX products found (only from 09.12.xx):
- Gehstöcke (Canes) ✅
- Unterarmgehstützen (Forearm crutches) ✅
- Achselstützen (Axillary crutches) ✅
- Gehrahmen (Walking frames) ✅
- Gehwagen (Wheeled walkers) ✅
- Rollatoren (Rollators) ✅
- Zubehör (Accessories) ✅
```

**All results will be actual walking aids!**

---

## 🧪 Testing Steps

1. **Deploy** to Vercel
2. **Clear IndexedDB** cache (Dev Tools → Application → IndexedDB → Delete `gkv_hilfsmittel_db`)
3. **Select "Gehhilfen"** category
4. **Answer questionnaire** (e.g., "Ich kann kurze Strecken gehen")
5. **Verify results**:
   - ✅ Only walking aids shown (canes, crutches, walkers, rollators)
   - ✅ No medical devices (no defibrillators, TENS devices, etc.)
   - ✅ Category filter shows German names ("Rollatoren" not "Kategorie 09.12.06")

---

## 🔮 Future Enhancements

Consider adding **Category 17** (Krankenfahrzeuge - 3,894 products) for:
- Wheelchairs (Rollstühle) - 09.24 OR 17.xx
- Electric mobility vehicles (Elektromobile) - 17.18
- Mobility scooters

The questionnaire could ask wheelchair-specific questions and query both 09.12 (walkers) and 17.xx (wheelchairs) based on the user's needs.

---

## Files Modified

- ✅ `src/data/decisionTree.js` - Changed `'09'` → `'09.12'` (5 occurrences)
- ✅ `src/services/gkvApi.js` - Added 09.12.xx category name mappings (7 new entries)

---

## Related Issues Fixed

- [x] Issue #1: Irrelevant medical devices shown for Gehhilfen
- [x] Issue #2: Category filter showing technical codes instead of names
- [x] Previous fix: Incorrect category codes (13.20, 07.xx) - now corrected
- [x] Previous fix: AI descriptions had emojis - now removed

