/**
 * Database migration runner.
 *
 * Usage (not run via API routes -- only from CLI):
 *   node --experimental-strip-types src/db/migrate.ts
 *
 * For development: use `drizzle-kit push` to sync schema directly.
 * For production: use the checked-in `npm run db:migrate` path.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

async function loadDeploymentEnvModule() {
  // @ts-expect-error Node strip-types requires the explicit .ts suffix for runtime import.
  return import('../lib/deployment/env.ts');
}

async function main() {
  const { resolveDeploymentEnv, runDeploymentPreflight } = await loadDeploymentEnvModule();

  runDeploymentPreflight('migrate');
  const { databaseUrl } = resolveDeploymentEnv('migrate');

  if (!databaseUrl) {
    throw new Error('[deployment-env] DATABASE_URL should be guaranteed in migrate mode.');
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  console.log('[db:migrate] running migrations');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('[db:migrate] migrations complete');
}

main().catch((err) => {
  console.error('[db:migrate] migration failed:', err);
  process.exit(1);
});
