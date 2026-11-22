import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const botDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const probe = `import {config} from './config.js'; console.log(JSON.stringify({sessionId:config.sessionId,authNamespace:config.authNamespace}));`;

function loadConfig(sessionId) {
  return spawnSync(process.execPath, ['--input-type=module', '-e', probe], {
    cwd: botDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      DATABASE_URL: 'postgres://test:test@127.0.0.1:5432/test',
      OWNER_NUMBERS: '15551234567',
      BOT_MODE: 'private',
      SESSION_ID: sessionId
    }
  });
}

test('an unset SESSION_ID keeps the legacy PostgreSQL auth namespace', () => {
  const result = loadConfig('');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { sessionId: '', authNamespace: 'auth' });
});

test('SESSION_ID selects a separate stable auth namespace', () => {
  const result = loadConfig('tesla_wa-2');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { sessionId: 'tesla_wa-2', authNamespace: 'auth:tesla_wa-2' });
});

test('SESSION_ID rejects namespace separators and values longer than 64 characters', () => {
  for (const value of ['bad:value', 'x'.repeat(65)]) {
    const result = loadConfig(value);
    assert.notEqual(result.status, 0, value);
    assert.match(result.stderr, /SESSION_ID must be 1–64/);
  }
});
