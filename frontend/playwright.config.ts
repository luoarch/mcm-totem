import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
const isCI = process.env.CI === 'true';

if (!isCI && fs.existsSync(envPath)) {
  process.env.DOTENV_CONFIG_SUPPRESS_LOG = process.env.DOTENV_CONFIG_SUPPRESS_LOG ?? 'true';
  dotenv.config({
    path: envPath,
    override: false,
  });
}

const toWorkers = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export default defineConfig({
  testDir: 'tests/api',
  fullyParallel: false,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: isCI ? [['github'], ['list']] : [['list']],
  workers: toWorkers(process.env.PLAYWRIGHT_WORKERS) ?? 1,
  projects: [
    {
      name: 'contract',
      testMatch: /contract\/.*\.spec\.ts/,
      retries: 0,
    },
    {
      name: 'live',
      testMatch: /live\/.*\.spec\.ts/,
      retries: isCI ? 1 : 0,
    },
  ],
});

