import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync,existsSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const root=resolve(process.env.ACADEMY_DATA_DIR||'./data');mkdirSync(root,{recursive:true,mode:0o700});
export const sql=new DatabaseSync(resolve(root,'academy.sqlite'));sql.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
sql.exec(`CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,owner TEXT NOT NULL,kind TEXT NOT NULL,payload TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,updated TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_records_owner_kind ON records(owner,kind);
CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,owner TEXT NOT NULL,record_id TEXT NOT NULL,action TEXT NOT NULL,at TEXT NOT NULL,payload TEXT NOT NULL,revision INTEGER,actor TEXT,snapshot TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_record_revision ON audit(owner,record_id,revision);
CREATE TABLE IF NOT EXISTS school_files(key TEXT PRIMARY KEY,owner TEXT NOT NULL,campus TEXT NOT NULL,student TEXT,category TEXT NOT NULL,name TEXT NOT NULL,mime TEXT NOT NULL,actor TEXT NOT NULL,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT,active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,account TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS activations(token TEXT PRIMARY KEY,account TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);`);
class Statement{query:string;values:any[]=[];constructor(query:string){this.query=query;}bind(...values:any[]){this.values=values.map(v=>v===undefined?null:v);return this;}async all(){return {results:sql.prepare(this.query).all(...this.values)};}async first(){return sql.prepare(this.query).get(...this.values)||null;}async run(){return sql.prepare(this.query).run(...this.values);}}
export function database(){return {prepare:(q:string)=>new Statement(q),batch:async(stmts:Statement[])=>{sql.exec('BEGIN IMMEDIATE');try{const results=[];for(const s of stmts)results.push(sql.prepare(s.query).run(...s.values));sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}};}
function filePath(key:string){if(!/^[a-zA-Z0-9_-]+\/[a-f0-9-]{36}$/.test(key))throw Error('Invalid file key');return resolve(root,'files',key);}
export function bucket(){return {put:async(key:string,bytes:any,options:any)=>{const path=filePath(key);mkdirSync(dirname(path),{recursive:true,mode:0o700});writeFileSync(path,Buffer.from(bytes),{mode:0o600});},get:async(key:string)=>{const path=filePath(key);if(!existsSync(path))return null;const b=readFileSync(path);return {body:b,httpMetadata:{contentType:'application/octet-stream'},arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};},delete:async(key:string)=>{const p=filePath(key);if(existsSync(p))unlinkSync(p);}};}
