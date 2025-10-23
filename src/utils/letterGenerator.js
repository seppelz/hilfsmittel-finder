function generateReasoning(product, answers) {
  if (answers.mobility_ability === 'limited_walking') {
    return 'Eingeschränkte Gehfähigkeit erfordert Gehhilfe zur sicheren Fortbewegung.';
  }
  if (answers.mobility_ability === 'no_walking') {
    return 'Ohne Hilfsmittel ist keine eigenständige Mobilität möglich.';
  }
  if (Array.isArray(answers.bathroom_issue) && answers.bathroom_issue.includes('shower_standing')) {
    return 'Längeres Stehen beim Duschen nicht möglich, erhöhte Sturzgefahr.';
  }
  return 'Medizinisch notwendig zur Erhaltung der Selbstständigkeit.';
}

export function generateLetter(userData, products, pflegegrad, answers) {
  const date = new Date().toLocaleDateString('de-DE');
  const sanitizedProducts = Array.isArray(products) ? products : [];

  const productList = sanitizedProducts
    .map((product) => {
      const code = product?.produktartNummer || product?.code;
      const name = product?.bezeichnung || product?.name;
      const reasoning = generateReasoning(product, answers ?? {});

      return `- ${name ?? 'Hilfsmittel'}${code ? ` (Produktgruppe ${code})` : ''}\n  Begründung: ${reasoning}`;
    })
    .join('\n\n');

  return `${userData.vorname ?? ''} ${userData.nachname ?? ''}\n${userData.strasse ?? ''} ${userData.hausnummer ?? ''}\n${userData.plz ?? ''} ${userData.ort ?? ''}\nVersichertennummer: ${userData.versichertennummer ?? ''}\n\n${userData.krankenkasse ?? ''}\n${userData.kassenAdresse ?? ''}\n\n${date}\n\nBetreff: Antrag auf Kostenübernahme für Hilfsmittel gemäß § 33 SGB V\n\nSehr geehrte Damen und Herren,\n\nhiermit beantrage ich die Kostenübernahme für folgende medizinisch notwendige Hilfsmittel aus dem offiziellen Hilfsmittelverzeichnis des GKV-Spitzenverbands:\n\n${productList || '- [Bitte fügen Sie Hilfsmittel hinzu]'}\n\n${pflegegrad ? `Ich verfüge über Pflegegrad ${pflegegrad} und benötige diese Hilfsmittel zur Bewältigung meines Alltags und zur Erhaltung meiner Selbstständigkeit.\n\n` : ''}Die genannten Hilfsmittel sind im Hilfsmittelverzeichnis der gesetzlichen Krankenversicherung gelistet und werden gemäß § 33 SGB V von der Krankenkasse übernommen.\n\nIch bitte um zeitnahe Bearbeitung meines Antrags und eine schriftliche Mitteilung über die Kostenübernahme.\n\nFalls Sie eine ärztliche Verordnung oder weitere Unterlagen benötigen, informieren Sie mich bitte.\n\nMit freundlichen Grüßen,\n\n${userData.vorname ?? ''} ${userData.nachname ?? ''}\n\n---\nHinweis: Bitte legen Sie diesem Schreiben eine ärztliche Verordnung bei, falls diese von Ihrer Krankenkasse gefordert wird.`;
}
