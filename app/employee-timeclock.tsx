'use client';
import {useEffect,useMemo,useState} from 'react';
import {weekStart} from '../lib/staff-scheduling';
import PunchCorrections from './punch-corrections';

type Punch={id:string;employee_id:string;campus_id:string;action:string;at:string;actor:string};
type Staff={id:string;name:string;campusIds:string[]};
type Data={employee:{id:string;name:string};self:boolean;directory:Staff[];punches:Punch[];current:{state:string;workedMinutes:number};approval?:{approved_by:string;approved_at:string};week:string};
const fmt=(iso:string)=>new Date(iso).toLocaleString('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'});
const hrs=(m:number)=>(Math.max(0,m)/60).toFixed(2);
function summarize(punches:Punch[]){
 const sorted=[...punches].sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id));
 let start:string|null=null,breakStart:string|null=null,minutes=0,breakMinutes=0;
 const rows:{date:string;in:string;out:string;hours:number;breakMinutes:number}[]=[];
 let active:{date:string;in:string;out:string;hours:number;breakMinutes:number}|null=null;
 for(const p of sorted){
  if(p.action==='clock_in'){start=p.at;breakStart=null;active={date:new Date(p.at).toLocaleDateString('en-CA',{timeZone:'America/New_York'}),in:p.at,out:'',hours:0,breakMinutes:0};rows.push(active);}
  if(p.action==='break_start'&&start){let n=(Date.parse(p.at)-Date.parse(start))/60000;minutes+=n;if(active)active.hours+=n;start=null;breakStart=p.at;}
  if(p.action==='break_end'&&breakStart){let n=(Date.parse(p.at)-Date.parse(breakStart))/60000;breakMinutes+=n;if(active)active.breakMinutes+=n;breakStart=null;start=p.at;}
  if(p.action==='clock_out'){if(start){let n=(Date.parse(p.at)-Date.parse(start))/60000;minutes+=n;if(active)active.hours+=n;}if(active)active.out=p.at;start=null;breakStart=null;active=null;}
 }
 return {rows,minutes,breakMinutes};
}
export default function EmployeeTimeclock({records,role}:{records:any[];role:string}){
 const staff=records.filter(r=>r.kind==='staff'&&r.status==='Active');
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const [week,setWeek]=useState(weekStart(new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'})));
 const [employee,setEmployee]=useState(''),[campus,setCampus]=useState(''),[data,setData]=useState<Data|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const manager=['Owner','Regional admin','Campus manager'].includes(role);
 async function load(selected=employee,selectedWeek=week){
  setError('');
  try{const q=new URLSearchParams({week:selectedWeek});if(selected)q.set('employee',selected);
   const r=await fetch('/api/timeclock?'+q,{cache:'no-store'}),body=await r.json();
   if(!r.ok)throw Error(body.error||'Unable to load time clock');
   setData(body);return body as Data;
  }catch(e:any){setError(e.message);return null;}
 }
 useEffect(()=>{void load(employee,week);},[employee,week]);
 useEffect(()=>{if(!campus&&data){const e=staff.find(s=>s.id===data.employee.id);if(e?.campusIds?.length)setCampus(e.campusIds[0]);}},[data,staff.length,campus]);
 const summary=useMemo(()=>summarize(data?.punches||[]),[data]);
 async function act(action:string){
  setBusy(true);setError('');setNotice('');
  try{const r=await fetch('/api/timeclock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action==='approve'?{action,employeeId:data?.employee.id,week}:{action,campusId:campus})});const body=await r.json();
   if(!r.ok)throw Error(body.error||'Unable to record action');
   await load();setNotice(action==='approve'?'Timesheet approval recorded and payroll week locked.':'Punch saved using school server time.');
  }catch(e:any){setError(e.message);}finally{setBusy(false);}
 }
 function exportCsv(){
  if(!data)return;
  const rows=[['Employee','Week','Work date','Clock in (Eastern)','Clock out (Eastern)','Worked hours','Unpaid break minutes','Approval'],...summary.rows.map(x=>[data.employee.name,week,x.date,fmt(x.in),x.out?fmt(x.out):'OPEN',hrs(x.hours),String(Math.round(x.breakMinutes)),data.approval?'Approved':'Unapproved'])];
  const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='academy-timeclock-'+week+'.csv';a.click();URL.revokeObjectURL(url);
 }
 return <div className="panel">
  <div className="sectionhead"><div><p className="eyebrow">EMPLOYEE OPERATIONS · VERIFIED WORK TIME</p><h2>Time Clock & Payroll</h2><p className="muted">Actual employee punches, unpaid breaks, weekly timecards and payroll approvals. Scheduled shifts are tracked separately.</p></div></div>
  <div className="formgrid">
   <label>Payroll week (Monday)<input type="date" value={week} onChange={e=>{if(e.target.value)setWeek(weekStart(e.target.value));}}/></label>
   {manager&&<label>Employee<select value={employee} onChange={e=>setEmployee(e.target.value)}><option value="">My time clock</option>{(data?.directory||[]).map(e=><option value={e.id} key={e.id}>{e.name}</option>)}</select></label>}
  </div>
  {error&&<p role="alert" className="muted" style={{color:'#b91c1c'}}>{error}</p>}{notice&&<p role="status">{notice}</p>}
  {data&&<><div className="formgrid">
   <div><p className="eyebrow">EMPLOYEE</p><h3>{data.employee.name}</h3><p className="muted">Current punch status: <strong>{data.current.state.toUpperCase()}</strong></p></div>
   <div><p className="eyebrow">RECORDED HOURS THIS WEEK</p><h3>{hrs(summary.minutes)} h</h3><p className="muted">Breaks: {Math.round(summary.breakMinutes)} min · {data.approval?'Approved':'Pending approval'}</p></div>
  </div>
  {data.self&&<div className="formgrid">
   <label>Clock-in campus<select value={campus} onChange={e=>setCampus(e.target.value)}>{(staff.find(s=>s.id===data.employee.id)?.campusIds||[]).map((id:string)=><option value={id} key={id}>{campuses.find(c=>c.id===id)?.name||id}</option>)}</select></label>
  </div>}
  {data.self&&<div className="reportactions">
   <button type="button" disabled={busy||data.current.state!=='out'||!!data.approval||!campus} onClick={()=>act('clock_in')}>Clock in</button>
   <button type="button" disabled={busy||data.current.state!=='working'||!!data.approval} onClick={()=>act('break_start')}>Start break</button>
   <button type="button" disabled={busy||data.current.state!=='break'||!!data.approval} onClick={()=>act('break_end')}>End break</button>
   <button type="button" disabled={busy||data.current.state!=='working'||!!data.approval} onClick={()=>act('clock_out')}>Clock out</button>
  </div>}
  <div className="reportactions"><button type="button" onClick={exportCsv}>Export timesheet CSV</button>{manager&&<button type="button" disabled={busy||!!data.approval||data.current.state!=='out'||!summary.rows.length} onClick={()=>act('approve')}>Approve & lock week</button>}</div>
  <p className="muted">Payroll hours reflect completed work intervals only. Open punches do not accrue in the displayed total until the next punch. Unapproved exports are clearly marked. Payroll taxes, wages, overtime premiums and payments are not processed by this module.</p>
  <div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><thead><tr><th>Work date</th><th>In</th><th>Out</th><th>Unpaid break</th><th>Hours</th></tr></thead><tbody>{summary.rows.map((x,i)=><tr key={i}><td>{x.date}</td><td>{fmt(x.in)}</td><td>{x.out?fmt(x.out):'Open'}</td><td>{Math.round(x.breakMinutes)} min</td><td>{hrs(x.hours)}</td></tr>)}</tbody></table></div>
  <h3>Punch audit trail</h3><div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><thead><tr><th>Time</th><th>Action</th><th>Campus</th></tr></thead><tbody>{data.punches.map(p=><tr key={p.id}><td>{fmt(p.at)}</td><td>{p.action.replace('_',' ')}</td><td>{campuses.find(c=>c.id===p.campus_id)?.name||p.campus_id}</td></tr>)}</tbody></table></div>
  <PunchCorrections employeeId={data.employee.id} punches={data.punches} self={data.self} onUpdated={()=>{void load();}}/>
  {data.approval&&<p className="muted">Approved by {data.approval.approved_by} · {fmt(data.approval.approved_at)}</p>}
  </>}
 </div>;
}
