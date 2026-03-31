import type Database from "better-sqlite3";

import { SCHEMA_MIGRATIONS, SCHEMA_TABLES } from "./schema.js";

export function runMigrations(database: Database.Database): void {
  const migrate = database.transaction(() => {
    for (const statement of SCHEMA_TABLES) {
      database.exec(statement);
    }

    for (const migration of SCHEMA_MIGRATIONS) {
      try {
        database.exec(migration);
      } catch {
        // Column already exists — safe to ignore
      }
    }
  });

  migrate();
}
