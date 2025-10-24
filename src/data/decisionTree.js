export const questionFlow = {
  mobility: [
    {
      id: 'mobility_level',
      question: 'Wie gut können Sie ohne Hilfsmittel gehen?',
      type: 'single-choice',
      options: [
        {
          text: 'Ich kann kurze Strecken gehen, brauche etwas zum Festhalten',
          value: 'needs_light_support',
          leads_to: 'mobility_device_type',
          api_criteria: { mobility: true, support_level: 'light', productGroup: '10' },
        },
        {
          text: 'Ich kann nur mit großer Anstrengung gehen',
          value: 'needs_moderate_support',
          leads_to: 'mobility_device_type',
          api_criteria: { mobility: true, support_level: 'moderate', productGroup: '10' },
        },
        {
          text: 'Ich kann nur noch wenige Schritte gehen',
          value: 'needs_strong_support',
          leads_to: 'mobility_device_type',
          api_criteria: { mobility: true, support_level: 'strong', productGroup: '10' },
        },
      ],
    },
    {
      id: 'mobility_device_type',
      question: 'Welche Art von Gehhilfe benötigen Sie?',
      type: 'single-choice',
      options: [
        {
          text: 'Gehstock - Für leichte Unterstützung beim Gehen',
          value: 'gehstock',
          leads_to: 'mobility_features',
          api_criteria: { device_type: 'gehstock', productGroup: '10.01' },
        },
        {
          text: 'Unterarmgehstützen - Für stärkere Unterstützung',
          value: 'unterarmgehstuetzen',
          leads_to: 'mobility_features',
          api_criteria: { device_type: 'unterarmgehstuetzen', productGroup: '10.02' },
        },
        {
          text: 'Rollator - Mit Rädern und Bremsen zum Schieben',
          value: 'rollator',
          leads_to: 'mobility_features',
          api_criteria: { device_type: 'rollator', productGroup: '10.03' },
        },
        {
          text: 'Gehgestell/Gehbock - Stabil, ohne Räder',
          value: 'gehgestell',
          leads_to: 'mobility_features',
          api_criteria: { device_type: 'gehgestell', productGroup: '10.04,10.05' },
        },
        {
          text: 'Gehwagen - Mit Rädern, sehr stabil',
          value: 'gehwagen',
          leads_to: 'mobility_features',
          api_criteria: { device_type: 'gehwagen', productGroup: '10.06' },
        },
        {
          text: 'Ich bin mir nicht sicher',
          value: 'any',
          leads_to: 'mobility_features',
          api_criteria: { productGroup: '10' },
        },
      ],
    },
    {
      id: 'mobility_features',
      question: 'Welche Eigenschaften sind Ihnen wichtig?',
      type: 'multiple-choice',
      options: [
        { text: 'Faltbar (für Transport/Lagerung)', value: 'foldable', api_criteria: { foldable: true } },
        { text: 'Höhenverstellbar', value: 'adjustable', api_criteria: { adjustable: true } },
        { text: 'Mit Bremsen', value: 'brakes', api_criteria: { brakes: true } },
        { text: 'Mit Sitzfläche (für Pausen)', value: 'seat', api_criteria: { seat: true } },
        { text: 'Mit Korb/Einkaufstasche', value: 'basket', api_criteria: { basket: true } },
      ],
    },
    {
      id: 'mobility_usage',
      question: 'Wo und wie möchten Sie die Gehhilfe nutzen?',
      type: 'multiple-choice',
      options: [
        { text: 'In der Wohnung', value: 'indoor', api_criteria: { indoor: true } },
        { text: 'Draußen / Einkaufen', value: 'outdoor', api_criteria: { outdoor: true } },
        { text: 'Auf unebenem Gelände', value: 'terrain', api_criteria: { outdoor: true, robust: true } },
        { text: 'Täglich über längere Strecken', value: 'longdistance', api_criteria: { durable: true } },
      ],
    },
  ],
  bathroom: [
    {
      id: 'bathroom_issue',
      question: 'Welche Schwierigkeiten haben Sie im Badezimmer?',
      type: 'multiple-choice',
      options: [
        {
          text: 'Ich kann nicht lange stehen beim Duschen',
          value: 'shower_standing',
          api_criteria: { productGroup: '04.02', shower_chair: true },
        },
        {
          text: 'Ein- und Aussteigen aus der Badewanne ist schwierig',
          value: 'bathtub_access',
          api_criteria: { productGroup: '04.01', bath_lift: true },
        },
        {
          text: 'Aufstehen von der Toilette ist schwierig',
          value: 'toilet_standing',
          api_criteria: { productGroup: '04', toilet_seat: true },
        },
        {
          text: 'Ich brauche Haltegriffe',
          value: 'grab_bars',
          api_criteria: { productGroup: '04.03', grab_bars: true },
        },
      ],
    },
  ],
  hearing: [
    {
      id: 'hearing_level',
      question: 'Wie würden Sie Ihr Hörvermögen beschreiben?',
      type: 'single-choice',
      options: [
        {
          text: 'Ich muss oft nachfragen und den Fernseher laut stellen',
          value: 'mild',
          leads_to: 'hearing_device_type',
          api_criteria: { productGroup: '13.20', hearing_aid: true, severity: 'mild' },
        },
        {
          text: 'Ich verstehe Gespräche nur noch mit großer Mühe',
          value: 'moderate',
          leads_to: 'hearing_device_type',
          api_criteria: { productGroup: '13.20', hearing_aid: true, severity: 'moderate' },
        },
        {
          text: 'Ich höre fast nichts mehr',
          value: 'severe',
          leads_to: 'hearing_device_type',
          api_criteria: { productGroup: '13.20', hearing_aid: true, severity: 'severe' },
        },
      ],
    },
    {
      id: 'hearing_device_type',
      question: 'Welche Geräteart bevorzugen Sie?',
      type: 'single-choice',
      options: [
        {
          text: 'Hinter dem Ohr (unauffällig, einfach zu bedienen)',
          value: 'bte',
          leads_to: 'hearing_features',
          api_criteria: { device_type: 'HdO' },
        },
        {
          text: 'Im Ohr (sehr diskret, kaum sichtbar)',
          value: 'ite',
          leads_to: 'hearing_features',
          api_criteria: { device_type: 'IdO' },
        },
        {
          text: 'Egal, Hauptsache gute Qualität',
          value: 'any',
          leads_to: 'hearing_features',
          api_criteria: {},
        },
      ],
    },
    {
      id: 'hearing_features',
      question: 'Welche Funktionen sind Ihnen wichtig?',
      type: 'multiple-choice',
      options: [
        {
          text: 'Wiederaufladbar (keine Batterien wechseln)',
          value: 'rechargeable',
          api_criteria: { rechargeable: true },
        },
        {
          text: 'Mit Handy verbinden (Bluetooth)',
          value: 'bluetooth',
          api_criteria: { bluetooth: true },
        },
        {
          text: 'Automatische Lautstärke',
          value: 'auto',
          api_criteria: { automatic: true },
        },
        {
          text: 'Keine besonderen Wünsche',
          value: 'none',
          api_criteria: {},
        },
      ],
    },
    {
      id: 'hearing_situations',
      question: 'Wo haben Sie die größten Schwierigkeiten?',
      type: 'multiple-choice',
      options: [
        {
          text: 'Restaurant / Café (viele Stimmen gleichzeitig)',
          value: 'noise',
          api_criteria: { noise_reduction: true },
        },
        {
          text: 'Telefongespräche',
          value: 'phone',
          api_criteria: { phone_compatible: true },
        },
        {
          text: 'Fernsehen',
          value: 'tv',
          api_criteria: { tv_compatible: true },
        },
        {
          text: 'Überall gleich',
          value: 'general',
          api_criteria: {},
        },
      ],
    },
  ],
  vision: [
    {
      id: 'vision_issue',
      question: 'Welche Seh-Schwierigkeiten haben Sie?',
      type: 'multiple-choice',
      options: [
        {
          text: 'Ich kann kleine Schrift nicht mehr lesen (Zeitung, Medikamente)',
          value: 'reading',
          api_criteria: { productGroup: '25', magnifier: true },
        },
        {
          text: 'Ich brauche mehr Licht zum Lesen',
          value: 'lighting',
          api_criteria: { productGroup: '25.03', lighting: true },
        },
        {
          text: 'Ich sehe verschwommen',
          value: 'blurry',
          api_criteria: { productGroup: '25', vision_aids: true },
        },
      ],
    },
  ],
};

