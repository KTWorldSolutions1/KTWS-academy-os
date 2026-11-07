'use client';
import {useEffect,useState} from 'react';
import type {RecordData as R} from '../lib/training';
import {latestEvidence,profilePhotoKey,STUDENT_PHOTO_CATEGORY} from '../lib/student-documents';
import {Camera,CheckCircle2,FileImage,IdCard,Printer,ShieldCheck,Upload,UserRound} from 'lucide-react';
type Props={records:R[];role:string;demo:boolean;busy:boolean;initialStudentId?:string;saveMany:(rows:R[])=>Promise<boolean>};
function escapeHtml(text:string){return String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));}
function syntheticPortrait(name:string){
 const initials=name.split(' ').map(s=>s[0]||'').join('').slice(0,2).toUpperCase();
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="350" height="450"><rect width="350" height="450" fill="#142334"/><circle cx="175" cy="160" r="92" fill="#8dacc7"/><path d="M10 450c10-120 65-161 165-161s155 41 165 161" fill="#346e99"/><text x="175" y="399" fill="#ffffff" font-family="Arial" text-anchor="middle" font-size="43" font-weight="bold">'+initials+'</text></svg>';
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
function htmlCard(s:R,place:string,photo:string,id:string){
 const name=escapeHtml(s.name),campus=escapeHtml(place),number=escapeHtml(id),program=escapeHtml(s.program||'CDL Training');
 const portrait=escapeHtml(photo);
 return '<!doctype html><html><head><meta charset="utf-8"><title>Lone Star Student ID</title><style>@page{size:3.375in 2.125in;margin:0}*{box-sizing:border-box}body{margin:0;font:11px Arial,sans-serif;color:#122033}.id{width:3.375in;height:2.125in;border:2px solid #1a5b90;background:#f8fafc;position:relative;overflow:hidden}.stripe{background:#102f4e;color:#fff;padding:7px 12px;letter-spacing:1px;font-weight:800;font-size:13px}.stripe small{display:block;letter-spacing:.8px;font-size:7px;font-weight:500}.main{display:flex;padding:10px 12px;gap:13px}.face{width:78px;height:94px;object-fit:cover;object-position:50% 22%;background:#bdc9d2;border:1px solid #96acc0}.info{flex:1}.info b{font-size:14px;display:block;overflow-wrap:anywhere;margin-bottom:8px}.info p{font-size:10px;margin:0 0 6px}.foot{position:absolute;bottom:5px;left:12px;color:#506579;font-size:7px}</style></head><body><div class="id"><div class="stripe">LONE STAR <small>TRUCK DRIVING ACADEMY • STUDENT IDENTIFICATION</small></div><div class="main"><img class="face" src="'+portrait+'"/><div class="info"><b>'+name+'</b><p>STUDENT ID: '+number+'</p><p>'+program+'</p><p>'+campus+'</p></div></div><div class="foot">School ID only • Not a driver license • Not proof of qualification</div></div></body></html>';
}
export default function StudentBadgeStudio({records,role,demo,busy,saveMany,initialStudentId}:Props){
 const students=records.filter(s=>s.kind==='students'&&s.campusId&&s.campusId!=='__legacy__').sort((a,b)=>a.name.localeCompare(b.name));
 const [query,setQuery]=useState(''),[studentId,setStudentId]=useState(initialStudentId||''),[idNumber,setIdNumber]=useState(''),[photo,setPhoto]=useState(''),[pendingPhoto,setPendingPhoto]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState(''),[working,setWorking]=useState(false);
 const choices=students.filter(s=>!query||s.name.toLowerCase().includes(query.toLowerCase())||String(s.studentNumber||'').toLowerCase().includes(query.toLowerCase()));
 const student=students.find(s=>s.id===studentId)||choices[0]||students[0];
 const campus=records.find(c=>c.id===student?.campusId&&c.kind==='campuses');
 const approvedKey=student?profilePhotoKey(student):null;
 const pending=(student?.documents||[]).filter((d:any)=>d.category===STUDENT_PHOTO_CATEGORY&&d.key&&d.verified!==true).at(-1);
 const canManage=['Owner','Regional admin','Campus manager'].includes(role);
 useEffect(()=>{if(initialStudentId)setStudentId(initialStudentId);},[initialStudentId]);
 useEffect(()=>{setIdNumber(student?.studentNumber||'');setMessage('');setError('');},[student?.id,student?.studentNumber]);
 useEffect(()=>{
  let alive=true,objectUrl='';
  const get=async()=>{
   setPhoto('');setPendingPhoto('');
   if(!student)return;
   if(demo){setPhoto(syntheticPortrait(student.name));if(pending)setPendingPhoto(syntheticPortrait(student.name));return;}
   async function getUrl(key:string){const res=await fetch('/api/files?key='+encodeURIComponent(key),{cache:'no-store'});if(!res.ok)throw Error('School photo could not be opened');const blob=await res.blob();return URL.createObjectURL(blob);}
   try{
    if(approvedKey){objectUrl=await getUrl(approvedKey);if(alive)setPhoto(objectUrl);else URL.revokeObjectURL(objectUrl);}
    else if(pending?.key){objectUrl=await getUrl(pending.key);if(alive)setPendingPhoto(objectUrl);else URL.revokeObjectURL(objectUrl);}
   }catch{}
  };get();return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[student?.id,approvedKey,pending?.key,demo]);
 if(!canManage)return <p className="notice">Student profile photos and badge printing require authorized campus management.</p>;
 async function simulate(){
  if(!student||!demo)return;
  const entry={key:'demo-badge-photo-'+crypto.randomUUID(),category:STUDENT_PHOTO_CATEGORY,name:'FICTIONAL_STUDENT_PORTRAIT.jpg',verified:false,uploadedAt:new Date().toISOString(),uploadedBy:'Sample campus registrar',demoOnly:true};
  if(await saveMany([{...student,documents:[...(student.documents||[]),entry]}]))setMessage('Sample photo received. Click Review & approve to enable this fictional ID.');
 }
 async function uploadPhoto(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');setMessage('');
  if(!student||demo){setError('Use the simulated photo in sample mode; never upload real identity images to a demonstration.');return;}
  setWorking(true);
  const form=e.currentTarget,files=form.querySelector('input[type="file"]') as HTMLInputElement;
  const file=files?.files?.[0];
  if(!file||!['image/jpeg','image/png'].includes(file.type)||file.size>2_000_000){setError('Choose a JPG or PNG portrait smaller than 2 MB.');setWorking(false);return;}
  const body=new FormData();body.set('studentId',student.id);body.set('category',STUDENT_PHOTO_CATEGORY);body.set('file',file);body.set('attachToStudent','1');
  try{
   const res=await fetch('/api/files',{method:'POST',body}),data=await res.json();
   if(!res.ok)throw Error(data.error||'Private photo storage is not active.');
   if(!data.attachedToStudent)throw Error('The portrait was not linked to the student. Ask management to reconcile before retrying.');
   await saveMany([]);
   setMessage('Photo stored privately. An authorized manager must approve it before it appears on the student card or student portal.');
   form.reset();
  }catch(e:any){setError(e.message||'Could not complete private upload.');}finally{setWorking(false);}
 }
 async function approve(){
  if(!student||!pending?.key)return;
  setWorking(true);setError('');setMessage('');
  try{
   if(demo){
    const docs=(student.documents||[]).map((d:any)=>d.key===pending.key?{...d,verified:true,reviewedBy:'Demo registrar',reviewedAt:new Date().toISOString()}:d);
    if(!await saveMany([{...student,documents:docs}]))throw Error('Sample update failed');
    setMessage('Fictional portrait approved. Preview and print the sample badge below.');return;
   }
   const res=await fetch('/api/student/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:student.id,action:'verify',key:pending.key})});
   const body=await res.json();if(!res.ok)throw Error(body.error||'Photo could not be verified.');
   if(!await saveMany([]))throw Error('Refresh the saved record.');
   setMessage('Portrait approved and linked to the student’s authenticated portal and ID card.');
  }catch(e:any){setError(e.message);}finally{setWorking(false);}
 }
 async function saveId(){
  if(!student||!idNumber.trim()){setError('Enter a school-issued student ID number.');return;}
  if(students.some(s=>s.id!==student.id&&String(s.studentNumber||'')===idNumber.trim())){setError('Another student already has that ID number in this workspace.');return;}
  if(await saveMany([{...student,studentNumber:idNumber.trim()}]))setMessage('Student ID saved. The card preview uses the approved school ID.');
 }
 async function print(){
  if(!student||!photo||!idNumber.trim()||String(student.studentNumber||'')!==idNumber.trim()){setError('Approve the photo and save the ID number before printing.');return;}
  setError('');
  const windowRef=window.open('','_blank');
  if(!windowRef){setError('Allow pop-ups to print the 3.375 × 2.125 inch student ID.');return;}
  try{
   const blob=await fetch(photo).then(r=>r.blob()),reader=new FileReader();
   reader.onload=()=>{windowRef.document.write(htmlCard(student,campus?.name||'Lone Star',String(reader.result),idNumber));windowRef.document.close();setTimeout(()=>{windowRef.focus();windowRef.print();},350);};
   reader.readAsDataURL(blob);
  }catch{windowRef.close();setError('The approved photo could not be prepared for printing.');}
 }
 return <div className="student-badge-studio">
  <section className="panel"><div className="sectionhead"><div><p className="eyebrow">STUDENTS → PROFILE PHOTOS & ID BADGES</p><h2><IdCard size={28}/> Student Photo & Badge Studio</h2><p className="muted">This is the dedicated location for adding a student's portrait to their school profile, reviewing it, assigning a badge number and printing the card. Real portraits are stored in the private R2 document vault.</p></div><ShieldCheck size={27}/></div>
   <div className="badge-studio-steps"><span>① Select student</span><span>② Upload photo</span><span>③ Review / approve</span><span>④ Save ID</span><span>⑤ Print badge</span></div>
   <div className="formgrid"><label>Find a student by name or school ID<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a student…"/></label><label>Student profile<select value={student?.id||''} onChange={e=>setStudentId(e.target.value)}>{choices.map(s=><option key={s.id} value={s.id}>{s.name} · {records.find(c=>c.id===s.campusId)?.name||'Campus'}</option>)}</select></label></div>
   {!student&&<p className="notice">Add students and assign them to an authorized campus before issuing school ID cards.</p>}
  </section>
  {student&&<div className="badge-studio-grid">
   <section className="panel badge-studio-upload"><h3><Camera size={18}/> 1. Upload & review portrait</h3>
    <p className="muted">Use a clear head-and-shoulders JPG/PNG portrait, 2 MB maximum. The photo attaches to <b>{student.name}</b> at the <b>{campus?.name||'assigned campus'}</b> school. It is never public.</p>
    {demo?<button className="primary" onClick={simulate} disabled={busy||working}><Upload size={16}/> Simulate portrait upload</button>:
    <form className="vault-upload" onSubmit={uploadPhoto}><label>Student portrait<input type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" required/></label><button className="primary" disabled={busy||working}><Upload size={16}/> Upload securely to student profile</button></form>}
    {pending&&<div className="badge-review-queue"><b>Awaiting approval: {pending.name||'Student portrait'}</b><small>Review the photograph before making it the official student profile picture.</small>{pendingPhoto&&<img src={pendingPhoto} alt="Portrait awaiting management approval"/>}<button onClick={approve} disabled={working||busy}><CheckCircle2 size={16}/> Review & approve portrait</button></div>}
    <div className="notice"><ShieldCheck size={15}/> {approvedKey||demo?'An approved or fictional portrait is available for preview.':'No approved student portrait yet. The school ID remains disabled until staff review.'}</div>
   </section>
   <section className="panel"><h3><IdCard size={18}/> 2. Preview & print the badge</h3><div className="student-badge-preview"><header><b>★ LONE STAR</b><small>TRUCK DRIVING ACADEMY · STUDENT ID</small></header><div><span className="student-badge-face">{photo?<img src={photo} alt={student.name+' approved school profile'}/>:<UserRound size={58}/>}</span><section><h4>{student.name}</h4><p>STUDENT ID: {idNumber||'Pending'}</p><p>{student.program||'CDL Training'}</p><p>{campus?.name||'Campus pending'}</p></section></div><footer>School ID only • Not a driver license</footer></div>
    <label>School-assigned ID number<input value={idNumber} maxLength={30} onChange={e=>setIdNumber(e.target.value)} placeholder="For example: 102233"/></label>
    <div className="reportactions"><button onClick={saveId} disabled={busy||!idNumber.trim()||idNumber===student.studentNumber}>Save ID number</button><button className="primary" disabled={!photo||!idNumber.trim()||idNumber!==student.studentNumber} onClick={print}><Printer size={17}/> Print approved badge</button></div>
    <p className="footnote">Standard CR80 card: 3.375 × 2.125 inches. Only name, school ID, program, campus and photo appear on the card. Never include an SSN, driver's license number, DOB, medical or drug-screening data.</p>
   </section></div>}
  {message&&<p className="notice" role="status">{message}</p>}{error&&<p className="error" role="alert">{error}</p>}
 </div>;
}
