'use client';
import {useState} from 'react';
import {ArrowRight,ClipboardCheck,ShieldCheck} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {today} from '../lib/training';
import {proposedSchoolFollowups,approvedSchoolFollowup} from '../lib/smart-followups';
import {campusSnapshot} from '../lib/operations';
type Props={records:R[];role:string;saveMany:(r:R[])=>Promise<boolean>;busy:boolean;demo:boolean;onCampus:(id:string)=>void;onPage:(page:string)=>void};
export default function SchoolControlTower({records,role,saveMany,busy,demo,onCampus,onPage}:Props){
 const [staffChoices,setStaffChoices]=useState<Record<string,string>>({}),[checked,setChecked]=useState<string[]>([]),[message,setMessage]=useState(''),[error,setError]=useState('');
 const manager=['Owner','Campus manager'].includes(role);
 if(!manager)return null;
 const date=today(),suggestions=proposedSchoolFollowups(records,date).slice(0,50),snapshot=campusSnapshot(records,date);
 async function assign(){
  setError('');setMessage('');
  const toSave:R[]=[];
  for(const suggestion of suggestions.filter(s=>checked.includes(s.key))){
   const staff=suggestion.candidateStaff.find(x=>x.id===(staffChoices[suggestion.key]||suggestion.suggestedStaffId));
   if(!staff){setError('Choose an active employee at the correct campus for every selected task.');return;}
   try{toSave.push(approvedSchoolFollowup(suggestion,staff,records,date,crypto.randomUUID()));}catch(e:any){setError(e.message);return;}
  }
  if(!toSave.length){setError('Select at least one suggested task first.');return;}
  if(demo){setError('This is practice mode. Return to the saved school to assign actual work.');return;}
  const ok=await saveMany(toSave);
  if(ok){setChecked([]);setMessage(toSave.length+' school follow-up task(s) saved. Each was assigned to a real active employee; no texts or emails were sent.');}
  else setError('The work could not be saved. Another employee may have already handled it. Reload and review before retrying.');
 }
 return <div className="school-control-tower">
  <section className="panel"><div className="sectionhead"><div><p className="eyebrow">CAMPUS CONTROL TOWER</p><h2>School locations</h2><p className="muted">Select a campus to see its school records. These counts use saved information, not verified attendance or live personnel tracking.</p></div><ShieldCheck size={26}/></div>
   <div className="campus-snapshot-cards">{snapshot.map(c=><button className="campus-snapshot-card" key={c.id} onClick={()=>onCampus(c.id)}><strong>{c.name}</strong><div className="campus-snapshot-stats"><span><b>{c.students}</b><small>Active students</small></span><span><b>{c.seats}</b><small>Open seats</small></span><span><b>{c.vehicles}</b><small>Trucks ready</small></span></div><p className="muted">{c.high} high-priority recorded issue(s) · {c.overdue} past-due task(s)</p><span className="campus-view-link">Open campus <ArrowRight size={16}/></span></button>)}</div>
   {!snapshot.length&&<p className="muted">No campus data appears in your authorized view. Check School Setup and staff campus permissions.</p>}</section>
  <details className="school-followup-review"><summary><span><strong>Prepare follow-up assignments</strong><small>{suggestions.length} suggested from saved records · staff approval required</small></span><ClipboardCheck size={21}/></summary><div className="school-followup-interior"><p className="muted">These are <b>suggestions</b>, not automatically assigned tasks. Review the underlying facts and choose an employee at the same campus. A recorded absence and a missing attendance entry are different things.</p>
   {suggestions.map(s=>{const selected=checked.includes(s.key),employee=staffChoices[s.key]||s.suggestedStaffId;return <div className="followup-choice" key={s.key}><label><input type="checkbox" checked={selected} disabled={!s.candidateStaff.length||busy} onChange={e=>setChecked(v=>e.target.checked?[...v,s.key]:v.filter(k=>k!==s.key))}/><span><strong>{s.signal.title} · {s.signal.record.name}</strong><small>{s.signal.detail}</small><small>Campus: {records.find(r=>r.id===s.campusId)?.name||'Unassigned'} · {s.signal.priority}</small></span></label><label>Assign to<select disabled={!s.candidateStaff.length||busy} value={employee} onChange={e=>setStaffChoices(v=>({...v,[s.key]:e.target.value}))}>{!s.candidateStaff.length&&<option value="">Add active school staff first</option>}{s.candidateStaff.map(staff=><option value={staff.id} key={staff.id}>{staff.name} · {staff.accessRole}</option>)}</select></label></div>})}
   {!suggestions.length&&<p className="muted">No new suggestions from saved records. Existing open work and completion approvals still need their normal review.</p>}
   <button className="primary" disabled={busy||!checked.length} onClick={assign}>Assign {checked.length} reviewed item(s)</button><button onClick={()=>onPage('tasks')}>Open to-do list <ArrowRight size={16}/></button>{error&&<p className="error" role="alert">{error}</p>}{message&&<p className="notice" role="status">{message}</p>}<p className="footnote">Creating tasks does not change funding, attendance, student grades, truck readiness, or regulatory status. Source-linked duplicate open tasks are blocked.</p></div></details>
 </div>;
}
