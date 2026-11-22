import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pino from 'pino';
import makeWASocket,{Browsers,DisconnectReason} from '@whiskeysockets/baileys';
import {config} from './config.js';
import {initDb,closeDb,incrementMessages,putValue,getValue,getPluginStates} from './database/index.js';
import {usePostgresAuthState} from './database/auth-store.js';
import {menuPlugin,showMain,showSection,actionMap} from './lib/menus.js';

const here=path.dirname(fileURLToPath(import.meta.url));let plugins=[],sock,closing=false,retry=0;
const builtinButtons={ai:'ai',image:'image',tts:'tts',calc:'calc',weather:'weather',qr:'qr',translate:'translate',web:'web',music:'music',video:'video',sticker:'sticker',download:'download',ping:'ping',uptime:'uptime',uuid:'uuid',flip:'flip',roll:'roll',choose:'choose',base64:'base64',groupinfo:'groupinfo',members:'members',antilink:'antilink',welcome:'welcome',plugins:'plugins',session:'session',stats:'stats',mode:'mode',broadcast:'broadcast',features:'features',restart:'restart',updatebot:'updatebot'};
async function loadPlugins(){const loaded=[menuPlugin()];for(const file of (await readdir(path.join(here,'plugins'))).filter(f=>f.endsWith('.js')).sort()){const mod=await import(`${path.join(here,'plugins',file)}?v=${Date.now()}`),p=mod.default;if(!p||typeof p.name!=='string'||!p.commands||typeof p.commands!=='object')throw new Error(`Invalid plugin module: ${file}`);loaded.push(p);}const states=await getPluginStates();plugins=loaded.map(p=>({...p,enabled:states.get(p.name)??true}));return plugins;}
async function reloadPlugin(name){const file=(await readdir(path.join(here,'plugins'))).find(f=>f.endsWith('.js')&&f.replace(/\.js$/,'')===name);if(!file)throw new Error('Only bundled plugin modules can be reloaded.');await loadPlugins();}
function sender(message){return message.key.participantAlt||message.key.remoteJidAlt||message.key.participant||message.key.remoteJid||'';}
const digits=j=>j.split('@')[0].split(':')[0].replace(/\D/g,'');
function selectedId(msg){const m=msg.message||{};const v=m.buttonsResponseMessage?.selectedButtonId||m.templateButtonReplyMessage?.selectedId||m.listResponseMessage?.singleSelectReply?.selectedRowId;if(v)return v;const raw=m.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;if(raw){try{const j=JSON.parse(raw);return j.id||j.selected_id||j.row_id;}catch{}}return null;}
function messageText(msg){const m=msg.message||{};return m.conversation||m.extendedTextMessage?.text||m.imageMessage?.caption||m.videoMessage?.caption||m.documentMessage?.caption||'';}
async function handle(sock,msg){if(!msg.message||msg.key.fromMe)return;const jid=msg.key.remoteJid;if(!jid||jid==='status@broadcast')return;const revoke=msg.message.protocolMessage;if(revoke?.type===0){for(const p of plugins.filter(x=>x.enabled&&x.onDelete))await p.onDelete({sock,key:revoke.key,jid}).catch(e=>console.error('Antidelete handler:',e.message));return;}const from=sender(msg),userId=digits(from)||from,owner=config.owners.includes(digits(from));const pushName=msg.pushName||'friend';await putValue('users',userId,{seenAt:Date.now()});await putValue('chats',jid,{seenAt:Date.now()});await incrementMessages();
 let metadata=null,isAdmin=false;if(jid.endsWith('@g.us')){metadata=await sock.groupMetadata(jid).catch(()=>null);isAdmin=Boolean(metadata?.participants?.find(p=>digits(p.id)===digits(from))?.admin);}
 const ctx={sock,message:msg,jid,sender:from,pushName,isOwner:owner,isAdmin,args:'',plugins,reloadPlugin};
 const mode=await getValue('settings','mode')||(config.publicMode?'public':'private');if(mode==='private'&&!owner)return;
 const selected=selectedId(msg)||((messageText(msg).trim().startsWith('tesla:item:'))?messageText(msg).trim():null);if(selected){const target=actionMap.get(selected);if(target==='home')return showMain(sock,jid,pushName);if(['ai','music','search','tools','groups','settings','owner'].includes(target))return showSection(sock,jid,target);const command=builtinButtons[target];if(command){const plugin=plugins.find(x=>x.enabled&&x.commands?.[command]);if(!plugin)return sock.sendMessage(jid,{text:`The ${command} feature is disabled.`});try{return await plugin.commands[command]({...ctx,args:''});}catch(e){return sock.sendMessage(jid,{text:`⚠️ ${e.message||'Action failed.'}`});}}for(const p of plugins.filter(x=>x.enabled)){const h=p.buttons?.[selected];if(h)return h(ctx);}return sock.sendMessage(jid,{text:'That menu action is not available. Send .menu to refresh.'});}
 const body=messageText(msg).trim();for(const p of plugins.filter(x=>x.enabled))if(typeof p.onMessage==='function')await p.onMessage({...ctx,fromMe:false}).catch(e=>console.error(`Plugin ${p.name} event failed:`,e.message));
 if(!body.startsWith(config.prefix))return;
 const [command,...parts]=body.slice(config.prefix.length).trim().split(/\s+/);if(!command)return;const args=parts.join(' ');
 for(const p of plugins.filter(x=>x.enabled)){if(typeof p.commands?.[command.toLowerCase()]==='function'){try{return await p.commands[command.toLowerCase()]({...ctx,args});}catch(e){console.error(`Command ${command} (${p.name}) failed:`,e.stack||e.message);return sock.sendMessage(jid,{text:`⚠️ ${e.message||'Command failed.'}`});}}}
 await sock.sendMessage(jid,{text:`Unknown command .${command}. Send .help for the menu.`});
}
let retryTimer;
async function connect(){if(closing)return;const auth=await usePostgresAuthState();sock=makeWASocket({auth:auth.state,logger:pino({level:'silent'}),browser:Browsers.ubuntu('Chrome'),markOnlineOnConnect:false,syncFullHistory:false});sock.ev.on('creds.update',()=>auth.saveCreds().catch(e=>console.error('Auth save failed:',e.message)));
 sock.ev.on('messages.upsert',({messages,type})=>{if(type==='notify')for(const msg of messages)handle(sock,msg).catch(e=>console.error('Message handler error:',e.stack||e.message));});
 sock.ev.on('messages.update',async updates=>{for(const u of updates){const revoke=u.update?.message?.protocolMessage;if(revoke?.type===0){const p=plugins.find(x=>x.enabled&&x.onDelete);if(p)await p.onDelete({sock,key:revoke.key,jid:u.key.remoteJid}).catch(e=>console.error('Antidelete handler:',e.message));}}});
 sock.ev.on('group-participants.update',async update=>{for(const p of plugins.filter(x=>x.enabled&&x.onParticipants))await p.onParticipants({sock,...update}).catch(e=>console.error('Group participant handler:',e.message));});
 sock.ev.on('connection.update',async update=>{const {connection,lastDisconnect}=update;if(connection==='open'){retry=0;console.log('WhatsApp connection established.');}if(connection==='close'&&!closing){const status=lastDisconnect?.error?.output?.statusCode;if(status===DisconnectReason.loggedOut){console.error('WhatsApp logged out. Re-pair by setting PAIRING_NUMBER.');return;}retry=Math.min(retry+1,8);const delay=Math.min(1000*2**retry,60000);console.warn(`WhatsApp disconnected (${status||'unknown'}); reconnecting in ${delay}ms.`);clearTimeout(retryTimer);retryTimer=setTimeout(()=>connect().catch(e=>console.error('Reconnect failed:',e.message)),delay);}});
 if(config.pairingNumber&&!auth.state.creds.registered){try{const code=await sock.requestPairingCode(config.pairingNumber);console.log(`WhatsApp pairing code: ${code} — enter it in Linked devices. Remove PAIRING_NUMBER after pairing.`);}catch(e){console.error('Could not request pairing code:',e.message);}}
}
async function shutdown(){if(closing)return;closing=true;clearTimeout(retryTimer);try{sock?.end(new Error('Process shutdown'));}catch{}await closeDb().catch(()=>{});process.exit(0);}
for(const s of ['SIGTERM','SIGINT'])process.once(s,shutdown);
await initDb();await loadPlugins();console.log(`Loaded ${plugins.length} plugins.`);await connect();
