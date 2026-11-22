const DIRECT_CHAT_SUFFIXES = ['@s.whatsapp.net', '@lid'];
const MAX_INPUT_LENGTH = 2000;

export function shouldAutoReply({ enabled, jid, body, prefix = '.', isOwner = false }) {
  const text = String(body || '').trim();
  return Boolean(
    enabled &&
    !isOwner &&
    DIRECT_CHAT_SUFFIXES.some(suffix => jid?.endsWith(suffix)) &&
    text &&
    !text.startsWith(prefix) &&
    !text.startsWith('tesla:item:')
  );
}

export function createAutoReply({ apiKey, model = 'gpt-4o-mini', fetchImpl = globalThis.fetch }) {
  if (!apiKey) throw new Error('OPENAI_API_KEY is required for automatic replies.');
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required for automatic replies.');

  return async function generateReply(messageText) {
    const text = String(messageText || '').trim().slice(0, MAX_INPUT_LENGTH);
    if (!text) return '';

    const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are TESLA MINI BOT, a concise WhatsApp assistant. Respond to the current message only. Do not claim to take external actions or access private account data.'
          },
          { role: 'user', content: text }
        ],
        max_tokens: 350
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`OpenAI automatic reply failed (${response.status}).`);
    }

    const payload = await response.json();
    return String(payload.choices?.[0]?.message?.content || '').trim();
  };
}
