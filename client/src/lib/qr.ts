import QRCode from "qrcode";

const COMMON_OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 1,
  color: { dark: "#000000", light: "#ffffff" },
};

export function buildBoxQrValue(boxNumber: number | string): string {
  return `kistenscanner://box-number/${boxNumber}`;
}

export function buildItemQrValue(itemId: number | string): string {
  return `kistenscanner://item/${itemId}`;
}

/**
 * Renders a QR code as inline SVG data URL.
 * SVG scales crisply to any sticker dimension (42 × 97 mm to A6 etc.).
 */
export async function generateQrSvgDataUrl(value: string): Promise<string> {
  const svg = await QRCode.toString(value, {
    ...COMMON_OPTIONS,
    type: "svg",
  });
  // toString returns raw SVG markup → wrap as data URL.
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
