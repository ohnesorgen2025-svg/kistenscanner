import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChangeEventHandler } from "react";
import { Link } from "react-router-dom";

import { buildBoxQrValue, generateQrSvgDataUrl } from "../lib/qr";

import {
  analyzeBoxImages,
  CONTAINER_TYPE_ICONS,
  CONTAINER_TYPE_LABELS,
  createBox,
  createItem,
  getBox,
  getSettings,
  listBoxes,
  listLocations,
  listModels,
  resolveAssetUrl,
  type AnalysisItem,
  type BoxRecord,
  type BoxSummary,
  type ContainerType,
  type ModelSummary,
} from "../lib/api";

type ReviewItem = AnalysisItem & {
  detail: string;
};

type TorchCapabilities = MediaTrackCapabilities & {
  torch?: boolean;
};

type TorchConstraintSet = MediaTrackConstraintSet & {
  torch?: boolean;
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

const DEMO_REVIEW_ITEMS: ReviewItem[] = [
  {
    name: "Tablet",
    description: "Schwarzes Tablet, ausgeschalteter Bildschirm. Vermutlich 10\" Display.",
    detail: "Modell unklar — auf der Rückseite nachsehen, ob iPad oder Android.",
    quantity: 1,
    sourceImageIndex: 0,
    bbox: null,
    thumbnailPath: "demo://tablet",
    sourceImagePath: null,
  },
  {
    name: "Smartphone",
    description: "Kleines schwarzes Handy mit klassischer Tastatur, eventuell ein Nokia.",
    detail: "Akkudeckel löst sich, Tape erwägen.",
    quantity: 1,
    sourceImageIndex: 0,
    bbox: null,
    thumbnailPath: "demo://smartphone",
    sourceImagePath: null,
  },
  {
    name: "Stifte-Set",
    description: "Mehrere Stifte und ein Füllfederhalter, gebündelt.",
    detail: "Tinte vermutlich eingetrocknet.",
    quantity: 4,
    sourceImageIndex: 0,
    bbox: null,
    thumbnailPath: "demo://stifte-set",
    sourceImagePath: null,
  },
  {
    name: "USB-Stick",
    description: "Grüner USB-Stick, ohne Beschriftung.",
    detail: "Inhalt unbekannt — vor Reuse prüfen.",
    quantity: 1,
    sourceImageIndex: 0,
    bbox: null,
    thumbnailPath: "demo://usb-stick",
    sourceImagePath: null,
  },
  {
    name: "Notizpapier",
    description: "Weißes Blatt mit handschriftlichem Text.",
    detail: "",
    quantity: 1,
    sourceImageIndex: 0,
    bbox: null,
    thumbnailPath: "demo://notizpapier",
    sourceImagePath: null,
  },
  {
    name: "Kabelbinder",
    description: "Bündel schwarzer Kabelbinder, ca. 20 cm.",
    detail: "",
    quantity: 12,
    sourceImageIndex: 0,
    bbox: null,
    thumbnailPath: "demo://kabelbinder",
    sourceImagePath: null,
  },
];

function getReviewImageUrl(item: ReviewItem): string | null {
  return resolveAssetUrl(item.thumbnailPath ?? item.sourceImagePath);
}

type AutoTextareaProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
};

function AutoTextarea({ value, onChange, placeholder, className, ...rest }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={className}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      value={value}
      {...rest}
    />
  );
}

