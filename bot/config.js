import 'dotenv/config';

const list = (value = '') => value.split(',').map(item => item.trim()).filter(Boolean);
const sessionId = (process.env.SESSION_ID || '').trim();
const autoReplyValue = (process.env.AUTO_REPLY || 'false').trim().toLowerCase();

if (sessionId && !/^[A-Za-z0-9_-]{1,64}$/.test(sessionId)) {
  throw new Error('SESSION_ID must be 1–64 letters, numbers, underscores, or hyphens.');
}
if (!['true', 'false'].includes(autoReplyValue)) {
  throw new Error('AUTO_REPLY must be true or false.');
}

export const config = {
  prefix: process.env.PREFIX || '.',
  owners: list(process.env.OWNER_NUMBERS),
  databaseUrl: process.env.DATABASE_URL,
  pairingNumber: process.env.PAIRING_NUMBER?.replace(/\D/g, ''),
  sessionId,
  authNamespace: sessionId ? `auth:${sessionId}` : 'auth',
  publicMode: (process.env.BOT_MODE || 'private').toLowerCase() === 'public',
  autoReply: autoReplyValue === 'true',
  openAiKey: process.env.OPENAI_API_KEY,
  openAiChatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
  openWeatherKey: process.env.OPENWEATHER_API_KEY,
  searchKey: process.env.TAVILY_API_KEY,
  translateKey: process.env.DEEPL_API_KEY
};

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required. Configure a persistent PostgreSQL service before starting the bot.');
}
if (!config.owners.length) {
  throw new Error('OWNER_NUMBERS is required. Configure at least one authorized WhatsApp owner number.');
}
if (!['public', 'private'].includes((process.env.BOT_MODE || 'private').toLowerCase())) {
  throw new Error('BOT_MODE must be public or private');
}
if (config.autoReply && !config.openAiKey) {
  throw new Error('AUTO_REPLY=true requires OPENAI_API_KEY. Configure both before starting the bot.');
}
