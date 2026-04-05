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
  thumbnailPath: string | null;
  sourceImagePath: string | null;
};

export type ContainerType = "box" | "cabinet" | "drawer" | "shelf" | "bag" | "room";

export const CONTAINER_TYPE_LABELS: Record<ContainerType, string> = {
  box: "Kiste",
  cabinet: "Schrank",
  drawer: "Schublade",
  shelf: "Regal",
  bag: "Tasche",
  room: "Raum",
};

export const CONTAINER_TYPE_ICONS: Record<ContainerType, string> = {
  box: "inventory_2",
  cabinet: "door_sliding",
  drawer: "draft",
  shelf: "shelves",
  bag: "shopping_bag",
  room: "door_open",
};

export type ItemImageRecord = {
  id: number;
  itemId: number;
  path: string;
  isTitle: boolean;
};

export type ItemRecord = {
  id: number;
  boxId: number;
  name: string;
  description: string | null;
  quantity: number;
  quantityUnit: string | null;
  detail: string | null;
  titleImageId: number | null;
  thumbnailPath: string | null;
  createdAt: string;
  updatedAt: string;
  images: ItemImageRecord[];
};

export type BoxImageRecord = {
  id: number;
  boxId: number;
  path: string;
  takenAt: string;
};

export type PathSegment = {
  id: number;
  name: string;
  containerType: ContainerType;
};

export type BoxSummary = {
  id: number;
  number: number;
  name: string;
  location: string;
  containerType: ContainerType;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  thumbnailPath: string | null;
};

export type ItemWithBox = ItemRecord & {
  box: BoxSummary;
  path: PathSegment[];
};

export type BoxRecord = BoxSummary & {
  images: BoxImageRecord[];
  items: ItemRecord[];
  children: BoxSummary[];
  path: PathSegment[];
};

export type SearchResult = {
  item: {
    id: number;
    name: string;
    description: string | null;
    detail: string | null;
    quantity: number;
    quantityUnit: string | null;
    thumbnailPath: string | null;
  };
  box: {
    id: number;
    number: number;
    name: string;
    location: string;
  };
  path: PathSegment[];
};

export type ModelSummary = {
  id: string;
  name: string;
  provider: string;
  protocol: string;
  isCustom: boolean;
};

export type SettingsResponse = {
  activeModelId: string;
  configuredProviders: Record<"GEMINI" | "OLLAMA", boolean>;
};

type RequestOptions = RequestInit & {
  rawBody?: BodyInit;
};

export function resolveAssetUrl(assetPath: string | null | undefined): string | null {
  if (!assetPath) {
    return null;
  }

  if (/^https?:\/\//.test(assetPath)) {
    return assetPath;
  }

  return assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    headers,
    body: options.rawBody ?? options.body,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function analyzeBoxImages(modelId: string, files: File[]): Promise<AnalysisItem[]> {
  const formData = new FormData();
  formData.append("modelId", modelId);

  for (const file of files) {
    formData.append("images[]", file);
  }

  return requestJson<AnalysisItem[]>("/api/analyze", {
    method: "POST",
    rawBody: formData,
  });
}

export async function listBoxes(): Promise<BoxSummary[]> {
  return requestJson<BoxSummary[]>("/api/boxes");
}

export async function listLocations(): Promise<string[]> {
  return requestJson<string[]>("/api/boxes/locations");
}

export async function getBoxByNumber(boxNumber: number): Promise<BoxSummary> {
  return requestJson<BoxSummary>(`/api/boxes?number=${boxNumber}`);
}

export async function getBox(boxId: number): Promise<BoxRecord> {
  return requestJson<BoxRecord>(`/api/boxes/${boxId}`);
}

export async function deleteBox(boxId: number): Promise<void> {
  return requestJson<void>(`/api/boxes/${boxId}`, {
    method: "DELETE",
  });
}

export async function searchInventory(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query });
  return requestJson<SearchResult[]>(`/api/search?${params.toString()}`);
}

export async function listModels(): Promise<ModelSummary[]> {
  return requestJson<ModelSummary[]>("/api/models", {
    cache: "no-store",
  });
}

