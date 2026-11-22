import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const botDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const probe = `import {config} from './config.js'; console.log(JSON.stringify({sessionId:config.sessionId,authNamespace:config.authNamespace,autoReply:config.autoReply}));`;

function loadConfig(sessionId = '', { autoReply = 'false', openAiKey = '' } = {}) {
  return spawnSync(process.execPath, ['--input-type=module', '-e', probe], {
    cwd: botDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      DATABASE_URL: 'postgres://test:test@127.0.0.1:5432/test',
      OWNER_NUMBERS: '15551234567',
      BOT_MODE: 'private',
      SESSION_ID: sessionId,
      AUTO_REPLY: autoReply,
      OPENAI_API_KEY: openAiKey
    }
  });
}

test('an unset SESSION_ID keeps the legacy PostgreSQL auth namespace and auto-reply defaults off', () => {
  const result = loadConfig('');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { sessionId: '', authNamespace: 'auth', autoReply: false });
});

test('SESSION_ID selects a separate stable auth namespace', () => {
  const result = loadConfig('tesla_wa-2');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { sessionId: 'tesla_wa-2', authNamespace: 'auth:tesla_wa-2', autoReply: false });
});

test('SESSION_ID rejects namespace separators and values longer than 64 characters', () => {
  for (const value of ['bad:value', 'x'.repeat(65)]) {
    const result = loadConfig(value);
    assert.notEqual(result.status, 0, value);
    assert.match(result.stderr, /SESSION_ID must be 1–64/);
  }
});

test('AUTO_REPLY=true requires an OpenAI API key', () => {
  const result = loadConfig('', { autoReply: 'true' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /AUTO_REPLY=true requires OPENAI_API_KEY/);
});

test('AUTO_REPLY accepts true with an OpenAI API key', () => {
  const result = loadConfig('', { autoReply: 'true', openAiKey: 'test-key' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { sessionId: '', authNamespace: 'auth', autoReply: true });
});

test('AUTO_REPLY rejects non-boolean values', () => {
  const result = loadConfig('', { autoReply: 'sometimes' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /AUTO_REPLY must be true or false/);
});
