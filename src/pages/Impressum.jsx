export function Impressum() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-12">
      <h1 className="text-4xl font-bold text-text">Impressum</h1>

      <section className="space-y-2 text-lg text-gray-700">
        <h2 className="text-2xl font-semibold text-text">Angaben gemäß § 5 TMG</h2>
        <p>
          [Ihr Firmenname]
          <br />
          [Straße Hausnummer]
          <br />
          [PLZ Ort]
        </p>
      </section>

      <section className="space-y-2 text-lg text-gray-700">
        <h2 className="text-2xl font-semibold text-text">Vertreten durch</h2>
        <p>[Name der vertretungsberechtigten Person]</p>
      </section>

      <section className="space-y-2 text-lg text-gray-700">
        <h2 className="text-2xl font-semibold text-text">Kontakt</h2>
        <p>
          Telefon: [Telefonnummer]
          <br />
          E-Mail: [E-Mail-Adresse]
        </p>
      </section>

      <section className="space-y-2 text-lg text-gray-700">
        <h2 className="text-2xl font-semibold text-text">Haftungsausschluss</h2>
        <p>
          Die Informationen auf dieser Website dienen ausschließlich zu Informationszwecken und ersetzen keine
          medizinische Beratung oder ärztliche Diagnose. Für die Vollständigkeit und Richtigkeit der Produktinformationen
          aus dem GKV-Hilfsmittelverzeichnis übernehmen wir keine Gewähr.
        </p>
      </section>
    </div>
  );
}
