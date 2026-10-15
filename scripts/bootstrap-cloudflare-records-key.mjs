#!/usr/bin/env node
/**
 * One-time bootstrap of an absent Cloudflare Worker R2 encryption secret.
 * Never prints, persists, logs, exports or rotates the key. Must only run
 * in production deployment after a tested commit and main-SHA guard.
 */
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const config='cloudflare/wrangler.jsonc',name='RECORDS_ENCRYPTION_KEY';
function wrangler(args,input){
 const r=spawnSync(process.platform==='win32'?'npx.cmd':'npx',['wrangler',...args,'--config',config],{encoding:'utf8',input,timeout:90000,maxBuffer:1024*1024,env:process.env});
 if(r.status!==0||r.error)throw Error('Cloudflare encryption secret operation failed; check Worker permissions, account selection and remote service availability.');
 return r.stdout||'';
}
try{
 const existing=JSON.parse(wrangler(['secret','list','--format','json']));
 if(!Array.isArray(existing))throw Error('Could not verify Worker secret metadata.');
 if(existing.some(x=>x?.name===name)){
  console.log(name+': present. Preserved existing encryption key without rotation.');
 }else{
  // Transmit generated cryptographic key by stdin only; no shell interpolation
  // or file storage. Never print the provider command output.
  const secret=randomBytes(32).toString('hex');
  wrangler(['secret','put',name],secret+'\n');
  const after=JSON.parse(wrangler(['secret','list','--format','json']));
  if(!Array.isArray(after)||!after.some(x=>x?.name===name))throw Error('New encryption secret could not be verified.');
  console.log(name+': provisioned with a new 256-bit cryptographic key (value hidden).');
  console.log('Required follow-up: preserve a school-controlled recovery strategy before processing protected documents. Cloudflare does not display existing secret values.');
 }
}catch(e){
 console.error('Encryption secret bootstrap unsuccessful. The release cannot be marked ready for confidential student file uploads. '+String(e?.message||''));
 process.exitCode=1;
}