export async function addCustomOllamaModel(modelTag: string): Promise<ModelSummary> {
  return requestJson<ModelSummary>("/api/models/ollama", {
    method: "POST",
    body: JSON.stringify({ modelTag }),
  });
}

export async function removeCustomOllamaModel(modelId: string): Promise<void> {
  return requestJson<void>(`/api/models/ollama/${encodeURIComponent(modelId)}`, {
    method: "DELETE",
  });
}

export async function getSettings(): Promise<SettingsResponse> {
  return requestJson<SettingsResponse>("/api/settings", {
    cache: "no-store",
  });
}

export async function saveActiveModel(modelId: string): Promise<{ activeModelId: string }> {
  return requestJson<{ activeModelId: string }>("/api/settings", {
    method: "POST",
    body: JSON.stringify({ modelId }),
  });
}

export async function saveProviderKeys(payload: Partial<Record<"GEMINI" | "OLLAMA", string>>): Promise<{
  configuredProviders: SettingsResponse["configuredProviders"];
}> {
  return requestJson<{ configuredProviders: SettingsResponse["configuredProviders"] }>("/api/settings/keys", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function testModelConnection(modelId: string): Promise<{ ok: true }> {
  return requestJson<{ ok: true }>("/api/settings/test", {
    method: "POST",
    body: JSON.stringify({ modelId }),
  });
}

export async function createBox(payload: {
  name: string;
  location: string;
  containerType?: ContainerType;
  parentId?: number | null;
  imagePaths?: string[];
}): Promise<BoxRecord> {
  return requestJson<BoxRecord>("/api/boxes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createItem(boxId: number, payload: {
  name: string;
  description: string;
  detail: string;
  quantity?: number;
  quantityUnit?: string | null;
  thumbnailPath?: string | null;
}): Promise<ItemRecord> {
  return requestJson<ItemRecord>(`/api/boxes/${boxId}/items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateItem(
  itemId: number,
  payload: { name?: string; description?: string; detail?: string },
): Promise<ItemRecord> {
  return requestJson<ItemRecord>(`/api/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteItem(itemId: number): Promise<void> {
  return requestJson<void>(`/api/items/${itemId}`, { method: "DELETE" });
}

export async function moveItem(itemId: number, targetBoxId: number): Promise<ItemRecord> {
  return requestJson<ItemRecord>(`/api/items/${itemId}/move`, {
    method: "PATCH",
    body: JSON.stringify({ targetBoxId }),
  });
}

export async function batchMoveItems(itemIds: number[], targetBoxId: number): Promise<{ moved: number }> {
  return requestJson<{ moved: number }>("/api/items/batch-move", {
    method: "POST",
    body: JSON.stringify({ itemIds, targetBoxId }),
  });
}

export async function batchDeleteItems(itemIds: number[]): Promise<{ deleted: number }> {
  return requestJson<{ deleted: number }>("/api/items/batch-delete", {
    method: "POST",
    body: JSON.stringify({ itemIds }),
  });
}

export async function uploadItemImage(itemId: number, file: File): Promise<ItemRecord> {
  const formData = new FormData();
  formData.append("image", file);

  return requestJson<ItemRecord>(`/api/items/${itemId}/images`, {
    method: "POST",
    rawBody: formData,
  });
}

export async function setItemImageAsTitle(itemImageId: number): Promise<ItemRecord> {
  return requestJson<ItemRecord>(`/api/item-images/${itemImageId}/title`, {
    method: "PATCH",
  });
}

// --- AI Features ---

export type RescanResult = {
  added: Array<{
    name: string;
    description: string;
    quantity?: number;
    sourceImageIndex?: number;
    bbox?: { x: number; y: number; width: number; height: number } | null;
  }>;
  improved: Array<{
    name: string;
    description: string;
    sourceImageIndex?: number;
    bbox?: { x: number; y: number; width: number; height: number } | null;
  }>;
  removed: Array<{ name: string }>;
};

export async function rescanBox(boxId: number, modelId: string, files: File[]): Promise<RescanResult> {
  const formData = new FormData();
  formData.append("modelId", modelId);
  for (const file of files) {
    formData.append("images[]", file);
  }
  return requestJson<RescanResult>(`/api/ai/rescan/${boxId}`, {
    method: "POST",
    rawBody: formData,
  });
}

export type SmartSearchResult = {
  id: number;
  name: string;
  description: string | null;
  detail: string | null;
  boxId: number;
  boxName: string;
  boxLocation: string;
  thumbnailPath: string | null;
};

export async function smartSearch(query: string): Promise<SmartSearchResult[]> {
  return requestJson<SmartSearchResult[]>("/api/ai/smart-search", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

export async function visualSearch(files: File[]): Promise<SmartSearchResult[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("images[]", file);
  }
  return requestJson<SmartSearchResult[]>("/api/ai/visual-search", {
    method: "POST",
    rawBody: formData,
  });
}

export type DuplicateGroup = {
  items: Array<{ id: number; boxId: number }>;
  reason: string;
};

export async function detectDuplicates(): Promise<DuplicateGroup[]> {
  return requestJson<DuplicateGroup[]>("/api/ai/duplicates", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export type ReorganizationSuggestion = {
  type: "merge" | "move" | "split";
  description: string;
  involvedBoxIds: number[];
};

export async function getReorganizationSuggestions(): Promise<ReorganizationSuggestion[]> {
  return requestJson<ReorganizationSuggestion[]>("/api/ai/reorganize", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export type InventoryStats = {
  totalBoxes: number;
  totalItems: number;
  totalImages: number;
  recentBoxes: BoxSummary[];
  boxesWithoutItems: number;
  itemsWithoutImage: number;
  locationBreakdown: Array<{ location: string; boxCount: number }>;
};

export async function getInventoryStats(): Promise<InventoryStats> {
  return requestJson<InventoryStats>("/api/ai/stats");
}

// --- Quantity ---

export async function updateItemQuantity(
  itemId: number,
  quantity: number,
  quantityUnit?: string,
): Promise<ItemRecord> {
  return requestJson<ItemRecord>(`/api/items/${itemId}/quantity`, {
    method: "PATCH",
    body: JSON.stringify({ quantity, quantityUnit }),
  });
}

// --- Loans ---

export type LoanRecord = {
  id: number;
  itemId: number;
  itemName: string;
  boxId: number;
  boxName: string;
  borrowerName: string;
  lentDate: string;
  dueDate: string | null;
  returnedDate: string | null;
  notes: string | null;
};

export async function listActiveLoans(): Promise<LoanRecord[]> {
  return requestJson<LoanRecord[]>("/api/loans");
}

export async function getLoansForItem(itemId: number): Promise<LoanRecord[]> {
  return requestJson<LoanRecord[]>(`/api/loans/item/${itemId}`);
}

export async function createLoan(payload: {
  itemId: number;
  borrowerName: string;
  dueDate?: string;
  notes?: string;
}): Promise<LoanRecord> {
  return requestJson<LoanRecord>("/api/loans", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function returnLoan(loanId: number): Promise<LoanRecord> {
  return requestJson<LoanRecord>(`/api/loans/${loanId}/return`, {
    method: "PATCH",
  });
}

// --- Box Update ---

export async function updateBox(
  boxId: number,
  payload: { name?: string; location?: string; containerType?: ContainerType; parentId?: number | null },
): Promise<BoxRecord> {
  return requestJson<BoxRecord>(`/api/boxes/${boxId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// --- Item Detail ---

export async function getItem(itemId: number): Promise<ItemWithBox> {
  return requestJson<ItemWithBox>(`/api/items/${itemId}`);
}

export async function analyzeItemImages(
  itemId: number,
  modelId: string,
  files: File[],
): Promise<ItemRecord> {
  const formData = new FormData();
  formData.append("modelId", modelId);
  for (const file of files) {
    formData.append("images[]", file);
  }
  return requestJson<ItemRecord>(`/api/analyze/item/${itemId}`, {
    method: "POST",
    rawBody: formData,
  });
}

// --- Barcode ---

export type BarcodeResult = {
  found: boolean;
  code: string;
  name?: string;
  brand?: string | null;
  category?: string | null;
  quantity?: string | null;
  imageUrl?: string | null;
};

export async function lookupBarcode(code: string): Promise<BarcodeResult> {
  return requestJson<BarcodeResult>(`/api/barcode/${encodeURIComponent(code)}`);
}
