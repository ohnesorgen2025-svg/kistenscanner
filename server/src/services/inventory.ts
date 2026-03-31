import { database } from "../db/index.js";

export const CONTAINER_TYPES = [
  "box", "cabinet", "drawer", "shelf", "bag", "room",
] as const;
export type ContainerType = (typeof CONTAINER_TYPES)[number];

type BoxRow = {
  id: number;
  number: number;
  name: string;
  location: string;
  containerType: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  thumbnailPath?: string | null;
};

type BoxImageRow = {
  id: number;
  boxId: number;
  path: string;
  takenAt: string;
};

type ItemRow = {
  id: number;
  boxId: number;
  name: string;
  description: string | null;
  detail: string | null;
  quantity: number;
  quantityUnit: string | null;
  titleImageId: number | null;
  createdAt: string;
  updatedAt: string;
  thumbnailPath: string | null;
};

type ItemImageRow = {
  id: number;
  itemId: number;
  path: string;
  isTitle: number;
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
  quantity: number;
  quantityUnit: string | null;
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
  containerType: ContainerType;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  thumbnailPath: string | null;
};

export type BoxRecord = BoxSummary & {
  images: BoxImageRecord[];
  items: ItemRecord[];
  children: BoxSummary[];
  path: PathSegment[];
};

export type PathSegment = {
  id: number;
  name: string;
  containerType: ContainerType;
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

type CreateBoxInput = {
  name: string;
  location: string;
  containerType?: ContainerType;
  parentId?: number | null;
  imagePaths?: string[];
};

type UpdateBoxInput = {
  name?: string;
  location?: string;
  containerType?: ContainerType;
  parentId?: number | null;
};

type CreateItemInput = {
  name: string;
  description?: string | null;
  detail?: string | null;
  quantity?: number;
  quantityUnit?: string | null;
  thumbnailPath?: string | null;
};

type UpdateItemInput = {
  name?: string;
  description?: string | null;
  detail?: string | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeRequiredText(value: string, fieldName: string, maxLength = 255): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} ist erforderlich.`);
  }

  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} darf maximal ${maxLength} Zeichen lang sein.`);
  }

  return normalized;
}

