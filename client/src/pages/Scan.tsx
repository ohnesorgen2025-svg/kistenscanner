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
  const hasResolvedRef = useRef(false);
  const [status, setStatus] = useState("Kamera wird vorbereitet…");
  const [error, setError] = useState<string | null>(null);

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
              setStatus("Ungültiger QR-Code");
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
      } catch (scanError) {
        if (!isMounted) {
          return;
        }

        setError(
          scanError instanceof Error
            ? scanError.message
            : "Scanner konnte nicht gestartet werden.",
        );
        setStatus("Kamera nicht verfügbar");
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

      <section className="panel scan-panel">
        <div className="scan-viewfinder">
          <div className="scan-viewfinder__corners" />
          <div className="scan-target" id="qr-reader" ref={scannerRef} />
        </div>

        <div className="scan-status">
          <span className="chip">{status}</span>
        </div>
      </section>

      {error ? <div className="feedback feedback--error">{error}</div> : null}
    </div>
  );
}
