'use client';
import {useEffect,useMemo,useState} from 'react';
import {AlertTriangle,CheckCircle2,FileLock2,FileText,LockKeyhole,ShieldCheck,Upload} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {latestEvidence} from '../lib/student-documents';
type Props={records:R[];role:string;demo:boolean;busy:boolean;saveMany:(updates:R[])=>Promise<boolean>};
type Assignment={key:string;studentId:string;source:'filename'|'manual'|'unmatched';error?:string};
function normalize(text:string){return String(text||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function suggestStudent(file:File,students:R[]){
 const stem=normalize(file.name.replace(/\.(pdf|png|jpe?g)$/i,''));
 const matches=students.filter(s=>{
  const name=normalize(s.name),nameReversed=normalize(s.name.split(/\s+/).reverse().join(''));
  const id=s.studentNumber?normalize(String(s.studentNumber)):'';
  return name.length>=6&&(stem.includes(name)||stem.includes(nameReversed))||id.length>=5&&stem.includes(id);
 });
 return matches.length===1?matches[0].id:'';
}
function docType(file:File){return ['application/pdf','image/png','image/jpeg'].includes(file.type)||(file.type===''&&/\.(pdf|png|jpe?g)$/i.test(file.name));}
function fileKey(file:File,i:number){return String(i)+'|'+file.name+'|'+file.size;}
export default function CohortAgreementIntake({records,role,demo,busy,saveMany}:Props){
 const [campusId,setCampusId]=useState(''),[classId,setClassId]=useState(''),[files,setFiles]=useState<File[]>([]),
  [assigned,setAssigned]=useState<Record<string,Assignment>>({}),[accept,setAccept]=useState(false),[uploading,setUploading]=useState(false),
  [progress,setProgress]=useState({done:0,total:0}),[errors,setErrors]=useState<string[]>([]),[notice,setNotice]=useState('');
 const canManage=['Owner','Regional admin','Campus manager'].includes(role);
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const campus=campuses.find(r=>r.id===campusId)||campuses.find(r=>/greensboro/i.test(r.name))||campuses[0];
 const classes=records.filter(r=>r.kind==='classes'&&r.campusId===campus?.id).sort((a,b)=>String(b.startDate||'').localeCompare(String(a.startDate||'')));
 const klass=classes.find(r=>r.id===classId)||classes[0];
 const students=records.filter(r=>r.kind==='students'&&r.campusId===campus?.id&&r.classId===klass?.id).sort((a,b)=>a.name.localeCompare(b.name));
 const tasks=useMemo(()=>files.map((file,i)=>{
  const key=fileKey(file,i),state=assigned[key],guess=state?state.studentId:suggestStudent(file,students);
  const status=state?.source||(!guess?'unmatched':'filename');
  return {file,key,i,studentId:guess,status};
 }),[files,assigned,students]);
 const duplicateIds=tasks.map(t=>t.studentId).filter((s,i,arr)=>s&&arr.indexOf(s)!==i);
 const invalid=tasks.filter(t=>!t.studentId||!docType(t.file)||t.file.size===0||t.file.size>10_000_000||duplicateIds.includes(t.studentId));
 const awaiting=students.filter(s=>!latestEvidence(s,'Enrollment agreement')?.verified);
 const ready=canManage&&!demo&&!!klass&&tasks.length>0&&!invalid.length&&accept&&!busy&&!uploading;
 function handleFiles(event:React.ChangeEvent<HTMLInputElement>){
  const chosen=Array.from(event.target.files||[]);
  setFiles(chosen.slice(0,40));setAssigned({});setErrors([]);setNotice('');setAccept(false);setProgress({done:0,total:chosen.length});event.target.value='';
 }
 async function submit(){
  if(!ready)return;
  setUploading(true);setErrors([]);setNotice('');setProgress({done:0,total:tasks.length});
  let passed=0;const failure:string[]=[];
  // Deliberately sequential: attachment integrity and human matching matter more
  // than throughput. A failure never marks a contract as reviewed.
  for(const task of tasks){
   try{
    const body=new FormData();body.set('studentId',task.studentId);body.set('category','Enrollment agreement');body.set('file',task.file);
    const res=await fetch('/api/files',{method:'POST',body}),payload=await res.json();
    if(!res.ok||payload.encrypted!==true||payload.attachedToStudent!==true)throw Error(payload.error||'Private storage did not confirm the attachment.');
    passed++;
   }catch(e:any){failure.push(task.file.name+': '+(e.message||'Upload failed'));break;}
   finally{setProgress({done:passed,total:tasks.length});}
  }
  setUploading(false);setErrors(failure);
  if(passed){
   // No optimistic document writes. The server attached the encrypted file
   // and the school must verify its signature and student match separately.
   await saveMany([]);
   setFiles([]);setAssigned({});setAccept(false);
   setNotice(passed+' signed agreement file(s) securely stored in the selected student records, awaiting authorized review. No contract has been marked verified.');
  }
 }
 if(!canManage)return <section className="panel"><LockKeyhole/> Enrollment agreements are accessible only to authorized campus management.</section>;
 return <div className="cohort-agreement-intake">
  <section className="panel"><div className="sectionhead"><div><p className="eyebrow">PRIVATE DOCUMENT VAULT • SIGNED CONTRACTS</p><h2><FileLock2 size={25}/> Cohort Agreement Intake</h2>
   <p className="muted">Upload each actual signed agreement to exactly one student. School files are encrypted before they enter private R2 storage, are not placed in GitHub, and stay unverified until a manager opens the original and approves it.</p></div><ShieldCheck size={27}/></div>
   {demo&&<p className="error">Real enrollment agreements cannot be uploaded while using the synthetic 100-student test dataset. Return to saved records first.</p>}
   <div className="formgrid"><label>Campus<select value={campus?.id||''} onChange={e=>{setCampusId(e.target.value);setClassId('');setFiles([]);}}>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>Class<select value={klass?.id||''} onChange={e=>{setClassId(e.target.value);setFiles([]);}}>{classes.map(c=><option key={c.id} value={c.id}>{c.name} • {c.startDate}</option>)}</select></label></div>
   <div className="curriculum-metrics"><div><strong>{students.length}</strong><small>Students in this cohort</small></div><div><strong>{awaiting.length}</strong><small>Need signed agreement review</small></div><div><strong>{students.length-awaiting.length}</strong><small>Verified contracts on record</small></div></div>
   <label>Choose individual signed agreements (PDF, JPG or PNG, 10 MB maximum per file)<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple disabled={demo||uploading||busy||!klass} onChange={handleFiles}/></label>
   <p className="footnote">Files stay on this device until Upload is clicked. Filename matching is only a suggestion: always verify the student's name and the document before confirming. If one PDF contains multiple students, split it securely into individual agreements first.</p>
  </section>
  {tasks.length>0&&<section className="panel"><div className="sectionhead"><div><p className="eyebrow">REVIEW ALL FILE-TO-STUDENT MATCHES</p><h3>{tasks.length} pending agreement file(s)</h3></div><FileText/></div>
    <div className="tablewrap"><table><thead><tr><th>Selected file</th><th>Assigned school account</th><th>Review</th></tr></thead><tbody>{tasks.map(task=>{
      const wrong=!docType(task.file)||task.file.size>10_000_000||task.file.size===0||duplicateIds.includes(task.studentId);
      return <tr key={task.key}><td><b>{task.file.name}</b><small>{(task.file.size/1024/1024).toFixed(2)} MB</small></td><td><select aria-label={'Assigned student for '+task.file.name} value={task.studentId} onChange={e=>{setAssigned(prev=>({...prev,[task.key]:{key:task.key,studentId:e.target.value,source:'manual'}}));setAccept(false);}}>
        <option value="">Choose exact student</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} • {s.studentNumber||'ID pending'}</option>)}</select></td>
        <td><span className={'badge '+(wrong||!task.studentId?'warn':'good')}>{wrong?'Wrong type, duplicate student or size over 10 MB':!task.studentId?'Match required':task.status==='filename'?'Suggested: confirm manually':'Manually selected'}</span></td></tr>;
    })}</tbody></table></div>
    {invalid.length>0&&<p className="error">Resolve {invalid.length} assignment or file issue(s) before uploading. A file cannot be assigned to an unknown or duplicate student.</p>}
    <label className="checkboxlabel"><input type="checkbox" checked={accept} disabled={invalid.length>0} onChange={e=>setAccept(e.target.checked)}/> I have checked every individual signed document and matched it to the correct student's account. I will review signatures before marking agreements verified.</label>
    <div className="reportactions"><button className="primary" disabled={!ready} onClick={submit}><Upload size={17}/> {uploading?('Encrypting and uploading '+progress.done+'/'+progress.total):('Upload '+tasks.length+' agreements securely')}</button></div>
    <p className="notice">A completed upload creates a student document entry marked “Submitted — review pending.” It does not certify the contract, transmit it to the DMV, or make the file public.</p>
  </section>}
  {uploading&&<p className="notice" role="status">Secure upload in progress: {progress.done}/{progress.total} completed.</p>}
  {errors.map((e,i)=><p className="error" role="alert" key={i}>{e}</p>)}
  {notice&&<p className="notice" role="status">{notice}</p>}
  <section className="panel"><h3><CheckCircle2 size={18}/> After the upload</h3><p>Use Students → Secure Document Vault to open the signed PDF, verify it belongs to the correct student, and explicitly approve it. The DMV packet preflight stays blocked for students without verified signed enrollment agreements. Students only see their own permitted portal uploads—not everyone else's contracts.</p></section>
 </div>;
}
