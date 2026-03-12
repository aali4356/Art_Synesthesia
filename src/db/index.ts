import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Drizzle client singleton.
 * Uses Neon HTTP driver for Vercel serverless compatibility.
 * DATABASE_URL must be set in environment (Neon connection string).
 */
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
export type Database = typeof db;
