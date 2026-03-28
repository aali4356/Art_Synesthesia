import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { resolveDeploymentEnv } from '@/lib/deployment/env';

/**
 * Drizzle client singleton.
 * Uses Neon HTTP driver for Vercel serverless compatibility.
 * DATABASE_URL is optional for local proof builds, but DB-backed routes will
 * surface a truthful unavailable state until a real Neon connection is configured.
 */
let databaseSingleton: ReturnType<typeof drizzle<typeof schema>> | null = null;

function createDatabaseClient() {
  const { databaseUrl } = resolveDeploymentEnv('local-proof');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set for the current local proof mode');
  }

  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export function getDb() {
  if (!databaseSingleton) {
    databaseSingleton = createDatabaseClient();
  }

  return databaseSingleton;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
});

export type Database = ReturnType<typeof drizzle<typeof schema>>;
