import { Link } from "react-router-dom";

export function SearchPage() {
  return (
    <div className="page-stack">
      <section className="panel hero-panel hero-panel--search">
        <p className="eyebrow">Suchen</p>
        <h1>Der Such-Workflow kommt als Nächstes.</h1>
        <p className="lead">
          Der Speicher-Workflow ist bereit, um Kisten zu erfassen, zu analysieren und zu
          speichern. Suchen bleibt vorerst ein schlanker Platzhalter, bis die Abrufschicht steht.
        </p>
        <div className="action-row">
          <Link className="button button--primary" to="/boxes/add">
            Speicher-Workflow starten
          </Link>
          <Link className="button button--ghost" to="/boxes">
            Kisten ansehen
          </Link>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Schnellstart</p>
            <h2>Aktueller Fokus</h2>
          </div>
        </div>

        <div className="status-grid">
          <article className="status-card">
            <p className="card-label">1. Erfassen</p>
            <p>Kamera oder Datei-Upload mit mehreren Bildern für eine Kiste nutzen.</p>
          </article>
          <article className="status-card">
            <p className="card-label">2. Prüfen</p>
            <p>KI-Vorschläge direkt anpassen, bevor etwas gespeichert wird.</p>
          </article>
          <article className="status-card">
            <p className="card-label">3. Speichern</p>
            <p>Nummerierte Kiste anlegen, Items zuweisen und die Detailansicht öffnen.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
