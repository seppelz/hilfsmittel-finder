export const questionFlow = {
  mobility: [
    {
      id: 'mobility_ability',
      question: 'Wie gut können Sie gehen?',
      type: 'single-choice',
      options: [
        {
          text: 'Ich kann kurze Strecken gehen, brauche aber Unterstützung',
          value: 'limited_walking',
          leads_to: 'mobility_support_type',
          api_criteria: { mobility: true, walker_needed: true, productGroup: '10' },
        },
        {
          text: 'Ich kann nur mit großer Mühe einige Schritte gehen',
          value: 'very_limited',
          leads_to: 'mobility_wheelchair',
          api_criteria: { mobility: true, wheelchair_needed: true, productGroup: '10' },
        },
        {
          text: 'Ich kann nicht mehr selbstständig gehen',
          value: 'no_walking',
          leads_to: 'mobility_wheelchair_type',
          api_criteria: { mobility: true, wheelchair_needed: true, fulltime: true, productGroup: '10' },
        },
      ],
    },
    {
      id: 'mobility_support_type',
      question: 'Welche Unterstützung benötigen Sie?',
      type: 'single-choice',
      condition: { previous: 'mobility_ability', value: 'limited_walking' },
      options: [
        {
          text: 'Ich brauche etwas zum Festhalten beim Gehen',
          value: 'walker',
          api_criteria: { productGroup: '10', walker: true },
        },
        {
          text: 'Ich brauche Sitzpausen beim Gehen',
          value: 'rollator',
          api_criteria: { productGroup: '10', rollator: true },
        },
      ],
    },
    {
      id: 'mobility_environment',
      question: 'Wo möchten Sie das Hilfsmittel hauptsächlich nutzen?',
      type: 'multiple-choice',
      options: [
        { text: 'In der Wohnung', value: 'indoor', api_criteria: { indoor: true } },
        { text: 'Draußen / Einkaufen', value: 'outdoor', api_criteria: { outdoor: true } },
        { text: 'Treppen überwinden', value: 'stairs', api_criteria: { stairs: true, productGroup: '10' } },
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

  return {
    productGroups: Array.from(productGroups),
    filters,
  };
}
