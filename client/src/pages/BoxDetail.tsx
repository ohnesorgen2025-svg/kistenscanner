import { useEffect, useRef, useState, type CSSProperties } from "react";
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

type LabelProfile = {
  id: string;
  label: string;
  pageWidthMm: number;
  pageHeightMm: number;
  columns: number;
  rows: number;
  labelWidthMm: number;
  labelHeightMm: number;
  marginTopMm: number;
  marginLeftMm: number;
  gapXmm: number;
  gapYmm: number;
  qrMm: number;
  numberFontPt: number;
};

type LabelSlot = {
  index: number;
  row: number;
  column: number;
  leftMm: number;
  topMm: number;
};

type StickerGeometry = {
  insetX: number;
  insetY: number;
  halfWidth: number;
  innerHeight: number;
  numberCenterX: number;
  contentCenterY: number;
  qrCenterY: number;
  numberFontSize: number;
  qrSize: number;
  qrX: number;
  qrY: number;
};

const labelProfiles: LabelProfile[] = [
  {
    id: "no-5028",
    label: "No. 5028 · 83,82 × 50,80 mm · 2 × 5",
    pageWidthMm: 210,
    pageHeightMm: 297,
    columns: 2,
    rows: 5,
    labelWidthMm: 83.8,
    labelHeightMm: 50.8,
    marginTopMm: 21.5,
    marginLeftMm: 18.7,
    gapXmm: 5,
    gapYmm: 0,
    qrMm: 28,
    numberFontPt: 26,
  },
];

function buildSlots(profile: LabelProfile): LabelSlot[] {
  return Array.from({ length: profile.columns * profile.rows }, (_, index) => {
    const row = Math.floor(index / profile.columns);
    const column = index % profile.columns;

    return {
      index,
      row,
      column,
      leftMm: profile.marginLeftMm + column * (profile.labelWidthMm + profile.gapXmm),
      topMm: profile.marginTopMm + row * (profile.labelHeightMm + profile.gapYmm),
    };
  });
}

function buildQrValue(box: BoxRecord): string {
  return `kistenscanner://box-number/${box.number}`;
}

function formatSlotList(slots: LabelSlot[]): string {
  return slots
    .map((slot) => slot.index + 1)
    .sort((left, right) => left - right)
    .join(", ");
}

function buildStickerGeometry(profile: LabelProfile, labelText: string): StickerGeometry {
  const insetX = profile.labelWidthMm * 0.1;
  const insetY = profile.labelHeightMm * 0.1;
  const innerWidth = profile.labelWidthMm - insetX * 2;
  const innerHeight = profile.labelHeightMm - insetY * 2;
  const halfWidth = innerWidth / 2;
  const numberCenterX = insetX + halfWidth / 2;
  const qrCenterX = insetX + halfWidth + halfWidth / 2;
  const contentCenterY = insetY + innerHeight / 2 + innerHeight * 0.035;
  const qrCenterY = contentCenterY - innerHeight * 0.03;
  const baseSize = Math.min(halfWidth, innerHeight);
  const lengthFactor =
    labelText.length <= 1 ? 0.86 : labelText.length === 2 ? 0.72 : labelText.length === 3 ? 0.58 : 0.46;
  const numberFontSize = baseSize * lengthFactor;
  const qrSize = Math.min(halfWidth, innerHeight) * 0.86;

  return {
    insetX,
    insetY,
    halfWidth,
    innerHeight,
    numberCenterX,
    contentCenterY,
    qrCenterY,
    numberFontSize,
    qrSize,
    qrX: qrCenterX - qrSize / 2,
    qrY: qrCenterY - qrSize / 2,
  };
}

function StickerArtwork({
  labelText,
  profile,
  qrCodeDataUrl,
}: {
  labelText: string;
  profile: LabelProfile;
  qrCodeDataUrl: string | null;
}) {
  const geometry = buildStickerGeometry(profile, labelText);

  return (
    <svg
      aria-hidden="true"
      className="sticker-artwork"
      preserveAspectRatio="none"
      viewBox={`0 0 ${profile.labelWidthMm} ${profile.labelHeightMm}`}
    >
      <line
        stroke="rgba(0, 218, 243, 0.55)"
        strokeDasharray={`${profile.labelWidthMm * 0.025} ${profile.labelWidthMm * 0.015}`}
        strokeWidth={0.3}
        x1={0}
        x2={profile.labelWidthMm}
        y1={profile.labelHeightMm / 2}
        y2={profile.labelHeightMm / 2}
      />
      <text
        dominantBaseline="middle"
        fill="#111111"
        fontFamily="Space Grotesk, sans-serif"
        fontSize={geometry.numberFontSize}
        fontWeight="700"
        textAnchor="middle"
        x={geometry.numberCenterX}
        y={geometry.contentCenterY}
      >
        {labelText}
      </text>
      {qrCodeDataUrl ? (
        <image
          height={geometry.qrSize}
          href={qrCodeDataUrl}
          preserveAspectRatio="xMidYMid meet"
          width={geometry.qrSize}
          x={geometry.qrX}
          y={geometry.qrY}
        />
      ) : null}
    </svg>
  );
}

