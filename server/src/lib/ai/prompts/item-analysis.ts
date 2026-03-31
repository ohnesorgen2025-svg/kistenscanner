export function buildItemAnalysisPrompt(itemName: string, existingDescription: string | null, existingDetail: string | null): string {
  const context = [
    `Bekannter Name: ${itemName}`,
    existingDescription ? `Bisherige Beschreibung: ${existingDescription}` : null,
    existingDetail ? `Bisherige Details: ${existingDetail}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `
Analysiere ein oder mehrere Detailfotos eines einzelnen Gegenstands aus einem Inventar.
Der Gegenstand ist bereits erfasst. Ergänze die Informationen basierend auf den neuen Fotos.

BEKANNTE INFORMATIONEN:
${context}

AUFGABE:
Liefere eine JSON-Antwort mit genau diesen Feldern:
- "name": Verbesserter oder bestätigter Name (kurz und präzise)
- "description": Verbesserte Kurzbeschreibung (1-2 Sätze, was ist es, welche Marke/Hersteller)
- "detail": Detaillierte technische Informationen. Alles, was auf Typenschildern, Etiketten oder Verpackungen zu lesen ist: Modellnummer, Seriennummer, Spannungen, Leistung, Maße, Gewicht, Materialien etc. Mehrere Zeilen erlaubt, mit Zeilenumbrüchen getrennt.

REGELN:
- Alle Texte auf Deutsch mit korrekten Umlauten (ä, ö, ü, ß).
- Übernimm bestehende Details, falls sie korrekt sind, und ergänze neue.
- Falls ein Foto technische Daten zeigt (Typenschild etc.), übertrage ALLE lesbaren Informationen in "detail".
- Gib NUR das JSON-Objekt zurück, keinen weiteren Text.
`.trim();
}
