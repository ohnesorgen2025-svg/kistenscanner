import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { type BoxSummary, listBoxes } from "../lib/api";

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

        setError(requestError instanceof Error ? requestError.message : "Boxes konnten nicht geladen werden.");
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
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Inventory</p>
            <h1>Saved Boxes</h1>
          </div>
          <Link className="button button--primary" to="/boxes/add">
            Add Box
          </Link>
        </div>
        <p className="panel-copy">
          Every card shows the assigned number, current location and the first available
          thumbnail from stored items.
        </p>
      </section>

      {error ? <div className="feedback feedback--error">{error}</div> : null}

      {isLoading ? <div className="feedback">Loading boxes…</div> : null}

      {!isLoading && boxes.length === 0 ? (
        <section className="panel empty-state">
          <p className="section-kicker">No Boxes Yet</p>
          <h2>Create the first stored box.</h2>
          <Link className="button button--primary" to="/boxes/add">
            Open Store Flow
          </Link>
        </section>
      ) : null}

      <section className="box-grid">
        {boxes.map((box) => (
          <Link className="box-card panel" key={box.id} to={`/boxes/${box.id}`}>
            <div className="box-card__media">
              {box.thumbnailPath ? (
                <img alt={box.name} src={box.thumbnailPath} />
              ) : (
                <div className="box-card__placeholder">
                  <span className="material-symbols-outlined">inventory_2</span>
                </div>
              )}
            </div>
            <div className="box-card__body">
              <div className="box-card__topline">
                <span className="section-kicker">Box #{box.number}</span>
                <span className="chip">{box.itemCount} items</span>
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
