import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { buildItemQrValue, generateQrSvgDataUrl } from "../lib/qr";

import {
  analyzeItemImages,
  CONTAINER_TYPE_ICONS,
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

  // UI state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);

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

    void generateQrSvgDataUrl(buildItemQrValue(item.id))
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
  const galleryImages = item?.images ?? [];
  const safeActiveIndex = galleryImages.length > 0
    ? Math.min(activeImageIndex, galleryImages.length - 1)
    : 0;
  const activeImage = galleryImages[safeActiveIndex] ?? null;
  const heroImageSrc = activeImage
    ? resolveAssetUrl(activeImage.path)
    : resolveAssetUrl(item?.thumbnailPath ?? null);

  return (
    <div className="page-stack item-detail-page">
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

          {/* Active loan banner */}
          {activeLoans.length > 0 ? (
            <div className="item-loan-banner" role="status">
              <span className="material-symbols-outlined">person</span>
              <div className="item-loan-banner__copy">
                <strong>Verliehen</strong>
                <span>
                  {activeLoans.map((loan, idx) => (
                    <span key={loan.id}>
                      {idx > 0 ? ", " : ""}
                      {loan.borrowerName}
                      {loan.dueDate ? ` (bis ${loan.dueDate})` : ""}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          ) : null}

          {/* Hero */}
          <section className="item-hero" aria-label="Item-Übersicht">
            <div className="item-hero__cover">
              {heroImageSrc ? (
                <img alt={item.name} src={heroImageSrc} />
              ) : (
                <div className="item-hero__cover-placeholder">
                  <span className="material-symbols-outlined">imagesmode</span>
                </div>
              )}
              {activeImage && !activeImage.isTitle ? (
                <button
                  className="item-hero__star"
                  onClick={() => void handleSetTitleImage(activeImage.id)}
                  type="button"
                  title="Als Titelbild setzen"
                  aria-label="Als Titelbild setzen"
                >
                  <span className="material-symbols-outlined">star</span>
                </button>
              ) : activeImage ? (
                <span
                  className="item-hero__star item-hero__star--active"
                  title="Titelbild"
                  aria-label="Titelbild"
                >
                  <span className="material-symbols-outlined">star</span>
                </span>
              ) : null}
              <label className="item-hero__add" title="Foto hinzufügen">
                <span className="material-symbols-outlined">add_a_photo</span>
                <span className="sr-only">Foto hinzufügen</span>
                <input
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file) {
                      const newIndex = galleryImages.length;
                      void handleImageUpload(file).then(() => setActiveImageIndex(newIndex));
                    }
                    event.target.value = "";
                  }}
                  ref={fileInputRef}
                  type="file"
                />
              </label>
            </div>

            {galleryImages.length > 1 ? (
              <div className="item-hero__thumbs" role="tablist" aria-label="Weitere Fotos">
                {galleryImages.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    role="tab"
                    aria-selected={idx === safeActiveIndex}
                    className={
                      "item-hero__thumb"
                      + (idx === safeActiveIndex ? " item-hero__thumb--active" : "")
                      + (img.isTitle ? " item-hero__thumb--title" : "")
                    }
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <img alt="" src={resolveAssetUrl(img.path) ?? undefined} />
                    {img.isTitle ? (
                      <span className="item-hero__thumb-star material-symbols-outlined" aria-hidden="true">star</span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="item-hero__head">
              <h1 className="item-hero__title">{item.name}</h1>
              <p className="item-hero__meta">
                <Link to={`/boxes/${item.box.id}`} className="item-hero__meta-link">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {CONTAINER_TYPE_ICONS[item.box.containerType as ContainerType] ?? "inventory_2"}
                  </span>
                  #{item.box.number} · {item.box.name}
                </Link>
                <span className="item-hero__meta-sep" aria-hidden="true">·</span>
                <span className="item-hero__meta-chunk">
                  <span className="material-symbols-outlined" aria-hidden="true">location_on</span>
                  {item.box.location}
                </span>
                <span className="item-hero__meta-sep" aria-hidden="true">·</span>
                <span className="item-hero__meta-chunk">
                  <span className="material-symbols-outlined" aria-hidden="true">inventory</span>
                  {item.quantity}{item.quantityUnit ? ` ${item.quantityUnit}` : " Stück"}
                </span>
              </p>
            </div>

            <div className="item-hero__actions" role="toolbar" aria-label="Item-Aktionen">
              <button className="button button--primary" onClick={beginEdit} type="button">
                <span className="material-symbols-outlined">edit</span>
                Bearbeiten
              </button>
              <div className="item-hero__overflow">
                <button
                  className="button button--primary item-hero__overflow-trigger"
                  onClick={() => setIsActionsMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={isActionsMenuOpen}
                  aria-label="Weitere Aktionen"
                  type="button"
                >
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
                {isActionsMenuOpen ? (
                  <>
                    <button
                      aria-label="Menü schließen"
                      className="item-context__backdrop"
                      onClick={() => setIsActionsMenuOpen(false)}
                      type="button"
                    />
                    <div className="context-menu open" role="menu">
                      <button
                        className="ctx-item"
                        onClick={() => { setIsActionsMenuOpen(false); setIsAnalysisPanelOpen(true); }}
                        role="menuitem"
                        type="button"
                      >
                        <span className="material-symbols-outlined">auto_awesome</span>
                        <span>KI-Analyse</span>
                      </button>
                      <button
                        className="ctx-item ctx-item--danger"
                        onClick={() => { setIsActionsMenuOpen(false); void handleDelete(); }}
                        role="menuitem"
                        type="button"
                      >
                        <span className="material-symbols-outlined">delete</span>
                        <span>Löschen</span>
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
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
            <section className="item-info">
              {item.description ? (
                <div className="item-info__block">
                  <h2 className="item-info__heading">Beschreibung</h2>
                  <p className="item-info__text">{item.description}</p>
                </div>
              ) : null}
              {item.detail ? (
                <div className="item-info__block">
                  <h2 className="item-info__heading">Details</h2>
                  <p className="item-info__text item-info__text--detail">{item.detail}</p>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* QR Code (collapsible) */}
          <section className="item-qr">
            <button
              type="button"
              className="item-qr__toggle"
              onClick={() => setIsQrOpen((v) => !v)}
              aria-expanded={isQrOpen}
              aria-controls="item-qr-panel"
            >
              <span className="material-symbols-outlined">qr_code_2</span>
              <span>QR-Code{isQrOpen ? " ausblenden" : " anzeigen"}</span>
              <span className="material-symbols-outlined item-qr__chevron">
                {isQrOpen ? "expand_less" : "expand_more"}
              </span>
            </button>
            {isQrOpen ? (
              <div className="item-qr__panel" id="item-qr-panel">
                {qrCodeDataUrl ? (
                  <div className="item-qr__code">
                    <img alt={`QR-Code für ${item.name}`} src={qrCodeDataUrl} />
                  </div>
                ) : null}
                <p className="item-qr__hint">Scanne diesen Code, um direkt zu diesem Item zu gelangen.</p>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
