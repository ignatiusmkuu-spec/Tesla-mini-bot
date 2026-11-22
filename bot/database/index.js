import pg from 'pg';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const {Pool}=pg;
export const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='disable'?false:{rejectUnauthorized:false},max:5,idleTimeoutMillis:30000,connectionTimeoutMillis:10000});
pool.on('error',err=>console.error('PostgreSQL idle client error:',err.message));
export async function initDb(){const schema=await readFile(path.join(path.dirname(fileURLToPath(import.meta.url)),'schema.sql'),'utf8');await pool.query(schema);await pool.query("UPDATE bot_stats SET started_at=NOW(),updated_at=NOW() WHERE id=1");}
export async function getValue(ns,key){const r=await pool.query('SELECT value FROM bot_kv WHERE namespace=$1 AND key=$2',[ns,key]);return r.rows[0]?.value??null}
export async function putValue(ns,key,value){await pool.query('INSERT INTO bot_kv(namespace,key,value) VALUES($1,$2,$3) ON CONFLICT(namespace,key) DO UPDATE SET value=EXCLUDED.value',[ns,key,value])}
export async function getPluginStates(){const r=await pool.query('SELECT name,enabled FROM bot_plugins');return new Map(r.rows.map(x=>[x.name,x.enabled]))}
export async function setPlugin(name,enabled,source='bundled'){await pool.query('INSERT INTO bot_plugins(name,enabled,source) VALUES($1,$2,$3) ON CONFLICT(name) DO UPDATE SET enabled=EXCLUDED.enabled',[name,enabled,source])}
export async function removePlugin(name){await pool.query('DELETE FROM bot_plugins WHERE name=$1',[name])}
export async function incrementMessages(){await pool.query('UPDATE bot_stats SET messages=messages+1,updated_at=NOW() WHERE id=1')}
export async function getStats(){const r=await pool.query('SELECT messages,started_at,updated_at FROM bot_stats WHERE id=1');return r.rows[0]||{messages:0}}
export async function closeDb(){await pool.end()}
