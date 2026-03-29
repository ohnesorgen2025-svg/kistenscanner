import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Link, useParams } from "react-router-dom";

import {
  getBox,
  listBoxes,
  moveItem,
  resolveAssetUrl,
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
  return `kistenscanner://box-number/${box.number}`;
}

function getItemImageUrl(item: ItemRecord): string | null {
  return resolveAssetUrl(item.thumbnailPath ?? item.images[0]?.path ?? null);
}

export function BoxDetailPage() {
  const params = useParams();
  const boxId = Number(params.id);
  const [box, setBox] = useState<BoxRecord | null>(null);
  const [boxes, setBoxes] = useState<BoxSummary[]>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [movingItemId, setMovingItemId] = useState<number | null>(null);
  const [selectedTargetBoxId, setSelectedTargetBoxId] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const confirmationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function clearPrintMode() {
      document.body.classList.remove("print-label-mode");
    }

    window.addEventListener("afterprint", clearPrintMode);
    return () => {
      clearPrintMode();
      window.removeEventListener("afterprint", clearPrintMode);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current) {
        window.clearTimeout(confirmationTimeoutRef.current);
      }
    };
  }, []);

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

  function handlePrintLabel() {
    document.body.classList.add("print-label-mode");
    window.print();
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

  function openMoveMenu(itemId: number) {
    setMovingItemId(itemId);
    setSelectedTargetBoxId(null);
    setError(null);
  }

  function closeMoveMenu() {
    setMovingItemId(null);
    setSelectedTargetBoxId(null);
  }

  async function handleMove(itemId: number) {
    const targetBoxId = selectedTargetBoxId;
    if (!targetBoxId) {
      setError("Bitte zuerst eine Ziel-Kiste wählen.");
      return;
    }

    try {
      await moveItem(itemId, targetBoxId);
      setBox((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          itemCount: Math.max(current.itemCount - 1, 0),
          items: current.items.filter((entry) => entry.id !== itemId),
        };
      });
      closeMoveMenu();
      setError(null);
      setConfirmation("Item wurde verschoben.");
      if (confirmationTimeoutRef.current) {
        window.clearTimeout(confirmationTimeoutRef.current);
      }
      confirmationTimeoutRef.current = window.setTimeout(() => {
        setConfirmation(null);
      }, 2500);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Verschieben fehlgeschlagen",
      );
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


  const availableMoveTargets = boxes.filter((entry) => entry.id !== box?.id);

  return (
    <div className="page-stack">
      {isLoading ? <div className="feedback">Kiste wird geladen…</div> : null}
      {confirmation ? <div className="feedback">{confirmation}</div> : null}
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
                <button className="button button--primary" onClick={handlePrintLabel} type="button">
                  Label drucken
                </button>
                <Link className="button button--ghost" to="/boxes">
                  Zurück zu den Kisten
                </Link>
              </div>
            </div>
            <div className="qr-panel qr-panel--compact">
              {qrCodeDataUrl ? <img alt={`QR-Code für Kiste ${box.number}`} src={qrCodeDataUrl} /> : null}
            </div>
          </section>

          <section className="panel print-label-panel" data-print-label="true">
            <div className="print-label">
              <div className="print-label__qr">
                {qrCodeDataUrl ? <img alt={`QR-Code für Kiste ${box.number}`} src={qrCodeDataUrl} /> : null}
              </div>
              <div className="print-label__copy">
                <p className="print-label__kicker">Kiste #{box.number}</p>
                <h2>{box.name}</h2>
                <p>{box.location}</p>
                <div className="print-label__items">
                  <span>Top 5 Items</span>
                  <ol>
                    {box.items.slice(0, 5).map((item) => (
                      <li key={item.id}>{item.name}</li>
                    ))}
                  </ol>
                </div>
              </div>
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
                  <article
                    className={`review-card review-card--detail${isEditing ? " review-card--editing" : ""}`}
                    key={item.id}
                  >
                    <div className="review-card__media">
                      {(item.quantity && item.quantity > 0) ? (
                        <div className="card-badge">
                          x{item.quantity}
                        </div>
                      ) : null}
                      {getItemImageUrl(item) ? (
                        <img alt={item.name} src={getItemImageUrl(item) ?? undefined} />
                      ) : (
                        <div className="box-card__placeholder">
                          <span className="material-symbols-outlined">inventory_2</span>
                        </div>
                      )}
                    </div>

                    <div className="review-card__content">
                      {isEditing ? (
                        <div className="review-card__edit-form">
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
                          <div className="review-card__edit-actions">
                            <button
                              className="button button--primary"
                              onClick={() => void saveEdit(item.id)}
                              type="button"
                            >
                              <span className="material-symbols-outlined">save</span>
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
                              <span className="material-symbols-outlined">close</span>
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="review-card__body">
                          <p className="review-card__name">{item.name}</p>
                          {item.description ? <p className="review-card__desc">{item.description}</p> : null}
                        </div>
                      )}

                      {!isEditing ? (
                        <div className="review-card__actions">
                          <button
                            className="icon-btn"
                            onClick={() => beginEdit(item)}
                            title="Bearbeiten"
                            type="button"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <label className="icon-btn" htmlFor={`item-upload-${item.id}`} title="Foto hinzufügen">
                            <span className="material-symbols-outlined">add_photo_alternate</span>
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
                          <button
                            className="icon-btn"
                            disabled={availableMoveTargets.length === 0}
                            onClick={() => openMoveMenu(item.id)}
                            title="Verschieben"
                            type="button"
                          >
                            <span className="material-symbols-outlined">drive_file_move</span>
                          </button>
                        </div>
                      ) : null}


                      {movingItemId === item.id && availableMoveTargets.length > 0 ? (
                        <div className="move-panel">
                          <div className="field">
                            <label htmlFor={`move-item-${item.id}`}>Ziel-Kiste</label>
                            <select
                              className="input move-select"
                              id={`move-item-${item.id}`}
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                setSelectedTargetBoxId(Number.isInteger(value) && value > 0 ? value : null);
                              }}
                              value={selectedTargetBoxId ?? ""}
                            >
                              <option value="">Kiste auswählen…</option>
                              {availableMoveTargets.map((target) => (
                                <option key={target.id} value={target.id}>
                                  #{target.number} · {target.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="action-row">
                            <button
                              className="button button--primary"
                              onClick={() => void handleMove(item.id)}
                              type="button"
                            >
                              Bestätigen
                            </button>
                            <button className="button button--ghost" onClick={closeMoveMenu} type="button">
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : null}
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
