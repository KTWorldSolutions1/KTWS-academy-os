'use client';
import {useState} from 'react';
import {instructionHours,type RecordData as R} from '../lib/training';
import {classEnding,proposedBiweeklyStarts,FUNDING_TYPES,rosterGaps} from '../lib/compliance-roster';
import {CalendarDays,Download,FileCheck2,ShieldCheck,AlertTriangle} from 'lucide-react';
import {previewDmvCsv,previewBasicCohortCsv,previewStudentReconciliationCsv} from '../lib/roster-import';
type Props={records:R[];role:string;demo:boolean;busy:boolean;saveMany:(rows:R[])=>Promise<boolean>};
export default function ComplianceRosters({records,role,demo,busy,saveMany}:Props){
 const campuses=records.filter(c=>c.kind==='campuses'&&c.status==='Active');
 const [selectedCampus,setSelectedCampus]=useState(''),[selectedClass,setSelectedClass]=useState(''),[preview,setPreview]=useState<any>(null),[loading,setLoading]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const campus=campuses.find(c=>c.id===selectedCampus)||campuses[0];
 const classes=records.filter(c=>c.kind==='classes'&&c.campusId===campus?.id).sort((a,b)=>String(b.startDate||'').localeCompare(String(a.startDate||'')));
 const klass=classes.find(c=>c.id===selectedClass)||classes[0];
 const students=records.filter(s=>s.kind==='students'&&s.classId===klass?.id&&s.campusId===campus?.id&&s.status!=='Withdrawn');
 const canManage=['Owner','Regional admin','Campus manager'].includes(role);
 const [reconcilePreview,setReconcilePreview]=useState<ReturnType<typeof previewStudentReconciliationCsv>|null>(null);
 const [reconcileError,setReconcileError]=useState(''),[reconcileSaving,setReconcileSaving]=useState(false),[reconcileConfirmed,setReconcileConfirmed]=useState(false);
 async function previewReconcile(file:File|undefined){
  setReconcileError('');setReconcilePreview(null);setReconcileConfirmed(false);
  if(!file)return;if(file.size>250000){setReconcileError('Maximum CSV file size 250 KB.');return;}
  try{setReconcilePreview(previewStudentReconciliationCsv(await file.text()));}
  catch(e:any){setReconcileError(e.message||'Invalid update CSV');}
 }
 async function saveReconciliation(){
  if(!reconcilePreview||!reconcileConfirmed||!campus||!klass||!canManage||demo)return;
  setReconcileError('');setReconcileSaving(true);
  try{
   if(!/greensboro/i.test(campus.name||'')||klass.startDate!=='2026-11-02'||klass.program!=='Class A')throw Error('Select the Greensboro Class A November 2, 2026 cohort before updating.');
   const original=records.filter(r=>r.kind==='students'&&r.campusId===campus.id&&r.classId===klass.id);
   const normalize=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]/g,'');
   const updates:R[]=[];
   for(const candidate of reconcilePreview.candidates){
    const match=original.filter(r=>r.studentNumber===candidate.studentNumber);
    if(match.length!==1)throw Error('Student ID '+candidate.studentNumber+' is not uniquely present in this cohort. No changes saved.');
    const student=match[0];
    if(normalize(student.name)!==normalize(candidate.name))throw Error('Name/ID mismatch for '+candidate.studentNumber+'. No changes saved. Review legal spelling.');
    const r:R={...student};
    for(const field of ['phone','email','address','city','state','zip'] as const){
     if(candidate[field]&&!String(r[field]||'').trim())r[field]=candidate[field];
    }
    if(candidate.fundingType)r.fundingType=candidate.fundingType==='SELF-PAY'?'Cash':candidate.fundingType==='VOCATIONAL REHABILITATION'?'Vocational Rehabilitation':candidate.fundingType==='EMPLOYER-SPONSORED'?'Employer-sponsored':candidate.fundingType;
    if(candidate.status)r.status=candidate.status;
    if(candidate.registrationStatus)r.registrationStatus=candidate.registrationStatus;
    if(candidate.reportedClassroomHours!==null){
     r.reportedClassroomHours=candidate.reportedClassroomHours;
     r.reportedClassroomHoursStatus='Pending instructor log verification';
     r.reportedClassroomHoursSource='Campus manager-reported prior classroom hours; does not replace daily attendance or ELDT evidence';
    }
    updates.push(r);
   }
   const ok=await saveMany(updates);
   if(!ok)throw Error('School rejected reconciliation; read the red school error at top for details.');
   setMessage('Updated '+updates.length+' student profiles. Funding and stage saved; 40 reported classroom hours remain pending instructor attendance verification.');
   setReconcilePreview(null);setReconcileConfirmed(false);
  }catch(e:any){setReconcileError(e.message||'Unable to reconcile existing students');}
  finally{setReconcileSaving(false);}
 }
 const [hoursConfirmed,setHoursConfirmed]=useState(false);
 const [hoursSaving,setHoursSaving]=useState(false);
 async function saveReported40(){
  setError('');setMessage('');
  if(!canManage||demo||!campus||!klass)return;
  if(!/greensboro/i.test(campus.name||'')||klass.startDate!=='2026-11-02'||klass.program!=='Class A'){setError('This action is available only for the Greensboro November 2 Class A cohort.');return;}
  if(students.length!==11){setError('Expected exactly 11 existing students, but found '+students.length+'. Review class assignment before applying hours.');return;}
  if(!hoursConfirmed){setError('Review and confirm that all 11 students attended the reported hours.');return;}
  const updates:R[]=students.map(student=>({
   ...student,
   reportedClassroomHours:40,
   reportedClassroomHoursStatus:'Pending instructor log verification',
   reportedClassroomHoursSource:'Campus management-reported prior classroom attendance; not yet backed by dated signed instructor logs',
  }));
  setHoursSaving(true);
  try{
   const ok=await saveMany(updates);
   if(!ok)throw Error('The school did not save the updates. Check the red system error for the specific reason.');
   setMessage('40 reported classroom hours saved to all 11 Greensboro November 2 profiles, pending instructor verification. Refresh Student Records and Attendance to check. No verified instruction logs were generated.');
   setHoursConfirmed(false);
  }catch(e:any){setError(e.message||'Could not save classroom hour reports.');}
  finally{setHoursSaving(false);}
 }
 const [importPreview,setImportPreview]=useState<ReturnType<typeof previewDmvCsv>|ReturnType<typeof previewBasicCohortCsv>|null>(null);
 const [importError,setImportError]=useState('');
 const [importSaving,setImportSaving]=useState(false);
 const [confirmImport,setConfirmImport]=useState(false);
 async function saveImportedStudents(){
  if(!importPreview||!campus||!klass||!confirmImport||!canManage||demo)return;
  setImportError('');setImportSaving(true);
  try{
   if(!/greensboro/i.test(campus.name||''))throw Error('Select the Greensboro campus for this roster.');
   if(klass.program!=='Class A')throw Error('Choose a Class A cohort.');
   if(importPreview.candidates.some(s=>s.startDate&&s.startDate!==klass.startDate||s.endDate&&s.endDate!==klass.endDate))
    throw Error('Roster dates do not match the selected class. Verify the correct cohort first.');
   const normalized=(name:string)=>name.trim().replace(/\s+/g,' ').toLowerCase();
   const existing=records.filter(r=>r.kind==='students'&&r.campusId===campus.id);
   const duplicates=importPreview.candidates.filter(s=>existing.some(r=>normalized(r.name)===normalized(s.name)));
   if(duplicates.length)throw Error('Students already exist at Greensboro: '+duplicates.map(x=>x.name).join(', ')+'. Review them before importing to prevent duplicate accounts.');
   const currentCount=records.filter(r=>r.kind==='students'&&r.classId===klass.id&&r.status!=='Withdrawn').length;
   if(currentCount+importPreview.count>Number(klass.capacity||0))throw Error('The selected class does not have enough seats. Adjust its approved class capacity first.');
   const rows:R[]=importPreview.candidates.map(s=>({
    id:crypto.randomUUID(),kind:'students',name:s.name,campusId:campus.id,classId:klass.id,
    cohort:klass.name,program:'Class A',status:'Enrollment pending',phone:s.phone,email:('email' in s?String(s.email||''):''),
    licenseNumber:s.licenseNumber,driverLicenseState:s.licenseState,dob:s.dob,address:s.address,city:s.city,state:s.state,zip:s.zip,
    startDate:klass.startDate,finishDate:klass.endDate,studentNumber:('studentNumber' in s?String(s.studentNumber||''):'') ,sessions:[],assessments:[],evaluations:[],
    documents:[],notes:[],
    fundingStatus:'Not verified',registrationStatus:'Needs administrative review',targetTheory:50,targetYard:50,targetRoad:60
   }));
   const okay=await saveMany(rows);
   if(!okay)throw Error('The record save was declined. Read the red error message at the top of Academy OS for the exact validation failure. No enrollment agreement or document request is issued by this import.');
   setMessage('Saved '+rows.length+' actual Greensboro student profiles under '+klass.name+'. Training hours, CLPs, funding and enrollment agreements remain unverified. Open Enrollment Forms & Files to request agreements through the audited document center. Open Student Records to manage statuses and upload agreements.');
   setImportPreview(null);setConfirmImport(false);
  }catch(e:any){setImportError(e.message||'Import failed');}
  finally{setImportSaving(false);}
 }
 async function previewImport(file:File|undefined){
  setImportError('');setImportPreview(null);
  if(!file)return;
  if(file.size>250_000){setImportError('File too large. Choose a CSV smaller than 250 KB.');return;}
  try{const raw=await file.text();const header=raw.split(/\r?\n/,1)[0].toUpperCase();if(header.includes('FUNDING_TYPE')||header.includes('REPORTED_CLASSROOM_HOURS')||header.includes('REGISTRATION_STATUS')){setReconcilePreview(previewStudentReconciliationCsv(raw));setReconcileConfirmed(false);setMessage('This is an EXISTING student update CSV. It was routed to “Update November 2 student profiles” below. Confirm the correct class and use the Update button there; do not import these students again.');return;}const preview=header.includes('DL_NUMBER')?previewDmvCsv(raw):previewBasicCohortCsv(raw);setImportPreview(preview);}
  catch(e:any){setImportError(e.message||'Invalid CSV');}
 }
 async function audit(){
  if(!klass)return;
  if(demo){const gaps=students.map(s=>({studentId:s.id,name:s.name,gaps:rosterGaps(s,klass)}));setPreview({count:students.length,ready:students.length>0&&gaps.every(s=>!s.gaps.length),draft:true,students:gaps,note:'Demo-only preflight; no protected files exported or submitted.'});setError('');return;}
  setLoading(true);setError('');setPreview(null);
  try{const r=await fetch('/api/compliance/roster?classId='+encodeURIComponent(klass.id),{cache:'no-store'}),body=await r.json();if(!r.ok)throw Error(body.error||'Roster review unavailable');setPreview(body);}
  catch(e:any){setError(e.message);}finally{setLoading(false);}
 }
 async function createGreensboroNov2(){
  if(!canManage||demo)return;
  const g=campuses.find(c=>/greensboro/i.test(c.name||'')||/greensboro/i.test(c.city||''));
  if(!g){setError('An active Greensboro campus must be configured under Campus Locations before creating its class.');return;}
  const existing=records.find(c=>c.kind==='classes'&&c.campusId===g.id&&c.program==='Class A'&&c.startDate==='2026-11-02');
  setSelectedCampus(g.id);
  if(existing){setSelectedClass(existing.id);setMessage('Greensboro November 2 class selected. Upload your roster below.');return;}
  const row:R={id:crypto.randomUUID(),kind:'classes',campusId:g.id,name:'Greensboro Class A • November 2, 2026',
    status:'In progress',program:'Class A',startDate:'2026-11-02',endDate:classEnding('2026-11-02'),capacity:11,
    schedule:'Monday–Friday 7:00 AM–4:00 PM · Five-week Class A program · Week 5 testing',
    theoryHours:50,yardHours:50,roadHours:60,pricingStatus:'Verify each student funding authorization'};
  setError('');setMessage('');
  const ok=await saveMany([row]);
  if(ok){setSelectedClass(row.id);setMessage('Greensboro November 2 class created with 11 proposed seats. Upload the roster in the section below.');}
  else setError('Class creation was rejected. Check the school error above or review classes and campus permissions.');
 }
 async function setSelectedClassHours(){
  if(!canManage||demo||!klass||klass.program!=='Class A')return;
  setError('');setMessage('');
  if(!window.confirm('Set the selected Class A class schedule to Monday–Friday, 7:00 AM–4:00 PM? This changes the class schedule only, not student attendance or verified hours.'))return;
  const schedule='Monday–Friday 7:00 AM–4:00 PM · Five-week Class A program · Week 5 testing';
  const ok=await saveMany([{...klass,schedule,scheduledStart:'07:00',scheduledEnd:'16:00',scheduledBreakMinutes:60}]);
  if(ok)setMessage('Class schedule updated to 7:00 AM–4:00 PM. No attendance or training hours were generated.');
  else setError('Could not save the selected class hours. Review the school error.');
 }
 async function createDates(){
  if(!campus)return;
  setError('');setMessage('');
  const dates=proposedBiweeklyStarts('2026-11-16',16);
  const existing=new Set(classes.map(c=>c.startDate+'|'+c.program));
  const starts=[...(campus.name.toLowerCase().includes('greensboro')&&!existing.has('2026-11-02|Class A')?['2026-11-02']:[]),...dates.filter(d=>!existing.has(d+'|Class A'))];
  const missing=starts.map(startDate=>({
   id:crypto.randomUUID(),kind:'classes',campusId:campus.id,name:'Class A • '+startDate,
   status:'Open for enrollment',program:'Class A',startDate,endDate:classEnding(startDate),
   schedule:'Monday–Friday 7:00 AM–4:00 PM • Five-week program • Week 5 testing',capacity:startDate==='2026-11-02'?11:8,tuition:'',pricingStatus:'Pending campus-approved tuition and funding terms',
   theoryHours:50,yardHours:50,roadHours:60,fundingOptions:[...FUNDING_TYPES],
   schedulingNote:'Proposed two-week start cadence; verify staffing, fleet availability, state approval, holidays and training calendar.'
  }));
  if(!missing.length){setMessage('These biweekly Class A start dates are already configured.');return;}
  if(await saveMany(missing))setMessage('Created '+missing.length+' proposed biweekly class dates. Review calendars and capacity before accepting students.');
  else setError('Could not save proposed class dates.');
 }
 return <div className="compliance-rosters"><section className="panel"><div className="sectionhead"><div><p className="eyebrow">REGULATORY REPORTS • LIMITED ACCESS</p><h2>First-day class rosters & enrollment agreements</h2><p className="muted">NC 19A NCAC 03J .0308 requires a roster as of the first day of class and copies of each student's signed contracts. Academy OS prepares a restricted ZIP packet containing the roster CSV and actual verified enrollment agreements. No automatic NCDMV submission is performed.</p></div><ShieldCheck size={26}/></div>
 {!demo&&canManage&&<div className="reportactions"><button type="button" className="primary" disabled={busy} onClick={()=>void createGreensboroNov2()}><CalendarDays size={16}/> Create or select Greensboro · Nov 2 class (11 students)</button></div>}
 {canManage&&klass&&klass.program==='Class A'&&<button type="button" disabled={busy||demo} onClick={()=>void setSelectedClassHours()}>Set selected class schedule to 7:00 AM–4:00 PM (no attendance changes)</button>}
 <div className="formgrid"><label>Campus<select value={campus?.id||''} onChange={e=>{setSelectedCampus(e.target.value);setSelectedClass('');setPreview(null);}}>{campuses.map(c=><option value={c.id} key={c.id}>{c.name}{c.state?' • '+c.state:''}</option>)}</select></label><label>Class/select roster<select value={klass?.id||''} onChange={e=>{setSelectedClass(e.target.value);setPreview(null);}}>{!classes.length&&<option value="">No scheduled classes</option>}{classes.map(c=><option key={c.id} value={c.id}>{c.name} • {c.startDate||'Start pending'}</option>)}</select></label></div>
 {klass&&<div className="curriculum-metrics"><div><strong>{students.length}</strong><small>Students assigned to the class</small></div><div><strong>{klass.startDate||'—'}</strong><small>Class start date</small></div><div><strong>{klass.endDate||'—'}</strong><small>Class end date</small></div><div><strong>{klass.capacity||'—'}</strong><small>Planned capacity</small></div></div>}
 <div className="reportactions"><button disabled={!klass||busy||loading||!canManage} onClick={audit}><FileCheck2 size={16}/> Check first-day packet readiness</button>
 <button disabled={!klass||busy||demo||!canManage||!preview?.ready||preview.draft} className="primary" onClick={()=>{if(!klass||!window.confirm('This download contains unredacted DOBs, driver license numbers, addresses and signed contracts. Store and deliver only through the approved secure compliance channel. Continue?'))return;window.location.assign('/api/compliance/roster?download=1&classId='+encodeURIComponent(klass.id));}}><Download size={16}/> Download restricted compliance ZIP</button></div>
 {demo&&<p className="notice">Sample-mode students are fictional. Run the roster readiness check to see sample missing fields and contracts. Actual signed-agreement downloads and DMV submissions are disabled in demo mode.</p>}
 {preview&&<><p className={preview.ready?'notice':'error'}>{preview.ready?'All '+preview.count+' class records passed the packet preflight check.':'Missing data or agreements must be resolved before generating the packet.'}</p>{preview.draft&&<p className="notice">Before the class start date this is a planning preview; verify who is actually enrolled on the first instructional day before issuing the final report.</p>}
 {preview.students?.map((s:any)=><div className="vault-doc-row" key={s.studentId}><div><b>{s.name}</b><small>{s.gaps?.length?s.gaps.join(' • '):'Roster and signed agreement verified'}</small></div><span className={'badge '+(s.gaps?.length?'warn':'good')}>{s.gaps?.length?'Needs review':'Ready'}</span></div>)}</>}
 {!klass&&<p className="muted">Create a class from the calendar or add proposed class dates below.</p>}
 {message&&<p className="notice">{message}</p>}{error&&<p className="error" role="alert">{error}</p>}
 <p className="footnote">Regulatory roster fields: legal name, driver license number, postal address, telephone and enrollment agreement(s); school-requested extras: DOB, class dates and funding type. SSNs and drug screening records are deliberately excluded. Do not transmit unencrypted ZIPs over ordinary email. Texas reports need a separate Texas-specific approval and template.</p></section>
 <section className="panel"><div className="sectionhead"><div><p className="eyebrow">SECURE ROSTER INTAKE • LOCAL PREVIEW</p><h2>Create NEW students from an enrollment CSV</h2><p className="notice">Already imported the class? Do NOT use this creation step again. Use “Update existing student profiles” below instead.</p><p className="muted">Select your enrollment spreadsheet exported as CSV. Use either a full DMV roster CSV or a roster with FIRST_NAME,LAST_NAME,STUDENT_ID and optional PHONE,EMAIL,ADDRESS,CITY,STATE,ZIP columns. Review locally first, then explicitly save approved profiles under the selected campus and class. Unverified compliance fields stay blank.</p></div><ShieldCheck size={25}/></div>
 {canManage?<label>Choose CSV to create new students<input type="file" accept=".csv,text/csv" onChange={e=>{void previewImport(e.target.files?.[0]);e.currentTarget.value='';}}/></label>:<p className="muted">Only the Owner, Regional admin or Campus manager can inspect a roster.</p>}
 {importError&&<p className="error" role="alert">{importError}</p>}
 {importPreview&&<div role="status"><p className="notice">{importPreview.count} student rows checked. {importPreview.dates.length?'Roster dates: '+importPreview.dates.join(', '):'Basic name-and-school-ID roster · assigned to the class selected above'}.</p>
 <p className="muted">This file is parsed in your browser. Choose the correct Greensboro class above; the Save button submits records through the authenticated, campus-restricted school record API. Signed agreements must still be uploaded separately in the protected document vault after storage recovery approval.</p>
 {!demo&&canManage&&<div className="vault-upload"><p><b>Save these students into the real school</b></p>
 <p className="muted">Selected campus: {campus?.name||'None'} · Class: {klass?.name||'None'} · Start: {klass?.startDate||'Not set'} · Class capacity: {klass?.capacity||'Not set'}</p>
 <label className="checkboxlabel"><input type="checkbox" checked={confirmImport} onChange={e=>setConfirmImport(e.target.checked)}/> I reviewed the class and understand that newly imported students begin with no verified attendance, documents, permits, funding or graduation.</label>
 <button type="button" className="primary" disabled={!confirmImport||!klass||busy||importSaving} onClick={()=>void saveImportedStudents()}>{importSaving?'Saving student profiles…':'Save '+importPreview.count+' students to selected class'}</button>
 </div>}
 {demo&&<p className="notice">Leave sample/demo mode to import real students.</p>}
 {importPreview.warnings.map((w,i)=><p key={i} className="muted"><AlertTriangle size={14}/> {w}</p>)}
 <p className="footnote">Candidate records stay only in this open page's memory. Closing or refreshing clears them; no download or background sync occurs. Do not use browser developer tools or screenshots to share sensitive entries.</p></div>}
 </section>
 <section className="panel"><div className="sectionhead"><div><p className="eyebrow">NOVEMBER 2 COHORT · REPORTED HOURS AUDIT</p><h2>40 classroom hours — pending verification</h2><p className="muted">Shows the actual saved reported-hour field, alongside the verified attendance total. A blank or zero reported field means the last student update was not saved; do not infer it from the class start date. This is not FMCSA training evidence.</p></div><FileCheck2 size={24}/></div>
 <p className="notice">Selected class: {klass?.name||'None'} · {students.length} saved students · {students.filter(s=>Number(s.reportedClassroomHours||0)===40).length} have 40 reported hours recorded · {students.filter(s=>Number(s.reportedClassroomHours||0)!==40).length} still missing that entry.</p>
 <div className="tablewrap"><table><thead><tr><th>Student</th><th>Reported classroom hours</th><th>Instructor-verified hours</th><th>Status</th></tr></thead><tbody>
 {students.map(s=><tr key={s.id}><td>{s.name}</td><td>{Number(s.reportedClassroomHours||0)>0?Number(s.reportedClassroomHours)+' h (pending)':'Not saved'}</td><td>{instructionHours(s,'Classroom')} h verified from recorded sessions</td><td>{s.status}</td></tr>)}
 </tbody></table></div>
 {canManage&&!demo&&<><label className="checkboxlabel"><input type="checkbox" checked={hoursConfirmed} onChange={e=>setHoursConfirmed(e.target.checked)}/> I confirm campus management has a basis for reporting 40 prior classroom hours for each of these 11 students. This is not a verified attendance or ELDT certification entry.</label>
 <button type="button" disabled={hoursSaving||busy||!hoursConfirmed||students.length!==11||klass?.startDate!=='2026-11-02'||klass?.program!=='Class A'} onClick={()=>void saveReported40()}>{hoursSaving?'Saving reported hours…':'Save 40 reported hours to these 11 existing student profiles'}</button></>}
 {error&&<p className="error" role="alert">{error}</p>}
 </section>
 <section className="panel"><div className="sectionhead"><div><p className="eyebrow">EXISTING STUDENTS · CORRECT PROFILE DATA</p>
 <h2>ALREADY ENROLLED? Update existing student profiles here</h2><p className="muted">Use the November 2 student profile UPDATE file here, not in the new-student import box above. It matches students by school ID and updates funding, contact details and enrollment/permit status without creating duplicates. Reported classroom hours are kept separate from verified instructor attendance logs.</p></div><FileCheck2 size={24}/></div>
 {canManage&&<label>Choose student update CSV<input type="file" accept=".csv,text/csv" disabled={reconcileSaving} onChange={e=>{void previewReconcile(e.target.files?.[0]);e.target.value='';}}/></label>}
 {reconcileError&&<p className="error" role="alert">{reconcileError}</p>}
 {reconcilePreview&&<><p className="notice">{reconcilePreview.count} students in update file. Selected class: {klass?.name||'None'}. This will update existing records only.</p>
 {reconcilePreview.candidates.map(x=><div className="vault-doc-row" key={x.studentNumber}><div><b>{x.name} · ID {x.studentNumber}</b><small>{x.fundingType||'Funding not specified'} · {x.registrationStatus||'No registration update'} · {x.status||'No stage update'} · {x.reportedClassroomHours===null?'No hours update':x.reportedClassroomHours+' hours reported (unverified)'}</small></div></div>)}
 <label className="checkboxlabel"><input type="checkbox" checked={reconcileConfirmed} onChange={e=>setReconcileConfirmed(e.target.checked)}/> I verified the student ID matches, cohort, funding and the reported hours; no attendance or graduation evidence will be fabricated.</label>
 <button type="button" className="primary" onClick={()=>void saveReconciliation()} disabled={demo||busy||reconcileSaving||!reconcileConfirmed}>{reconcileSaving?'Updating records…':'Update '+reconcilePreview.count+' existing student profiles'}</button></>}
 <p className="footnote">Missing contact details are filled, not overwritten. Funding left blank means leave the prior value unchanged. Classroom-hour statements are administrative claims until dated instructor logs are entered and audited.</p>
 </section>
 <section className="panel"><div className="sectionhead"><div><p className="eyebrow">ADMISSIONS PLANNING</p><h2>Class start calendar • every two weeks</h2><p className="muted">Greensboro includes the November 2, 2026 cohort for the existing class; new Class A starts begin Monday, November 16, 2026 and repeat every 14 days. Dates are proposals, not a promise that a campus has available instructors, trucks or approved capacity. Five-week end dates assume a Monday start and Friday of Week 5.</p></div><CalendarDays size={25}/></div>
 <div className="biweekly-grid">{proposedBiweeklyStarts('2026-11-16',16).map(d=><div className="biweekly-date" key={d}><b>{d}</b><small>Testing week ends {classEnding(d)}</small><span className="badge">{classes.some(c=>c.startDate===d&&c.program==='Class A')?'Configured':'Proposed'}</span></div>)}</div>
 <button disabled={busy||!canManage||!campus||demo} onClick={createDates} className="primary">Add missing biweekly start dates to this campus</button>
 <p className="footnote">The November 2 Greensboro class is created with 11 proposed seats; new classes default to 8 planning seats. Confirm approved instructional capacity before enrolling. Each class supports cash, WIOA, WRLP, Vocational Rehabilitation, scholarships, employer-funded training and an additional outside-funding category. Authorization, funding amounts and approval still require their own verified records.</p></section></div>;
}
