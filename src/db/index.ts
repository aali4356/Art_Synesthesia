import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Drizzle client singleton.
 * Uses Neon HTTP driver for Vercel serverless compatibility.
 * DATABASE_URL must be set in environment (Neon connection string).
 */
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
export type Database = typeof db;
