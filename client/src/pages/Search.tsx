import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  CONTAINER_TYPE_ICONS,
  resolveAssetUrl,
  searchInventory,
  smartSearch,
  visualSearch,
  type SearchResult,
  type SmartSearchResult,
  type PathSegment,
} from "../lib/api";

const MIN_QUERY_LENGTH = 2;

export function SearchPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState<SmartSearchResult[]>([]);
  const [isVisualSearching, setIsVisualSearching] = useState(false);
  const [visualResults, setVisualResults] = useState<SmartSearchResult[]>([]);
  const [visualPreviewUrl, setVisualPreviewUrl] = useState<string | null>(null);

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
  }, [deferredQuery]);

  const showHint = query.trim().length < MIN_QUERY_LENGTH;
  const showEmptyState = !showHint && !isLoading && !error && results.length === 0 && aiResults.length === 0;

  async function handleAiSearch() {
    if (query.trim().length < MIN_QUERY_LENGTH) return;
    setIsAiSearching(true);
    setError(null);
    try {
      const aiHits = await smartSearch(query.trim());
      setAiResults(aiHits);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "KI-Suche fehlgeschlagen.");
    } finally {
      setIsAiSearching(false);
    }
  }

  async function handleVisualSearch(file: File | null) {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setVisualPreviewUrl(previewUrl);
    setIsVisualSearching(true);
    setError(null);
    try {
      const hits = await visualSearch([file]);
      setVisualResults(hits);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Foto-Suche fehlgeschlagen.");
    } finally {
      setIsVisualSearching(false);
    }
  }

  function clearVisualSearch() {
    setVisualResults([]);
    if (visualPreviewUrl) {
      URL.revokeObjectURL(visualPreviewUrl);
    }
    setVisualPreviewUrl(null);
  }

  return (
    <div className="page-stack search-screen">
      <header className="screen-header">
        <p className="screen-kicker">Inventar</p>
        <h1 className="screen-title">Wo ist mein...?</h1>
      </header>

      <section className="search-panel">
        <div className="search-input-wrap">
          <div className="search-input-wrap__field">
            <span className="material-symbols-outlined search-input-wrap__icon">search</span>
            <input
              autoComplete="off"
              className="input search-input"
              inputMode="search"
              onChange={(event) => { setQuery(event.target.value); setAiResults([]); }}
              placeholder="Bohrmaschine, Batterien, Kabel…"
              ref={inputRef}
              type="text"
              value={query}
            />
          </div>
          <button
            className="button button--ghost search-input-wrap__button"
            disabled={query.trim().length < MIN_QUERY_LENGTH || isAiSearching}
            onClick={() => void handleAiSearch()}
            title="KI-Suche"
            type="button"
          >
            <span className="material-symbols-outlined">{isAiSearching ? "progress_activity" : "auto_awesome"}</span>
          </button>
          <button
            className="button button--primary search-input-wrap__button"
            onClick={() => navigate("/scan")}
            type="button"
          >
            <span className="material-symbols-outlined">qr_code_scanner</span>
          </button>
        </div>

        <div className="search-extras">
          <label className="button button--ghost search-visual-btn" htmlFor="visual-search-input">
            <span className="material-symbols-outlined">photo_camera</span>
            Foto-Suche
          </label>
          <input
            accept="image/*"
            className="sr-only"
            id="visual-search-input"
            onChange={(event) => void handleVisualSearch(event.target.files?.[0] ?? null)}
            type="file"
          />
        </div>
      </section>

      {error ? <div className="feedback feedback--error">{error}</div> : null}
      {isLoading ? <div className="feedback">Suche lädt…</div> : null}

      {showHint ? (
        <section className="empty-state search-empty-state">
          <p className="section-kicker">Live-Suche</p>
          <h2>Mindestens 2 Zeichen eingeben.</h2>
        </section>
      ) : null}

      {showEmptyState ? (
        <section className="empty-state search-empty-state">
          <p className="section-kicker">Keine Treffer</p>
          <h2>Noch nichts gefunden</h2>
        </section>
      ) : null}

      <section className="search-results">
        {results.map((result) => (
          <Link className="search-result panel" key={`${result.box.id}-${result.item.id}`} to={`/items/${result.item.id}`}>
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
              {result.path && result.path.length > 0 ? (
                <div className="search-result__path">
                  {result.path.map((seg: PathSegment, idx: number) => (
                    <span key={seg.id}>
                      {idx > 0 ? <span className="path-separator"> › </span> : null}
                      <span className="material-symbols-outlined path-icon">{CONTAINER_TYPE_ICONS[seg.containerType] || "inventory_2"}</span>
                      {seg.name}
                    </span>
                  ))}
                </div>
              ) : null}
              {result.item.quantity > 1 ? (
                <span className="chip chip--quantity">{result.item.quantity}× {result.item.quantityUnit || "Stück"}</span>
              ) : null}
            </div>
          </Link>
        ))}
      </section>

      {aiResults.length > 0 ? (
        <section className="search-results">
          <div className="section-kicker ai-results-label">
            <span className="material-symbols-outlined">auto_awesome</span>
            KI-Ergebnisse
          </div>
          {aiResults.map((result) => (
            <Link className="search-result panel" key={`ai-${result.id}`} to={`/items/${result.id}`}>
              <div className="search-result__media">
                {resolveAssetUrl(result.thumbnailPath) ? (
                  <img alt={result.name} src={resolveAssetUrl(result.thumbnailPath) ?? undefined} />
                ) : (
                  <div className="box-card__placeholder">
                    <span className="material-symbols-outlined">inventory_2</span>
                  </div>
                )}
              </div>
              <div className="search-result__body">
                <div className="search-result__headline">
                  <h2>{result.name}</h2>
                </div>
                <p>{result.description ?? result.detail ?? "Keine Beschreibung."}</p>
                <div className="search-result__meta">
                  <span className="material-symbols-outlined">package_2</span>
                  <span>{result.boxName}</span>
                </div>
                <div className="search-result__meta">
                  <span className="material-symbols-outlined">location_on</span>
                  <span>{result.boxLocation}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : null}

      {visualPreviewUrl ? (
        <section className="panel visual-search-panel">
          <div className="panel-header">
            <div>
              <p className="section-kicker">
                <span className="material-symbols-outlined">photo_camera</span>
                Foto-Suche
              </p>
              <h2>{isVisualSearching ? "Suche läuft…" : `${visualResults.length} Treffer`}</h2>
            </div>
            <button className="button button--ghost" onClick={clearVisualSearch} type="button">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="visual-search-preview">
            <img alt="Suchfoto" src={visualPreviewUrl} />
          </div>
          {isVisualSearching ? <div className="feedback">KI analysiert das Foto…</div> : null}
          <div className="search-results">
            {visualResults.map((result) => (
              <Link className="search-result panel" key={`visual-${result.id}`} to={`/items/${result.id}`}>
                <div className="search-result__media">
                  {resolveAssetUrl(result.thumbnailPath) ? (
                    <img alt={result.name} src={resolveAssetUrl(result.thumbnailPath) ?? undefined} />
                  ) : (
                    <div className="box-card__placeholder">
                      <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                  )}
                </div>
                <div className="search-result__body">
                  <div className="search-result__headline">
                    <h2>{result.name}</h2>
                  </div>
                  <p>{result.description ?? "Keine Beschreibung."}</p>
                  <div className="search-result__meta">
                    <span className="material-symbols-outlined">package_2</span>
                    <span>{result.boxName}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
