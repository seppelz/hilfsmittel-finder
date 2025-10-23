export function Datenschutz() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-12">
      <h1 className="text-4xl font-bold text-text">Datenschutzerklärung</h1>

      <section className="space-y-2 text-lg text-gray-700">
        <h2 className="text-2xl font-semibold text-text">1. Datenschutz auf einen Blick</h2>
        <p>
          Diese Website speichert Ihre Angaben ausschließlich lokal in Ihrem Browser (Local Storage). Es werden keine
          personenbezogenen Daten an unsere Server übertragen oder dauerhaft gespeichert.
        </p>
      </section>

      <section className="space-y-2 text-lg text-gray-700">
        <h2 className="text-2xl font-semibold text-text">2. Datenerfassung</h2>
        <p>
          Wir erfassen Ihre Antworten im Hilfsmittel-Fragebogen lokal, um passende Empfehlungen zu generieren. Technische
          Daten (z. B. Browsertyp) werden nur kurzfristig zur Fehleranalyse verwendet.
        </p>
      </section>

      <section className="space-y-2 text-lg text-gray-700">
        <h2 className="text-2xl font-semibold text-text">3. Externe Dienste</h2>
        <p>
          Wir nutzen die offizielle API des GKV-Spitzenverbands (https://hilfsmittel-api.gkv-spitzenverband.de). Dabei
          werden keine personenbezogenen Daten übertragen, sondern ausschließlich anonyme Suchkriterien.
        </p>
      </section>

      <section className="space-y-2 text-lg text-gray-700">
        <h2 className="text-2xl font-semibold text-text">4. Cookies</h2>
        <p>
          Diese Website verwendet keine Cookies. Sämtliche Daten werden lokal im Browser gespeichert und können jederzeit
          von Ihnen gelöscht werden.
        </p>
      </section>

      <section className="space-y-2 text-lg text-gray-700">
        <h2 className="text-2xl font-semibold text-text">5. Ihre Rechte</h2>
        <p>
          Da wir keine personenbezogenen Daten speichern, entfallen umfangreiche DSGVO-Anfragen. Sie können Ihre lokalen
          Daten jederzeit über die Einstellungen Ihres Browsers löschen.
        </p>
      </section>
    </div>
  );
}
