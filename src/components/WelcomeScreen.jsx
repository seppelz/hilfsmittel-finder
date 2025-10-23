import { useState } from 'react';

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

export function WelcomeScreen({ onStart }) {
  const [insurance, setInsurance] = useState('gkv');
  const [pflegegrad, setPflegegrad] = useState('none');

  const handleSubmit = (event) => {
    event.preventDefault();
    onStart?.(insurance, pflegegrad === 'none' ? null : pflegegrad);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold text-text md:text-4xl">
            Aboelo Hilfsmittel-Finder
          </h1>
          <p className="text-lg text-gray-600">
            Finden Sie heraus, welche Hilfsmittel Ihre Krankenkasse für Sie übernimmt.
          </p>
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
            Jetzt starten
          </button>
        </form>
      </div>
    </main>
  );
}
