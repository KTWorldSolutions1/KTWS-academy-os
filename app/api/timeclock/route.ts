import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {database} from '../../../lib/storage';
import {managesTime,timeTotals,timecardDate,payrollAmount,payrollCsv,type Timecard} from '../../../lib/timeclock';
const reply=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function context(){const access=await getWorkspaceAccess();if(!access)return null;const db=database();const rows=await db.prepare("SELECT id,payload FROM records WHERE owner=? AND kind IN ('staff','campuses')").bind(access.scope).all();const records=rows.results.map((r:any)=>({...JSON.parse(r.payload),id:r.id}));const staff=records.find((r:any)=>r.kind==='staff'&&r.email?.toLowerCase()===access.user.email.toLowerCase());const campuses=records.filter((r:any)=>r.kind==='campuses'&&r.status==='Active'&&(access.role==='Owner'||access.campusIds.includes(r.id)));return {access,db,staff,campuses,records};}
const visible=(a:any,c:Timecard)=>c.employeeId===a.user.userId||(managesTime(a.role)&&(a.role==='Owner'||a.campusIds.includes(c.campusId)));
async function cards(db:any,scope:string){const r=await db.prepare('SELECT payload,revision FROM employee_timecards WHERE owner=? ORDER BY created DESC').bind(scope).all();return r.results.map((x:any)=>({...JSON.parse(x.payload),revision:x.revision})) as Timecard[];}
export async function GET(req:Request){const ctx=await context();if(!ctx)return reply({error:'Sign in required'},401);const {access,db,campuses,staff,records}=ctx;const accounts=managesTime(access.role)?(await db.prepare('SELECT id,email FROM accounts WHERE active=1').all()).results:[];const employees=accounts.flatMap((a:any)=>{const s=records.find((r:any)=>r.kind==='staff'&&r.status==='Active'&&r.email?.toLowerCase()===a.email.toLowerCase());const allowed=s?.campusIds?.filter((id:string)=>campuses.some((c:any)=>c.id===id))||[];return s&&allowed.length?[{id:a.id,name:s.name,campusIds:allowed}]:[];});const all=(await cards(db,access.scope)).filter(c=>visible(access,c));const u=new URL(req.url),from=u.searchParams.get('from')||'',to=u.searchParams.get('to')||'',campus=u.searchParams.get('campus')||'';const filtered=all.filter(c=>(!campus||c.campusId===campus)&&(!from||timecardDate(c)>=from)&&(!to||timecardDate(c)<=to));if(u.searchParams.get('export')==='csv'){
 if(!managesTime(access.role))return reply({error:'Manager access required'},403);if(!from||!to||from>to)return reply({error:'Select a date range'},400);if(filtered.some(c=>c.status!=='Approved'))return reply({error:'Every timecard in this campus/date range must be closed and approved before payroll export.'},409);if(!filtered.length)return reply({error:'No approved timecards in this range'},400);return new Response(payrollCsv(filtered),{headers:{'Content-Type':'text/csv;charset=utf-8','Content-Disposition':'attachment; filename="Academy-Payroll.csv"','Cache-Control':'no-store'}});
 }
 return reply({employeeId:access.user.userId,employeeName:staff?.name||access.user.displayName||access.user.email,manager:managesTime(access.role),employees,campuses:campuses.map((c:any)=>({id:c.id,name:c.name})),active:all.find(c=>c.employeeId===access.user.userId&&c.status==='Open')||null,cards:filtered});}
