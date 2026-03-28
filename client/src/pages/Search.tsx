import { Link } from "react-router-dom";

export function SearchPage() {
  return (
    <div className="page-stack">
      <section className="panel hero-panel hero-panel--search">
        <p className="eyebrow">Search</p>
        <h1>Find workflow comes next.</h1>
        <p className="lead">
          The STORE workflow is ready to capture, analyze and save boxes. SEARCH is
          kept as a lightweight placeholder until the retrieval layer is built.
        </p>
        <div className="action-row">
          <Link className="button button--primary" to="/boxes/add">
            Start Store Flow
          </Link>
          <Link className="button button--ghost" to="/boxes">
            Browse Boxes
          </Link>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Quick Start</p>
            <h2>Current Focus</h2>
          </div>
        </div>

        <div className="status-grid">
          <article className="status-card">
            <p className="card-label">1. Capture</p>
            <p>Use camera or file upload with multiple images for a box.</p>
          </article>
          <article className="status-card">
            <p className="card-label">2. Review</p>
            <p>Edit AI suggestions inline before anything is persisted.</p>
          </article>
          <article className="status-card">
            <p className="card-label">3. Save</p>
            <p>Create a numbered box, attach items and open the saved detail view.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
