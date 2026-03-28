import type Database from "better-sqlite3";

import { SCHEMA_TABLES } from "./schema.js";

export function runMigrations(database: Database.Database): void {
  const migrate = database.transaction(() => {
    for (const statement of SCHEMA_TABLES) {
      database.exec(statement);
    }
  });

  migrate();
}
