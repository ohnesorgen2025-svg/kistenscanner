import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import { CONTAINER_TYPE_ICONS, CONTAINER_TYPE_LABELS, listBoxes, resolveAssetUrl, type BoxSummary } from "../lib/api";

export function BoxesPage() {
  const [boxes, setBoxes] = useState<BoxSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void listBoxes()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setBoxes(data);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (!isMounted) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Kisten konnten nicht geladen werden.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-stack">
      <PageHeader
        actions={(
          <div className="action-row">
            <Link className="button button--primary" to="/boxes/add">
              Behälter hinzufügen
            </Link>
          </div>
        )}
        kicker="Inventar"
        title="Behälter"
      />

      {error ? <div className="feedback feedback--error">{error}</div> : null}

      {isLoading ? <div className="feedback">Kisten werden geladen…</div> : null}

      {!isLoading && boxes.length === 0 ? (
        <section className="panel empty-state">
          <p className="section-kicker">Noch keine Behälter</p>
          <h2>Lege den ersten Behälter an.</h2>
          <div className="action-row">
            <Link className="button button--primary" to="/boxes/add">
              Speicher-Workflow öffnen
            </Link>
          </div>
        </section>
      ) : null}

      <section className="box-grid">
        {boxes.map((box) => (
          <Link className="box-card panel" key={box.id} to={`/boxes/${box.id}`}>
            <div className="box-card__media">
              {resolveAssetUrl(box.thumbnailPath) ? (
                <img alt={box.name} src={resolveAssetUrl(box.thumbnailPath) ?? undefined} />
              ) : (
                <div className="box-card__placeholder">
                  <span className="material-symbols-outlined">{CONTAINER_TYPE_ICONS[box.containerType] ?? "inventory_2"}</span>
                </div>
              )}
            </div>
            <div className="box-card__body">
              <div className="box-card__topline">
                <span className="section-kicker">{CONTAINER_TYPE_LABELS[box.containerType] ?? "Kiste"} #{box.number}</span>
                <span className="chip">{box.itemCount} Items</span>
              </div>
              <h2>{box.name}</h2>
              <p>{box.location}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
