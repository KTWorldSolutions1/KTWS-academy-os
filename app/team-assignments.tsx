'use client';
import {useState} from 'react';
import type {RecordData as R} from '../lib/training';
import {assignmentIssue} from '../lib/assignment-workflow';
import {CalendarDays,ClipboardCheck,Plus,UserRound} from 'lucide-react';
type Props={records:R[];role:string;busy:boolean;demo:boolean;saveMany:(rows:R[])=>Promise<boolean>};
export default function TeamAssignments({records,role,busy,demo,saveMany}:Props){
 const [campusId,setCampusId]=useState(''),[staffId,setStaffId]=useState(''),[mode,setMode]=useState<'tasks'|'appointments'>('tasks');
 const [form,setForm]=useState<R|null>(null),[message,setMessage]=useState(''),[error,setError]=useState('');
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const campus=campuses.find(r=>r.id===campusId)||campuses[0];
 const staff=records.filter(r=>r.kind==='staff'&&r.status==='Active'&&(r.campusIds||[]).includes(campus?.id));
 const tasks=records.filter(r=>r.kind==='tasks'&&r.campusId===campus?.id&&(staffId?staffId===r.assignedTo:true));
 const appointments=records.filter(r=>r.kind==='appointments'&&r.campusId===campus?.id&&(staffId?staffId===r.assignedTo:true));
 const rows=(mode==='tasks'?tasks:appointments).sort((a,b)=>String(a.due||a.date||'').localeCompare(String(b.due||b.date||'')));
 function start(){
  if(!campus)return;
  setForm({id:crypto.randomUUID(),kind:mode,campusId:campus.id,name:'',status:mode==='tasks'?'Open':'Scheduled',
   assignedTo:staff[0]?.id||'',priority:'Medium',due:new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'}),
   date:new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'}),start:'10:00',end:'10:30',type:'Campus appointment',description:''});
  setError('');
 }
 async function save(){
  if(!form)return;
  const problem=assignmentIssue(form,records);
  if(problem){setError(problem);return;}
  if(!form.assignedTo){setError('Select a staff member from this location.');return;}
  if(!form.name.trim()){setError('Provide a title for the assignment.');return;}
  if(await saveMany([form])){setForm(null);setMessage('Saved for assigned employee at '+campus?.name+'.');}
  else setError('Save failed; review the school error and try again.');
 }
 return <section className="panel team-assignments"><div className="sectionhead"><div><p className="eyebrow">MULTI-CAMPUS OPERATIONS</p><h2>Tasks, appointments and staff assignments</h2><p className="muted">Give work to an authorized employee at a specific campus. Regional administrators can coordinate schoolwide; other users only access the locations approved for their login.</p></div><ClipboardCheck size={24}/></div>
 <div className="formgrid"><label>School location<select value={campus?.id||''} onChange={e=>{setCampusId(e.target.value);setStaffId('');setForm(null);}}>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label>Assigned employee filter<select value={staffId} onChange={e=>setStaffId(e.target.value)}><option value="">All employees at this campus</option>{staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>
 <div className="subtabs"><button className={mode==='tasks'?'active':''} onClick={()=>{setMode('tasks');setForm(null);}}>Tasks</button><button className={mode==='appointments'?'active':''} onClick={()=>{setMode('appointments');setForm(null);}}>Appointments</button></div>
 <div className="sectionhead"><h3>{mode==='tasks'?'Assigned tasks':'Campus appointments'}</h3><button className="primary" onClick={start} disabled={busy||!campus||!staff.length}><Plus size={16}/> New {mode==='tasks'?'task':'appointment'}</button></div>
 {!staff.length&&<p className="notice">Assign an active employee to this campus in School Setup → Employees before creating their tasks or appointments.</p>}
 {rows.length?rows.map(r=><button className="recordrow" key={r.id} onClick={()=>{setForm({...r});setError('');}}><span>{r.kind==='tasks'?<ClipboardCheck size={17}/>:<CalendarDays size={17}/>}</span><div><b>{r.name}</b><small>{r.kind==='tasks'?r.due:r.date+' '+r.start+'–'+r.end} · {staff.find(s=>s.id===r.assignedTo)?.name||r.owner||'Unassigned'} · {campus?.name}</small></div><span className="badge">{r.status}</span></button>):<p className="muted">No {mode} currently assigned in this selected location.</p>}
 {message&&<p className="notice" role="status">{message}</p>}
 {form&&<form className="vault-upload" onSubmit={e=>{e.preventDefault();save();}}><h3>{form.revision?'Edit':'Create'} {form.kind==='tasks'?'task':'appointment'}</h3><label>Assignment title<input value={form.name} required onChange={e=>setForm({...form,name:e.target.value})}/></label>
 <label>Employee<select value={form.assignedTo||''} required onChange={e=>setForm({...form,assignedTo:e.target.value})}><option value="">Choose staff member</option>{staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
 <div className="formgrid"><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{(form.kind==='tasks'?['Open','In progress','Complete','Cancelled']:['Scheduled','Confirmed','Completed','Cancelled']).map(s=><option key={s}>{s}</option>)}</select></label>
 {form.kind==='tasks'?<><label>Due date<input type="date" value={form.due||''} onChange={e=>setForm({...form,due:e.target.value})}/></label><label>Priority<select value={form.priority||'Medium'} onChange={e=>setForm({...form,priority:e.target.value})}>{['Low','Medium','High','Urgent'].map(s=><option key={s}>{s}</option>)}</select></label></>:<><label>Appointment date<input type="date" required value={form.date||''} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Start<input type="time" value={form.start||''} onChange={e=>setForm({...form,start:e.target.value})}/></label><label>End<input type="time" value={form.end||''} onChange={e=>setForm({...form,end:e.target.value})}/></label></>}</div>
 <label>Instructions / notes<textarea value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})}/></label><button className="primary" disabled={busy}>Save assignment</button><button type="button" onClick={()=>setForm(null)}>Cancel</button></form>}
 {error&&<p className="error" role="alert">{error}</p>}
 <p className="footnote">Task ownership does not grant access to another campus's students, private documents or funding. For a cross-campus case, an owner must authorize the employee's campus assignment, or a regional administrator can perform a schoolwide management review.</p></section>;
}
