/**
 * Database client
 *
 * `postgres` is a lightweight Postgres driver for Node.js.
 * We create one connection pool that's shared across the whole app.
 * DATABASE_URL comes from the .env file (Neon gives you this string).
 */

import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const db = postgres(process.env.DATABASE_URL, {
  ssl: "require", // Neon requires SSL
  max: 10,        // max 10 concurrent connections
});
