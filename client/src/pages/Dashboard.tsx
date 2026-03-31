import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import {
  detectDuplicates,
  getInventoryStats,
  getReorganizationSuggestions,
  resolveAssetUrl,
  type DuplicateGroup,
  type InventoryStats,
  type ReorganizationSuggestion,
} from "../lib/api";

export function DashboardPage() {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [isDuplicateLoading, setIsDuplicateLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [hasDuplicateRun, setHasDuplicateRun] = useState(false);

  const [suggestions, setSuggestions] = useState<ReorganizationSuggestion[]>([]);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [hasSuggestionRun, setHasSuggestionRun] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void getInventoryStats()
      .then((data) => {
        if (isMounted) {
          setStats(data);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) setError(requestError instanceof Error ? requestError.message : "Statistik fehlgeschlagen.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  async function handleDuplicateCheck() {
    setIsDuplicateLoading(true);
    setDuplicateError(null);
    try {
      const groups = await detectDuplicates();
      setDuplicates(groups);
      setHasDuplicateRun(true);
    } catch (requestError) {
      setDuplicateError(requestError instanceof Error ? requestError.message : "Duplikat-Erkennung fehlgeschlagen.");
    } finally {
      setIsDuplicateLoading(false);
    }
  }

  async function handleReorganize() {
    setIsSuggestionLoading(true);
    setSuggestionError(null);
    try {
      const result = await getReorganizationSuggestions();
      setSuggestions(result);
      setHasSuggestionRun(true);
    } catch (requestError) {
      setSuggestionError(requestError instanceof Error ? requestError.message : "Reorganisation fehlgeschlagen.");
    } finally {
      setIsSuggestionLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader kicker="Übersicht" title="Dashboard" />

      {error ? <div className="feedback feedback--error">{error}</div> : null}
      {isLoading ? <div className="feedback">Statistik wird geladen…</div> : null}

      {stats ? (
        <>
          <section className="dashboard-stats">
            <div className="stat-card panel">
              <span className="material-symbols-outlined stat-card__icon">inventory_2</span>
              <div className="stat-card__value">{stats.totalBoxes}</div>
              <div className="stat-card__label">Kisten</div>
            </div>
            <div className="stat-card panel">
              <span className="material-symbols-outlined stat-card__icon">category</span>
              <div className="stat-card__value">{stats.totalItems}</div>
              <div className="stat-card__label">Items</div>
            </div>
            <div className="stat-card panel">
              <span className="material-symbols-outlined stat-card__icon">photo_library</span>
              <div className="stat-card__value">{stats.totalImages}</div>
              <div className="stat-card__label">Bilder</div>
            </div>
          </section>

          {(stats.boxesWithoutItems > 0 || stats.itemsWithoutImage > 0) ? (
            <section className="panel dashboard-alerts">
              <p className="section-kicker">Hinweise</p>
              {stats.boxesWithoutItems > 0 ? (
                <div className="dashboard-alert">
                  <span className="material-symbols-outlined">warning</span>
                  <span>{stats.boxesWithoutItems} Kiste{stats.boxesWithoutItems > 1 ? "n" : ""} ohne Items</span>
                </div>
              ) : null}
              {stats.itemsWithoutImage > 0 ? (
                <div className="dashboard-alert">
                  <span className="material-symbols-outlined">image_not_supported</span>
                  <span>{stats.itemsWithoutImage} Item{stats.itemsWithoutImage > 1 ? "s" : ""} ohne Bild</span>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">Zuletzt bearbeitet</p>
                <h2>Letzte Kisten</h2>
              </div>
            </div>
            <div className="box-grid box-grid--compact">
              {stats.recentBoxes.map((box) => (
                <Link className="box-card panel" key={box.id} to={`/boxes/${box.id}`}>
                  <div className="box-card__media">
                    {resolveAssetUrl(box.thumbnailPath) ? (
                      <img alt={box.name} src={resolveAssetUrl(box.thumbnailPath) ?? undefined} />
                    ) : (
                      <div className="box-card__placeholder">
                        <span className="material-symbols-outlined">inventory_2</span>
                      </div>
                    )}
                  </div>
                  <div className="box-card__body">
                    <div className="box-card__topline">
                      <span className="section-kicker">Kiste #{box.number}</span>
                      <span className="chip">{box.itemCount} Items</span>
                    </div>
                    <h2>{box.name}</h2>
                    <p>{box.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {stats.locationBreakdown.length > 0 ? (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Standorte</p>
                  <h2>Verteilung</h2>
                </div>
              </div>
              <div className="location-breakdown">
                {stats.locationBreakdown.map((entry) => (
                  <div className="location-row" key={entry.location}>
                    <span className="location-row__name">{entry.location}</span>
                    <div className="location-row__bar-wrap">
                      <div
                        className="location-row__bar"
                        style={{ width: `${Math.min((entry.boxCount / stats.totalBoxes) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="location-row__count">{entry.boxCount}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">KI-Analyse</p>
            <h2>Duplikat-Erkennung</h2>
          </div>
          <button
            className="button button--ghost"
            disabled={isDuplicateLoading}
            onClick={() => void handleDuplicateCheck()}
            type="button"
          >
            {isDuplicateLoading ? (
              <>
                <span className="material-symbols-outlined spin">progress_activity</span>
                Prüfe…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">content_copy</span>
                Duplikate suchen
              </>
            )}
          </button>
        </div>
        {duplicateError ? <div className="feedback feedback--error">{duplicateError}</div> : null}
        {hasDuplicateRun && duplicates.length === 0 ? (
          <p className="feedback">Keine Duplikate gefunden — dein Inventar ist sauber!</p>
        ) : null}
        {duplicates.length > 0 ? (
          <div className="duplicate-groups">
            {duplicates.map((group, i) => (
              <div className="duplicate-group panel" key={i}>
                <p className="duplicate-group__reason">
                  <span className="material-symbols-outlined">content_copy</span>
                  {group.reason}
                </p>
                <div className="duplicate-group__items">
                  {group.items.map((item) => (
                    <Link className="chip chip--link" key={`${item.id}-${item.boxId}`} to={`/boxes/${item.boxId}`}>
                      Kiste #{item.boxId} · Item #{item.id}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">KI-Analyse</p>
            <h2>Smart-Reorganisation</h2>
          </div>
          <button
            className="button button--ghost"
            disabled={isSuggestionLoading}
            onClick={() => void handleReorganize()}
            type="button"
          >
            {isSuggestionLoading ? (
              <>
                <span className="material-symbols-outlined spin">progress_activity</span>
                Analysiere…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">auto_fix_high</span>
                Vorschläge
              </>
            )}
          </button>
        </div>
        {suggestionError ? <div className="feedback feedback--error">{suggestionError}</div> : null}
        {hasSuggestionRun && suggestions.length === 0 ? (
          <p className="feedback">Keine Verbesserungsvorschläge — alles gut organisiert!</p>
        ) : null}
        {suggestions.length > 0 ? (
          <div className="suggestion-list">
            {suggestions.map((suggestion, i) => (
              <div className="suggestion-card panel" key={i}>
                <span className={`chip chip--${suggestion.type}`}>{suggestion.type}</span>
                <p>{suggestion.description}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Export</p>
            <h2>Inventar exportieren</h2>
          </div>
        </div>
        <div className="action-row action-row--wrap">
          <a className="button button--ghost" href="/api/ai/export/csv" download>
            <span className="material-symbols-outlined">table_view</span>
            CSV Export
          </a>
          <a className="button button--ghost" href="/api/ai/export/json" download>
            <span className="material-symbols-outlined">data_object</span>
            JSON Export
          </a>
        </div>
      </section>
    </div>
  );
}
