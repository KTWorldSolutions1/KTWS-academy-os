'use client';
import {useState} from 'react';
import {AlertTriangle,CheckCircle2,ClipboardList,CalendarDays,ArrowRight,Truck} from 'lucide-react';
import {today,type RecordData as R} from '../lib/training';
import {instructorDailyCloseout} from '../lib/instructor-closeout';
type Props={records:R[];role:string;onNavigate:(page:string,recordId?:string)=>void};
export default function InstructorCloseout({records,role,onNavigate}:Props){
 const [date,setDate]=useState(today()),[campusId,setCampusId]=useState(''),[employeeId,setEmployeeId]=useState('');
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const campus=campuses.find(r=>r.id===campusId)||campuses[0];
 const instructors=records.filter(r=>r.kind==='staff'&&r.status==='Active'&&r.campusIds?.includes(campus?.id)&&['Instructor','Campus manager'].includes(r.accessRole));
 const teacher=instructors.find(s=>s.id===employeeId);
 const summary=instructorDailyCloseout(records,campus?.id||'',date,teacher?.id);
 const manages=['Owner','Campus manager'].includes(role);
 return <section className="panel" aria-label="Daily training review">
  <div className="sectionhead"><div><p className="eyebrow">END OF DAY • SCHOOL RECORDS</p><h2>Daily Training Review</h2><p className="muted">See which planned lessons have matching attendance entries and which trucks have unresolved safety reports. Nothing here marks a student absent or adds hours.</p></div><ClipboardList size={29}/></div>
  <div className="formgrid"><label>Campus<select value={campus?.id||''} onChange={e=>{setCampusId(e.target.value);setEmployeeId('');}}>{campuses.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Instructor<select value={teacher?.id||''} onChange={e=>setEmployeeId(e.target.value)}><option value="">Everyone on this campus</option>{instructors.map(i=><option value={i.id} key={i.id}>{i.name}</option>)}</select></label></div>
  <div className="closeout-metrics"><div><strong>{summary.planned}</strong><small>Lessons scheduled</small></div><div><strong>{summary.withTrainingEvidence}</strong><small>Matching training logs</small></div><div><strong>{summary.withoutTrainingEvidence}</strong><small>Need a record check</small></div><div><strong>{summary.vehicleHolds}</strong><small>Open truck safety reports</small></div></div>
  <p className="footnote">{summary.notice}</p>
  <div className="sectionhead"><h3>Items to check</h3><span className="badge">{summary.checks.length}</span></div>
  {summary.checks.length===0?<p className="notice"><CheckCircle2 size={17}/> No matching planned lessons or safety reports were found. This does not certify full attendance or school readiness.</p>:<div className="closeout-list">{summary.checks.map(item=><div className="closeout-item" key={item.id}>
   <span className={'closeout-status '+item.kind}>{item.kind==='recorded'?<CheckCircle2 size={19}/>:item.page==='fleet'?<Truck size={19}/>:item.kind==='attention'?<AlertTriangle size={19}/>:<CalendarDays size={19}/>}</span>
   <div><strong>{item.title}</strong><small>{item.detail}</small></div>
   <button type="button" onClick={()=>onNavigate(item.page,item.studentId)} aria-label={'Review '+item.title}>Review <ArrowRight size={15}/></button>
  </div>)}</div>}
  {manages&&<p className="footnote">A manager must approve equipment repairs, instructor qualifications and actual reporting decisions. Do not use this summary as a statutory training completion report.</p>}
 </section>;
}
