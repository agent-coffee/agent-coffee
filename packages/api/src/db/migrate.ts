/**
 * Migration script
 *
 * Run with: pnpm db:push
 * Reads schema.sql and runs it against the database.
 * Safe to run multiple times (all statements use IF NOT EXISTS).
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");

await db.unsafe(schema);
console.log("Database schema applied.");
await db.end();
