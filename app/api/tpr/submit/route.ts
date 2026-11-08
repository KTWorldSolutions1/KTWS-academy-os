import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {database} from '../../../lib/storage';
import {env} from '../../../cloudflare/runtime';
import {tprEvidenceReview} from '../../../lib/tpr-preflight';
import {theoryState,instructionHours} from '../../../lib/training';
import {drivingTimeSummary} from '../../../lib/attendance';
import {trainingBody,validateTrainingForm,signedJwt,type TrainingForm} from '../../../lib/fmcsa-tpr-webservice';
const ok=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
const area=(type:string)=>type==='PublicRoad'?'Public road':type==='Range'?'Range':'Theory';
export async function POST(req:Request){
 try{
  const a=await getWorkspaceAccess();if(!a)return ok({error:'Sign in required'},401);
  if(!['Owner','Regional admin','Campus manager'].includes(a.role))return ok({error:'School management required'},403);
  if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return ok({error:'Invalid origin'},403);
  if(Number(req.headers.get('content-length')||0)>10000)return ok({error:'Payload too large'},413);
  const b:any=await req.json(),studentId=String(b.studentId||''),campusId=String(b.campusId||'');
  if(studentId.length>100||campusId.length>100||!['preview','submit'].includes(b.action))return ok({error:'Invalid submission request'},400);
  if(a.role!=='Owner'&&a.role!=='Regional admin'&&!a.campusIds.includes(campusId))return ok({error:'Campus access denied'},403);
  const db=database();
  const [studentRow,campusRow]=await Promise.all([
   db.prepare("SELECT payload FROM records WHERE owner='academy-owner' AND kind='students' AND id=?").bind(studentId).first(),
   db.prepare("SELECT payload FROM records WHERE owner='academy-owner' AND kind='campuses' AND id=?").bind(campusId).first()
  ]) as any[];
  if(!studentRow||!campusRow)return ok({error:'School student/campus not found'},404);
  const student=JSON.parse(studentRow.payload),campus=JSON.parse(campusRow.payload);
  if(student.campusId!==campusId||campus.status!=='Active')return ok({error:'Campus and student mismatch'},403);
  const f:TrainingForm=b.training;
  const error=validateTrainingForm(f, String(campus.tprLocationId||''));
  const evidence=tprEvidenceReview(student,{...campus,id:campusId},area(f?.trainingType||'Theory'));
  const issues=[...(error?[error]:[]),...evidence.checks.filter(x=>!x.present).map(x=>x.label)];
  if(f?.number&&![student.clpNumber,student.licenseNumber].some(n=>n===f.number))issues.push('Permit/license number differs from saved verified student reference');
  if(student.dateOfBirth&&f?.dateOfBirth!==student.dateOfBirth)issues.push('Date of birth differs from student record');
  if(f?.trainingType==='Theory'&&Number(theoryState(student).final?.score)!==f.score)issues.push('Entered theory score must match the most recent verified theory final');
  if(f?.trainingType==='Range'&&Number(f.hours)>instructionHours(student,'Yard')+0.01)issues.push('Entered range hours exceed attested range instruction');
  if(f?.trainingType==='PublicRoad'&&Number(f.hours)>drivingTimeSummary(student).studentDrivingHours+0.01)issues.push('Entered road hours exceed verified student-operated driving');
  if(issues.length)return ok({ready:false,issues,transmitted:false},b.action==='submit'?409:200);
  const payload=trainingBody(f,String(campus.tprLocationId),studentId+':'+f.trainingType+':'+f.completionDate);
  // Never put DOB, license numbers, or other personal details in response, logs, or audit receipts.
  if(b.action==='preview')return ok({ready:true,transmitted:false,trainingType:f.trainingType,completionDate:f.completionDate,campus:campus.name,warning:'This is a local readiness result. Federal reporting is not complete.'});
  if(a.role!=='Owner')return ok({error:'Only a school owner may authorize federal submission'},403);
  if(b.confirm!=='I verified this official training certification')return ok({error:'Explicit human verification required'},400);
  if(String(env.TPR_WEB_SERVICE_ENABLED).toLowerCase()!=='true'||String(env.TPR_TEST_ACCEPTED).toLowerCase()!=='true'||!env.TPR_CREDENTIAL_ID||!env.TPR_PRIVATE_KEY)
   return ok({error:'Federal transmission is locked until Lone Star installs authorized secrets, completes FMCSA acceptance testing, and explicitly enables production submission'},503);
  const id=crypto.randomUUID(),now=new Date().toISOString();
  const inserted:any=await db.prepare("INSERT OR IGNORE INTO tpr_webservice_submissions(id,student_id,campus_id,training_type,completion_date,initiated_by,initiated_at,status) VALUES(?,?,?,?,?,?,?,'Pending')")
   .bind(id,studentId,campusId,f.trainingType,f.completionDate,a.user.email,now).run();
  if(!inserted.meta?.changes)return ok({error:'A submission or uncertain previous attempt already exists. Review FMCSA and reconcile before resubmitting.'},409);
  try{
   const jwt=await signedJwt(env.TPR_CREDENTIAL_ID,env.TPR_PRIVATE_KEY);
   const res=await fetch('https://tpr.fmcsa.dot.gov/api/Training/Add',{method:'POST',headers:{Authorization:'Bearer '+jwt,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(18000)});
   const status=res.status===201?'Accepted':res.status>=500?'Needs reconciliation':'Rejected';
   await db.prepare('UPDATE tpr_webservice_submissions SET status=?,http_status=?,receipt_note=? WHERE id=?')
     .bind(status,res.status,res.status===201?'FMCSA returned 201 Created':'Review response via authorized federal portal',id).run();
   return ok({submissionId:id,status,httpStatus:res.status,accepted:res.status===201},res.status===201?200:409);
  }catch{
   await db.prepare("UPDATE tpr_webservice_submissions SET status='Needs reconciliation',receipt_note='Transport outcome unknown; manually verify FMCSA before retrying' WHERE id=?").bind(id).run();
   return ok({submissionId:id,status:'Needs reconciliation',error:'Federal response uncertain. Verify directly with FMCSA before any retry.'},503);
  }
 }catch(e){console.error('TPR submission service unavailable');return ok({error:'TPR service unavailable'},503);}
}
