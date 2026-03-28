export type AnalysisItemBoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AnalysisItem = {
  name: string;
  description: string;
  quantity: number;
  sourceImageIndex: number | null;
  bbox: AnalysisItemBoundingBox | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function sanitizeAnalysisItem(value: unknown): AnalysisItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const description = typeof record.description === "string" ? record.description.trim() : "";
  const quantityValue = record.quantity;
  const quantity =
    typeof quantityValue === "number"
      ? quantityValue
      : typeof quantityValue === "string"
        ? Number(quantityValue)
        : Number.NaN;
  const sourceImageIndexValue = record.sourceImageIndex;
  const sourceImageIndex =
    typeof sourceImageIndexValue === "number"
      ? sourceImageIndexValue
      : typeof sourceImageIndexValue === "string"
        ? Number(sourceImageIndexValue)
        : Number.NaN;
  const bboxValue = record.bbox;

  if (!name) {
    return null;
  }

  const bbox =
    bboxValue &&
    typeof bboxValue === "object" &&
    !Array.isArray(bboxValue) &&
    typeof (bboxValue as Record<string, unknown>).x === "number" &&
    typeof (bboxValue as Record<string, unknown>).y === "number" &&
    typeof (bboxValue as Record<string, unknown>).width === "number" &&
    typeof (bboxValue as Record<string, unknown>).height === "number"
      ? (() => {
          const record = bboxValue as Record<string, number>;
          const x = record.x ?? 0;
          const y = record.y ?? 0;
          const width = record.width ?? 0;
          const height = record.height ?? 0;

          return {
            x: clamp(x, 0, 1),
            y: clamp(y, 0, 1),
            width: clamp(width, 0, 1),
            height: clamp(height, 0, 1),
          };
        })()
      : null;

  const normalizedBbox =
    bbox && bbox.width > 0 && bbox.height > 0 && bbox.x < 1 && bbox.y < 1
      ? {
          x: Math.min(bbox.x, 1 - bbox.width),
          y: Math.min(bbox.y, 1 - bbox.height),
          width: Math.min(bbox.width, 1),
          height: Math.min(bbox.height, 1),
        }
      : null;

  return {
    name,
    description,
    quantity: Number.isFinite(quantity) && quantity > 0 ? Math.round(quantity) : 1,
    sourceImageIndex:
      Number.isInteger(sourceImageIndex) && sourceImageIndex >= 0 ? sourceImageIndex : null,
    bbox: normalizedBbox,
  };
}

function extractJsonCandidate(rawResponse: string): string {
  const trimmed = rawResponse.trim();
  if (!trimmed) {
    return trimmed;
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }

  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return trimmed.slice(firstBracket, lastBracket + 1);
  }

  return trimmed;
}

function parseLooseBoundingBox(rawValue: string): AnalysisItemBoundingBox | null {
  const trimmed = rawValue.trim();
  if (!trimmed || trimmed.toLowerCase() === "null") {
    return null;
  }

  const normalized = trimmed
    .replace(/([{,]\s*)([a-zA-Z_][\w]*)\s*:/g, '$1"$2":')
    .replace(/'/g, '"');

  try {
    const parsed = JSON.parse(normalized) as Record<string, unknown>;
    if (
      typeof parsed.x !== "number" ||
      typeof parsed.y !== "number" ||
      typeof parsed.width !== "number" ||
      typeof parsed.height !== "number"
    ) {
      return null;
    }

    return {
      x: parsed.x,
      y: parsed.y,
      width: parsed.width,
      height: parsed.height,
    };
  } catch {
    return null;
  }
}

function normalizePseudoJsonResponse(rawResponse: string): string {
  return rawResponse
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .replace(/\r/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/`(name|description|quantity|sourceImageIndex|bbox)`/gi, "$1")
    .replace(/\bItem\s+(\d+)\s*:\s*/gi, "\nItem $1:\n")
    .replace(
      /\s+(\d+\.)\s*`?(name|description|quantity|sourceImageIndex|bbox)`?\s*:\s*/gi,
      "\n$1 $2: ",
    )
    .replace(
      /\s+[-*]\s*`?(name|description|quantity|sourceImageIndex|bbox)`?\s*:\s*/gi,
      "\n- $1: ",
    )
    .replace(/\s+(?=`?(name|description|quantity|sourceImageIndex|bbox)`?\s*:)/gi, "\n")
    .replace(/^\s+/, "")
    .trim();
}

function parseKeyValueAnalysisItems(rawResponse: string): AnalysisItem[] {
  const normalizedResponse = normalizePseudoJsonResponse(rawResponse);
  const lines = normalizedResponse.split(/\r?\n/);
  const items: AnalysisItem[] = [];
  let current: Record<string, unknown> | null = null;

  function flushCurrent() {
    if (!current) {
      return;
    }

    const item = sanitizeAnalysisItem(current);
    if (item) {
      items.push(item);
    }
    current = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (/^item\s+\d+\s*:/i.test(line)) {
      flushCurrent();
      current = {};
      continue;
    }

    const fieldMatch = line.match(
      /^(?:(?:\d+\.)|(?:[-*]))?\s*`?(name|description|quantity|sourceImageIndex|bbox)`?\s*:\s*(.+)$/i,
    );

    if (!fieldMatch) {
      continue;
    }

    if (!current) {
      current = {};
    }

    const rawField = fieldMatch[1];
    const rawValue = fieldMatch[2];
    if (!rawField || !rawValue) {
      continue;
    }
    const field = rawField.toLowerCase();
    const value = rawValue.trim();

    if (field === "name") {
      if (typeof current.name === "string" && current.name.trim().length > 0) {
        flushCurrent();
        current = {};
      }
      current.name = value.replace(/^"+|"+$/g, "");
      continue;
    }

    if (field === "description") {
      current.description = value.replace(/^"+|"+$/g, "");
      continue;
    }

    if (field === "quantity") {
      current.quantity = value.replace(/^"+|"+$/g, "");
      continue;
    }

    if (field === "sourceimageindex") {
      current.sourceImageIndex = value.replace(/^"+|"+$/g, "");
      continue;
    }

    if (field === "bbox") {
      current.bbox = parseLooseBoundingBox(value);
    }
  }

  flushCurrent();

  return items;
}

function mergeItems(items: AnalysisItem[]): AnalysisItem[] {
  const merged = new Map<string, AnalysisItem>();

  for (const item of items) {
    const key = `${item.name.toLowerCase()}::${item.description.toLowerCase()}`;
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, { ...item });
      continue;
    }

    existing.quantity += item.quantity;

    if (existing.sourceImageIndex === null && item.sourceImageIndex !== null) {
      existing.sourceImageIndex = item.sourceImageIndex;
    }

    if (!existing.bbox && item.bbox) {
      existing.bbox = item.bbox;
    }
  }

  return Array.from(merged.values());
}

export function parseAnalysis(rawResponse: string): AnalysisItem[] {
  const candidate = extractJsonCandidate(rawResponse);

  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("Antwort ist kein JSON-Array.");
    }

    return mergeItems(
      parsed.map(sanitizeAnalysisItem).filter((item): item is AnalysisItem => item !== null),
    );
  } catch {
    const fallbackItems = parseKeyValueAnalysisItems(rawResponse);
    if (fallbackItems.length > 0) {
      return mergeItems(fallbackItems);
    }

    throw new Error("Modell hat kein gueltiges JSON geliefert.");
  }
}
