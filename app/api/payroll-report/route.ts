import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {database} from '../../../lib/storage';

const managers=['Owner','Regional admin','Campus manager'];
const ok=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const validWeek=(s:string)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s&&d.getUTCDay()===1;};
const nextWeek=(s:string)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+7);return d.toISOString().slice(0,10);};
const safeCsv=(v:unknown)=>{const s=String(v??'');return '"'+(/^[=+@\-\t\r]/.test(s)?"'"+s:s).replace(/"/g,'""')+'"';};
export async function GET(req:Request){
 try{
  const a=await getWorkspaceAccess();if(!a)return ok({error:'Sign in required'},401);
  if(!managers.includes(a.role))return ok({error:'School management access required'},403);
  const url=new URL(req.url),campusId=url.searchParams.get('campus')||'',week=url.searchParams.get('week')||'',csv=url.searchParams.get('format')==='csv';
  if(!validWeek(week)||!campusId)return ok({error:'Choose a campus and Monday payroll week'},400);
  if(a.role!=='Owner'&&a.role!=='Regional admin'&&!a.campusIds.includes(campusId))return ok({error:'Campus access denied'},403);
  const db=database(),campusRow:any=await db.prepare("SELECT payload FROM records WHERE owner='academy-owner' AND kind='campuses' AND id=?").bind(campusId).first();
  const campus=campusRow&&JSON.parse(campusRow.payload);
  if(!campus||campus.status!=='Active')return ok({error:'Active campus not found'},404);
  const staffRows:any=await db.prepare("SELECT id,payload FROM records WHERE owner='academy-owner' AND kind='staff'").all();
  const staff=staffRows.results.map((r:any)=>({...JSON.parse(r.payload),id:r.id})).filter((e:any)=>e.status==='Active'&&e.campusIds?.includes(campusId));
  const from=week+'T00:00:00.000Z',end=nextWeek(week)+'T00:00:00.000Z';
  const lines:any[]=[];
  for(const employee of staff){
   const punches:any=await db.prepare('SELECT action,at,campus_id FROM employee_punches WHERE employee_id=? AND at>=? AND at<? ORDER BY at,id').bind(employee.id,from,end).all();
   let inAt='',breakAt='',minutes=0,problems:string[]=[];
   for(const p of punches.results){
    if(p.action==='clock_in'){if(inAt||breakAt)problems.push('Overlapping clock-in');inAt=p.at;}
    else if(p.action==='break_start'){if(!inAt)problems.push('Break missing clock-in');else {if(p.campus_id===campusId)minutes+=(Date.parse(p.at)-Date.parse(inAt))/60000;inAt='';breakAt=p.at;}}
    else if(p.action==='break_end'){if(!breakAt)problems.push('Break end missing start');breakAt='';inAt=p.at;}
    else if(p.action==='clock_out'){if(!inAt)problems.push('Clock-out missing work start');else {if(p.campus_id===campusId)minutes+=(Date.parse(p.at)-Date.parse(inAt))/60000;inAt='';}}
   }
   if(inAt||breakAt)problems.push('Open time entry');
   if(punches.results.length&&punches.results[0].action!=='clock_in')problems.push('Possible cross-week shift');
   const approval:any=await db.prepare('SELECT approved_by,approved_at FROM employee_payroll_approvals WHERE employee_id=? AND week=?').bind(employee.id,week).first();
   const rate:any=await db.prepare('SELECT rate_cents FROM employee_pay_rates WHERE employee_id=? AND campus_id=?').bind(employee.id,campusId).first();
   const hours=Math.round(Math.max(0,minutes))/60;
   if(!approval)problems.push('Not approved');if(!rate)problems.push('Pay rate missing');
   lines.push({employeeId:employee.id,employee:employee.name,rate:rate?rate.rate_cents/100:null,hours:Number(hours.toFixed(2)),gross:rate?Number((hours*rate.rate_cents/100).toFixed(2)):null,approved:!!approval,problems:[...new Set(problems)]});
  }
  const valid=lines.filter(x=>!x.problems.length);
  const totalHours=Number(valid.reduce((n,r)=>n+r.hours,0).toFixed(2)),totalGross=Number(valid.reduce((n,r)=>n+r.gross,0).toFixed(2));
  const body={campus:campus.name,week,lines,totalHours,totalGross,ready:lines.every(r=>!r.problems.length),note:'Preliminary straight-time gross only. Overtime across campuses, adjustments, deductions and taxes require payroll review.'};
  if(csv){
   const rows=[['Campus','Week starting','Employee','Hourly pay','Hours worked','Straight-time gross','Approval','Exceptions'],...lines.map(l=>[campus.name,week,l.employee,l.rate??'',l.hours,l.gross??'',l.approved?'Approved':'Pending',l.problems.join('; ')]),['TOTAL','','','',''+totalHours,''+totalGross,'','']];
   const data='\uFEFF'+rows.map(r=>r.map(safeCsv).join(',')).join('\r\n');
   return new Response(data,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="academy-payroll-'+week+'.csv"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  return ok(body);
 }catch(e){console.error('Payroll report error',e);return ok({error:'Payroll reporting unavailable; database setup may be incomplete'},503);}
}
export async function POST(req:Request){
 try{
  const a=await getWorkspaceAccess();if(!a)return ok({error:'Sign in required'},401);
  if(a.role!=='Owner')return ok({error:'Only a school owner may set confidential pay rates'},403);
  if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return ok({error:'Invalid origin'},403);
  const b:any=await req.json();const rate=Number(b.hourlyRate),employeeId=String(b.employeeId||''),campusId=String(b.campusId||'');
  if(!Number.isFinite(rate)||rate<=0||rate>1000||Math.abs(Math.round(rate*100)-rate*100)>0.00001)return ok({error:'Enter an hourly pay rate with up to two decimal places'},400);
  const db=database(),row:any=await db.prepare("SELECT payload FROM records WHERE id=? AND kind='staff' AND owner='academy-owner'").bind(employeeId).first();
  if(!row||!JSON.parse(row.payload).campusIds?.includes(campusId))return ok({error:'Employee is not assigned to this campus'},400);
  const now=new Date().toISOString();const old:any=await db.prepare('SELECT rate_cents FROM employee_pay_rates WHERE employee_id=? AND campus_id=?').bind(employeeId,campusId).first();
  await db.batch([
   db.prepare('INSERT INTO employee_pay_rate_audit(id,employee_id,campus_id,previous_cents,new_cents,actor,at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),employeeId,campusId,old?.rate_cents??null,Math.round(rate*100),a.user.email,now),
   db.prepare('INSERT INTO employee_pay_rates(employee_id,campus_id,rate_cents,updated_by,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(employee_id,campus_id) DO UPDATE SET rate_cents=excluded.rate_cents,updated_by=excluded.updated_by,updated_at=excluded.updated_at').bind(employeeId,campusId,Math.round(rate*100),a.user.email,now)
  ]);
  return ok({ok:true});
 }catch(e){console.error('Pay rate save error',e);return ok({error:'Unable to update pay rate'},503);}
}
