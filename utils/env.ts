import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// The environments we have a config/.env.<name> file for
const SUPPORTED_ENVS = ['qa', 'staging'] as const;
type TestEnv = (typeof SUPPORTED_ENVS)[number];

// Project root = one folder up from this file (utils/ -> project root).
// Using this instead of the current folder means the .env file is found
// no matter which folder the tests are started from.
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Step 1: Pick the environment from TEST_ENV, default to 'qa' if not set
const testEnv = (process.env.TEST_ENV || 'qa').trim().toLowerCase();

// Step 2: Stop early if TEST_ENV has a value we don't support (e.g. a typo like 'stagin')
if (!SUPPORTED_ENVS.includes(testEnv as TestEnv)) {
  throw new Error(
    `Unknown TEST_ENV "${testEnv}". Use one of: ${SUPPORTED_ENVS.join(', ')}.`
  );
}

// Step 3: Build the full path to the env file, e.g. <project>/config/.env.qa
const envFilePath = path.join(PROJECT_ROOT, 'config', `.env.${testEnv}`);

// Step 4: Stop with a helpful message if the env file does not exist
if (!fs.existsSync(envFilePath)) {
  throw new Error(
    `Env file not found: ${envFilePath}\n` +
      `Create it by copying config/.env.example and filling in real values.`
  );
}

// Step 5: Load the file's values into process.env (quiet = no console banner).
// Values already set on the machine (e.g. CI secrets) are NOT overwritten.
const result = dotenv.config({ path: envFilePath, quiet: true });
if (result.error) {
  throw new Error(`Could not read env file ${envFilePath}: ${result.error.message}`);
}

// Read one variable; throw a clear error if it is missing or empty
function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required variable "${name}" in ${envFilePath}. ` +
        `See config/.env.example for the expected format.`
    );
  }
  return value;
}

// Step 6: The typed config object. Tests import this - never process.env directly.
export const env = {
  testEnv: testEnv as TestEnv,
  baseUrl: required('BASE_URL'),
  adminUsername: required('ADMIN_USERNAME'),
  adminPassword: required('ADMIN_PASSWORD'),
} as const;
