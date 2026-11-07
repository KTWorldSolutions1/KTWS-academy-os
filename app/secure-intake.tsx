'use client';
import {useMemo,useRef,useState} from 'react';
import type {RecordData as R} from '../lib/training';
import {parseEnrollmentRoster,rosterMatch,safeReference,suggestMailingPieces,type IntakeRow} from '../lib/secure-roster-intake';
import {REQUIRED_ENROLLMENT_CATEGORIES} from '../lib/student-documents';
import {FileLock2,FilePlus2,FileText,Info,LockKeyhole,ShieldCheck,Upload,UsersRound,CheckCircle2,AlertTriangle,ClipboardCheck} from 'lucide-react';

type Props={records:R[];role:string;demo:boolean;busy:boolean;saveMany:(records:R[])=>Promise<boolean>;onPage:(page:string)=>void};
type ReviewedRow=IntakeRow&{street:string;city:string;state:string;zip:string};
type AttachedFile={file:File;studentId:string;state:'Pending'|'Uploaded'|'Error';message:string};
function moneyDate(value:string){if(!value)return '';return new Date(value+'T12:00:00Z').toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'});}
function prepare(rows:IntakeRow[]):ReviewedRow[]{return rows.map(r=>{const pieces=suggestMailingPieces(r.address);return {...r,street:pieces.address,city:pieces.city,state:pieces.state||r.licenseState,zip:pieces.zip};});}
export default function SecureIntake({records,role,demo,busy,saveMany,onPage}:Props){
 const [campusId,setCampusId]=useState(''),[source,setSource]=useState(''),[rows,setRows]=useState<ReviewedRow[]>([]),[errors,setErrors]=useState<string[]>([]);
 const [importStatus,setImportStatus]=useState(''),[importing,setImporting]=useState(false),[initialStatus,setInitialStatus]=useState('Classroom');
 const [files,setFiles]=useState<AttachedFile[]>([]),[fileNotice,setFileNotice]=useState(''),[fileConfirm,setFileConfirm]=useState(false),[uploading,setUploading]=useState(false);
 const manager=['Owner','Regional admin','Campus manager'].includes(role);
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const campus=campuses.find(r=>r.id===campusId)||campuses.find(r=>r.city?.toLowerCase()==='greensboro')||campuses[0];
 const classes=records.filter(r=>r.kind==='classes'&&r.campusId===campus?.id);
 const students=records.filter(r=>r.kind==='students'&&r.campusId===campus?.id).sort((a,b)=>a.name.localeCompare(b.name));
 const [chosenClass,setChosenClass]=useState('auto');
 const first=rows[0],proposedClass=classes.find(c=>c.startDate===first?.startDate&&c.endDate===first?.endDate&&c.program==='Class A');
 const classOption=chosenClass==='auto'?proposedClass:classes.find(c=>c.id===chosenClass);
 const matchByRow=rows.map(r=>({row:r,match:rosterMatch(students,r)}));
 const duplicates=matchByRow.filter(x=>x.match),newRows=matchByRow.filter(x=>!x.match);
 const ready=rows.length>0&&!errors.length&&rows.every(r=>r.street&&r.city&&r.state&&r.zip&&r.phone&&r.startDate===first.startDate&&r.endDate===first.endDate);
 const dateMatch=!classOption||classOption.startDate===first?.startDate&&classOption.endDate===first?.endDate;
 const fileInput=useRef<HTMLInputElement|null>(null);
 const pickedCount=files.filter(x=>x.studentId).length,invalidCount=files.filter(x=>!x.studentId||x.file.size>10_000_000||!['application/pdf','image/jpeg','image/png'].includes(x.file.type)).length;
 const existingAgreementCount=students.filter(s=>(s.documents||[]).some((d:any)=>d.category==='Enrollment agreement'&&d.verified)).length;

 function parse(){
  setImportStatus('');const result=parseEnrollmentRoster(source);
  setErrors(result.errors);setRows(prepare(result.rows));
  if(result.errors.length)setImportStatus('Correct the roster errors before writing to the school database.');
 }
 function updateRow(index:number,field:keyof ReviewedRow,value:string){setRows(previous=>previous.map((r,i)=>i===index?{...r,[field]:value}:r));}
 async function importStudents(){
  setImportStatus('');if(!manager||demo){setImportStatus('Real student imports are available only to authorized managers in the private workspace, not the public demo.');return;}
  if(!ready||!dateMatch){setImportStatus('Confirm names, state, ZIP, mailing city and class dates for every record.');return;}
  if(newRows.length===0){setImportStatus('Every roster row already has a matching school profile. No records were duplicated.');return;}
  const agree=window.confirm('Import '+newRows.length+' NEW identifiable students into the private '+campus.name+' school database? Existing students will be skipped. This is NOT demo data. Do not continue on a public/shared computer.');
  if(!agree)return;setImporting(true);
  const classId=classOption?.id||crypto.randomUUID();
  const additions:R[]=[];
  if(!classOption){
   additions.push({id:classId,kind:'classes',campusId:campus.id,name:'Class A • '+first.startDate+' (Greensboro intake)',status:'In progress',program:'Class A',
    startDate:first.startDate,endDate:first.endDate,capacity:Math.max(25,rows.length+5),
    schedule:'Weekdays • school-approved five-week course',tuition:0,theoryHours:50,yardHours:50,roadHours:60});
  }
  for(const {row} of newRows){
   additions.push({id:crypto.randomUUID(),kind:'students',name:row.firstName+' '+row.lastName,status:initialStatus,campusId:campus.id,classId,program:'Class A',
    cohort:(classOption?.name||'Class A • '+first.startDate),startDate:first.startDate,
    dob:row.dob,licenseNumber:row.licenseNumber,licenseState:row.licenseState,
    phone:row.phone,address:row.street,city:row.city,state:row.state,zip:row.zip,
    targetTheory:50,targetYard:50,targetRoad:60,fundingType:'Not confirmed',fundingStatus:'Needs school verification',
    notes:[],documents:[],documentRequests:REQUIRED_ENROLLMENT_CATEGORIES.map(category=>({
     category,status:'Requested',requestedAt:new Date().toISOString(),requestedBy:'Enrollment intake',message:'Please submit this requested evidence through the secure student portal.'})),
    sessions:[],assessments:[],evaluations:[],importSource:'School DMV enrollment roster',importedAt:new Date().toISOString(),
    studentNumber:'',enrollmentVerification:'Needs signed agreement review',portalAccessStatus:'Not invited'});
  }
  const ok=await saveMany(additions);setImporting(false);
  if(ok){setSource('');setRows([]);setErrors([]);setImportStatus('Successfully added '+newRows.length+' new student record(s) and '+(classOption?'reused an existing class.':'created the class.')+' Enrollment agreements remain MISSING until files are actually uploaded and verified.');}
  else setImportStatus('The school rejected the import. Review the system error above; no success has been confirmed.');
 }
 function pickFiles(list:FileList|null){
  setFileNotice('');setFileConfirm(false);if(!list)return;
  const chosen=Array.from(list).slice(0,30).map(file=>({file,studentId:'',state:'Pending' as const,message:''}));
  setFiles(chosen);
  if(list.length>30)setFileNotice('Only the first 30 files were added. Upload the remainder separately.');
 }
 function assign(index:number,id:string){setFiles(prev=>prev.map((r,i)=>i===index?{...r,studentId:id,state:'Pending',message:''}:r));setFileConfirm(false);}
 async function uploadFiles(){
  if(!manager||demo||!files.length||invalidCount||!fileConfirm||uploading)return;
  setUploading(true);setFileNotice('');let successes=0,failed=0;
  for(let i=0;i<files.length;i++){
   const item=files[i],body=new FormData();
   body.set('studentId',item.studentId);body.set('category','Enrollment agreement');
   body.set('attachToStudent','1');body.set('file',item.file);
   try{
    const res=await fetch('/api/files',{method:'POST',body});
    const result=await res.json();
    if(!res.ok)throw Error(result.error||'Private file upload failed.');
    if(!result.encrypted||!result.attachedToStudent)throw Error('Server did not confirm the encrypted file and student linkage.');
    successes++;setFiles(current=>current.map((r,j)=>j===i?{...r,state:'Uploaded',message:'Encrypted and linked • staff review pending'}:r));
   }catch(e:any){failed++;setFiles(current=>current.map((r,j)=>j===i?{...r,state:'Error',message:e.message||'Upload failed'}:r));}
  }
  setUploading(false);
  await saveMany([]);
  setFileNotice(successes+' enrollment agreement(s) stored encrypted and linked to their selected student records. '+failed+' not confirmed. Uploaded documents must be reviewed and verified by management before DMV packet release.');
 }
 if(!manager)return <section className="panel"><LockKeyhole/><h2>Restricted enrollment intake</h2><p>Student identification and signed contracts require management authorization. Ask the campus manager for help.</p></section>;
 return <div className="secure-intake">
  <section className="panel">
   <div className="sectionhead"><div><p className="eyebrow">PRIVATE SCHOOL RECORDS · OWNER / CAMPUS MANAGEMENT</p><h2><ShieldCheck size={24}/> First-cohort roster & signed agreement intake</h2>
    <p className="muted">Import your real DMV class roster securely, then attach each student's actual signed enrollment agreement by choosing the matching student profile. Names, birthdays and driver license numbers are never embedded in website source code or fictional demo accounts.</p></div><FileLock2 size={28}/></div>
   <div className="intake-privacy-banner"><LockKeyhole size={22}/><div><b>Real personally identifiable student records — not a demonstration.</b>
    <p>Use this only while signed in as an authorized school manager. Never send driver licenses, Social Security cards or signed agreements through ordinary group email. The file vault encrypts uploads before storing them in private R2. A file is not DMV-ready until an authorized reviewer verifies it.</p></div></div>
   {demo?<p className="error">You are using the fictional training sandbox. Switch to <strong>Return to saved records</strong> before entering actual student information.</p>:null}
  </section>
  <section className="panel intake-importer"><div className="sectionhead"><div><p className="eyebrow">STEP 1 OF 2 · CREATE STUDENT PROFILES</p><h2><UsersRound size={22}/> Import your DMV enrollment roster</h2></div><span className="badge">Management only</span></div>
   <div className="formgrid"><label>Destination campus<select value={campus?.id||''} onChange={e=>{setCampusId(e.target.value);setChosenClass('auto');setRows([]);setErrors([]);}}>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>Imported students' initial workflow stage<select value={initialStatus} onChange={e=>setInitialStatus(e.target.value)}><option>Classroom</option><option>Waiting for permit</option><option>Enrollment pending</option></select></label></div>
   <p className="muted">Paste the DMV report as a Markdown table, CSV or spreadsheet cells separated by tabs. Start/end dates, DOB and license numbers stay unchanged. No student is marked as having completed lessons, drug screening or federal reporting simply by importing a roster.</p>
   <label>DMV roster rows<textarea rows={8} value={source} maxLength={120000} onChange={e=>setSource(e.target.value)} placeholder={'FIRST_NAME, LAST_NAME, DL_NUMBER, DL_STATE, DATE_OB, START_DATE, END_DATE, Phone Number:, Address:\nFictional, Sample, 00000XXXXX, NC, 01/01/1999, NOVEMBER 02, 2026, DECEMBER 04, 2026, 555-010-1234, 100 Example St Greensboro NC 27401'} autoComplete="off" spellCheck={false}/></label>
   <button type="button" disabled={!source.trim()||importing||demo} onClick={parse}><ClipboardCheck size={17}/> Validate & preview roster (nothing is saved yet)</button>
   {errors.length>0&&<div className="error" role="alert"><b>Roster requires attention:</b>{errors.map((e,i)=><p key={i}>{e}</p>)}</div>}
   {rows.length>0&&<><div className="intake-counts"><span><b>{rows.length}</b> parsed rows</span><span><b>{newRows.length}</b> new students</span><span><b>{duplicates.length}</b> already represented</span></div>
    <label>Link to a class<select value={chosenClass} onChange={e=>setChosenClass(e.target.value)}><option value="auto">{proposedClass?'Use existing class: '+proposedClass.name:'Create Class A • '+moneyDate(first.startDate)+' – '+moneyDate(first.endDate)}</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name} · {c.startDate} to {c.endDate}</option>)}</select></label>
    {!dateMatch&&<p className="error">Selected class dates do not match the supplied DMV enrollment report.</p>}
    <p className="footnote">Review every name, mailing city, ZIP and driver license before import. Duplicate detection checks the same driver license or full name + birthdate. Existing records are skipped, not overwritten.</p>
    <div className="intake-review">{matchByRow.map(({row,match},i)=><div key={row.line} className={'intake-review-row '+(match?'existing':'')}><div className="intake-review-person"><b>{row.firstName} {row.lastName}</b><span className={'badge '+(match?'warn':'good')}>{match?'Already exists • skip':'New profile'}</span><small>DL {row.licenseState} {safeReference(row.licenseNumber)} · DOB {row.dob} · {moneyDate(row.startDate)}–{moneyDate(row.endDate)}</small></div>
     <div className="intake-review-fields"><label>Street<input value={row.street} maxLength={250} onChange={e=>updateRow(i,'street',e.target.value)}/></label><label>City<input value={row.city} maxLength={100} onChange={e=>updateRow(i,'city',e.target.value)}/></label><label>State<input value={row.state} maxLength={2} onChange={e=>updateRow(i,'state',e.target.value.toUpperCase())}/></label><label>ZIP<input value={row.zip} maxLength={12} onChange={e=>updateRow(i,'zip',e.target.value)}/></label></div></div>)}</div>
    <button className="primary" disabled={busy||importing||demo||!ready||!dateMatch||!newRows.length} onClick={importStudents}><ShieldCheck size={18}/>{importing?'Saving private records…':'Confirm & import '+newRows.length+' student(s)'}</button></>}
   {importStatus&&<p className="notice" role="status">{importStatus}</p>}
  </section>
  <section className="panel intake-agreements"><div className="sectionhead"><div><p className="eyebrow">STEP 2 OF 2 · PRIVATELY ATTACH EXECUTED CONTRACTS</p><h2><FileText size={23}/> Upload signed enrollment agreements to the right students</h2></div><span className="badge">{existingAgreementCount} verified agreements</span></div>
   <p className="muted">Select PDF enrollment agreements (up to 10 MB each). For each file, choose the correct student manually—never match only by first name. Names like Anthony can occur more than once. The upload is encrypted and attached to that student's record, then requires a separate verification.</p>
   <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple ref={fileInput} onChange={e=>pickFiles(e.currentTarget.files)} disabled={demo||uploading}/>
   {!!files.length&&<div className="intake-file-queue"><h3>{files.length} agreement file(s) selected</h3>{files.map((r,i)=><div key={i} className="intake-file-row"><div><b>{r.file.name}</b><small>{Math.round(r.file.size/1024)} KB · {r.state}{r.message?' · '+r.message:''}</small></div>
    <label>Correct student<select value={r.studentId} disabled={r.state==='Uploaded'||uploading} onChange={e=>assign(i,e.target.value)}><option value="">Select and verify identity</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} · {s.studentNumber||'No student ID'} · {s.cohort||''}</option>)}</select></label></div>)}</div>}
   {!!files.length&&<><label className="checkboxlabel"><input type="checkbox" checked={fileConfirm} onChange={e=>setFileConfirm(e.target.checked)}/> I verified that each document belongs to the selected student and that it is appropriate to store it in the restricted school vault.</label>
    <button className="primary" disabled={busy||demo||uploading||invalidCount>0||!fileConfirm||!files.some(f=>f.state==='Pending')} onClick={uploadFiles}><Upload size={17}/>{uploading?'Uploading private agreements…':'Encrypt and attach '+files.filter(f=>f.state==='Pending').length+' agreement(s)'}</button></>}
   {fileNotice&&<p className="notice" role="status">{fileNotice}</p>}
   <div className="intake-next"><AlertTriangle size={21}/><div><b>Final compliance step:</b> Uploaded does not mean verified. Open <button type="button" onClick={()=>onPage('document-center')}>Secure Document Vault</button>, select each student, review the signed agreement and click Verify. Only verified agreements may appear in the North Carolina DMV roster packet. No email or SMS delivery is triggered.</div></div>
  </section>
 </div>;
}
