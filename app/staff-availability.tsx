'use client';
import {useMemo,useState} from 'react';
import {AlertTriangle,CalendarDays,CheckCircle2,RotateCcw,UserRoundX} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {activeUnavailability,validateStaffUnavailability} from '../lib/staff-availability';

type Props={records:R[];saveMany:(items:R[])=>Promise<boolean>;busy:boolean;demo:boolean};
const localToday=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
export default function StaffAvailability({records,saveMany,busy,demo}:Props){
 const staff=records.filter(r=>r.kind==='staff'&&r.status==='Active'&&r.campusIds?.length);
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const [employeeId,setEmployeeId]=useState(''),[campusId,setCampusId]=useState(''),[date,setDate]=useState(localToday()),[allDay,setAllDay]=useState(true),[start,setStart]=useState('09:00'),[end,setEnd]=useState('17:00'),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const employee=staff.find(e=>e.id===employeeId)||staff[0];
 const availableCampuses=campuses.filter(c=>employee?.campusIds?.includes(c.id));
 const campus=availableCampuses.find(c=>c.id===campusId)||availableCampuses[0];
 const absent=useMemo(()=>employee&&date?activeUnavailability(records,employee.id,date):[],[records,employee?.id,date]);
 const affectedForNew=records.filter(x=>x.kind==='training-assignments'&&x.employeeId===employee?.id&&x.date===date&&['Planned','Confirmed'].includes(x.status)&&(allDay||x.start<end&&x.end>start));
 async function create(status:'Unavailable'|'Restored',restoresId?:string){
  setError('');setSuccess('');
  if(demo){setError('Leave sample mode before changing a real employee schedule.');return;}
  if(!employee||!campus){setError('Select an employee and campus first.');return;}
  const record:R={id:crypto.randomUUID(),kind:'staff-unavailability',name:employee.name+' — '+(status==='Restored'?'Restored availability':'Unavailable'),status,employeeId:employee.id,campusId:campus.id,date,...(status==='Unavailable'&&!allDay?{start,end}:{}),...(restoresId?{restoresId}:{})};
  const issue=validateStaffUnavailability(record);
  if(issue){setError(issue);return;}
  if(date<localToday()){setError('Do not backdate availability changes. Choose today or a future date.');return;}
  const ok=await saveMany([record]);
  if(ok)setSuccess(status==='Restored'?'Original availability hold closed. Check and re-confirm affected lessons.':'Availability saved. Any previously scheduled lessons still need manual review and reassignment.');
  else setError('Could not save this change. It may overlap another unavailable entry or a different campus.');
 }
 return <section className="panel staff-availability"><div className="sectionhead"><div><p className="eyebrow">TEAM SCHEDULING</p><h2>When an employee is unavailable</h2><p className="muted">Use this when an instructor or employee cannot cover a shift. No medical or personal explanation is collected.</p></div><UserRoundX size={29}/></div><div className="formgrid"><label>Employee<select value={employee?.id||''} onChange={e=>{setEmployeeId(e.target.value);setCampusId('');setError('');setSuccess('');}}>{!staff.length&&<option value="">No active staff</option>}{staff.map(e=><option value={e.id} key={e.id}>{e.name}</option>)}</select></label><label>Campus<select value={campus?.id||''} onChange={e=>setCampusId(e.target.value)}>{availableCampuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Unavailable date<input type="date" min={localToday()} value={date} onChange={e=>{setDate(e.target.value);setError('');}}/></label></div><label className="availability-all-day"><input type="checkbox" checked={allDay} onChange={e=>setAllDay(e.target.checked)}/> Unavailable all day</label>{!allDay&&<div className="formgrid"><label>From<input type="time" value={start} onChange={e=>setStart(e.target.value)}/></label><label>Until<input type="time" value={end} onChange={e=>setEnd(e.target.value)}/></label></div>}
 {absent.length>0&&<div className="availability-holds"><h3><CalendarDays size={18}/> Already recorded for this day</h3>{absent.map(item=><div className="reportrow" key={item.id}><div><b>{item.start?item.start+'–'+item.end:'All day'}</b><small>Recorded by {item.recordedBy||'School manager'} · {item.date}</small></div><button type="button" disabled={busy} onClick={()=>create('Restored',item.id)}><RotateCcw size={15}/>Restore</button></div>)}</div>}
 {affectedForNew.length>0&&<div className="availability-impact" role="status"><h3><AlertTriangle size={18}/> {affectedForNew.length} lesson(s) need reassignment</h3><p>Recording unavailable time does not cancel scheduled lessons. Review these lessons with a manager.</p>{affectedForNew.map(a=><div key={a.id}><b>{a.date} · {a.start}–{a.end}</b><small>{records.find(x=>x.id===a.studentId)?.name||'Student'} · {a.phase}</small></div>)}</div>}
 <button className="primary" type="button" disabled={busy||!employee||!campus||!date} onClick={()=>create('Unavailable')}>Record unavailable time</button>{error&&<p className="error" role="alert">{error}</p>}{success&&<p className="notice" role="status">{success}</p>}
 <p className="footnote">Unavailable-time entries and restorations are permanent, dated scheduling history. Actual absences, approved leave, payroll, pay deductions, medical information and employment law are handled outside this board. Do not mark a student absent because an instructor is unavailable.</p></section>;
}
