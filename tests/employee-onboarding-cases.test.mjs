import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
process.env.ACADEMY_TEST='true';process.env.PUBLIC_ORIGIN='https://academy.test';
process.env.RECORDS_ENCRYPTION_KEY='98'.repeat(32);
process.env.ACADEMY_DATA_DIR=mkdtempSync(join(tmpdir(),'academy-onboard-'));
const {handle}=await import('../dist-server/index.js');
const send=(path,body,cookie)=>handle(new Request('https://academy.test'+path,{
 method:body?'POST':'GET',headers:{Origin:'https://academy.test','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},
 ...(body?{body:JSON.stringify(body)}:{})
}));
const read=async p=>{const r=await p;return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}};
try{
 const setup=spawnSync(process.execPath,['dist-server/setup-owner.js','owner@test.example'],{env:process.env,encoding:'utf8'});
 assert.equal(setup.status,0,setup.stderr);
 const token=setup.stdout.split('#token=')[1].trim();
 const owner=await read(send('/api/auth/activate',{token,password:'a long test-only password'}));assert.equal(owner.status,200);
 const cookie=owner.cookie;
 assert.equal((await send('/api/employee-onboarding')).status,401);
 const campus={id:crypto.randomUUID(),kind:'campuses',name:'Greensboro Sample',status:'Active'};
 const other={...campus,id:crypto.randomUUID(),name:'Dallas Sample'};
 const saved=await read(send('/api/records',{records:[campus,other]},cookie));assert.equal(saved.status,200,JSON.stringify(saved.body));
 const candidate={action:'create',campusId:campus.id,name:'Sample Candidate',email:'sample@example.test',
   jobTitle:'Instructor',startDate:'2026-12-01',acceptedOfferAt:new Date().toISOString(),offerAccepted:true};
 assert.equal((await send('/api/employee-onboarding',{...candidate,offerAccepted:false},cookie)).status,400);
 assert.equal((await send('/api/employee-onboarding',{...candidate,campusId:'unknown'},cookie)).status,400);
 const created=await read(send('/api/employee-onboarding',candidate,cookie));
 assert.equal(created.status,201,JSON.stringify(created.body));assert.equal(created.body.status,'Draft');
 const listed=await read(send('/api/employee-onboarding',null,cookie));assert.equal(listed.status,200);
 const record=listed.body.cases.find(x=>x.id===created.body.id);
 assert.ok(record);assert.equal(record.status,'Draft');assert.equal(record.campusId,campus.id);
 assert.equal(JSON.stringify(record).includes('bankAccount'),false);
 assert.equal(listed.body.employeeFormsEnabled,false);
 assert.equal((await send('/api/employee-onboarding',{action:'cancel',id:created.body.id,reason:'Offer cancelled'},cookie)).status,403,'Owner cannot override campus-manager final authority');
 assert.equal((await send('/api/employee-onboarding',{action:'invite',id:created.body.id},cookie)).status,400,'Invitations are not active');
 assert.equal((await send('/api/employee-onboarding',{action:'create',...candidate},null)).status,401);
 console.log('PASS: onboarding cases enforce accepted offers, campus validation, authentication and fail-closed private forms.');
}finally{rmSync(process.env.ACADEMY_DATA_DIR,{recursive:true,force:true});}
