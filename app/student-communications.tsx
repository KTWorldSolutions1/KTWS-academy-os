'use client';
import {useEffect,useMemo,useState} from 'react';
import {AtSign,BellRing,Check,CheckCircle2,FileText,LockKeyhole,Mail,MessageSquareText,Search,Send,ShieldCheck,Smartphone,UsersRound,UserRound} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {MESSAGE_TEMPLATES,expandMessageTemplate} from '../lib/student-messaging';
type Props={records:R[];role:string;demo:boolean;initialStudentId?:string;onStudent:(id:string)=>void;onNavigate?:(page:string)=>void;busy:boolean;saveMany:(records:R[])=>Promise<boolean>};
type Recipient={studentId:string;name:string;campusId?:string;maskedRecipient:string;status:string;reason:string};
export default function StudentCommunications({records,role,demo,initialStudentId,onStudent,onNavigate,busy,saveMany}:Props){
 const [selected,setSelected]=useState<string[]>(initialStudentId?[initialStudentId]:[]),[channel,setChannel]=useState<'Email'|'SMS'>('Email');
 const [campusId,setCampusId]=useState(''),[cohort,setCohort]=useState('All classes'),[query,setQuery]=useState('');
 const [body,setBody]=useState(''),[subject,setSubject]=useState(''),[template,setTemplate]=useState(''),[templateName,setTemplateName]=useState('');
 const [preview,setPreview]=useState<any>(null),[hash,setHash]=useState(''),[batchId,setBatchId]=useState(''),[result,setResult]=useState<any>(null);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[sending,setSending]=useState(false);
 const [consentStudent,setConsentStudent]=useState(''),[consentNote,setConsentNote]=useState(''),[consentEmail,setConsentEmail]=useState(false),[consentSms,setConsentSms]=useState(false);
 const canSend=['Owner','Regional admin','Campus manager','Enrollment specialist','Admin assistant'].includes(role);
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active'),campus=campuses.find(r=>r.id===campusId);
 const students=records.filter(r=>r.kind==='students'&&r.status!=='Withdrawn');
 const customTemplates=records.filter(r=>r.kind==='templates'&&r.templateType==='Student communication'&&r.status==='Active');
 const allTemplates=[...MESSAGE_TEMPLATES,...customTemplates.map(r=>({id:r.id,name:r.name,channel:r.templateChannel||'Email',subject:r.subject||'',body:r.body||''}))];
 const cohorts=[...new Set(students.filter(s=>!campus||s.campusId===campus.id).map(s=>String(s.cohort||'Unassigned')))].sort();
 const filtered=students.filter(s=>(!campus||s.campusId===campus.id)&&(cohort==='All classes'||String(s.cohort||'Unassigned')===cohort)&&[s.name,s.studentNumber,s.email,s.phone,s.cohort].some(v=>String(v||'').toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>a.name.localeCompare(b.name));
 const chosen=students.filter(s=>selected.includes(s.id));
 const currentConsent=students.find(s=>s.id===consentStudent)||chosen[0]||filtered[0];
 const selectedCampus=campuses.find(c=>c.id===currentConsent?.campusId);
 useEffect(()=>{if(initialStudentId){setSelected([initialStudentId]);setConsentStudent(initialStudentId);const matching=students.find(s=>s.id===initialStudentId);if(matching)setCampusId(matching.campusId);}},[initialStudentId]);
 useEffect(()=>{if(currentConsent){setConsentEmail(currentConsent.emailConsent===true);setConsentSms(currentConsent.smsConsent===true);setConsentNote(currentConsent.consentNote||'');}},[currentConsent?.id]);
 useEffect(()=>{setPreview(null);setHash('');setResult(null);},[selected.join(','),body,subject,channel]);
 const canCheckAll=filtered.every(s=>selected.includes(s.id));
 function pickTemplate(id:string){const t=allTemplates.find(x=>x.id===id);if(!t)return;setChannel(t.channel as 'Email'|'SMS');setSubject(t.subject);setBody(t.body);setTemplate(id);}
 async function saveTemplate(){
  setError('');setNotice('');
  if(demo)return setError('Exit demonstration mode before saving school templates.');
  if(role!=='Owner')return setError('Only the school owner can publish shared messaging templates.');
  const name=templateName.trim();
  if(name.length<3||name.length>100||!body.trim()||(channel==='Email'&&!subject.trim()))return setError('Enter a template name (3–100 characters), subject for email, and message body.');
  if(channel==='SMS'&&body.length>480)return setError('Limit saved text message templates to 480 characters.');
  const existing=customTemplates.find(t=>t.id===template);
  const record:R={...(existing||{}),id:existing?.id||crypto.randomUUID(),kind:'templates',templateType:'Student communication',
   name,status:'Active',templateChannel:channel,subject:channel==='Email'?subject:'',body,createdAt:existing?.createdAt||new Date().toISOString()};
  if(await saveMany([record])){setTemplate(record.id);setNotice('Reusable '+channel+' message template saved for this school. No message was sent.');}
  else setError('Template was not saved. Review the school error.');
 }
 function selectAll(){setSelected(prev=>canCheckAll?prev.filter(id=>!filtered.some(s=>s.id===id)):[...new Set([...prev,...filtered.map(s=>s.id)])].slice(0,25));}
 async function saveConsent(){
  if(!currentConsent)return;
  setError('');setNotice('');
  if(consentSms&&!currentConsent.smsConsent&&consentNote.trim().length<12){setError('Record how the student affirmatively consented to texts (minimum 12 characters).');return;}
  if(consentEmail&&!currentConsent.emailConsent&&consentNote.trim().length<12){setError('Record how the student consented to email updates.');return;}
  const updated:R={...currentConsent,emailConsent:consentEmail,smsConsent:consentSms,
   smsOptOut:currentConsent.smsOptOut===true,
   emailOptOut:currentConsent.emailOptOut===true,
   consentRecordedAt:consentSms||consentEmail?new Date().toISOString():currentConsent.consentRecordedAt,
   consentNote:consentNote.trim(),consentSource:consentNote.trim().slice(0,250)};
  if(await saveMany([updated]))setNotice('Contact preferences saved in the authorized student record. Consent does not automatically send a message.');
  else setError('Could not save the communication preference.');
 }
 async function runPreview(){
  setError('');setNotice('');setResult(null);
  if(!chosen.length)return setError('Select at least one student.');
  if(chosen.length>25)return setError('Send at most 25 students in a controlled batch.');
  if(demo){
   const byCampus=new Map(campuses.map(c=>[c.id,c]));
   const rows=chosen.map(s=>{const permitted=channel==='Email'?s.emailConsent===true&&!s.emailOptOut&&!!s.email:s.smsConsent===true&&!s.smsOptOut&&!!s.phone;
    return {studentId:s.id,name:s.name,campusId:s.campusId,status:permitted?'Ready':'Excluded',
     maskedRecipient:channel==='Email'?s.email?.slice(0,2)+'***':s.phone?.slice(0,3)+'***',
     reason:permitted?'Demonstration of authorized recipient.':'Consent or contact detail missing; excluded.',
     message:permitted?expandMessageTemplate(body,s,byCampus.get(s.campusId)):null};});
   setPreview({selected:rows.length,eligible:rows.filter(x=>x.status==='Ready').length,excluded:rows.filter(x=>x.status!=='Ready').length,recipients:rows,warning:'SAMPLE ONLY — no provider call and no message delivery.'});
   setHash('sample');return;
  }
  const id=crypto.randomUUID();setBatchId(id);setSending(true);
  try{
   const res=await fetch('/api/communications/batch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'preview',batchId:id,studentIds:selected,channel,subject,body})});
   const json=await res.json();if(!res.ok)throw Error(json.error||'Message preview unavailable.');
   setPreview(json);setHash(json.previewHash);
  }catch(e:any){setError(e.message);}finally{setSending(false);}
 }
 async function deliver(){
  if(!preview||!hash||!preview.eligible)return;
  if(demo){setResult({accepted:0,selected:chosen.length,results:chosen.map(s=>({name:s.name,status:'Sample preview only — NOT SENT'}))});return;}
  if(!window.confirm('Send '+preview.eligible+' eligible '+channel+' message(s)? Student contact consent and campus permissions will be checked again. Accepted is NOT delivered.'))return;
  setError('');setSending(true);
  try{
   const res=await fetch('/api/communications/batch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'send',batchId,previewHash:hash,studentIds:selected,channel,subject,body,confirmSend:true})});
   const json=await res.json();if(!res.ok)throw Error(json.error||'Cannot confirm provider send.');
   setResult(json);setPreview(null);setHash('');setNotice('Batch recorded. Review each provider status; do not retry any unknown delivery outcome.');
  }catch(e:any){setError(e.message);}finally{setSending(false);}
 }
 const availability=chosen.length?chosen.map(s=>s.campusId).filter((x,i,a)=>a.indexOf(x)===i).length:0;
 if(!canSend)return <div className="panel"><LockKeyhole/> Student communications are available to authorized enrollment and administrative roles only.</div>;
 return <div className="student-outreach">
  <section className="panel outreach-command"><div className="sectionhead"><div><p className="eyebrow">STUDENT RELATIONSHIP CENTER • VERIFIED OPT-IN</p><h2><MessageSquareText size={23}/> Email & text students from Academy OS</h2><p className="muted">Select a student or permitted cohort, choose an approved message, verify consent and preview every recipient. Student personal information and document attachments are never auto-inserted into messages.</p></div><ShieldCheck size={28}/></div>
   <div className="formgrid"><label>Campus<select value={campus?.id||''} onChange={e=>{setCampusId(e.target.value);setCohort('All classes');setSelected([]);}}><option value="">All campuses</option>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>Class group<select value={cohort} onChange={e=>setCohort(e.target.value)}><option>All classes</option>{cohorts.map(c=><option key={c}>{c}</option>)}</select></label></div>
   <label className="outreach-search"><Search size={17}/><input value={query} placeholder="Search students, student IDs, emails or phone numbers" onChange={e=>setQuery(e.target.value)} aria-label="Search students for outreach"/></label>
   <div className="outreach-roster-head"><b><UsersRound size={16}/> {filtered.length} student(s) at this location</b><button onClick={selectAll} disabled={!filtered.length}> {canCheckAll?'Clear displayed students':'Select displayed students (up to 25)'}</button></div>
   <div className="outreach-rows">{filtered.length===0&&<p className="notice">No student profiles match this campus, class and search. Choose All campuses and All classes, or clear the search. Existing student records have not been removed.</p>}{filtered.map(s=><label key={s.id} className="outreach-row">
    <input type="checkbox" checked={selected.includes(s.id)} onChange={e=>setSelected(prev=>e.target.checked?[...prev,s.id].slice(0,25):prev.filter(id=>id!==s.id))}/>
    <div><b>{s.name}</b><small>{s.cohort||s.program||'CDL'} · {s.status}</small></div>
    <div className="outreach-consent"><span className={s.emailConsent&&!s.emailOptOut?'good':'muted'}><Mail size={13}/> Email {s.emailConsent&&!s.emailOptOut?'opted in':'not approved'}</span>
     <span className={s.smsConsent&&!s.smsOptOut?'good':'muted'}><Smartphone size={13}/> Text {s.smsConsent&&!s.smsOptOut?'opted in':'not approved'}</span></div>
    <button type="button" onClick={e=>{e.preventDefault();e.stopPropagation();onStudent(s.id);}} title="Open student profile"><UserRound size={16}/> Profile</button>
   </label>)}</div>
   <div className="outreach-selection"><b>{chosen.length}</b> selected · {availability} campus(es) · Maximum 25 recipients per batch</div>
  </section>
  <section className="panel outreach-compose"><div className="sectionhead"><div><p className="eyebrow">WRITE • REVIEW • SEND</p><h2>Message composer</h2></div><Send size={24}/></div>
   <div className="formgrid"><label>Contact method<select value={channel} onChange={e=>setChannel(e.target.value as 'Email'|'SMS')}><option>Email</option><option>SMS</option></select></label>
   <label>Approved wording templates<select value={template} onChange={e=>pickTemplate(e.target.value)}><option value="">Start blank</option>{allTemplates.map(t=><option key={t.id} value={t.id}>{t.name} · {t.channel}</option>)}</select></label></div>
   {channel==='Email'&&<label>Email subject<input maxLength={180} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Important Lone Star update"/></label>}
   <label>Message<textarea value={body} maxLength={channel==='SMS'?480:2500} rows={7} onChange={e=>setBody(e.target.value)} placeholder="Hi {{firstName}}, …"/></label>
   {role==='Owner'&&<div className="formgrid"><label>Custom message template name<input value={templateName} maxLength={100} onChange={e=>setTemplateName(e.target.value)} placeholder="e.g. Permit test reminder"/></label><button type="button" disabled={busy||!templateName.trim()||!body.trim()||(channel==='Email'&&!subject.trim())} onClick={()=>void saveTemplate()}><FileText size={16}/> Save reusable template (no sending)</button></div>}
   {onNavigate&&['Owner','Regional admin'].includes(role)&&<p className="muted">To connect delivery, open <button type="button" onClick={()=>onNavigate('integrations')}>Settings &amp; Connections → Integrations</button> and review Twilio for SMS and Resend for email. Provider credentials are configured securely by school administration, not entered in this message editor.</p>}
   <p className="footnote">Use only <code>{'{{firstName}}'}</code>, <code>{'{{studentName}}'}</code> and <code>{'{{campusName}}'}</code> placeholders. Never include SSNs, driver license numbers, medical details, assessment problems or funding eligibility in a mass message. SMS permitted only during Monday–Saturday 9 a.m.–6 p.m. in campus time, with recorded affirmative consent.</p>
   <div className="reportactions"><button className="primary" disabled={sending||busy||!selected.length||!body.trim()||(channel==='Email'&&!subject.trim())} onClick={runPreview}><FileText size={17}/> Preview recipients first</button>
    {preview&&<button disabled={sending||!preview.eligible} onClick={deliver}><Send size={17}/> {demo?'Simulate button — no sending':'Confirm & send '+preview.eligible+' eligible'}</button>}</div>
   {preview&&<div className="outreach-preview"><h3>{preview.eligible} eligible · {preview.excluded} excluded</h3>{preview.recipients?.map((r:Recipient)=><div key={r.studentId} className="vault-doc-row"><div><b>{r.name}</b><small>{r.maskedRecipient} • {r.reason}</small></div><span className={'badge '+(r.status==='Ready'?'good':'warn')}>{r.status}</span></div>)}<p className="footnote">{preview.warning}</p></div>}
   {result&&<div className="outreach-preview"><h3>Send attempt results</h3><p className="notice">{result.accepted} provider-accepted, {result.unknown||0} outcome unknown; acceptance is not delivery.</p>{result.results?.map((r:any)=><div key={r.studentId} className="vault-doc-row"><b>{r.name}</b><span className="badge">{r.status}</span></div>)}</div>}
   {error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="notice" role="status">{notice}</p>}
  </section>
  <section className="panel"><div className="sectionhead"><div><p className="eyebrow">CONSENT • DELIVERY AUTHORIZATION</p><h2>Manage student contact preferences</h2><p className="muted">School staff must have evidence of student permission before sending email or SMS. Updating this record never sends a message.</p></div><BellRing size={24}/></div>
   <label>Student<select value={currentConsent?.id||''} onChange={e=>setConsentStudent(e.target.value)}>{students.map(s=><option key={s.id} value={s.id}>{s.name} · {records.find(c=>c.id===s.campusId)?.name||'Campus'}</option>)}</select></label>
   {currentConsent&&<><div className="formgrid"><label className="checkboxlabel"><input type="checkbox" checked={consentEmail} onChange={e=>setConsentEmail(e.target.checked)}/> Student expressly approved school email updates</label>
    <label className="checkboxlabel"><input type="checkbox" checked={consentSms} onChange={e=>setConsentSms(e.target.checked)}/> Student expressly approved school text messages</label></div>
    <label>When and how consent was obtained<textarea rows={3} maxLength={350} value={consentNote} onChange={e=>setConsentNote(e.target.value)} placeholder="e.g., signed admissions communication authorization on 11/10/2026; document reviewed by enrollment."/></label>
    <button className="primary" disabled={busy||demo} onClick={saveConsent}><Check size={15}/> Save documented consent</button>
    {demo&&<p className="notice">Consent settings are read-only in the fictitious showcase to avoid presenting an invented opt-in as genuine.</p>}
    <p className="footnote">Opt-outs and STOP requests must be honored. Never manufacture consent, and do not re-enable an opt-out without fresh documented permission. Student mobile numbers must use E.164 (+1...) for provider SMS.</p></>}
  </section></div>;
}
