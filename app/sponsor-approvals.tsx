'use client';
import {useState} from 'react';
import {FileCheck2,ShieldCheck} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {fundingStages,fundingEvidence,sponsorProgressPacket} from '../lib/sponsor-funding';
import {validateSponsorship} from '../lib/sponsor-funding';
type Props={records:R[];role:string;saveMany:(r:R[])=>Promise<boolean>;busy:boolean;demo:boolean};
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
const monthStart=()=>today().slice(0,7)+'-01';
const money=(value:any)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(value)||0);
export default function SponsorApprovals({records,role,saveMany,busy,demo}:Props){
 const manager=['Owner','Campus manager'].includes(role);
 const students=records.filter(x=>x.kind==='students'&&x.status!=='Withdrawn');
 const agencies=records.filter(x=>['funding','partners'].includes(x.kind)&&x.status!=='Inactive');
 const awards=records.filter(x=>x.kind==='sponsorships');
 const [studentId,setStudentId]=useState(''),[editing,setEditing]=useState<R|null>(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[from,setFrom]=useState(monthStart()),[to,setTo]=useState(today()),[reviewerCheck,setReviewerCheck]=useState(false);
 const selected=students.find(x=>x.id===studentId)||students[0];
 const matchingAgencies=agencies.filter(a=>a.campusId===selected?.campusId);
 const studentDocs=(s:R|undefined)=>(s?.documents||[]).filter((d:any)=>d.category==='Funding authorization'&&d.verified===true&&d.key);
 const newAward=()=>{
  if(!selected||!matchingAgencies.length){setError('Select a student and add a funding agency or employer in the same campus.');return;}
  setError('');setMessage('');setEditing({id:crypto.randomUUID(),kind:'sponsorships',name:'Training funding for '+selected.name,status:'Draft',studentId:selected.id,campusId:selected.campusId,agencyId:matchingAgencies[0].id,authorizedAmount:0,requestDate:today(),approvalDate:'',expiresAt:'',startDate:'',endDate:'',authorizationNumber:'',authorizationDocumentKey:'',notes:''});
 };
 const patch=(key:string,val:any)=>setEditing(v=>v?{...v,[key]:val}:v);
 async function save(){
  if(!editing)return;
  setError('');setMessage('');
  if(demo){setError('Leave practice mode to save an actual sponsor record.');return;}
  const problem=validateSponsorship(editing);if(problem){setError(problem);return;}
  const ok=await saveMany([editing]);
  if(ok){setEditing(null);setMessage('Funding record saved. It is not proof that funds were received, reimbursed or paid.');setReviewerCheck(false);}
  else setError('Could not save. Review the campus, evidence, status or a possible duplicate request.');
 }
 const agencyById=(id:string)=>agencies.find(a=>a.id===id);
 const currentAwards=awards.filter(x=>!selected||x.studentId===selected.id);
 const [report,setReport]=useState<{text:string;allowed:boolean}|null>(null);
 function preview(r:R){
  setError('');setMessage('');setReport(null);setReviewerCheck(false);
  if(!manager){setError('Management must review and approve any funding report shared outside the school.');return;}
  const student=students.find(s=>s.id===r.studentId);if(!student){setError('The student record is unavailable.');return;}
  if(fundingEvidence(r,student,today()).verified!==true){setError('Verify the sponsor authorization and attached official approval first.');return;}
  try{const packet=sponsorProgressPacket(student,r,agencyById(r.agencyId),from,to,today());setReport({text:packet.text,allowed:true});}
  catch(e:any){setError(e.message||'Choose valid reporting dates.');}
 }
 function download(){if(!report||!reviewerCheck)return;const url=URL.createObjectURL(new Blob([report.text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Lone-Star-Internal-Sponsor-Review.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <div><section className="panel"><div className="sectionhead"><div><p className="eyebrow">SPONSORSHIPS AND WIOA</p><h2>Funding Approvals</h2><p className="muted">Track written approvals from agencies or employers. Requests are not authorized money, and authorized money is not a recorded payment.</p></div><ShieldCheck size={25}/></div>
 <div className="formgrid"><label>Student<select value={selected?.id||''} onChange={e=>{setStudentId(e.target.value);setEditing(null);setReport(null);}}>{!students.length&&<option value="">No students available</option>}{students.map(s=><option key={s.id} value={s.id}>{s.name} — {records.find(c=>c.id===s.campusId)?.name||'Campus'}</option>)}</select></label></div>
 <button className="primary" onClick={newAward} disabled={busy||!selected}>Add funding request</button>
 {error&&<p className="error" role="alert">{error}</p>}{message&&<p className="notice" role="status">{message}</p>}</section>
 {editing&&<section className="panel"><h3>{editing.revision?'Edit funding request':'New funding request'}</h3><p className="muted">Funding approval requires a verified, original signed or official agency authorization in the student's protected files.</p><div className="formgrid">
  <label>Student<select disabled={!!editing.revision} value={editing.studentId} onChange={e=>{const s=students.find(x=>x.id===e.target.value);if(s)setEditing(old=>({...old!,studentId:s.id,campusId:s.campusId,agencyId:'',authorizationDocumentKey:''}));}}>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
  <label>Funding agency or employer<select value={editing.agencyId} onChange={e=>patch('agencyId',e.target.value)}><option value="">Select an agency</option>{agencies.filter(a=>a.campusId===editing.campusId).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
  <label>Approval status<select value={editing.status} onChange={e=>patch('status',e.target.value)}>{fundingStages.filter(x=>manager||x!=='Authorized').map(x=><option key={x}>{x}</option>)}</select></label>
  <label>Authorized limit (USD)<input type="number" step="0.01" min="0" max="1000000" value={editing.authorizedAmount??0} onChange={e=>patch('authorizedAmount',Number(e.target.value))}/></label>
  <label>Requested date<input type="date" value={editing.requestDate||''} onChange={e=>patch('requestDate',e.target.value)}/></label>
  <label>Written approval date<input type="date" value={editing.approvalDate||''} onChange={e=>patch('approvalDate',e.target.value)}/></label>
  <label>Approval expiration<input type="date" value={editing.expiresAt||''} onChange={e=>patch('expiresAt',e.target.value)}/></label>
  <label>Training starts<input type="date" value={editing.startDate||''} onChange={e=>patch('startDate',e.target.value)}/></label>
  <label>Training ends<input type="date" value={editing.endDate||''} onChange={e=>patch('endDate',e.target.value)}/></label>
  <label>Agency approval reference<input maxLength={160} value={editing.authorizationNumber||''} onChange={e=>patch('authorizationNumber',e.target.value)} placeholder="From the official approval"/></label>
  <label>Verified agency document<select disabled={!manager} value={editing.authorizationDocumentKey||''} onChange={e=>patch('authorizationDocumentKey',e.target.value)}><option value="">No verified authorization attached</option>{studentDocs(students.find(s=>s.id===editing.studentId)).map((d:any)=><option key={d.key} value={d.key}>{d.name}</option>)}</select></label>
 </div><label>Review notes<textarea rows={3} value={editing.notes||''} onChange={e=>patch('notes',e.target.value)} maxLength={4000}/></label>{editing.revision&&editing.reviewedBy&&<p className="muted">Originally reviewed by {editing.reviewedBy}. Material corrections to approved funding require an explanation.</p>}{editing.revision&&<label>Reason for correction (if changing an approved record)<textarea rows={2} maxLength={4000} value={editing.correctionReason||''} onChange={e=>patch('correctionReason',e.target.value)} placeholder="Explain the approved source and correction."/></label>}
 <div className="reportactions"><button className="primary" onClick={save} disabled={busy}>Save funding record</button><button onClick={()=>setEditing(null)}>Cancel</button></div></section>}
 <section className="panel"><h3>Student funding history</h3>{currentAwards.map(r=>{const student=students.find(s=>s.id===r.studentId),status=student?fundingEvidence(r,student,today()).status:'Student unavailable';return <div className="reportrow" key={r.id}><div><b>{agencyById(r.agencyId)?.name||'Agency not available'} — {money(r.authorizedAmount)}</b><small>{r.status} · {status}{r.expiresAt?' · Expires '+r.expiresAt:''} · {records.find(c=>c.id===r.campusId)?.name||'Campus'}</small><small>{r.authorizationNumber?'Approval reference recorded':''}{r.reviewedBy?' · Manager reviewed':''}</small></div><div className="reportactions"><button disabled={busy} onClick={()=>{setEditing({...r});setReport(null);}}>Review</button>{manager&&<button onClick={()=>preview(r)}>Progress draft</button>}</div></div>;})}{!currentAwards.length&&<p className="muted">No written funding requests recorded for this student.</p>}</section>
 {manager&&<section className="panel"><div className="sectionhead"><div><h3>Internal agency progress packet</h3><p className="muted">Use a verified approval above to prepare an internal draft with attendance and actual training hours. No file is sent to any external agency.</p></div><FileCheck2 size={22}/></div><div className="formgrid"><label>From<input type="date" value={from} onChange={e=>{setFrom(e.target.value);setReport(null);setReviewerCheck(false);}}/></label><label>Through<input type="date" value={to} onChange={e=>{setTo(e.target.value);setReport(null);setReviewerCheck(false);}}/></label></div>{report&&<><label>Review the exact text<textarea readOnly rows={22} value={report.text}/></label><label><input type="checkbox" checked={reviewerCheck} onChange={e=>setReviewerCheck(e.target.checked)}/> I reviewed the source records and the school-approved authorization. Any external disclosure requires its own consent and recipient verification.</label><button disabled={!reviewerCheck} onClick={download}>Save internal review draft</button></>}<p className="footnote">Even a saved internal packet is not an invoice or WIOA billing claim. Confirm agency-specific reporting, student consent/release, training hours, and reimbursement conditions separately.</p></section>}
 </div>;
}