function findQuestion(questionId) {
  return Object.values(questionFlow)
    .flat()
    .find((question) => question.id === questionId);
}

export function buildApiCriteria(answers) {
  const productGroups = new Set();
  const filters = {};

  const mergeFilterValue = (key, value) => {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === 'boolean') {
      if (value) {
        filters[key] = true;
      }
      return;
    }

    if (Array.isArray(value)) {
      const existing = Array.isArray(filters[key])
        ? filters[key]
        : filters[key] !== undefined
        ? [filters[key]]
        : [];
      const merged = new Set(existing);
      value.forEach((entry) => merged.add(entry));
      filters[key] = Array.from(merged);
      return;
    }

    if (typeof value === 'object') {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (nestedKey === 'productGroup') {
          if (nestedValue) {
            productGroups.add(nestedValue);
          }
          continue;
        }
        mergeFilterValue(nestedKey, nestedValue);
      }
      return;
    }

    if (filters[key] === undefined) {
      filters[key] = value;
      return;
    }

    if (Array.isArray(filters[key])) {
      if (!filters[key].includes(value)) {
        filters[key].push(value);
      }
      return;
    }

    if (filters[key] !== value) {
      filters[key] = [filters[key], value];
    }
  };

  for (const [questionId, answer] of Object.entries(answers)) {
    // Skip internal metadata fields (like _selectedCategory)
    if (questionId.startsWith('_')) {
      continue;
    }

    const question = findQuestion(questionId);
    if (!question) continue;

    const selection = Array.isArray(answer) ? answer : [answer];

    for (const selectedValue of selection) {
      const option = question.options.find((opt) => opt.value === selectedValue);
      if (!option?.api_criteria) continue;

      const { productGroup, ...rest } = option.api_criteria;
      if (productGroup) {
        productGroups.add(productGroup);
      }

      for (const [key, value] of Object.entries(rest)) {
        mergeFilterValue(key, value);
      }
    }
  }

  // Fallback: If no productGroups were found from answers, use category default
  if (productGroups.size === 0 && answers._selectedCategory) {
    const categoryDefaults = {
      hearing: '13',
      mobility: '10',
      bathroom: '04',
      vision: '25',
    };
    const defaultGroup = categoryDefaults[answers._selectedCategory];
    if (defaultGroup) {
      productGroups.add(defaultGroup);
    }
  }

  return {
    productGroups: Array.from(productGroups),
    filters,
  };
}
