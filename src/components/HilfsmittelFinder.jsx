import { useState, useEffect } from 'react';
import { WelcomeScreen } from './WelcomeScreen';
import { QuestionFlow } from './QuestionFlow';
import { ProductSearch } from './ProductSearch';
import { ResultsDisplay } from './ResultsDisplay';
import { LetterGenerator } from './LetterGenerator';
import { buildApiCriteria } from '../data/decisionTree';
import { trackEvent, logError } from '../utils/analytics';

const PAGE_SIZE = 12;
const ANSWERS_STORAGE_KEY = 'aboelo_questionnaire_answers';

export function HilfsmittelFinder() {
  const [stage, setStage] = useState('welcome');
  const [answers, setAnswers] = useState({});
  const [insuranceType, setInsuranceType] = useState(null);
  const [pflegegrad, setPflegegrad] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchResults, setSearchResults] = useState({
    products: [],
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(ANSWERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          setAnswers(parsed);
        }
      }
    } catch (error) {
      logError('answers_restore_failed', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (!answers || Object.keys(answers).length === 0) {
        window.localStorage.removeItem(ANSWERS_STORAGE_KEY);
      } else {
        window.localStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(answers));
      }
    } catch (error) {
      logError('answers_persist_failed', error);
    }
  }, [answers]);

  const handleStart = (insurance, pflege) => {
    setInsuranceType(insurance);
    setPflegegrad(pflege);
    setStage('questions');
    trackEvent('onboarding_started', { insurance, pflege });
  };

  const handleQuestionsComplete = (finalAnswers) => {
    setAnswers(finalAnswers);
    setPage(1);
    setStage('search');
    trackEvent('questionnaire_completed', { answeredQuestions: Object.keys(finalAnswers).length });
  };

  const handleSearchComplete = (results) => {
    setSearchResults(results);
    setPage(results.page);
    setSelectedProducts([]);
    setStage('results');
    trackEvent('search_completed', {
      total: results.total,
      groups: (results.products ?? []).map((item) => item._groupId).filter(Boolean),
    });
  };

  const handleProductSelection = (products) => {
    setSelectedProducts(products);
  };

  const handleGenerateLetter = () => {
    setStage('letter');
    trackEvent('letter_started', { selected: selectedProducts.length });
  };

  const apiCriteria = Object.keys(answers).length ? buildApiCriteria(answers) : null;
  const hasSearchCriteria = Boolean(apiCriteria && apiCriteria.productGroups && apiCriteria.productGroups.length > 0);

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    setStage('search');
    trackEvent('pagination_change', { page: nextPage });
  };

  return (
    <div className="min-h-screen bg-background">
      {stage === 'welcome' && (
        <WelcomeScreen onStart={handleStart} />
      )}

      {stage === 'questions' && (
        <QuestionFlow
          insuranceType={insuranceType}
          initialAnswers={answers}
          onAnswersChange={setAnswers}
          onComplete={handleQuestionsComplete}
          onBack={() => setStage('welcome')}
        />
      )}

      {stage === 'search' && (
        <section className="mx-auto max-w-4xl space-y-8 px-4 py-16">
          <header className="rounded-3xl bg-white p-6 shadow">
            <h2 className="text-3xl font-bold text-text">Wir durchsuchen die Hilfsmitteldatenbank</h2>
            <p className="mt-2 text-gray-600">
              Einen Moment bitte – wir gleichen Ihre Angaben mit dem offiziellen Hilfsmittelverzeichnis des GKV-Spitzenverbands ab.
            </p>
          </header>

          {hasSearchCriteria ? (
            <ProductSearch
              criteria={apiCriteria}
              onResultsFound={handleSearchComplete}
              page={page}
              pageSize={PAGE_SIZE}
            />
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
              <h3 className="text-2xl font-semibold text-text">Bitte präzisieren Sie Ihre Angaben</h3>
              <p className="mt-2 text-gray-600">
                Für Ihre Antworten konnten keine passenden Kategorien ermittelt werden. Gehen Sie einen Schritt zurück und ergänzen Sie weitere Informationen.
              </p>
              <button
                type="button"
                onClick={() => setStage('questions')}
                className="mt-6 rounded-xl bg-primary px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"
              >
                Zurück zum Fragebogen
              </button>
            </div>
          )}
        </section>
      )}

      {stage === 'results' && (
        <ResultsDisplay
          products={searchResults.products}
          totalResults={searchResults.total}
          insuranceType={insuranceType}
          pflegegrad={pflegegrad}
          selectedProducts={selectedProducts}
          onProductsSelected={handleProductSelection}
          onGenerateLetter={handleGenerateLetter}
          onBack={() => setStage('questions')}
          pagination={{
            page: searchResults.page,
            pageSize: searchResults.pageSize,
            total: searchResults.total,
            totalPages: searchResults.totalPages,
            onPageChange: handlePageChange,
          }}
          userAnswers={answers}
          categories={searchResults.categories || []}
        />
      )}

      {stage === 'letter' && (
        <LetterGenerator
          products={selectedProducts}
          insuranceType={insuranceType}
          pflegegrad={pflegegrad}
          answers={answers}
          onBack={() => setStage('results')}
        />
      )}
    </div>
  );
}
