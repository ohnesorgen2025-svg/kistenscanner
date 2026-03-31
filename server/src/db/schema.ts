export const CREATE_BOXES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS boxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    container_type TEXT NOT NULL DEFAULT 'box',
    parent_id INTEGER REFERENCES boxes(id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export const CREATE_ITEMS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    box_id INTEGER NOT NULL REFERENCES boxes(id),
    name TEXT NOT NULL,
    description TEXT,
    detail TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    quantity_unit TEXT,
    title_image_id INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export const CREATE_IMAGES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    box_id INTEGER NOT NULL REFERENCES boxes(id),
    path TEXT NOT NULL,
    taken_at TEXT NOT NULL
  );
`;

export const CREATE_ITEM_IMAGES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS item_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES items(id),
    path TEXT NOT NULL,
    is_title INTEGER NOT NULL DEFAULT 0
  );
`;

export const CREATE_LOANS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES items(id),
    borrower_name TEXT NOT NULL,
    lent_date TEXT NOT NULL,
    due_date TEXT,
    returned_date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
  );
`;

export const SCHEMA_TABLES = [
  CREATE_BOXES_TABLE_SQL,
  CREATE_ITEMS_TABLE_SQL,
  CREATE_IMAGES_TABLE_SQL,
  CREATE_ITEM_IMAGES_TABLE_SQL,
  CREATE_LOANS_TABLE_SQL,
];

/** Migrations for adding columns to existing databases. */
export const SCHEMA_MIGRATIONS = [
  "ALTER TABLE boxes ADD COLUMN container_type TEXT NOT NULL DEFAULT 'box'",
  "ALTER TABLE boxes ADD COLUMN parent_id INTEGER REFERENCES boxes(id)",
  "ALTER TABLE items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE items ADD COLUMN quantity_unit TEXT",
];
