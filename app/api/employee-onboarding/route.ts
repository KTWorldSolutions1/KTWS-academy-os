import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {database} from '../../../lib/storage';
import {canReviewOnboarding,canFinalizeOnboarding} from '../../../lib/employee-onboarding-policy';

const noStore={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const respond=(data:unknown,status=200)=>Response.json(data,{status,headers:noStore});
const invalid=(error:string,status=400)=>respond({error},status);
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const allowedRoles=new Set(['Owner','Regional admin','Campus manager']);
const validDate=(s:string)=>datePattern.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
async function campusActive(db:any,id:string){
 const r:any=await db.prepare("SELECT payload FROM records WHERE owner='academy-owner' AND kind='campuses' AND id=?").bind(id).first();
 return r&&JSON.parse(r.payload).status==='Active';
}
async function audit(db:any,id:string,action:string,actor:string,details:Record<string,unknown>={}){
 await db.prepare('INSERT INTO employee_onboarding_audit(id,case_id,action,actor,at,details) VALUES(?,?,?,?,?,?)')
 .bind(crypto.randomUUID(),id,action,actor,new Date().toISOString(),JSON.stringify(details)).run();
}
export async function GET(req:Request){
 const access=await getWorkspaceAccess();if(!access)return invalid('Sign in required',401);
 if(!allowedRoles.has(access.role)&&access.role!=='Admin assistant')return invalid('HR access required',403);
 const db=database();
 const rows:any=await db.prepare('SELECT * FROM employee_onboarding_cases ORDER BY updated_at DESC LIMIT 250').all();
 const cases=(rows.results||[]).filter((r:any)=>canReviewOnboarding(
  {role:access.role,campusIds:access.campusIds,hasRestrictedHrAccess:false},r.campus_id))
 .map((r:any)=>({
  id:r.id,campusId:r.campus_id,name:r.employee_name,email:r.email,phone:r.phone,
  jobTitle:r.job_title,startDate:r.start_date,acceptedOfferAt:r.accepted_offer_at,
  status:r.status,createdAt:r.created_at,updatedAt:r.updated_at,
  reviewedAt:r.reviewed_at,approvedAt:r.approved_at
 }));
 return respond({cases,mode:'metadata-only',employeeFormsEnabled:false,
   notice:'Employee invitations, regulated forms, uploads and activation remain gated until production acceptance.'});
}
export async function POST(req:Request){
 const access=await getWorkspaceAccess();if(!access)return invalid('Sign in required',401);
 if(req.headers.get('origin')!==new URL(req.url).origin)return invalid('Invalid origin',403);
 if(Number(req.headers.get('content-length')||0)>5000)return invalid('Payload too large',413);
 let body:any;try{body=await req.json();}catch{return invalid('Invalid JSON');}
 if(body?.action==='create'){
  if(!allowedRoles.has(access.role))return invalid('Manager access required',403);
  const campusId=String(body.campusId||''),name=String(body.name||'').trim(),email=String(body.email||'').trim().toLowerCase();
  const phone=String(body.phone||'').trim(),jobTitle=String(body.jobTitle||'').trim(),
   startDate=String(body.startDate||''),acceptedOfferAt=String(body.acceptedOfferAt||'');
  if(!canReviewOnboarding({role:access.role,campusIds:access.campusIds},campusId))return invalid('Unauthorized campus',403);
  if(name.length<2||name.length>120||!emailPattern.test(email)||email.length>254||
    phone.length>40||jobTitle.length<2||jobTitle.length>160||!validDate(startDate)||
    Number.isNaN(Date.parse(acceptedOfferAt))||acceptedOfferAt.length>40||body.offerAccepted!==true)
    return invalid('Provide verified accepted-offer details, valid identity/contact, position and start date.');
  const db=database();
  if(!await campusActive(db,campusId))return invalid('Campus must be active.',400);
  const id=crypto.randomUUID(),now=new Date().toISOString();
  await db.prepare("INSERT INTO employee_onboarding_cases(id,campus_id,employee_name,email,phone,job_title,start_date,accepted_offer_at,status,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,'Draft',?,?,?)")
   .bind(id,campusId,name,email,phone,jobTitle,startDate,acceptedOfferAt,access.user.email,now,now).run();
  await audit(db,id,'Case opened',access.user.email,{campusId,acceptedOfferConfirmed:true});
  return respond({created:true,id,status:'Draft',next:'Await secure invite and employee-forms release acceptance'},201);
 }
 if(body?.action==='cancel'){
  const id=String(body.id||'');
  if(!/^[0-9a-f-]{36}$/i.test(id))return invalid('Invalid case ID');
  const db=database(),existing:any=await db.prepare('SELECT campus_id,status FROM employee_onboarding_cases WHERE id=?').bind(id).first();
  if(!existing)return invalid('Case not found',404);
  if(!canFinalizeOnboarding({role:access.role,campusIds:access.campusIds},existing.campus_id))return invalid('Campus manager approval required',403);
  if(existing.status==='Complete'||existing.status==='Cancelled')return invalid('Case already closed',409);
  const reason=String(body.reason||'').trim();
  if(reason.length<5||reason.length>500)return invalid('Enter a cancellation reason (5–500 characters).');
  await db.prepare("UPDATE employee_onboarding_cases SET status='Cancelled',updated_at=? WHERE id=? AND status!='Complete'")
  .bind(new Date().toISOString(),id).run();
  await audit(db,id,'Case cancelled',access.user.email,{reason});
  return respond({cancelled:true});
 }
 return invalid('Unsupported action',400);
}
