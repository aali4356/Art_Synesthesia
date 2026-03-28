#!/usr/bin/env node

import { spawn } from 'node:child_process';

const childModule = `
import { runDeploymentSmokeCliFromSerializedArgs } from './src/lib/deployment/smoke.ts';
const exitCode = await runDeploymentSmokeCliFromSerializedArgs(process.env.DEPLOYMENT_SMOKE_ARGS_JSON ?? '[]', process.env);
process.exitCode = exitCode;
`;

const child = spawn(
  process.execPath,
  ['--no-warnings', '--experimental-strip-types', '--input-type=module', '-e', childModule],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      DEPLOYMENT_SMOKE_ARGS_JSON: JSON.stringify(process.argv.slice(2)),
    },
  },
);

child.on('error', (error) => {
  console.error('[deployment-smoke] wrapper failure:', error instanceof Error ? error.message : error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`[deployment-smoke] wrapper terminated by signal ${signal}`);
    process.exit(1);
  }

  process.exit(code ?? 1);
});
