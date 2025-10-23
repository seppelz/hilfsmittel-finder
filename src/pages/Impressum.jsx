export function Impressum() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-12">
      <h1 className="text-4xl font-bold text-text">Impressum</h1>

      <section className="space-y-2 text-lg text-gray-700">
        <h2 className="text-2xl font-semibold text-text">Angaben gemäß § 5 TMG</h2>
        <p>
          Müller & Söcker GbR
          <br />
          c/o VELT STUDIO GmbH
          <br />
          Urbanstraße 71
          <br />
          10967 Berlin
        </p>
      </section>

      <section className="space-y-2 text-lg text-gray-700">
        <h2 className="text-2xl font-semibold text-text">Vertreten durch</h2>
        <p>Thomas Müller, M.A. und Sebastian Söcker, M.A.</p>
      </section>

      <section className="space-y-2 text-lg text-gray-700">
        <h2 className="text-2xl font-semibold text-text">Kontakt</h2>
        <p>
          E-Mail: info@aboelo.de
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
