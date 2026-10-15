import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {validateSponsorship,fundingEvidence,sponsorProgressPacket} from '../lib/sponsor-funding.ts';
const sample={id:'award',kind:'sponsorships',name:'Fictional workforce authorization',status:'Draft',campusId:'campus',studentId:'student',agencyId:'agency',authorizedAmount:3000};
assert.equal(validateSponsorship(sample),null);
assert.match(validateSponsorship({...sample,status:'Authorized'}),/date of the written/);
assert.match(validateSponsorship({...sample,authorizedAmount:3000.001}),/decimal places/);
assert.match(validateSponsorship({...sample,approvalDate:'2026-02-30'}),/valid funding dates/);
assert.equal(fundingEvidence({...sample,status:'Authorized',approvalDate:'2026-10-14',authorizationNumber:'X',authorizationDocumentKey:'doc'},{documents:[{key:'doc',category:'Funding authorization',verified:true}]},'2026-10-14').verified,true);
const student={id:'student',kind:'students',name:'Imaginary Sponsored Student',status:'Yard',campusId:'campus',program:'Class A',sessions:[
 {id:'one',date:'2026-10-14',phase:'Classroom',attendance:'Present',hours:2,mode:'Instruction'},
 {id:'two',date:'2026-10-15',phase:'Road',attendance:'Present',hours:3,mode:'Student driving',studentOperatedVehicle:true},
 {id:'three',date:'2026-10-16',phase:'Road',attendance:'Present',hours:1,mode:'Observation'},
 {id:'four',date:'2026-10-17',phase:'Yard',attendance:'Absent',hours:0,mode:'Instruction'},
 {id:'five',date:'2026-10-18',phase:'Yard',attendance:'Present',hours:7,mode:'Instruction'}],documents:[]};
