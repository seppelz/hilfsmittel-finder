// Category-level context and explanations for product groups
// Helps seniors understand what they're looking at

export const PRODUCT_CATEGORIES = {
  '13.20': {
    code: '13.20',
    name: 'Hörgeräte',
    icon: '👂',
    description: 'Elektronische Geräte, die Ihnen helfen, besser zu hören',
    explanation: 'Hörgeräte verstärken Geräusche und Sprache. Es gibt verschiedene Bauformen: manche sitzen unsichtbar im Gehörgang, andere hinter dem Ohr. Je nach Stärke Ihres Hörverlusts brauchen Sie unterschiedliche Leistungsstufen.',
    commonQuestions: [
      {
        question: 'Welche Bauform ist am unauffälligsten?',
        answer: 'IIC-Hörgeräte (Invisible-In-Canal) sitzen komplett im Gehörgang und sind von außen nicht sichtbar.'
      },
      {
        question: 'Brauche ich Batterien oder ist es wiederaufladbar?',
        answer: 'Moderne Hörgeräte mit "R" im Namen sind wiederaufladbar - Sie laden sie wie ein Handy auf.'
      },
      {
        question: 'Kann ich damit telefonieren?',
        answer: 'Hörgeräte mit "T" (Telefonspule) oder "Direct/Bluetooth" eignen sich besonders für Telefonate.'
      }
    ],
    selectionTips: [
      'Für starken Hörverlust: Achten Sie auf "HP" (High Power)',
      'Wenn Sie Batteriewechsel vermeiden wollen: Wählen Sie ein "R"-Modell (wiederaufladbar)',
      'Für Unauffälligkeit: IIC oder CIC Modelle sind am kleinsten'
    ]
  },
  
  '07.99': {
    code: '07.99',
    name: 'Hörhilfen',
    icon: '🔊',
    description: 'Geräte zur Verbesserung des Hörvermögens',
    explanation: 'Hörhilfen umfassen Hörgeräte und andere Hilfsmittel, die Ihnen helfen, Geräusche und Sprache besser wahrzunehmen.',
    commonQuestions: [
      {
        question: 'Was ist der Unterschied zu normalen Hörgeräten?',
        answer: 'Hörhilfen ist der Oberbegriff - Hörgeräte sind die häufigste Form davon.'
      }
    ],
    selectionTips: [
      'Lassen Sie sich von einem Hörgeräteakustiker beraten',
      'Probieren Sie verschiedene Modelle aus'
    ]
  },
  
  '09.12': {
    code: '09.12',
    name: 'Gehhilfen',
    icon: '🚶',
    description: 'Hilfsmittel für sicheres und stabiles Gehen',
    explanation: 'Gehhilfen geben Ihnen Halt und Sicherheit beim Laufen. Es gibt einfache Gehstöcke, Gehwagen (Rollatoren) mit Sitzfläche, und spezielle Modelle für drinnen oder draußen.',
    commonQuestions: [
      {
        question: 'Für drinnen oder draußen?',
        answer: 'Rollatoren für draußen haben größere Räder und sind robuster. Indoor-Rollatoren sind leichter und wendiger.'
      },
      {
        question: 'Mit oder ohne Sitzgelegenheit?',
        answer: 'Die meisten Rollatoren haben eine Sitzfläche zum Ausruhen. Einfache Gehwagen nicht.'
      },
      {
        question: 'Wie schwer darf es sein?',
        answer: 'Leichte Modelle wiegen 5-7 kg, Standard-Rollatoren 7-10 kg. Wählen Sie ein Gewicht, das Sie noch heben können.'
      }
    ],
    selectionTips: [
      'Mit Sitzfläche: Gut für längere Wege (Einkaufen, Spazieren)',
      'Faltbar: Praktisch für Transport im Auto',
      'Outdoor-Reifen: Für unebene Wege und Bordsteine'
    ]
  },
  
  '09.24': {
    code: '09.24',
    name: 'Rollstühle',
    icon: '♿',
    description: 'Rollstühle für eingeschränkte Mobilität',
    explanation: 'Rollstühle ermöglichen Fortbewegung, wenn Gehen nicht mehr möglich ist. Es gibt manuelle Rollstühle (selbst schieben oder geschoben werden) und elektrische Rollstühle (mit Motor).',
    commonQuestions: [
      {
        question: 'Manuell oder elektrisch?',
        answer: 'Manuelle Rollstühle sind leichter und günstiger. Elektrische Rollstühle sind für längere Strecken und wenn Sie nicht selbst schieben können.'
      },
      {
        question: 'Für drinnen oder draußen?',
        answer: 'Standard-Rollstühle sind für beide geeignet. Spezielle Outdoor-Modelle haben größere Räder.'
      }
    ],
    selectionTips: [
      'Faltbar: Zum Transport im Auto',
      'Leichtgewicht: Einfacher zu handhaben',
      'Bremsen: Wichtig für Sicherheit'
    ]
  },
  
  '09.40': {
    code: '09.40',
    name: 'Treppensteighilfen',
    icon: '📶',
    description: 'Hilfsmittel zur Überwindung von Treppen',
    explanation: 'Treppensteighilfen helfen Ihnen, Treppen sicher zu bewältigen. Dazu gehören Treppenlifte, Plattformlifte und mobile Steighilfen.',
    commonQuestions: [
      {
        question: 'Wird ein Treppenlift von der Kasse bezahlt?',
        answer: 'Treppenlifte sind oft Wohnumfeldverbesserungen und werden teilweise von der Pflegekasse bezahlt.'
      }
    ],
    selectionTips: [
      'Lassen Sie Ihr Treppenhaus vermessen',
      'Prüfen Sie Platzbedarf und Montage'
    ]
  },
  
  '04.40': {
    code: '04.40',
    name: 'Badehilfen',
    icon: '🚿',
    description: 'Hilfsmittel für Sicherheit im Badezimmer',
    explanation: 'Badehilfen machen Duschen und Baden sicherer. Dazu gehören Duschhocker, Wannenlifter, Haltegriffe und rutschfeste Matten.',
    commonQuestions: [
      {
        question: 'Was brauche ich zum sicheren Duschen?',
        answer: 'Ein Duschhocker oder Duschstuhl gibt Halt. Haltegriffe an der Wand bieten zusätzliche Sicherheit.'
      },
      {
        question: 'Kann ich noch in die Badewanne?',
        answer: 'Wannenlifter und Einstiegshilfen erleichtern das Ein- und Aussteigen erheblich.'
      }
    ],
    selectionTips: [
      'Duschhocker: Höhenverstellbar und rutschfest',
      'Haltegriffe: An stabiler Wand montieren',
      'Einstiegshilfe: Für Badewanne oder hohe Duschtasse'
    ]
  },
  
  '04.41': {
    code: '04.41',
    name: 'Toilettensitzerhöhungen',
    icon: '🚽',
    description: 'Erhöhungen für leichteres Aufstehen von der Toilette',
    explanation: 'Toilettensitzerhöhungen erleichtern das Hinsetzen und Aufstehen. Sie werden auf die normale Toilette aufgesetzt und erhöhen die Sitzhöhe um 5-15 cm.',
    commonQuestions: [
      {
        question: 'Wie hoch sollte die Erhöhung sein?',
        answer: 'Das hängt von Ihrer Körpergröße ab. In der Regel sind 10 cm ein guter Kompromiss.'
      },
      {
        question: 'Mit oder ohne Armlehnen?',
        answer: 'Armlehnen geben zusätzlichen Halt beim Aufstehen - besonders empfehlenswert bei Knieproblemen.'
      }
    ],
    selectionTips: [
      'Mit Armlehnen: Für besseren Halt',
      'Gepolstert: Für mehr Komfort',
      'Befestigung: Achten Sie auf sichere Montage'
    ]
  },
  
  '25.50': {
    code: '25.50',
    name: 'Sehhilfen und Lupen',
    icon: '🔍',
    description: 'Hilfsmittel für besseres Sehen und Lesen',
    explanation: 'Sehhilfen umfassen Lupen, Bildschirmlesegeräte und Beleuchtungshilfen. Sie helfen beim Lesen kleiner Schrift (Zeitung, Medikamente, Preisschilder).',
    commonQuestions: [
      {
        question: 'Welche Lupe ist die richtige?',
        answer: 'Für Zeitung lesen: Handleupen. Für längeres Lesen: Standlupen mit Beleuchtung.'
      },
      {
        question: 'Gibt es elektronische Hilfen?',
        answer: 'Ja, Bildschirmlesegeräte vergrößern Text auf einem Monitor - ideal für längeres Lesen.'
      }
    ],
    selectionTips: [
      'Mit Beleuchtung: Deutlich bessere Sicht',
      'Vergrößerung: 2-3x für leichte, 5-10x für starke Sehschwäche',
      'Tragbar oder stationär: Je nach Verwendungszweck'
    ]
  },
  
  '51.40': {
    code: '51.40',
    name: 'Inkontinenzartikel',
    icon: '🩹',
    description: 'Hilfsmittel bei Blasen- oder Darmschwäche',
    explanation: 'Inkontinenzartikel schützen bei unkontrolliertem Harn- oder Stuhlverlust. Es gibt verschiedene Saugstärken und Formen für Tag und Nacht.',
    commonQuestions: [
      {
        question: 'Welche Größe brauche ich?',
        answer: 'Die Größe richtet sich nach Ihrem Hüftumfang. Messen Sie mit einem Maßband.'
      },
      {
        question: 'Wie oft kann ich sie wechseln?',
        answer: 'Die Kasse übernimmt in der Regel ausreichend Produkte für mehrfachen täglichen Wechsel.'
      }
    ],
    selectionTips: [
      'Saugstärke: Leicht, mittel, stark - je nach Bedarf',
      'Pants oder Vorlagen: Pants sind wie Unterwäsche',
      'Hautfreundlich: Achten Sie auf atmungsaktive Materialien'
    ]
  }
};

/**
 * Get category context by product code
 * @param {string} productCode - Product code (e.g., "13.20.12.1234")
 * @returns {object|null} Category context or null
 */
export function getCategoryContext(productCode) {
  if (!productCode) {
    return null;
  }
  
  // Extract first 5 characters (e.g., "13.20" from "13.20.12.1234")
  const categoryCode = productCode.substring(0, 5);
  
  return PRODUCT_CATEGORIES[categoryCode] || null;
}

/**
 * Get icon for category
 * @param {string} productCode - Product code
 * @returns {string} Emoji icon
 */
export function getCategoryIcon(productCode) {
  const context = getCategoryContext(productCode);
  return context?.icon || '📦';
}

/**
 * Get category name
 * @param {string} productCode - Product code
 * @returns {string} Category name
 */
export function getCategoryName(productCode) {
  const context = getCategoryContext(productCode);
  return context?.name || 'Hilfsmittel';
}

/**
 * Get explanation for category
 * @param {string} productCode - Product code
 * @returns {string} Plain German explanation
 */
export function getCategoryExplanation(productCode) {
  const context = getCategoryContext(productCode);
  return context?.explanation || '';
}

