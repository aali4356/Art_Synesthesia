import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { resolveDeploymentEnv } from './src/lib/deployment/env';

const contract = resolveDeploymentEnv('migrate');

if (!contract.databaseUrl) {
  throw new Error('[deployment-env] DATABASE_URL should be guaranteed in migrate mode.');
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: contract.databaseUrl,
  },
});
