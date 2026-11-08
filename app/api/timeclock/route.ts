import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {database} from '../../../lib/storage';

const managerRoles=new Set(['Owner','Regional admin','Campus manager']);
const actions=['clock_in','break_start','break_end','clock_out'] as const;
type Punch={id:string;employee_id:string;campus_id:string;action:string;at:string;actor:string};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const weekPattern=/^\d{4}-\d{2}-\d{2}$/;
function weekMonday(iso:string){
 const day=new Date(iso+'T12:00:00Z');
 if(!weekPattern.test(iso)||Number.isNaN(day.getTime())||day.toISOString().slice(0,10)!==iso)return null;
 day.setUTCDate(day.getUTCDate()-(day.getUTCDay()+6)%7);
 return day.toISOString().slice(0,10);
}
function weekEnd(monday:string){const d=new Date(monday+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+7);return d.toISOString().slice(0,10);}
async function context(){
 const access=await getWorkspaceAccess();if(!access)return null;
 const db=database();
 const rows:any=await db.prepare("SELECT id,payload FROM records WHERE owner='academy-owner' AND kind='staff'").all();
 const employees=rows.results.map((r:any)=>({...JSON.parse(r.payload),id:r.id})).filter((r:any)=>r.status==='Active');
 const me=employees.find((e:any)=>String(e.email||'').toLowerCase()===access.user.email.toLowerCase());
 return {access,db,employees,me,manager:managerRoles.has(access.role)};
}
function visible(employee:any,ctx:any){
 return ctx.access.role==='Owner'||employee.campusIds?.some((id:string)=>ctx.access.campusIds.includes(id));
}
async function punches(db:any,employeeId:string){
 const r:any=await db.prepare('SELECT * FROM employee_punches WHERE employee_id=? ORDER BY at ASC,id ASC').bind(employeeId).all();
 return r.results as Punch[];
}
function state(rows:Punch[]){
 let state='out',openAt='',breakAt='';let worked=0;
 for(const p of rows){
  const t=Date.parse(p.at);
  if(p.action==='clock_in'){state='working';openAt=p.at;}
  if(p.action==='break_start'&&state==='working'){worked+=(t-Date.parse(openAt))/60000;state='break';breakAt=p.at;}
  if(p.action==='break_end'&&state==='break'){state='working';openAt=p.at;breakAt='';}
  if(p.action==='clock_out'){
   if(state==='working')worked+=(t-Date.parse(openAt))/60000;
   state='out';openAt='';breakAt='';
  }
 }
 return {state,workedMinutes:Math.max(0,Math.round(worked)),openAt,breakAt};
}
export async function GET(req:Request){
 try{
  const c=await context();if(!c)return json({error:'Sign in required'},401);
  const u=new URL(req.url),week=weekMonday(u.searchParams.get('week')||new Date().toISOString().slice(0,10));
  if(!week)return json({error:'Invalid date'},400);
  const selfOnly=u.searchParams.get('self')==='1';
  const selected=selfOnly?c.me?.id:(u.searchParams.get('employee')||c.me?.id||(c.manager?c.employees.find((e:any)=>visible(e,c))?.id:undefined));
  if(!selected)return json({error:'No employee record matches your login. Ask the owner to add your email to Employees.'},409);
  const employee=c.employees.find((e:any)=>e.id===selected);
  if(!employee||!(c.me?.id===selected||c.manager&&visible(employee,c)))return json({error:'Employee not accessible'},403);
  const from=week+'T00:00:00.000Z',to=weekEnd(week)+'T00:00:00.000Z';
  const all=await punches(c.db,employee.id);
  // Include the previous punch so a shift crossing a week boundary remains visible.
  const selection=all.filter(p=>p.at>=from&&p.at<to);
  const approval:any=await c.db.prepare('SELECT * FROM employee_payroll_approvals WHERE employee_id=? AND week=?').bind(employee.id,week).first();
  const directory=c.manager?c.employees.filter((e:any)=>visible(e,c)).map((e:any)=>({id:e.id,name:e.name,campusIds:e.campusIds||[]})):[];
  const campusRows:any=await c.db.prepare("SELECT id,payload FROM records WHERE owner='academy-owner' AND kind='campuses'").all();
  const assignedCampuses=campusRows.results.map((r:any)=>({...JSON.parse(r.payload),id:r.id})).filter((r:any)=>r.status==='Active'&&employee.campusIds?.includes(r.id)).map((r:any)=>({id:r.id,name:r.name}));
  return json({employee:{id:employee.id,name:employee.name},self:c.me?.id===employee.id,directory,assignedCampuses,punches:selection,current:state(all),approval,week});
 }catch(e){console.error('Timeclock read failed',e);return json({error:'Time clock unavailable. Verify D1 schema migration.'},503);}
}
export async function POST(req:Request){
 try{
  const c=await context();if(!c)return json({error:'Sign in required'},401);
  if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Invalid origin'},403);
  const b:any=await req.json();
  if(b.action==='approve'){
   if(!c.manager)return json({error:'Manager approval required'},403);
   const employee=c.employees.find((e:any)=>e.id===b.employeeId);
   const week=weekMonday(b.week);
   if(!employee||!visible(employee,c)||!week)return json({error:'Employee or week is invalid'},400);
   if(c.me?.id===employee.id)return json({error:'Employees cannot approve their own timesheets. Another authorized manager must review.'},403);
   const rows=await punches(c.db,employee.id),cut=weekEnd(week)+'T00:00:00.000Z';
   const period=rows.filter(p=>p.at>=week+'T00:00:00.000Z'&&p.at<cut);
   if(!period.length)return json({error:'There are no punches to approve this week.'},409);
   if(period[0].action!=='clock_in'||state(period).state!=='out')return json({error:'This week includes an open or cross-week punch. Review and close the timecard before approval.'},409);
   if(week>new Date().toISOString().slice(0,10))return json({error:'Future weeks cannot be approved.'},409);
   await c.db.prepare('INSERT INTO employee_payroll_approvals(employee_id,week,approved_by,approved_at) VALUES(?,?,?,?) ON CONFLICT(employee_id,week) DO NOTHING').bind(employee.id,week,c.access.user.email,new Date().toISOString()).run();
   return json({ok:true});
  }
  if(!actions.includes(b.action))return json({error:'Invalid punch action'},400);
  const employee=c.me;
  if(!employee)return json({error:'Your login is not connected to an active staff record.'},403);
  const campusId=String(b.campusId||'');
  if(!employee.campusIds?.includes(campusId))return json({error:'Choose one of your assigned campuses'},403);
  const all=await punches(c.db,employee.id),current=state(all);
  const expected:Record<string,string>={clock_in:'out',break_start:'working',break_end:'break',clock_out:'working'};
  if(current.state!==expected[b.action])return json({error:'Punch conflicts with your current state: '+current.state},409);
  const now=new Date().toISOString(),week=weekMonday(now.slice(0,10))!;
  const approval:any=await c.db.prepare('SELECT week FROM employee_payroll_approvals WHERE employee_id=? AND week=?').bind(employee.id,week).first();
  if(approval)return json({error:'This payroll week is approved and locked. Request a manager correction.'},409);
  // A conditional insert prevents simultaneous duplicate punches by checking latest transition.
  const last=all[all.length-1];
  const id=crypto.randomUUID();
  const q=last
   ?c.db.prepare('INSERT INTO employee_punches(id,employee_id,campus_id,action,at,actor) SELECT ?,?,?,?,?,? WHERE (SELECT id FROM employee_punches WHERE employee_id=? ORDER BY at DESC,id DESC LIMIT 1)=?').bind(id,employee.id,campusId,b.action,now,c.access.user.email,employee.id,last.id)
   :c.db.prepare('INSERT INTO employee_punches(id,employee_id,campus_id,action,at,actor) SELECT ?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM employee_punches WHERE employee_id=?)').bind(id,employee.id,campusId,b.action,now,c.access.user.email,employee.id);
  const result:any=await q.run();
  if(!result.meta?.changes)return json({error:'Your time clock changed on another device. Refresh and retry.'},409);
  return json({ok:true,id,at:now});
 }catch(e){console.error('Timeclock punch failed',e);return json({error:'Time clock unavailable. Verify employee setup and database migration.'},503);}
}
