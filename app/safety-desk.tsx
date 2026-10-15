'use client';
import {useState} from 'react';
import {AlertTriangle,ClipboardCheck,ShieldCheck} from 'lucide-react';
import {today,type RecordData as R} from '../lib/training';
import {safetyTypes,safetyLocations,safetyReviewStatuses,safetyCaseSummary,validateSafetyRecord} from '../lib/safety-incidents';
type Props={records:R[];role:string;saveMany:(items:R[])=>Promise<boolean>;busy:boolean;demo:boolean};
export default function SafetyDesk({records,role,saveMany,busy,demo}:Props){
 const manager=['Owner','Campus manager'].includes(role);
 const campuses=records.filter(x=>x.kind==='campuses'&&x.status==='Active');
 const [campusId,setCampusId]=useState(''),[form,setForm]=useState<any>(null),[review,setReview]=useState<any>(null),[error,setError]=useState(''),[message,setMessage]=useState('');
 const campus=campuses.find(x=>x.id===campusId)||campuses[0];
 const trucks=records.filter(x=>x.kind==='fleet'&&x.campusId===campus?.id);
 const cases=campus?safetyCaseSummary(records,campus.id):[];
 function newConcern(){setMessage('');setError('');setReview(null);if(!campus){setError('Choose an active campus before submitting a report.');return;}setForm({id:crypto.randomUUID(),kind:'safety-incidents',name:'New school safety concern',status:'Reported',campusId:campus.id,date:today(),category:'Hazard',location:'Yard',unitId:'',urgent:false,description:''});}
 function newReview(incident:R){if(!manager)return;setError('');setMessage('');setForm(null);setReview({id:crypto.randomUUID(),kind:'safety-reviews',name:'Safety review — '+incident.name,status:cases.find(c=>c.incident.id===incident.id)?.lastReview?.status==='Resolved'?'Reopened':'In review',campusId:incident.campusId,incidentId:incident.id,date:today(),notes:'',sourceReference:'',resolution:''});}
 async function save(value:R,done:()=>void){
  setError('');setMessage('');
  if(demo){setError('Leave sample mode before creating a real school safety report.');return;}
  const issue=validateSafetyRecord(value);if(issue){setError(issue);return;}
  const ok=await saveMany([value]);
  if(ok){done();setMessage(value.kind==='safety-incidents'?'The concern was saved for campus management. If anyone is in danger, contact emergency services and your supervisor directly.':'Manager review saved. The original incident remains unchanged for the school record.');}
  else setError('The report could not be saved. Check the campus and entered details; then try again.');
 }
 return <div className="school-safety">
  <section className="panel"><div className="sectionhead"><div><p className="eyebrow">SCHOOL SAFETY</p><h2>Report a Safety Concern</h2><p className="muted">Anyone on the team can report a hazard, near miss, or vehicle incident. Only authorized campus leaders can see submitted reports and record their review.</p></div><ShieldCheck size={28}/></div>
   <div className="todayfocus safety-emergency"><strong><AlertTriangle size={19}/> Immediate danger?</strong><p>Stop unsafe training, follow the campus emergency plan, and contact emergency services or the on-duty supervisor now. This form does not send emergency alerts or replace required state or employer incident reporting.</p></div>
   <div className="formgrid"><label>School campus<select value={campus?.id||''} onChange={e=>{setCampusId(e.target.value);setForm(null);setReview(null);}}>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
   <button type="button" className="primary" disabled={busy||!campus} onClick={newConcern}>Create safety report</button>
   {!manager&&<p className="footnote">To protect personnel and students, only school management can review case details after you submit. Your account does not have access to other people's incident reports.</p>}
  </section>
  {form&&<section className="panel"><h3>What happened?</h3><div className="formgrid">
   <label>Short title<input maxLength={200} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
   <label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
   <label>Type of concern<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{safetyTypes.map(t=><option key={t}>{t}</option>)}</select></label>
   <label>Where<select value={form.location} onChange={e=>setForm({...form,location:e.target.value})}>{safetyLocations.map(t=><option key={t}>{t}</option>)}</select></label>
   <label>Training truck, if involved<select value={form.unitId} onChange={e=>setForm({...form,unitId:e.target.value})}><option value="">No specific truck</option>{trucks.map(v=><option value={v.id} key={v.id}>{v.name}</option>)}</select></label>
   <label>Needs immediate supervisor attention?<select value={String(form.urgent)} onChange={e=>setForm({...form,urgent:e.target.value==='true'})}><option value="false">Normal review</option><option value="true">Urgent — call the supervisor too</option></select></label></div>
   <label>What happened? What needs to be made safe?<textarea rows={5} maxLength={3000} minLength={12} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the observable issue, location and immediate steps. Avoid medical diagnoses, SSNs, license numbers or other private details."/></label>
   <div className="reportactions"><button className="primary" disabled={busy} onClick={()=>save(form,()=>setForm(null))}>Save concern</button><button onClick={()=>setForm(null)}>Cancel</button></div>
  </section>}
  {manager&&campus&&<section className="panel"><div className="sectionhead"><div><h2>Management safety log</h2><p className="muted">Each report stays saved as written; each management review creates a new dated record. Do not mark an unresolved hazard safe without verifying the actual remedy.</p></div><span className="badge warn">{cases.filter(c=>c.open).length} open</span></div>
   {cases.map(({incident,lastReview,open,urgent})=><div className="reportrow" key={incident.id}><div><b>{incident.name} {urgent?' · Urgent':''}</b><small>{incident.date} · {incident.category} · {incident.location} · {incident.reportedBy||'Staff report'}</small><small>{incident.description}</small><small>Latest management status: {lastReview?.status||'Not yet reviewed'}{lastReview?.reviewedBy?' · '+lastReview.reviewedBy:''}</small></div><button disabled={busy} onClick={()=>newReview(incident)}>{open?'Review':'Reopen'}</button></div>)}
   {!cases.length&&<p className="muted">No safety reports are saved at this campus. That does not guarantee there are no unreported hazards.</p>}
  </section>}
  {manager&&review&&<section className="panel"><h3>Record a management review</h3><div className="formgrid">
   <label>Review date<input type="date" value={review.date} onChange={e=>setReview({...review,date:e.target.value})}/></label>
   <label>Decision<select value={review.status} onChange={e=>setReview({...review,status:e.target.value})}>{safetyReviewStatuses.map(s=><option key={s}>{s}</option>)}</select></label>
   <label>Original source / repair reference<input maxLength={300} value={review.sourceReference} onChange={e=>setReview({...review,sourceReference:e.target.value})}/></label>
  </div>
  <label>What was investigated? Who was notified?<textarea rows={4} minLength={12} maxLength={3000} value={review.notes} onChange={e=>setReview({...review,notes:e.target.value})}/></label>
  {review.status==='Resolved'&&<label>Verified remedy, inspection and next step<textarea rows={3} minLength={20} maxLength={3000} value={review.resolution} onChange={e=>setReview({...review,resolution:e.target.value})}/></label>}
  <p className="footnote">This internal case status does not constitute approval to operate a truck. For a truck defect, the separate Truck Checks repair clearance and Ready fleet status are still required.</p>
  <div className="reportactions"><button className="primary" disabled={busy} onClick={()=>save(review,()=>setReview(null))}>Save management review</button><button onClick={()=>setReview(null)}>Cancel</button></div></section>}
  {error&&<p className="error" role="alert">{error}</p>}{message&&<p className="notice" role="status">{message}</p>}
 </div>;
}