export async function POST(req:Request){const ctx=await context();if(!ctx)return reply({error:'Sign in required'},401);if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Invalid origin'},403);const {access,db,campuses,staff}=ctx;
 try{const b:any=await req.json(),now=new Date().toISOString(),all=await cards(db,access.scope);let old:Timecard|undefined,next:Timecard,action=String(b.action||'');
 if(action==='manual'){
  if(!managesTime(access.role))return reply({error:'Management access required'},403);
  const account:any=await db.prepare('SELECT id,email FROM accounts WHERE id=? AND active=1').bind(b.employeeId).first();
  const employee=ctx.records.find((r:any)=>r.kind==='staff'&&r.status==='Active'&&r.email?.toLowerCase()===account?.email?.toLowerCase());
  const campus=campuses.find((c:any)=>c.id===b.campusId);if(!account||!employee||!campus||!employee.campusIds?.includes(campus.id))return reply({error:'Choose an active employee account assigned to your campus'},403);
  if(typeof b.reason!=='string'||b.reason.trim().length<5||b.reason.length>1000)return reply({error:'Enter the source and reason for this manual timecard'},400);
  next={id:crypto.randomUUID(),employeeId:account.id,employeeName:employee.name,campusId:campus.id,campusName:campus.name,timezone:campus.state==='TX'?'America/Chicago':'America/New_York',events:[{type:'in',at:b.start},{type:'out',at:b.end}],revision:1,status:'Pending',adjustment:{start:b.start,end:b.end,unpaidMinutes:Number(b.unpaidMinutes),reason:b.reason},history:[{action:'manual',at:now,actor:access.user.email,reason:b.reason,before:{}}]};
  const t=timeTotals(next);if(Date.parse(t.end!)>Date.now())return reply({error:'Cannot enter future worked time'},400);
  if(all.some(c=>c.employeeId===account.id&&Date.parse(timeTotals(c).start)<Date.parse(t.end!)&&Date.parse(timeTotals(c).end||now)>Date.parse(t.start)))return reply({error:'Manual time overlaps an existing timecard'},409);
 }else if(action==='in'){
  if(all.some(c=>c.employeeId===access.user.userId&&c.status==='Open'))return reply({error:'You are already clocked in. Refresh to see the active shift.'},409);
  const campus=campuses.find((c:any)=>c.id===b.campusId);if(!campus)return reply({error:'Select an assigned active campus'},403);
  next={id:crypto.randomUUID(),employeeId:access.user.userId,employeeName:staff?.name||access.user.displayName||access.user.email,campusId:campus.id,campusName:campus.name,timezone:campus.state==='TX'?'America/Chicago':'America/New_York',events:[{type:'in',at:now}],revision:1,status:'Open',history:[]};
 }else{
  old=all.find(c=>c.id===b.id);if(!old||!visible(access,old))return reply({error:'Timecard not found'},404);if(b.revision!==old.revision)return reply({error:'Timecard changed. Refresh before retrying.'},409);next=structuredClone(old);next.revision++;
  if(['out','paid-break','unpaid-break','resume'].includes(action)){
   if(old.employeeId!==access.user.userId||old.status!=='Open')return reply({error:'Only the employee may punch their active shift'},403);
   next.events.push({type:action as any,at:now});timeTotals(next);if(action==='out')next.status='Pending';
  }else if(['correct','approve','reopen'].includes(action)){
   if(!managesTime(access.role)||!(access.role==='Owner'||access.campusIds.includes(old.campusId)))return reply({error:'Campus management access required'},403);
   if(action==='approve'){
    if(old.employeeId===access.user.userId)return reply({error:'Another manager must approve your timecard'},403);if(old.status!=='Pending')return reply({error:'Close and review the timecard first'},409);
    if(b.payrollReview!==true)return reply({error:'Confirm workweek overtime and break review'},400);
    next.pay={rate:Number(b.rate),overtimeHours:Number(b.overtimeHours),multiplier:Number(b.multiplier),reviewedBy:access.user.email,reviewedAt:now};payrollAmount(next);next.status='Approved';
   }else{
    if(typeof b.reason!=='string'||b.reason.trim().length<5||b.reason.length>1000)return reply({error:'Enter a correction reason (5–1000 characters)'},400);
    if(action==='reopen'){if(old.status!=='Approved')return reply({error:'Only approved cards can be reopened'},409);next.status='Pending';delete next.pay;}
    else{if(old.status==='Approved')return reply({error:'Reopen the approved card before correcting it'},409);next.adjustment={start:b.start,end:b.end,unpaidMinutes:Number(b.unpaidMinutes),reason:b.reason.trim()};const totals=timeTotals(next);if(Date.parse(totals.end!)>Date.now())return reply({error:'A correction cannot create future worked time'},400);if(all.some(c=>c.id!==old!.id&&c.employeeId===old!.employeeId&&Date.parse(timeTotals(c).start)<Date.parse(totals.end!)&&Date.parse(timeTotals(c).end||now)>Date.parse(totals.start)))return reply({error:'Correction overlaps another timecard'},409);next.status='Pending';delete next.pay;}
   }
  }else return reply({error:'Unknown time-clock action'},400);
  next.history=[...(old.history||[]),{at:now,actor:access.user.email,action,reason:b.reason||'',before:{events:old.events,adjustment:old.adjustment,pay:old.pay,status:old.status}}];
 }
 const payload=JSON.stringify(next);if(payload.length>250000)return reply({error:'Timecard history limit reached; contact the owner'},400);
 // Unique revision audit + partial open-shift index protect concurrent/retried writes.
 const audit=db.prepare('INSERT INTO employee_time_audit(id,owner,card_id,revision,actor,action,at,payload) VALUES(?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),access.scope,next.id,next.revision,access.user.userId,action,now,payload);
 const statement=old?db.prepare('UPDATE employee_timecards SET payload=?,revision=?,closed=? WHERE id=? AND owner=? AND revision=?').bind(payload,next.revision,next.status==='Open'?0:1,next.id,access.scope,old.revision):db.prepare('INSERT INTO employee_timecards(id,owner,employee,closed,revision,created,payload) VALUES(?,?,?,?,?,?,?)').bind(next.id,access.scope,next.employeeId,next.status==='Open'?0:1,1,now,payload);
 await db.batch([audit,statement]);return reply({ok:true,card:next});
 }catch(e:any){if(/UNIQUE|constraint/i.test(String(e.message)))return reply({error:'Another clock action was saved first. Refresh before retrying.'},409);return reply({error:e instanceof Error?e.message:'Unable to save timecard'},400);}
}