function escapeLikeWildcards(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toItemImageRecord(row: ItemImageRow): ItemImageRecord {
  return {
    id: row.id,
    itemId: row.itemId,
    path: row.path,
    isTitle: row.isTitle === 1,
  };
}

function getItemImages(itemId: number): ItemImageRecord[] {
  const rows = database
    .prepare(
      `
        SELECT
          id,
          item_id AS itemId,
          path,
          is_title AS isTitle
        FROM item_images
        WHERE item_id = ?
        ORDER BY is_title DESC, id ASC
      `,
    )
    .all(itemId) as ItemImageRow[];

  return rows.map(toItemImageRecord);
}

function toItemRecord(row: ItemRow): ItemRecord {
  return {
    id: row.id,
    boxId: row.boxId,
    name: row.name,
    description: row.description,
    detail: row.detail,
    quantity: row.quantity ?? 1,
    quantityUnit: row.quantityUnit ?? null,
    titleImageId: row.titleImageId,
    thumbnailPath: row.thumbnailPath,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    images: getItemImages(row.id),
  };
}

function getItemRecordById(itemId: number): ItemRecord | null {
  const row = database
    .prepare(
      `
        SELECT
          i.id,
          i.box_id AS boxId,
          i.name,
          i.description,
          i.detail,
          i.quantity,
          i.quantity_unit AS quantityUnit,
          i.title_image_id AS titleImageId,
          i.created_at AS createdAt,
          i.updated_at AS updatedAt,
          ti.path AS thumbnailPath
        FROM items i
        LEFT JOIN item_images ti ON ti.id = i.title_image_id
        WHERE i.id = ?
      `,
    )
    .get(itemId) as ItemRow | undefined;

  return row ? toItemRecord(row) : null;
}

function toBoxSummary(row: BoxRow): BoxSummary {
  return {
    id: row.id,
    number: row.number,
    name: row.name,
    location: row.location,
    containerType: (row.containerType || "box") as ContainerType,
    parentId: row.parentId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    itemCount: row.itemCount ?? 0,
    thumbnailPath: row.thumbnailPath ?? null,
  };
}

const BOX_SUMMARY_COLUMNS = `
  b.id,
  b.number,
  b.name,
  b.location,
  b.container_type AS containerType,
  b.parent_id AS parentId,
  b.created_at AS createdAt,
  b.updated_at AS updatedAt,
  COUNT(DISTINCT i.id) AS itemCount,
  COALESCE(
    (
      SELECT ii.path
      FROM items bi
      LEFT JOIN item_images ii ON ii.id = bi.title_image_id
      WHERE bi.box_id = b.id AND ii.path IS NOT NULL
      LIMIT 1
    ),
    (
      SELECT ii2.path
      FROM item_images ii2
      JOIN items bi2 ON bi2.id = ii2.item_id
      WHERE bi2.box_id = b.id
      ORDER BY ii2.is_title DESC, ii2.id ASC
      LIMIT 1
    )
  ) AS thumbnailPath
`;

function getBoxSummaryById(boxId: number): BoxSummary | null {
  const row = database
    .prepare(
      `
        SELECT ${BOX_SUMMARY_COLUMNS}
        FROM boxes b
        LEFT JOIN items i ON i.box_id = b.id
        WHERE b.id = ?
        GROUP BY b.id
      `,
    )
    .get(boxId) as BoxRow | undefined;

  return row ? toBoxSummary(row) : null;
}

function getBoxSummaryByNumber(boxNumber: number): BoxSummary | null {
  const row = database
    .prepare(
      `
        SELECT ${BOX_SUMMARY_COLUMNS}
        FROM boxes b
        LEFT JOIN items i ON i.box_id = b.id
        WHERE b.number = ?
        GROUP BY b.id
      `,
    )
    .get(boxNumber) as BoxRow | undefined;

  return row ? toBoxSummary(row) : null;
}

function requireBoxSummary(boxId: number): BoxSummary {
  const box = getBoxSummaryById(boxId);
  if (!box) {
    throw new Error("Box nicht gefunden.");
  }

  return box;
}

function requireItemRecord(itemId: number): ItemRecord {
  const item = getItemRecordById(itemId);
  if (!item) {
    throw new Error("Item nicht gefunden.");
  }

  return item;
}

export type ItemWithBox = ItemRecord & {
  box: BoxSummary;
  path: PathSegment[];
};

export function getItemWithBox(itemId: number): ItemWithBox {
  const item = requireItemRecord(itemId);
  const box = requireBoxSummary(item.boxId);
  const containerPath = getContainerPath(item.boxId);

  return { ...item, box, path: containerPath };
}

export function listBoxes(): BoxSummary[] {
  const rows = database
    .prepare(
      `
        SELECT ${BOX_SUMMARY_COLUMNS}
        FROM boxes b
        LEFT JOIN items i ON i.box_id = b.id
        GROUP BY b.id
        ORDER BY b.number DESC
      `,
    )
    .all() as BoxRow[];

  return rows.map(toBoxSummary);
}

export function getBoxByNumber(boxNumber: number): BoxSummary | null {
  return getBoxSummaryByNumber(boxNumber);
}

/** Build the ancestor path for a container (walks parent_id up to root). */
export function getContainerPath(boxId: number): PathSegment[] {
  const path: PathSegment[] = [];
  let currentId: number | null = boxId;

  while (currentId !== null) {
    const row = database
      .prepare("SELECT id, name, container_type AS containerType, parent_id AS parentId FROM boxes WHERE id = ?")
      .get(currentId) as { id: number; name: string; containerType: string; parentId: number | null } | undefined;

    if (!row) break;
    path.unshift({ id: row.id, name: row.name, containerType: (row.containerType || "box") as ContainerType });
    currentId = row.parentId;

    // Safety: prevent infinite loops
    if (path.length > 20) break;
  }

  return path;
}

/** Get direct children of a container. */
function getChildren(boxId: number): BoxSummary[] {
  const rows = database
    .prepare(
      `
        SELECT ${BOX_SUMMARY_COLUMNS}
        FROM boxes b
        LEFT JOIN items i ON i.box_id = b.id
        WHERE b.parent_id = ?
        GROUP BY b.id
        ORDER BY b.name ASC
      `,
    )
    .all(boxId) as BoxRow[];

  return rows.map(toBoxSummary);
}

export function searchItems(query: string): SearchResult[] {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) {
    return [];
  }

  const likeQuery = `%${escapeLikeWildcards(normalizedQuery)}%`;
  const rows = database
    .prepare(
      `
        SELECT
          i.id AS itemId,
          i.name AS itemName,
          i.description AS itemDescription,
          i.detail AS itemDetail,
          i.quantity AS itemQuantity,
          i.quantity_unit AS itemQuantityUnit,
          ti.path AS thumbnailPath,
          b.id AS boxId,
          b.number AS boxNumber,
          b.name AS boxName,
          b.location AS boxLocation
        FROM items i
        JOIN boxes b ON b.id = i.box_id
        LEFT JOIN item_images ti ON ti.id = i.title_image_id
        WHERE i.name LIKE ? COLLATE NOCASE
           OR COALESCE(i.description, '') LIKE ? COLLATE NOCASE
           OR COALESCE(i.detail, '') LIKE ? COLLATE NOCASE
        ORDER BY b.number DESC, i.id ASC
        LIMIT 25
      `,
    )
    .all(likeQuery, likeQuery, likeQuery) as Array<{
      itemId: number;
      itemName: string;
      itemDescription: string | null;
      itemDetail: string | null;
      itemQuantity: number;
      itemQuantityUnit: string | null;
      thumbnailPath: string | null;
      boxId: number;
      boxNumber: number;
      boxName: string;
      boxLocation: string;
    }>;

  return rows.map((row) => ({
    item: {
      id: row.itemId,
      name: row.itemName,
      description: row.itemDescription,
      detail: row.itemDetail,
      quantity: row.itemQuantity ?? 1,
      quantityUnit: row.itemQuantityUnit ?? null,
      thumbnailPath: row.thumbnailPath,
    },
    box: {
      id: row.boxId,
      number: row.boxNumber,
      name: row.boxName,
      location: row.boxLocation,
    },
    path: getContainerPath(row.boxId),
  }));
}

