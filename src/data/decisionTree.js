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
          api_criteria: { mobility: true, walker_needed: true, productGroup: '09.12' },
        },
        {
          text: 'Ich kann nur mit großer Mühe einige Schritte gehen',
          value: 'very_limited',
          leads_to: 'mobility_wheelchair',
          api_criteria: { mobility: true, wheelchair_needed: true, productGroup: '09.24' },
        },
        {
          text: 'Ich kann nicht mehr selbstständig gehen',
          value: 'no_walking',
          leads_to: 'mobility_wheelchair_type',
          api_criteria: { mobility: true, wheelchair_needed: true, fulltime: true, productGroup: '09.24.01' },
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
          api_criteria: { productGroup: '09.12', walker: true },
        },
        {
          text: 'Ich brauche Sitzpausen beim Gehen',
          value: 'rollator',
          api_criteria: { productGroup: '09.12.02', rollator: true },
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
        { text: 'Treppen überwinden', value: 'stairs', api_criteria: { stairs: true, productGroup: '09.40' } },
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
          api_criteria: { productGroup: '04.40.04', shower_chair: true },
        },
        {
          text: 'Ein- und Aussteigen aus der Badewanne ist schwierig',
          value: 'bathtub_access',
          api_criteria: { productGroup: '04.40', bath_lift: true },
        },
        {
          text: 'Aufstehen von der Toilette ist schwierig',
          value: 'toilet_standing',
          api_criteria: { productGroup: '04.41', toilet_seat: true },
        },
        {
          text: 'Ich brauche Haltegriffe',
          value: 'grab_bars',
          api_criteria: { productGroup: '04.40.01', grab_bars: true },
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
          api_criteria: { productGroup: '07.99', hearing_aid: true, severity: 'mild' },
        },
        {
          text: 'Ich verstehe Gespräche nur noch mit großer Mühe',
          value: 'moderate',
          api_criteria: { productGroup: '07.99', hearing_aid: true, severity: 'moderate' },
        },
        {
          text: 'Ich höre fast nichts mehr',
          value: 'severe',
          api_criteria: { productGroup: '07.99', hearing_aid: true, severity: 'severe' },
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
          api_criteria: { productGroup: '25.50', magnifier: true },
        },
        {
          text: 'Ich brauche mehr Licht zum Lesen',
          value: 'lighting',
          api_criteria: { productGroup: '25.56', lighting: true },
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

  // Always log in production for debugging
  console.log('🔍 [buildApiCriteria] Processing answers:', answers);

  for (const [questionId, answer] of Object.entries(answers)) {
    // Skip internal metadata fields (like _selectedCategory)
    if (questionId.startsWith('_')) {
      console.log('⏭️ [buildApiCriteria] Skipping internal field:', questionId);
      continue;
    }

    const question = findQuestion(questionId);
    if (!question) {
      console.warn('⚠️ [buildApiCriteria] Question not found:', questionId);
      continue;
    }

    const selection = Array.isArray(answer) ? answer : [answer];

    for (const selectedValue of selection) {
      const option = question.options.find((opt) => opt.value === selectedValue);
      if (!option?.api_criteria) {
        console.warn('⚠️ [buildApiCriteria] No api_criteria for:', questionId, '=', selectedValue);
        continue;
      }

      const { productGroup, ...rest } = option.api_criteria;
      if (productGroup) {
        productGroups.add(productGroup);
        console.log('✅ [buildApiCriteria] Added productGroup:', productGroup, 'from', questionId, '=', selectedValue);
      }

      for (const [key, value] of Object.entries(rest)) {
        mergeFilterValue(key, value);
      }
    }
  }

  const result = {
    productGroups: Array.from(productGroups),
    filters,
  };

  console.log('✅ [buildApiCriteria] Final criteria:', result);

  return result;
}
