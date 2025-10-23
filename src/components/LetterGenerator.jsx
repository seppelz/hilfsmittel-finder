import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import { generateLetter } from '../utils/letterGenerator';
import { trackEvent, logError } from '../utils/analytics';

export function LetterGenerator({ products, insuranceType, pflegegrad, answers, onBack }) {
  const [userData, setUserData] = useState({
    vorname: '',
    nachname: '',
    strasse: '',
    hausnummer: '',
    plz: '',
    ort: '',
    versichertennummer: '',
    krankenkasse: '',
    kassenAdresse: '',
  });

  const letterContent = useMemo(
    () => generateLetter(userData, products, pflegegrad, answers),
    [userData, products, pflegegrad, answers],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownload = () => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const lineHeight = 7;
      const margin = 20;
      const lines = doc.splitTextToSize(letterContent, doc.internal.pageSize.width - margin * 2);

      lines.forEach((line, index) => {
        const y = margin + index * lineHeight;
        if (y > doc.internal.pageSize.height - margin) {
          doc.addPage();
        }
        doc.text(line, margin, y);
      });

      doc.save('antrag-hilfsmittel.pdf');
      trackEvent('letter_downloaded', { productCount: products.length, hasInsurance: Boolean(insuranceType) });
    } catch (error) {
      logError('letter_download_failed', error, { productCount: products.length });
    }
  };

  return (
    <section className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="rounded-3xl bg-white p-6 shadow">
        <button
          type="button"
          onClick={onBack}
          className="text-lg font-semibold text-primary hover:text-blue-700"
        >
          Zurück zu den Ergebnissen
        </button>
        <h2 className="mt-4 text-3xl font-bold text-text">Antragsschreiben fertigstellen</h2>
        <p className="text-gray-600">
          Ergänzen Sie Ihre persönlichen Daten, um das Schreiben zu individualisieren.
        </p>
      </header>

      <form className="rounded-3xl bg-white p-6 shadow space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Vorname" name="vorname" value={userData.vorname} onChange={handleChange} />
          <InputField label="Nachname" name="nachname" value={userData.nachname} onChange={handleChange} />
          <InputField label="Straße" name="strasse" value={userData.strasse} onChange={handleChange} />
          <InputField label="Hausnummer" name="hausnummer" value={userData.hausnummer} onChange={handleChange} />
          <InputField label="PLZ" name="plz" value={userData.plz} onChange={handleChange} />
          <InputField label="Ort" name="ort" value={userData.ort} onChange={handleChange} />
          <InputField
            label="Versichertennummer"
            name="versichertennummer"
            value={userData.versichertennummer}
            onChange={handleChange}
          />
          <InputField
            label="Krankenkasse"
            name="krankenkasse"
            value={userData.krankenkasse}
            onChange={handleChange}
          />
        </div>
        <InputField
          label="Adresse der Krankenkasse"
          name="kassenAdresse"
          value={userData.kassenAdresse}
          onChange={handleChange}
          multiline
        />
      </form>

      <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow">
        <h3 className="text-2xl font-semibold text-text">Vorschau Ihres Schreibens</h3>
        <pre className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-gray-700">
          {letterContent}
        </pre>
      </article>

      <footer className="flex flex-col items-center gap-4 md:flex-row md:justify-end">
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-xl bg-primary px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
        >
          PDF herunterladen
        </button>
      </footer>
    </section>
  );
}

function InputField({ label, name, value, onChange, multiline = false }) {
  return (
    <label className="flex flex-col gap-2 text-lg text-text">
      {label}
      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={3}
          className="rounded-xl border border-gray-200 px-4 py-3 text-base text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      ) : (
        <input
          name={name}
          value={value}
          onChange={onChange}
          className="rounded-xl border border-gray-200 px-4 py-3 text-base text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      )}
    </label>
  );
}
