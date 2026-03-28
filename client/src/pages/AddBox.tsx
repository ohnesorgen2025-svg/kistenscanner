import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Link } from "react-router-dom";

import {
  analyzeBoxImages,
  createBox,
  createItem,
  getBox,
  type AnalysisItem,
  type BoxRecord,
} from "../lib/api";

type ReviewItem = AnalysisItem & {
  detail: string;
};

const DEFAULT_MODEL_ID = "gemini-31-pro";

function createEmptyReviewItem(): ReviewItem {
  return {
    name: "",
    description: "",
    quantity: 1,
    sourceImageIndex: null,
    bbox: null,
    thumbnailPath: null,
    sourceImagePath: null,
    detail: "",
  };
}

function createReviewItems(items: AnalysisItem[]): ReviewItem[] {
  return items.map((item) => ({
    ...item,
    detail: "",
  }));
}

function buildQrValue(box: BoxRecord): string {
  return `kistenscanner://boxes/${box.id}`;
}

export function AddBoxPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [boxName, setBoxName] = useState("");
  const [location, setLocation] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedBox, setSavedBox] = useState<BoxRecord | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [files]);

  useEffect(() => {
    let isMounted = true;

    if (!savedBox) {
      setQrCodeDataUrl(null);
      return () => {
        isMounted = false;
      };
    }

    void QRCode.toDataURL(buildQrValue(savedBox), {
      color: { dark: "#0F0F0F", light: "#FFFFFF" },
      margin: 1,
      width: 256,
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
  }, [savedBox]);

  function appendFiles(nextFiles: FileList | null) {
    if (!nextFiles || nextFiles.length === 0) {
      return;
    }

    setFiles((current) => [...current, ...Array.from(nextFiles)]);
    setSavedBox(null);
    setError(null);
  }

  function updateReviewItem(index: number, patch: Partial<ReviewItem>) {
    setReviewItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  }

  function appendManualReviewItem() {
    setReviewItems((current) => [...current, createEmptyReviewItem()]);
    setError(null);
  }

  function removeReviewItem(index: number) {
    setReviewItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleAnalyze() {
    if (files.length === 0) {
      setError("Bitte zuerst mindestens ein Foto auswählen.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const items = await analyzeBoxImages(modelId, files);
      setReviewItems(items.length > 0 ? createReviewItems(items) : [createEmptyReviewItem()]);

      if (items.length === 0) {
        setError("Die Analyse hat keine Gegenstände erkannt. Bitte Review-Item manuell ergänzen oder weitere Fotos versuchen.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Analyse fehlgeschlagen.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!boxName.trim() || !location.trim()) {
      setError("Box-Name und Ort sind erforderlich.");
      return;
    }

    if (reviewItems.length === 0) {
      setError("Bitte zuerst Bilder analysieren und mindestens ein Item prüfen.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const imagePaths = Array.from(
        new Set(
          reviewItems
            .map((item) => item.sourceImagePath)
            .filter((value): value is string => typeof value === "string" && value.length > 0),
        ),
      );

      const box = await createBox({
        name: boxName,
        location,
        imagePaths,
      });

      await Promise.all(
        reviewItems.map((item) =>
          createItem(box.id, {
            name: item.name.trim() || "Untitled item",
            description: item.description,
            detail: item.detail,
            thumbnailPath: item.thumbnailPath,
          }),
        ),
      );

      const saved = await getBox(box.id);
      setSavedBox(saved);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Box konnte nicht gespeichert werden.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Store Workflow</p>
            <h1>Add Box</h1>
          </div>
        </div>

        <div className="step-grid">
          <article className={`step-card ${files.length > 0 ? "step-card--active" : ""}`}>
            <span className="step-number">01</span>
            <h2>Capture</h2>
            <p>Collect multiple photos of the box contents.</p>
          </article>
          <article className={`step-card ${reviewItems.length > 0 ? "step-card--active" : ""}`}>
            <span className="step-number">02</span>
            <h2>Review</h2>
            <p>Inspect AI suggestions and edit item details inline.</p>
          </article>
          <article className={`step-card ${savedBox ? "step-card--active" : ""}`}>
            <span className="step-number">03</span>
            <h2>Save</h2>
            <p>Create a numbered box and prepare the QR/label output.</p>
          </article>
        </div>
      </section>

      {error ? <div className="feedback feedback--error">{error}</div> : null}

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Step 1</p>
            <h2>Photo Capture</h2>
          </div>
          <div className="action-row">
            <label className="button button--ghost" htmlFor="capture-input">
              Open Camera
            </label>
            <label className="button button--ghost" htmlFor="upload-input">
              Upload Files
            </label>
          </div>
        </div>

        <input
          accept="image/*"
          capture="environment"
          className="sr-only"
          id="capture-input"
          multiple
          onChange={(event) => appendFiles(event.target.files)}
          type="file"
        />
        <input
          accept="image/*"
          className="sr-only"
          id="upload-input"
          multiple
          onChange={(event) => appendFiles(event.target.files)}
          type="file"
        />

        <div className="preview-grid">
          {previewUrls.map((url, index) => (
            <div className="preview-card" key={url}>
              <img alt={`Selected upload ${index + 1}`} src={url} />
              <span className="preview-card__label">Shot {index + 1}</span>
            </div>
          ))}
          {previewUrls.length === 0 ? (
            <div className="empty-dropzone">
              <span className="material-symbols-outlined">photo_camera</span>
              <p>No photos added yet.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Step 2</p>
            <h2>AI Analysis</h2>
          </div>
          <div className="field field--compact">
            <label htmlFor="model-select">Model</label>
            <select
              className="input"
              id="model-select"
              onChange={(event) => setModelId(event.target.value)}
              value={modelId}
            >
              <option value="gemini-31-pro">Gemini 3.1 Pro</option>
              <option value="claude-sonnet-4">Claude Sonnet 4.6</option>
              <option value="gpt-5">GPT-5.4</option>
            </select>
          </div>
        </div>

        <button
          className="button button--primary button--wide"
          disabled={files.length === 0 || isAnalyzing}
          onClick={() => void handleAnalyze()}
          type="button"
        >
          {isAnalyzing ? "Analyzing…" : "Start AI Analysis"}
        </button>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Step 3</p>
            <h2>Review Items</h2>
          </div>
          <button
            className="button button--ghost"
            onClick={appendManualReviewItem}
            type="button"
          >
            Add Item Manually
          </button>
        </div>

        <div className="review-list">
          {reviewItems.map((item, index) => (
            <article className="review-card" key={`${item.name}-${index}`}>
              <div className="review-card__media">
                {item.thumbnailPath ? (
                  <img alt={item.name} src={item.thumbnailPath} />
                ) : (
                  <div className="box-card__placeholder">
                    <span className="material-symbols-outlined">inventory_2</span>
                  </div>
                )}
              </div>
              <div className="review-card__content">
                <div className="field">
                  <label htmlFor={`item-name-${index}`}>Name</label>
                  <input
                    className="input"
                    id={`item-name-${index}`}
                    onChange={(event) => updateReviewItem(index, { name: event.target.value })}
                    value={item.name}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`item-description-${index}`}>Description</label>
                  <textarea
                    className="textarea"
                    id={`item-description-${index}`}
                    onChange={(event) =>
                      updateReviewItem(index, { description: event.target.value })
                    }
                    rows={2}
                    value={item.description}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`item-detail-${index}`}>Detail</label>
                  <textarea
                    className="textarea"
                    id={`item-detail-${index}`}
                    onChange={(event) => updateReviewItem(index, { detail: event.target.value })}
                    rows={2}
                    value={item.detail}
                  />
                </div>
                <div className="chip-row">
                  <span className="chip">Qty {item.quantity}</span>
                  {item.sourceImagePath ? <span className="chip chip--quiet">Source saved</span> : null}
                </div>
                <div className="action-row">
                  <button
                    className="button button--ghost"
                    onClick={() => removeReviewItem(index)}
                    type="button"
                  >
                    Remove Item
                  </button>
                </div>
              </div>
            </article>
          ))}

          {reviewItems.length === 0 ? (
            <div className="empty-state">
              <p className="section-kicker">Waiting for Analysis</p>
              <p>Detected items will appear here after the AI pass finishes.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Step 4</p>
            <h2>Save Box</h2>
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="box-name">Box Name</label>
            <input
              className="input"
              id="box-name"
              onChange={(event) => setBoxName(event.target.value)}
              placeholder="Workshop adapters"
              value={boxName}
            />
          </div>
          <div className="field">
            <label htmlFor="box-location">Location</label>
            <input
              className="input"
              id="box-location"
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Garage shelf 02"
              value={location}
            />
          </div>
        </div>

        <button
          className="button button--primary button--wide"
          disabled={reviewItems.length === 0 || isSaving}
          onClick={() => void handleSave()}
          type="button"
        >
          {isSaving ? "Saving…" : "Create Box and Save Items"}
        </button>
      </section>

      {savedBox ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="section-kicker">Step 5</p>
              <h2>Saved Box</h2>
            </div>
            <Link className="button button--ghost" to={`/boxes/${savedBox.id}`}>
              Open Detail
            </Link>
          </div>

          <div className="saved-box-grid">
            <div className="saved-box-copy">
              <h3>
                Box #{savedBox.number} · {savedBox.name}
              </h3>
              <p>{savedBox.location}</p>
              <div className="chip-row">
                <span className="chip">{savedBox.itemCount} items</span>
              </div>
              <div className="action-row">
                <button
                  className="button button--primary"
                  onClick={() => window.print()}
                  type="button"
                >
                  Print Label
                </button>
              </div>
            </div>

            <div className="qr-panel">
              {qrCodeDataUrl ? <img alt={`QR code for box ${savedBox.number}`} src={qrCodeDataUrl} /> : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
