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

const GENERIC_ITEM_NAMES = new Set([
  "adapter",
  "akku",
  "behalter",
  "beutel",
  "box",
  "buch",
  "dose",
  "fernbedienung",
  "geraet",
  "gerät",
  "kabel",
  "karte",
  "netzteil",
  "stecker",
  "tasche",
  "teil",
  "werkzeug",
]);

const STOP_WORDS = new Set([
  "a",
  "an",
  "am",
  "an",
  "auf",
  "aus",
  "bei",
  "das",
  "dem",
  "den",
  "der",
  "des",
  "die",
  "ein",
  "eine",
  "einem",
  "einen",
  "einer",
  "eines",
  "fuer",
  "für",
  "im",
  "in",
  "inkl",
  "inklusive",
  "ist",
  "mit",
  "ohne",
  "oder",
  "plus",
  "samt",
  "the",
  "und",
  "vom",
  "von",
  "zum",
  "zur",
]);

const WEAK_DESCRIPTOR_TOKENS = new Set([
  "alt",
  "alte",
  "blau",
  "blaue",
  "blauen",
  "defekt",
  "defekte",
  "gebraucht",
  "gelb",
  "grau",
  "gruen",
  "grün",
  "klein",
  "kleine",
  "kurz",
  "lang",
  "lange",
  "marke",
  "modell",
  "neu",
  "rote",
  "rot",
  "schwarz",
  "schwarze",
  "schwarzen",
  "silber",
  "silbern",
  "weiss",
  "weiße",
  "weisses",
  "weiß",
  "weißen",
  "weiss",
  "weisser",
  "weisses",
  "weissgrau",
  "weißes",
  "weißer",
  "weisslich",
  "weisser",
  "weisses",
  "weisses",
  "weißlich",
  "zustand",
]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function uniqueTokens(tokens: string[]): string[] {
  return Array.from(new Set(tokens));
}

function normalizeName(name: string): string {
  return normalizeText(name);
}

function nameTokens(name: string): string[] {
  return uniqueTokens(tokenize(name).filter((token) => !STOP_WORDS.has(token)));
}

function descriptionTokens(description: string): string[] {
  return uniqueTokens(tokenize(description).filter((token) => !STOP_WORDS.has(token)));
}

function strongDescriptionTokens(description: string): string[] {
  return descriptionTokens(description).filter((token) => !WEAK_DESCRIPTOR_TOKENS.has(token));
}

function tokenSimilarity(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  let overlap = 0;

  for (const token of leftSet) {
    if (rightSet.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(leftSet.size, rightSet.size);
}

function isSubset(left: string[], right: string[]): boolean {
  if (left.length === 0) {
    return true;
  }

  const rightSet = new Set(right);
  return left.every((token) => rightSet.has(token));
}

function isGenericName(name: string): boolean {
  const normalized = normalizeName(name);
  if (GENERIC_ITEM_NAMES.has(normalized)) {
    return true;
  }

  return nameTokens(name).every((token) => GENERIC_ITEM_NAMES.has(token));
}

function bboxIntersectionOverUnion(
  left: AnalysisItemBoundingBox | null,
  right: AnalysisItemBoundingBox | null,
): number {
  if (!left || !right) {
    return 0;
  }

  const x1 = Math.max(left.x, right.x);
  const y1 = Math.max(left.y, right.y);
  const x2 = Math.min(left.x + left.width, right.x + right.width);
  const y2 = Math.min(left.y + left.height, right.y + right.height);
  const intersectionWidth = Math.max(0, x2 - x1);
  const intersectionHeight = Math.max(0, y2 - y1);
  const intersection = intersectionWidth * intersectionHeight;

  if (intersection <= 0) {
    return 0;
  }

  const leftArea = left.width * left.height;
  const rightArea = right.width * right.height;
  const union = leftArea + rightArea - intersection;

  return union > 0 ? intersection / union : 0;
}

function bboxCenterDistance(
  left: AnalysisItemBoundingBox | null,
  right: AnalysisItemBoundingBox | null,
): number {
  if (!left || !right) {
    return Number.POSITIVE_INFINITY;
  }

  const leftCenterX = left.x + left.width / 2;
  const leftCenterY = left.y + left.height / 2;
  const rightCenterX = right.x + right.width / 2;
  const rightCenterY = right.y + right.height / 2;

  return Math.hypot(leftCenterX - rightCenterX, leftCenterY - rightCenterY);
}

function looksLikeSeparateObjectsInSameImage(left: AnalysisItem, right: AnalysisItem): boolean {
  return (
    left.sourceImageIndex !== null &&
    left.sourceImageIndex === right.sourceImageIndex &&
    bboxIntersectionOverUnion(left.bbox, right.bbox) < 0.05 &&
    bboxCenterDistance(left.bbox, right.bbox) > 0.28
  );
}

function choosePreferredItem(left: AnalysisItem, right: AnalysisItem): AnalysisItem {
  const leftStrong = strongDescriptionTokens(left.description).length;
  const rightStrong = strongDescriptionTokens(right.description).length;

  if (rightStrong !== leftStrong) {
    return rightStrong > leftStrong ? right : left;
  }

  if (right.description.length !== left.description.length) {
    return right.description.length > left.description.length ? right : left;
  }

  if (right.bbox && !left.bbox) {
    return right;
  }

  return left;
}

function shouldMergeItems(existing: AnalysisItem, candidate: AnalysisItem): boolean {
  const existingName = normalizeName(existing.name);
  const candidateName = normalizeName(candidate.name);
  const namesEqual = existingName === candidateName;
  const nameSimilarity = tokenSimilarity(nameTokens(existing.name), nameTokens(candidate.name));

  if (!namesEqual && nameSimilarity < 0.8) {
    return false;
  }

  const existingDescription = normalizeText(existing.description);
  const candidateDescription = normalizeText(candidate.description);

  if (existingDescription === candidateDescription) {
    if (looksLikeSeparateObjectsInSameImage(existing, candidate)) {
      return false;
    }

    return true;
  }

  if (!existingDescription || !candidateDescription) {
    return namesEqual && !isGenericName(existing.name);
  }

  const existingStrongDescription = strongDescriptionTokens(existing.description);
  const candidateStrongDescription = strongDescriptionTokens(candidate.description);
  const existingDescriptionTokens = descriptionTokens(existing.description);
  const candidateDescriptionTokens = descriptionTokens(candidate.description);
  const strongSimilarity = tokenSimilarity(existingStrongDescription, candidateStrongDescription);
  const fullSimilarity = tokenSimilarity(existingDescriptionTokens, candidateDescriptionTokens);
  const genericName = isGenericName(existing.name) || isGenericName(candidate.name);

  if (
    (isSubset(existingDescriptionTokens, candidateDescriptionTokens) ||
      isSubset(candidateDescriptionTokens, existingDescriptionTokens)) &&
    fullSimilarity >= 0.5
  ) {
    if (looksLikeSeparateObjectsInSameImage(existing, candidate)) {
      return false;
    }

    return !genericName || existing.sourceImageIndex !== candidate.sourceImageIndex || fullSimilarity >= 0.75;
  }

  if (
    existingStrongDescription.length > 0 &&
    candidateStrongDescription.length > 0 &&
    (isSubset(existingStrongDescription, candidateStrongDescription) ||
      isSubset(candidateStrongDescription, existingStrongDescription))
  ) {
    if (looksLikeSeparateObjectsInSameImage(existing, candidate)) {
      return false;
    }

    return !genericName || strongSimilarity >= 0.5;
  }

  if (genericName) {
    return strongSimilarity >= 0.8 || (strongSimilarity >= 0.6 && fullSimilarity >= 0.75);
  }

  if (namesEqual) {
    return strongSimilarity >= 0.5 || fullSimilarity >= 0.72;
  }

  return nameSimilarity >= 0.9 && strongSimilarity >= 0.6;
}

function mergeTwoItems(existing: AnalysisItem, candidate: AnalysisItem): AnalysisItem {
  const preferred = choosePreferredItem(existing, candidate);
  const fallback = preferred === existing ? candidate : existing;

  return {
    name: preferred.name,
    description: preferred.description || fallback.description,
    quantity: Math.max(existing.quantity, candidate.quantity),
    sourceImageIndex:
      preferred.sourceImageIndex ?? fallback.sourceImageIndex ?? existing.sourceImageIndex,
    bbox: preferred.bbox ?? fallback.bbox ?? existing.bbox,
  };
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
  const merged: AnalysisItem[] = [];

  for (const item of items) {
    const matchIndex = merged.findIndex((existing) => shouldMergeItems(existing, item));

    if (matchIndex === -1) {
      merged.push({ ...item });
      continue;
    }

    merged[matchIndex] = mergeTwoItems(merged[matchIndex]!, item);
  }

  return merged;
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
