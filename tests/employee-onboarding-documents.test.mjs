import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
process.env.ACADEMY_TEST='true';process.env.PUBLIC_ORIGIN='https://academy.test';process.env.ACADEMY_DATA_DIR=mkdtempSync(join(tmpdir(),'academy-onboarding-vault-'));
process.env.RECORDS_ENCRYPTION_KEY='cc'.repeat(32);
process.env.EMPLOYEE_ONBOARDING_ENABLED='true';process.env.EMPLOYEE_ONBOARDING_ACCEPTANCE_APPROVED='true';process.env.SCHOOL_FILE_UPLOADS_ENABLED='true';process.env.EMPLOYEE_ONBOARDING_SIGNING_APPROVED='true';
const {handle}=await import('../dist-server/index.js');
const send=(path,body,cookie)=>handle(new Request('https://academy.test'+path,{method:body?'POST':'GET',headers:{Origin:'https://academy.test','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})}));
const read=async p=>{const r=await p;return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}};
const pdf=new File(['%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF'], 'form.pdf',{type:'application/pdf'});
const upload=async(caseId,formName,cookie)=>{const fd=new FormData();fd.set('caseId',caseId);fd.set('formName',formName);fd.set('file',pdf);return read(handle(new Request('https://academy.test/api/employee-onboarding/documents',{method:'POST',headers:{Origin:'https://academy.test',...(cookie?{Cookie:cookie}:{})},body:fd})))};
try{
 const setup=spawnSync(process.execPath,['dist-server/setup-owner.js','owner@test.example'],{env:process.env,encoding:'utf8'});assert.equal(setup.status,0,setup.stderr);
 const owner=await read(send('/api/auth/activate',{token:setup.stdout.split('#token=')[1].trim(),password:'long owner password 2026'},null));assert.equal(owner.status,200);
 const ca={id:crypto.randomUUID(),kind:'campuses',name:'Greensboro',status:'Active'};
 const manager={id:crypto.randomUUID(),kind:'staff',name:'Campus Manager',status:'Active',accessRole:'Campus manager',campusIds:[ca.id],email:'manager@test.example'};
 const hr={id:crypto.randomUUID(),kind:'staff',name:'HR Associate',status:'Active',accessRole:'Admin assistant',campusIds:[ca.id],email:'hr@test.example'};
 assert.equal((await send('/api/records',{records:[ca,manager,hr]},owner.cookie)).status,200);
 const createStaff=async(s,password)=>{
  const inv=await read(send('/api/accounts/invite',{staffId:s.id},owner.cookie));assert.equal(inv.status,200,JSON.stringify(inv.body));
  const r=await read(send('/api/auth/activate',{token:inv.body.link.split('#token=')[1],password}));assert.equal(r.status,200,JSON.stringify(r.body));return r.cookie;
 };
 const managerCookie=await createStaff(manager,'manager unique password 2026'),hrCookie=await createStaff(hr,'hr unique password 2026');
 const created=await read(send('/api/employee-onboarding',{action:'create',name:'Test Onboarding Candidate',email:'newhire@test.example',phone:'+13365550121',jobTitle:'CDL Instructor',campusId:ca.id,startDate:'2026-12-01',acceptedOfferAt:new Date().toISOString(),offerAccepted:true},managerCookie));
 assert.equal(created.status,201,JSON.stringify(created.body));const id=created.body.id;
 assert.equal((await send('/api/employee-onboarding',null,hrCookie)).status,200);
 const hrBefore=await read(send('/api/employee-onboarding',null,hrCookie));assert.equal(hrBefore.body.cases.length,0,'HR assistant cannot see queue before explicit grant');
 const inv=await read(send('/api/employee-onboarding/invitations',{caseId:id},managerCookie));assert.equal(inv.status,200,JSON.stringify(inv.body));
 const redeem=await read(send('/api/employee-onboarding/portal',{action:'redeem',token:inv.body.testLink.split('#token=')[1]}));assert.equal(redeem.status,200);
 const empCookie=redeem.cookie;
 assert.equal((await upload(id,'i9-section-2',empCookie)).status,403);
 assert.equal((await upload(id,'federal-w4',managerCookie)).status,403);
 const required=['emergency-contact','handbook-acknowledgement','policy-acknowledgement','federal-w4','nc4','direct-deposit','i9-section-1','role-credential'];
 const uploads=[];
 for(const name of required){const r=await upload(id,name,empCookie);assert.equal(r.status,201,name+': '+JSON.stringify(r.body));uploads.push(r.body);}
 const employeeList=await read(send('/api/employee-onboarding/documents?caseId='+id,null,empCookie));
 assert.equal(employeeList.status,200);assert.deepEqual(employeeList.body.missingEmployeeForms,[]);
 const managerList=await read(send('/api/employee-onboarding/documents?caseId='+id,null,managerCookie));
 assert.equal(managerList.status,200);assert.ok(managerList.body.documents.every(d=>d.group==='personnel'));
 const restrictedId=uploads.find(x=>x.formName==='federal-w4').id;
 assert.equal((await send('/api/employee-onboarding/documents?caseId='+id+'&documentId='+restrictedId,null,managerCookie)).status,403);
 const submit=await read(send('/api/employee-onboarding/documents',{action:'submit',caseId:id},empCookie));assert.equal(submit.status,200,JSON.stringify(submit.body));
 assert.equal((await upload(id,'emergency-contact',empCookie)).status,409,'Employee cannot alter submitted packet');
 assert.equal((await send('/api/employee-onboarding/documents',{action:'grant',caseId:id,email:'hr@test.example',group:'payroll',enabled:true},managerCookie)).status,403);
 for(const group of ['payroll','eligibility']){
  const grant=await read(send('/api/employee-onboarding/documents',{action:'grant',caseId:id,email:'hr@test.example',group,enabled:true},owner.cookie));
  assert.equal(grant.status,200,JSON.stringify(grant.body));
 }
 const hrNow=await read(send('/api/employee-onboarding',null,hrCookie));assert.ok(hrNow.body.cases.some(x=>x.id===id));
 const hrdocs=await read(send('/api/employee-onboarding/documents?caseId='+id,null,hrCookie));assert.equal(hrdocs.status,200,JSON.stringify(hrdocs.body));
 assert.equal(hrdocs.body.documents.length,required.length);
 const download=await send('/api/employee-onboarding/documents?caseId='+id+'&documentId='+restrictedId,null,hrCookie);
 assert.equal(download.status,200);assert.match(download.headers.get('Content-Disposition'),/attachment/);assert.match(await download.text(),/%PDF-1.4/);
 const i9=await upload(id,'i9-section-2',hrCookie);assert.equal(i9.status,201,JSON.stringify(i9.body));
 const all=await read(send('/api/employee-onboarding/documents?caseId='+id,null,hrCookie));
 for(const d of all.body.documents){
  const checked=await read(send('/api/employee-onboarding/documents',{action:'verify',caseId:id,documentId:d.id,confirmedOriginal:true},hrCookie));
  assert.equal(checked.status,200,JSON.stringify(checked.body));
 }
 const hrVerified=await read(send('/api/employee-onboarding/documents',{action:'hr-verified',caseId:id},hrCookie));assert.equal(hrVerified.status,200,JSON.stringify(hrVerified.body));
 assert.equal((await send('/api/employee-onboarding/documents',{action:'final-approve',caseId:id},hrCookie)).status,403);
 const final=await read(send('/api/employee-onboarding/documents',{action:'final-approve',caseId:id},managerCookie));assert.equal(final.status,200,JSON.stringify(final.body));
 const ownerCase=await read(send('/api/employee-onboarding',null,owner.cookie));assert.equal(ownerCase.body.cases.find(c=>c.id===id).status,'Complete');
 assert.equal((await send('/api/employee-onboarding/documents?caseId='+id,null,empCookie)).status,403,'Completed cases close employee session');
 console.log('PASS: encrypted employee forms, explicit payroll/I-9 HR grant, document verification and final campus manager approval');
}finally{rmSync(process.env.ACADEMY_DATA_DIR,{recursive:true,force:true})}
