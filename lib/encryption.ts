import {env} from './env';
async function key(){const raw=(env as any).RECORDS_ENCRYPTION_KEY;if(!/^[a-f0-9]{64}$/i.test(raw||''))throw Error('Encrypted record storage is not configured');return crypto.subtle.importKey('raw',Uint8Array.from(raw.match(/../g).map((x:string)=>parseInt(x,16))),{name:'AES-GCM'},false,['encrypt','decrypt']);}
export async function encrypt(bytes:ArrayBuffer){const iv=crypto.getRandomValues(new Uint8Array(12));const out=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(),bytes));const result=new Uint8Array(12+out.length);result.set(iv);result.set(out,12);return result;}
export async function decrypt(bytes:ArrayBuffer){const x=new Uint8Array(bytes);return crypto.subtle.decrypt({name:'AES-GCM',iv:x.slice(0,12)},await key(),x.slice(12));}
