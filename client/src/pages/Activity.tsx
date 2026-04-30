import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import {
  listActivity,
  resolveAssetUrl,
  type ActivityEvent,
  type ActivityKind,
} from "../lib/api";

const KIND_META: Record<ActivityKind, { label: string; icon: string; tone: string }> = {
  "box-created": { label: "Behälter erstellt", icon: "add_box", tone: "create" },
  "box-updated": { label: "Behälter geändert", icon: "edit", tone: "update" },
  "item-created": { label: "Item erfasst", icon: "inventory_2", tone: "create" },
  "item-updated": { label: "Item geändert", icon: "edit_note", tone: "update" },
  "loan-started": { label: "Verliehen", icon: "outbound", tone: "loan" },
  "loan-returned": { label: "Zurückgegeben", icon: "assignment_returned", tone: "return" },
};

const RELATIVE = new Intl.RelativeTimeFormat("de", { numeric: "auto" });

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return RELATIVE.format(diffSec, "second");
  if (abs < 3600) return RELATIVE.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return RELATIVE.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 7) return RELATIVE.format(Math.round(diffSec / 86400), "day");
  if (abs < 86400 * 30) return RELATIVE.format(Math.round(diffSec / (86400 * 7)), "week");
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

function formatExact(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventTarget(event: ActivityEvent): string | null {
  if (event.itemId) return `/items/${event.itemId}`;
  if (event.boxId) return `/boxes/${event.boxId}`;
  return null;
}

export function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listActivity(80)
      .then((rows) => {
        if (active) setEvents(rows);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Aktivität konnte nicht geladen werden.");
      });
    return () => {
      active = false;
    };
  }, []);

  const grouped = useMemo(() => {
    if (!events) return [];
    const map = new Map<string, ActivityEvent[]>();
    for (const event of events) {
      const day = new Date(event.at).toLocaleDateString("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const list = map.get(day) ?? [];
      list.push(event);
      map.set(day, list);
    }
    return Array.from(map.entries());
  }, [events]);

  return (
    <div className="page-stack activity-page">
      <PageHeader kicker="Verlauf" title="Aktivität" />
      <section className="panel activity-panel">
        {error ? <p className="activity-state activity-state--error">{error}</p> : null}
        {!error && events === null ? <p className="activity-state">Lädt…</p> : null}
        {!error && events !== null && events.length === 0 ? (
          <p className="activity-state">Noch keine Ereignisse.</p>
        ) : null}
        {!error && events !== null && events.length > 0 ? (
          <ol className="activity-timeline">
            {grouped.map(([day, items]) => (
              <li key={day} className="activity-day">
                <h3 className="activity-day__label">{day}</h3>
                <ul className="activity-day__list">
                  {items.map((event) => {
                    const meta = KIND_META[event.kind];
                    const target = eventTarget(event);
                    const thumb = resolveAssetUrl(event.thumbnailPath);
                    const body = (
                      <>
                        <span
                          className={`activity-row__icon activity-row__icon--${meta.tone}`}
                          aria-hidden
                        >
                          <span className="material-symbols-outlined">{meta.icon}</span>
                        </span>
                        {thumb ? (
                          <span className="activity-row__thumb">
                            <img src={thumb} alt="" />
                          </span>
                        ) : (
                          <span className="activity-row__thumb activity-row__thumb--empty" aria-hidden />
                        )}
                        <span className="activity-row__body">
                          <span className="activity-row__title">{event.title}</span>
                          <span className="activity-row__meta">
                            <span className={`activity-row__chip activity-row__chip--${meta.tone}`}>
                              {meta.label}
                            </span>
                            {event.subtitle ? (
                              <span className="activity-row__subtitle">{event.subtitle}</span>
                            ) : null}
                          </span>
                        </span>
                        <time className="activity-row__time" dateTime={event.at} title={formatExact(event.at)}>
                          {formatRelative(event.at)}
                        </time>
                      </>
                    );
                    return (
                      <li key={event.id} className="activity-row">
                        {target ? (
                          <Link to={target} className="activity-row__link">
                            {body}
                          </Link>
                        ) : (
                          <div className="activity-row__link activity-row__link--static">{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        ) : null}
      </section>
    </div>
  );
}
