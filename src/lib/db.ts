// src/lib/db.ts
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // if your provider requires SSL:
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});