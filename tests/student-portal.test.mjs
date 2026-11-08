import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {studentSelfView} from '../lib/student-self.ts';
const demo={id:'student',kind:'students',name:'Fictional learner',email:'learner@test.example',program:'Class A',status:'Yard',campusId:'campus',classId:'class',licenseNumber:'LICENSE-PRIVATE',ssnLast4:'4321',phone:'5550011000',drugScreen:{resultStatus:'Reviewed'},notes:[{text:'Private instructor note'}],documents:[{key:'PII-KEY',name:'sensitive record'}],sessions:[{id:'a',phase:'Yard',attendance:'Present',date:'2026-10-10',hours:2,instructor:'School instructor',notes:'PRIVATE LESSON NOTES'}]};
const projection=studentSelfView(demo,[{id:'campus',kind:'campuses',name:'Greensboro',status:'Active'},{id:'class',kind:'classes',name:'School class',status:'Active',campusId:'campus',startDate:'2026-10-01'}]);
for(const secret of ['LICENSE-PRIVATE','4321','5550011000','Private instructor note','PRIVATE LESSON NOTES','PII-KEY','drugScreen'])assert.ok(!JSON.stringify(projection).includes(secret),'Student view must exclude '+secret);
assert.equal(projection.hours.yard,2);
process.env.ACADEMY_TEST='true';process.env.PUBLIC_ORIGIN='https://academy.test';process.env.RECORDS_ENCRYPTION_KEY='ab'.repeat(32);process.env.ACADEMY_DATA_DIR=mkdtempSync(join(tmpdir(),'academy-student-self-'));process.env.STUDENT_PORTAL_ENABLED='true';
const {handle}=await import('../dist-server/index.js');
const send=(path,data,cookie)=>handle(new Request('https://academy.test'+path,{method:data?'POST':'GET',headers:{Origin:'https://academy.test','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})}));
const json=async promise=>{const r=await promise;return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
try{
 const setup=spawnSync(process.execPath,['dist-server/setup-owner.js','owner@test.example'],{env:process.env,encoding:'utf8'});
 assert.equal(setup.status,0,setup.stderr);
 const owner=await json(send('/api/auth/activate',{token:setup.stdout.split('#token=')[1].trim(),password:'unique owner test secret for portal'}));
 assert.equal(owner.status,200);
 const a={id:crypto.randomUUID(),kind:'campuses',name:'Greensboro',status:'Active'};
 const b={id:crypto.randomUUID(),kind:'campuses',name:'Mansfield',status:'Active'};
 const c={id:crypto.randomUUID(),kind:'campuses',name:'Dallas',status:'Active'};
 const sa={...demo,id:crypto.randomUUID(),campusId:a.id,classId:'',sessions:[],documents:[]};
 const sb={...demo,id:crypto.randomUUID(),name:'Foreign Texas Student',email:'texas@test.example',campusId:b.id,classId:'',sessions:[],documents:[]};
 const sc={...demo,id:crypto.randomUUID(),name:'Dallas Student',email:'dallas@test.example',campusId:c.id,classId:'',sessions:[],documents:[]};
 const init=await json(send('/api/records',{records:[a,b,c,sa,sb,sc]},owner.cookie));assert.equal(init.status,200,JSON.stringify(init.body));
 const approved={id:crypto.randomUUID(),kind:'curriculum-units',name:'Home study: brake safety',status:'Approved',campusId:a.id,program:'Class A',phase:'Classroom',code:'SAFE-BRAKE-01',version:1,sequence:1,required:false,objective:'Explain brake safety principles before a supervised practical class.',notes:'SECRET STAFF NOTES - NEVER SHARE',shareWithStudent:true,studentGuide:'SUPPLEMENTAL CAMPUS READING ABOUT SAFE BRAKES',practiceQuestions:[{id:'p1',prompt:'What should you do if the brakes need repair?',options:['Tell the instructor and do not drive','Drive immediately'],correctIndex:0,explanation:'Reported safety defects must be resolved before using the truck.'}]};
 const draft={...approved,id:crypto.randomUUID(),name:'DRAFT NEVER PUBLISH',status:'Draft',code:'SAFE-DRAFT-01',studentGuide:'DRAFT PRIVATE CLASS NOTES'};
 const texas={...approved,id:crypto.randomUUID(),name:'PRIVATE MANSFIELD STUDY',campusId:b.id,code:'SAFE-TEXAS-01',studentGuide:'OTHER CAMPUS READING'};
 const wrongProgram={...approved,id:crypto.randomUUID(),name:'CLASS B PRIVATE NOTES',program:'Class B',code:'SAFE-B-01',studentGuide:'OTHER PROGRAM READING'};
 const noShare={...approved,id:crypto.randomUUID(),name:'UNPUBLISHED CAMPUS NOTES',code:'SAFE-HIDDEN-01',shareWithStudent:false,studentGuide:'NOT PUBLISHED NOTES'};
 const schoolBooks=await json(send('/api/records',{records:[approved,draft,texas,wrongProgram,noShare]},owner.cookie));
 assert.equal(schoolBooks.status,200,JSON.stringify(schoolBooks.body));

 assert.equal((await send('/api/student/portal')).status,401);
 assert.equal((await send('/api/student/admin',{action:'invite',studentId:sa.id,approvedAuthorization:true},owner.cookie)).status,403);
 assert.equal((await send('/api/student/admin',{action:'invite',studentId:sa.id,approvedAuthorization:true},undefined)).status,403);
 const file=new FormData();
 file.set('file',new File(['Fictional permission for test student access only'],'student-portal-consent.txt',{type:'text/plain'}));
 file.set('studentId',sa.id);file.set('category','Student portal authorization');
 const upload=await json(handle(new Request('https://academy.test/api/files',{method:'POST',headers:{Origin:'https://academy.test',Cookie:owner.cookie},body:file})));
 assert.equal(upload.status,200,JSON.stringify(upload.body));
 const record=(await json(send('/api/records',null,owner.cookie))).body.records.find(x=>x.id===sa.id);
 assert.equal((await send('/api/records',{records:[{...record,documents:[{...upload.body,verified:true}]}]},owner.cookie)).status,200);
 const consentKey=upload.body.key;
 assert.equal((await send('/api/student/admin',{action:'invite',studentId:sa.id,consentKey,approvedAuthorization:false},owner.cookie)).status,400);
 const invited=await json(send('/api/student/admin',{action:'invite',studentId:sa.id,consentKey,approvedAuthorization:true},owner.cookie));
 assert.equal(invited.status,200,JSON.stringify(invited.body));
 const token=invited.body.activationLink.split('#token=')[1];assert.ok(token?.length>=32);
 const active=await json(send('/api/auth/activate',{token,password:'unique fictional learner password'}));
 assert.equal(active.status,200);
 const user=await json(send('/api/student/me',null,active.cookie));
 assert.equal(user.status,200);assert.equal(user.body.role,'Student');
 assert.equal((await send('/api/auth/me',null,active.cookie)).status,401);
 assert.equal((await send('/api/records',null,active.cookie)).status,401);
 assert.equal((await send('/api/partner/portal',null,active.cookie)).status,401);
 assert.equal((await send('/api/readiness',null,active.cookie)).status,401);
 assert.equal((await send('/api/student/admin',null,active.cookie)).status,403);
 assert.equal((await send('/api/student/admin',{action:'deactivate',accountId:'whatever'},active.cookie)).status,403);
 const portal=await json(send('/api/student/portal',null,active.cookie));assert.equal(portal.status,200,JSON.stringify(portal.body));
 assert.equal(portal.body.student.name,'Fictional learner');
 assert.equal(portal.body.student.studyLibrary?.length,1,'Only authorized campus and program approved reading is visible');
 assert.equal(portal.body.student.studyLibrary[0].name,'Home study: brake safety');
 assert.equal(portal.body.student.studyLibrary[0].practiceQuestions[0].correctIndex,0,'Practice choices are ungraded by design');

 const serialized=JSON.stringify(portal.body);
 assert.ok(!serialized.includes('Foreign Texas Student'));
 assert.ok(!serialized.includes('Dallas Student'));
 for(const phrase of ['SECRET STAFF NOTES','DRAFT PRIVATE CLASS NOTES','OTHER CAMPUS READING','OTHER PROGRAM READING','NOT PUBLISHED NOTES'])assert.ok(!serialized.includes(phrase),'No unauthorized curriculum materials: '+phrase);
  for(const term of ['LICENSE-PRIVATE','5550011000','drugScreen','private instructor','PII-KEY'])assert.ok(!serialized.includes(term),'No private field '+term);
 // Random UUIDs may contain the digits 4321. Check forbidden field names
 // recursively and the exact scalar, rather than matching an unrelated ID.
 function assertNoPrivateIdentity(value){
  if(value&&typeof value==='object'){
   for(const [key,item] of Object.entries(value)){
    assert.ok(!['ssnLast4','licenseNumber','drugScreen','phone'].includes(key),'Forbidden private field: '+key);
    assertNoPrivateIdentity(item);
   }
  }else assert.notEqual(value,'4321','Private SSN value must not be disclosed');
 }
 assertNoPrivateIdentity(portal.body);
 assertNoPrivateIdentity({id:'00004321-0000-4000-8000-000000000000'});
 assert.throws(()=>assertNoPrivateIdentity({nested:{ssnLast4:'4321'}}));
 assert.throws(()=>assertNoPrivateIdentity({nested:{unexpected:'4321'}}));
 const requested=await json(send('/api/student/requests',{action:'request',studentId:sa.id,categories:['Enrollment agreement','Driver license']},owner.cookie));
 assert.equal(requested.status,200,JSON.stringify(requested.body));
 assert.equal((await json(send('/api/student/portal',null,active.cookie))).body.student.documentNotices.length,2);
 assert.equal((await send('/api/student/requests',{action:'request',studentId:sb.id,categories:['Driver license']},active.cookie)).status,403);
 const studentUpload=new FormData();studentUpload.set('category','Enrollment agreement');
 studentUpload.set('file',new File(['Fictional signed enrollment contract for integration test'],'agreement.txt',{type:'text/plain'}));
 const submitted=await json(handle(new Request('https://academy.test/api/files',{method:'POST',headers:{Origin:'https://academy.test',Cookie:active.cookie},body:studentUpload})));
 assert.equal(submitted.status,200,JSON.stringify(submitted.body));
 assert.equal((await json(send('/api/student/portal',null,active.cookie))).body.student.enrollmentDocuments.find(d=>d.category==='Enrollment agreement').status,'Submitted — review pending');
 assert.equal((await send('/api/files?key='+submitted.body.key,null,active.cookie)).status,200,'Student may retrieve own submitted file');
 const verify=await json(send('/api/student/requests',{action:'verify',studentId:sa.id,key:submitted.body.key},owner.cookie));
 assert.equal(verify.status,200,JSON.stringify(verify.body));
 assert.equal((await json(send('/api/student/portal',null,active.cookie))).body.student.enrollmentDocuments.find(d=>d.category==='Enrollment agreement').status,'Verified');
 const outOfScope=new FormData();outOfScope.set('category','Enrollment agreement');outOfScope.set('studentId',sb.id);
 outOfScope.set('file',new File(['Unrelated fictional Texas agreement'],'tx-agreement.txt',{type:'text/plain'}));
 const texasUpload=await json(handle(new Request('https://academy.test/api/files',{method:'POST',headers:{Origin:'https://academy.test',Cookie:owner.cookie},body:outOfScope})));
 assert.equal(texasUpload.status,200);
 assert.equal((await send('/api/files?key='+texasUpload.body.key,null,active.cookie)).status,403);
 const quiz={id:crypto.randomUUID(),kind:'quizzes',name:'Friday general knowledge early check',status:'Active',campusId:a.id,program:'Class A',type:'Quiz',week:1,studentPractice:true,questions:[
  {id:'testq1',prompt:'What should a driver do before driving?',options:['Inspect the vehicle','Skip checks'],correct:'0',subject:'General Knowledge',objective:'Vehicle inspection safety'},
  {id:'testq2',prompt:'What does a driver need to monitor before dispatch?',options:['Hours and legal limits','Only the radio'],correct:'0',subject:'General Knowledge',objective:'Legal driving limits'},
  {id:'testq3',prompt:'Why must trucks follow posted restrictions?',options:['Safety and route compliance','No reason'],correct:'0',subject:'General Knowledge',objective:'Restricted vehicle routes'}
 ]};
 assert.equal((await send('/api/records',{records:[quiz]},owner.cookie)).status,200);
 const listedQuizzes=await json(send('/api/student/exams',null,active.cookie));assert.equal(listedQuizzes.status,200);
 assert.equal(listedQuizzes.body.quizzes.length,1);
 assert.equal(JSON.stringify(listedQuizzes.body.quizzes).includes('correct'),false,'Do not expose answer keys before grading');
 const scored=await json(send('/api/student/exams',{quizId:quiz.id,answers:{testq1:0,testq2:1,testq3:0}},active.cookie));
 assert.equal(scored.status,200,JSON.stringify(scored.body));assert.equal(scored.body.score,66.67);
 const stats=await json(send('/api/student/exams',null,active.cookie));
 assert.equal(stats.body.progress.find(s=>s.subject==='General Knowledge').percent,67);
 assert.equal((await send('/api/student/exams',{quizId:quiz.id,answers:{testq1:0,testq2:0,testq3:0}},active.cookie)).status,409,'One diagnostic attempt per day');
 const list=await json(send('/api/student/admin',null,owner.cookie));assert.equal(list.status,200);
 assert.equal(list.body.accounts.length,1);
 const staff={id:crypto.randomUUID(),kind:'staff',name:'Forged staff role',email:sa.email,status:'Active',accessRole:'Campus manager',campusIds:[a.id]};
 assert.equal((await send('/api/records',{records:[staff]},owner.cookie)).status,200);
 assert.equal((await send('/api/records',null,active.cookie)).status,401,'Student account must never become an employee even if same-email staff row is forged');
 const current=(await json(send('/api/records',null,owner.cookie))).body.records.find(x=>x.id===sa.id);
 assert.equal((await send('/api/records',{records:[{...current,documents:current.documents.map(d=>({...d,verified:false}))}]},owner.cookie)).status,200);
 assert.equal((await send('/api/student/portal',null,active.cookie)).status,401,'Removing verified authorization immediately revokes student access');
 const newStudent=(await json(send('/api/records',null,owner.cookie))).body.records.find(x=>x.id===sa.id);
 assert.equal((await send('/api/records',{records:[{...newStudent,documents:newStudent.documents.map(d=>({...d,verified:true}))}]},owner.cookie)).status,200);
 assert.equal((await send('/api/student/portal',null,active.cookie)).status,200);
 const studentAccount=list.body.accounts[0].account;
 const rev=await json(send('/api/student/admin',{action:'deactivate',accountId:studentAccount},owner.cookie));
 assert.equal(rev.status,200);
 assert.equal((await send('/api/student/portal',null,active.cookie)).status,401);
 assert.equal((await send('/api/auth/login',{email:sa.email,password:'unique fictional learner password'})).status,401);
 process.env.STUDENT_PORTAL_ENABLED='false';
 assert.equal((await send('/api/student/admin',{action:'invite',studentId:sb.id,approvedAuthorization:true},owner.cookie)).status,503);
 console.log('PASS: opt-in student-only role, three-campus isolation, no PII in progress view, verified consent revocation, owner-only invitations and session shutdown.');
}finally{rmSync(process.env.ACADEMY_DATA_DIR,{recursive:true,force:true});}
