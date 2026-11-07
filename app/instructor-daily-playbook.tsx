'use client';
import {useEffect,useMemo,useState} from 'react';
import {BookOpen,CalendarDays,CheckCircle2,ClipboardCheck,FileText,ShieldCheck,Upload,AlertTriangle} from 'lucide-react';
import {DRIVER_TRAINING_DAYS,ALL_FEDERAL_CODES,dayFromDate,reviewProgress,type StepResult} from '../lib/driver-training-plan';
import {activeSessions,duration,today,type RecordData as R} from '../lib/training';
import {DAILY_LOG_CATEGORY} from '../lib/student-documents';

type Props={records:R[];role:string;demo:boolean;busy:boolean;saveMany:(updates:R[])=>Promise<boolean>};
type LogProof={key:string;name:string;category:string;uploadedAt:string;verified?:boolean;demoOnly?:boolean};
const choices:StepResult[]=['Not covered','Reviewed','Student explains','Performed with coaching','Discussed','Needs practice'];
const clock=(hour:number)=>String(hour).padStart(2,'0')+':00';
export default function InstructorDailyPlaybook({records,role,demo,busy,saveMany}:Props){
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const [campusId,setCampusId]=useState(''),[classId,setClassId]=useState(''),[studentId,setStudentId]=useState(''),[dayNumber,setDayNumber]=useState(1);
 const [results,setResults]=useState<Record<string,StepResult>>({}),[notes,setNotes]=useState(''),[nextSteps,setNextSteps]=useState(''),[reviewDate,setReviewDate]=useState(today());
 const [phase,setPhase]=useState('Classroom'),[start,setStart]=useState('08:00'),[end,setEnd]=useState('12:00'),[breakMinutes,setBreakMinutes]=useState(0),[mode,setMode]=useState('Instruction'),[instructor,setInstructor]=useState(''),[nightHours,setNightHours]=useState(0),[nightEvidence,setNightEvidence]=useState(''),[attendance,setAttendance]=useState('Present');
 const [docFile,setDocFile]=useState<File|null>(null),[logFiles,setLogFiles]=useState<LogProof[]>([]),[message,setMessage]=useState(''),[error,setError]=useState('');
 const campus=campuses.find(x=>x.id===campusId)||campuses[0];
 const classes=records.filter(x=>x.kind==='classes'&&x.campusId===campus?.id&&x.program==='Class A');
 const chosenClass=classes.find(x=>x.id===classId)||classes[0];
 const students=records.filter(x=>x.kind==='students'&&x.campusId===campus?.id&&x.program==='Class A'&&(!chosenClass||x.classId===chosenClass.id));
 const student=students.find(x=>x.id===studentId)||students[0];
 const day=DRIVER_TRAINING_DAYS[dayNumber-1];
 const progress=student?reviewProgress(records,student):null;
 const reviews=records.filter(x=>x.kind==='daily-lesson-reviews'&&x.studentId===student?.id&&x.day===dayNumber).sort((a,b)=>String(b.recordedAt||b.date).localeCompare(String(a.recordedAt||a.date)));
 const superseded=new Set(reviews.map(x=>x.correctionOf).filter(Boolean));
 const latest=reviews.find(x=>!superseded.has(x.id));
 const existingDaySessions=student?activeSessions(student).filter(x=>x.date===reviewDate):[];
 const loggedMinutes=existingDaySessions.reduce((n,s)=>n+Math.round(Number(s.hours||0)*60),0);
 const completed=day.steps.filter(step=>results[step.id]&&results[step.id]!=='Not covered').length;
 const missing=day.steps.filter(step=>!results[step.id]||results[step.id]==='Not covered').length;
 const weak=day.steps.filter(step=>results[step.id]==='Needs practice');
 const allowed=['Owner','Regional admin','Campus manager','Instructor'].includes(role);
 useEffect(()=>{const index=dayFromDate(chosenClass?.startDate||'',today());if(index)setDayNumber(index);},[chosenClass?.id]);
 useEffect(()=>{
  setResults(Object.fromEntries(day.steps.map(s=>[s.id,latest?.results?.[s.id]||'Not covered'])));
  setNotes(latest?.notes||'');setNextSteps(latest?.nextSteps||'');setReviewDate(today());setMessage('');setError('');
  setPhase(day.phase==='Combined'?'Yard':day.phase);setMode('Instruction');
 },[student?.id,dayNumber,latest?.id]);
 useEffect(()=>{
  let active=true;const controller=new AbortController();
  (async()=>{
   if(!student){setLogFiles([]);return;}
   if(demo){if(active)setLogFiles((student.documents||[]).filter((d:LogProof)=>d.category===DAILY_LOG_CATEGORY));return;}
   try{const url='/api/files?list=1&campusId='+encodeURIComponent(student.campusId)+'&studentId='+encodeURIComponent(student.id)+'&category='+encodeURIComponent(DAILY_LOG_CATEGORY);
    const res=await fetch(url,{signal:controller.signal,cache:'no-store'});const payload=await res.json();
    if(active)setLogFiles(res.ok?(payload.files||[]):[]);
   }catch{if(active)setLogFiles([]);}
  })();
  return()=>{active=false;controller.abort();};
 },[student?.id,student?.documents,records.length,demo]);
 const evaluated=useMemo(()=>new Set((student?.evaluations||[]).filter((e:any)=>e.level==='Proficient'&&e.signed).map((e:any)=>e.skill)),[student?.evaluations]);
 if(!allowed)return <div className="panel">This instructor guide is only available to school instructors and authorized management.</div>;
 function resetError(){setMessage('');setError('');}
 async function storeReview(){
  resetError();if(!student)return;
  if(day.steps.some(step=>!choices.includes(results[step.id]))){setError('A response is required for every lesson item, including “Not covered”.');return;}
  if(notes.trim().length<12){setError('Enter a meaningful student-specific observation (at least 12 characters).');return;}
  if(weak.length&&!nextSteps.trim()){setError('Name the next coaching action for each skill needing practice.');return;}
  const review:R={id:crypto.randomUUID(),kind:'daily-lesson-reviews',name:student.name+' — Day '+dayNumber+' · '+day.heading,status:weak.length||missing?'Needs follow-up':'Reviewed',program:'Class A',
   studentId:student.id,day:dayNumber,week:day.week,phase:day.phase,date:reviewDate,campusId:student.campusId,results,notes:notes.trim(),nextSteps:nextSteps.trim(),...(latest?{correctionOf:latest.id}:{})};
  if(await saveMany([review]))setMessage((latest?'Corrected':'Recorded')+' student Day '+dayNumber+' review. Covered '+completed+'/'+day.steps.length+' steps. No instructional hours or official proficiency were granted.');
  else setError('Review could not be saved. Check the school message above.');
 }
 async function saveHours(){
  resetError();if(!student)return;
  if(!instructor.trim()){setError('Enter the actual instructor’s name.');return;}
  if(phase==='Road'&&mode==='Student driving'&&nightHours>0&&nightEvidence.trim().length<10){setError('Actual night-driving time requires route, time and dusk-to-dawn evidence.');return;}
  if(phase==='Road'&&mode==='Student driving'&&!window.confirm('Confirm the student actually operated the Class A truck during this time. This record is auditable.'))return;
  const hours=['Absent','Excused'].includes(attendance)?0:duration(start,end,breakMinutes);
  if(hours<0||hours>12||(!['Absent','Excused'].includes(attendance)&&hours<=0)){setError('Enter valid actual hours after subtracting breaks.');return;}
  const next:R={...student,sessions:[...(student.sessions||[]),{id:crypto.randomUUID(),date:reviewDate,phase,mode,
   attendance,start,end,breakMinutes,hours,instructor:instructor.trim(),mood:'green',skill:day.heading,
   notes:'Daily training linked to Lone Star Day '+dayNumber+'. '+(notes.trim()||'Instructor-supervised training; see daily review.'),
   studentOperatedVehicle:phase==='Road'&&mode==='Student driving',nightDrivingHours:phase==='Road'&&mode==='Student driving'?nightHours:0,
   ...(nightHours>0?{nightDrivingEvidence:nightEvidence.trim()}:{})}]};
  if(await saveMany([next]))setMessage('Actual training entry saved: '+hours.toFixed(2)+' hour(s) for '+student.name+'. Confirm that a signed daily log is also retained.');
  else setError('Daily hours could not be saved; check for overlapping sessions or invalid road categories.');
 }
 async function uploadLog(){
  resetError();if(!student||!docFile)return;
  if(demo){
   const fictional:LogProof={key:'demo-scan-'+crypto.randomUUID(),name:'DEMO_'+docFile.name,category:DAILY_LOG_CATEGORY,uploadedAt:new Date().toISOString(),verified:false,demoOnly:true};
   if(await saveMany([{...student,documents:[...(student.documents||[]),fictional]}])){setDocFile(null);setMessage('Simulated daily-log upload saved in this browser session only. No file bytes were transmitted.');}
   return;
  }
  const form=new FormData();form.set('studentId',student.id);form.set('category',DAILY_LOG_CATEGORY);form.set('file',docFile);
  try{const res=await fetch('/api/files',{method:'POST',body:form}),out=await res.json();if(!res.ok)throw Error(out.error||'Secure upload failed');
   setDocFile(null);setMessage('Signed daily training log received in encrypted school file storage. File is available to authorized campus staff.');
   setLogFiles(prev=>[{...out},...prev]);
  }catch(e:any){setError(e.message||'Secure upload unavailable. Keep the original paper log until resolved.');}
 }
 return <div className="driver-playbook">
 <section className="panel"><div className="sectionhead"><div><p className="eyebrow">ACADEMY STANDARD · CLASS A</p><h2>Instructor daily training playbook</h2><p className="muted">Twenty-five proposed instruction days, every standard federal Class A theory, range and road subject, and each student’s individual improvement record. All checkoffs require actual instruction; performance badges alone do not signify an ELDT proficiency certification.</p></div><BookOpen size={26}/></div>
 <div className="formgrid">
 <label>Campus<select value={campus?.id||''} onChange={e=>{setCampusId(e.target.value);setClassId('');setStudentId('');}}>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label>Class / cohort<select value={chosenClass?.id||''} onChange={e=>{setClassId(e.target.value);setStudentId('');}}>{classes.map(c=><option key={c.id} value={c.id}>{c.name} · {c.startDate}</option>)}</select></label>
 <label>Student<select value={student?.id||''} onChange={e=>setStudentId(e.target.value)}>{students.map(s=><option key={s.id} value={s.id}>{s.name} · {s.status}</option>)}</select></label>
 <label>Training day<select value={dayNumber} onChange={e=>setDayNumber(Number(e.target.value))}>{DRIVER_TRAINING_DAYS.map(d=><option key={d.day} value={d.day}>Week {d.week} · Day {d.day} · {d.weekday} — {d.phase}</option>)}</select></label>
 </div>
 <div className="driver-kpis"><div><strong>{progress?.daysReviewed||0}/25</strong><small>Days with an instructor review</small></div><div><strong>{progress?.federalTopicsTouched||0}/{ALL_FEDERAL_CODES.length}</strong><small>Federal subjects taught / discussed (not yet certified)</small></div><div><strong>{progress?.openGaps.length||0}</strong><small>Subjects flagged for reteaching</small></div><div><strong>{logFiles.length}</strong><small>Scanned daily training log files</small></div></div>
 {student&&<p className="notice"><ShieldCheck size={17}/> {student.name} · {student.status} · {campus?.name} · {progress?.federalTopicsNotYetReviewed.length||0} federally mapped topics not yet reviewed. Instructor-signed proficiency and actual attendance remain separate.</p>}
 </section>
 <section className="panel"><div className="sectionhead"><div><p className="eyebrow">WEEK {day.week} · {day.weekday.toUpperCase()} · TRAINING DAY {day.day}</p><h2>{day.heading}</h2><p className="muted">{day.objective}</p></div><span className="badge">{day.phase}</span></div>
 <p><b>{completed} of {day.steps.length} steps covered</b> · {missing} not covered · {weak.length} require extra coaching.</p>
 <div className="driver-day-progress"><span style={{width:(completed/day.steps.length*100)+'%'}}/></div>
 {day.steps.map((step,i)=><article className="driver-step" key={step.id}><div className="driver-step-top"><b>{i+1}. {step.title}</b><span className="badge">{step.method}</span></div>
 {step.fmcsCodes.length>0&&<small>FMCSA {step.fmcsCodes.join(', ')}</small>}
 <p className="muted"><b>Teach:</b> {step.guidance}</p><p className="muted"><b>Document:</b> {step.verification}</p>
 <label>Individual student learning result<select value={results[step.id]||'Not covered'} onChange={e=>setResults(x=>({...x,[step.id]:e.target.value as StepResult}))}>{choices.map(choice=><option key={choice}>{choice}</option>)}</select></label></article>)}
 <div className="formgrid"><label>Actual date reviewed<input type="date" value={reviewDate} max={today()} onChange={e=>setReviewDate(e.target.value)}/></label>
 <label>Instructor observations / what student understood<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="What was taught, what the student demonstrated and specific errors…"/></label></div>
 <label>Next-day practice / targeted remediation<textarea value={nextSteps} onChange={e=>setNextSteps(e.target.value)} placeholder="Which concepts or driving maneuvers need special attention tomorrow?"/></label>
 <button className="primary" disabled={busy||!student} onClick={storeReview}><ClipboardCheck size={17}/> {latest?'Record signed-review correction':'Save student’s daily topic-by-topic review'}</button>
 {latest&&<p className="footnote">Prior review is retained. A correction creates a new auditable event rather than rewriting the previous review. Last staff review: {latest.recordedAt||latest.date}.</p>}
 {missing>0&&<p className="notice"><AlertTriangle size={16}/> {missing} steps remain “Not covered”. Do not certify this day as fully instructed until they are actually addressed and documented.</p>}
 </section>
 <section className="panel"><div className="sectionhead"><div><h2><CalendarDays size={19}/> Enter actual daily instruction</h2><p className="muted">Paper log entries and instructor checkoffs must match actual classroom/yard/road sessions. Do not count a planning checklist as time.</p></div><span className="badge">{(loggedMinutes/60).toFixed(2)}h logged {reviewDate}</span></div>
 {existingDaySessions.map(s=><div className="vault-doc-row" key={s.id}><span>{s.phase} · {s.mode} · {s.start}–{s.end}</span><b>{Number(s.hours).toFixed(2)}h</b></div>)}
 <div className="formgrid">
 <label>Training phase<select value={phase} onChange={e=>{setPhase(e.target.value);setMode('Instruction');setNightHours(0);}}><option>Classroom</option><option>Yard</option><option>Road</option></select></label>
 <label>Instructor conducting training<input value={instructor} onChange={e=>setInstructor(e.target.value)} placeholder="Actual instructor name"/></label>
 <label>Date<input type="date" value={reviewDate} max={today()} onChange={e=>setReviewDate(e.target.value)}/></label>
 <label>Attendance<select value={attendance} onChange={e=>setAttendance(e.target.value)}>{['Present','Late','Left early','Absent','Excused'].map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Start time<input type="time" value={start} onChange={e=>setStart(e.target.value)}/></label>
 <label>End time<input type="time" value={end} onChange={e=>setEnd(e.target.value)}/></label>
 <label>Break minutes<input type="number" min="0" max="240" value={breakMinutes} onChange={e=>setBreakMinutes(Number(e.target.value))}/></label>
 <label>Session type<select value={mode} onChange={e=>setMode(e.target.value)}>{(phase==='Road'?['Instruction','Student driving','Observation']:['Instruction','Observation']).map(x=><option key={x}>{x}</option>)}</select></label>
 {phase==='Road'&&mode==='Student driving'&&<><label>Actual night driving hours<input type="number" min="0" max="12" step="0.25" value={nightHours} onChange={e=>setNightHours(Number(e.target.value))}/></label>
 {nightHours>0&&<label>Night driving proof<textarea value={nightEvidence} onChange={e=>setNightEvidence(e.target.value)} placeholder="Exact route, actual times and dusk-to-dawn evidence"/></label>}</>}
 </div>
 <button disabled={busy||!student} onClick={saveHours}><CheckCircle2 size={16}/> Save actual time to student’s daily log</button>
 <p className="footnote">Optional 15-minute end-of-day coaching counts only if it actually occurs, is documented, and falls within the academy’s approved program and staffing requirements. Classroom and yard attendance is not driving time.</p>
 </section>
 <section className="panel"><div className="sectionhead"><div><h2><FileText size={19}/> Signed daily logs & paper evidence</h2><p className="muted">Scan or photograph any paper document your school needs to retain for a DMV inspection. Student daily logs are stored in the private document system and accessible to authorized campus staff, with file-access auditing.</p></div><Upload size={23}/></div>
 <div className="formgrid"><label>Signed paper daily training log (PDF/JPG/PNG)<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setDocFile(e.currentTarget.files?.[0]||null)}/></label></div>
 <button disabled={busy||!student||!docFile} onClick={uploadLog}><Upload size={17}/> {demo?'Simulate daily log upload':'Upload signed log to protected vault'}</button>
 {logFiles.filter(x=>x.category===DAILY_LOG_CATEGORY).map(file=><div className="vault-doc-row" key={file.key}><div><b>{file.name}</b><small>{file.uploadedAt?.slice(0,10)||file['created']?.slice(0,10)||'Uploaded'} {file.demoOnly?' · Sandbox only':''}</small></div>{!demo&&<a href={'/api/files?key='+encodeURIComponent(file.key)} target="_blank" rel="noreferrer">Open securely</a>}</div>)}
 {!logFiles.length&&<p className="notice">No signed student training log uploads are linked yet. Track actual instruction in the school record and upload the original scanned log where required.</p>}
 {message&&<p className="notice" role="status">{message}</p>}{error&&<p className="error" role="alert">{error}</p>}
 </section>
 </div>;
}
