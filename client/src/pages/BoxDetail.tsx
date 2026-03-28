import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Link, useParams } from "react-router-dom";

import {
  getBox,
  listBoxes,
  moveItem,
  resolveAssetUrl,
  setItemImageAsTitle,
  type BoxRecord,
  type BoxSummary,
  type ItemRecord,
  updateItem,
  uploadItemImage,
} from "../lib/api";

type ItemDraft = {
  name: string;
  description: string;
  detail: string;
};

function buildQrValue(box: BoxRecord): string {
  return `kistenscanner://boxes/${box.id}`;
}

export function BoxDetailPage() {
  const params = useParams();
  const boxId = Number(params.id);
  const [box, setBox] = useState<BoxRecord | null>(null);
  const [boxes, setBoxes] = useState<BoxSummary[]>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [moveTargets, setMoveTargets] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [boxData, boxSummaries] = await Promise.all([getBox(boxId), listBoxes()]);
        if (!isMounted) {
          return;
        }

        setBox(boxData);
        setBoxes(boxSummaries);
        setError(null);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Kiste konnte nicht geladen werden.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (!Number.isInteger(boxId) || boxId <= 0) {
      setError("Ungültige Box-ID.");
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [boxId]);

  useEffect(() => {
    let isMounted = true;

    if (!box) {
      setQrCodeDataUrl(null);
      return () => {
        isMounted = false;
      };
    }

    void QRCode.toDataURL(buildQrValue(box), {
      color: { dark: "#0F0F0F", light: "#FFFFFF" },
      margin: 1,
      width: 220,
    })
      .then((dataUrl: string) => {
        if (isMounted) {
          setQrCodeDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (isMounted) {
          setQrCodeDataUrl(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [box]);

  async function refreshBox() {
    const freshBox = await getBox(boxId);
    setBox(freshBox);
  }

  function beginEdit(item: ItemRecord) {
    setEditingItemId(item.id);
    setDraft({
      name: item.name,
      description: item.description ?? "",
      detail: item.detail ?? "",
    });
  }

  async function saveEdit(itemId: number) {
    if (!draft) {
      return;
    }

    try {
      await updateItem(itemId, draft);
      await refreshBox();
      setEditingItemId(null);
      setDraft(null);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Item konnte nicht gespeichert werden.");
    }
  }

  async function handleMove(itemId: number) {
    const targetBoxId = moveTargets[itemId];
    if (!targetBoxId) {
      setError("Bitte zuerst eine Ziel-Kiste wählen.");
      return;
    }

    try {
      await moveItem(itemId, targetBoxId);
      await refreshBox();
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Item konnte nicht verschoben werden.");
    }
  }

  async function handleImageUpload(itemId: number, file: File | null) {
    if (!file) {
      return;
    }

    try {
      await uploadItemImage(itemId, file);
      await refreshBox();
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Zusatzbild konnte nicht hochgeladen werden.");
    }
  }

  async function handleSetTitle(itemImageId: number) {
    try {
      await setItemImageAsTitle(itemImageId);
      await refreshBox();
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Titelbild konnte nicht gesetzt werden.");
    }
  }

  const availableMoveTargets = boxes.filter((entry) => entry.id !== box?.id);

  return (
    <div className="page-stack">
      {isLoading ? <div className="feedback">Kiste wird geladen…</div> : null}
      {error ? <div className="feedback feedback--error">{error}</div> : null}

      {box ? (
        <>
          <section className="panel box-hero">
            <div className="box-hero__copy">
              <p className="section-kicker">Kiste #{box.number}</p>
              <h1>{box.name}</h1>
              <p>{box.location}</p>
              <div className="chip-row">
                <span className="chip">{box.itemCount} Items</span>
              </div>
              <div className="action-row">
                <Link className="button button--ghost" to="/boxes">
                  Zurück zu den Kisten
                </Link>
              </div>
            </div>
            <div className="qr-panel qr-panel--compact">
              {qrCodeDataUrl ? <img alt={`QR-Code für Kiste ${box.number}`} src={qrCodeDataUrl} /> : null}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">Items</p>
                <h2>Kisteninhalt</h2>
              </div>
            </div>

            <div className="review-list">
              {box.items.map((item) => {
                const isEditing = editingItemId === item.id && draft;

                return (
                  <article className="review-card review-card--detail" key={item.id}>
                    <div className="review-card__media">
                      {resolveAssetUrl(item.thumbnailPath) ? (
                        <img alt={item.name} src={resolveAssetUrl(item.thumbnailPath) ?? undefined} />
                      ) : (
                        <div className="box-card__placeholder">
                          <span className="material-symbols-outlined">inventory_2</span>
                        </div>
                      )}
                    </div>

                    <div className="review-card__content">
                      {isEditing ? (
                        <div className="form-grid">
                          <div className="field">
                            <label htmlFor={`edit-name-${item.id}`}>Name</label>
                            <input
                              className="input"
                              id={`edit-name-${item.id}`}
                              onChange={(event) =>
                                setDraft((current) =>
                                  current ? { ...current, name: event.target.value } : current,
                                )
                              }
                              value={draft.name}
                            />
                          </div>
                          <div className="field">
                            <label htmlFor={`edit-description-${item.id}`}>Beschreibung</label>
                            <textarea
                              className="textarea"
                              id={`edit-description-${item.id}`}
                              onChange={(event) =>
                                setDraft((current) =>
                                  current
                                    ? { ...current, description: event.target.value }
                                    : current,
                                )
                              }
                              rows={2}
                              value={draft.description}
                            />
                          </div>
                          <div className="field">
                            <label htmlFor={`edit-detail-${item.id}`}>Details</label>
                            <textarea
                              className="textarea"
                              id={`edit-detail-${item.id}`}
                              onChange={(event) =>
                                setDraft((current) =>
                                  current ? { ...current, detail: event.target.value } : current,
                                )
                              }
                              rows={2}
                              value={draft.detail}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2>{item.name}</h2>
                          <p>{item.description ?? "Noch keine Beschreibung vorhanden."}</p>
                          <p className="detail-copy">{item.detail ?? "Noch keine Details vorhanden."}</p>
                        </>
                      )}

                      <div className="image-strip">
                        {item.images.map((image) => (
                          <button
                            className={`image-thumb ${image.isTitle ? "image-thumb--active" : ""}`}
                            key={image.id}
                            onClick={() => void handleSetTitle(image.id)}
                            type="button"
                          >
                            <img alt={item.name} src={resolveAssetUrl(image.path) ?? undefined} />
                            <span className="image-thumb__label">
                              {image.isTitle ? "Titelbild" : "Als Titel setzen"}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="action-row action-row--wrap">
                        {isEditing ? (
                          <>
                            <button
                              className="button button--primary"
                              onClick={() => void saveEdit(item.id)}
                              type="button"
                            >
                              Speichern
                            </button>
                            <button
                              className="button button--ghost"
                              onClick={() => {
                                setEditingItemId(null);
                                setDraft(null);
                              }}
                              type="button"
                            >
                              Abbrechen
                            </button>
                          </>
                        ) : (
                          <button
                            className="button button--ghost"
                            onClick={() => beginEdit(item)}
                            type="button"
                          >
                            Bearbeiten
                          </button>
                        )}

                        <label className="button button--ghost" htmlFor={`item-upload-${item.id}`}>
                          Foto hinzufügen
                        </label>
                        <input
                          accept="image/*"
                          className="sr-only"
                          id={`item-upload-${item.id}`}
                          onChange={(event) =>
                            void handleImageUpload(item.id, event.target.files?.[0] ?? null)
                          }
                          type="file"
                        />

                        {availableMoveTargets.length > 0 ? (
                          <>
                            <select
                              className="input move-select"
                              onChange={(event) =>
                                setMoveTargets((current) => ({
                                  ...current,
                                  [item.id]: Number(event.target.value),
                                }))
                              }
                              value={moveTargets[item.id] ?? ""}
                            >
                              <option value="">Verschieben nach…</option>
                              {availableMoveTargets.map((target) => (
                                <option key={target.id} value={target.id}>
                                  #{target.number} · {target.name}
                                </option>
                              ))}
                            </select>
                            <button
                              className="button button--ghost"
                              onClick={() => void handleMove(item.id)}
                              type="button"
                            >
                              Verschieben
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
