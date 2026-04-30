import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  CONTAINER_TYPE_ICONS,
  CONTAINER_TYPE_LABELS,
  listBoxes,
  resolveAssetUrl,
  type BoxSummary,
} from "../lib/api";

type ViewMode = "list" | "grid";

const ALL_FILTER = "Alle";

type SortKey = "updated" | "items" | "name" | "number";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updated", label: "Letzte Änderung" },
  { key: "number", label: "Behälter-Nr." },
  { key: "items", label: "Anzahl Items" },
  { key: "name", label: "Name (A–Z)" },
];

function sortBoxes(rows: BoxSummary[], key: SortKey): BoxSummary[] {
  const next = [...rows];
  switch (key) {
    case "updated":
      next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      break;
    case "items":
      next.sort((a, b) => b.itemCount - a.itemCount || a.number - b.number);
      break;
    case "name":
      next.sort((a, b) => a.name.localeCompare(b.name, "de"));
      break;
    case "number":
      next.sort((a, b) => a.number - b.number);
      break;
  }
  return next;
}

function formatItems(count: number) {
  return `${count} ${count === 1 ? "Item" : "Items"}`;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "2-digit" });
  } catch {
    return "—";
  }
}

export function BoxesPage() {
  const navigate = useNavigate();
  const [boxes, setBoxes] = useState<BoxSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [filter, setFilter] = useState<string>(ALL_FILTER);
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void listBoxes()
      .then((data) => {
        if (!isMounted) return;
        setBoxes(data);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (!isMounted) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Kisten konnten nicht geladen werden.",
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const locations = useMemo(() => {
    const set = new Set<string>();
    for (const b of boxes) {
      const loc = (b.location ?? "").trim();
      if (loc) set.add(loc);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "de"));
  }, [boxes]);

  // Reset filter when current selection no longer exists (e.g. after delete)
  useEffect(() => {
    if (filter !== ALL_FILTER && !locations.includes(filter)) {
      setFilter(ALL_FILTER);
    }
  }, [filter, locations]);

  const filtered = useMemo(() => {
    const base = filter === ALL_FILTER ? boxes : boxes.filter((b) => (b.location ?? "").trim() === filter);
    return sortBoxes(base, sortKey);
  }, [boxes, filter, sortKey]);

  useEffect(() => {
    if (!isSortOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest(".boxes-filter__sort")) return;
      setIsSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isSortOpen]);

  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? "Sortieren";

  return (
    <div className="boxes-page">
      <header className="boxes-page__head">
        <div className="boxes-page__heading">
          <p className="boxes-page__kicker">Inventar · {boxes.length} Behälter</p>
          <h1 className="boxes-page__title">Behälter</h1>
          <p className="boxes-page__sub">
            Alles was du eingelagert hast. Klick rein für Details, scan einen Code für den Direkteinstieg.
          </p>
        </div>
      </header>

      <div className="boxes-filter" role="toolbar" aria-label="Filter">
        <button
          type="button"
          className={`boxes-filter__chip${filter === ALL_FILTER ? " boxes-filter__chip--active" : ""}`}
          onClick={() => setFilter(ALL_FILTER)}
        >
          {ALL_FILTER}
          <span className="boxes-filter__count">{boxes.length}</span>
        </button>
        {locations.map((loc) => {
          const count = boxes.filter((b) => (b.location ?? "").trim() === loc).length;
          return (
            <button
              key={loc}
              type="button"
              className={`boxes-filter__chip${filter === loc ? " boxes-filter__chip--active" : ""}`}
              onClick={() => setFilter(loc)}
            >
              {loc}
              <span className="boxes-filter__count">{count}</span>
            </button>
          );
        })}

        <span className="boxes-filter__sep" aria-hidden="true" />

        <div className="boxes-filter__sort">
          <button
            type="button"
            className={`boxes-filter__chip${isSortOpen ? " boxes-filter__chip--active" : ""}`}
            onClick={() => setIsSortOpen((v) => !v)}
            aria-expanded={isSortOpen}
            aria-haspopup="listbox"
          >
            <span className="material-symbols-outlined">swap_vert</span>
            {sortLabel}
            <span className="material-symbols-outlined boxes-filter__caret">
              {isSortOpen ? "expand_less" : "expand_more"}
            </span>
          </button>
          {isSortOpen ? (
            <ul className="boxes-filter__menu" role="listbox">
              {SORT_OPTIONS.map((opt) => (
                <li key={opt.key} role="option" aria-selected={opt.key === sortKey}>
                  <button
                    type="button"
                    className={`boxes-filter__menu-item${opt.key === sortKey ? " is-active" : ""}`}
                    onClick={() => {
                      setSortKey(opt.key);
                      setIsSortOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {opt.key === sortKey ? (
                      <span className="material-symbols-outlined">check</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="boxes-filter__view" role="group" aria-label="Ansicht">
          <button
            type="button"
            className={view === "list" ? "is-active" : ""}
            onClick={() => setView("list")}
            aria-label="Listenansicht"
          >
            <span className="material-symbols-outlined">view_list</span>
          </button>
          <button
            type="button"
            className={view === "grid" ? "is-active" : ""}
            onClick={() => setView("grid")}
            aria-label="Rasteransicht"
          >
            <span className="material-symbols-outlined">grid_view</span>
          </button>
        </div>
      </div>

      {error ? <div className="boxes-page__feedback">{error}</div> : null}

      {isLoading ? (
        <div className="boxes-page__feedback">Kisten werden geladen…</div>
      ) : filtered.length === 0 ? (
        <div className="boxes-page__feedback">
          {boxes.length === 0 ? (
            <>
              Noch keine Behälter angelegt.{" "}
              <Link to="/boxes/add">Ersten Behälter anlegen →</Link>
            </>
          ) : (
            <>Keine Behälter im Filter „{filter}".</>
          )}
        </div>
      ) : view === "list" ? (
        <div className="boxes-table" role="table">
          <div className="boxes-table__row boxes-table__row--head" role="row">
            <div />
            <div>#</div>
            <div>Name</div>
            <div>Standort</div>
            <div style={{ textAlign: "right" }}>Items</div>
            <div style={{ textAlign: "right" }}>Aktualisiert</div>
            <div />
          </div>

          {filtered.map((box) => {
            const thumb = resolveAssetUrl(box.thumbnailPath);
            return (
              <div
                key={box.id}
                role="row"
                className="boxes-table__row boxes-table__row--body"
                onClick={() => navigate(`/boxes/${box.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/boxes/${box.id}`);
                }}
                tabIndex={0}
              >
                <div className="boxes-table__thumb">
                  {thumb ? (
                    <img alt={box.name} src={thumb} />
                  ) : (
                    <span className="material-symbols-outlined">
                      {CONTAINER_TYPE_ICONS[box.containerType] ?? "inventory_2"}
                    </span>
                  )}
                </div>
                <div className="boxes-table__num">
                  #{String(box.number).padStart(3, "0")}
                </div>
                <div>
                  <div className="boxes-table__name">{box.name}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-tertiary)",
                      marginTop: 2,
                    }}
                  >
                    {CONTAINER_TYPE_LABELS[box.containerType] ?? "Kiste"}
                  </div>
                </div>
                <div className="boxes-table__loc">
                  <span className="material-symbols-outlined">location_on</span>
                  <span>{box.location || "—"}</span>
                </div>
                <div className="boxes-table__items">{formatItems(box.itemCount)}</div>
                <div className="boxes-table__date">{formatDate(box.updatedAt)}</div>
                <div className="boxes-table__chev">
                  <span className="material-symbols-outlined">chevron_right</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="boxes-cards">
          {filtered.map((box) => {
            const thumb = resolveAssetUrl(box.thumbnailPath);
            return (
              <Link key={box.id} to={`/boxes/${box.id}`} className="boxes-card">
                <div className="boxes-card__media">
                  {thumb ? (
                    <img alt={box.name} src={thumb} />
                  ) : (
                    <span className="material-symbols-outlined">
                      {CONTAINER_TYPE_ICONS[box.containerType] ?? "inventory_2"}
                    </span>
                  )}
                </div>
                <div className="boxes-card__body">
                  <div className="boxes-card__head">
                    <span className="boxes-card__num">
                      #{String(box.number).padStart(3, "0")}
                    </span>
                    <span className="boxes-card__count">{formatItems(box.itemCount)}</span>
                  </div>
                  <h2 className="boxes-card__title">{box.name}</h2>
                  <div className="boxes-card__loc">
                    <span className="material-symbols-outlined">location_on</span>
                    <span>{box.location || "—"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
