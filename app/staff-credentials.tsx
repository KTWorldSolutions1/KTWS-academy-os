'use client';
import {useState} from 'react';
import {AlertTriangle,ClipboardCheck,ShieldCheck} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {credentialTypes,credentialStatuses,staffCredentialStatus,campusStaffCredentialSnapshot,validateStaffCredential} from '../lib/staff-credentials';
type Props={records:R[];role:string;saveMany:(rows:R[])=>Promise<boolean>;busy:boolean;demo:boolean};
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
export default function StaffCredentials({records,role,saveMany,busy,demo}:Props){
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const [campusId,setCampusId]=useState(''),[staffId,setStaffId]=useState(''),[form,setForm]=useState<R|null>(null),[error,setError]=useState(''),[message,setMessage]=useState('');
 const campus=campuses.find(c=>c.id===campusId)||campuses[0];
 const employees=records.filter(r=>r.kind==='staff'&&r.campusIds?.includes(campus?.id)&&['Active','Pending credential'].includes(r.status));
 const employee=employees.find(e=>e.id===staffId)||employees[0];
 const saved=records.filter(r=>r.kind==='staff-credentials'&&r.campusId===campus?.id);
 const manager=['Owner','Campus manager'].includes(role);
 const snapshots=campuses.map(c=>({...campusStaffCredentialSnapshot(records,c.id,today()),name:c.name}));
 function open(type:string){
  if(!manager||!employee||!campus)return;
  setError('');setMessage('');
  const existing=records.find(r=>r.kind==='staff-credentials'&&r.staffId===employee.id&&r.campusId===campus.id&&r.credentialType===type);
  setForm(existing?{...existing}:{id:crypto.randomUUID(),kind:'staff-credentials',name:employee.name+' — '+type,status:'Pending',campusId:campus.id,staffId:employee.id,credentialType:type,sourceReference:'',reviewDate:'',expiresAt:'',nextCheck:'',notes:'',correctionReason:''});
 }
 function change(key:string,val:any){setForm(v=>v?{...v,[key]:val}:v);}
 async function save(){
  if(!form)return;
  setError('');setMessage('');
  if(demo){setError('Leave sample mode before saving actual school credential evidence.');return;}
  const problem=validateStaffCredential(form);if(problem){setError(problem);return;}
  const ok=await saveMany([form]);
  if(ok){setForm(null);setMessage('Internal credential review saved. School leadership must verify actual license/approval with its issuing authority.');}
  else setError('Could not save. Review credentials, campus ownership and any prior manager approval.');
 }
 return <div className="credential-screen">
 <section className="panel"><div className="sectionhead"><div><p className="eyebrow">STAFF TRAINING AUTHORITY</p><h2>Staff Licenses & Qualifications</h2><p className="muted">A single place to track instructor-license and qualification reviews, expiration dates and staff eligibility for the campus.</p></div><ShieldCheck size={25}/></div>
 <div className="credential-summary">{snapshots.map(s=><button key={s.campusId} type="button" className={campus?.id===s.campusId?'selected':''} onClick={()=>{setCampusId(s.campusId);setStaffId('');setForm(null);}}><b>{s.name}</b><strong>{s.staffCount}</strong><span>Employees • {s.pending} flagged • {s.expiring} expiring soon</span></button>)}</div>
 <div className="formgrid"><label>Campus<select value={campus?.id||''} onChange={e=>{setCampusId(e.target.value);setStaffId('');setForm(null);}}>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Employee<select value={employee?.id||''} onChange={e=>{setStaffId(e.target.value);setForm(null);}}>{!employees.length&&<option value="">No eligible campus employees</option>}{employees.map(e=><option key={e.id} value={e.id}>{e.name} · {e.accessRole||e.role||'Staff'}</option>)}</select></label></div>
 <p className="footnote">Only management can update credential reviews. Do not type SSNs, full driver license numbers, medical diagnoses or personal medical records into this form. Use the protected employee document system when approved; this checklist is not a document vault.</p></section>
 {employee&&<section className="panel"><h3>Review items for {employee.name}</h3><p className="muted">Choose the item to update. A checked source is an internal manager review, not certification by NCDMV, Texas DPS or FMCSA.</p><div className="credential-list">{credentialTypes.map(type=>{const item=saved.find(r=>r.staffId===employee.id&&r.credentialType===type),status=item?staffCredentialStatus(item,today()):'Not recorded';return <div className="credential-row" key={type}><span className={'credential-indicator '+(status==='Source reviewed'?'complete':['Blocked','Expired','Review overdue'].includes(status)?'attention':'pending')}>{status==='Source reviewed'?<ShieldCheck size={18}/>:['Blocked','Expired','Review overdue'].includes(status)?<AlertTriangle size={18}/>:<ClipboardCheck size={18}/>}</span><div><b>{type}</b><small>{status}{item?.expiresAt?' • Expires '+item.expiresAt:''}{item?.reviewedBy?' • Checked by manager':''}</small></div>{manager&&<button disabled={busy} onClick={()=>open(type)}>Review</button>}</div>;})}</div></section>}
 {form&&<section className="panel"><h3>{form.credentialType} — {employee?.name}</h3><p className="muted">Check the actual source before choosing Source reviewed. Expired or unverified items may prevent future instructor assignments.</p><div className="formgrid"><label>Internal status<select value={form.status} onChange={e=>change('status',e.target.value)}>{credentialStatuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Source reviewed date<input type="date" value={form.reviewDate||''} onChange={e=>change('reviewDate',e.target.value)}/></label><label>Expires<input type="date" value={form.expiresAt||''} onChange={e=>change('expiresAt',e.target.value)}/></label><label>Next review due<input type="date" value={form.nextCheck||''} onChange={e=>change('nextCheck',e.target.value)}/></label><label>Document or issuing agency reference<input maxLength={240} placeholder="No personal ID numbers or medical details" value={form.sourceReference||''} onChange={e=>change('sourceReference',e.target.value)}/></label></div>
 <label>Notes on evidence and next actions<textarea rows={3} maxLength={2500} value={form.notes||''} onChange={e=>change('notes',e.target.value)} placeholder="Do not include protected employee information."/></label>{form.reviewedBy&&<label>Reason for changing an earlier reviewed item<textarea rows={2} maxLength={2500} value={form.correctionReason||''} onChange={e=>change('correctionReason',e.target.value)}/></label>}
 <div className="reportactions"><button className="primary" disabled={busy} onClick={save}>Save credential review</button><button disabled={busy} onClick={()=>setForm(null)}>Cancel</button></div></section>}
 {error&&<p className="error" role="alert">{error}</p>}{message&&<p className="notice" role="status">{message}</p>}
 <p className="footnote">Never treat this school-maintained status as an official licensing certificate, permission to instruct, a DOT medical determination, or an FMCSA provider approval. Credential requirements must be confirmed per NC/TX jurisdiction before instructing.</p>
 </div>;
}
