'use client';
import {useState} from 'react';
import type {RecordData as R} from '../lib/training';
import {instructionHours,today} from '../lib/training';
import {invoiceIssue,invoicePrintable,BILLABLE_FUNDERS} from '../lib/funding-invoices';
import {FileText,Printer,ShieldCheck,Plus} from 'lucide-react';
type Props={records:R[];role:string;busy:boolean;demo:boolean;saveMany:(rows:R[])=>Promise<boolean>};
function addDays(start:string,n:number){const d=new Date(start+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export default function FundingInvoices({records,role,busy,demo,saveMany}:Props){
 const [campusId,setCampusId]=useState(''),[selected,setSelected]=useState(''),[draft,setDraft]=useState<R|null>(null),[feedback,setFeedback]=useState('');
 const campuses=records.filter(x=>x.kind==='campuses'&&x.status==='Active');
 const campus=campuses.find(x=>x.id===campusId)||campuses[0];
 const students=records.filter(x=>x.kind==='students'&&x.campusId===campus?.id&&!['Withdrawn'].includes(x.status));
 const student=students.find(x=>x.id===selected)||students[0];
 const invoices=records.filter(x=>x.kind==='funding-invoices'&&x.campusId===campus?.id);
 const manager=['Owner','Regional admin','Campus manager'].includes(role);
 function create(){
  if(!student)return;
  const date=today();
  setDraft({id:crypto.randomUUID(),kind:'funding-invoices',campusId:student.campusId,studentId:student.id,
   name:'Training invoice • '+student.name,status:'Draft',invoiceNumber:'LS-'+date.replaceAll('-','')+'-'+crypto.randomUUID().slice(0,6).toUpperCase(),
   issueDate:date,dueDate:addDays(date,30),fundingType:BILLABLE_FUNDERS.includes(student.fundingType)?student.fundingType:'WIOA',
   funder:student.fundingAgency||'',billingContact:'',amount:Number(student.approvedFundingAmount||student.tuition||0),
   description:'Class A CDL training tuition',authorizationRef:student.fundingAuthorizationRef||'',
   authorizationVerified:false,notes:'Pricing is subject to the actual case manager approval and school enrollment terms.'});
  setFeedback('');
 }
 async function persist(){
  if(!draft)return;
  const problem=invoiceIssue(draft,records);if(problem){setFeedback(problem);return;}
  if(!manager&&draft.status!=='Draft'){setFeedback('Only management can approve or mark invoices manually issued.');return;}
  if(await saveMany([draft])){setFeedback(demo?'Fictional invoice saved in sample mode. Not sent.':'Invoice saved in school records. No billing email or payment was sent.');setDraft(null);}
  else setFeedback('Invoice could not be saved; check the workspace message.');
 }
 function print(row:R){
  const s=records.find(x=>x.kind==='students'&&x.id===row.studentId),camp=campuses.find(x=>x.id===row.campusId);
  if(!s||!camp)return;
  const cls=records.find(x=>x.kind==='classes'&&x.id===s.classId);
  const html=invoicePrintable(row,s,camp,cls,{classroom:instructionHours(s,'Classroom'),yard:instructionHours(s,'Yard'),road:instructionHours(s,'Road')});
  const win=window.open('','_blank');if(!win){setFeedback('Allow print pop-ups, then use Print/Save as PDF.');return;}
  win.document.write(html);win.document.close();
 }
 return <section className="panel funding-invoice-center"><div className="sectionhead"><div><p className="eyebrow">FUNDING • AGENCY RECEIVABLES</p><h2>Generate WIOA & external funding invoices</h2><p className="muted">Create an invoice for a specific student, selected campus and verified agency authorization. Save as a school record and print/save a PDF to deliver by the approved secure billing channel.</p></div><FileText size={26}/></div>
 <div className="formgrid"><label>Campus<select value={campus?.id||''} onChange={e=>{setCampusId(e.target.value);setSelected('');}}>{campuses.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Student<select value={student?.id||''} onChange={e=>setSelected(e.target.value)}>{!students.length&&<option value="">No enrolled students</option>}{students.map(s=><option value={s.id} key={s.id}>{s.name} · {s.fundingType||'Funding unknown'}</option>)}</select></label></div>
 <button className="primary" disabled={busy||!student} onClick={create}><Plus size={18}/> Create student funding invoice</button>
 <p className="footnote">Do not treat funding as guaranteed. Amounts and authorization numbers must match a real case manager approval before management approval. Issued status means staff confirms delivery outside this app; it is not an electronic receipt or payment verification.</p>
 {draft&&<div className="vault-upload"><h3>{draft.name} — {draft.status}</h3>
 <div className="formgrid"><label>Invoice number<input value={draft.invoiceNumber||''} onChange={e=>setDraft({...draft,invoiceNumber:e.target.value})}/></label>
 <label>Funding type<select value={draft.fundingType} onChange={e=>setDraft({...draft,fundingType:e.target.value})}>{BILLABLE_FUNDERS.map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Funding agency / billed organization<input value={draft.funder||''} onChange={e=>setDraft({...draft,funder:e.target.value})}/></label>
 <label>Agency billing contact or reference<input value={draft.billingContact||''} onChange={e=>setDraft({...draft,billingContact:e.target.value})}/></label>
 <label>Authorized tuition amount ($)<input type="number" min="0" step="0.01" value={draft.amount??''} onChange={e=>setDraft({...draft,amount:Number(e.target.value)})}/></label>
 <label>Training/service description<input value={draft.description||''} onChange={e=>setDraft({...draft,description:e.target.value})}/></label>
 <label>Invoice date<input type="date" value={draft.issueDate||''} onChange={e=>setDraft({...draft,issueDate:e.target.value})}/></label>
 <label>Due date<input type="date" value={draft.dueDate||''} onChange={e=>setDraft({...draft,dueDate:e.target.value})}/></label>
 <label>Funding authorization number<input value={draft.authorizationRef||''} onChange={e=>setDraft({...draft,authorizationRef:e.target.value})}/></label>
 <label>Status<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option>Draft</option>{manager&&<><option>Approved</option><option>Issued — manually confirmed</option><option>Void</option></>}</select></label></div>
 {manager&&<label className="checkboxlabel"><input type="checkbox" checked={!!draft.authorizationVerified} onChange={e=>setDraft({...draft,authorizationVerified:e.target.checked})}/> I reviewed the school's actual written funding authorization for this student, agency and amount.</label>}
 <div className="reportactions"><button className="primary" disabled={busy} onClick={persist}><ShieldCheck size={16}/> Save invoice record</button><button onClick={()=>print(draft)}><Printer size={16}/> Preview / print draft</button><button onClick={()=>setDraft(null)}>Close</button></div></div>}
 {feedback&&<p className="notice" role="status">{feedback}</p>}
 <h3>Invoices at this campus</h3>{invoices.length===0&&<p className="muted">No school funding invoices saved.</p>}
 {invoices.map(x=><div className="vault-doc-row" key={x.id}><div><b>{x.invoiceNumber} · {x.funder||'Funder pending'} · {Number(x.amount||0).toLocaleString('en-US',{style:'currency',currency:'USD'})}</b><small>{records.find(s=>s.id===x.studentId)?.name} · {x.status} · {x.issueDate}</small></div><div><button onClick={()=>print(x)}><Printer size={16}/> Print</button>{x.status==='Draft'&&<button onClick={()=>setDraft({...x})}>Edit</button>}</div></div>)}
 </section>;
}
