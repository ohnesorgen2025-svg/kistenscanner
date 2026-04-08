import { PageHeader } from "../components/PageHeader";

export function HelpPage() {
  return (
    <div className="page-stack">
      <PageHeader kicker="Kistenscanner" title="Hilfe & Funktionen" />

      <section className="panel help-intro">
        <p>
          <strong>Kistenscanner</strong> ist dein intelligentes Inventar-System.
          Fotografiere den Inhalt deiner Kisten, Schränke, Schubladen oder Regale —
          die KI erkennt automatisch alle Gegenstände. Danach findest du alles
          blitzschnell per Suche, QR-Scan oder Foto wieder.
        </p>
      </section>

      {/* ── Suche ── */}
      <section className="panel help-section">
        <div className="help-section__header">
          <span className="material-symbols-outlined help-section__icon">search</span>
          <div>
            <p className="section-kicker">Startseite</p>
            <h2>Wo ist mein…?</h2>
          </div>
        </div>
        <div className="help-section__body">
          <p>Die Suchseite ist der schnellste Weg, um Gegenstände in deinem Inventar zu finden. Drei Suchmodi stehen bereit:</p>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">text_fields</span> Text-Suche</h3>
            <p>Tippe mindestens 2 Zeichen ein — die Ergebnisse erscheinen sofort. Durchsucht werden Name, Beschreibung und Details aller Items sowie Kistennamen und Standorte.</p>
          </div>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">auto_awesome</span> KI-Suche</h3>
            <p>Versteht <em>Bedeutung</em>, nicht nur Stichwörter. Suche z.B. nach „etwas zum Schrauben" — die KI findet Akkuschrauber, Schraubenzieher und mehr. Tippe deine Frage ein und drücke „KI-Suche".</p>
          </div>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">image_search</span> Foto-Suche</h3>
            <p>Lade ein Foto eines Gegenstands hoch — die KI durchsucht dein gesamtes Inventar nach optisch ähnlichen Items. Ideal, wenn du den Namen nicht kennst.</p>
          </div>
          <p>Jedes Suchergebnis zeigt den <strong>Pfad</strong> zum Item (z.B. Raum › Regal › Kiste) sowie Menge und Standort auf einen Blick.</p>
        </div>
      </section>

      {/* ── QR-Scan ── */}
      <section className="panel help-section">
        <div className="help-section__header">
          <span className="material-symbols-outlined help-section__icon">qr_code_scanner</span>
          <div>
            <p className="section-kicker">Schnellzugriff</p>
            <h2>QR-Code & Barcode Scanner</h2>
          </div>
        </div>
        <div className="help-section__body">
          <p>Halte die Kamera auf den QR-Code einer Kiste — die App springt sofort zur Detailansicht. Oder scanne einen Produkt-Barcode (EAN/UPC), um Produktinformationen nachzuschlagen.</p>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">qr_code_scanner</span> QR-Modus</h3>
            <p>Öffnet die Kamera mit Echtzeit-Erkennung. Sobald ein gültiger Kisten-QR-Code erkannt wird, navigiert die App automatisch.</p>
          </div>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">barcode_scanner</span> Barcode-Modus</h3>
            <p>Scannt EAN/UPC-Barcodes von Produkten und schlägt den Artikelnamen, Marke und Kategorie über die OpenFoodFacts-Datenbank nach.</p>
          </div>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">upload</span> Bild-Fallback</h3>
            <p>Falls die Kamera nicht verfügbar ist (z.B. ohne HTTPS), kannst du ein Foto des Codes hochladen oder aufnehmen.</p>
          </div>
        </div>
      </section>

      {/* ── Hinzufügen ── */}
      <section className="panel help-section">
        <div className="help-section__header">
          <span className="material-symbols-outlined help-section__icon">add_box</span>
          <div>
            <p className="section-kicker">Speicher-Workflow</p>
            <h2>Behälter hinzufügen</h2>
          </div>
        </div>
        <div className="help-section__body">
          <p>Der geführte 5-Schritte-Workflow macht das Katalogisieren einfach:</p>
          <ol className="help-steps">
            <li>
              <strong>Fotos erfassen</strong> — Fotografiere den offenen Behälter mit der Kamera oder lade Bilder hoch. Mehrere Fotos aus verschiedenen Winkeln verbessern die Erkennung. Taschenlampe bei Bedarf einschalten.
            </li>
            <li>
              <strong>KI-Analyse</strong> — Wähle ein KI-Modell und starte die Analyse. Die KI erkennt jeden Gegenstand, erstellt Name, Beschreibung und Menge.
            </li>
            <li>
              <strong>Items prüfen</strong> — Die erkannten Items werden als editierbare Karten angezeigt. Korrigiere Namen, ergänze Details oder entferne falsche Treffer. Items lassen sich auch manuell hinzufügen.
            </li>
            <li>
              <strong>Behälter speichern</strong> — Vergib einen Namen und Standort. Der <strong>Standort</strong> bietet Autovervollständigung basierend auf bereits verwendeten Standorten. Wähle den <strong>Behältertyp</strong> (Kiste, Schrank, Schublade, Regal, Tasche oder Raum) und optional einen <strong>übergeordneten Behälter</strong> für die Verschachtelung.
            </li>
            <li>
              <strong>QR-Code drucken</strong> — Nach dem Speichern wird ein QR-Code generiert. Drucke ihn direkt aus und klebe ihn auf den Behälter. Mit dem <strong>„Nächsten Behälter erfassen"</strong>-Button kannst du sofort den nächsten Behälter anlegen — Standort, Typ und Eltern-Behälter bleiben vorausgefüllt.
            </li>
          </ol>
        </div>
      </section>

      {/* ── Behältertypen ── */}
      <section className="panel help-section">
        <div className="help-section__header">
          <span className="material-symbols-outlined help-section__icon">category</span>
          <div>
            <p className="section-kicker">Organisation</p>
            <h2>Behältertypen & Hierarchie</h2>
          </div>
        </div>
        <div className="help-section__body">
          <p>Sechs Behältertypen stehen zur Verfügung — jeder mit eigenem Symbol:</p>
          <div className="help-type-grid">
            <div className="help-type">
              <span className="material-symbols-outlined">inventory_2</span>
              <strong>Kiste</strong>
            </div>
            <div className="help-type">
              <span className="material-symbols-outlined">door_sliding</span>
              <strong>Schrank</strong>
            </div>
            <div className="help-type">
              <span className="material-symbols-outlined">draft</span>
              <strong>Schublade</strong>
            </div>
            <div className="help-type">
              <span className="material-symbols-outlined">shelves</span>
              <strong>Regal</strong>
            </div>
            <div className="help-type">
              <span className="material-symbols-outlined">shopping_bag</span>
              <strong>Tasche</strong>
            </div>
            <div className="help-type">
              <span className="material-symbols-outlined">door_open</span>
              <strong>Raum</strong>
            </div>
          </div>
          <p>Behälter lassen sich <strong>verschachteln</strong>: Ein Raum enthält ein Regal, das Regal enthält Kisten, eine Kiste enthält Schubladen. Die Pfad-Navigation (Breadcrumbs) zeigt immer den vollständigen Standort: <em>Werkstatt › Regal 3 › Kiste „Adapter"</em>.</p>
          <p>Unterbehälter werden auf der Detailseite des Eltern-Behälters als eigene Sektion angezeigt und sind direkt anklickbar.</p>
        </div>
      </section>

      {/* ── Behälter-Übersicht ── */}
      <section className="panel help-section">
        <div className="help-section__header">
          <span className="material-symbols-outlined help-section__icon">inventory_2</span>
          <div>
            <p className="section-kicker">Inventar</p>
            <h2>Behälter-Übersicht</h2>
          </div>
        </div>
        <div className="help-section__body">
          <p>Die Übersichtsseite zeigt alle Behälter als Karten-Raster mit Foto, Typ-Symbol, Nummer, Name, Standort und Item-Anzahl. Tippe auf eine Karte, um die Detailansicht zu öffnen.</p>
        </div>
      </section>

      {/* ── Behälter-Detail ── */}
      <section className="panel help-section">
        <div className="help-section__header">
          <span className="material-symbols-outlined help-section__icon">info</span>
          <div>
            <p className="section-kicker">Detailansicht</p>
            <h2>Behälter-Details</h2>
          </div>
        </div>
        <div className="help-section__body">
          <p>Die Detailseite ist die Kommandozentrale für jeden Behälter:</p>

          <div className="help-feature">
            <h3><span className="material-symbols-outlined">qr_code</span> QR-Code & Fakten</h3>
            <p>Zeigt Standort, Nummer, Name und Item-Anzahl. Der QR-Code ist direkt zum Scannen bereit.</p>
          </div>

          <div className="help-feature">
            <h3><span className="material-symbols-outlined">add_a_photo</span> Re-Scan</h3>
            <p>Mache neue Fotos vom Behälterinhalt — die KI vergleicht mit dem bestehenden Inventar und zeigt <strong>neu erkannte</strong>, <strong>verbesserte</strong> und <strong>nicht mehr sichtbare</strong> Items an. Änderungen lassen sich einzeln übernehmen oder verwerfen.</p>
          </div>

          <div className="help-feature">
            <h3><span className="material-symbols-outlined">print</span> Etikettendruck</h3>
            <p>Drucke QR-Etiketten auf Avery-Bögen (Nr. 5028). Klicke mehrere Positionen auf dem virtuellen Bogen an, um denselben Code mehrfach zu drucken. Dann „Druckdialog öffnen" klicken.</p>
          </div>

          <div className="help-feature">
            <h3><span className="material-symbols-outlined">view_list</span> Item-Verwaltung</h3>
            <p>Jedes Item zeigt Foto, Name, Beschreibung, Menge und Verleih-Status. Pro Item kannst du:</p>
            <ul>
              <li><strong>Bearbeiten</strong> — Name, Beschreibung und Details ändern</li>
              <li><strong>Foto hinzufügen</strong> — Zusätzliche Bilder hochladen</li>
              <li><strong>Verschieben</strong> — Item in einen anderen Behälter umziehen</li>
              <li><strong>Verleihen</strong> — An jemanden ausleihen (siehe Verleih-System)</li>
              <li><strong>Menge ändern</strong> — Mit +/− die Stückzahl anpassen</li>
            </ul>
          </div>

          <div className="help-feature">
            <h3><span className="material-symbols-outlined">account_tree</span> Unterbehälter</h3>
            <p>Falls verschachtelte Behälter vorhanden sind, werden diese als anklickbare Karten angezeigt.</p>
          </div>

          <div className="help-feature">
            <h3><span className="material-symbols-outlined">checklist</span> Mehrfachauswahl (Batch)</h3>
            <p>Tippe auf „Mehrfachauswahl", um mehrere Items gleichzeitig auszuwählen. Dann kannst du alle markierten Items gemeinsam <strong>verschieben</strong> oder <strong>löschen</strong>. Ideal beim Umräumen oder Aufräumen.</p>
          </div>

          <div className="help-feature">
            <h3><span className="material-symbols-outlined">ios_share</span> Teilen / Packliste</h3>
            <p>Tippe auf „Teilen" in der Toolbar, um den gesamten Inhalt als Text-Packliste über die native Teilen-Funktion (WhatsApp, E-Mail etc.) zu versenden oder in die Zwischenablage zu kopieren.</p>
          </div>
        </div>
      </section>

      {/* ── Mengen-Tracking ── */}
      <section className="panel help-section">
        <div className="help-section__header">
          <span className="material-symbols-outlined help-section__icon">pin</span>
          <div>
            <p className="section-kicker">Mengen</p>
            <h2>Mengen-Tracking</h2>
          </div>
        </div>
        <div className="help-section__body">
          <p>Jedes Item hat eine Mengenangabe mit optionaler Einheit (z.B. „5 Stück", „3 Paar"). Die KI-Analyse erkennt Mengen automatisch.</p>
          <p>Auf der Detailseite passe die Menge mit den <strong>+/−-Buttons</strong> direkt an. Bei mehr als 1 Stück wird ein Mengen-Badge (×3) auf der Karte und in Suchergebnissen angezeigt.</p>
        </div>
      </section>

      {/* ── Verleih ── */}
      <section className="panel help-section">
        <div className="help-section__header">
          <span className="material-symbols-outlined help-section__icon">share</span>
          <div>
            <p className="section-kicker">Verleih</p>
            <h2>Verleih-System</h2>
          </div>
        </div>
        <div className="help-section__body">
          <p>Behalte den Überblick, wer was geliehen hat:</p>
          <ol className="help-steps">
            <li>Öffne die Detailseite eines Behälters und tippe beim gewünschten Item auf das <strong>Verleihen-Symbol</strong> (Pfeil).</li>
            <li>Gib den <strong>Namen des Ausleihers</strong> ein, optional ein Rückgabedatum und eine Notiz.</li>
            <li>Das Item zeigt jetzt einen <strong>orangefarbenen Verleih-Badge</strong> mit dem Ausleihernamen.</li>
            <li>Zur Rückgabe: Tippe auf den <strong>✓-Button</strong> am Badge — oder nutze die Rückgabe im Dashboard.</li>
          </ol>
          <p>Das <strong>Dashboard</strong> zeigt alle aktiven Ausleihen auf einen Blick. Überfällige Ausleihen (Rückgabedatum überschritten) werden <strong>rot</strong> hervorgehoben.</p>
        </div>
      </section>

      {/* ── Dashboard ── */}
      <section className="panel help-section">
        <div className="help-section__header">
          <span className="material-symbols-outlined help-section__icon">dashboard</span>
          <div>
            <p className="section-kicker">Übersicht</p>
            <h2>Dashboard</h2>
          </div>
        </div>
        <div className="help-section__body">
          <p>Das Dashboard gibt dir den Überblick über dein gesamtes Inventar:</p>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">bar_chart</span> Statistiken</h3>
            <p>Gesamtanzahl Behälter, Items und Bilder. Dazu Hinweise auf Behälter ohne Items und Items ohne Bild.</p>
          </div>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">person</span> Aktive Ausleihen</h3>
            <p>Liste aller verliehenen Items mit Ausleiher, Datum und Rückgabe-Button. Überfällige Einträge sind rot markiert.</p>
          </div>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">history</span> Letzte Behälter</h3>
            <p>Schnellzugriff auf die zuletzt bearbeiteten Behälter.</p>
          </div>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">map</span> Standort-Verteilung</h3>
            <p>Balkendiagramm, das zeigt, wie viele Behälter pro Standort existieren.</p>
          </div>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">content_copy</span> Duplikat-Erkennung</h3>
            <p>Die KI analysiert alle Items und findet Duplikate — gleiche oder sehr ähnliche Gegenstände in verschiedenen Behältern. Ideal zum Konsolidieren.</p>
          </div>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">auto_fix_high</span> Smart-Reorganisation</h3>
            <p>Die KI schlägt vor, welche Behälter zusammengelegt, aufgeteilt oder umorganisiert werden sollten — basierend auf den Inhalten.</p>
          </div>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">download</span> Export</h3>
            <p>Lade dein gesamtes Inventar als <strong>CSV</strong> (für Excel/Tabellenkalkulation) oder <strong>JSON</strong> (für Entwickler/Backup) herunter.</p>
          </div>
        </div>
      </section>

      {/* ── Einstellungen ── */}
      <section className="panel help-section">
        <div className="help-section__header">
          <span className="material-symbols-outlined help-section__icon">settings</span>
          <div>
            <p className="section-kicker">Konfiguration</p>
            <h2>Einstellungen</h2>
          </div>
        </div>
        <div className="help-section__body">
          <p>Hier konfigurierst du die KI-Modelle, die für Analyse, Suche und Erkennung verwendet werden:</p>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">smart_toy</span> KI-Modelle</h3>
            <p>Wähle das aktive Modell per Klick. Die verfügbaren Modelle und API-Schlüssel werden zentral über den <strong>AI-Hub</strong> verwaltet.</p>
          </div>
        </div>
      </section>

      {/* ── PWA ── */}
      <section className="panel help-section">
        <div className="help-section__header">
          <span className="material-symbols-outlined help-section__icon">install_mobile</span>
          <div>
            <p className="section-kicker">App</p>
            <h2>Als App installieren</h2>
          </div>
        </div>
        <div className="help-section__body">
          <p>Kistenscanner ist eine <strong>Progressive Web App (PWA)</strong> — du kannst sie wie eine native App auf deinem Gerät installieren:</p>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">phone_android</span> Android / Chrome</h3>
            <p>Öffne die App im Browser → Tippe auf das Menü (⋮) → „Zum Startbildschirm hinzufügen" oder „App installieren".</p>
          </div>
          <div className="help-feature">
            <h3><span className="material-symbols-outlined">phone_iphone</span> iPhone / Safari</h3>
            <p>Öffne die App in Safari → Tippe auf das Teilen-Symbol (□↑) → „Zum Home-Bildschirm".</p>
          </div>
          <p>Nach der Installation öffnet sich die App im Vollbild ohne Browser-Leiste. Dank Service Worker funktioniert die Oberfläche auch bei kurzen Netzwerkunterbrechungen.</p>
        </div>
      </section>

      {/* ── Tipps ── */}
      <section className="panel help-section help-section--tips">
        <div className="help-section__header">
          <span className="material-symbols-outlined help-section__icon">tips_and_updates</span>
          <div>
            <p className="section-kicker">Profi-Tipps</p>
            <h2>Das Beste herausholen</h2>
          </div>
        </div>
        <div className="help-section__body">
          <ul className="help-tips">
            <li><strong>Mehrere Fotos</strong> machen — verschiedene Winkel und Ebenen verbessern die KI-Erkennung erheblich.</li>
            <li><strong>Gut beleuchtete Fotos</strong> — die Taschenlampe nutzen oder für natürliches Licht sorgen.</li>
            <li><strong>Hierarchie nutzen</strong> — erstelle zuerst Räume, dann Regale, dann Kisten. So findest du alles über den Pfad.</li>
            <li><strong>QR-Codes drucken</strong> — klebe gleich nach dem Anlegen einen QR-Code auf den Behälter. Spart künftig die Suche.</li>
            <li><strong>Re-Scan regelmäßig</strong> — wenn sich der Inhalt ändert, mach einen Re-Scan. Die KI erkennt neue und fehlende Gegenstände.</li>
            <li><strong>KI-Suche nutzen</strong> — wenn die Textsuche nichts findet, versuche die KI-Suche mit einer Beschreibung statt eines Namens.</li>
            <li><strong>Verleih tracken</strong> — vergib Items mit Rückgabedatum, dann warnt das Dashboard bei Überfälligkeit.</li>
            <li><strong>Export als Backup</strong> — lade regelmäßig den JSON-Export herunter, um eine Sicherung deines Inventars zu haben.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
