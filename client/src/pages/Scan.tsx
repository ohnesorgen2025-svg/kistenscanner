import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import { getBoxByNumber } from "../lib/api";

function extractBoxNumber(decodedText: string): number | null {
  const trimmed = decodedText.trim();
  const directNumber = Number(trimmed);
  if (Number.isInteger(directNumber) && directNumber > 0) {
    return directNumber;
  }

  const matchedNumber = trimmed.match(/(\d+)(?!.*\d)/);
  if (!matchedNumber) {
    return null;
  }

  const boxNumber = Number(matchedNumber[1]);
  return Number.isInteger(boxNumber) && boxNumber > 0 ? boxNumber : null;
}

export function ScanPage() {
  const navigate = useNavigate();
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasResolvedRef = useRef(false);
  const [status, setStatus] = useState("Kamera wird vorbereitet…");
  const [error, setError] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  async function resolveDecodedText(decodedText: string) {
    if (hasResolvedRef.current) {
      return;
    }

    hasResolvedRef.current = true;
    setStatus("QR-Code erkannt. Kiste wird geladen…");
    setError(null);

    const boxNumber = extractBoxNumber(decodedText);
    if (!boxNumber) {
      hasResolvedRef.current = false;
      setError("Kiste nicht gefunden");
      setStatus(cameraAvailable ? "Ungültiger QR-Code" : "QR-Code nicht erkannt. Nochmal versuchen.");
      return;
    }

    try {
      const box = await getBoxByNumber(boxNumber);
      navigate(`/boxes/${box.id}`);
    } catch {
      hasResolvedRef.current = false;
      setError("Kiste nicht gefunden");
      setStatus("QR-Code konnte nicht aufgelöst werden");
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStatus("QR-Code wird erkannt…");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-file-reader");
      const decodedText = await scanner.scanFile(file, false);
      scanner.clear();
      await resolveDecodedText(decodedText);
    } catch {
      setError("Kein QR-Code im Bild erkannt. Bitte erneut versuchen.");
      setStatus("QR-Code nicht erkannt");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  useEffect(() => {
    let isMounted = true;
    let scannerStarted = false;
    let html5QrcodeInstance: {
      start: (
        cameraIdOrConfig: string | { facingMode: string },
        configuration: { fps: number; qrbox: { width: number; height: number } },
        qrCodeSuccessCallback: (decodedText: string) => void | Promise<void>,
        qrCodeErrorCallback?: (errorMessage: string) => void,
      ) => Promise<unknown>;
      stop: () => Promise<unknown>;
      clear: () => void;
    } | null = null;
    let startPromise: Promise<unknown> | null = null;

    async function setupScanner() {
      if (!scannerRef.current) {
        return;
      }

      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!isMounted || !scannerRef.current) {
          return;
        }

        const scanner = new Html5Qrcode(scannerRef.current.id);
        html5QrcodeInstance = scanner;

        startPromise = scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText: string) => {
            await resolveDecodedText(decodedText);
          },
          () => undefined,
        );
        await startPromise;
        scannerStarted = true;

        if (!isMounted) {
          await scanner.stop().catch(() => undefined);
          try {
            scanner.clear();
          } catch {
            // Ignore late teardown errors while navigating away.
          }
          return;
        }

        setStatus("QR-Code innerhalb des Rahmens scannen");
      } catch {
        if (!isMounted) {
          return;
        }

        setCameraAvailable(false);
        setError(null);
        setStatus("Kamera nicht verfügbar – QR-Code als Foto hochladen");
      }
    }

    void setupScanner();

    return () => {
      isMounted = false;
      const instance = html5QrcodeInstance;
      if (!instance) {
        return;
      }

      void (async () => {
        await startPromise?.catch(() => undefined);

        if (scannerStarted) {
          await instance.stop().catch(() => undefined);
        }

        try {
          instance.clear();
        } catch {
          // Ignore cleanup errors from already-removed scanner DOM.
        }
      })();
    };
  }, [navigate]);

  return (
    <div className="page-stack">
      <PageHeader kicker="Scannen" title="Scannen" />

      {cameraAvailable ? (
        <section className="panel scan-panel">
          <div className="scan-viewfinder">
            <div className="scan-viewfinder__corners" />
            <div className="scan-target" id="qr-reader" ref={scannerRef} />
          </div>

          <div className="scan-status">
            <span className="chip">{status}</span>
          </div>
        </section>
      ) : (
        <section className="panel scan-panel">
          <div className="scan-upload">
            <span className="material-symbols-outlined scan-upload__icon">photo_camera</span>
            <p className="scan-upload__text">
              Kamera ist auf dieser Verbindung nicht verfügbar (HTTPS erforderlich).
            </p>
            <p className="scan-upload__hint">
              QR-Code fotografieren oder ein vorhandenes Bild auswählen:
            </p>
            <div className="scan-upload__actions">
              <label className="button button--primary scan-upload__button">
                <span className="material-symbols-outlined">add_a_photo</span>
                Foto aufnehmen
                <input
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  disabled={isProcessing}
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  type="file"
                />
              </label>
              <label className="button button--secondary scan-upload__button">
                <span className="material-symbols-outlined">image</span>
                Bild auswählen
                <input
                  accept="image/*"
                  className="sr-only"
                  disabled={isProcessing}
                  onChange={handleFileUpload}
                  type="file"
                />
              </label>
            </div>
          </div>
          <div id="qr-file-reader" style={{ display: "none" }} />

          <div className="scan-status">
            <span className="chip">{status}</span>
          </div>
        </section>
      )}

      {error ? <div className="feedback feedback--error">{error}</div> : null}
    </div>
  );
}
