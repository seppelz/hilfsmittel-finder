import { useState } from 'react';
import { Heart, Ear, Eye, Footprints, Droplets, Bed, Activity, Accessibility } from 'lucide-react';

const INSURANCE_TYPES = [
  { value: 'gkv', label: 'Gesetzliche Krankenversicherung (GKV)' },
  { value: 'pkv', label: 'Private Krankenversicherung (PKV)' },
];

const PFLEGEGRAD_OPTIONS = [
  { value: 'none', label: 'Kein Pflegegrad' },
  { value: '1', label: 'Pflegegrad 1' },
  { value: '2', label: 'Pflegegrad 2' },
  { value: '3', label: 'Pflegegrad 3' },
  { value: '4', label: 'Pflegegrad 4' },
  { value: '5', label: 'Pflegegrad 5' },
];

const CATEGORY_OPTIONS = [
  {
    id: 'hearing',
    icon: Ear,
    emoji: '👂',
    title: 'Hörgeräte',
    description: 'Ich höre schlecht',
    color: 'blue'
  },
  {
    id: 'mobility',
    icon: Footprints,
    emoji: '🦯',
    title: 'Gehhilfen',
    description: 'Ich brauche Unterstützung beim Gehen',
    color: 'emerald'
  },
  {
    id: 'vision',
    icon: Eye,
    emoji: '🔍',
    title: 'Sehhilfen',
    description: 'Ich sehe schlecht oder kann nicht mehr lesen',
    color: 'purple'
  },
  {
    id: 'bathroom',
    icon: Droplets,
    emoji: '🚿',
    title: 'Badehilfen',
    description: 'Ich brauche Hilfe im Bad oder auf der Toilette',
    color: 'cyan'
  },
  {
    id: 'diabetes',
    icon: Activity,
    emoji: '🩸',
    title: 'Diabetes',
    description: 'Blutzucker messen & Diabetesbedarf',
    color: 'red',
    comingSoon: true
  },
  {
    id: 'incontinence',
    icon: Heart,
    emoji: '💊',
    title: 'Inkontinenz',
    description: 'Inkontinenzartikel',
    color: 'pink',
    comingSoon: true
  },
  {
    id: 'care',
    icon: Bed,
    emoji: '🛏️',
    title: 'Pflege',
    description: 'Pflegebett & Lagerungshilfen',
    color: 'indigo',
    comingSoon: true
  },
  {
    id: 'comprehensive',
    icon: Accessibility,
    emoji: '🎯',
    title: 'Vollständige Analyse',
    description: 'Ich bin nicht sicher, was ich brauche',
    color: 'gray',
    isComprehensive: true
  }
];

export function WelcomeScreen({ onStart }) {
  const [stage, setStage] = useState('category'); // 'category' or 'details'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [insurance, setInsurance] = useState('gkv');
  const [pflegegrad, setPflegegrad] = useState('none');

  const handleCategorySelect = (categoryId) => {
    const category = CATEGORY_OPTIONS.find(c => c.id === categoryId);
    
    if (category?.comingSoon) {
      // Show coming soon message
      alert('Diese Kategorie wird bald verfügbar sein!');
      return;
    }
    
    setSelectedCategory(categoryId);
    setStage('details');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onStart?.(insurance, pflegegrad === 'none' ? null : pflegegrad, selectedCategory);
  };

  if (stage === 'category') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-5xl">
          <div className="space-y-4 text-center mb-12">
            <h1 className="text-4xl font-bold text-text md:text-5xl">
              Aboelo Hilfsmittel-Finder
            </h1>
            <p className="text-xl text-gray-600">
              Welche Hilfsmittel suchen Sie?
            </p>
            <p className="text-base text-gray-500">
              Wählen Sie eine Kategorie für schnelle, passende Ergebnisse
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORY_OPTIONS.map((category) => {
              const IconComponent = category.icon;
              const colorClasses = {
                blue: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
                emerald: 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50',
                purple: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
                cyan: 'border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50',
                red: 'border-red-200 hover:border-red-300 hover:bg-red-50',
                pink: 'border-pink-200 hover:border-pink-300 hover:bg-pink-50',
                indigo: 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50',
                gray: 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              };

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  disabled={category.comingSoon}
                  className={`relative rounded-2xl border-2 bg-white p-6 text-left transition-all ${
                    colorClasses[category.color]
                  } ${category.comingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer shadow-sm hover:shadow-md'}`}
                >
                  {category.comingSoon && (
                    <span className="absolute top-2 right-2 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                      Bald verfügbar
                    </span>
                  )}
                  <div className="flex flex-col items-start gap-3">
                    <span className="text-5xl">{category.emoji}</span>
                    <div>
                      <h3 className="text-xl font-bold text-text">{category.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // Stage: details
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
        <div className="space-y-4">
          <button
            onClick={() => setStage('category')}
            className="text-primary hover:text-blue-700 font-medium"
          >
            ← Zurück zur Kategorieauswahl
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text md:text-4xl">
              Noch ein paar Angaben
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Damit wir die richtigen Hilfsmittel für Sie finden
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label htmlFor="insurance" className="block text-left text-lg font-semibold text-text">
              Ihre Krankenversicherung
            </label>
            <select
              id="insurance"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-lg text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              value={insurance}
              onChange={(event) => setInsurance(event.target.value)}
            >
              {INSURANCE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pflegegrad" className="block text-left text-lg font-semibold text-text">
              Pflegegrad (optional)
            </label>
            <select
              id="pflegegrad"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-lg text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              value={pflegegrad}
              onChange={(event) => setPflegegrad(event.target.value)}
            >
              {PFLEGEGRAD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
          >
            Weiter zum Fragebogen
          </button>
        </form>
      </div>
    </main>
  );
}
