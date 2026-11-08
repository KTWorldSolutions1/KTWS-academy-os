import {database} from '../../../lib/storage';
import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {workIntervals} from '../../../lib/payroll-intervals';
import {weekStart} from '../../../lib/staff-scheduling';
const respond=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const managers=new Set(['Owner','Regional admin','Campus manager']);
type Correction={id:string;employee_id:string;punch_id:string;week:string;original_at:string;proposed_at:string;reason:string;requested_by:string;requested_at:string;status:string;reviewed_by?:string;reviewed_at?:string};
async function context(){
 const access=await getWorkspaceAccess();if(!access)return null;
 const db=database(),rows:any=await db.prepare("SELECT id,payload FROM records WHERE owner='academy-owner' AND kind='staff'").all();
 const staff=rows.results.map((x:any)=>({...JSON.parse(x.payload),id:x.id})).filter((x:any)=>x.status==='Active');
 const me=staff.find((s:any)=>String(s.email||'').toLowerCase()===access.user.email.toLowerCase());
 return {db,access,staff,me};
}
function canView(c:any,employee:any){return c.me?.id===employee.id||c.access.role==='Owner'||(managers.has(c.access.role)&&employee.campusIds?.some((id:string)=>c.access.campusIds.includes(id)));}
function campusAuthorized(c:any,employee:any,punch:any){return c.access.role==='Owner'||employee.campusIds?.includes(punch.campus_id)&&(c.access.role==='Regional admin'||c.access.campusIds.includes(punch.campus_id));}
export async function GET(req:Request){
 try{const c=await context();if(!c)return respond({error:'Sign in required'},401);
 const employeeId=new URL(req.url).searchParams.get('employee')||c.me?.id;
 const employee=c.staff.find((s:any)=>s.id===employeeId);
 if(!employee||!canView(c,employee))return respond({error:'Employee not accessible'},403);
 const rows:any=await c.db.prepare(`SELECT c.*,COALESCE(p.campus_id,c.proposed_campus_id) AS source_campus_id
   FROM employee_punch_corrections c LEFT JOIN employee_punches p ON p.id=c.punch_id
   WHERE c.employee_id=? ORDER BY c.requested_at DESC LIMIT 200`).bind(employee.id).all();
 const visible=rows.results.filter((r:any)=>c.me?.id===employee.id||c.access.role==='Owner'||
   (employee.campusIds?.includes(r.source_campus_id)&&c.access.campusIds.includes(r.source_campus_id)));
 return respond({corrections:visible.slice(0,100).map((r:any)=>{const {source_campus_id,...rest}=r;return rest;}),canReview:managers.has(c.access.role)&&c.me?.id!==employee.id});
 }catch{return respond({error:'Could not load correction requests'},503);}
}
export async function POST(req:Request){
 try{
 const c=await context();if(!c)return respond({error:'Sign in required'},401);
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return respond({error:'Invalid origin'},403);
 const b:any=await req.json();
 if(b.action==='request_missing'){
  const employee=c.me;
  if(!employee)return respond({error:'An active staff login is needed to request missing punches'},403);
  const proposed=String(b.proposedAt||''),reason=String(b.reason||'').trim(),action=String(b.punchAction||''),campusId=String(b.campusId||'');
  if(!['clock_in','break_start','break_end','clock_out'].includes(action)||!employee.campusIds?.includes(campusId))return respond({error:'Choose a valid event and your assigned campus'},400);
  const timestamp=Date.parse(proposed);
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(proposed)||!Number.isFinite(timestamp)||timestamp>Date.now()+60000||timestamp<Date.now()-30*86400000)
   return respond({error:'The missing punch must be within the previous 30 days and not in the future'},400);
  if(reason.length<12||reason.length>500)return respond({error:'Describe why the event was missed in 12–500 characters'},400);
  const week=weekStart(new Date(timestamp).toLocaleDateString('en-CA',{timeZone:'America/New_York'}));
  const approved:any=await c.db.prepare('SELECT 1 FROM employee_payroll_approvals WHERE employee_id=? AND week=?').bind(employee.id,week).first();
  if(approved)return respond({error:'Approved payroll week is locked. Contact school leadership.'},409);
  const prior:any=await c.db.prepare("SELECT 1 FROM employee_punch_corrections WHERE employee_id=? AND proposed_at=? AND proposed_action=? AND status='Pending'")
    .bind(employee.id,proposed,action).first();
  if(prior)return respond({error:'A matching missing punch is already awaiting review'},409);
  await c.db.prepare("INSERT INTO employee_punch_corrections(id,employee_id,punch_id,week,original_at,proposed_at,proposed_action,proposed_campus_id,reason,requested_by,requested_at,status) VALUES(?,?, '',?, '',?,?,?,?,?,?,'Pending')")
   .bind(crypto.randomUUID(),employee.id,week,proposed,action,campusId,reason,c.access.user.email,new Date().toISOString()).run();
  return respond({ok:true,status:'Pending'});
 }
 if(b.action==='request'){
  const punchId=String(b.punchId||'');
  const punch:any=await c.db.prepare('SELECT * FROM employee_punches WHERE id=?').bind(punchId).first();
  const employee=c.staff.find((s:any)=>s.id===punch?.employee_id);
  if(!punch||!employee||!canView(c,employee))return respond({error:'Punch not accessible'},403);
  if(c.me?.id!==employee.id&&!campusAuthorized(c,employee,punch))return respond({error:'Campus access denied'},403);
  const proposed=String(b.proposedAt||'').trim(),reason=String(b.reason||'').trim();
  const proposedDate=Date.parse(proposed),originalDate=Date.parse(punch.at);
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(proposed)||!Number.isFinite(proposedDate)||Math.abs(originalDate-proposedDate)>86400000||proposedDate>Date.now()+60000)return respond({error:'Correction must be a UTC timestamp within 24 hours of the original punch, not in the future'},400);
  if(reason.length<12||reason.length>500)return respond({error:'Explain the correction in 12 to 500 characters'},400);
  const week=weekStart(new Date(punch.at).toLocaleDateString('en-CA',{timeZone:'America/New_York'}));
  const approval:any=await c.db.prepare('SELECT 1 FROM employee_payroll_approvals WHERE employee_id=? AND week=?').bind(employee.id,week).first();
  if(approval)return respond({error:'Approved payroll is locked. Escalate to owner for a separate payroll adjustment.'},409);
  const previous:any=await c.db.prepare("SELECT 1 FROM employee_punch_corrections WHERE punch_id=? AND status='Pending'").bind(punch.id).first();
  if(previous)return respond({error:'An open correction already exists for this punch'},409);
  await c.db.prepare("INSERT INTO employee_punch_corrections(id,employee_id,punch_id,week,original_at,proposed_at,reason,requested_by,requested_at,status) VALUES(?,?,?,?,?,?,?,?,?,'Pending')")
   .bind(crypto.randomUUID(),employee.id,punch.id,week,punch.at,proposed,reason,c.access.user.email,new Date().toISOString()).run();
  return respond({ok:true,status:'Pending'});
 }
 if(b.action==='review'){
  if(!managers.has(c.access.role))return respond({error:'Manager required'},403);
  const id=String(b.id||''),decision=String(b.decision||'');
  if(!['Approved','Rejected'].includes(decision))return respond({error:'Choose Approved or Rejected'},400);
  const request:any=await c.db.prepare('SELECT * FROM employee_punch_corrections WHERE id=?').bind(id).first();
  const employee=c.staff.find((s:any)=>s.id===request?.employee_id);
  const punch:any=request&&(request.punch_id?await c.db.prepare('SELECT * FROM employee_punches WHERE id=?').bind(request.punch_id).first():{campus_id:request.proposed_campus_id});
  if(!request||request.status!=='Pending'||!employee||!punch)return respond({error:'Pending correction not found'},409);
  if(c.me?.id===employee.id||c.access.user.email.toLowerCase()===request.requested_by.toLowerCase())return respond({error:'Employees cannot approve their own corrections'},403);
  if(!campusAuthorized(c,employee,punch))return respond({error:'Campus approval denied'},403);
  const locked:any=await c.db.prepare('SELECT 1 FROM employee_payroll_approvals WHERE employee_id=? AND week=?').bind(employee.id,request.week).first();
  if(locked)return respond({error:'Payroll week already approved and locked'},409);
  if(decision==='Approved'){
   const rows:any=await c.db.prepare('SELECT id,action,at,campus_id FROM employee_punches WHERE employee_id=? ORDER BY at,id').bind(employee.id).all();
   const effective:any=await c.db.prepare("SELECT punch_id,proposed_at FROM employee_punch_corrections WHERE employee_id=? AND status='Approved'").bind(employee.id).all();
   const patches=new Map(effective.results.map((x:any)=>[x.punch_id,x.proposed_at]));
   if(request.punch_id)patches.set(request.punch_id,request.proposed_at);
   const revised=rows.results.map((p:any)=>({...p,at:patches.get(p.id)||p.at}));
   if(!request.punch_id)revised.push({id:request.id,action:request.proposed_action,at:request.proposed_at,campus_id:request.proposed_campus_id});
   const audit=workIntervals(revised);
   if(audit.issues.some(x=>x!=='Open time entry'))return respond({error:'Correction would invalidate chronological punch transitions: '+audit.issues.join('; ')},409);
  }
  const reviewed=new Date().toISOString();
  const approvalStatement=c.db.prepare("UPDATE employee_punch_corrections SET status=?,reviewed_by=?,reviewed_at=? WHERE id=? AND status='Pending'").bind(decision,c.access.user.email,reviewed,id);
  const statements=[approvalStatement];
  if(decision==='Approved'&&!request.punch_id){
   statements.push(c.db.prepare("INSERT INTO employee_punches(id,employee_id,campus_id,action,at,actor) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM employee_punch_corrections WHERE id=? AND status='Approved')")
    .bind(request.id,employee.id,request.proposed_campus_id,request.proposed_action,request.proposed_at,c.access.user.email,request.id));
  }
  const results:any=await c.db.batch(statements);
  if(!results[0]?.meta?.changes)return respond({error:'Correction already reviewed; reload'},409);
  return respond({ok:true,status:decision});
 }
 return respond({error:'Unknown correction action'},400);
 }catch(e){console.error('Punch correction operation failed',e);return respond({error:'Correction operation unavailable'},503);}
}
