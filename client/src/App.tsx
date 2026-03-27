import "./App.css";

function App() {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Kistenscanner</p>
        <h1>Foundation ready for STORE and FIND.</h1>
        <p className="lead">
          React, Express, SQLite and the decoupled AI layer are scaffolded as the
          minimal base for the next implementation passes.
        </p>
      </section>

      <section className="status-grid" aria-label="Project foundation status">
        <article className="status-card">
          <p className="card-label">Client</p>
          <h2>Vite + React + TypeScript</h2>
          <p>Strict TypeScript is active and the dev server is pinned to port 5174.</p>
        </article>
        <article className="status-card">
          <p className="card-label">Server</p>
          <h2>Express + SQLite</h2>
          <p>
            The API starts on port 4001 with a connected better-sqlite3 database file.
          </p>
        </article>
        <article className="status-card">
          <p className="card-label">AI Layer</p>
          <h2>Skeleton in place</h2>
          <p>
            Provider modules live under <code>server/src/lib/ai/providers</code> and
            are kept separate from routes and business logic.
          </p>
        </article>
      </section>
    </main>
  );
}

export default App;
