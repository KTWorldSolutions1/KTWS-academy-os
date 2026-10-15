'use client';
import {useState} from 'react';
import {AlertTriangle,ClipboardCheck,ShieldCheck,ChevronRight} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {campusReadinessSnapshot,readinessAreas,readinessStates,validateCampusReadiness} from '../lib/campus-readiness';
type Props={records:R[];role:string;saveMany:(r:R[])=>Promise<boolean>;busy:boolean;demo:boolean};
const currentDate=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
export default function CampusReadiness({records,role,saveMany,busy,demo}:Props){
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const manager=['Owner','Campus manager'].includes(role);
 const [campusId,setCampusId]=useState(''),[form,setForm]=useState<R|null>(null),[error,setError]=useState(''),[message,setMessage]=useState('');
 const campus=campuses.find(x=>x.id===campusId)||campuses[0];
 const snapshots=campuses.map(c=>({...campusReadinessSnapshot(records,c.id,currentDate()),name:c.name}));
 const current=campus?campusReadinessSnapshot(records,campus.id,currentDate()):null;
 function review(area:string){
  if(!campus||!manager)return;
  setError('');setMessage('');
  const existing=records.find(x=>x.kind==='campus-readiness'&&x.campusId===campus.id&&x.area===area);
  setForm(existing?{...existing}:{id:crypto.randomUUID(),kind:'campus-readiness',name:'Readiness review — '+area,status:'Not started',area,campusId:campus.id,sourceReference:'',sourceCheckedOn:'',reviewDue:'',notes:'',correctionReason:''});
 }
 async function save(){
  if(!form)return;
  setError('');setMessage('');
  if(demo){setError('Return to the saved school to record manager approval.');return;}
  const invalid=validateCampusReadiness(form);
  if(invalid){setError(invalid);return;}
  const ok=await saveMany([form]);
  if(ok){setMessage('School readiness review saved. This does not confirm approval by a licensing agency.');setForm(null);}
  else setError('Unable to save. Check the recorded evidence, date or campus and try again.');
 }
 return <section className="panel campus-review"><div className="sectionhead"><div><p className="eyebrow">MANAGER REVIEW · ALL CAMPUSES</p><h2>Campus Readiness</h2><p className="muted">A simple checklist for Greensboro, Mansfield and Dallas. Track supporting evidence for operational items separately from any actual state or federal agency approval.</p></div><ShieldCheck size={27}/></div>
 <div className="readiness-overview">{snapshots.map(summary=><button type="button" key={summary.campusId} className={campus?.id===summary.campusId?'selected':''} onClick={()=>{setCampusId(summary.campusId);setForm(null);}}><b>{summary.name}</b><strong>{summary.reviewed} <small>of {summary.checks.length} reviewed</small></strong><span>{summary.blocked} blocked • {summary.overdue} past review date</span></button>)}</div>
 {!campus&&<p className="muted">Create or activate a campus before recording its operational checks.</p>}
 {current&&<><div className="todayfocus"><h3>{campus?.name} — items to check</h3><p>{current.reviewed} areas have manager review evidence. {current.unrecorded} have never been recorded, and {current.blocked} are flagged as blocked.</p><p className="footnote">{current.notice}</p></div>
 <div className="readiness-categories">{current.checks.map(check=><div className="readiness-category" key={check.area}><span className={'readiness-status-icon '+(check.reviewed?'done':check.status==='Blocked'?'blocked':'pending')}>{check.reviewed?<ShieldCheck size={20}/>:check.status==='Blocked'?<AlertTriangle size={20}/>:<ClipboardCheck size={20}/>}</span><div><b>{check.area}</b><small>{check.detail}</small><small>{check.record?'School status: '+check.status:'Not yet reviewed'}{check.overdue?' • Review date passed':''}{check.record?.reviewedBy?' • Last reviewed by '+check.record.reviewedBy:''}</small></div>{manager&&<button type="button" onClick={()=>review(check.area)}>Review <ChevronRight size={14}/></button>}</div>)}</div></>}
 {form&&<div className="todayfocus campus-review-editor"><h3>{form.area} — {campus?.name}</h3><p className="muted">Record the actual evidence examined. For government approvals, enter the exact source/decision reference; a manager review is not itself an official authorization.</p><div className="formgrid"><label>Where we are<select value={form.status} onChange={e=>setForm(old=>({...old!,status:e.target.value}))}>{readinessStates.map(x=><option key={x}>{x}</option>)}</select></label><label>Date source was checked<input type="date" value={form.sourceCheckedOn||''} onChange={e=>setForm(old=>({...old!,sourceCheckedOn:e.target.value}))}/></label><label>Next internal review due<input type="date" value={form.reviewDue||''} onChange={e=>setForm(old=>({...old!,reviewDue:e.target.value}))}/></label><label>Source reference<input maxLength={300} value={form.sourceReference||''} onChange={e=>setForm(old=>({...old!,sourceReference:e.target.value}))} placeholder="Inspection record, approval ID or dated school checklist"/></label></div><label>What was checked and what is still needed?<textarea maxLength={4000} rows={3} value={form.notes||''} onChange={e=>setForm(old=>({...old!,notes:e.target.value}))}/></label>{form.reviewedBy&&<label>Reason for changing a previously reviewed item<textarea maxLength={4000} rows={2} value={form.correctionReason||''} onChange={e=>setForm(old=>({...old!,correctionReason:e.target.value}))}/></label>}
 <div className="reportactions"><button className="primary" disabled={busy} onClick={save}>{busy?'Saving…':'Save campus check'}</button><button onClick={()=>setForm(null)}>Cancel</button></div></div>}
 {error&&<p className="error" role="alert">{error}</p>}{message&&<p className="notice" role="status">{message}</p>}
 <p className="footnote">School operations review only. No uploaded proof or government-verified approval is implied by these checks. Continue required state licensing, insurance, site inspection and FMCSA TPR verification separately.</p>
 </section>;
}
