import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { buildBoxQrValue, generateQrSvgDataUrl } from "../lib/qr";

import {
  batchDeleteItems,
  batchMoveItems,
  CONTAINER_TYPE_ICONS,
  CONTAINER_TYPE_LABELS,
  createItem,
  createLoan,
  deleteBox,
  deleteItem,
  getBox,
  getLoansForItem,
  getSettings,
  listBoxes,
  listLocations,
  listModels,
  moveItem,
  rescanBox,
  resolveAssetUrl,
  returnLoan,
  updateBox,
  updateItemQuantity,
  type BoxRecord,
  type BoxSummary,
  type ContainerType,
  type ItemRecord,
  type LoanRecord,
  type ModelSummary,
  type RescanResult,
  updateItem,
  uploadItemImage,
} from "../lib/api";

type ItemDraft = {
  name: string;
  description: string;
  detail: string;
};

function getItemImageUrl(item: ItemRecord): string | null {
  return resolveAssetUrl(item.thumbnailPath ?? item.images[0]?.path ?? null);
}

export function BoxDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
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
  const [isRescanOpen, setIsRescanOpen] = useState(false);
  const [rescanFiles, setRescanFiles] = useState<File[]>([]);
  const [rescanPreviewUrls, setRescanPreviewUrls] = useState<string[]>([]);
  const [isRescanAnalyzing, setIsRescanAnalyzing] = useState(false);
  const [rescanResult, setRescanResult] = useState<RescanResult | null>(null);
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [rescanModelId, setRescanModelId] = useState("");
  const confirmationTimeoutRef = useRef<number | null>(null);
  const [lendingItemId, setLendingItemId] = useState<number | null>(null);
  const [lendingBorrower, setLendingBorrower] = useState("");
  const [lendingDueDate, setLendingDueDate] = useState("");
  const [lendingNotes, setLendingNotes] = useState("");
  const [itemLoans, setItemLoans] = useState<Record<number, LoanRecord[]>>({});
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [batchMoveTargetId, setBatchMoveTargetId] = useState<number | null>(null);
  const [isBatchMoving, setIsBatchMoving] = useState(false);
  const [isBatchBusy, setIsBatchBusy] = useState(false);
  const [isBoxEditing, setIsBoxEditing] = useState(false);
  const [boxEditName, setBoxEditName] = useState("");
  const [boxEditLocation, setBoxEditLocation] = useState("");
  const [boxEditContainerType, setBoxEditContainerType] = useState<ContainerType>("box");
  const [boxEditParentId, setBoxEditParentId] = useState<number | null>(null);
  const [isBoxEditSaving, setIsBoxEditSaving] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [addItemName, setAddItemName] = useState("");
  const [addItemDescription, setAddItemDescription] = useState("");
  const [isAddItemSaving, setIsAddItemSaving] = useState(false);
  const [openItemMenuId, setOpenItemMenuId] = useState<number | null>(null);

  async function handleAddItem(event: React.FormEvent) {
    event.preventDefault();
    if (!box || !addItemName.trim()) return;
    setIsAddItemSaving(true);
    try {
      await createItem(box.id, {
        name: addItemName.trim(),
        description: addItemDescription.trim(),
        detail: "",
      });
      await refreshBox();
      setAddItemName("");
      setAddItemDescription("");
      setIsAddingItem(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Item konnte nicht gespeichert werden.");
    } finally {
      setIsAddItemSaving(false);
    }
  }

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
        const [boxData, boxSummaries, loadedModels, settings] = await Promise.all([
          getBox(boxId),
          listBoxes(),
          listModels().catch(() => [] as ModelSummary[]),
          getSettings().catch(() => ({ activeModelId: "" })),
        ]);
        if (!isMounted) {
          return;
        }

        setBox(boxData);
        setBoxes(boxSummaries);
        setModels(loadedModels);
        if (settings.activeModelId) {
          setRescanModelId(settings.activeModelId);
        } else if (loadedModels.length > 0) {
          setRescanModelId(loadedModels[0].id);
        }
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

  // Re-fetch loans only when box identity or item count changes, not on every box reference update.
  useEffect(() => {
    if (box && box.items.length > 0) {
      void loadItemLoans();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box?.id, box?.items.length]);

  useEffect(() => {
    let isMounted = true;

    if (!box) {
      setQrCodeDataUrl(null);
      return () => {
        isMounted = false;
      };
    }

    void generateQrSvgDataUrl(buildBoxQrValue(box.number))
      .then((dataUrl: string) => {
        if (isMounted) {
          setQrCodeDataUrl(dataUrl);
        }
      })
      .catch((err) => {
        console.error("QR-Generierung fehlgeschlagen", err);
        if (isMounted) {
          setQrCodeDataUrl(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [box]);

  useEffect(() => {
    const urls = rescanFiles.map((file) => URL.createObjectURL(file));
    setRescanPreviewUrls(urls);
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [rescanFiles]);

  async function refreshBox() {
    const freshBox = await getBox(boxId);
    setBox(freshBox);
  }

  function openBoxEdit() {
    if (!box) return;
    setBoxEditName(box.name);
    setBoxEditLocation(box.location);
    setBoxEditContainerType(box.containerType as ContainerType);
    setBoxEditParentId(box.path.length >= 2 ? box.path[box.path.length - 2].id : null);
    setIsRescanOpen(false);
    setIsBoxEditing((current) => !current);
    setError(null);
    void listLocations().then(setLocations);
  }

  function closeBoxEdit() {
    setIsBoxEditing(false);
  }

  async function handleBoxEditSave() {
    if (!box) return;
    setIsBoxEditSaving(true);
    setError(null);
    try {
      const updated = await updateBox(box.id, {
        name: boxEditName.trim(),
        location: boxEditLocation.trim(),
        containerType: boxEditContainerType,
        parentId: boxEditParentId,
      });
      setBox(updated);
      setIsBoxEditing(false);
      showConfirmation("Kiste aktualisiert.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Fehler beim Speichern.");
    } finally {
      setIsBoxEditSaving(false);
    }
  }

  function openRescan() {
    setIsBoxEditing(false);
    setIsRescanOpen((current) => !current);
    setRescanFiles([]);
    setRescanResult(null);
    setError(null);
  }

  function closeRescan() {
    setIsRescanOpen(false);
    setRescanFiles([]);
    setRescanResult(null);
  }

  function appendRescanFiles(nextFiles: FileList | null) {
    if (!nextFiles || nextFiles.length === 0) return;
    setRescanFiles((current) => [...current, ...Array.from(nextFiles)]);
  }

  async function handleRescanAnalyze() {
    if (!box || rescanFiles.length === 0) return;
    setIsRescanAnalyzing(true);
    setError(null);
    try {
      const result = await rescanBox(box.id, rescanModelId, rescanFiles);
      setRescanResult(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Re-Scan fehlgeschlagen.");
    } finally {
      setIsRescanAnalyzing(false);
    }
  }

  async function applyRescanChanges() {
    if (!box || !rescanResult) return;
    setError(null);
    try {
      for (const added of rescanResult.added) {
        await createItem(box.id, {
          name: added.name,
          description: added.description,
          detail: "",
        });
      }
      for (const improved of rescanResult.improved) {
        const matchingItem = box.items.find(
          (item) => item.name.toLowerCase() === improved.name.toLowerCase(),
        );
        if (matchingItem) {
          await updateItem(matchingItem.id, { description: improved.description });
        }
      }
      await refreshBox();
      closeRescan();
      setConfirmation("Änderungen wurden übernommen.");
      if (confirmationTimeoutRef.current) {
        window.clearTimeout(confirmationTimeoutRef.current);
      }
      confirmationTimeoutRef.current = window.setTimeout(() => setConfirmation(null), 3000);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Änderungen konnten nicht gespeichert werden.");
    }
  }

  function handlePrintLabel() {
    if (!box) return;
    const numberText = String(box.number);
    const qrSrc = qrCodeDataUrl ?? "";

    const doc = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>Etikett ${numberText}</title>
<style>
  @page { size: 62mm 30mm; margin: 0; }
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000;
    font-family: "JetBrains Mono", ui-monospace, Menlo, monospace; }
  .label { display: flex; align-items: center; gap: 4mm; padding: 3mm; width: 62mm; height: 30mm; }
  .num { font-weight: 700; font-size: 28pt; line-height: 1; letter-spacing: -0.04em; }
  .qr { width: 24mm; height: 24mm; flex-shrink: 0; }
  .qr img { width: 100%; height: 100%; display: block; }
</style>
</head>
<body>
  <div class="label">
    <div class="num">#${numberText}</div>
    <div class="qr">${qrSrc ? `<img src="${qrSrc}" alt="" />` : ""}</div>
  </div>
</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const cleanup = () => {
      window.setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 200);
    };

    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) { cleanup(); return; }
      window.setTimeout(() => {
        try { win.focus(); win.print(); } finally { cleanup(); }
      }, 100);
    };

    iframe.srcdoc = doc;
  }

  function beginEdit(item: ItemRecord) {
    setOpenItemMenuId(null);
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
    setOpenItemMenuId(null);
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
    setOpenItemMenuId(null);
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

  async function handleDeleteItem(item: ItemRecord) {
    setOpenItemMenuId(null);
    const confirmed = window.confirm(`"${item.name}" wirklich löschen?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteItem(item.id);
      await refreshBox();
      setError(null);
      showConfirmation("Item wurde gelöscht.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Item konnte nicht gelöscht werden.");
    }
  }

  async function handleDeleteBox() {
    if (!box) {
      return;
    }

    const containerLabel = CONTAINER_TYPE_LABELS[box.containerType as ContainerType] ?? "Kiste";
    const confirmed = window.confirm(
      `${containerLabel} #${box.number} wirklich löschen?\n\nAlle enthaltenen Items und Bilder werden ebenfalls entfernt.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteBox(box.id);
      setError(null);
      void navigate("/boxes");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Behälter konnte nicht gelöscht werden.");
    }
  }

  async function handleQuantityChange(itemId: number, delta: number) {
    const item = box?.items.find((i) => i.id === itemId);
    if (!item) return;
    const newQuantity = Math.max(1, (item.quantity ?? 1) + delta);
    try {
      await updateItemQuantity(itemId, newQuantity);
      await refreshBox();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Menge konnte nicht geändert werden.");
    }
  }

  function closeLendDialog() {
    setLendingItemId(null);
    setLendingBorrower("");
    setLendingDueDate("");
    setLendingNotes("");
  }

  async function handleCreateLoan() {
    if (!lendingItemId || !lendingBorrower.trim()) {
      setError("Bitte einen Namen angeben.");
      return;
    }
    try {
      await createLoan({
        itemId: lendingItemId,
        borrowerName: lendingBorrower.trim(),
        dueDate: lendingDueDate || undefined,
        notes: lendingNotes || undefined,
      });
      closeLendDialog();
      await refreshBox();
      await loadItemLoans();
      showConfirmation("Ausleihe gespeichert.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Ausleihe konnte nicht gespeichert werden.");
    }
  }

  async function handleReturnLoan(loanId: number) {
    try {
      await returnLoan(loanId);
      await loadItemLoans();
      showConfirmation("Rückgabe vermerkt.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Rückgabe konnte nicht gespeichert werden.");
    }
  }

  async function loadItemLoans() {
    if (!box) return;
    const loanMap: Record<number, LoanRecord[]> = {};
    for (const item of box.items) {
      try {
        const loans = await getLoansForItem(item.id);
        if (loans.length > 0) loanMap[item.id] = loans;
      } catch {
        // ignore
      }
    }
    setItemLoans(loanMap);
  }

  function showConfirmation(message: string) {
    setConfirmation(message);
    if (confirmationTimeoutRef.current) {
      window.clearTimeout(confirmationTimeoutRef.current);
    }
    confirmationTimeoutRef.current = window.setTimeout(() => setConfirmation(null), 3000);
  }

  function toggleBatchSelect(itemId: number) {
    setSelectedItemIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  function exitBatchMode() {
    setIsBatchMode(false);
    setSelectedItemIds(new Set());
    setIsBatchMoving(false);
    setBatchMoveTargetId(null);
  }

  async function handleBatchDelete() {
    if (selectedItemIds.size === 0 || isBatchBusy) return;
    const confirmed = window.confirm(`${selectedItemIds.size} Item(s) wirklich löschen?`);
    if (!confirmed) return;
    setIsBatchBusy(true);
    try {
      await batchDeleteItems([...selectedItemIds]);
      await refreshBox();
      showConfirmation(`${selectedItemIds.size} Items gelöscht.`);
      exitBatchMode();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Batch-Löschen fehlgeschlagen.");
    } finally {
      setIsBatchBusy(false);
    }
  }

  async function handleBatchMove() {
    if (selectedItemIds.size === 0 || !batchMoveTargetId || isBatchBusy) return;
    setIsBatchBusy(true);
    try {
      await batchMoveItems([...selectedItemIds], batchMoveTargetId);
      await refreshBox();
      showConfirmation(`${selectedItemIds.size} Items verschoben.`);
      exitBatchMode();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Batch-Verschieben fehlgeschlagen.");
    } finally {
      setIsBatchBusy(false);
    }
  }

  function buildShareText(boxData: BoxRecord): string {
    const containerLabel = CONTAINER_TYPE_LABELS[boxData.containerType as ContainerType] ?? "Kiste";
    const lines: string[] = [
      `📦 ${containerLabel} #${boxData.number} · ${boxData.name}`,
      `📍 ${boxData.location}`,
      "",
      `Inhalt (${boxData.items.length} Items):`,
    ];
    for (const item of boxData.items) {
      const qty = item.quantity > 1 ? ` ×${item.quantity}${item.quantityUnit ? ` ${item.quantityUnit}` : ""}` : "";
      lines.push(`• ${item.name}${qty}`);
      if (item.description) {
        lines.push(`  ${item.description}`);
      }
    }
    return lines.join("\n");
  }

  async function handleShare() {
    if (!box) return;
    const text = buildShareText(box);
    const containerLabel = CONTAINER_TYPE_LABELS[box.containerType as ContainerType] ?? "Kiste";
    const title = `${containerLabel} #${box.number} · ${box.name}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text });
      } catch {
        // User cancelled or share unavailable — silently ignore
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showConfirmation("Packliste in die Zwischenablage kopiert.");
    } catch {
      setError("Teilen fehlgeschlagen.");
    }
  }


  const availableMoveTargets = boxes.filter((entry) => entry.id !== box?.id);

  return (
    <div className="page-stack box-detail-page">
      {isLoading ? <div className="feedback">Kiste wird geladen…</div> : null}
      {confirmation ? <div className="feedback">{confirmation}</div> : null}
      {error ? <div className="feedback feedback--error">{error}</div> : null}

      {box ? (
        <>
          <nav className="breadcrumb-path box-detail-breadcrumb" aria-label="Pfad">
            <Link to="/boxes" className="breadcrumb-path__link">Behälter</Link>
            <span className="breadcrumb-path__separator"> / </span>
            <span>{box.name}</span>
          </nav>

          <section className="box-hero">
            <div
              className="box-hero__cover"
              style={
                box.images[0]
                  ? { backgroundImage: `url(${resolveAssetUrl(box.images[0].path) ?? ""})` }
                  : undefined
              }
            >
              {!box.images[0] ? (
                <span className="material-symbols-outlined box-hero__cover-placeholder" aria-hidden>
                  image
                </span>
              ) : null}

              <div className="box-hero__stamp">
                <span className="box-hero__stamp-label">
                  {CONTAINER_TYPE_LABELS[box.containerType as ContainerType] ?? "Kiste"}
                </span>
                <span className="box-hero__stamp-num">#{box.number}</span>
                <span className="box-hero__stamp-name">
                  {box.name} · {box.location}
                  {" · "}
                  {box.itemCount} {box.itemCount === 1 ? "Item" : "Items"}
                </span>
              </div>

              <div className="box-hero__cover-actions">
                <button
                  aria-label="Foto hinzufügen"
                  className="box-hero__cover-btn"
                  onClick={openRescan}
                  title="Foto hinzufügen"
                  type="button"
                >
                  <span className="material-symbols-outlined">add_a_photo</span>
                </button>
                {box.images.length > 0 ? (
                  <span className="box-hero__cover-count" title="Anzahl Fotos">
                    <span className="material-symbols-outlined">collections</span>
                    {box.images.length}
                  </span>
                ) : null}
              </div>
            </div>
          </section>

          <div className="box-detail-actions" role="toolbar" aria-label="Kistenaktionen">
            <button
              className={`button button--primary${isBoxEditing ? " button--active" : ""}`}
              onClick={openBoxEdit}
              type="button"
            >
              <span className="material-symbols-outlined">edit</span>
              Bearbeiten
            </button>
            <button
              className="button button--ghost"
              onClick={() => void handleShare()}
              type="button"
            >
              <span className="material-symbols-outlined">ios_share</span>
              Teilen
            </button>
            <button
              className="button button--ghost button--danger"
              onClick={() => void handleDeleteBox()}
              type="button"
            >
              <span className="material-symbols-outlined">delete</span>
              Löschen
            </button>
          </div>

          <button
            className="box-qr-row"
            onClick={() => void handlePrintLabel()}
            title="Etikett drucken"
            type="button"
          >
            <div className="box-qr-row__icon">
              {qrCodeDataUrl ? (
                <img
                  alt={`QR-Code für ${CONTAINER_TYPE_LABELS[box.containerType as ContainerType] ?? "Kiste"} ${box.number}`}
                  src={qrCodeDataUrl}
                />
              ) : (
                <span className="material-symbols-outlined" aria-hidden>
                  qr_code_2
                </span>
              )}
            </div>
            <div className="box-qr-row__info">
              <strong>#{box.number} · {box.name}</strong>
              <span>Scannen zum Öffnen</span>
            </div>
            <span className="box-qr-row__print">
              <span className="material-symbols-outlined">print</span>
              Etikett
            </span>
          </button>

          {isBoxEditing ? (
            <section className="panel box-edit-panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Bearbeiten</p>
                  <h2>Kiste bearbeiten</h2>
                </div>
                <button className="button button--ghost" onClick={closeBoxEdit} type="button">
                  <span className="material-symbols-outlined">close</span>
                  Abbrechen
                </button>
              </div>

              <div className="form-stack">
                <div className="field">
                  <label htmlFor="box-edit-name">Name</label>
                  <input
                    className="input"
                    id="box-edit-name"
                    onChange={(event) => setBoxEditName(event.target.value)}
                    type="text"
                    value={boxEditName}
                  />
                </div>

                <div className="field">
                  <label htmlFor="box-edit-location">Standort</label>
                  <input
                    className="input"
                    id="box-edit-location"
                    list="box-edit-locations"
                    onChange={(event) => setBoxEditLocation(event.target.value)}
                    type="text"
                    value={boxEditLocation}
                  />
                  <datalist id="box-edit-locations">
                    {locations.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>

                <div className="field">
                  <label htmlFor="box-edit-type">Container-Typ</label>
                  <select
                    className="move-select"
                    id="box-edit-type"
                    onChange={(event) => setBoxEditContainerType(event.target.value as ContainerType)}
                    value={boxEditContainerType}
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

                <div className="field">
                  <label htmlFor="box-edit-parent">Übergeordneter Behälter</label>
                  <select
                    className="move-select"
                    id="box-edit-parent"
                    onChange={(event) =>
                      setBoxEditParentId(event.target.value ? Number(event.target.value) : null)
                    }
                    value={boxEditParentId ?? ""}
                  >
                    <option value="">– Kein übergeordneter Behälter –</option>
                    {boxes
                      .filter((entry) => entry.id !== boxId)
                      .map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {CONTAINER_TYPE_LABELS[entry.containerType] ?? "Kiste"} #{entry.number} –{" "}
                          {entry.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="action-row">
                  <button
                    className="button button--primary"
                    disabled={isBoxEditSaving || !boxEditName.trim()}
                    onClick={() => void handleBoxEditSave()}
                    type="button"
                  >
                    {isBoxEditSaving ? "Speichern…" : "Speichern"}
                  </button>
                  <button className="button button--ghost" onClick={closeBoxEdit} type="button">
                    Abbrechen
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {/* Label-Druck ist jetzt über die QR-Row erreichbar */}

          {isRescanOpen ? (
            <section className="panel rescan-panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Re-Scan</p>
                  <h2>Neue Fotos analysieren</h2>
                </div>
                <button className="button button--ghost" onClick={closeRescan} type="button">
                  <span className="material-symbols-outlined">close</span>
                  Schließen
                </button>
              </div>

              {!rescanResult ? (
                <>
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="rescan-model">KI-Modell</label>
                      <select
                        className="input"
                        id="rescan-model"
                        onChange={(event) => setRescanModelId(event.target.value)}
                        value={rescanModelId}
                      >
                        {models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="preview-grid">
                    {rescanPreviewUrls.map((url, index) => (
                      <div className="preview-card" key={url}>
                        <img alt={`Upload ${index + 1}`} src={url} />
                      </div>
                    ))}
                    {rescanPreviewUrls.length === 0 ? (
                      <div className="empty-dropzone">
                        <span className="material-symbols-outlined">add_a_photo</span>
                        <p>Fotos der Kiste hinzufügen</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="action-row action-row--wrap">
                    <label className="button button--ghost" htmlFor="rescan-upload">
                      <span className="material-symbols-outlined">upload</span>
                      Fotos wählen
                    </label>
                    <input
                      accept="image/*"
                      className="sr-only"
                      id="rescan-upload"
                      multiple
                      onChange={(event) => appendRescanFiles(event.target.files)}
                      type="file"
                    />
                    <button
                      className="button button--primary"
                      disabled={rescanFiles.length === 0 || isRescanAnalyzing}
                      onClick={() => void handleRescanAnalyze()}
                      type="button"
                    >
                      {isRescanAnalyzing ? (
                        <>
                          <span className="material-symbols-outlined spin">progress_activity</span>
                          Analysiere…
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">auto_awesome</span>
                          Re-Scan starten
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="rescan-results">
                  {rescanResult.added.length > 0 ? (
                    <div className="rescan-group">
                      <h3><span className="material-symbols-outlined">add_circle</span> Neu erkannt ({rescanResult.added.length})</h3>
                      <ul className="rescan-list">
                        {rescanResult.added.map((item, i) => (
                          <li key={`added-${i}`} className="rescan-item rescan-item--added">
                            <strong>{item.name}</strong>
                            <span>{item.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {rescanResult.improved.length > 0 ? (
                    <div className="rescan-group">
                      <h3><span className="material-symbols-outlined">auto_fix_high</span> Verbessert ({rescanResult.improved.length})</h3>
                      <ul className="rescan-list">
                        {rescanResult.improved.map((item, i) => (
                          <li key={`improved-${i}`} className="rescan-item rescan-item--improved">
                            <strong>{item.name}</strong>
                            <span>{item.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {rescanResult.removed.length > 0 ? (
                    <div className="rescan-group">
                      <h3><span className="material-symbols-outlined">remove_circle</span> Nicht mehr sichtbar ({rescanResult.removed.length})</h3>
                      <ul className="rescan-list">
                        {rescanResult.removed.map((item, i) => (
                          <li key={`removed-${i}`} className="rescan-item rescan-item--removed">
                            <strong>{item.name}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {rescanResult.added.length === 0 && rescanResult.improved.length === 0 && rescanResult.removed.length === 0 ? (
                    <p className="feedback">Keine Änderungen erkannt. Die Kiste sieht gleich aus!</p>
                  ) : null}

                  <div className="action-row action-row--wrap">
                    <button
                      className="button button--primary"
                      disabled={rescanResult.added.length === 0 && rescanResult.improved.length === 0}
                      onClick={() => void applyRescanChanges()}
                      type="button"
                    >
                      <span className="material-symbols-outlined">check</span>
                      Änderungen übernehmen
                    </button>
                    <button className="button button--ghost" onClick={closeRescan} type="button">
                      Verwerfen
                    </button>
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {box.children && box.children.length > 0 ? (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Enthaltene Behälter</p>
                  <h2>Unterbehälter</h2>
                </div>
              </div>
              <div className="children-grid">
                {box.children.map((child) => (
                  <Link className="child-card panel" key={child.id} to={`/boxes/${child.id}`}>
                    <span className="material-symbols-outlined child-card__icon">
                      {CONTAINER_TYPE_ICONS[child.containerType] ?? "inventory_2"}
                    </span>
                    <div className="child-card__body">
                      <span className="section-kicker">{CONTAINER_TYPE_LABELS[child.containerType] ?? "Kiste"} #{child.number}</span>
                      <strong>{child.name}</strong>
                    </div>
                    <span className="chip">{child.itemCount} Items</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="panel box-detail-items">
            <div className="panel-header box-detail-items__header">
              <div>
                <p className="section-kicker">Items</p>
                <h2>Inhalt</h2>
              </div>
              <div className="box-detail-items__actions">
                <button
                  aria-label="Item hinzufügen"
                  className={`box-detail-toolbar__action${isAddingItem ? " button--active" : ""}`}
                  onClick={() => {
                    setIsAddingItem((v) => !v);
                    setAddItemName("");
                    setAddItemDescription("");
                  }}
                  title="Item manuell hinzufügen"
                  type="button"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>

            {isAddingItem ? (
              <form className="add-item-form" onSubmit={(e) => void handleAddItem(e)}>
                <input
                  autoFocus
                  className="input"
                  disabled={isAddItemSaving}
                  onChange={(e) => setAddItemName(e.target.value)}
                  placeholder="Name"
                  required
                  type="text"
                  value={addItemName}
                />
                <input
                  className="input"
                  disabled={isAddItemSaving}
                  onChange={(e) => setAddItemDescription(e.target.value)}
                  placeholder="Beschreibung (optional)"
                  type="text"
                  value={addItemDescription}
                />
                <div className="action-row">
                  <button
                    className="button button--primary"
                    disabled={isAddItemSaving || !addItemName.trim()}
                    type="submit"
                  >
                    Hinzufügen
                  </button>
                  <button
                    className="button button--ghost"
                    disabled={isAddItemSaving}
                    onClick={() => setIsAddingItem(false)}
                    type="button"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            ) : null}

            {isBatchMode && selectedItemIds.size > 0 ? (
              <div className="batch-action-bar">
                <span className="batch-action-bar__count">{selectedItemIds.size} ausgewählt</span>
                {!isBatchMoving ? (
                  <div className="action-row">
                    <button
                      className="button button--ghost"
                      onClick={() => setIsBatchMoving(true)}
                      type="button"
                    >
                      <span className="material-symbols-outlined">drive_file_move</span>
                      Verschieben
                    </button>
                    <button
                      className="button button--ghost box-detail-toolbar__action--danger"
                      disabled={isBatchBusy}
                      onClick={() => void handleBatchDelete()}
                      type="button"
                    >
                      <span className="material-symbols-outlined">delete</span>
                      Löschen
                    </button>
                  </div>
                ) : (
                  <div className="batch-move-row">
                    <select
                      className="input"
                      onChange={(event) => {
                        const v = Number(event.target.value);
                        setBatchMoveTargetId(v > 0 ? v : null);
                      }}
                      value={batchMoveTargetId ?? ""}
                    >
                      <option value="">Ziel wählen…</option>
                      {availableMoveTargets.map((target) => (
                        <option key={target.id} value={target.id}>
                          #{target.number} · {target.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="button button--primary"
                      disabled={!batchMoveTargetId || isBatchBusy}
                      onClick={() => void handleBatchMove()}
                      type="button"
                    >
                      Bestätigen
                    </button>
                    <button
                      className="button button--ghost"
                      onClick={() => setIsBatchMoving(false)}
                      type="button"
                    >
                      Abbrechen
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            <div className="review-list box-detail-item-list">
              {box.items.map((item) => {
                const isEditing = editingItemId === item.id && draft;
                const isMoving = movingItemId === item.id;

                return (
                  <article
                    className={`review-card review-card--detail${isEditing ? " review-card--editing" : ""}${isMoving ? " review-card--moving" : ""}${isBatchMode && selectedItemIds.has(item.id) ? " review-card--selected" : ""}`}
                    key={item.id}
                    onClick={isBatchMode ? () => toggleBatchSelect(item.id) : undefined}
                  >
                    {isBatchMode ? (
                      <div className="batch-checkbox">
                        <input
                          checked={selectedItemIds.has(item.id)}
                          onChange={() => toggleBatchSelect(item.id)}
                          onClick={(event) => event.stopPropagation()}
                          type="checkbox"
                        />
                      </div>
                    ) : null}
                    <div className="review-card__media">
                      {(item.quantity && item.quantity > 1) ? (
                        <div className="card-badge">
                          ×{item.quantity}
                        </div>
                      ) : null}
                      {getItemImageUrl(item) ? (
                        isBatchMode ? (
                          <img alt={item.name} src={getItemImageUrl(item) ?? undefined} />
                        ) : (
                          <Link className="review-card__media-link" to={`/items/${item.id}`}>
                            <img alt={item.name} src={getItemImageUrl(item) ?? undefined} />
                          </Link>
                        )
                      ) : (
                        isBatchMode ? (
                          <div className="item-image-placeholder">
                            <span className="material-symbols-outlined">imagesmode</span>
                            <strong>Kein Vorschaubild</strong>
                          </div>
                        ) : (
                          <Link
                            className="item-image-placeholder"
                            title="Details anzeigen"
                            to={`/items/${item.id}`}
                          >
                            <span className="material-symbols-outlined">imagesmode</span>
                            <strong>Kein Vorschaubild</strong>
                          </Link>
                        )
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
                          <Link to={`/items/${item.id}`} className="review-card__name review-card__name--link">{item.name}</Link>
                          {item.description ? <p className="review-card__desc">{item.description}</p> : null}
                          <div className="item-meta-row">
                            <div className="quantity-control">
                              <button className="quantity-control__btn" onClick={() => void handleQuantityChange(item.id, -1)} type="button" title="Menge verringern">−</button>
                              <span className="quantity-control__value">{item.quantity ?? 1}{item.quantityUnit ? ` ${item.quantityUnit}` : ""}</span>
                              <button className="quantity-control__btn" onClick={() => void handleQuantityChange(item.id, 1)} type="button" title="Menge erhöhen">+</button>
                            </div>
                            {itemLoans[item.id]?.filter((l) => !l.returnedDate).map((loan) => (
                              <span key={loan.id} className="chip chip--loan" title={`Verliehen an ${loan.borrowerName}`}>
                                <span className="material-symbols-outlined">person</span>
                                {loan.borrowerName}
                                <button className="chip__close" onClick={() => void handleReturnLoan(loan.id)} type="button" title="Rückgabe">✓</button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {!isEditing && !isBatchMode ? (
                      <div className="review-card__actions item-context">
                        <button
                          aria-expanded={openItemMenuId === item.id}
                          aria-haspopup="menu"
                          aria-label="Item-Aktionen"
                          className="box-detail-toolbar__action item-context__trigger"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenItemMenuId((current) => current === item.id ? null : item.id);
                          }}
                          type="button"
                        >
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                        {openItemMenuId === item.id ? (
                          <>
                            <button
                              aria-label="Menü schließen"
                              className="item-context__backdrop"
                              onClick={() => setOpenItemMenuId(null)}
                              type="button"
                            />
                            <div className="context-menu open" role="menu">
                              <button className="ctx-item" onClick={() => beginEdit(item)} role="menuitem" type="button">
                                <span className="material-symbols-outlined">edit</span>
                                <span>Bearbeiten</span>
                              </button>
                              <label className="ctx-item" htmlFor={`item-upload-${item.id}`} role="menuitem">
                                <span className="material-symbols-outlined">add_a_photo</span>
                                <span>Foto</span>
                              </label>
                              <button
                                className="ctx-item"
                                disabled={availableMoveTargets.length === 0}
                                onClick={() => openMoveMenu(item.id)}
                                role="menuitem"
                                type="button"
                              >
                                <span className="material-symbols-outlined">drive_file_move</span>
                                <span>Verschieben</span>
                              </button>
                              <button
                                className="ctx-item ctx-item--danger"
                                onClick={() => void handleDeleteItem(item)}
                                role="menuitem"
                                type="button"
                              >
                                <span className="material-symbols-outlined">delete</span>
                                <span>Löschen</span>
                              </button>
                            </div>
                          </>
                        ) : null}
                        <input
                          accept="image/*"
                          className="sr-only"
                          id={`item-upload-${item.id}`}
                          onChange={(event) =>
                            void handleImageUpload(item.id, event.target.files?.[0] ?? null)
                          }
                          type="file"
                        />
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

                    {lendingItemId === item.id ? (
                      <div className="move-panel">
                        <div className="field">
                          <label htmlFor={`lend-borrower-${item.id}`}>An wen verleihen?</label>
                          <input
                            className="input"
                            id={`lend-borrower-${item.id}`}
                            onChange={(event) => setLendingBorrower(event.target.value)}
                            placeholder="Name"
                            value={lendingBorrower}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor={`lend-due-${item.id}`}>Rückgabe bis (optional)</label>
                          <input
                            className="input"
                            id={`lend-due-${item.id}`}
                            onChange={(event) => setLendingDueDate(event.target.value)}
                            type="date"
                            value={lendingDueDate}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor={`lend-notes-${item.id}`}>Notiz (optional)</label>
                          <input
                            className="input"
                            id={`lend-notes-${item.id}`}
                            onChange={(event) => setLendingNotes(event.target.value)}
                            placeholder="z.B. Grund"
                            value={lendingNotes}
                          />
                        </div>
                        <div className="move-panel__actions">
                          <button
                            className="button button--primary"
                            disabled={!lendingBorrower.trim()}
                            onClick={() => void handleCreateLoan()}
                            type="button"
                          >
                            Verleihen
                          </button>
                          <button className="button button--ghost" onClick={closeLendDialog} type="button">
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : null}
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
