import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { runMigrations } from "./migrate.js";

const dataDirectory = path.resolve(process.cwd(), "data");

mkdirSync(dataDirectory, { recursive: true });

const databasePath = path.join(dataDirectory, "kistenscanner.db");

export const database = new Database(databasePath);

database.pragma("foreign_keys = ON");
database.pragma("journal_mode = WAL");

runMigrations(database);