export function getBoxById(boxId: number): BoxRecord | null {
  const box = getBoxSummaryById(boxId);
  if (!box) {
    return null;
  }

  const imageRows = database
    .prepare(
      `
        SELECT
          id,
          box_id AS boxId,
          path,
          taken_at AS takenAt
        FROM images
        WHERE box_id = ?
        ORDER BY id ASC
      `,
    )
    .all(boxId) as BoxImageRow[];

  const itemRows = database
    .prepare(
      `
        SELECT
          i.id,
          i.box_id AS boxId,
          i.name,
          i.description,
          i.detail,
          i.quantity,
          i.quantity_unit AS quantityUnit,
          i.title_image_id AS titleImageId,
          i.created_at AS createdAt,
          i.updated_at AS updatedAt,
          ti.path AS thumbnailPath
        FROM items i
        LEFT JOIN item_images ti ON ti.id = i.title_image_id
        WHERE i.box_id = ?
        ORDER BY i.id ASC
      `,
    )
    .all(boxId) as ItemRow[];

  return {
    ...box,
    images: imageRows.map((row) => ({
      id: row.id,
      boxId: row.boxId,
      path: row.path,
      takenAt: row.takenAt,
    })),
    items: itemRows.map(toItemRecord),
    children: getChildren(boxId),
    path: getContainerPath(boxId),
  };
}

