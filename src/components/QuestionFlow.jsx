import { useState, useEffect } from 'react';
import { questionFlow } from '../data/decisionTree';

function getQuestionsForCategory(category) {
  return questionFlow[category] ?? [];
}

function getInitialCategoryOrder(selectedCategory) {
  // If specific category selected, only show that one
  if (selectedCategory && selectedCategory !== 'comprehensive') {
    return [selectedCategory];
  }
  
  // Otherwise show all categories
  return ['mobility', 'bathroom', 'hearing', 'vision'];
}

export function QuestionFlow({
  insuranceType,
  onComplete,
  onBack,
  initialAnswers = {},
  onAnswersChange,
}) {
  // Extract selected category if it exists
  const selectedCategory = initialAnswers._selectedCategory;
  
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [showValidation, setShowValidation] = useState(false);
  const [screenReaderMessage, setScreenReaderMessage] = useState('');

  const categories = getInitialCategoryOrder(selectedCategory);
  const activeCategory = categories[categoryIndex];
  const questions = getQuestionsForCategory(activeCategory);

  useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setShowValidation(false);
  };

  const handleNext = () => {
    if (!questions.every((question) => Boolean(answers[question.id]))) {
      setShowValidation(true);
      setScreenReaderMessage('Bitte beantworten Sie alle Fragen, bevor Sie fortfahren.');
      return;
    }

    if (categoryIndex < categories.length - 1) {
      setCategoryIndex((index) => index + 1);
    } else {
      onComplete?.(answers);
    }
  };

  const handleBack = () => {
    if (categoryIndex === 0) {
      onBack?.();
      return;
    }

    setCategoryIndex((index) => index - 1);
  };

  const questionsCompleted = questions.every((question) => Boolean(answers[question.id]));
  const progress = ((categoryIndex + (questionsCompleted ? 1 : 0)) / categories.length) * 100;

  useEffect(() => {
    setScreenReaderMessage(`${getCategoryHeading(activeCategory)}. Frage ${categoryIndex + 1} von ${categories.length}.`);
  }, [activeCategory, categoryIndex, categories.length]);

  useEffect(() => {
    onAnswersChange?.(answers);
  }, [answers, onAnswersChange]);

  return (
    <section className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-4 py-10">
      <header className="sticky top-0 rounded-2xl bg-white/95 p-6 shadow-md backdrop-blur">
        <span className="sr-only" aria-live="polite">{screenReaderMessage}</span>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="text-lg font-semibold text-primary hover:text-blue-700"
          >
            Zurück
          </button>

          <p className="text-lg text-gray-600">
            Schritt {categoryIndex + 1} von {categories.length}
          </p>
        </div>

        <div className="mt-4 h-3 w-full rounded-full bg-gray-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(8, Math.round(progress))}%` }} />
        </div>

        <h2 className="mt-4 text-3xl font-bold text-text">
          {getCategoryHeading(activeCategory)}
        </h2>
        <p className="text-gray-600">
          Bitte beantworten Sie die folgenden Fragen, um passende Hilfsmittel zu finden.
        </p>
      </header>

      <div className="flex-1 space-y-6">
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={answers[question.id]}
            onChange={(value) => handleAnswerChange(question.id, value)}
            showValidation={showValidation}
            answers={answers}
          />
        ))}
      </div>

      <footer className="mt-auto flex justify-end gap-4 pb-6">
        <button
          type="button"
          onClick={handleNext}
          disabled={!questionsCompleted}
          className="rounded-xl bg-primary px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {categoryIndex === categories.length - 1 ? 'Weiter zu den Ergebnissen' : 'Weiter'}
        </button>
      </footer>
    </section>
  );
}

function getCategoryHeading(category) {
  switch (category) {
    case 'mobility':
      return 'Mobilität & Fortbewegung';
    case 'bathroom':
      return 'Sicherheit im Badezimmer';
    case 'hearing':
      return 'Hörunterstützung';
    case 'vision':
      return 'Sehhilfen und Beleuchtung';
    default:
      return 'Fragen';
  }
}

function QuestionCard({ question, value, onChange, showValidation, answers }) {
  const isUnanswered = showValidation && (value === undefined || (Array.isArray(value) && value.length === 0));

  return (
    <article className={`rounded-3xl border-2 p-6 shadow-md ${isUnanswered ? 'border-error bg-red-50/40' : 'border-transparent bg-white'}`}>
      <h3 className="text-2xl font-semibold text-text">{question.question}</h3>
      <div className="mt-4 space-y-3">
        {question.type === 'single-choice' && (
          <SingleChoiceQuestion options={question.options} value={value} onChange={onChange} answers={answers} />
        )}
        {question.type === 'multiple-choice' && (
          <MultipleChoiceQuestion options={question.options} value={value ?? []} onChange={onChange} answers={answers} />
        )}
      </div>
      {isUnanswered && (
        <p className="mt-3 text-sm font-semibold text-error">Bitte wählen Sie eine Option aus.</p>
      )}
    </article>
  );
}

function SingleChoiceQuestion({ options, value, onChange, answers }) {
  // Filter options based on conditions
  const visibleOptions = options.filter(option => {
    if (!option.condition) return true; // No condition = always visible
    
    const { previous, value: conditionValue, values: conditionValues } = option.condition;
    const previousAnswer = answers[previous];
    
    // Support both single value and array of values
    if (conditionValues) {
      return conditionValues.includes(previousAnswer);
    }
    if (conditionValue !== undefined) {
      return previousAnswer === conditionValue;
    }
    
    return true;
  });
  
  return (
    <div className="space-y-3">
      {visibleOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`w-full rounded-2xl border-2 p-4 text-left text-lg transition ${
            value === option.value
              ? 'border-primary bg-blue-50 text-primary'
              : 'border-gray-200 bg-white hover:border-blue-200'
          }`}
        >
          {option.text}
        </button>
      ))}
    </div>
  );
}

function MultipleChoiceQuestion({ options, value, onChange, answers }) {
  // Filter options based on conditions
  const visibleOptions = options.filter(option => {
    if (!option.condition) return true; // No condition = always visible
    
    const { previous, value: conditionValue, values: conditionValues } = option.condition;
    const previousAnswer = answers[previous];
    
    // Support both single value and array of values
    if (conditionValues) {
      return conditionValues.includes(previousAnswer);
    }
    if (conditionValue !== undefined) {
      return previousAnswer === conditionValue;
    }
    
    return true;
  });
  
  const handleToggle = (optionValue) => {
    const selection = new Set(value ?? []);
    if (selection.has(optionValue)) {
      selection.delete(optionValue);
    } else {
      selection.add(optionValue);
    }
    onChange(Array.from(selection));
  };

  return (
    <ul className="space-y-3">
      {visibleOptions.map((option) => {
        const selected = value?.includes(option.value);
        return (
          <li key={option.value}>
            <button
              type="button"
              onClick={() => handleToggle(option.value)}
              className={`w-full rounded-2xl border-2 p-4 text-left text-lg transition ${
                selected
                  ? 'border-primary bg-blue-50 text-primary'
                  : 'border-gray-200 bg-white hover:border-blue-200'
              }`}
            >
              {option.text}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
