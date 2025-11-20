// src/lib/db.ts
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({
  connectionString,
  // Neon uses sslmode=require in the URL, so this is usually enough.
  // If you ever need explicit SSL:
  // ssl: { rejectUnauthorized: false },
});