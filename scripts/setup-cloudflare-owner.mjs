import {randomBytes,createHash} from 'node:crypto';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const email=String(process.argv[2]||'').trim().toLowerCase();
const origin=process.env.PUBLIC_ORIGIN||'https://academy.ktworldsolutions.com';
if(!/^\S+@\S+\.\S+$/.test(email)||new URL(origin).protocol!=='https:')throw Error('Supply owner email and an HTTPS PUBLIC_ORIGIN.');
const token=randomBytes(32).toString('base64url'),hash=createHash('sha256').update(token).digest('hex');
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const dir=await mkdtemp(join(tmpdir(),'academy-owner-'));
try {
const file=join(dir,'owner.sql');
// A second owner setup fails at INSERT, preventing an accidental owner reset.
await writeFile(file,`INSERT INTO accounts(id,email) VALUES('academy-owner',${quote(email)});\nINSERT INTO activations(token,account,expires) VALUES('${hash}','academy-owner',${Date.now()+1800000});`,{mode:0o600});
const result=spawnSync('npx',['wrangler','d1','execute','ktws-academy-school','--remote','--config','cloudflare/wrangler.jsonc','--file',file],{stdio:'inherit'});
if(result.status!==0)throw Error('Owner setup did not complete. Inspect D1 before retrying.');
console.log('Open this private link within 30 minutes to create your owner password:');
console.log(new URL('/activate',origin).href+'#token='+token);
} finally {await rm(dir,{recursive:true,force:true});}
