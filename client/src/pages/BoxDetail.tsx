import { useEffect, useRef, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  batchDeleteItems,
  batchMoveItems,
  CONTAINER_TYPE_ICONS,
  CONTAINER_TYPE_LABELS,
  createItem,
  createLoan,
  deleteBox,
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
  type PathSegment,
  type RescanResult,
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
  const navigate = useNavigate();
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
        const [boxData, boxSummaries, loadedModels, settings] = await Promise.all([
          getBox(boxId),
          listBoxes(),
          listModels(),
          getSettings(),
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
    setIsLabelPanelOpen(false);
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
    setIsLabelPanelOpen(false);
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
    setIsBoxEditing(false);
    setIsRescanOpen(false);
    setIsLabelPanelOpen((current) => !current);
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

  function openLendDialog(itemId: number) {
    setLendingItemId(itemId);
    setLendingBorrower("");
    setLendingDueDate("");
    setLendingNotes("");
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
          {box.path && box.path.length > 0 ? (
            <nav className="breadcrumb-path" aria-label="Pfad">
              {box.path.map((seg: PathSegment, idx: number) => (
                <span key={seg.id} className="breadcrumb-path__segment">
                  {idx > 0 ? <span className="breadcrumb-path__separator"> › </span> : null}
                  <Link to={`/boxes/${seg.id}`} className="breadcrumb-path__link">
                    <span className="material-symbols-outlined breadcrumb-path__icon">{CONTAINER_TYPE_ICONS[seg.containerType] || "inventory_2"}</span>
                    {seg.name}
                  </Link>
                </span>
              ))}
            </nav>
          ) : null}

          <section className="panel box-detail-header">
            <div className="box-detail-header__identity">
              <div className="box-detail-header__code">
                <div className="qr-panel box-detail-header__qr-panel">
                  {qrCodeDataUrl ? <img alt={`QR-Code für ${CONTAINER_TYPE_LABELS[box.containerType as ContainerType] ?? "Kiste"} ${box.number}`} src={qrCodeDataUrl} /> : null}
                </div>
              </div>

              <div className="box-detail-header__summary">
                <p className="section-kicker">Standort</p>
                <h1 className="box-detail-header__location">{box.location}</h1>
                <div className="box-detail-header__facts">
                  <div className="box-detail-header__fact">
                    <span className="box-detail-header__fact-label">{CONTAINER_TYPE_LABELS[box.containerType as ContainerType] ?? "Kiste"}</span>
                    <strong className="box-detail-header__fact-value">#{box.number}</strong>
                  </div>
                  <div className="box-detail-header__fact">
                    <span className="box-detail-header__fact-label">Name</span>
                    <strong className="box-detail-header__fact-value">{box.name}</strong>
                  </div>
                  <div className="box-detail-header__fact">
                    <span className="box-detail-header__fact-label">Items</span>
                    <strong className="box-detail-header__fact-value">{box.itemCount}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="box-detail-toolbar" role="toolbar" aria-label="Kistenaktionen">
              <button
                aria-label="Kiste bearbeiten"
                className={`button button--ghost box-detail-toolbar__action${isBoxEditing ? " button--active" : ""}`}
                onClick={openBoxEdit}
                title="Kiste bearbeiten"
                type="button"
              >
                <span className="material-symbols-outlined">edit</span>
                <span className="box-detail-toolbar__text">Bearbeiten</span>
              </button>
              <button
                aria-label="Foto hinzufügen"
                className={`button button--ghost box-detail-toolbar__action${isRescanOpen ? " button--active" : ""}`}
                onClick={openRescan}
                title="Re-Scan: Neue Fotos analysieren"
                type="button"
              >
                <span className="material-symbols-outlined">add_a_photo</span>
                <span className="box-detail-toolbar__text">Re-Scan</span>
              </button>
              <button
                aria-label="Label drucken"
                className={`button button--ghost box-detail-toolbar__action${isLabelPanelOpen ? " button--active" : ""}`}
                onClick={openLabelPanel}
                title="Label drucken"
                type="button"
              >
                <span className="material-symbols-outlined">print</span>
                <span className="box-detail-toolbar__text">Label drucken</span>
              </button>
              <button
                aria-label="Packliste teilen"
                className="button button--ghost box-detail-toolbar__action"
                onClick={() => void handleShare()}
                title="Inhalt teilen / Packliste kopieren"
                type="button"
              >
                <span className="material-symbols-outlined">ios_share</span>
                <span className="box-detail-toolbar__text">Teilen</span>
              </button>
              <Link
                aria-label="Zurück zu den Kisten"
                className="button button--ghost box-detail-toolbar__action"
                title="Zurück zu den Kisten"
                to="/boxes"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span className="box-detail-toolbar__text">Zurück</span>
              </Link>
              <button
                aria-label="Kiste löschen"
                className="button button--ghost box-detail-toolbar__action box-detail-toolbar__action--danger"
                onClick={() => void handleDeleteBox()}
                title="Kiste löschen"
                type="button"
              >
                <span className="material-symbols-outlined">delete</span>
                <span className="box-detail-toolbar__text">Löschen</span>
              </button>
            </div>
          </section>

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

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">Items</p>
                <h2>Inhalt</h2>
              </div>
              {box.items.length > 0 ? (
                <button
                  className={`button button--ghost${isBatchMode ? " button--active" : ""}`}
                  onClick={() => isBatchMode ? exitBatchMode() : setIsBatchMode(true)}
                  type="button"
                >
                  <span className="material-symbols-outlined">checklist</span>
                  {isBatchMode ? "Auswahl beenden" : "Mehrfachauswahl"}
                </button>
              ) : null}
            </div>

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

            <div className="review-list">
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
                        <button
                          className="icon-btn"
                          onClick={() => openLendDialog(item.id)}
                          title="Verleihen"
                          type="button"
                        >
                          <span className="material-symbols-outlined">share</span>
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