export function AddBoxPage() {
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [boxName, setBoxName] = useState("");
  const [location, setLocation] = useState("");
  const [containerType, setContainerType] = useState<ContainerType>("box");
  const [parentId, setParentId] = useState<number | null>(null);
  const [allBoxes, setAllBoxes] = useState<BoxSummary[]>([]);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedBox, setSavedBox] = useState<BoxRecord | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchEnabled, setIsTorchEnabled] = useState(false);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.srcObject = cameraStream;

    if (cameraStream) {
      void videoRef.current.play().catch(() => undefined);
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        for (const track of cameraStream.getTracks()) {
          track.stop();
        }
      }
    };
  }, [cameraStream]);

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

    void Promise.all([listModels(), getSettings(), listBoxes(), listLocations()])
      .then(([loadedModels, settings, boxes, locations]) => {
        if (!isMounted) {
          return;
        }

        setModels(loadedModels);
        setAllBoxes(boxes);
        setAllLocations(locations);
        const activeModelId = settings.activeModelId;
        if (activeModelId && loadedModels.some((model) => model.id === activeModelId)) {
          setModelId(activeModelId);
          return;
        }

        if (loadedModels.length > 0) {
          setModelId(loadedModels[0].id);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!savedBox) {
      setQrCodeDataUrl(null);
      return () => {
        isMounted = false;
      };
    }

    void generateQrSvgDataUrl(buildBoxQrValue(savedBox.number))
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

  function appendFiles(nextFiles: FileList | File[] | null) {
    if (!nextFiles || nextFiles.length === 0) {
      return;
    }

    const normalizedFiles = Array.from(nextFiles);
    setFiles((current) => [...current, ...normalizedFiles]);
    setSavedBox(null);
    setError(null);
  }

  function stopCamera() {
    if (cameraStream) {
      for (const track of cameraStream.getTracks()) {
        track.stop();
      }
    }

    setCameraStream(null);
    setIsCameraActive(false);
    setIsTorchSupported(false);
    setIsTorchEnabled(false);
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      captureInputRef.current?.click();
      return;
    }

    try {
      setIsCameraStarting(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
        },
      });

      const [videoTrack] = stream.getVideoTracks();
      const capabilities = videoTrack?.getCapabilities() as TorchCapabilities | undefined;

      setCameraStream((current) => {
        if (current) {
          for (const track of current.getTracks()) {
            track.stop();
          }
        }

        return stream;
      });
      setIsCameraActive(true);
      setIsTorchSupported(Boolean(capabilities?.torch));
      setIsTorchEnabled(false);
    } catch {
      captureInputRef.current?.click();
    } finally {
      setIsCameraStarting(false);
    }
  }

  async function toggleTorch() {
    if (!cameraStream) {
      return;
    }

    const [videoTrack] = cameraStream.getVideoTracks();
    if (!videoTrack) {
      return;
    }

    try {
      const nextValue = !isTorchEnabled;
      await videoTrack.applyConstraints({
        advanced: [{ torch: nextValue } as TorchConstraintSet],
      });
      setIsTorchEnabled(nextValue);
    } catch {
      setError("Taschenlampe konnte nicht umgeschaltet werden.");
    }
  }

  async function capturePhotoFromCamera() {
    const video = videoRef.current;

    if (!video || !isCameraActive) {
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (width === 0 || height === 0) {
      setError("Kamera ist noch nicht bereit.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      setError("Foto konnte nicht erstellt werden.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      setError("Foto konnte nicht erstellt werden.");
      return;
    }

    const timestamp = Date.now();
    const file = new File([blob], `aufnahme-${timestamp}.jpg`, {
      type: "image/jpeg",
      lastModified: timestamp,
    });

    appendFiles([file]);
  }

  function updateReviewItem(index: number, patch: Partial<ReviewItem>) {
    setReviewItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  }

  const nextBoxNumber =
    allBoxes.length > 0 ? Math.max(...allBoxes.map((b) => b.number)) + 1 : 1;
  const parentBox = parentId ? allBoxes.find((b) => b.id === parentId) ?? null : null;

  const currentStage: 1 | 2 | 3 | 4 = savedBox
    ? 4
    : reviewItems.length > 0
    ? 3
    : previewUrls.length > 0
    ? 2
    : 1;

  const stages: Array<{ idx: 1 | 2 | 3 | 4; label: string; sub: string }> = [
    {
      idx: 1,
      label: "Bilder",
      sub: previewUrls.length
        ? `${previewUrls.length} ${previewUrls.length === 1 ? "Aufnahme" : "Aufnahmen"}`
        : "Fotos erfassen",
    },
    {
      idx: 2,
      label: "Items prüfen",
      sub: reviewItems.length
        ? `${reviewItems.length} ${reviewItems.length === 1 ? "Item" : "Items"}`
        : "KI-Analyse",
    },
    {
      idx: 3,
      label: "Behälter",
      sub: boxName.trim() || "Name & Standort",
    },
    {
      idx: 4,
      label: "Fertig",
      sub: savedBox ? `#${String(savedBox.number).padStart(3, "0")}` : "QR drucken",
    },
  ];

  function appendManualReviewItem() {
    setReviewItems((current) => [...current, createEmptyReviewItem()]);
    setError(null);
  }

  function loadDemoReviewItems() {
    setReviewItems(DEMO_REVIEW_ITEMS.map((item) => ({ ...item })));
    setBoxName((current) => current || "Demo-Box");
    setLocation((current) => current || "Demo-Regal");
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
        setError("Die Analyse hat keine Gegenstände erkannt. Bitte ein Item manuell ergänzen oder weitere Fotos versuchen.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Analyse fehlgeschlagen.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!boxName.trim() || !location.trim()) {
      setError("Name und Standort sind erforderlich.");
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
        containerType,
        parentId: parentId ?? undefined,
      });

      await Promise.all(
        reviewItems.map((item) =>
          createItem(box.id, {
            name: item.name.trim() || "Unbenanntes Item",
            description: item.description,
            detail: item.detail,
            thumbnailPath: item.thumbnailPath,
          }),
        ),
      );

      const saved = await getBox(box.id);
      setSavedBox(saved);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Kiste konnte nicht gespeichert werden.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="page-stack add-box-screen add-box-page">
      <header className="screen-header">
        <p className="screen-kicker">Neu</p>
        <h1 className="screen-title">Hinzufügen</h1>
      </header>

      {error ? <div className="feedback feedback--error">{error}</div> : null}

      <div className="add-box-layout">
        <aside className="add-box-rail" aria-label="Workflow">
          <ol className="stage-rail">
            {stages.map((stage) => {
              const status =
                stage.idx < currentStage
                  ? "done"
                  : stage.idx === currentStage
                  ? "active"
                  : "todo";
              return (
                <li
                  className={`stage-rail__step stage-rail__step--${status}`}
                  key={stage.idx}
                >
                  <span className="stage-rail__dot" aria-hidden>
                    {status === "done" ? (
                      <span className="material-symbols-outlined">check</span>
                    ) : (
                      stage.idx
                    )}
                  </span>
                  <span className="stage-rail__body">
                    <span className="stage-rail__label">{stage.label}</span>
                    <span className="stage-rail__sub">{stage.sub}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="add-box-flow">
          {savedBox ? (
            <section className="panel saved-hero">
              <div className="saved-hero__check" aria-hidden>
                <span className="material-symbols-outlined">check</span>
              </div>
              <p className="saved-hero__kicker">
                #{String(savedBox.number).padStart(3, "0")}
              </p>
              <h2 className="saved-hero__title">{savedBox.name}</h2>
              <p className="saved-hero__sub">
                {CONTAINER_TYPE_LABELS[savedBox.containerType] ?? "Kiste"}
                {" · "}
                {savedBox.itemCount} {savedBox.itemCount === 1 ? "Item" : "Items"}
                {" · "}
                {savedBox.location || "—"}
              </p>

              <div className="saved-hero__qr">
                {qrCodeDataUrl ? (
                  <img
                    alt={`QR-Code für Kiste ${savedBox.number}`}
                    src={qrCodeDataUrl}
                  />
                ) : (
                  <div className="saved-hero__qr-skeleton" aria-hidden>
                    <span className="material-symbols-outlined">qr_code_2</span>
                  </div>
                )}
                <span className="saved-hero__qr-caption">
                  #{String(savedBox.number).padStart(3, "0")} · {savedBox.name}
                </span>
              </div>

              <div className="saved-hero__actions">
                <button
                  className="button button--primary"
                  onClick={() => window.print()}
                  type="button"
                >
                  <span className="material-symbols-outlined">print</span>
                  Etikett drucken
                </button>
                <Link className="button button--ghost" to={`/boxes/${savedBox.id}`}>
                  <span className="material-symbols-outlined">visibility</span>
                  Details
                </Link>
                <button
                  className="button button--ghost"
                  onClick={() => {
                    setFiles([]);
                    setPreviewUrls([]);
                    setReviewItems([]);
                    setBoxName("");
                    setSavedBox(null);
                    setQrCodeDataUrl(null);
                    setError(null);
                    void listBoxes().then(setAllBoxes).catch(() => undefined);
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined">replay</span>
                  Nächsten Behälter
                </button>
              </div>
            </section>
          ) : (
            <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Fotos erfassen</h2>
          </div>
          <div className="action-row add-box-photo-actions">
            <button
              className="button button--ghost"
              disabled={isCameraStarting}
              onClick={() => void startCamera()}
              type="button"
            >
              {isCameraStarting ? "Kamera startet…" : isCameraActive ? "Kamera aktiv" : "Kamera öffnen"}
            </button>
            <label className="button button--ghost" htmlFor="upload-input">
              Dateien hochladen
            </label>
          </div>
        </div>

        <input
          accept="image/*"
          capture="environment"
          className="sr-only"
          id="capture-input"
          ref={captureInputRef}
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

        {isCameraActive ? (
          <div className="camera-panel">
            <div className="camera-preview">
              <video
                autoPlay
                className="camera-preview__video"
                muted
                playsInline
                ref={videoRef}
              />
            </div>
            <div className="action-row action-row--wrap">
              <button
                className="button button--primary"
                onClick={() => void capturePhotoFromCamera()}
                type="button"
              >
                Foto aufnehmen
              </button>
              {isTorchSupported ? (
                <button
                  className="button button--ghost"
                  onClick={() => void toggleTorch()}
                  type="button"
                >
                  <span className="material-symbols-outlined">
                    {isTorchEnabled ? "flashlight_off" : "flashlight_on"}
                  </span>
                  {isTorchEnabled ? "Licht aus" : "Licht an"}
                </button>
              ) : null}
              <button className="button button--ghost" onClick={stopCamera} type="button">
                Kamera schließen
              </button>
            </div>
          </div>
        ) : null}

        <div className="preview-grid">
          {previewUrls.map((url, index) => (
            <div className="preview-card" key={url}>
              <img alt={`Ausgewählter Upload ${index + 1}`} src={url} />
              <span className="preview-card__label">Aufnahme {index + 1}</span>
            </div>
          ))}
          {previewUrls.length === 0 ? (
            <div className="empty-dropzone">
              <span className="material-symbols-outlined">photo_camera</span>
              <p>Noch keine Fotos hinzugefügt.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>KI-Analyse</h2>
          </div>
          <div className="field field--compact">
            <label htmlFor="model-select">Modell</label>
            <select
              className="input"
              id="model-select"
              onChange={(event) => setModelId(event.target.value)}
              value={modelId}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="button button--primary button--wide"
          disabled={files.length === 0 || isAnalyzing}
          onClick={() => void handleAnalyze()}
          type="button"
        >
          {isAnalyzing ? "Analysiere…" : "KI-Analyse starten"}
        </button>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Items prüfen</h2>
          </div>
          <button
            className="button button--ghost"
            onClick={appendManualReviewItem}
            type="button"
          >
            Item manuell hinzufügen
          </button>
          {import.meta.env.DEV ? (
            <button
              className="button button--ghost"
              onClick={loadDemoReviewItems}
              type="button"
              title="Nur im Dev-Modus sichtbar"
            >
              Demo-Items laden
            </button>
          ) : null}
        </div>

        <div className="review-list">
          {reviewItems.map((item, index) => {
            const isDemo = item.thumbnailPath?.startsWith("demo://") ?? false;
            const thumb = getReviewImageUrl(item);
            return (
              <article className="review-row" key={`${item.name}-${index}`}>
                <div
                  className={`review-row__media${isDemo ? " review-row__media--demo" : ""}`}
                >
                  {thumb ? (
                    <img alt={item.name || `Item ${index + 1}`} src={thumb} />
                  ) : (
                    <div className="review-row__placeholder" aria-hidden>
                      <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                  )}
                </div>
                <div className="review-row__body">
                  <input
                    aria-label="Name"
                    className="review-row__name"
                    onChange={(event) => updateReviewItem(index, { name: event.target.value })}
                    placeholder="Name"
                    value={item.name}
                  />
                  <AutoTextarea
                    aria-label="Beschreibung"
                    className="review-row__desc"
                    onChange={(event) =>
                      updateReviewItem(index, { description: event.target.value })
                    }
                    placeholder="Beschreibung"
                    value={item.description}
                  />
                  <AutoTextarea
                    aria-label="Details"
                    className="review-row__detail"
                    onChange={(event) => updateReviewItem(index, { detail: event.target.value })}
                    placeholder="Details (intern)"
                    value={item.detail}
                  />
                </div>
                <div className="review-row__aside">
                  <div className="review-row__qty">
                    <button
                      aria-label="Menge verringern"
                      className="review-row__qty-btn"
                      disabled={item.quantity <= 1}
                      onClick={() =>
                        updateReviewItem(index, { quantity: Math.max(1, item.quantity - 1) })
                      }
                      type="button"
                    >
                      −
                    </button>
                    <span className="review-row__qty-value">{item.quantity}</span>
                    <button
                      aria-label="Menge erhöhen"
                      className="review-row__qty-btn"
                      onClick={() => updateReviewItem(index, { quantity: item.quantity + 1 })}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                  <button
                    aria-label="Item entfernen"
                    className="review-row__remove"
                    onClick={() => removeReviewItem(index)}
                    title="Item entfernen"
                    type="button"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </article>
            );
          })}

          {reviewItems.length === 0 ? (
            <div className="empty-state">
              <p className="section-kicker">Warte auf Analyse</p>
              <p>Erkannte Items erscheinen hier nach dem Abschluss der KI-Analyse.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel add-box-save-panel">
        <div className="panel-header">
          <div>
            <h2>Behälter speichern</h2>
          </div>
        </div>

        <div className="save-panel">
          <div className="save-panel__form">
            <div className="field">
              <label htmlFor="box-name">Name</label>
              <input
                className="input"
                id="box-name"
                onChange={(event) => setBoxName(event.target.value)}
                placeholder="Werkstatt-Adapter"
                value={boxName}
              />
            </div>

            <div className="field">
              <label htmlFor="box-location">Standort</label>
              {allLocations.length > 0 ? (
                <div className="save-panel__location-chips">
                  {allLocations.slice(0, 8).map((loc) => (
                    <button
                      className={`chip chip--clickable${
                        location === loc ? " chip--active" : ""
                      }`}
                      key={loc}
                      onClick={() => setLocation(loc)}
                      type="button"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              ) : null}
              <input
                autoComplete="off"
                className="input"
                id="box-location"
                list="location-suggestions"
                onChange={(event) => setLocation(event.target.value)}
                placeholder="z. B. Garagenregal 02"
                value={location}
              />
              <datalist id="location-suggestions">
                {allLocations.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            <div className="field">
              <label htmlFor="container-type">Was ist es?</label>
              <select
                className="input"
                id="container-type"
                onChange={(event) => setContainerType(event.target.value as ContainerType)}
                value={containerType}
              >
                {(Object.entries(CONTAINER_TYPE_LABELS) as [ContainerType, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>

            {containerType !== "room" && allBoxes.length > 0 ? (
              <details className="save-panel__advanced">
                <summary>Liegt in einem anderen Behälter? (optional)</summary>
                <div className="field" style={{ marginTop: "0.6rem" }}>
                  <label htmlFor="parent-container" className="visually-hidden">
                    Übergeordneter Behälter
                  </label>
                  <select
                    className="input"
                    id="parent-container"
                    onChange={(event) => {
                      const v = Number(event.target.value);
                      setParentId(v > 0 ? v : null);
                    }}
                    value={parentId ?? ""}
                  >
                    <option value="">– Eigenständig –</option>
                    {allBoxes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {CONTAINER_TYPE_LABELS[b.containerType] ?? "Kiste"} #{b.number} · {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </details>
            ) : null}
          </div>

          <aside className="save-panel__preview" aria-label="Vorschau">
            <div className="save-panel__preview-card">
              <div className="save-panel__preview-thumb">
                <span className="material-symbols-outlined">
                  {CONTAINER_TYPE_ICONS[containerType] ?? "inventory_2"}
                </span>
              </div>
              <div className="save-panel__preview-num">
                #{String(nextBoxNumber).padStart(3, "0")}
              </div>
              <h3 className="save-panel__preview-title">
                {boxName || "Neuer Behälter"}
              </h3>
              <div className="save-panel__preview-meta">
                <span className="material-symbols-outlined">location_on</span>
                <span>{location || "Standort wählen"}</span>
              </div>
              <div className="save-panel__preview-meta">
                <span className="material-symbols-outlined">category</span>
                <span>{CONTAINER_TYPE_LABELS[containerType] ?? "Kiste"}</span>
              </div>
              {parentBox ? (
                <div className="save-panel__preview-meta save-panel__preview-meta--muted">
                  <span className="material-symbols-outlined">subdirectory_arrow_right</span>
                  <span>
                    in {CONTAINER_TYPE_LABELS[parentBox.containerType] ?? "Kiste"} #
                    {parentBox.number}
                  </span>
                </div>
              ) : null}
              <div className="save-panel__preview-footer">
                <span className="chip">
                  {reviewItems.length} {reviewItems.length === 1 ? "Item" : "Items"}
                </span>
              </div>
            </div>
            {!boxName || !location ? (
              <p className="save-panel__hint">
                Sobald Name und Standort gesetzt sind, kannst du speichern.
              </p>
            ) : (
              <p className="save-panel__hint save-panel__hint--ok">
                Bereit: {reviewItems.length}{" "}
                {reviewItems.length === 1 ? "Item wird" : "Items werden"} in #
                {String(nextBoxNumber).padStart(3, "0")} angelegt.
              </p>
            )}
          </aside>
        </div>

        <button
          className="button button--primary button--wide"
          disabled={reviewItems.length === 0 || isSaving || !boxName || !location}
          onClick={() => void handleSave()}
          type="button"
        >
          {isSaving ? "Speichere…" : "Behälter anlegen und Items speichern"}
        </button>
      </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
