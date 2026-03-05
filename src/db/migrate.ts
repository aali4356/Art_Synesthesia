/**
 * Database migration runner.
 *
 * Usage (not run via API routes -- only from CLI):
 *   npx tsx src/db/migrate.ts
 *
 * For development: use `drizzle-kit push` to sync schema directly.
 * For production: use `drizzle-kit migrate` in CI/CD pipeline.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
