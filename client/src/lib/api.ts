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

export type BoxSummary = {
  id: number;
  number: number;
  name: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  thumbnailPath: string | null;
};

export type BoxRecord = BoxSummary & {
  images: BoxImageRecord[];
  items: ItemRecord[];
};

type RequestOptions = RequestInit & {
  rawBody?: BodyInit;
};

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

export async function getBox(boxId: number): Promise<BoxRecord> {
  return requestJson<BoxRecord>(`/api/boxes/${boxId}`);
}

export async function createBox(payload: {
  name: string;
  location: string;
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
