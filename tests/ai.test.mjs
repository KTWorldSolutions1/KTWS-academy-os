import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

process.env.ACADEMY_TEST='true';
process.env.PUBLIC_ORIGIN='https://academy.test';
process.env.RECORDS_ENCRYPTION_KEY='33'.repeat(32);
process.env.ACADEMY_DATA_DIR=mkdtempSync(join(tmpdir(),'academy-ai-'));
const {handle}=await import('../dist-server/index.js');
const send=(path,data,cookie,origin='https://academy.test')=>handle(new Request('https://academy.test'+path,{method:data?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})}));
const asJson=async p=>{const r=await p;return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
const originalFetch=globalThis.fetch;
try{
 const setup=spawnSync(process.execPath,['dist-server/setup-owner.js','owner@test.example'],{env:process.env,encoding:'utf8'});
 assert.equal(setup.status,0,setup.stderr);
 const activation=setup.stdout.split('#token=')[1].trim();
 const owner=await asJson(send('/api/auth/activate',{token:activation,password:'a long unique academy owner password'}));
 assert.equal(owner.status,200);
 const a={id:crypto.randomUUID(),kind:'campuses',name:'Greensboro',status:'Active'};
 const b={id:crypto.randomUUID(),kind:'campuses',name:'Dallas',status:'Active'};
 const emp={id:crypto.randomUUID(),kind:'staff',name:'Instructor',status:'Active',email:'instructor@test.example',accessRole:'Instructor',campusIds:[a.id]};
 const student={id:crypto.randomUUID(),kind:'students',name:'PRIVATE STUDENT SHOULD NOT BE SENT',status:'Classroom',campusId:a.id,sessions:[]};
 assert.equal((await asJson(send('/api/records',{records:[a,b,emp,student]},owner.cookie))).status,200);
 const inv=await asJson(send('/api/accounts/invite',{staffId:emp.id},owner.cookie));
 assert.equal(inv.status,200);
 const employee=await asJson(send('/api/auth/activate',{token:inv.body.link.split('#token=')[1],password:'a long unique instructor password'}));
 assert.equal(employee.status,200);
 const request={campusId:a.id,scenario:'Carrier partnership',organization:'Regional carrier',context:'Ask about hiring newly licensed Class A graduates.',outputType:'Questions',confirmNoPrivateData:true};
 assert.equal((await send('/api/ai',request)).status,401);
 assert.equal((await send('/api/ai',request,employee.cookie,'https://evil.example')).status,403);
 assert.equal((await send('/api/ai',request,employee.cookie)).status,503); // No API secret installed
 process.env.OPENAI_API_KEY='TEST-NONSECRET';
 let providerCalls=0;
 globalThis.fetch=async (url,opts)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');
  assert.equal(opts.headers.Authorization,'Bearer TEST-NONSECRET');
  const body=JSON.parse(opts.body);
  assert.equal(body.store,false);
  assert.ok(!JSON.stringify(body).includes('PRIVATE STUDENT SHOULD NOT BE SENT'));
  assert.ok(!JSON.stringify(body).includes('student@test.example'));
  providerCalls++;
  return Response.json({model:'test-model',output:[{type:'message',content:[{type:'output_text',text:'Review employer criteria before use.'}]}]});
 };
 assert.equal((await send('/api/ai',{...request,campusId:b.id},employee.cookie)).status,403);
 assert.equal((await send('/api/ai',{...request,context:'Student email: test@example.com'},employee.cookie)).status,400);
 assert.equal((await send('/api/ai',{...request,context:'SSN 123-45-6789'},employee.cookie)).status,400);
 assert.equal((await send('/api/ai',{...request,confirmNoPrivateData:false},employee.cookie)).status,400);
 for(let i=0;i<12;i++){
  const response=await asJson(send('/api/ai',request,employee.cookie));
  assert.equal(response.status,200,JSON.stringify(response.body));
  assert.equal(response.body.reviewRequired,true);
  assert.equal(response.body.draft,'Review employer criteria before use.');
 }
 assert.equal(providerCalls,12);
 assert.equal((await send('/api/ai',request,employee.cookie)).status,429);
 assert.equal(providerCalls,12);
 console.log('PASS: AI endpoint requires login, same-origin, credential, declared privacy confirmation; blocks obvious identifiers and cross-campus access; excludes stored student data; uses store:false and hourly quota.');
}finally{globalThis.fetch=originalFetch;delete process.env.OPENAI_API_KEY;rmSync(process.env.ACADEMY_DATA_DIR,{recursive:true,force:true});}
