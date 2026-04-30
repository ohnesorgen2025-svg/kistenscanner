import { database } from "../db/index.js";

export type ActivityKind =
  | "box-created"
  | "box-updated"
  | "item-created"
  | "item-updated"
  | "loan-started"
  | "loan-returned";

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  at: string;
  title: string;
  subtitle: string | null;
  boxId: number | null;
  boxNumber: number | null;
  itemId: number | null;
  thumbnailPath: string | null;
};

type RawRow = {
  kind: ActivityKind;
  rowId: number;
  at: string;
  title: string;
  subtitle: string | null;
  boxId: number | null;
  boxNumber: number | null;
  itemId: number | null;
  thumbnailPath: string | null;
};

const QUERY = `
  SELECT * FROM (
    /* Box created */
    SELECT
      'box-created' AS kind,
      b.id          AS rowId,
      b.created_at  AS at,
      b.name        AS title,
      b.location    AS subtitle,
      b.id          AS boxId,
      b.number      AS boxNumber,
      NULL          AS itemId,
      (
        SELECT 'box:' || bi.path
        FROM images bi
        WHERE bi.box_id = b.id
        ORDER BY bi.taken_at ASC
        LIMIT 1
      ) AS thumbnailPath
    FROM boxes b

    UNION ALL

    /* Box updated (skip if same as created) */
    SELECT
      'box-updated' AS kind,
      b.id, b.updated_at, b.name, b.location, b.id, b.number, NULL,
      (
        SELECT 'box:' || bi.path FROM images bi
        WHERE bi.box_id = b.id ORDER BY bi.taken_at ASC LIMIT 1
      )
    FROM boxes b
    WHERE b.updated_at <> b.created_at

    UNION ALL

    /* Item created */
    SELECT
      'item-created' AS kind,
      i.id, i.created_at,
      i.name, b.name, b.id, b.number, i.id,
      (
        SELECT 'item:' || ii.path FROM item_images ii
        WHERE ii.item_id = i.id
        ORDER BY ii.is_title DESC, ii.id ASC LIMIT 1
      )
    FROM items i
    JOIN boxes b ON b.id = i.box_id

    UNION ALL

    /* Item updated */
    SELECT
      'item-updated' AS kind,
      i.id, i.updated_at,
      i.name, b.name, b.id, b.number, i.id,
      (
        SELECT 'item:' || ii.path FROM item_images ii
        WHERE ii.item_id = i.id
        ORDER BY ii.is_title DESC, ii.id ASC LIMIT 1
      )
    FROM items i
    JOIN boxes b ON b.id = i.box_id
    WHERE i.updated_at <> i.created_at

    UNION ALL

    /* Loan started */
    SELECT
      'loan-started' AS kind,
      l.id, l.lent_date,
      i.name, l.borrower_name, b.id, b.number, i.id,
      (
        SELECT 'item:' || ii.path FROM item_images ii
        WHERE ii.item_id = i.id ORDER BY ii.is_title DESC, ii.id ASC LIMIT 1
      )
    FROM loans l
    JOIN items i ON i.id = l.item_id
    JOIN boxes b ON b.id = i.box_id

    UNION ALL

    /* Loan returned */
    SELECT
      'loan-returned' AS kind,
      l.id, l.returned_date,
      i.name, l.borrower_name, b.id, b.number, i.id,
      (
        SELECT 'item:' || ii.path FROM item_images ii
        WHERE ii.item_id = i.id ORDER BY ii.is_title DESC, ii.id ASC LIMIT 1
      )
    FROM loans l
    JOIN items i ON i.id = l.item_id
    JOIN boxes b ON b.id = i.box_id
    WHERE l.returned_date IS NOT NULL
  )
  ORDER BY at DESC
  LIMIT ?
`;

export function listActivity(limit = 60): ActivityEvent[] {
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit) || 60));
  const rows = database.prepare(QUERY).all(safeLimit) as RawRow[];
  return rows.map((row) => {
    const raw = row.thumbnailPath ?? null;
    let resolved: string | null = null;
    if (raw) {
      // raw looks like "box:<path>" or "item:<path>"; strip the prefix and keep the path as-is
      const sep = raw.indexOf(":");
      const rest = sep > 0 ? raw.slice(sep + 1) : raw;
      resolved = rest.startsWith("/") ? rest : `/${rest}`;
    }
    return {
      id: `${row.kind}-${row.rowId}-${row.at}`,
      kind: row.kind,
      at: row.at,
      title: row.title,
      subtitle: row.subtitle,
      boxId: row.boxId,
      boxNumber: row.boxNumber,
      itemId: row.itemId,
      thumbnailPath: resolved,
    };
  });
}
