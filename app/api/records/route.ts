import {getWorkspaceAccess,canWrite,canRead,projectRecord} from '../../../lib/workspace-access';
import {database} from '../../../lib/storage';
import {validateRecord,preserveHistory,today,RecordData as R} from '../../../lib/training';
import {validateAdmissions,appointmentConflict,classRoster,enrollmentChecks} from '../../../lib/admissions';
export const dynamic='force-dynamic';
import {campusAllowed,campusOf,validateEnterprise,restrictedCategories} from '../../../lib/enterprise';
import {graduationReadiness} from '../../../lib/enterprise';
import {trainingFollowUps} from '../../../lib/actions';
import {validateStaffShift,staffShiftConflicts} from '../../../lib/staff-scheduling';
import {validateTrainingDispatch,dispatchRecordProblem,unresolvedVehicleDefects} from '../../../lib/training-dispatch';
import {validateEmploymentOffer} from '../../../lib/employment-offers';
import {validateSponsorship} from '../../../lib/sponsor-funding';
import {validateCampusReadiness} from '../../../lib/campus-readiness';
import {validateStaffCredential} from '../../../lib/staff-credentials';
import {validateTprTracking} from '../../../lib/tpr-preflight';
import {validateSafetyRecord} from '../../../lib/safety-incidents';
import {validateLessonRecord,validateLessonLinks} from '../../../lib/lesson-checkoffs';
import {validateGrowth,preserveGrowth,growthLinkProblem} from '../../../lib/growth';
const kinds=['students','leads','tasks','fleet','funding','finance','courses','staff','settings','quizzes','lessons','schedules','classes','appointments','enrollments','campuses','partners','mous','contracts','templates','messages','tpr','referrals','shifts','employment-offers','training-assignments','vehicle-checks','sponsorships','campus-readiness','staff-credentials','safety-incidents','safety-reviews','curriculum-units','unit-evidence'];
export async function GET(){const access=await getWorkspaceAccess();if(!access)return Response.json({error:'Sign in required'},{status:401});try{const db=database();const rows=await db.prepare('SELECT * FROM records WHERE owner = ? ORDER BY updated DESC').bind(access.scope).all();const log=await db.prepare("SELECT id,owner,record_id,action,at,payload,actor,revision FROM audit WHERE owner = ? AND record_id != '__workspace__' ORDER BY at DESC LIMIT 200").bind(access.scope).all();return Response.json({records:rows.results.filter((r:any)=>canRead(access.role,r.kind)&&campusAllowed(access.role,access.campusIds,{...JSON.parse(r.payload),id:r.id,kind:r.kind},rows.results.map((x:any)=>JSON.parse(x.payload)))).map((r:any)=>projectRecord({...JSON.parse(r.payload),id:r.id,kind:r.kind,revision:r.revision},access.role)),audit:['Instructor','Front desk'].includes(access.role)?[]:log.results.filter((l:any)=>{const record:any=rows.results.find((x:any)=>x.id===l.record_id);return access.role==='Owner'||(record&&canRead(access.role,record.kind)&&campusAllowed(access.role,access.campusIds,JSON.parse(record.payload),rows.results.map((x:any)=>JSON.parse(x.payload))));}),workspace:{role:access.role,shared:access.scope!==access.user.userId,campusIds:access.campusIds}},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error('Record load unavailable',e);return Response.json({error:'Unable to load records. Please retry.'},{status:503});}}
export async function POST(req:Request){const access=await getWorkspaceAccess();if(!access)return Response.json({error:'Sign in required'},{status:401});if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 try{const body:any=await req.json(),list:R[]=body.records;if(!Array.isArray(list)||!list.length||list.length>60||new Set(list.map(r=>r.id)).size!==list.length)return Response.json({error:'Invalid record batch'},{status:400});const db=database(),now=new Date().toISOString();const guard:any=await db.prepare("SELECT MAX(revision) AS revision FROM audit WHERE owner = ? AND record_id = '__workspace__'").bind(access.scope).first();const guardRevision=Number(guard?.revision||0)+1;const rows=await db.prepare('SELECT * FROM records WHERE owner = ?').bind(access.scope).all();const current:R[]=rows.results.map((r:any)=>({...JSON.parse(r.payload),id:r.id,kind:r.kind,revision:r.revision}));const updates:R[]=[];const proposed=[...current.filter(x=>!list.some(r=>r.id===x.id)),...list];
 for(let r of list){if(!canWrite(access.role,r.kind))return Response.json({error:'Your school role cannot change this record.'},{status:403});if(!r||!kinds.includes(r.kind)||JSON.stringify(r).length>300000)return Response.json({error:'Invalid record'},{status:400});const problem=validateRecord(r)||validateAdmissions(r)||validateEnterprise(r)||validateGrowth(r)||validateStaffShift(r)||validateEmploymentOffer(r)||validateTrainingDispatch(r)||validateTprTracking(r)||validateSponsorship(r)||validateCampusReadiness(r)||validateStaffCredential(r)||validateSafetyRecord(r)||validateLessonRecord(r);if(problem)return Response.json({error:problem},{status:400});const old=current.find(x=>x.id===r.id);
 if(r.kind==='students'&&r.status==='Graduated'&&old?.status!=='Graduated'){
  const missing=graduationReadiness(r,proposed).gaps.filter(x=>x.startsWith('School lesson checkoff:'));
  if(missing.length)return Response.json({error:'Complete the campus-approved lesson checkoffs before recording graduation. Missing: '+missing.slice(0,3).join('; ')+(missing.length>3?' and '+(missing.length-3)+' more':'')},{status:400});
 }
 if(old&&r.kind==='unit-evidence')return Response.json({error:'Signed lesson checkoffs cannot be overwritten. Add a correction linked to the earlier entry.'},{status:403});
 if(r.kind==='unit-evidence'&&['recordedBy','recordedAt','reviewedBy','reviewedAt'].some(k=>r[k]!==undefined))return Response.json({error:'Lesson reviewer and date are recorded by the school server.'},{status:403});
 if(old&&r.kind==='curriculum-units'){
  if(['Approved','Retired'].includes(old.status)&&!(old.status==='Approved'&&r.status==='Retired'&&['status','revision','retiredAt','retiredBy'].every(k=>true)&&Object.keys({...old,...r}).every(k=>['status','revision','retiredAt','retiredBy'].includes(k)||JSON.stringify(r[k])===JSON.stringify(old[k]))))return Response.json({error:'Approved curriculum versions cannot be rewritten. Retire this version and create a new one.'},{status:403});
  if(old.status==='Draft'&&r.status==='Retired')return Response.json({error:'Only approved lessons can be retired.'},{status:403});
  if(old.status==='Retired')return Response.json({error:'Retired curriculum is permanent school history.'},{status:403});
 }
 if(r.kind==='curriculum-units'&&['approvedBy','approvedAt','retiredBy','retiredAt'].some(k=>!old&&r[k]!==undefined))return Response.json({error:'Curriculum approvals are recorded by the school server.'},{status:403});
 if(old&&['safety-incidents','safety-reviews'].includes(r.kind))return Response.json({error:'Original safety reports and management decisions cannot be edited. Add a new management review instead.'},{status:403});
 if(['safety-incidents','safety-reviews'].includes(r.kind)&&r.date>today())return Response.json({error:'Future safety incidents and reviews cannot be recorded as completed.'},{status:400});
 if(['safety-incidents','safety-reviews'].includes(r.kind)&&['reportedBy','reportedAt','reviewedBy','reviewedAt'].some(k=>r[k]!=null))return Response.json({error:'Safety author identity and time are recorded by the server.'},{status:403});
 if(old&&r.kind==='tpr'&&old.status==='Confirmed'&&!['Owner','Campus manager'].includes(access.role))return Response.json({error:'Only school management can correct an externally confirmed FMCSA tracking record.'},{status:403});if(old&&r.kind==='tpr'&&old.status==='Confirmed'&&r.status!=='Confirmed'&&(!r.correctionReason||String(r.correctionReason).trim().length<12))return Response.json({error:'Document the reason before changing a previously confirmed external submission.'},{status:400});if(r.kind==='messages'){
  // Sender services alone may create delivery evidence. Staff can create
  // and edit drafts but cannot impersonate a provider or manufacture receipts.
  if(r.status!=='Draft'||old&&old.status!=='Draft')return Response.json({error:'Delivered, accepted and failed message records are created only by the sending service.'},{status:403});
  if(!['Email','SMS'].includes(r.channel)||typeof r.body!=='string'||!r.body.trim()||r.body.length>10000||typeof r.subject!=='string'||r.subject.length>300)return Response.json({error:'Enter a valid draft and message channel.'},{status:400});
  const student=proposed.find(x=>x.id===r.studentId&&['students','leads'].includes(x.kind));
  if(!student||campusOf(student,proposed)!==r.campusId||!campusAllowed(access.role,access.campusIds,student,proposed))return Response.json({error:'Choose an accessible student or lead for this draft.'},{status:403});
  if(['to','providerId','providerStatus','sentAt','deliveredAt'].some(key=>r[key]!=null)||!old&&['actor','createdAt','draftBy'].some(key=>r[key]!=null))return Response.json({error:'Only the sending service may record recipient or delivery evidence.'},{status:403});
  if(old&&['actor','createdAt','draftBy'].some(key=>JSON.stringify(r[key])!==JSON.stringify(old[key])))return Response.json({error:'Original message author and creation time are protected.'},{status:403});
 }
 if(r.kind==='training-assignments'){
  if(old&&['Completed','Cancelled'].includes(old.status))return Response.json({error:'Completed and cancelled lessons are permanent school history. Record a new plan instead of rewriting the original.'},{status:403});
  if(r.status==='Completed'&&(!old||old.status!=='Confirmed'))return Response.json({error:'Only a previously confirmed lesson can be completed after attendance and truck checks are recorded.'},{status:403});
  if(old&&old.status==='Confirmed'&&['campusId','studentId','employeeId','unitId','date','start','end','phase'].some(key=>JSON.stringify(old[key])!==JSON.stringify(r[key])))return Response.json({error:'A confirmed lesson cannot change student, instructor, truck or time. Cancel it and create a new one.'},{status:403});
 }
 if(old&&r.kind==='vehicle-checks')return Response.json({error:'Safety inspections and defect clearances are permanent evidence. Add a new record instead of changing an earlier one.'},{status:403});if(!campusAllowed(access.role,access.campusIds,r,[...current,...list])||(old&&!campusAllowed(access.role,access.campusIds,old,current)))return Response.json({error:'This record is outside your campus access.'},{status:403});if(access.role==='Instructor'&&r.kind==='students'){if(!old)return Response.json({error:'Instructors cannot create enrollment records.'},{status:403});if(r.status!==old.status&&!['Classroom','Yard','Road'].includes(r.status))return Response.json({error:'Instructors can only change classroom, yard or road location.'},{status:403});r={...old,status:r.status,sessions:r.sessions||old.sessions,evaluations:r.evaluations||old.evaluations,assessments:r.assessments||old.assessments,theorySignoff:r.theorySignoff,revision:r.revision};}if(old&&(old.revision!==r.revision||old.kind!==r.kind))return Response.json({error:'This record changed. Reload before saving.'},{status:409});if(!old){const collision=await db.prepare('SELECT id FROM records WHERE id = ?').bind(r.id).first();if(collision)return Response.json({error:'Record ID is already in use'},{status:409});}if(old&&['Enrollment specialist','Admin assistant'].includes(access.role)&&r.kind==='students'&&(['sessions','evaluations','assessments'].some(k=>JSON.stringify(old[k]||[])!==JSON.stringify(r[k]||[]))||JSON.stringify(old.theorySignoff)!==JSON.stringify(r.theorySignoff)))return Response.json({error:'Training evaluations require an instructor or campus manager.'},{status:403});if(old&&r.kind==='students'&&['Enrollment specialist','Admin assistant'].includes(access.role)){
  const hidden=['ssn','ssnLast4','drugScreen','dob','medical','medicalQualification','licenseNumber','clpNumber','driverRecordDate'];
  for(const field of hidden)if(r[field]!==undefined&&JSON.stringify(r[field])!==JSON.stringify(old[field]))return Response.json({error:'Restricted student details require campus management access.'},{status:403});
  const restrictedDocs=(old.documents||[]).filter((d:any)=>restrictedCategories.includes(d.category));
  if((r.documents||[]).some((d:any)=>restrictedDocs.some((hiddenDoc:any)=>hiddenDoc.key===d.key)))return Response.json({error:'Restricted student files are not editable in this role.'},{status:403});
  r={...r,documents:[...(r.documents||[]),...restrictedDocs]};
  for(const field of hidden)if(old[field]!==undefined)r[field]=old[field];
 }
 if(old){const p=preserveHistory(old,r)||preserveGrowth(old,r);if(p)return Response.json({error:p},{status:400});}
 for(const field of ['agencyId','classId','studentId','personId','leadId','unitId','partnerId','sponsorId','eventId','preferredClassId','sourceReferral','referralId','employeeId','staffId']){if(r[field]){const linked=proposed.find(x=>x.id===r[field]);if(linked&&!campusAllowed(access.role,access.campusIds,linked,proposed))return Response.json({error:'Linked record is outside your campus access.'},{status:403});}}if(r.kind==='students'&&r.classId&&r.campusId){const cls=proposed.find(x=>x.id===r.classId);if(cls&&campusOf(cls,proposed)!==r.campusId)return Response.json({error:'Student campus must match the assigned class campus.'},{status:400});}
 if(r.kind==='messages'&&!['Draft'].includes(r.status))return Response.json({error:'Use the communications send action to record provider status.'},{status:400});if(r.kind==='staff'&&r.accessRole&&!['Campus manager','Enrollment specialist','Admin assistant','Front desk','Instructor'].includes(r.accessRole))return Response.json({error:'Invalid school access role.'},{status:400});if(old&&['leads','students'].includes(r.kind)&&['emailOptOut','smsOptOut'].some(k=>old[k]===true&&r[k]!==true))return Response.json({error:'Communication opt-outs cannot be cleared without documenting a new permission.'},{status:403});
 if(r.kind==='leads'&&r.eventIntake===true){
  const event=proposed.find(x=>x.id===r.eventId&&x.kind==='appointments'&&x.outreachEvent===true&&x.type==='Recruiting event');
  if(!event||event.campusId!==r.campusId||!campusAllowed(access.role,access.campusIds,event,proposed))return Response.json({error:'Choose a saved recruiting event in your assigned campus.'},{status:400});
  if(!old){
   if(r.status!=='New inquiry')return Response.json({error:'New event inquiries must start in New inquiry status.'},{status:400});
   const normalizePhone=(v:any)=>String(v||'').replace(/\D/g,'');
   const email=String(r.email||'').trim().toLowerCase(),phone=normalizePhone(r.phone);
   const duplicate=current.some(x=>['leads','students'].includes(x.kind)&&campusOf(x,current)===r.campusId&&((email&&String(x.email||'').trim().toLowerCase()===email)||(phone.length>=10&&normalizePhone(x.phone)===phone)));
   if(duplicate)return Response.json({error:'Possible existing campus lead. Ask admissions to review before creating another entry.'},{status:409});
   r={...r,consentRecordedAt:now,consentRecordedBy:access.user.email,source:event.name,owner:r.owner||event.owner||'Admissions',emailOptOut:false,smsOptOut:false};
  }
 }
if(r.kind==='safety-incidents'&&r.unitId){
  const truck=proposed.find(x=>x.kind==='fleet'&&x.id===r.unitId&&x.campusId===r.campusId);
  if(!truck)return Response.json({error:'Any vehicle reference must belong to the reported campus.'},{status:400});
 }
 if(r.kind==='safety-reviews'){
  const reported=current.find(x=>x.kind==='safety-incidents'&&x.id===r.incidentId&&x.campusId===r.campusId);
  if(!reported)return Response.json({error:'Select an existing incident in the same campus.'},{status:400});
  if(r.date<reported.date)return Response.json({error:'A management review cannot be dated before its incident.'},{status:400});
  const previous=current.filter(x=>x.kind==='safety-reviews'&&x.incidentId===r.incidentId).sort((x,y)=>String(y.reviewedAt||y.date).localeCompare(String(x.reviewedAt||x.date)))[0];
  if(previous?.status==='Resolved'&&r.status!=='Reopened')return Response.json({error:'Reopen a resolved case through a documented Reopened review before adding another decision.'},{status:409});
 }
 if(r.kind==='staff-credentials'){
  const employee=proposed.find(x=>x.kind==='staff'&&x.id===r.staffId);
  if(!employee||!['Active','Pending credential'].includes(employee.status)||!employee.campusIds?.includes(r.campusId))return Response.json({error:'Select an active or credential-pending employee assigned to this campus.'},{status:400});
  if(!campusAllowed(access.role,access.campusIds,employee,proposed)||!access.campusIds.includes(r.campusId)&&access.role!=='Owner')return Response.json({error:'Employee credential is outside your campus.'},{status:403});
  if(proposed.some(x=>x.kind==='staff-credentials'&&x.id!==r.id&&x.staffId===r.staffId&&x.campusId===r.campusId&&x.credentialType===r.credentialType))return Response.json({error:'An employee already has a recorded review for this credential at this campus. Update it instead.'},{status:409});
  if(old&&['campusId','staffId','credentialType'].some(k=>JSON.stringify(old[k])!==JSON.stringify(r[k])))return Response.json({error:'The employee, campus and credential type cannot change after the first entry.'},{status:403});
  if(old?.status==='Source reviewed'&&['status','reviewDate','sourceReference','expiresAt','nextCheck','notes'].some(k=>JSON.stringify(old[k])!==JSON.stringify(r[k]))&&String(r.correctionReason||'').trim().length<12)return Response.json({error:'Explain any change to a previously reviewed credential.'},{status:400});
  if(r.status==='Source reviewed'){
   if(r.expiresAt&&r.expiresAt<today())return Response.json({error:'Do not mark an expired credential as valid.'},{status:400});
   r={...r,reviewedBy:old?.status==='Source reviewed'?old.reviewedBy:access.user.email,reviewedAt:old?.status==='Source reviewed'?old.reviewedAt:now};
  }else r={...r,reviewedBy:old?.reviewedBy,reviewedAt:old?.reviewedAt};
 }
 if(r.kind==='campus-readiness'){
  const campus=proposed.find(x=>x.kind==='campuses'&&x.id===r.campusId&&x.status==='Active');
  if(!campus||!campusAllowed(access.role,access.campusIds,campus,proposed))return Response.json({error:'Choose an active campus that you manage.'},{status:403});
  if(proposed.some(x=>x.kind==='campus-readiness'&&x.id!==r.id&&x.campusId===r.campusId&&x.area===r.area))return Response.json({error:'An existing readiness check for this campus and section must be updated instead.'},{status:409});
  if(old&&['campusId','area'].some(k=>old[k]!==r[k]))return Response.json({error:'Readiness check campus and section cannot be changed after creation.'},{status:403});
  if(old?.status==='Manager reviewed'&&['status','sourceReference','sourceCheckedOn','reviewDue','notes'].some(k=>JSON.stringify(old[k])!==JSON.stringify(r[k]))&&String(r.correctionReason||'').trim().length<12)return Response.json({error:'Explain changes to an already reviewed school readiness item.'},{status:400});
  if(r.status==='Manager reviewed'){
   if(!['Owner','Campus manager'].includes(access.role))return Response.json({error:'Only authorized management can review a campus readiness item.'},{status:403});
   r={...r,reviewedBy:old?.status==='Manager reviewed'?old.reviewedBy:access.user.email,reviewedAt:old?.status==='Manager reviewed'?old.reviewedAt:now};
  }else r={...r,reviewedBy:old?.reviewedBy,reviewedAt:old?.reviewedAt};
 }
 if(r.kind==='sponsorships'){
  const student=proposed.find(x=>x.kind==='students'&&x.id===r.studentId);
  const agency=proposed.find(x=>['partners','funding'].includes(x.kind)&&x.id===r.agencyId);
  if(!student||student.campusId!==r.campusId||!campusAllowed(access.role,access.campusIds,student,proposed))return Response.json({error:'Funding must match a student and authorized campus.'},{status:400});
  if(!agency||campusOf(agency,proposed)!==r.campusId)return Response.json({error:'Select a real funding partner at this campus.'},{status:400});
  if(old?.status==='Authorized'&&!['Owner','Campus manager'].includes(access.role))return Response.json({error:'A documented sponsorship can only be changed by school management.'},{status:403});
  if(old?.status==='Authorized'&&['studentId','campusId','agencyId','authorizedAmount','authorizationNumber','authorizationDocumentKey','startDate','endDate','expiresAt','status'].some(key=>JSON.stringify(old[key])!==JSON.stringify(r[key]))&&String(r.correctionReason||'').trim().length<12)return Response.json({error:'Explain any correction to a previously approved funding record.'},{status:400});
  if(r.status==='Authorized'){
   if(!['Owner','Campus manager'].includes(access.role))return Response.json({error:'Only school management can confirm a written funding authorization.'},{status:403});
   if(r.expiresAt&&r.expiresAt<today())return Response.json({error:'Expired funding authorization cannot be approved.'},{status:400});
   if(!(student.documents||[]).some((d:any)=>d.key===r.authorizationDocumentKey&&d.category==='Funding authorization'&&d.verified===true))return Response.json({error:'The sponsoring agency’s authorization must be uploaded and reviewed by campus management first.'},{status:403});
   const metadata:any=await db.prepare("SELECT key FROM school_files WHERE key=? AND owner=? AND student=? AND category='Funding authorization'").bind(r.authorizationDocumentKey,access.scope,student.id).first();
   if(!metadata)return Response.json({error:'The original funding authorization is not in this student’s protected files.'},{status:403});
   if(old?.status!=='Authorized'){r={...r,reviewedBy:access.user.email,reviewedAt:now};}
   else r={...r,reviewedBy:old.reviewedBy,reviewedAt:old.reviewedAt};
  }else{r={...r,reviewedBy:old?.reviewedBy,reviewedAt:old?.reviewedAt};}
  const conflicts=proposed.filter(x=>x.kind==='sponsorships'&&x.id!==r.id&&x.studentId===r.studentId&&x.agencyId===r.agencyId&&['Authorized','Awaiting authorization'].includes(x.status)&&['Authorized','Awaiting authorization'].includes(r.status));
  if(conflicts.length)return Response.json({error:'Another active funding request for this student and sponsor is already recorded. Review it before opening another.'},{status:409});
 }
if(r.kind==='employment-offers'){
  const student=proposed.find(x=>x.kind==='students'&&x.id===r.studentId);
  if(!student||student.campusId!==r.campusId||!campusAllowed(access.role,access.campusIds,student,proposed))return Response.json({error:'Offer must refer to an enrolled student in your campus.'},{status:400});
  if(r.partnerId){const p=proposed.find(x=>x.kind==='partners'&&x.id===r.partnerId);if(!p||campusOf(p,proposed)!==r.campusId)return Response.json({error:'Employer partner must belong to the same campus.'},{status:400});}
  if(r.status==='Verified contingent'){
   if(!['Owner','Campus manager'].includes(access.role))return Response.json({error:'Only school management can approve employer-issued offer letters.'},{status:403});
   if(!r.letterDate||r.expiryDate&&r.expiryDate<today())return Response.json({error:'Enter the employer letter date and confirm it is not expired.'},{status:400});
   const proof=(student.documents||[]).find((d:any)=>d.key===r.letterDocumentKey&&d.category==='Conditional employment offer'&&d.verified===true);
   const meta:any=await db.prepare("SELECT key FROM school_files WHERE key=? AND owner=? AND student=? AND category='Conditional employment offer'").bind(r.letterDocumentKey,access.scope,student.id).first();
   if(!proof||!meta)return Response.json({error:'Upload and verify the original employer letter in this student’s restricted files before approval.'},{status:403});
   r={...r,reviewedBy:old?.status==='Verified contingent'?old.reviewedBy:access.user.email,reviewedAt:old?.status==='Verified contingent'?old.reviewedAt:now};
  }else{r={...r,reviewedBy:old?.reviewedBy,reviewedAt:old?.reviewedAt};}
 }
if(r.kind==='students'){
  const savedDocuments=old?.documents||[];
  for(const document of r.documents||[]){
   if(!document||typeof document.key!=='string')return Response.json({error:'Student files must be uploaded before being attached.'},{status:400});
   const existing=savedDocuments.find((d:any)=>d.key===document.key);
   const restricted=restrictedCategories.includes(document.category);
   if(restricted&&!['Owner','Campus manager'].includes(access.role)&&(!existing||JSON.stringify(existing)!==JSON.stringify(document)))return Response.json({error:'Restricted evidence review requires campus management access.'},{status:403});
   if(!existing){
    const meta:any=await db.prepare('SELECT category FROM school_files WHERE key=? AND owner=? AND student=?').bind(document.key,access.scope,r.id).first();
    if(!meta||meta.category!==document.category)return Response.json({error:'Uploaded document does not belong to this student or category.'},{status:400});
   }else if(existing.category!==document.category)return Response.json({error:'Uploaded document categories cannot be changed.'},{status:400});
  }
 }
 if(['students','leads'].includes(r.kind)&&r.smsConsent===true&&!old?.smsConsent&&(!r.consentNote||String(r.consentNote).trim().length<12)&&r.eventIntake!==true)return Response.json({error:'Record where and how the student expressly agreed to school text messages (at least 12 characters).'}, {status:400});
 if(['curriculum-units','unit-evidence'].includes(r.kind)){
   const issue=validateLessonLinks(r,r.kind==='unit-evidence'?current:proposed,access.role,today());
   if(issue)return Response.json({error:issue.error},{status:issue.status});
   if(r.kind==='curriculum-units'){
    if(r.status==='Approved'&&old?.status!=='Approved')r={...r,approvedBy:access.user.email,approvedAt:now};
    if(r.status==='Retired'&&old?.status==='Approved')r={...r,approvedBy:old.approvedBy,approvedAt:old.approvedAt,retiredBy:access.user.email,retiredAt:now};
   }
  }
 const next={...r};if(next.kind==='unit-evidence'){next.recordedBy=access.user.email;next.recordedAt=now;}if(next.kind==='safety-incidents'){next.reportedBy=access.user.email;next.reportedAt=now;}if(next.kind==='safety-reviews'){next.reviewedBy=access.user.email;next.reviewedAt=now;}if(next.kind==='training-assignments'&&next.status==='Completed'){next.completedBy=access.user.email;next.completedAt=now;}if(['students','leads'].includes(next.kind)&&['smsConsent','emailConsent','smsOptOut','emailOptOut'].some(field=>next[field]!==old?.[field])){
  next.consentRecordedAt=old?.consentRecordedAt||now;
  next.consentRecordedBy=old?.consentRecordedBy||access.user.email;
  if(old){next.contactPreferencesUpdatedAt=now;next.contactPreferencesUpdatedBy=access.user.email;}
  if(next.smsConsent===true&&!old?.smsConsent){next.smsConsentAt=now;next.smsConsentSource=String(next.consentNote||next.source||'Event lead consent obtained').slice(0,200);}
 }
 if(next.kind==='messages'&&!old){next.createdAt=now;next.draftBy=access.user.email;}if(next.kind==='tpr'){const sensitive=next.status==='Confirmed'||next.status==='Submitted externally';next.reviewedBy=sensitive?access.user.email:old?.reviewedBy;next.reviewedAt=sensitive?now:old?.reviewedAt;}if(next.kind==='vehicle-checks'){next.checkedBy=access.user.email;next.checkedAt=now;if(next.status==='Cleared'){next.clearedBy=access.user.email;next.clearedAt=now;}}if(next.kind==='appointments'&&next.outreachEvent)next.campusId=campusOf(next,proposed);if(next.kind==='partners'&&next.touchpoints)next.touchpoints=next.touchpoints.map((t:any,i:number)=>i<(old?.touchpoints?.length||0)?t:{...t,actor:access.user.email,recordedAt:now});for(const key of ['sessions','evaluations','assessments'])if(next[key])next[key]=next[key].map((entry:any,i:number)=>i<(old?.[key]?.length||0)?entry:{...entry,actor:access.user.email,recordedAt:now});if(next.theorySignoff&&JSON.stringify(next.theorySignoff)!==JSON.stringify(old?.theorySignoff))next.theorySignoff={...next.theorySignoff,actor:access.user.email,at:now};if(next.kind==='students'){for(const a of (next.assessments||[]).slice(old?.assessments?.length||0)){if(a.assessmentId){const q=current.find(x=>x.id===a.assessmentId&&x.kind==='quizzes');if(!q?.questions?.length||JSON.stringify(a.questionSnapshot)!==JSON.stringify(q.questions))return Response.json({error:'Assessment version changed. Reload the question set.'},{status:409});const total=q.questions.length,correct=q.questions.filter((v:any)=>a.answers?.[v.id]===String(v.correct)).length;if(q.questions.some((v:any)=>!Object.hasOwn(a.answers||{},v.id))||a.total!==total||a.correct!==correct||a.type!==q.type||a.name!==q.name)return Response.json({error:'Assessment answers and grade do not match the saved question set.'},{status:400});}}}updates.push(next);updates.push(...trainingFollowUps(old,next,today(),()=>crypto.randomUUID()));
 }
 const merged=()=>[...current.filter(r=>!updates.some(x=>x.id===r.id)),...updates];
 for(const r of updates){const growthProblem=growthLinkProblem(r,merged());if(growthProblem)return Response.json({error:growthProblem},{status:400});if(r.kind==='students'&&r.classId){const c=merged().find(x=>x.id===r.classId&&x.kind==='classes');if(!c)return Response.json({error:'Selected class does not exist.'},{status:400});if(classRoster(merged(),c.id).length>Number(c.capacity))return Response.json({error:'Class is full. Choose another class or waitlist the application.'},{status:409});if(r.sourceLead&&merged().filter(x=>x.kind==='students'&&x.sourceLead===r.sourceLead).length>1)return Response.json({error:'This lead is already enrolled.'},{status:409});if(!updates.some(x=>x.id===c.id))updates.push({...c});}
 if(r.kind==='classes'&&classRoster(merged(),r.id).length>Number(r.capacity))return Response.json({error:'Class capacity is below its enrolled roster.'},{status:400});
 if(r.kind==='tpr'){
  const student=merged().find(x=>x.kind==='students'&&x.id===r.studentId&&x.campusId===r.campusId);
  const campus=merged().find(x=>x.kind==='campuses'&&x.id===r.campusId);
  if(!student||!campus)return Response.json({error:'TPR worksheet must reference an existing student and matching campus.'},{status:400});
  if(['Submitted externally','Confirmed'].includes(r.status)){
   if(!['Owner','Campus manager'].includes(access.role))return Response.json({error:'Only school management may attest to an external FMCSA submission.'},{status:403});
   if(r.completionDate>today())return Response.json({error:'Future completion dates cannot be reported as already submitted to FMCSA.'},{status:400});
  }
 }
 if(r.kind==='training-assignments'||r.kind==='vehicle-checks'){
  const issue=dispatchRecordProblem(r,r.kind==='vehicle-checks'?current:merged(),access.role,today());
  if(issue)return Response.json({error:issue.error},{status:issue.status});
 }
 if(r.kind==='tasks'&&r.operationsCase&&r.staffId){
  if(!['Owner','Campus manager'].includes(access.role))return Response.json({error:'Staff-assigned operations reviews require school management approval.'},{status:403});
  const assignee=merged().find(x=>x.kind==='staff'&&x.id===r.staffId&&x.status==='Active');
  if(!assignee||!assignee.campusIds?.includes(campusOf(r,merged()))||r.owner!==assignee.name)return Response.json({error:'Follow-up task must be assigned to an active staff member with access to that campus.'},{status:400});
 }
 if(r.kind==='shifts'){const employee=merged().find(x=>x.kind==='staff'&&x.id===r.employeeId);if(!employee||employee.status!=='Active'||!employee.campusIds?.includes(r.campusId))return Response.json({error:'Shift employee must be active and assigned to this campus.'},{status:400});if(staffShiftConflicts(r,merged()).length)return Response.json({error:'The employee already has an overlapping shift on this date.'},{status:409});}
 if(r.kind==='appointments'){const clash=appointmentConflict(merged(),r);if(clash)return Response.json({error:'Appointment conflict with '+clash.name},{status:409});}
 if(r.kind==='schedules'&&r.status==='Scheduled'){const appointmentClash=appointmentConflict(merged(),r);if(appointmentClash)return Response.json({error:'Calendar conflict with '+appointmentClash.name},{status:409});const unit=merged().find(x=>x.id===r.unitId);if(unit&&unit.status!=='Ready')return Response.json({error:'Training vehicle is unavailable.'},{status:409});if(r.unitId&&unresolvedVehicleDefects(merged(),r.unitId).some(d=>d.date<=r.date))return Response.json({error:'A reported truck defect must be cleared before a road/yard schedule is saved.'},{status:409});const modernClash=merged().find(x=>x.kind==='training-assignments'&&x.status!=='Cancelled'&&x.date===r.date&&x.start<r.end&&x.end>r.start&&((r.unitId&&x.unitId===r.unitId)||(r.studentId&&x.studentId===r.studentId)));
 if(modernClash)return Response.json({error:'The assigned student or truck already has a lesson on the Daily Training Plan.'},{status:409});
 const clash=merged().find(x=>x.kind==='schedules'&&x.id!==r.id&&x.status==='Scheduled'&&x.date===r.date&&x.start<r.end&&x.end>r.start&&((x.unitId&&x.unitId===r.unitId)||x.studentId===r.studentId||x.instructor===r.instructor));if(clash)return Response.json({error:'Training schedule conflict with '+clash.name},{status:409});}
 if(r.kind==='leads'&&r.status==='Enrolled'&&!merged().some(x=>x.kind==='students'&&x.id===r.studentId&&x.sourceLead===r.id))return Response.json({error:'Use the enrollment workflow to create and link the student record.'},{status:400});if(r.kind==='enrollments'&&r.status==='Enrolled'){const cls=merged().find(c=>c.id===r.classId&&c.kind==='classes');if(!cls||!['Open for enrollment','In progress'].includes(cls.status))return Response.json({error:'This class is not open for enrollment.'},{status:400});if(['Agency sponsorship','Employer sponsorship'].includes(r.fundingMethod)&&!merged().some(x=>x.kind==='funding'&&x.id===r.sponsorId))return Response.json({error:'Select the funding agency or employer.'},{status:400});if(r.fundingMethod==='Pending authorization')return Response.json({error:'Resolve funding authorization before confirming enrollment.'},{status:400});if(!enrollmentChecks.every(k=>r.checks?.[k]))return Response.json({error:'Complete the enrollment review checklist.'},{status:400});if(Number(r.deposit||0)>Number(r.tuition||0)||Number(r.deposit||0)<0)return Response.json({error:'Deposit cannot exceed tuition.'},{status:400});if(!merged().some(s=>s.kind==='students'&&s.id===r.studentId&&s.classId===r.classId))return Response.json({error:'Enrollment must include its student record and selected class.'},{status:400});}
 }
 for(const r of merged()){const p=growthLinkProblem(r,merged());if(p)return Response.json({error:p},{status:400});}
 for(const contract of updates.filter(r=>r.kind==='contracts'&&r.status==='Completed')){const old=current.find(r=>r.id===contract.id);if(old?.status==='Completed')continue;const s=merged().find(r=>r.id===contract.studentId&&r.kind==='students');if(!s)return Response.json({error:'Contract requires a student record.'},{status:400});const meta:any=await db.prepare('SELECT key FROM school_files WHERE key = ? AND owner = ? AND student = ?').bind(contract.completedFile.key,access.scope,s.id).first();if(!meta)return Response.json({error:'Upload the signed contract into this student’s file first.'},{status:400});const next={...s,documents:[...(s.documents||[]),{...contract.completedFile,category:'Signed contract',name:contract.name+' — signed',verified:true,reviewedAt:now,contractId:contract.id}]};const index=updates.findIndex(r=>r.id===s.id);if(index>=0)updates[index]=next;else updates.push(next);}
 for(const r of updates.filter(r=>r.kind==='tasks'&&r.operationsCase)){
  const linked=merged().find(x=>x.id===(r.studentId||r.personId||r.unitId));if(linked&&campusOf(linked,merged())!==campusOf(r,merged()))return Response.json({error:'Support case campus must match its linked record.'},{status:400});
  if(r.status!=='Complete'&&r.signalKey&&merged().some(x=>x.kind==='tasks'&&x.id!==r.id&&x.status!=='Complete'&&x.signalKey===r.signalKey))return Response.json({error:'An open follow-up already exists for this attention item. Reload and manage that case.'},{status:409});
 }
 const stmts=[db.prepare('INSERT INTO audit (id,owner,record_id,action,at,payload,revision,actor,snapshot) VALUES (?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),access.scope,'__workspace__','Transaction',now,'{}',guardRevision,access.user.email,'{}')];for(const r of updates){const old=current.find(x=>x.id===r.id),rev=old?Number(old.revision)+1:1;r.revision=rev;const snapshot=JSON.stringify(r);stmts.push(db.prepare('INSERT INTO records (id,owner,kind,payload,revision,updated) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,revision=excluded.revision,updated=excluded.updated WHERE records.owner=excluded.owner AND records.revision=?').bind(r.id,access.scope,r.kind,snapshot,rev,now,old?.revision||0));stmts.push(db.prepare('INSERT INTO audit (id,owner,record_id,action,at,payload,revision,actor,snapshot) VALUES (?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),access.scope,r.id,old?'Updated':'Created',now,JSON.stringify({name:r.name,kind:r.kind}),rev,access.user.email,snapshot));}await db.batch(stmts);return Response.json({ok:true,records:updates.filter(r=>canRead(access.role,r.kind)&&campusAllowed(access.role,access.campusIds,r,merged())).map(r=>projectRecord(r,access.role))});
 }catch(e:any){console.error('Record save failed',e);if(String(e?.message).includes('UNIQUE'))return Response.json({error:'A record changed during saving. Reload and retry; no partial changes were saved.'},{status:409});return Response.json({error:'Save failed. Your input has been kept.'},{status:503});}
}
