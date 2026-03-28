import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { resolveAssetUrl, searchInventory, type SearchResult } from "../lib/api";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 220;

export function SearchPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const normalizedQuery = deferredQuery.trim();

    if (normalizedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timeout = window.setTimeout(() => {
      void searchInventory(normalizedQuery)
        .then((nextResults) => {
          setResults(nextResults);
        })
        .catch((requestError: unknown) => {
          setError(
            requestError instanceof Error ? requestError.message : "Suche konnte nicht geladen werden.",
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [deferredQuery]);

  const showHint = query.trim().length < MIN_QUERY_LENGTH;
  const showEmptyState = !showHint && !isLoading && !error && results.length === 0;

  return (
    <div className="page-stack">
      <section className="panel search-panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Suchen</p>
            <h1>Item oder Kiste finden</h1>
          </div>
          <Link className="button button--ghost" to="/scan">
            Scannen
          </Link>
        </div>

        <div className="search-input-wrap">
          <span className="material-symbols-outlined search-input-wrap__icon">search</span>
          <input
            autoComplete="off"
            className="input search-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Item oder Kiste suchen…"
            ref={inputRef}
            type="search"
            value={query}
          />
          <button
            className="button button--primary search-input-wrap__button"
            onClick={() => navigate("/scan")}
            type="button"
          >
            <span className="material-symbols-outlined">qr_code_scanner</span>
          </button>
        </div>
      </section>

      {error ? <div className="feedback feedback--error">{error}</div> : null}
      {isLoading ? <div className="feedback">Suche lädt…</div> : null}

      {showHint ? (
        <section className="panel empty-state">
          <p className="section-kicker">Live-Suche</p>
          <h2>Mindestens 2 Zeichen eingeben.</h2>
        </section>
      ) : null}

      {showEmptyState ? (
        <section className="panel empty-state">
          <p className="section-kicker">Keine Treffer</p>
          <h2>Noch nichts gefunden</h2>
        </section>
      ) : null}

      <section className="search-results">
        {results.map((result) => (
          <Link className="search-result panel" key={`${result.box.id}-${result.item.id}`} to={`/boxes/${result.box.id}`}>
            <div className="search-result__media">
              {resolveAssetUrl(result.item.thumbnailPath) ? (
                <img
                  alt={result.item.name}
                  src={resolveAssetUrl(result.item.thumbnailPath) ?? undefined}
                />
              ) : (
                <div className="box-card__placeholder">
                  <span className="material-symbols-outlined">inventory_2</span>
                </div>
              )}
            </div>
            <div className="search-result__body">
              <div className="search-result__headline">
                <h2>{result.item.name}</h2>
                <span className="search-result__number">#{result.box.number}</span>
              </div>
              <p>{result.item.description ?? result.item.detail ?? "Keine Beschreibung vorhanden."}</p>
              <div className="search-result__meta">
                <span className="material-symbols-outlined">package_2</span>
                <span>{result.box.name}</span>
              </div>
              <div className="search-result__meta">
                <span className="material-symbols-outlined">location_on</span>
                <span>{result.box.location}</span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
