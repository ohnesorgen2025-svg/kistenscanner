import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Link, useParams } from "react-router-dom";

import {
  analyzeItemImages,
  CONTAINER_TYPE_ICONS,
  CONTAINER_TYPE_LABELS,
  deleteItem,
  getItem,
  getLoansForItem,
  getSettings,
  listModels,
  resolveAssetUrl,
  setItemImageAsTitle,
  updateItem,
  uploadItemImage,
  type ContainerType,
  type ItemWithBox,
  type LoanRecord,
  type ModelSummary,
  type PathSegment,
} from "../lib/api";
import { PageHeader } from "../components/PageHeader";

function buildItemQrValue(itemId: number): string {
  return `kistenscanner://item/${itemId}`;
}

export function ItemDetailPage() {
  const params = useParams();
  const itemId = Number(params.id);

  const [item, setItem] = useState<ItemWithBox | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  // Editing
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftDetail, setDraftDetail] = useState("");

  // AI Analysis
  const [analysisFiles, setAnalysisFiles] = useState<File[]>([]);
  const [analysisPreviewUrls, setAnalysisPreviewUrls] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false);

  // Loans
  const [loans, setLoans] = useState<LoanRecord[]>([]);

  const confirmationTimeoutRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function showConfirmation(message: string) {
    setConfirmation(message);
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
    }
    confirmationTimeoutRef.current = window.setTimeout(() => setConfirmation(null), 3000);
  }

  async function loadItem() {
    try {
      const loaded = await getItem(itemId);
      setItem(loaded);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Item konnte nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isInteger(itemId) || itemId <= 0) {
      setError("Ungültige Item-ID.");
      setIsLoading(false);
      return;
    }

    void loadItem();

    void getLoansForItem(itemId).then(setLoans).catch(() => undefined);

    void Promise.all([listModels(), getSettings()]).then(([loadedModels, settings]) => {
      setModels(loadedModels);
      setSelectedModelId(settings.activeModelId || (loadedModels[0]?.id ?? ""));
    }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  // QR code
  useEffect(() => {
    if (!item) {
      setQrCodeDataUrl(null);
      return;
    }

    void QRCode.toDataURL(buildItemQrValue(item.id), {
      color: { dark: "black", light: "white" },
      margin: 1,
      width: 180,
    })
      .then(setQrCodeDataUrl)
      .catch(() => setQrCodeDataUrl(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  // Analysis preview URLs
  useEffect(() => {
    const urls = analysisFiles.map((file) => URL.createObjectURL(file));
    setAnalysisPreviewUrls(urls);
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [analysisFiles]);

  function beginEdit() {
    if (!item) return;
    setDraftName(item.name);
    setDraftDescription(item.description ?? "");
    setDraftDetail(item.detail ?? "");
    setIsEditing(true);
  }

  async function saveEdit() {
    if (!item) return;
    try {
      await updateItem(item.id, {
        name: draftName.trim() || item.name,
        description: draftDescription.trim(),
        detail: draftDetail.trim(),
      });
      setIsEditing(false);
      await loadItem();
      showConfirmation("Änderungen gespeichert.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Speichern fehlgeschlagen.");
    }
  }

  async function handleImageUpload(file: File | null) {
    if (!file || !item) return;
    try {
      await uploadItemImage(item.id, file);
      await loadItem();
      showConfirmation("Bild hinzugefügt.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Bild-Upload fehlgeschlagen.");
    }
  }

  async function handleSetTitleImage(imageId: number) {
    try {
      await setItemImageAsTitle(imageId);
      await loadItem();
      showConfirmation("Titelbild gesetzt.");
    } catch (titleError) {
      setError(titleError instanceof Error ? titleError.message : "Titelbild setzen fehlgeschlagen.");
    }
  }

  async function handleAnalyze() {
    if (!item || analysisFiles.length === 0 || !selectedModelId) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      await analyzeItemImages(item.id, selectedModelId, analysisFiles);
      setAnalysisFiles([]);
      setIsAnalysisPanelOpen(false);
      await loadItem();
      showConfirmation("Item mit KI-Analyse aktualisiert.");
    } catch (analyzeError) {
      setError(analyzeError instanceof Error ? analyzeError.message : "KI-Analyse fehlgeschlagen.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    const confirmed = window.confirm(`"${item.name}" wirklich löschen?`);
    if (!confirmed) return;
    try {
      await deleteItem(item.id);
      window.history.back();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Löschen fehlgeschlagen.");
    }
  }

  const activeLoans = loans.filter((l) => !l.returnedDate);

  return (
    <div className="page-stack">
      {isLoading ? <div className="feedback">Item wird geladen…</div> : null}
      {confirmation ? <div className="feedback">{confirmation}</div> : null}
      {error ? <div className="feedback feedback--error">{error}</div> : null}

      {item ? (
        <>
          {/* Breadcrumb path */}
          <nav className="breadcrumb-path" aria-label="Pfad">
            {item.path.map((seg: PathSegment, idx: number) => (
              <span key={seg.id} className="breadcrumb-path__segment">
                {idx > 0 ? <span className="breadcrumb-path__separator"> › </span> : null}
                <Link to={`/boxes/${seg.id}`} className="breadcrumb-path__link">
                  <span className="material-symbols-outlined breadcrumb-path__icon">{CONTAINER_TYPE_ICONS[seg.containerType] || "inventory_2"}</span>
                  {seg.name}
                </Link>
              </span>
            ))}
            <span className="breadcrumb-path__segment">
              <span className="breadcrumb-path__separator"> › </span>
              <span className="breadcrumb-path__link breadcrumb-path__link--current">
                <span className="material-symbols-outlined breadcrumb-path__icon">category</span>
                {item.name}
              </span>
            </span>
          </nav>

          <PageHeader title={item.name} />

          {/* Header section */}
          <section className="panel item-detail-header">
            <div className="item-detail-header__top">
              <div className="item-detail-header__image">
                {resolveAssetUrl(item.thumbnailPath ?? item.images[0]?.path ?? null) ? (
                  <img
                    alt={item.name}
                    src={resolveAssetUrl(item.thumbnailPath ?? item.images[0]?.path ?? null) ?? undefined}
                  />
                ) : (
                  <div className="item-detail-header__no-image">
                    <span className="material-symbols-outlined">imagesmode</span>
                  </div>
                )}
              </div>

              <div className="item-detail-header__info">
                <div className="item-detail-header__facts">
                  <div className="item-detail-header__fact">
                    <span className="item-detail-header__fact-label">{CONTAINER_TYPE_LABELS[item.box.containerType as ContainerType] ?? "Kiste"}</span>
                    <Link to={`/boxes/${item.box.id}`} className="item-detail-header__fact-value">
                      #{item.box.number} · {item.box.name}
                    </Link>
                  </div>
                  <div className="item-detail-header__fact">
                    <span className="item-detail-header__fact-label">Standort</span>
                    <strong className="item-detail-header__fact-value">{item.box.location}</strong>
                  </div>
                  <div className="item-detail-header__fact">
                    <span className="item-detail-header__fact-label">Menge</span>
                    <strong className="item-detail-header__fact-value">{item.quantity}{item.quantityUnit ? ` ${item.quantityUnit}` : ""}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="item-detail-toolbar" role="toolbar" aria-label="Item-Aktionen">
              <button className="button button--ghost" onClick={beginEdit} type="button" title="Bearbeiten">
                <span className="material-symbols-outlined">edit</span>
                Bearbeiten
              </button>
              <label className="button button--ghost" title="Foto hinzufügen">
                <span className="material-symbols-outlined">add_photo_alternate</span>
                Foto
                <input
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => void handleImageUpload(event.target.files?.[0] ?? null)}
                  ref={fileInputRef}
                  type="file"
                />
              </label>
              <button
                className="button button--ghost"
                onClick={() => setIsAnalysisPanelOpen(!isAnalysisPanelOpen)}
                type="button"
                title="KI-Analyse"
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                KI-Analyse
              </button>
              <button
                className="button button--ghost item-detail-toolbar__action--danger"
                onClick={() => void handleDelete()}
                type="button"
                title="Löschen"
              >
                <span className="material-symbols-outlined">delete</span>
                Löschen
              </button>
            </div>
          </section>

          {/* Edit form */}
          {isEditing ? (
            <section className="panel">
              <div className="panel-header">
                <h2>Bearbeiten</h2>
              </div>
              <div className="panel-body form-stack">
                <div className="field">
                  <label htmlFor="edit-item-name">Name</label>
                  <input className="input" id="edit-item-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="edit-item-desc">Beschreibung</label>
                  <textarea className="textarea" id="edit-item-desc" rows={2} value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="edit-item-detail">Details</label>
                  <textarea className="textarea" id="edit-item-detail" rows={4} value={draftDetail} onChange={(e) => setDraftDetail(e.target.value)} />
                </div>
                <div className="action-row">
                  <button className="button button--primary" onClick={() => void saveEdit()} type="button">
                    <span className="material-symbols-outlined">save</span>
                    Speichern
                  </button>
                  <button className="button button--ghost" onClick={() => setIsEditing(false)} type="button">
                    Abbrechen
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {/* AI Analysis panel */}
          {isAnalysisPanelOpen ? (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">KI-Analyse</p>
                  <h2>Detailfotos analysieren</h2>
                </div>
                <button className="button button--ghost" onClick={() => { setIsAnalysisPanelOpen(false); setAnalysisFiles([]); }} type="button">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="panel-body form-stack">
                <p className="hint-text">Mache Detailfotos (z.B. Typenschild, technische Daten) und die KI ergänzt automatisch die Informationen.</p>

                <div className="field">
                  <label htmlFor="analysis-model">KI-Modell</label>
                  <select
                    className="input"
                    id="analysis-model"
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    value={selectedModelId}
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="capture-actions">
                  <label className="button button--primary">
                    <span className="material-symbols-outlined">add_a_photo</span>
                    Foto aufnehmen
                    <input
                      accept="image/*"
                      capture="environment"
                      className="sr-only"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setAnalysisFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                        }
                      }}
                      type="file"
                    />
                  </label>
                  <label className="button button--secondary">
                    <span className="material-symbols-outlined">image</span>
                    Bilder auswählen
                    <input
                      accept="image/*"
                      className="sr-only"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setAnalysisFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                        }
                      }}
                      type="file"
                    />
                  </label>
                </div>

                {analysisPreviewUrls.length > 0 ? (
                  <div className="analysis-preview-grid">
                    {analysisPreviewUrls.map((url, index) => (
                      <div key={url} className="analysis-preview-item">
                        <img alt={`Vorschau ${index + 1}`} src={url} />
                        <button
                          className="analysis-preview-remove"
                          onClick={() => setAnalysisFiles((prev) => prev.filter((_, i) => i !== index))}
                          type="button"
                          title="Entfernen"
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {analysisFiles.length > 0 ? (
                  <button
                    className="button button--primary"
                    disabled={isAnalyzing || !selectedModelId}
                    onClick={() => void handleAnalyze()}
                    type="button"
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="material-symbols-outlined spin">progress_activity</span>
                        Wird analysiert…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">auto_awesome</span>
                        {analysisFiles.length} Foto{analysisFiles.length > 1 ? "s" : ""} analysieren
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Description & Details */}
          {!isEditing && (item.description || item.detail) ? (
            <section className="panel">
              <div className="panel-header">
                <h2>Informationen</h2>
              </div>
              <div className="panel-body">
                {item.description ? (
                  <div className="item-info-block">
                    <p className="section-kicker">Beschreibung</p>
                    <p>{item.description}</p>
                  </div>
                ) : null}
                {item.detail ? (
                  <div className="item-info-block">
                    <p className="section-kicker">Details</p>
                    <p className="item-detail-text">{item.detail}</p>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Active loans */}
          {activeLoans.length > 0 ? (
            <section className="panel">
              <div className="panel-header">
                <h2>Verliehen</h2>
              </div>
              <div className="panel-body">
                <div className="chip-row">
                  {activeLoans.map((loan) => (
                    <span key={loan.id} className="chip chip--loan">
                      <span className="material-symbols-outlined">person</span>
                      {loan.borrowerName}
                      {loan.dueDate ? ` · bis ${loan.dueDate}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {/* Image gallery */}
          {item.images.length > 0 ? (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Fotos</p>
                  <h2>{item.images.length} Bild{item.images.length > 1 ? "er" : ""}</h2>
                </div>
                <label className="button button--ghost" title="Foto hinzufügen">
                  <span className="material-symbols-outlined">add_photo_alternate</span>
                  Hinzufügen
                  <input
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => void handleImageUpload(e.target.files?.[0] ?? null)}
                    type="file"
                  />
                </label>
              </div>
              <div className="item-image-gallery">
                {item.images.map((img) => (
                  <div key={img.id} className={`item-image-gallery__item${img.isTitle ? " item-image-gallery__item--title" : ""}`}>
                    <img alt="Item-Bild" src={resolveAssetUrl(img.path) ?? undefined} />
                    {!img.isTitle ? (
                      <button
                        className="item-image-gallery__title-btn"
                        onClick={() => void handleSetTitleImage(img.id)}
                        title="Als Titelbild setzen"
                        type="button"
                      >
                        <span className="material-symbols-outlined">star</span>
                      </button>
                    ) : (
                      <span className="item-image-gallery__title-badge" title="Titelbild">
                        <span className="material-symbols-outlined">star</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* QR Code */}
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">QR-Code</p>
                <h2>Item-QR-Code</h2>
              </div>
            </div>
            <div className="panel-body item-qr-section">
              {qrCodeDataUrl ? (
                <div className="item-qr-code">
                  <img alt={`QR-Code für ${item.name}`} src={qrCodeDataUrl} />
                </div>
              ) : null}
              <p className="hint-text">Scanne diesen QR-Code, um direkt zu diesem Item zu gelangen.</p>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
