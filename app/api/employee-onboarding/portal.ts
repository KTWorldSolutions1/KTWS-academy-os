import {database} from '../../../lib/storage';
import {env} from '../../../lib/env';
import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {canReviewOnboarding,canFinalizeOnboarding} from '../../../lib/employee-onboarding-policy';

const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const reply=(x:any,status=200,extra:Record<string,string>={})=>Response.json(x,{status,headers:{...headers,...extra}});
const blocked=(msg:string,status=403)=>reply({error:msg},status);
const e164=/^\+[1-9]\d{7,14}$/;
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
async function hash(s:string){const v=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));return Array.from(v,x=>x.toString(16).padStart(2,'0')).join('');}
const active=()=>env.EMPLOYEE_ONBOARDING_ENABLED==='true'&&env.EMPLOYEE_ONBOARDING_ACCEPTANCE_APPROVED==='true'&&env.SCHOOL_FILE_UPLOADS_ENABLED==='true'&&env.EMPLOYEE_ONBOARDING_SIGNING_APPROVED==='true';
const test=()=>env.ACADEMY_TEST==='true';
function inviteCookie(value:string,maxAge=8*3600){return 'academy_onboarding='+value+'; HttpOnly; SameSite=Strict; Path=/api/employee-onboarding; Max-Age='+maxAge+(env.NODE_ENV==='production'?'; Secure':'');}
async function audit(db:any,id:string,action:string,actor:string,details:any={}){
 await db.prepare('INSERT INTO employee_onboarding_audit(id,case_id,action,actor,at,details) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),id,action,actor,new Date().toISOString(),JSON.stringify(details)).run();
}
export async function employeeContext(req:Request){
 const raw=req.headers.get('cookie')?.match(/(?:^|;\s*)academy_onboarding=([a-f0-9]{64})/)?.[1];
 if(!raw)return null;
 const db=database(),row:any=await db.prepare("SELECT c.*,s.token_hash FROM employee_onboarding_sessions s JOIN employee_onboarding_cases c ON c.id=s.case_id WHERE s.token_hash=? AND s.expires_at>? AND c.status NOT IN ('Cancelled','Complete')").bind(await hash(raw),Date.now()).first();
 return row?{db,caseData:row}:null;
}
export async function GET(req:Request){
 if(new URL(req.url).pathname!=='/api/employee-onboarding/portal')return blocked('Not found',404);
 if(!active())return blocked('Onboarding employee access is paused until school security and forms approval.',503);
 const context=await employeeContext(req);
 if(!context)return blocked('Your invitation session has expired. Contact school HR for a new invitation.',401);
 const c=context.caseData,docs:any=await context.db.prepare('SELECT form_name,group_name,version,submitted_at,verified_at FROM employee_onboarding_documents WHERE case_id=? ORDER BY form_name,version DESC').bind(c.id).all();
 return reply({employee:{id:c.id,name:c.employee_name,campusId:c.campus_id,jobTitle:c.job_title,startDate:c.start_date,status:c.status},documents:docs.results,requirement:'Submit official completed forms; HR verifies employer-only I-9 separately.',complete:false});
}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return blocked('Invalid origin',403);
 if(Number(req.headers.get('Content-Length')||0)>4096)return blocked('Request too large',413);
 const path=new URL(req.url).pathname;
 if(path!=='/api/employee-onboarding/invitations'&&path!=='/api/employee-onboarding/portal')return blocked('Not found',404);
 if(!active())return blocked('Private onboarding remains paused pending school security, signing and backup acceptance.',503);
 let b:any;try{b=await req.json()}catch{return blocked('Invalid request',400)}
 const db=database();
 if(path.endsWith('/invitations')){
  const a=await getWorkspaceAccess();if(!a)return blocked('Manager sign-in required',401);
  const id=String(b.caseId||'');
  const c:any=await db.prepare('SELECT * FROM employee_onboarding_cases WHERE id=?').bind(id).first();
  if(!c)return blocked('Hiring case not found',404);
  if(!canFinalizeOnboarding({role:a.role,campusIds:a.campusIds},c.campus_id))return blocked('Assigned campus manager authorization required',403);
  if(!['Draft','Invited'].includes(c.status))return blocked('This case cannot receive an invitation',409);
  if(!e164.test(c.phone||''))return blocked('Employee mobile number must be in international +1 format',400);
  if(!test()&&!(env.RESEND_API_KEY&&env.SCHOOL_EMAIL_FROM&&env.TWILIO_ACCOUNT_SID&&env.TWILIO_AUTH_TOKEN&&env.TWILIO_FROM_NUMBER))return blocked('Both email and SMS must be configured before sending; no invitation was issued.',503);
  const existing:any=await db.prepare('SELECT id FROM employee_onboarding_invites WHERE case_id=? AND revoked_at IS NULL AND used_at IS NULL AND expires_at>?').bind(c.id,Date.now()).first();
  if(existing)return blocked('An invitation is active. Revoke it before sending another.',409);
  const raw=token(),inviteId=crypto.randomUUID(),at=new Date().toISOString(),link=new URL('/employee-onboarding/start',String(env.PUBLIC_ORIGIN||req.url)).href+'#token='+raw;
  await db.prepare('INSERT INTO employee_onboarding_invites(id,case_id,token_hash,expires_at,created_at,created_by) VALUES(?,?,?,?,?,?)').bind(inviteId,c.id,await hash(raw),Date.now()+72*3600_000,at,a.user.email).run();
  const body='Lone Star Truck Driving Academy invited you to complete secure employee onboarding. Open: '+link+' . This link expires in 72 hours. Do not forward it.';
  const outcome:{email:string;sms:string}={email:'Not sent',sms:'Not sent'};
  if(test()){outcome.email='Accepted';outcome.sms='Accepted';}
  else {
   try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':inviteId+'-email'},body:JSON.stringify({from:env.SCHOOL_EMAIL_FROM,to:[c.email],subject:'Your Lone Star employee onboarding invitation',text:body}),signal:AbortSignal.timeout(12000)});outcome.email=r.ok?'Accepted':'Rejected';}catch{outcome.email='Outcome unknown';}
   try{const r=await fetch('https://api.twilio.com/2010-04-01/Accounts/'+encodeURIComponent(env.TWILIO_ACCOUNT_SID)+'/Messages.json',{method:'POST',headers:{Authorization:'Basic '+btoa(env.TWILIO_ACCOUNT_SID+':'+env.TWILIO_AUTH_TOKEN),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({To:c.phone,From:env.TWILIO_FROM_NUMBER,Body:body}),signal:AbortSignal.timeout(12000)});outcome.sms=r.ok?'Accepted':'Rejected';}catch{outcome.sms='Outcome unknown';}
  }
  await db.prepare('UPDATE employee_onboarding_invites SET email_status=?,sms_status=? WHERE id=?').bind(outcome.email,outcome.sms,inviteId).run();
  if(outcome.email==='Accepted'&&outcome.sms==='Accepted')await db.prepare("UPDATE employee_onboarding_cases SET status='Invited',updated_at=? WHERE id=? AND status='Draft'").bind(at,c.id).run();
  await audit(db,c.id,'Employee invitation attempted',a.user.email,{inviteId,emailStatus:outcome.email,smsStatus:outcome.sms});
  return reply({inviteId,delivery:outcome,invited:outcome.email==='Accepted'&&outcome.sms==='Accepted',expiresHours:72,...(test()?{testLink:link}:{})},outcome.email==='Accepted'&&outcome.sms==='Accepted'?200:207);
 }
 if(b.action==='logout'){
  const raw=req.headers.get('cookie')?.match(/(?:^|;\s*)academy_onboarding=([a-f0-9]{64})/)?.[1];
  if(raw)await db.prepare('DELETE FROM employee_onboarding_sessions WHERE token_hash=?').bind(await hash(raw)).run();
  return reply({ok:true},200,{'Set-Cookie':inviteCookie('',0)});
 }
 if(b.action==='redeem'){
  if(typeof b.token!=='string'||!/^[a-f0-9]{64}$/.test(b.token))return blocked('Invitation invalid or expired',400);
  const tokenHash=await hash(b.token);
  // Atomic one-time claim prevents reused invitations, preserving resume in separate secure cookie.
  const row:any=await db.prepare("UPDATE employee_onboarding_invites SET used_at=? WHERE token_hash=? AND used_at IS NULL AND revoked_at IS NULL AND expires_at>? RETURNING case_id").bind(new Date().toISOString(),tokenHash,Date.now()).first();
  if(!row)return blocked('Invitation expired, revoked or already used',410);
  const c:any=await db.prepare('SELECT id,status FROM employee_onboarding_cases WHERE id=?').bind(row.case_id).first();
  if(!c||c.status==='Cancelled'||c.status==='Complete')return blocked('Onboarding is unavailable',403);
  const sessionToken=token();
  await db.batch([
   db.prepare('DELETE FROM employee_onboarding_sessions WHERE case_id=?').bind(row.case_id),
   db.prepare('INSERT INTO employee_onboarding_sessions(token_hash,case_id,expires_at) VALUES(?,?,?)').bind(await hash(sessionToken),row.case_id,Date.now()+8*3600_000),
   db.prepare("UPDATE employee_onboarding_cases SET status='In progress',updated_at=? WHERE id=? AND status='Invited'").bind(new Date().toISOString(),row.case_id)
  ]);
  await audit(db,row.case_id,'Employee invitation redeemed','employee',{});
  return reply({ok:true},200,{'Set-Cookie':inviteCookie(sessionToken)});
 }
 return blocked('Unsupported employee action',400);
}
