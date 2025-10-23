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
  },
  
  '03.29': {
    code: '03.29',
    name: 'Applikationshilfen',
    icon: '💊',
    description: 'Hilfsmittel zur Medikamenteneinnahme',
    explanation: 'Applikationshilfen helfen Ihnen, Medikamente einfacher und sicherer einzunehmen. Dazu gehören Tablettenteiler, Tropfhilfen und Dosiergeräte.',
    selectionTips: [
      'Für Tabletten: Teiler mit Fach für Aufbewahrung',
      'Für Augentropfen: Applikationshilfen erleichtern das Treffen',
      'Tablettendose: Mit Wocheneinteilung für bessere Übersicht'
    ]
  },
  
  '10.46': {
    code: '10.46',
    name: 'Einlagen',
    icon: '👟',
    description: 'Orthopädische Schuheinlagen',
    explanation: 'Einlagen unterstützen Ihren Fuß und korrigieren Fehlstellungen. Sie werden individuell an Ihren Fuß angepasst und helfen bei Schmerzen beim Gehen.',
    selectionTips: [
      'Individuell anpassen lassen',
      'Für verschiedene Schuhe: Mehrere Paare anfertigen',
      'Regelmäßig erneuern (alle 6-12 Monate)'
    ]
  },
  
  '11.11': {
    code: '11.11',
    name: 'Kompressionsstrümpfe',
    icon: '🧦',
    description: 'Strümpfe zur Verbesserung der Durchblutung',
    explanation: 'Kompressionsstrümpfe üben Druck auf die Beine aus und fördern so den Rückfluss des Blutes zum Herzen. Sie helfen bei Krampfadern, Venenschwäche und geschwollenen Beinen.',
    selectionTips: [
      'Morgens anziehen (vor dem Aufstehen)',
      'Anziehhilfe nutzen für leichteres Anziehen',
      'Kompressionsklasse nach ärztlicher Verordnung'
    ]
  },
  
  '17.06': {
    code: '17.06',
    name: 'Krankenfahrzeuge',
    icon: '🦼',
    description: 'Elektromobile und Krankenfahrstühle',
    explanation: 'Krankenfahrzeuge sind motorisierte Hilfsmittel, die Ihnen Mobilität auch bei längeren Strecken ermöglichen. Ideal für Einkäufe oder Spaziergänge.',
    selectionTips: [
      'Für draußen: Wetterfestes Modell wählen',
      'Reichweite: Mindestens 10 km für Einkäufe',
      'Kofferraum: Zerlegbar für Auto-Transport'
    ]
  },
  
  '18.50': {
    code: '18.50',
    name: 'Pflegebetten',
    icon: '🛏️',
    description: 'Verstellbare Betten für die Pflege',
    explanation: 'Pflegebetten lassen sich elektrisch in der Höhe und Position verstellen. Das erleichtert das Aufstehen und die Pflege erheblich.',
    selectionTips: [
      'Elektrisch verstellbar: Für Komfort und Pflege',
      'Seitengitter: Für Sicherheit nachts',
      'Pflegematratze: Gegen Wundliegen'
    ]
  },
  
  '19.40': {
    code: '19.40',
    name: 'Lagerungshilfen',
    icon: '🛋️',
    description: 'Kissen und Polster für richtige Lagerung',
    explanation: 'Lagerungshilfen unterstützen eine gesunde Körperhaltung im Bett oder Sessel. Sie beugen Druckstellen und Schmerzen vor.',
    selectionTips: [
      'Für Rücken: Lagerungskissen in Keilform',
      'Für Beine: Hochlagerungskissen',
      'Material: Atmungsaktiv und waschbar'
    ]
  },
  
  '21.28': {
    code: '21.28',
    name: 'Blutdruckmessgeräte',
    icon: '🩺',
    description: 'Geräte zur Blutdruckkontrolle',
    explanation: 'Blutdruckmessgeräte helfen Ihnen, Ihren Blutdruck regelmäßig zu Hause zu kontrollieren. Wichtig bei Bluthochdruck oder Herz-Kreislauf-Erkrankungen.',
    selectionTips: [
      'Oberarm-Gerät: Genauer als Handgelenk',
      'Großes Display: Für bessere Lesbarkeit',
      'Speicherfunktion: Um Werte zu verfolgen'
    ]
  },
  
  '23.04': {
    code: '23.04',
    name: 'Armschienen',
    icon: '🦾',
    description: 'Schienen zur Stabilisierung des Arms',
    explanation: 'Armschienen stabilisieren und entlasten Ihren Arm nach Verletzungen oder bei Erkrankungen. Sie unterstützen die Heilung und lindern Schmerzen.',
    selectionTips: [
      'Individuell angepasst vom Sanitätshaus',
      'Tag und Nacht tragen nach ärztlicher Anweisung',
      'Hautpflege: Darunter regelmäßig eincremen'
    ]
  },
  
  '23.12': {
    code: '23.12',
    name: 'Beinschienen',
    icon: '🦵',
    description: 'Schienen zur Stabilisierung des Beins',
    explanation: 'Beinschienen stützen Ihr Bein und korrigieren Fehlstellungen. Sie helfen beim Gehen und verhindern weitere Schäden.',
    selectionTips: [
      'Beim Orthopädietechniker anpassen lassen',
      'Mit bequemen Schuhen kombinieren',
      'Regelmäßig auf Druckstellen kontrollieren'
    ]
  },
  
  '29.26': {
    code: '29.26',
    name: 'Stomabeutel',
    icon: '🎒',
    description: 'Versorgungssysteme nach Stoma-Operation',
    explanation: 'Stomabeutel sammeln Ausscheidungen bei künstlichem Darmausgang. Es gibt verschiedene Systeme - einteilig oder zweiteilig, mit oder ohne Filter.',
    selectionTips: [
      'Individuelle Beratung durch Stomatherapeuten',
      'Hautfreundliche Klebefläche wählen',
      'Filter: Verhindert unangenehme Gerüche'
    ]
  },
  
  '50.45': {
    code: '50.45',
    name: 'Dekubitus-Hilfsmittel',
    icon: '🛡️',
    description: 'Hilfsmittel gegen Wundliegen',
    explanation: 'Dekubitus-Hilfsmittel wie Spezialmatratzen und Lagerungskissen verteilen den Druck gleichmäßig und beugen so Druckgeschwüren (Wundliegen) vor.',
    selectionTips: [
      'Wechseldruckmatratze: Für Hochrisiko-Patienten',
      'Weichlagerung: Für leichte bis mittlere Gefährdung',
      'Regelmäßig umlagern bleibt wichtig'
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

