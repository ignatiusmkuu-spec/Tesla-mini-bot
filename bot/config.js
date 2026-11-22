import 'dotenv/config';
const list=(s='')=>s.split(',').map(x=>x.trim()).filter(Boolean);
export const config={prefix:process.env.PREFIX||'.',owners:list(process.env.OWNER_NUMBERS),databaseUrl:process.env.DATABASE_URL,pairingNumber:process.env.PAIRING_NUMBER?.replace(/\D/g,''),publicMode:(process.env.BOT_MODE||'private').toLowerCase()==='public',openAiKey:process.env.OPENAI_API_KEY,openWeatherKey:process.env.OPENWEATHER_API_KEY,searchKey:process.env.TAVILY_API_KEY,translateKey:process.env.DEEPL_API_KEY};
if(!config.databaseUrl)throw new Error('DATABASE_URL is required. Configure a persistent PostgreSQL service before starting the bot.');
if(!config.owners.length)throw new Error('OWNER_NUMBERS is required. Configure at least one authorized WhatsApp owner number.');
if(!['public','private'].includes((process.env.BOT_MODE||'private').toLowerCase()))throw new Error('BOT_MODE must be public or private');
