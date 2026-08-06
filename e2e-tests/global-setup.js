import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function globalSetup() {
  // This suite logs in as admin multiple times per run (each spec calls
  // loginAsAdmin independently). Clear the backend's login rate-limit
  // buckets first so repeated local test runs never trip the same limiter
  // a real brute-force attempt would (mirrors backend/tests/run.php's setup).
  const backendDir = path.resolve(__dirname, '..', 'backend');
  try {
    execSync(
      'php -r "require \'config/database.php\'; Database::connection()->exec(\'DELETE FROM rate_limits\');"',
      { cwd: backendDir, stdio: 'ignore' }
    );
  } catch {
    // Best-effort — if this fails (e.g. php not on PATH in this shell), the
    // tests still run, just possibly subject to leftover rate-limit state.
  }
}
