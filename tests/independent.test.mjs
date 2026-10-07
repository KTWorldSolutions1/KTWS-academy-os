import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
process.env.ACADEMY_TEST='true';process.env.PUBLIC_ORIGIN='https://academy.test';process.env.RECORDS_ENCRYPTION_KEY='22'.repeat(32);process.env.ACADEMY_DATA_DIR=mkdtempSync(join(tmpdir(),'academy-native-'));
const {handle}=await import('../dist-server/index.js');
// Bootstrap through the same administrator CLI, capturing the one-use link privately.
const {spawnSync}=await import('node:child_process');
const setup=spawnSync(process.execPath,['dist-server/setup-owner.js','owner@test.example'],{env:process.env,encoding:'utf8'});assert.equal(setup.status,0,setup.stderr);
const token=setup.stdout.split('#token=')[1].trim();
const send=(path,data,cookie)=>handle(new Request('https://academy.test'+path,{method:data?'POST':'GET',headers:{Origin:'https://academy.test','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})}));
const json=async r=>({status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]});
try{
 assert.equal((await send('/api/records')).status,401);
 const forged=await handle(new Request('https://academy.test/api/records',{headers:{'oai-authenticated-user-id':'academy-owner','oai-authenticated-user-email':'owner@test.example'}}));assert.equal(forged.status,401);
 const active=await json(await send('/api/auth/activate',{token,password:'long unique school password'}));assert.equal(active.status,200);const cookie=active.cookie;
 assert.equal((await send('/api/auth/activate',{token,password:'another long school password'})).status,400);
 assert.equal((await send('/api/auth/login',{email:'owner@test.example',password:'wrong'})).status,401);
 const login=await json(await send('/api/auth/login',{email:'owner@test.example',password:'long unique school password'}));assert.equal(login.status,200);
 const ca={id:crypto.randomUUID(),kind:'campuses',name:'Campus A',status:'Active'},cb={...ca,id:crypto.randomUUID(),name:'Campus B'};
 const sa={id:crypto.randomUUID(),kind:'students',name:'Student A',status:'Classroom',campusId:ca.id,sessions:[],documents:[]},sb={...sa,id:crypto.randomUUID(),name:'Student B',campusId:cb.id};
 const employee={id:crypto.randomUUID(),kind:'staff',name:'Instructor',status:'Active',email:'instructor@test.example',accessRole:'Instructor',campusIds:[ca.id]};
 const saved=await json(await send('/api/records',{records:[ca,cb,sa,sb,employee]},cookie));assert.equal(saved.status,200,JSON.stringify(saved.body));
 const invite=await json(await send('/api/accounts/invite',{staffId:employee.id},cookie));assert.equal(invite.status,200);
 const empToken=invite.body.link.split('#token=')[1];const emp=await json(await send('/api/auth/activate',{token:empToken,password:'instructor unique school password'}));assert.equal(emp.status,200);
 const list=await json(await send('/api/records',null,emp.cookie));assert.ok(list.body.records.some(r=>r.id===sa.id));assert.ok(!list.body.records.some(r=>r.id===sb.id));
 assert.equal((await send('/api/accounts/invite',{staffId:employee.id},emp.cookie)).status,403);
 const ps=list.body.records.find(r=>r.id===sa.id);assert.equal((await send('/api/records',{records:[{...ps,status:'Yard'}]},emp.cookie)).status,200);
 const form=new FormData();form.set('studentId',sa.id);form.set('category','Signed contract');form.set('file',new File(['private test record'],'contract.txt',{type:'text/plain'}));
 const upload=await json(await handle(new Request('https://academy.test/api/files',{method:'POST',headers:{Origin:'https://academy.test',Cookie:cookie},body:form})));assert.equal(upload.status,200,JSON.stringify(upload.body));
 const cipher=readFileSync(join(process.env.ACADEMY_DATA_DIR,'files',upload.body.key));assert.equal(cipher.includes(Buffer.from('private test record')),false);
 const opened=await send('/api/files?key='+upload.body.key,null,cookie);assert.equal(await opened.text(),'private test record');assert.equal((await send('/api/files?key='+upload.body.key,null,emp.cookie)).status,403);
 const contract={id:crypto.randomUUID(),kind:'contracts',name:'Test agreement',status:'Completed',studentId:sa.id,completedFile:upload.body};assert.equal((await send('/api/records',{records:[contract]},cookie)).status,200);
 const staffCurrent=(await json(await send('/api/records',null,cookie))).body.records.find(r=>r.id===employee.id);assert.equal((await send('/api/records',{records:[{...staffCurrent,status:'Inactive'}]},cookie)).status,200);assert.equal((await send('/api/records',null,emp.cookie)).status,401);
 const cross=await handle(new Request('https://academy.test/api/records',{method:'POST',headers:{Origin:'https://attacker.test',Cookie:cookie,'Content-Type':'application/json'},body:'{}'}));assert.equal(cross.status,403);
 assert.equal((await send('/api/auth/logout',{},cookie)).status,200);assert.equal((await send('/api/records',null,cookie)).status,401);
 console.log('PASS: independent login, one-use activation, forged-header rejection, campus isolation, instructor transfer, encrypted files, contract attachment, inactive employee blocking, CSRF and logout.');
}finally{rmSync(process.env.ACADEMY_DATA_DIR,{recursive:true,force:true});}
