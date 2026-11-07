'use client';
import {useEffect,useState} from 'react';
import type {RecordData as R} from '../lib/training';
import {documentChecklist,REQUIRED_ENROLLMENT_CATEGORIES,REQUESTABLE_DOCUMENTS,STUDENT_PHOTO_CATEGORY,PUBLIC_RESOURCE_CATEGORY,profilePhotoKey} from '../lib/student-documents';
import {FileText,ShieldCheck,Image,Printer,Bell,Upload} from 'lucide-react';
import {FUNDING_TYPES} from '../lib/compliance-roster';
import SampleEnrollmentWalkthrough from './sample-enrollment-walkthrough';
type Props={records:R[];role:string;demo:boolean;busy:boolean;saveMany:(rows:R[])=>Promise<boolean>};
export default function StudentDocumentCenter({records,role,demo,busy,saveMany}:Props){
 const students=records.filter(s=>s.kind==='students'&&s.campusId&&s.campusId!=='__legacy__');
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const [selected,setSelected]=useState(''),[category,setCategory]=useState('Enrollment agreement'),[pending,setPending]=useState<string[]>([]),[notice,setNotice]=useState(''),[error,setError]=useState(''),[photo,setPhoto]=useState(''),[schoolFiles,setSchoolFiles]=useState<any[]>([]),[resourceCampus,setResourceCampus]=useState(''),[studentNumber,setStudentNumber]=useState('');
 const student=students.find(s=>s.id===selected)||students[0],campus=campuses.find(c=>c.id===(resourceCampus||student?.campusId))||campuses[0];
 const required=student?documentChecklist(student):[],proof=student?profilePhotoKey(student):null;
 async function reload(){await saveMany([]);}
 async function resourceList(){
  if(!campus)return;
  try{const res=await fetch('/api/files?list=1&category='+encodeURIComponent(PUBLIC_RESOURCE_CATEGORY)+'&campusId='+encodeURIComponent(campus.id),{cache:'no-store'});const data=await res.json();if(res.ok)setSchoolFiles(data.files||[]);}catch{}
 }
 useEffect(()=>{resourceList();},[campus?.id]);
 useEffect(()=>{
  let active=true,blobUrl='';
  async function getPhoto(){
   setPhoto('');if(demo){
    const initials=(student?.name||'LS').split(' ').map((part:string)=>part[0]||'').join('').slice(0,2).toUpperCase();
    const svg='<svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380"><rect width="300" height="380" fill="#152b41"/><circle cx="150" cy="144" r="77" fill="#6d9dc1"/><path d="M16 370c15-90 62-131 134-131s119 41 134 131" fill="#275f8c"/><text x="150" y="340" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="35" fill="white">'+initials+'</text></svg>';
    setPhoto('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg));return;
   }
   if(!proof)return;
   try{const res=await fetch('/api/files?key='+encodeURIComponent(proof),{cache:'no-store'});if(!res.ok)return;const blob=await res.blob();if(active){blobUrl=URL.createObjectURL(blob);setPhoto(blobUrl);}}catch{}
  }getPhoto();return()=>{active=false;if(blobUrl)URL.revokeObjectURL(blobUrl);};
 },[proof,demo,student?.name]);
 useEffect(()=>{setStudentNumber(student?.studentNumber||'');setPending([]);setError('');},[student?.id]);
 async function simulateArrival(){
  if(!demo||!student)return;
  const fake={key:'demo-'+crypto.randomUUID(),category,name:'FICTIONAL_'+category.replace(/\W+/g,'_')+'.pdf',uploadedAt:new Date().toISOString(),uploadedBy:'Synthetic student portal',verified:false,demoOnly:true,encrypted:false};
  if(await saveMany([{...student,documents:[...(student.documents||[]),fake]}]))setNotice('Demonstration: a synthetic document arrived for school review. No file was uploaded or stored.');
 }
 async function request(){
  if(!student||!pending.length)return;
  setError('');setNotice('');
  try{if(demo){const now=new Date().toISOString();if(await saveMany([{...student,documentRequests:[...(student.documentRequests||[]).filter((r:any)=>!pending.includes(r.category)),...pending.map(name=>({category:name,status:'Requested',requestedAt:now,requestedBy:'Demo campus manager',message:'Sample in-app alert: please upload this document.'}))]}])){setNotice('Demonstration: missing-item notices added to the fictional student portal. No email or SMS was sent.');setPending([]);}return;}const res=await fetch('/api/student/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:student.id,action:'request',categories:pending})});const body=await res.json();if(!res.ok)throw Error(body.error);setNotice(body.notice);setPending([]);await reload();}catch(e:any){setError(e.message);}
 }
 async function verify(key:string){
  if(!student||!key)return;
  try{if(demo){if(await saveMany([{...student,documents:(student.documents||[]).map((d:any)=>d.key===key?{...d,verified:true,reviewedBy:'Demo reviewer',reviewedAt:new Date().toISOString()}:d)}]))setNotice('Demonstration: sample evidence marked reviewed. No real file exists.');return;}const res=await fetch('/api/student/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:student.id,action:'verify',key})});const body=await res.json();if(!res.ok)throw Error(body.error);setNotice(body.notice);await reload();}catch(e:any){setError(e.message);}
 }
 async function upload(e:React.FormEvent<HTMLFormElement>,publicResource=false){
  e.preventDefault();setNotice('');setError('');
  if(demo){setError('Secure uploads are disabled in sample mode.');return;}
  const form=e.currentTarget,body=new FormData(form);
  body.set('category',publicResource?PUBLIC_RESOURCE_CATEGORY:category);
  if(publicResource)body.set('campusId',campus?.id||'');else body.set('studentId',student?.id||'');
  try{
   const res=await fetch('/api/files',{method:'POST',body}),data=await res.json();
   if(!res.ok)throw Error(data.error||'Upload failed');
   if(!publicResource&&student){
    const okay=await saveMany([{...student,documents:[...(student.documents||[]),{...data,verified:false}]}]);
    if(!okay)throw Error('File was encrypted but student attachment was not saved. Ask management to reconcile the file.');
   }
   setNotice(publicResource?'Campus resource uploaded. Students with portal access can view it.':'Encrypted file uploaded, awaiting management verification.');
   form.reset();await resourceList();
  }catch(e:any){setError(e.message||'Secure file upload was unavailable');}
 }
 function printId(){
  if(!student||!studentNumber.trim()||!photo){setError('Save a student ID number and verify an uploaded photo before printing.');return;}
  const safe=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  // Print only identity/card fields; never include underlying SSN/license documents.
  const card=`<!doctype html><html><head><meta charset="utf-8"><title>Lone Star student ID</title><style>@page{size:3.375in 2.125in;margin:0}*{box-sizing:border-box}body{margin:0;font:11px Arial;color:#102c4d}.card{width:3.375in;height:2.125in;background:#f6f8fd;border:3px solid #23476c;overflow:hidden}.head{background:#163d70;color:white;padding:9px 12px;font-size:15px;font-weight:800;letter-spacing:.4px}.head small{display:block;font-size:8px;color:#c9d5e7;letter-spacing:1.5px}.body{display:flex;gap:13px;padding:10px 12px}.face{width:1in;height:1.13in;object-fit:cover;background:#ced5df;border:1px solid #788ba6}.info{flex:1;min-width:0}.info strong{display:block;font-size:15px;margin-bottom:10px;overflow-wrap:anywhere}.info p{font-size:10px;margin:0 0 7px}.foot{font-size:9px;color:#52657e;position:absolute;bottom:5px;padding-left:12px}</style></head><body><div class="card"><div class="head">LONE STAR <small>TRUCK DRIVING ACADEMY • STUDENT ID</small></div><div class="body"><img class="face" src="${safe(photo)}"/><div class="info"><strong>${safe(student.name)}</strong><p><b>ID:</b> ${safe(studentNumber)}</p><p>${safe(student.program||'CDL Program')}</p><p>${safe(campus?.name||'Greensboro')}</p></div></div><div class="foot">Training identification only • Not a driver license</div></div></body></html>`;
  // A blob URL is scoped to the calling window. Copy the photo as a data URL for pop-up print.
  const reader=new FileReader();
  fetch(photo).then(res=>res.blob()).then(blob=>{reader.onload=()=>{const w=window.open('','_blank');if(w){w.document.write(card.replace(safe(photo),String(reader.result)));w.document.close();setTimeout(()=>{try{w.focus();w.print();}catch{}},600);}else setError('Allow pop-ups to print the student ID.');};reader.readAsDataURL(blob);});
 }
 const canManage=['Owner','Regional admin','Campus manager'].includes(role);
 if(!canManage)return <p className="notice">Secure student enrollment records require campus management access.</p>;
 return <div className="student-document-center"><section className="panel"><div className="sectionhead"><div><p className="eyebrow">SCHOOL RECORDS • PRIVATE VAULT</p><h2>Student documents, ID cards and missing-item notices</h2><p className="muted">All uploads use protected, encrypted school storage and are scoped to a campus and individual student. Social Security and licensing documents never appear on a student ID card or in public school resources.</p></div><ShieldCheck size={26}/></div>
 {demo&&<SampleEnrollmentWalkthrough/>}<label>Student<select value={student?.id||''} onChange={e=>{setSelected(e.target.value);setNotice('');setError('');}}>{students.map(s=><option key={s.id} value={s.id}>{s.name} • {s.cohort||s.program||'CDL'}</option>)}</select></label>
 {student&&<><details className="vault-identity"><summary>Private identity, DMV roster fields and funding type</summary><p className="muted">Only authorized management may review or update identity fields. The DMV roster uses these details, but sensitive documents remain in encrypted restricted storage. Never enter the full Social Security number into text fields.</p>
 <form className="vault-upload" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const values=Object.fromEntries(f);if(await saveMany([{...student,...values}]))setNotice('Protected student identity and funding fields saved.');else setError('Identity update was not saved.');}}>
 <div className="formgrid">
 <label>Date of birth<input type="date" name="dob" defaultValue={student.dob||''} key={student.id+'dob'}/></label>
 <label>Driver license number<input type="text" name="licenseNumber" maxLength={50} defaultValue={student.licenseNumber||''} key={student.id+'licenseNumber'}/></label>
 <label>Telephone<input type="tel" name="phone" maxLength={30} defaultValue={student.phone||''} key={student.id+'phone'}/></label>
 <label>Street / mailing address<input type="text" name="address" maxLength={250} defaultValue={student.address||''} key={student.id+'address'}/></label>
 <label>City<input type="text" name="city" maxLength={100} defaultValue={student.city||''} key={student.id+'city'}/></label>
 <label>State<input type="text" name="state" maxLength={2} defaultValue={student.state||''} key={student.id+'state'}/></label>
 <label>ZIP<input type="text" name="zip" maxLength={12} defaultValue={student.zip||''} key={student.id+'zip'}/></label>
 <label>Payment / funding type<select name="fundingType" defaultValue={student.fundingType||'Cash'} key={student.id+'fundingType'}>{FUNDING_TYPES.map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Funding agency / outside organization<input name="fundingAgency" maxLength={200} defaultValue={student.fundingAgency||''} key={student.id+'fundingAgency'}/></label>
 </div><button className="primary" disabled={busy}>Save protected enrollment details</button></form></details><h3>Required enrollment packet</h3><div className="vault-doc-grid">{required.map(row=><div className="vault-doc-row" key={row.category}><div><b>{row.category}</b><small>{row.status}{row.requested?' · Student alerted in portal':''}</small></div><div>{row.key&&(demo?<span className="badge">Fictional metadata</span>:<a href={'/api/files?key='+encodeURIComponent(row.key)}><FileText size={15}/> View</a>)}{row.key&&row.status!=='Verified'&&<button onClick={()=>verify(row.key!)} disabled={busy}>Verify</button>}<label className="vault-checkbox"><input type="checkbox" checked={pending.includes(row.category)} onChange={e=>setPending(p=>e.target.checked?[...p,row.category]:p.filter(c=>c!==row.category))}/>Request</label></div></div>)}</div>
 <button className="primary" onClick={request} disabled={busy||!pending.length}><Bell size={16}/> Alert student: {pending.length} selected item(s)</button><p className="footnote">Alerts appear within the student's authenticated portal immediately. Email and SMS delivery are not connected; this does not send texts or emails.</p>
 <form onSubmit={e=>upload(e)} className="vault-upload"><h3><Upload size={17}/> Upload private student document</h3><label>Document type<select value={category} onChange={e=>setCategory(e.target.value)}>{[...REQUESTABLE_DOCUMENTS,STUDENT_PHOTO_CATEGORY].map(name=><option key={name}>{name}</option>)}</select></label><label>Choose encrypted file<input type="file" name="file" accept={category===STUDENT_PHOTO_CATEGORY?'.jpg,.jpeg,.png':'.pdf,.jpg,.jpeg,.png,.txt'} required/></label><button className="primary" disabled={busy||demo}>Secure upload</button>{demo&&<button type="button" onClick={simulateArrival}>Simulate requested document arrival</button>}</form>
 <section className="vault-id"><h3><Image size={17}/> Student photo ID card</h3><p className="muted">Upload a portrait under “Student profile photo,” review it, then approve and print a blue-and-silver student ID card at standard CR80 size (3.375 × 2.125 inches). Photos are cropped to fill without white borders. In sample mode, the portrait is an illustrative SVG avatar—not a real student photo.</p>{photo?<img className="vault-portrait" src={photo} alt={student.name+' portrait'}/>:<p className="muted">No reviewed ID photo uploaded. Upload and verify a photo to activate card printing.</p>}<label>School-assigned student ID number<input value={studentNumber} onChange={e=>setStudentNumber(e.target.value)} maxLength={25} placeholder="e.g. 102233"/></label><button disabled={busy||!studentNumber.trim()||studentNumber===String(student.studentNumber||'')} onClick={async()=>{if(await saveMany([{...student,studentNumber:studentNumber.trim()}]))setNotice('Student ID number saved.');}}>Save student ID</button><button disabled={!photo||!studentNumber.trim()} onClick={printId}><Printer size={15}/> Print student ID</button></section></>}
 {notice&&<p className="notice" role="status">{notice}</p>}{error&&<p className="error" role="alert">{error}</p>}</section>
 <section className="panel"><div className="sectionhead"><div><p className="eyebrow">SCHOOL RESOURCES • STUDENT-VISIBLE</p><h2>Public classroom forms & resources</h2><p className="muted">Public here means approved for authenticated students at the assigned campus; documents are not anonymously published on the open internet.</p></div><FileText size={25}/></div><label>Campus<select value={campus?.id||''} onChange={e=>setResourceCampus(e.target.value)}>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <form onSubmit={e=>upload(e,true)} className="vault-upload"><label>PDF or classroom resource<input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.txt" required/></label><button className="primary" disabled={busy}>Upload student-visible resource</button></form>{schoolFiles.map(file=><div className="vault-doc-row" key={file.key}><div><b>{file.name}</b><small>{file.created?.slice(0,10)}</small></div><a href={'/api/files?key='+encodeURIComponent(file.key)}>View</a></div>)}</section>
 </div>;
}
