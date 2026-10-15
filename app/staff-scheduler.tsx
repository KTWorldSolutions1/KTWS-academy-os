'use client';
import {useMemo,useState} from 'react';
import type {RecordData as R} from '../lib/training';
import {paidShiftHours,plannedPaidHours,weekDates,weekStart} from '../lib/staff-scheduling';
type Day={enabled:boolean;start:string;end:string;breakMinutes:number};
const names=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const template=()=>names.map((_,i):Day=>({enabled:i<5,start:'08:00',end:'17:00',breakMinutes:60}));
export default function StaffScheduler({records,reload}:{records:R[];reload:()=>Promise<boolean>}){
 const staff=records.filter(r=>r.kind==='staff'&&r.status==='Active'&&r.campusIds?.length);
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const shifts=records.filter(r=>r.kind==='shifts');
 const [employeeId,setEmployeeId]=useState(''),[campusId,setCampusId]=useState(''),[week,setWeek]=useState(weekStart(new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'}))),[days,setDays]=useState<Day[]>(template),[approval,setApproval]=useState('Proposed'),[working,setWorking]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const employee=staff.find(x=>x.id===employeeId)||staff[0];
 const eligible=campuses.filter(c=>employee?.campusIds.includes(c.id));
 const campus=eligible.find(x=>x.id===campusId)||eligible[0];
 const dates=useMemo(()=>weekDates(week),[week]);
 const prepared=days.map((d,i)=>({...d,date:dates[i],hours:paidShiftHours(d)}));
 const hours=prepared.filter(d=>d.enabled).reduce((n,d)=>n+(Number.isFinite(d.hours)?d.hours:0),0);
 const existing=employee?plannedPaidHours(shifts,employee.id,week):0;
 const target=Number(employee?.weeklyTargetHours||40);
 async function saveWeek(){
  setError('');setNotice('');
  if(!employee||!campus){setError('Select an employee with an assigned active campus.');return;}
  const chosen=prepared.filter(d=>d.enabled);
  if(!chosen.length||chosen.some(d=>!Number.isFinite(d.hours)||d.hours<=0||d.hours>12)){setError('Choose at least one valid shift. Each paid shift must be more than zero and no more than 12 hours.');return;}
  const recordsToSave=chosen.map(d=>({id:crypto.randomUUID(),kind:'shifts',name:employee.name+' — '+d.date,status:approval,employeeId:employee.id,campusId:campus.id,date:d.date,start:d.start,end:d.end,breakMinutes:Number(d.breakMinutes),hours:d.hours}));
  setWorking(true);
  try{
   const res=await fetch('/api/records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({records:recordsToSave})});
   const data:any=await res.json();if(!res.ok)throw Error(data.error||'Save failed');
   await reload();setNotice('Saved '+recordsToSave.length+' shifts. This is a staffing plan, not a payroll timecard or employee acceptance.');
  }catch(e:any){setError(e.message||'Save failed.');}finally{setWorking(false);}
 }
 return <div><section className="panel"><h2>Staff scheduling & coverage</h2><p className="muted">Build a weekly shift plan, calculate paid hours after unpaid breaks, and flag conflicts. Campus operating hours and meal-break policy require manager review. This is not Sling timekeeping or payroll.</p><div className="formgrid"><label>Employee<select value={employee?.id||''} onChange={e=>{setEmployeeId(e.target.value);setCampusId('');}}>{staff.length===0&&<option value="">No active employees assigned</option>}{staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Campus<select value={campus?.id||''} onChange={e=>setCampusId(e.target.value)}>{eligible.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Week of (Monday)<input type="date" value={week} onChange={e=>{if(e.target.value)setWeek(weekStart(e.target.value));}}/></label><label>Approval status<select value={approval} onChange={e=>setApproval(e.target.value)}><option>Proposed</option><option>Approved</option></select></label></div><div className="todayfocus"><b>Planned new shifts: {Math.round(hours*100)/100} paid hours</b><p>Already saved this week: {existing} hours • Combined if approved: {Math.round((existing+hours)*100)/100} hours • Employee planning target: {target} hours.</p>{existing+hours>target&&<p className="error">Above planning target — obtain any required approval before scheduling overtime.</p>}{chosenOutsideHours(prepared)&&<p className="muted">Some proposed shifts extend outside 8 AM–5 PM. Confirm campus coverage and supervisor approval.</p>}</div>{prepared.map((d,i)=><div className="reportrow" key={d.date}><div><label><input type="checkbox" checked={d.enabled} onChange={e=>setDays(old=>old.map((x,j)=>j===i?{...x,enabled:e.target.checked}:x))}/> {names[i]}, {d.date}</label><small>{d.enabled&&Number.isFinite(d.hours)?d.hours+' paid hours':'Not scheduled'}</small></div>{d.enabled&&<div className="formgrid"><label>Start<input type="time" value={d.start} onChange={e=>setDays(old=>old.map((x,j)=>j===i?{...x,start:e.target.value}:x))}/></label><label>End<input type="time" value={d.end} onChange={e=>setDays(old=>old.map((x,j)=>j===i?{...x,end:e.target.value}:x))}/></label><label>Unpaid break (min)<input type="number" min="0" max="120" value={d.breakMinutes} onChange={e=>setDays(old=>old.map((x,j)=>j===i?{...x,breakMinutes:Number(e.target.value)}:x))}/></label></div>}</div>)}<button className="primary" onClick={saveWeek} disabled={working||!employee||!campus}>{working?'Saving…':'Save weekly staffing plan'}</button>{error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="notice" role="status">{notice}</p>}</section><section className="panel"><h3>Saved weekly coverage</h3>{staff.map(s=><div className="reportrow" key={s.id}><div><b>{s.name}</b><small>{s.role||s.accessRole||'Employee'} • {plannedPaidHours(shifts,s.id,week)} planned paid hours • target {Number(s.weeklyTargetHours||40)} hours</small></div></div>)}{shifts.filter(s=>dates.includes(s.date)).sort((a,b)=>a.date.localeCompare(b.date)).map(s=><div className="reportrow" key={s.id}><div><b>{staff.find(e=>e.id===s.employeeId)?.name||s.name} — {s.date}</b><small>{s.start}–{s.end} • {s.breakMinutes} min unpaid • {paidShiftHours(s)} paid hours • {s.status}</small></div></div>)}{!shifts.some(s=>dates.includes(s.date))&&<p className="muted">No shifts saved for this week.</p>}</section></div>;
}
function chosenOutsideHours(days:Array<Day & {date:string;hours:number}>){return days.some(d=>d.enabled&&(d.start<'08:00'||d.end>'17:00'));}
