import test from 'node:test';
import assert from 'node:assert/strict';
import { createAutoReply, shouldAutoReply } from '../lib/auto-reply.js';

test('automatic replies only accept enabled, non-owner direct chat text', () => {
  const accepted = { enabled: true, jid: '15550001111@s.whatsapp.net', body: 'Hello bot', prefix: '.', isOwner: false };
  assert.equal(shouldAutoReply(accepted), true);
  assert.equal(shouldAutoReply({ ...accepted, jid: '15550001111@lid' }), true);
  assert.equal(shouldAutoReply({ ...accepted, enabled: false }), false);
  assert.equal(shouldAutoReply({ ...accepted, isOwner: true }), false);
  assert.equal(shouldAutoReply({ ...accepted, jid: '12345-67890@g.us' }), false);
  assert.equal(shouldAutoReply({ ...accepted, jid: 'status@broadcast' }), false);
  assert.equal(shouldAutoReply({ ...accepted, body: '.ping' }), false);
  assert.equal(shouldAutoReply({ ...accepted, body: 'tesla:item:home' }), false);
  assert.equal(shouldAutoReply({ ...accepted, body: '   ' }), false);
});

test('reply generation sends only the current message and returns the model response', async () => {
  let requestUrl;
  let requestOptions;
  const generate = createAutoReply({
    apiKey: 'test-secret',
    model: 'test-model',
    fetchImpl: async (url, options) => {
      requestUrl = url;
      requestOptions = options;
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Hello from the bot.' } }] })
      };
    }
  });

  const result = await generate('  What is the weather?  ');
  assert.equal(result, 'Hello from the bot.');
  assert.equal(requestUrl, 'https://api.openai.com/v1/chat/completions');
  assert.equal(requestOptions.method, 'POST');
  assert.equal(requestOptions.headers.Authorization, 'Bearer test-secret');
  const payload = JSON.parse(requestOptions.body);
  assert.equal(payload.model, 'test-model');
  assert.equal(payload.messages.length, 2);
  assert.equal(payload.messages[1].content, 'What is the weather?');
  assert.equal(payload.max_tokens, 350);
});

test('reply generation caps input and rejects provider errors without echoing response bodies', async () => {
  let sentText;
  const generate = createAutoReply({
    apiKey: 'test-secret',
    fetchImpl: async (_url, options) => {
      sentText = JSON.parse(options.body).messages[1].content;
      return { ok: false, status: 429, text: async () => 'private provider details' };
    }
  });

  await assert.rejects(generate('x'.repeat(2100)), /OpenAI automatic reply failed \(429\)/);
  assert.equal(sentText.length, 2000);
  assert.throws(() => createAutoReply({ apiKey: '' }), /OPENAI_API_KEY is required/);
});
