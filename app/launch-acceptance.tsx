'use client';
import {useState} from 'react';
import {AlertCircle,CheckCircle2,ChevronRight,ClipboardCheck,LockKeyhole} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {launchAreas,launchStatus,validateLaunchEvidence} from '../lib/launch-acceptance';
type Props={records:R[];saveMany:(r:R[])=>Promise<boolean>;busy:boolean;demo:boolean};
const currentDate=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
export default function LaunchAcceptance({records,saveMany,busy,demo}:Props){
 const report=launchStatus(records,currentDate());
 const [form,setForm]=useState<R|null>(null),[error,setError]=useState(''),[result,setResult]=useState('');
 const groups=['Whole school','Greensboro','Mansfield','Dallas'];
 function edit(item:typeof report.items[number]){
  if(item.campusId!=='__school__'&&!item.campusId)return;
  setError('');setResult('');
  setForm(item.record?{...item.record}:{id:crypto.randomUUID(),kind:'launch-acceptance',name:'School launch review: '+item.label,status:'Not checked',campusId:item.campusId,area:item.area,sourceReference:'',sourceCheckedOn:'',secondCustodian:'',notes:'',attestedByOwner:false,correctionReason:''});
 }
 async function save(){
  if(!form)return;
  if(demo){setError('Return to the saved school before approving any real evidence.');return;}
  const issue=validateLaunchEvidence(form);if(issue){setError(issue);return;}
  if(form.status==='Evidence reviewed'&&!form.attestedByOwner){setError('Only choose Reviewed after personally checking the source and the evidence.');return;}
  const ok=await saveMany([{...form,name:form.name||'School launch review'}]);
  if(ok){setForm(null);setError('');setResult('School evidence review saved. No student portal, uploads, FMCSA submissions or other integrations were activated.');}
  else setError('Review was not saved. Check any error shown on screen and try again.');
 }
 const oldAccepted=form?.reviewedAt!=null;
 return <section className="launch-review" aria-label="Owner school launch acceptance"><div className="launch-hero"><span className="launch-hero-icon"><LockKeyhole size={23}/></span><div><p className="eyebrow">OWNER ONLY · SCHOOL STARTUP</p><h2>What is left before we use this for real students?</h2><p>Track the actual checks required before school leadership approves protected student records. Start with made-up student information and keep personal files paused until the real security checks are signed off.</p></div></div>
 <div className="launch-summary"><span><strong>{report.reviewed}</strong><small>School evidence checks reviewed</small></span><span><strong>{report.remaining}</strong><small>Still need owner review</small></span><span><strong>{report.missingCampuses.length}</strong><small>Campus locations missing</small></span></div>
 <div className="launch-warning"><AlertCircle size={18}/><p><strong>Not approved for real student files yet.</strong> This review records what your team checked. It cannot replace state approval, a tested backup restore, consent rules, or owner authorization to enable private records.</p></div>
 {groups.map(group=>{
   const items=report.items.filter(item=>item.campusName===group);
   if(!items.length)return null;
   return <div className="launch-group" key={group}><h3>{group==='Whole school'?'Whole school — security and policies':group+' campus — school operations'}</h3>{items.map(item=><div className="launch-item" key={item.id}><span className={'launch-icon '+(item.reviewed?'reviewed':item.needsAttention?'followup':'unreviewed')}>{item.reviewed?<CheckCircle2 size={19}/>:item.needsAttention?<AlertCircle size={19}/>:<ClipboardCheck size={19}/>}</span><div><strong>{item.label}</strong><p>{item.explanation}</p><small>{item.reviewed?'Owner reviewed the evidence':item.needsAttention?'School follow-up needed':'Evidence not yet reviewed'}{item.record?.sourceCheckedOn?' · Source checked '+item.record.sourceCheckedOn:''}</small></div><button type="button" disabled={item.campusId===''} onClick={()=>edit(item)}>Review <ChevronRight size={15}/></button></div>)}</div>;
 })}
 {form&&<div className="launch-form"><h3>Record what you actually checked</h3><p className="muted">{launchAreas.find(a=>a.id===form.area)?.proof||'Use dated proof from the original source.'}</p><div className="formgrid"><label>Review status<select value={form.status} onChange={e=>setForm(v=>({...v!,status:e.target.value,attestedByOwner:false}))}><option>Not checked</option><option>Needs follow-up</option><option>Evidence reviewed</option></select></label><label>Date you checked the source<input type="date" value={form.sourceCheckedOn||''} onChange={e=>setForm(v=>({...v!,sourceCheckedOn:e.target.value}))}/></label></div><label>Where is the original proof?<textarea rows={2} maxLength={400} value={form.sourceReference||''} onChange={e=>setForm(v=>({...v!,sourceReference:e.target.value}))} placeholder="Named document, issuing authority, secure reference or signed test report. Never paste secrets."/></label>{['key-recovery','restore'].includes(form.area)&&<label>Second authorized custodian who witnessed the check<input type="text" maxLength={120} value={form.secondCustodian||''} onChange={e=>setForm(v=>({...v!,secondCustodian:e.target.value}))} placeholder="Witness name or authorized staff role"/></label>}<label>What is still needed?<textarea rows={3} maxLength={3500} value={form.notes||''} onChange={e=>setForm(v=>({...v!,notes:e.target.value}))} placeholder="Record open problems, next actions and who will handle them."/></label>{oldAccepted&&<label>Why is the earlier reviewed evidence changing?<textarea rows={2} maxLength={1500} value={form.correctionReason||''} onChange={e=>setForm(v=>({...v!,correctionReason:e.target.value}))}/></label>}{form.status==='Evidence reviewed'&&<label className="launch-attest"><input type="checkbox" checked={form.attestedByOwner===true} onChange={e=>setForm(v=>({...v!,attestedByOwner:e.target.checked}))}/> I personally checked the original source and understand this is only an internal school review, not government or security certification.</label>}<div className="reportactions"><button className="primary" type="button" disabled={busy} onClick={save}>{busy?'Saving…':'Save reviewed evidence'}</button><button type="button" onClick={()=>{setForm(null);setError('')}}>Cancel</button></div></div>}
 {error&&<p className="error" role="alert">{error}</p>}{result&&<p className="notice" role="status">{result}</p>}
 <p className="footnote">{report.notice}</p></section>;
}