const packet=sponsorProgressPacket(student,sample,{name:'Mock NC Works'},'2026-10-14','2026-10-16','2026-10-18');
assert.equal(packet.counts.classroom,2);
assert.equal(packet.counts.driving,3);
assert.equal(packet.counts.observation,1);
assert.equal(packet.counts.yard,0);
assert.ok(!packet.text.includes('FINANCIAL AID PAYMENT RECEIVED'));
assert.match(packet.text,/NOT AN INVOICE/);
assert.throws(()=>sponsorProgressPacket({...student,campusId:'other'},sample,undefined,'2026-10-14','2026-10-16','2026-10-18'),/campus/);
process.env.ACADEMY_TEST='true';process.env.PUBLIC_ORIGIN='https://academy.test';process.env.RECORDS_ENCRYPTION_KEY='aa'.repeat(32);process.env.ACADEMY_DATA_DIR=mkdtempSync(join(tmpdir(),'academy-wioa-authorized-'));
const {handle}=await import('../dist-server/index.js');
const send=(path,data,cookie)=>handle(new Request('https://academy.test'+path,{method:data?'POST':'GET',headers:{Origin:'https://academy.test','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})}));
const json=async promise=>{const response=await promise;return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};};
try{
 const setup=spawnSync(process.execPath,['dist-server/setup-owner.js','owner@test.example'],{env:process.env,encoding:'utf8'});assert.equal(setup.status,0,setup.stderr);
 const owner=await json(send('/api/auth/activate',{token:setup.stdout.split('#token=')[1].trim(),password:'unique school sponsor test password'}));assert.equal(owner.status,200);
 const a={id:crypto.randomUUID(),kind:'campuses',name:'Greensboro',status:'Active'},b={id:crypto.randomUUID(),kind:'campuses',name:'Mansfield',status:'Active'},c={id:crypto.randomUUID(),kind:'campuses',name:'Dallas',status:'Active'};
 const s={...student,id:crypto.randomUUID(),campusId:a.id,documents:[],sessions:[]};
 const tx={...s,id:crypto.randomUUID(),campusId:b.id};
 const agency={id:crypto.randomUUID(),kind:'funding',name:'Mock Workforce Authority',status:'Active',campusId:a.id};
 const staff={id:crypto.randomUUID(),kind:'staff',name:'Admissions reviewer',status:'Active',accessRole:'Enrollment specialist',email:'admissions@test.example',campusIds:[a.id]};
 const init=await json(send('/api/records',{records:[a,b,c,s,tx,agency,staff]},owner.cookie));
 assert.equal(init.status,200,JSON.stringify(init.body));
 const invite=await json(send('/api/accounts/invite',{staffId:staff.id},owner.cookie));assert.equal(invite.status,200,JSON.stringify(invite.body));
 const user=await json(send('/api/auth/activate',{token:invite.body.link.split('#token=')[1],password:'long unique admissions tester password'}));assert.equal(user.status,200);
 const req={...sample,id:crypto.randomUUID(),studentId:s.id,campusId:a.id,agencyId:agency.id,requestDate:'2026-10-14'};
 assert.equal((await send('/api/records',{records:[req]},user.cookie)).status,200);
 const stored=(await json(send('/api/records',null,owner.cookie))).body.records.find(x=>x.id===req.id);
 assert.equal(stored.status,'Draft');
 const cross=await json(send('/api/records',{records:[{...req,id:crypto.randomUUID(),studentId:tx.id}]},owner.cookie));
 assert.equal(cross.status,400);
 const phantom=await json(send('/api/records',{records:[{...req,id:crypto.randomUUID(),agencyId:'fake'}]},owner.cookie));
 assert.equal(phantom.status,400);
 const forged={...stored,status:'Authorized',approvalDate:'2026-10-14',authorizationNumber:'OFFICIAL-MOCK-123',authorizationDocumentKey:'fake-document'};
 assert.equal((await send('/api/records',{records:[forged]},user.cookie)).status,403);
 assert.equal((await send('/api/records',{records:[forged]},owner.cookie)).status,403);
 const form=new FormData();form.set('studentId',s.id);form.set('category','Funding authorization');form.set('file',new File(['Fictional written sponsor authorization'],'sponsor-approval.txt',{type:'text/plain'}));
 assert.equal((await handle(new Request('https://academy.test/api/files',{method:'POST',headers:{Origin:'https://academy.test',Cookie:user.cookie},body:form}))).status,403);
 const upload=await json(handle(new Request('https://academy.test/api/files',{method:'POST',headers:{Origin:'https://academy.test',Cookie:owner.cookie},body:form})));
 assert.equal(upload.status,200,JSON.stringify(upload.body));
 const original=(await json(send('/api/records',null,owner.cookie))).body.records.find(x=>x.id===s.id);
 assert.equal((await send('/api/records',{records:[{...original,documents:[{...upload.body,verified:true}]}]},owner.cookie)).status,200);
 const approved={...forged,authorizationDocumentKey:upload.body.key};
 const accepted=await json(send('/api/records',{records:[approved]},owner.cookie));
 assert.equal(accepted.status,200,JSON.stringify(accepted.body));
 const saved=(await json(send('/api/records',null,owner.cookie))).body.records.find(x=>x.id===req.id);
 assert.equal(saved.status,'Authorized');assert.equal(saved.reviewedBy,'owner@test.example');
 const projected=(await json(send('/api/records',null,user.cookie))).body.records;
 const staffStudent=projected.find(x=>x.id===s.id);assert.ok(staffStudent);assert.equal(staffStudent.documents?.some(x=>x.key===upload.body.key),false);
 assert.ok(projected.some(x=>x.id===req.id));
 assert.equal((await send('/api/records',{records:[{...saved,notes:'Secretly editing approved funding'}]},user.cookie)).status,403);
 assert.equal((await send('/api/records',{records:[{...saved,authorizedAmount:4500}]},owner.cookie)).status,400);
 assert.equal((await send('/api/records',{records:[{...saved,authorizedAmount:4500,correctionReason:'Approved revised agency cap with documented review'}]},owner.cookie)).status,200);
 assert.equal((await send('/api/records',{records:[{...req,id:crypto.randomUUID(),status:'Awaiting authorization'}]},owner.cookie)).status,409);
 console.log('PASS: funding requests, manager-approved document evidence, campus isolation, privacy, duplicate prevention, corrections and accurate internal packet totals.');
}finally{rmSync(process.env.ACADEMY_DATA_DIR,{recursive:true,force:true});}