export function createBox(input: CreateBoxInput): BoxRecord {
  const now = nowIso();
  const normalizedName = normalizeRequiredText(input.name, "name");
  const normalizedLocation = normalizeRequiredText(input.location, "location");
  const imagePaths = (input.imagePaths ?? []).map((path) => path.trim()).filter(Boolean);

  const create = database.transaction(() => {
    const nextNumberRow = database
      .prepare("SELECT COALESCE(MAX(number), 0) + 1 AS nextNumber FROM boxes")
      .get() as { nextNumber: number };

    const insertResult = database
      .prepare(
        `
          INSERT INTO boxes (number, name, location, container_type, parent_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(nextNumberRow.nextNumber, normalizedName, normalizedLocation, input.containerType ?? "box", input.parentId ?? null, now, now);

    const boxId = Number(insertResult.lastInsertRowid);

    if (imagePaths.length > 0) {
      const insertImage = database.prepare(
        `
          INSERT INTO images (box_id, path, taken_at)
          VALUES (?, ?, ?)
        `,
      );

      for (const imagePath of imagePaths) {
        insertImage.run(boxId, imagePath, now);
      }
    }

    return boxId;
  });

  const boxId = create();
  return requireBoxSummary(boxId) && (getBoxById(boxId) as BoxRecord);
}

export function updateBox(boxId: number, input: UpdateBoxInput): BoxRecord {
  requireBoxSummary(boxId);

  const updates: string[] = [];
  const values: Array<number | string | null> = [];

  if (typeof input.name === "string") {
    updates.push("name = ?");
    values.push(normalizeRequiredText(input.name, "name"));
  }

  if (typeof input.location === "string") {
    updates.push("location = ?");
    values.push(normalizeRequiredText(input.location, "location"));
  }

  if (typeof input.containerType === "string") {
    updates.push("container_type = ?");
    values.push(input.containerType);
  }

  if ("parentId" in input) {
    updates.push("parent_id = ?");
    values.push(input.parentId ?? null);
  }

  if (updates.length === 0) {
    return getBoxById(boxId) as BoxRecord;
  }

  updates.push("updated_at = ?");
  values.push(nowIso(), boxId);

  database
    .prepare(`UPDATE boxes SET ${updates.join(", ")} WHERE id = ?`)
    .run(...values);

  return getBoxById(boxId) as BoxRecord;
}

export function deleteBox(boxId: number): void {
  requireBoxSummary(boxId);

  const remove = database.transaction(() => {
    // Detach child containers
    database.prepare("UPDATE boxes SET parent_id = NULL WHERE parent_id = ?").run(boxId);

    const itemIds = database
      .prepare("SELECT id FROM items WHERE box_id = ?")
      .all(boxId) as Array<{ id: number }>;

    const deleteItemImages = database.prepare("DELETE FROM item_images WHERE item_id = ?");
    const deleteLoans = database.prepare("DELETE FROM loans WHERE item_id = ?");
    for (const item of itemIds) {
      deleteItemImages.run(item.id);
      deleteLoans.run(item.id);
    }

    database.prepare("DELETE FROM items WHERE box_id = ?").run(boxId);
    database.prepare("DELETE FROM images WHERE box_id = ?").run(boxId);
    database.prepare("DELETE FROM boxes WHERE id = ?").run(boxId);
  });

  remove();
}

export function createItem(boxId: number, input: CreateItemInput): ItemRecord {
  requireBoxSummary(boxId);

  const now = nowIso();
  const normalizedName = normalizeRequiredText(input.name, "name");
  const description = normalizeOptionalText(input.description);
  const detail = normalizeOptionalText(input.detail);
  const thumbnailPath = normalizeOptionalText(input.thumbnailPath);

  const create = database.transaction(() => {
    const quantity = typeof input.quantity === "number" && input.quantity >= 1 ? Math.floor(input.quantity) : 1;
    const quantityUnit = normalizeOptionalText(input.quantityUnit);

    const insertItem = database
      .prepare(
        `
          INSERT INTO items (box_id, name, description, detail, quantity, quantity_unit, title_image_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
        `,
      )
      .run(boxId, normalizedName, description, detail, quantity, quantityUnit, now, now);

    const itemId = Number(insertItem.lastInsertRowid);

    if (thumbnailPath) {
      const insertImage = database
        .prepare(
          `
            INSERT INTO item_images (item_id, path, is_title)
            VALUES (?, ?, 1)
          `,
        )
        .run(itemId, thumbnailPath);

      const titleImageId = Number(insertImage.lastInsertRowid);
      database
        .prepare("UPDATE items SET title_image_id = ?, updated_at = ? WHERE id = ?")
        .run(titleImageId, now, itemId);
    }

    return itemId;
  });

  const itemId = create();
  return requireItemRecord(itemId);
}

export function updateItem(itemId: number, input: UpdateItemInput): ItemRecord {
  requireItemRecord(itemId);

  const updates: string[] = [];
  const values: Array<number | string | null> = [];

  if (typeof input.name === "string") {
    updates.push("name = ?");
    values.push(normalizeRequiredText(input.name, "name"));
  }

  if ("description" in input) {
    updates.push("description = ?");
    values.push(normalizeOptionalText(input.description));
  }

  if ("detail" in input) {
    updates.push("detail = ?");
    values.push(normalizeOptionalText(input.detail));
  }

  if (updates.length === 0) {
    return requireItemRecord(itemId);
  }

  updates.push("updated_at = ?");
  values.push(nowIso(), itemId);

  database
    .prepare(`UPDATE items SET ${updates.join(", ")} WHERE id = ?`)
    .run(...values);

  return requireItemRecord(itemId);
}

export function deleteItem(itemId: number): void {
  requireItemRecord(itemId);

  const remove = database.transaction(() => {
    database.prepare("DELETE FROM item_images WHERE item_id = ?").run(itemId);
    database.prepare("DELETE FROM items WHERE id = ?").run(itemId);
  });

  remove();
}

export function moveItem(itemId: number, targetBoxId: number): ItemRecord {
  requireItemRecord(itemId);
  requireBoxSummary(targetBoxId);

  database
    .prepare("UPDATE items SET box_id = ?, updated_at = ? WHERE id = ?")
    .run(targetBoxId, nowIso(), itemId);

  return requireItemRecord(itemId);
}

export function batchMoveItems(itemIds: number[], targetBoxId: number): void {
  requireBoxSummary(targetBoxId);
  const now = nowIso();

  const move = database.transaction(() => {
    const stmt = database.prepare("UPDATE items SET box_id = ?, updated_at = ? WHERE id = ?");
    for (const itemId of itemIds) {
      requireItemRecord(itemId);
      stmt.run(targetBoxId, now, itemId);
    }
  });

  move();
}

export function batchDeleteItems(itemIds: number[]): void {
  const remove = database.transaction(() => {
    const deleteImages = database.prepare("DELETE FROM item_images WHERE item_id = ?");
    const deleteLoans = database.prepare("DELETE FROM loans WHERE item_id = ?");
    const deleteItem = database.prepare("DELETE FROM items WHERE id = ?");

    for (const itemId of itemIds) {
      requireItemRecord(itemId);
      deleteImages.run(itemId);
      deleteLoans.run(itemId);
      deleteItem.run(itemId);
    }
  });

  remove();
}

export function addItemImage(itemId: number, imagePath: string): ItemRecord {
  const item = requireItemRecord(itemId);
  const now = nowIso();

  const add = database.transaction(() => {
    const insertImage = database
      .prepare(
        `
          INSERT INTO item_images (item_id, path, is_title)
          VALUES (?, ?, ?)
        `,
      )
      .run(itemId, imagePath, item.titleImageId ? 0 : 1);

    if (!item.titleImageId) {
      const imageId = Number(insertImage.lastInsertRowid);
      database
        .prepare("UPDATE items SET title_image_id = ?, updated_at = ? WHERE id = ?")
        .run(imageId, now, itemId);
    } else {
      database.prepare("UPDATE items SET updated_at = ? WHERE id = ?").run(now, itemId);
    }
  });

  add();
  return requireItemRecord(itemId);
}

export function setTitleImage(itemImageId: number): ItemRecord {
  const row = database
    .prepare("SELECT id, item_id AS itemId FROM item_images WHERE id = ?")
    .get(itemImageId) as { id: number; itemId: number } | undefined;

  if (!row) {
    throw new Error("Item-Bild nicht gefunden.");
  }

  const now = nowIso();
  const update = database.transaction(() => {
    database.prepare("UPDATE item_images SET is_title = 0 WHERE item_id = ?").run(row.itemId);
    database.prepare("UPDATE item_images SET is_title = 1 WHERE id = ?").run(itemImageId);
    database
      .prepare("UPDATE items SET title_image_id = ?, updated_at = ? WHERE id = ?")
      .run(itemImageId, now, row.itemId);
  });

  update();
  return requireItemRecord(row.itemId);
}

export type FlatItem = {
  id: number;
  name: string;
  description: string | null;
  detail: string | null;
  boxId: number;
  boxName: string;
  boxLocation: string;
  thumbnailPath: string | null;
};

export function listAllItemsFlat(): FlatItem[] {
  const rows = database
    .prepare(
      `
        SELECT
          i.id,
          i.name,
          i.description,
          i.detail,
          b.id AS boxId,
          b.name AS boxName,
          b.location AS boxLocation,
          ti.path AS thumbnailPath
        FROM items i
        JOIN boxes b ON b.id = i.box_id
        LEFT JOIN item_images ti ON ti.id = i.title_image_id
        ORDER BY b.number DESC, i.id ASC
      `,
    )
    .all() as FlatItem[];

  return rows;
}

export type BoxWithItems = {
  id: number;
  number: number;
  name: string;
  location: string;
  items: Array<{ name: string; description: string | null }>;
};

export function listBoxesWithItems(): BoxWithItems[] {
  const boxes = listBoxes();

  return boxes.map((box) => {
    const items = database
      .prepare("SELECT name, description FROM items WHERE box_id = ? ORDER BY id ASC")
      .all(box.id) as Array<{ name: string; description: string | null }>;

    return {
      id: box.id,
      number: box.number,
      name: box.name,
      location: box.location,
      items,
    };
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

export function getInventoryStats(): InventoryStats {
  const totalBoxes = (
    database.prepare("SELECT COUNT(*) AS count FROM boxes").get() as { count: number }
  ).count;

  const totalItems = (
    database.prepare("SELECT COUNT(*) AS count FROM items").get() as { count: number }
  ).count;

  const totalImages = (
    database.prepare("SELECT COUNT(*) AS count FROM item_images").get() as { count: number }
  ).count;

  const boxesWithoutItems = (
    database
      .prepare(
        "SELECT COUNT(*) AS count FROM boxes WHERE id NOT IN (SELECT DISTINCT box_id FROM items)",
      )
      .get() as { count: number }
  ).count;

  const itemsWithoutImage = (
    database
      .prepare("SELECT COUNT(*) AS count FROM items WHERE title_image_id IS NULL")
      .get() as { count: number }
  ).count;

  const recentBoxes = database
    .prepare(
      `
        SELECT ${BOX_SUMMARY_COLUMNS}
        FROM boxes b
        LEFT JOIN items i ON i.box_id = b.id
        GROUP BY b.id
        ORDER BY b.updated_at DESC
        LIMIT 5
      `,
    )
    .all() as BoxRow[];

  const locationRows = database
    .prepare(
      `
        SELECT location, COUNT(*) AS boxCount
        FROM boxes
        GROUP BY location
        ORDER BY boxCount DESC
      `,
    )
    .all() as Array<{ location: string; boxCount: number }>;

  return {
    totalBoxes,
    totalItems,
    totalImages,
    recentBoxes: recentBoxes.map(toBoxSummary),
    boxesWithoutItems,
    itemsWithoutImage,
    locationBreakdown: locationRows,
  };
}

// ─── Quantity Tracking ───

export function updateItemQuantity(
  itemId: number,
  quantity: number,
  quantityUnit?: string | null,
): ItemRecord {
  requireItemRecord(itemId);

  const safeQuantity = Math.max(0, Math.floor(quantity));
  const updates = ["quantity = ?", "updated_at = ?"];
  const values: Array<number | string | null> = [safeQuantity, nowIso()];

  if (quantityUnit !== undefined) {
    updates.push("quantity_unit = ?");
    values.push(normalizeOptionalText(quantityUnit));
  }

  values.push(itemId);
  database
    .prepare(`UPDATE items SET ${updates.join(", ")} WHERE id = ?`)
    .run(...values);

  return requireItemRecord(itemId);
}

// ─── Loan Tracking ───

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

type LoanRow = {
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

const LOAN_COLUMNS = `
  l.id,
  l.item_id AS itemId,
  i.name AS itemName,
  b.id AS boxId,
  b.name AS boxName,
  l.borrower_name AS borrowerName,
  l.lent_date AS lentDate,
  l.due_date AS dueDate,
  l.returned_date AS returnedDate,
  l.notes
`;

function toLoanRecord(row: LoanRow): LoanRecord {
  return { ...row };
}

export function createLoan(input: {
  itemId: number;
  borrowerName: string;
  dueDate?: string | null;
  notes?: string | null;
}): LoanRecord {
  requireItemRecord(input.itemId);
  const borrower = normalizeRequiredText(input.borrowerName, "borrowerName");
  const now = nowIso();

  const result = database
    .prepare(
      `INSERT INTO loans (item_id, borrower_name, lent_date, due_date, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.itemId,
      borrower,
      now,
      normalizeOptionalText(input.dueDate),
      normalizeOptionalText(input.notes),
      now,
    );

  const loanId = Number(result.lastInsertRowid);
  return getLoanById(loanId)!;
}

function getLoanById(loanId: number): LoanRecord | null {
  const row = database
    .prepare(
      `SELECT ${LOAN_COLUMNS}
       FROM loans l
       JOIN items i ON i.id = l.item_id
       JOIN boxes b ON b.id = i.box_id
       WHERE l.id = ?`,
    )
    .get(loanId) as LoanRow | undefined;

  return row ? toLoanRecord(row) : null;
}

export function returnLoan(loanId: number): LoanRecord {
  const loan = getLoanById(loanId);
  if (!loan) throw new Error("Ausleihe nicht gefunden.");
  if (loan.returnedDate) throw new Error("Bereits zurückgegeben.");

  database
    .prepare("UPDATE loans SET returned_date = ? WHERE id = ?")
    .run(nowIso(), loanId);

  return getLoanById(loanId)!;
}

export function listActiveLoans(): LoanRecord[] {
  const rows = database
    .prepare(
      `SELECT ${LOAN_COLUMNS}
       FROM loans l
       JOIN items i ON i.id = l.item_id
       JOIN boxes b ON b.id = i.box_id
       WHERE l.returned_date IS NULL
       ORDER BY l.lent_date DESC`,
    )
    .all() as LoanRow[];

  return rows.map(toLoanRecord);
}

export function getActiveLoansForItem(itemId: number): LoanRecord[] {
  const rows = database
    .prepare(
      `SELECT ${LOAN_COLUMNS}
       FROM loans l
       JOIN items i ON i.id = l.item_id
       JOIN boxes b ON b.id = i.box_id
       WHERE l.item_id = ? AND l.returned_date IS NULL
       ORDER BY l.lent_date DESC`,
    )
    .all(itemId) as LoanRow[];

  return rows.map(toLoanRecord);
}

/** List all distinct locations used across containers. */
export function listLocations(): string[] {
  const rows = database
    .prepare("SELECT DISTINCT location FROM boxes ORDER BY location COLLATE NOCASE ASC")
    .all() as Array<{ location: string }>;
  return rows.map((r) => r.location);
}

/** List all containers that have no parent (root level). */
export function listRootContainers(): BoxSummary[] {
  const rows = database
    .prepare(
      `SELECT ${BOX_SUMMARY_COLUMNS}
       FROM boxes b
       LEFT JOIN items i ON i.box_id = b.id
       WHERE b.parent_id IS NULL
       GROUP BY b.id
       ORDER BY b.name ASC`,
    )
    .all() as BoxRow[];

  return rows.map(toBoxSummary);
}
