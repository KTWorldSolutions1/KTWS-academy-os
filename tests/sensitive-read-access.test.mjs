import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {canRead} from '../lib/workspace-access.ts';
for(const role of ['Enrollment specialist','Admin assistant','Front desk']) {
 assert.equal(canRead(role,'quizzes'),false,role+' should never read an exam answer bank');
 assert.equal(canRead(role,'settings'),false,role+' should never read owner settings');
}
assert.equal(canRead('Instructor','quizzes'),true);
assert.equal(canRead('Instructor','settings'),false);
assert.equal(canRead('Campus manager','settings'),true);
process.env.ACADEMY_TEST='true';
process.env.PUBLIC_ORIGIN='https://academy.test';
process.env.RECORDS_ENCRYPTION_KEY='cd'.repeat(32);
process.env.ACADEMY_DATA_DIR=mkdtempSync(join(tmpdir(),'academy-school-read-'));
const {handle}=await import('../dist-server/index.js');
const send=(path,data,cookie)=>handle(new Request('https://academy.test'+path,{method:data?'POST':'GET',headers:{Origin:'https://academy.test','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})}));
const json=async p=>{const response=await p;return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};};
try{
 const setup=spawnSync(process.execPath,['dist-server/setup-owner.js','owner@test.example'],{env:process.env,encoding:'utf8'});
 assert.equal(setup.status,0,setup.stderr);
 const owner=await json(send('/api/auth/activate',{token:setup.stdout.split('#token=')[1].trim(),password:'unique strong owner password for the exam test'}));
 assert.equal(owner.status,200);
 const c1={id:crypto.randomUUID(),kind:'campuses',name:'Greensboro',status:'Active'};
 const c2={id:crypto.randomUUID(),kind:'campuses',name:'Dallas',status:'Active'};
 const examSecret='FICTIONAL_EXAM_ANSWER_SHOULD_NOT_LEAK';
 const configSecret='FICTIONAL_INTERNAL_SETTING_SHOULD_NOT_LEAK';
 const exam={id:crypto.randomUUID(),kind:'quizzes',name:'Restricted CDL theory answer bank',campusId:c1.id,status:'Active',questions:[{text:'What is the fictional answer?',correct:examSecret}]};
 const settings={id:crypto.randomUUID(),kind:'settings',name:'Internal manager policies',campusId:c1.id,status:'Active',internalNotes:configSecret};
 const roles=['Enrollment specialist','Admin assistant','Front desk','Instructor','Campus manager'];
 const staff=roles.map((role,i)=>({id:crypto.randomUUID(),kind:'staff',name:role,status:'Active',accessRole:role,email:'staff'+i+'@test.example',campusIds:[c1.id]}));
 const created=await json(send('/api/records',{records:[c1,c2,exam,settings,...staff]},owner.cookie));
 assert.equal(created.status,200,JSON.stringify(created.body));
 const initial=(await json(send('/api/records',null,owner.cookie))).body.records;
 assert.ok(initial.some(x=>x.id===exam.id));
 assert.ok(initial.some(x=>x.id===settings.id));
 for(const user of staff){
  const invitation=await json(send('/api/accounts/invite',{staffId:user.id},owner.cookie));assert.equal(invitation.status,200);
  const activated=await json(send('/api/auth/activate',{token:invitation.body.link.split('#token=')[1],password:'a very different strong password for staff accounts'}));assert.equal(activated.status,200);
  const list=await json(send('/api/records',null,activated.cookie));assert.equal(list.status,200);
  const seesExam=list.body.records.some(x=>x.id===exam.id),seesSettings=list.body.records.some(x=>x.id===settings.id);
  assert.equal(seesExam,['Instructor','Campus manager'].includes(user.accessRole),user.accessRole+' exam read');
  assert.equal(seesSettings,user.accessRole==='Campus manager',user.accessRole+' settings read');
  if(!seesExam)assert.equal(JSON.stringify(list.body).includes(examSecret),false,user.accessRole+' must not see answer in audit');
  if(!seesSettings)assert.equal(JSON.stringify(list.body).includes(configSecret),false,user.accessRole+' must not see secret configuration in audit');
  assert.equal(list.body.records.some(x=>x.id===c2.id),false,user.accessRole+' cannot read Dallas');
 }
 console.log('PASS: owner-only configuration, instructor-only question banks, role and campus-scoped API response and audit protections.');
}finally{rmSync(process.env.ACADEMY_DATA_DIR,{recursive:true,force:true});}
