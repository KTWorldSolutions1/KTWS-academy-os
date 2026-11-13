import {database,bucket} from '../../../lib/storage';
import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {employeeContext} from './portal';
import {canReadOnboardingFile,canReviewOnboarding,canFinalizeOnboarding,type OnboardingFileGroup} from '../../../lib/employee-onboarding-policy';
import {encrypt,decrypt} from '../../../lib/encryption';
import {env} from '../../../lib/env';

const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const json=(x:any,status=200)=>Response.json(x,{status,headers});
const deny=(error:string,status=403)=>json({error},status);
const formGroups:Record<string,OnboardingFileGroup>={
 'emergency-contact':'personnel','handbook-acknowledgement':'personnel','policy-acknowledgement':'personnel','role-credential':'personnel',
 'federal-w4':'payroll','nc4':'payroll','nc4-ez':'payroll','direct-deposit':'payroll',
 'i9-section-1':'eligibility','i9-section-2':'eligibility'
};
const gates=()=>env.EMPLOYEE_ONBOARDING_ENABLED==='true'&&env.EMPLOYEE_ONBOARDING_ACCEPTANCE_APPROVED==='true'&&env.SCHOOL_FILE_UPLOADS_ENABLED==='true'&&env.EMPLOYEE_ONBOARDING_SIGNING_APPROVED==='true';
const validId=(id:any)=>typeof id==='string'&&/^[0-9a-f-]{36}$/i.test(id);
async function audit(db:any,id:string,action:string,actor:string,details:any={}){
 await db.prepare('INSERT INTO employee_onboarding_audit(id,case_id,action,actor,at,details) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),id,action,actor,new Date().toISOString(),JSON.stringify(details)).run();
}
async function employeeOrReviewer(req:Request,caseId:string){
 const emp=await employeeContext(req);
 if(emp&&emp.caseData.id===caseId)return {db:emp.db,c:emp.caseData,employee:true,access:null,privileged:false};
 const access=await getWorkspaceAccess();if(!access)return null;
 const db=database(),c:any=await db.prepare('SELECT * FROM employee_onboarding_cases WHERE id=?').bind(caseId).first();
 if(!c)return null;
 const grant:any=await db.prepare('SELECT COUNT(*) AS n FROM employee_onboarding_hr_grants WHERE email=? AND campus_id=? AND revoked_at IS NULL').bind(access.user.email.toLowerCase(),c.campus_id).first();
 const privileged=Number(grant?.n||0)>0,actor={role:access.role,campusIds:access.campusIds,hasRestrictedHrAccess:privileged};
 if(!canReviewOnboarding(actor,c.campus_id))return null;
 return {db,c,employee:false,access,privileged};
}
async function groupGrant(db:any,email:string,campus:string,group:OnboardingFileGroup){
 if(group==='personnel')return false;
 const g:any=await db.prepare('SELECT email FROM employee_onboarding_hr_grants WHERE email=? AND campus_id=? AND group_name=? AND revoked_at IS NULL').bind(email.toLowerCase(),campus,group).first();
 return !!g;
}
async function canAccessGroup(ctx:any,group:OnboardingFileGroup){
 if(ctx.employee)return true;
 const can=await groupGrant(ctx.db,ctx.access.user.email,ctx.c.campus_id,group);
 return canReadOnboardingFile({role:ctx.access.role,campusIds:ctx.access.campusIds,hasRestrictedHrAccess:group==='personnel'?ctx.privileged:can},ctx.c.campus_id,group);
}
async function latest(db:any,id:string){
 const r:any=await db.prepare('SELECT * FROM employee_onboarding_documents WHERE case_id=? ORDER BY version DESC,submitted_at DESC').bind(id).all();
 const m=new Map<string,any>();for(const d of r.results)if(!m.has(d.form_name))m.set(d.form_name,d);
 return m;
}
function employeeRequired(c:any,docs:Map<string,any>){
 const base=['emergency-contact','handbook-acknowledgement','policy-acknowledgement','federal-w4','direct-deposit','i9-section-1'];
 if(!docs.has('nc4')&&!docs.has('nc4-ez'))base.push('nc4 or nc4-ez');
 if(/instructor|recruiter/i.test(c.job_title))base.push('role-credential');
 return base.filter(f=>f==='nc4 or nc4-ez'||!docs.has(f));
}
export async function GET(req:Request){
 if(!gates())return deny('Confidential employee document access is not enabled until security acceptance.',503);
 const url=new URL(req.url),caseId=url.searchParams.get('caseId')||'';
 if(!validId(caseId))return deny('Valid hiring case required',400);
 const ctx=await employeeOrReviewer(req,caseId);if(!ctx)return deny('Not authorized',403);
 const printGroup=url.searchParams.get('printGroup');
 if(printGroup){
  if(ctx.employee||!['personnel','payroll','eligibility'].includes(printGroup)||!await canAccessGroup(ctx,printGroup as OnboardingFileGroup))return deny('Printable HR index unavailable for this role',403);
  const docs=await latest(ctx.db,caseId);
  const escape=(s:any)=>String(s??'').replace(/[&<>"']/g,(ch:string)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as Record<string,string>)[ch]);
  const rows=[...docs.values()].filter((d:any)=>d.group_name===printGroup).map((d:any)=>
   '<tr><td>'+escape(d.form_name)+'</td><td>'+escape(d.version)+'</td><td>'+escape(d.submitted_at)+'</td><td>'+escape(d.verified_at||'Pending')+'</td></tr>').join('');
  const page='<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Restricted Employee File Index</title><style>body{font:15px system-ui;padding:36px;color:#1d3143}h1{font-size:23px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #9baab6;text-align:left;padding:10px}small{color:#526779}.note{margin-top:25px;border-top:1px solid #ccc;padding-top:15px}@media print{body{padding:0}}</style></head><body><h1>Lone Star Truck Driving Academy</h1><h2>'+escape(printGroup).toUpperCase()+' — employee file index</h2><p><strong>'+escape(ctx.c.employee_name)+'</strong> · '+escape(ctx.c.job_title)+' · start '+escape(ctx.c.start_date)+'</p><p>Case '+escape(caseId)+' · Status '+escape(ctx.c.status)+'</p><table><thead><tr><th>Form</th><th>Version</th><th>Submitted</th><th>HR verified</th></tr></thead><tbody>'+rows+'</tbody></table><p class="note"><small>This is a printable file index, not a substitute for original signed forms. Download each restricted original separately. Keep I-9 records separate from general personnel files.</small></p></body></html>';
  await audit(ctx.db,caseId,'Restricted employee file index opened',ctx.access.user.email,{group:printGroup});
  return new Response(page,{status:200,headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'"}});
 }
 const docId=url.searchParams.get('documentId');
 if(docId){
  if(!validId(docId))return deny('Invalid document identifier',400);
  const doc:any=await ctx.db.prepare('SELECT * FROM employee_onboarding_documents WHERE id=? AND case_id=?').bind(docId,caseId).first();
  if(!doc||!await canAccessGroup(ctx,doc.group_name))return deny('Document not accessible',403);
  const file:any=await bucket().get(doc.r2_key);if(!file)return deny('Encrypted record not found',404);
  const plain=await decrypt(await file.arrayBuffer());
  await audit(ctx.db,caseId,'Confidential document downloaded',ctx.employee?'employee':ctx.access.user.email,{docId,form:doc.form_name});
  return new Response(plain,{status:200,headers:{...headers,'Content-Type':doc.mime,'Content-Disposition':'attachment; filename="'+doc.form_name+'-'+doc.version+'.'+(doc.mime==='application/pdf'?'pdf':doc.mime==='image/png'?'png':'jpg')+'"','X-Content-Type-Options':'nosniff'}});
 }
 const docs=await latest(ctx.db,caseId);
 const results=[];for(const d of docs.values()){
  if(!ctx.employee&&!await canAccessGroup(ctx,d.group_name))continue;
  results.push({id:d.id,formName:d.form_name,group:d.group_name,version:d.version,submittedAt:d.submitted_at,verifiedAt:d.verified_at,verificationNote:d.verification_note||''});
 }
 return json({caseId,status:ctx.c.status,documents:results,missingEmployeeForms:employeeRequired(ctx.c,docs),canManage:!ctx.employee});
}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return deny('Invalid origin',403);
 if(!gates())return deny('Private onboarding documents remain paused until independent security and signing acceptance.',503);
 const contentType=req.headers.get('Content-Type')||'';
 if(contentType.includes('multipart/form-data')){
  if(Number(req.headers.get('Content-Length')||0)>8_500_000)return deny('File exceeds limit',413);
  const data=await req.formData(),caseId=String(data.get('caseId')||''),formName=String(data.get('formName')||''),file=data.get('file');
  if(!validId(caseId)||!formGroups[formName]||!(file instanceof File)||!file.size||file.size>8_000_000)return deny('Invalid form upload',400);
  if(!['application/pdf','image/jpeg','image/png'].includes(file.type))return deny('Only PDF, JPG or PNG evidence is accepted',400);
  const group=formGroups[formName],ctx=await employeeOrReviewer(req,caseId);if(!ctx)return deny('Not authorized',403);
  if(ctx.c.status==='Complete'||ctx.c.status==='Cancelled')return deny('This hiring case is closed',409);
  if(ctx.employee&&!['In progress','Corrections requested'].includes(ctx.c.status))return deny('Employee document submissions are closed during employer review',409);
  if(!ctx.employee&&(formName!=='i9-section-2'||!['Employee submitted','HR review'].includes(ctx.c.status)))return deny('Employer upload is limited to I-9 Section 2 after employee submission',403);
  if(ctx.employee&&formName==='i9-section-2')return deny('I-9 Section 2 must be completed by an authorized employer representative',403);
  if(!ctx.employee&&(!await canAccessGroup(ctx,group)||formName==='i9-section-1'))return deny('Only an authorized employee may upload this form',403);
  const bytes=new Uint8Array(await file.arrayBuffer());
  const valid=file.type==='application/pdf'?bytes.length>5&&String.fromCharCode(...bytes.slice(0,5))==='%PDF-':
   file.type==='image/png'?[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v):
   bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(!valid)return deny('File signature did not match file type',400);
  const existing=await latest(ctx.db,caseId),previous=existing.get(formName);
  if(previous?.verified_at)return deny('Verified forms cannot be overwritten. Ask authorized HR to request a correction.',409);
  const version=(previous?.version||0)+1,id=crypto.randomUUID(),key='onboarding/'+crypto.randomUUID(),at=new Date().toISOString();
  const encrypted=await encrypt(bytes.buffer as ArrayBuffer);
  await bucket().put(key,encrypted,{httpMetadata:{contentType:'application/octet-stream'}});
  try{
   await ctx.db.prepare('INSERT INTO employee_onboarding_documents(id,case_id,group_name,form_name,r2_key,mime,size_bytes,version,submitted_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,caseId,group,formName,key,file.type,file.size,version,at).run();
  }catch(e){await bucket().delete(key);throw e;}
  await audit(ctx.db,caseId,'Encrypted onboarding evidence uploaded',ctx.employee?'employee':ctx.access.user.email,{docId:id,formName,version});
  if(ctx.employee&&ctx.c.status==='Corrections requested')await ctx.db.prepare("UPDATE employee_onboarding_cases SET status='In progress',updated_at=? WHERE id=?").bind(at,caseId).run();
  return json({uploaded:true,id,formName,version},201);
 }
 if(Number(req.headers.get('Content-Length')||0)>6000)return deny('Payload too large',413);
 let b:any;try{b=await req.json()}catch{return deny('Invalid JSON',400)}
 if(b.action==='grant'){
  const a=await getWorkspaceAccess();if(a?.role!=='Owner')return deny('Owner permission required',403);
  const caseId=String(b.caseId||''),email=String(b.email||'').toLowerCase().trim(),group=b.group;
  if(!validId(caseId)||!['payroll','eligibility'].includes(group)||!/^\S+@\S+\.\S+$/.test(email)||typeof b.enabled!=='boolean')return deny('Invalid HR permission request',400);
  const db=database(),c:any=await db.prepare('SELECT campus_id FROM employee_onboarding_cases WHERE id=?').bind(caseId).first();
  if(!c)return deny('Hiring case not found',404);
  const staff:any=await db.prepare("SELECT payload FROM records WHERE owner='academy-owner' AND kind='staff' AND lower(json_extract(payload,'$.email'))=? AND json_extract(payload,'$.status')='Active'").bind(email).first();
  const profile=staff?JSON.parse(staff.payload):null;
  if(!profile||!['School owner','Campus manager','Regional admin','Admin assistant'].includes(profile.accessRole)||
    profile.accessRole!=='School owner'&&!profile.campusIds?.includes(c.campus_id))return deny('Choose an active, authorized school HR employee in the correct campus',403);
  if(b.enabled)await db.prepare('INSERT INTO employee_onboarding_hr_grants(email,campus_id,group_name,approved_by,approved_at,revoked_at) VALUES(?,?,?,?,?,NULL) ON CONFLICT(email,campus_id,group_name) DO UPDATE SET approved_by=excluded.approved_by,approved_at=excluded.approved_at,revoked_at=NULL').bind(email,c.campus_id,group,a.user.email,new Date().toISOString()).run();
  else await db.prepare('UPDATE employee_onboarding_hr_grants SET revoked_at=? WHERE email=? AND campus_id=? AND group_name=?').bind(new Date().toISOString(),email,c.campus_id,group).run();
  await audit(db,caseId,b.enabled?'Restricted HR access granted':'Restricted HR access revoked',a.user.email,{email,group});
  return json({updated:true,group,enabled:b.enabled});
 }
 const caseId=String(b.caseId||'');if(!validId(caseId))return deny('Invalid case ID',400);
 const ctx=await employeeOrReviewer(req,caseId);if(!ctx)return deny('Not authorized',403);
 if(b.action==='submit'){
  if(!ctx.employee)return deny('Only the employee may submit their forms',403);
  if(!['In progress','Corrections requested'].includes(ctx.c.status))return deny('Onboarding is not ready for submission',409);
  const missing=employeeRequired(ctx.c,await latest(ctx.db,caseId));if(missing.length)return json({error:'Complete required forms first.',missing},409);
  await ctx.db.prepare("UPDATE employee_onboarding_cases SET status='Employee submitted',updated_at=? WHERE id=?").bind(new Date().toISOString(),caseId).run();
  await audit(ctx.db,caseId,'Employee submitted onboarding packet','employee');
  return json({submitted:true});
 }
 if(ctx.employee)return deny('Employer review is restricted',403);
 if(b.action==='verify'||b.action==='reject'){
  const id=String(b.documentId||''),note=String(b.note||'').trim();if(!validId(id)||b.action==='reject'&&(note.length<5||note.length>500))return deny('Review needs a valid document and correction reason',400);
  const d:any=await ctx.db.prepare('SELECT * FROM employee_onboarding_documents WHERE id=? AND case_id=?').bind(id,caseId).first();
  if(!d||!await canAccessGroup(ctx,d.group_name))return deny('Document not authorized',403);
  if(!['Employee submitted','HR review','Corrections requested'].includes(ctx.c.status))return deny('Employee must submit before HR verification',409);
  const at=new Date().toISOString();
  if(b.action==='verify'){
   if(b.confirmedOriginal!==true)return deny('Confirm the supplied official document and signature were personally verified',400);
   await ctx.db.prepare('UPDATE employee_onboarding_documents SET verified_by=?,verified_at=?,verification_note=? WHERE id=?').bind(ctx.access.user.email,at,note||'Verified',id).run();
  }else{
   await ctx.db.prepare('UPDATE employee_onboarding_documents SET verified_by=NULL,verified_at=NULL,verification_note=? WHERE id=?').bind('Correction: '+note,id).run();
   await ctx.db.prepare("UPDATE employee_onboarding_cases SET status='Corrections requested',updated_at=? WHERE id=?").bind(at,caseId).run();
  }
  await audit(ctx.db,caseId,b.action==='verify'?'Document verified':'Correction requested',ctx.access.user.email,{documentId:id,form:d.form_name,reason:b.action==='reject'?note:''});
  return json({reviewed:true});
 }
 if(b.action==='hr-verified'){
  if(!['Employee submitted','HR review'].includes(ctx.c.status))return deny('Employee submission is required',409);
  if(!await canAccessGroup(ctx,'payroll')||!await canAccessGroup(ctx,'eligibility'))return deny('Authorized payroll and I-9 review entitlements are required',403);
  const docs=await latest(ctx.db,caseId),missing=employeeRequired(ctx.c,docs);
  if(!docs.has('i9-section-2'))missing.push('i9-section-2');
  if(missing.length)return json({error:'Missing documents',missing},409);
  const unverified=[...docs.values()].filter((d:any)=>!d.verified_at).map((d:any)=>d.form_name);
  if(unverified.length)return json({error:'All submitted forms must be HR verified.',unverified},409);
  const at=new Date().toISOString();
  await ctx.db.prepare("UPDATE employee_onboarding_cases SET status='HR verified',reviewed_by=?,reviewed_at=?,updated_at=? WHERE id=?").bind(ctx.access.user.email,at,at,caseId).run();
  await audit(ctx.db,caseId,'HR packet verified',ctx.access.user.email);
  return json({hrVerified:true});
 }
 if(b.action==='final-approve'){
  if(!canFinalizeOnboarding({role:ctx.access.role,campusIds:ctx.access.campusIds},ctx.c.campus_id))return deny('Assigned campus manager required',403);
  if(ctx.c.status!=='HR verified'||!ctx.c.reviewed_at)return deny('HR verification must be complete first',409);
  const at=new Date().toISOString();
  await ctx.db.prepare("UPDATE employee_onboarding_cases SET status='Complete',approved_by=?,approved_at=?,updated_at=? WHERE id=? AND status='HR verified'").bind(ctx.access.user.email,at,at,caseId).run();
  await audit(ctx.db,caseId,'Campus manager final approval',ctx.access.user.email);
  return json({approved:true,staffActivation:'Requires separate owner-controlled staff account setup'});
 }
 return deny('Unsupported onboarding action',400);
}