function getItemImageUrl(item: ItemRecord): string | null {
  return resolveAssetUrl(item.thumbnailPath ?? item.images[0]?.path ?? null);
}

export function BoxDetailPage() {
  const params = useParams();
  const boxId = Number(params.id);
  const labelPanelRef = useRef<HTMLElement | null>(null);
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
  const [labelProfileId, setLabelProfileId] = useState<string>(labelProfiles[0].id);
  const [selectedLabelSlotIndices, setSelectedLabelSlotIndices] = useState<number[]>([0]);
  const [isLabelPanelOpen, setIsLabelPanelOpen] = useState(false);
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

  useEffect(() => {
    if (!isLabelPanelOpen) {
      return;
    }

    window.requestAnimationFrame(() => {
      labelPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [isLabelPanelOpen]);

  async function refreshBox() {
    const freshBox = await getBox(boxId);
    setBox(freshBox);
  }

  function handlePrintLabel() {
    document.body.classList.add("print-label-mode");
    window.print();
  }

  function toggleSelectedLabelSlot(slotIndex: number) {
    setSelectedLabelSlotIndices((current) => {
      if (current.includes(slotIndex)) {
        return current.filter((entry) => entry !== slotIndex);
      }

      return [...current, slotIndex].sort((left, right) => left - right);
    });
  }

  function openLabelPanel() {
    setIsLabelPanelOpen(true);
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
  const activeLabelProfile =
    labelProfiles.find((profile) => profile.id === labelProfileId) ?? labelProfiles[0];
  const labelSlots = buildSlots(activeLabelProfile);
  const selectedLabelSlots = labelSlots.filter((slot) => selectedLabelSlotIndices.includes(slot.index));
  const printSheetStyle = {
    "--print-sheet-width": `${activeLabelProfile.pageWidthMm}mm`,
    "--print-sheet-height": `${activeLabelProfile.pageHeightMm}mm`,
    "--print-sticker-qr-size": `${activeLabelProfile.qrMm}mm`,
    "--print-sticker-number-size": `${activeLabelProfile.numberFontPt}pt`,
  } as CSSProperties;

  return (
    <div className="page-stack">
      {isLoading ? <div className="feedback">Kiste wird geladen…</div> : null}
      {confirmation ? <div className="feedback">{confirmation}</div> : null}
      {error ? <div className="feedback feedback--error">{error}</div> : null}

      {box ? (
        <>
          <section className="panel box-detail-header">
            <div className="box-detail-header__copy">
              <p className="section-kicker">Kiste</p>
              <h1 className="box-detail-header__title">Kiste #{box.number}</h1>
              <p className="box-detail-header__name">{box.name}</p>
              <div className="box-detail-header__meta">
                <span>Standort: {box.location}</span>
                <span>{box.itemCount} Items</span>
              </div>
              <div className="action-row">
                <button className="button button--primary" onClick={openLabelPanel} type="button">
                  Label drucken
                </button>
                <Link className="button button--ghost" to="/boxes">
                  Zurück zu den Kisten
                </Link>
              </div>
            </div>
            <div className="box-detail-header__code">
              <div className="qr-panel qr-panel--compact">
                {qrCodeDataUrl ? <img alt={`QR-Code für Kiste ${box.number}`} src={qrCodeDataUrl} /> : null}
              </div>
              <p className="box-detail-header__qr-label">QR zum Scannen</p>
            </div>
          </section>

          <section
            className={`panel label-print-panel${isLabelPanelOpen ? "" : " label-print-panel--collapsed"}`}
            ref={labelPanelRef}
          >
            <div className="panel-header">
              <div>
                <p className="section-kicker">Stickerdruck</p>
                <h2>Bogen und Position</h2>
              </div>
              <button
                aria-expanded={isLabelPanelOpen}
                className="button button--ghost"
                onClick={() => setIsLabelPanelOpen((current) => !current)}
                type="button"
              >
                <span className="material-symbols-outlined">
                  {isLabelPanelOpen ? "expand_less" : "expand_more"}
                </span>
                {isLabelPanelOpen ? "Einklappen" : "Aufklappen"}
              </button>
            </div>

            {isLabelPanelOpen ? (
              <>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="label-profile">Label-Profil</label>
                    <select
                      className="input"
                      id="label-profile"
                      onChange={(event) => {
                        const nextProfileId = event.target.value;
                        setLabelProfileId(nextProfileId);
                        setSelectedLabelSlotIndices([0]);
                      }}
                      value={labelProfileId}
                    >
                      {labelProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="label-preview__meta">
                  <div className="label-preview__meta-copy">
                    <p className="section-kicker">Auswahl</p>
                    <p className="label-preview__selection">
                      {selectedLabelSlots.length === 0
                        ? "Noch kein Feld ausgewählt"
                        : `${selectedLabelSlots.length} Etikett${selectedLabelSlots.length > 1 ? "en" : ""} · Felder ${formatSlotList(selectedLabelSlots)}`}
                    </p>
                    <p className="label-preview__selection-hint">
                      Klicke mehrere freie Felder an, wenn dieselbe Nummer mehrfach auf den Bogen soll.
                    </p>
                  </div>
                  <div className="label-preview__meta-actions">
                    <button
                      className="button button--ghost"
                      onClick={() => setSelectedLabelSlotIndices([0])}
                      type="button"
                    >
                      Auswahl zurücksetzen
                    </button>
                    <button
                      className="button button--primary"
                      disabled={selectedLabelSlots.length === 0}
                      onClick={handlePrintLabel}
                      type="button"
                    >
                      Druckdialog öffnen
                    </button>
                  </div>
                </div>

                <div className="label-preview">
                  <div className="label-preview__sheet">
                    {labelSlots.map((slot) => {
                      const isSelected = selectedLabelSlotIndices.includes(slot.index);
                      const slotStyle = {
                        left: `${(slot.leftMm / activeLabelProfile.pageWidthMm) * 100}%`,
                        top: `${(slot.topMm / activeLabelProfile.pageHeightMm) * 100}%`,
                        width: `${(activeLabelProfile.labelWidthMm / activeLabelProfile.pageWidthMm) * 100}%`,
                        height: `${(activeLabelProfile.labelHeightMm / activeLabelProfile.pageHeightMm) * 100}%`,
                      } as CSSProperties;

                      return (
                        <button
                          className={`label-preview__slot${isSelected ? " label-preview__slot--active" : ""}`}
                          key={slot.index}
                          onClick={() => toggleSelectedLabelSlot(slot.index)}
                          style={slotStyle}
                          type="button"
                        >
                          {isSelected ? (
                            <div className="label-preview__sticker">
                              <StickerArtwork
                                labelText={String(box.number)}
                                profile={activeLabelProfile}
                                qrCodeDataUrl={qrCodeDataUrl}
                              />
                            </div>
                          ) : (
                            <span className="label-preview__slot-index">{slot.index + 1}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <p className="label-print-panel__hint">
                Öffne den Bereich, wähle das Label-Profil und die freie Position auf dem Bogen.
              </p>
            )}
          </section>

          <section className="panel print-label-panel" data-print-label="true">
            <div className="print-sheet" style={printSheetStyle}>
              {labelSlots.map((slot) => {
                const guideStyle = {
                  left: `${slot.leftMm}mm`,
                  top: `${slot.topMm}mm`,
                  width: `${activeLabelProfile.labelWidthMm}mm`,
                  height: `${activeLabelProfile.labelHeightMm}mm`,
                } as CSSProperties;

                return <div className="print-sheet__guide" key={slot.index} style={guideStyle} />;
              })}
              {selectedLabelSlots.map((slot) => {
                const printStickerStyle = {
                  "--print-sticker-width": `${activeLabelProfile.labelWidthMm}mm`,
                  "--print-sticker-height": `${activeLabelProfile.labelHeightMm}mm`,
                  "--print-sticker-left": `${slot.leftMm}mm`,
                  "--print-sticker-top": `${slot.topMm}mm`,
                } as CSSProperties;

                return (
                  <div
                    className="print-sticker"
                    key={slot.index}
                    style={printStickerStyle}
                  >
                    <StickerArtwork
                      labelText={String(box.number)}
                      profile={activeLabelProfile}
                      qrCodeDataUrl={qrCodeDataUrl}
                    />
                  </div>
                );
              })}
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
                const isMoving = movingItemId === item.id;

                return (
                  <article
                    className={`review-card review-card--detail${isEditing ? " review-card--editing" : ""}${isMoving ? " review-card--moving" : ""}`}
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
                        <label
                          className="item-image-placeholder"
                          htmlFor={`item-upload-${item.id}`}
                          title="Foto hinzufügen"
                        >
                          <span className="material-symbols-outlined">imagesmode</span>
                          <strong>Kein Vorschaubild</strong>
                          <span>Foto hinzufügen</span>
                        </label>
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


                      {isMoving && availableMoveTargets.length > 0 ? (
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
                          <div className="move-panel__actions">
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
