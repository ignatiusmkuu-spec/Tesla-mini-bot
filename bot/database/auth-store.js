import { initAuthCreds, BufferJSON } from '@whiskeysockets/baileys';
import { getValue, putValue } from './index.js';
import { config } from '../config.js';
const encode=v=>JSON.parse(JSON.stringify(v,BufferJSON.replacer));
const decode=v=>JSON.parse(JSON.stringify(v),BufferJSON.reviver);
const namespace=config.authNamespace;
export async function usePostgresAuthState(){let stored=await getValue(namespace,'creds');const creds=stored?decode(stored):initAuthCreds();if(!stored) await putValue(namespace,'creds',encode(creds));return {state:{creds,keys:{get:async(type,ids)=>{const values=await Promise.all(ids.map(id=>getValue(namespace,`${type}:${id}`)));return Object.fromEntries(ids.map((id,i)=>[id,values[i]?decode(values[i]):undefined]).filter(([,v])=>v!==undefined));},set:async(data)=>{for(const [type,items] of Object.entries(data)) for(const [id,value] of Object.entries(items)){if(value==null) await (await import('./index.js')).pool.query('DELETE FROM bot_kv WHERE namespace=$1 AND key=$2',[namespace,`${type}:${id}`]);else await putValue(namespace,`${type}:${id}`,encode(value));}}}},saveCreds:async()=>putValue(namespace,'creds',encode(creds))};}
