'use client';
import {useMemo,useState} from 'react';
import {BookOpen,CheckCircle2,ClipboardCheck,FileText,ShieldAlert,Truck,Upload} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {activeSessions,today,instructionHours} from '../lib/training';
import {DRIVER_TRAINING_DAYS,ALL_FEDERAL_CODES,REQUIRED_RANGE,REQUIRED_ROAD,reviewProgress,validateDailyReview} from '../lib/driver-training-plan';
import {latestEvidence} from '../lib/student-documents';
import {drivingTimeSummary} from '../lib/attendance';
type Props={records:R[];role:string;demo:boolean;busy:boolean;saveMany:(rows:R[])=>Promise<boolean>};
const choices=['Not covered','Reviewed','Needs practice','Student explains','Performed with coaching','Discussed'];
const names:Record<string,string>={'A1':'Theory','A2':'Range','A3':'Road'};
const dayOptions=DRIVER_TRAINING_DAYS.map(d=>({value:d.day,label:'Week '+d.week+' · Day '+d.day+' · '+d.weekday}));
function counts(records:R[],student:R,day:number){
 const events=records.filter(x=>x.kind==='daily-lesson-reviews'&&x.studentId===student.id&&x.day===day);
 const corrections=new Set(events.map(x=>x.correctionOf).filter(Boolean));
 return events.filter(x=>!corrections.has(x.id)).at(-1)||null;
}
export default function DriverPlaybook({records,role,demo,busy,saveMany}:Props){
 const [campusId,setCampusId]=useState(''),[studentId,setStudentId]=useState(''),[dayNumber,setDayNumber]=useState(1),
 [date,setDate]=useState(today()),[results,setResults]=useState<Record<string,string>>({}),[stepMoods,setStepMoods]=useState<Record<string,'green'|'yellow'|'red'>>({}),[notes,setNotes]=useState(''),[nextSteps,setNextSteps]=useState(''),
 [notice,setNotice]=useState(''),[error,setError]=useState(''),[logFile,setLogFile]=useState<File|null>(null);
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const campus=campuses.find(x=>x.id===campusId)||campuses[0];
 const students=records.filter(r=>r.kind==='students'&&r.campusId===campus?.id&&r.program==='Class A'&&!['Withdrawn'].includes(r.status));
 const student=students.find(x=>x.id===studentId)||students[0];
 const current=DRIVER_TRAINING_DAYS[dayNumber-1];
 const history=student?counts(records,student,dayNumber):null;
 const active=student?activeSessions(student).filter(e=>e.date===date&&
  (e.phase===current.phase||current.phase==='Combined')&&['Present','Late','Left early'].includes(e.attendance)):[]; 
 const inspected=student?reviewProgress(records,student):null;
 const actualEvidence=student?(student.documents||[]).filter((d:any)=>d.category==='Daily training log'&&d.key):[];
 const dailyFile=actualEvidence.find((d:any)=>d.trainingDate===date);
 const completed=Object.values(results).filter(x=>x!=='Not covered').length;
 const canSign=['Instructor','Campus manager','Regional admin','Owner'].includes(role);
 const programCounts=useMemo(()=>students.map(s=>({id:s.id,name:s.name,progress:reviewProgress(records,s)})),[records,students.length,campus?.id]);
 async function saveReview(){
  if(!student)return;
  const record:R={id:crypto.randomUUID(),kind:'daily-lesson-reviews',name:student.name+' · Instructor day '+dayNumber,
   campusId:student.campusId,studentId:student.id,day:dayNumber,week:current.week,phase:current.phase,
   date,status:'Reviewed',results,stepMoods,notes:notes.trim(),nextSteps:nextSteps.trim(),correctionOf:history?.id||undefined};
  const issue=validateDailyReview(record,records,date);
  if(issue){setError(issue);return;}
  if(!active.length&&!demo){setError('Record real attendance first for this date and training phase. This checklist never creates training hours.');return;}
  if(!Object.keys(results).length){setError('Mark at least one training step for this student.');return;}
  setError('');setNotice('');
  if(await saveMany([record])){
   setResults({});setStepMoods({});setNotes('');setNextSteps('');
   setNotice(demo?'Saved a fictional classroom/range/road review for demonstration only.':'Daily review recorded. It does not certify federal proficiency or add attendance hours.');
  }else setError('Could not record the instructor review. Check the school error at the top.');
 }
 async function uploadLog(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!student||!logFile)return;
  setError('');setNotice('');
  if(demo){
   // Visually complete the workflow but never generate fictitious file bytes or regulatory evidence.
   const marker={name:'DEMO scan · '+date+'.pdf',category:'Daily training log',trainingDate:date,demoOnly:true,verified:false};
   if(await saveMany([{...student,documents:[...(student.documents||[]),marker]}]))setNotice('Demo log scanned and attached as a fictional placeholder. No actual document or hours have been uploaded.');
   return;
  }
  try{
   const data=new FormData();data.set('file',logFile);data.set('studentId',student.id);data.set('category','Daily training log');data.set('trainingDate',date);
   const res=await fetch('/api/files',{method:'POST',body:data});
   const body=await res.json();if(!res.ok)throw Error(body.error||'Secure upload unavailable');
   setLogFile(null);setNotice('Encrypted daily training log attached to this student for '+date+'. It is pending review.');
   await saveMany([]);
  }catch(e:any){setError(e.message||'Upload unavailable. No document was confirmed.');}
 }
 function printChecklist(){
  if(!student)return;
  const esc=(s:any)=>String(s??'').replace(/[&<>"']/g,v=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[v]!));
  const html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Daily instructor checklist</title><style>body{font:12px Arial;margin:30px;color:#102b48}h1{font-size:19px;color:#193e69}h2{font-size:15px}table{width:100%;border-collapse:collapse;margin-top:14px}th,td{border:1px solid #9ba8b6;padding:8px;text-align:left}th{background:#d5dce4}@media print{body{margin:14mm}}</style></head><body><h1>LONE STAR TRUCK DRIVING ACADEMY — DAILY INSTRUCTOR RECORD</h1><p><strong>Student: </strong>'+esc(student.name)+' &nbsp; <strong>Date: </strong>'+esc(date)+' &nbsp; <strong>Week/Day: </strong>'+current.week+'/'+dayNumber+'</p><h2>'+esc(current.heading)+'</h2><table><thead><tr><th>Objective / code</th><th>Training evidence / result</th><th>Instructor initials</th></tr></thead><tbody>'+
   current.steps.map(s=>'<tr><td>'+esc(s.title)+' '+esc(s.fmcsCodes.join(', '))+'</td><td>'+esc(results[s.id]||'Not covered')+'</td><td>________</td></tr>').join('')+
   '</tbody></table><p><strong>Instructor notes:</strong> '+esc(notes||'___________________')+'</p><p><strong>Next coaching action:</strong> '+esc(nextSteps||'__________________')+'</p><p>Actual training hours must be recorded separately on the approved training log. This checklist cannot substitute for FMCSA BTW proficiency evaluation.</p><p>Student signature: ___________________ Instructor signature: ___________________</p><script>window.onload=()=>window.print();<\/script></body></html>';
  const win=window.open('','_blank');if(win){win.document.write(html);win.document.close();}else setError('Allow a pop-up to print or save this daily checklist.');
 }
 return <div className="daily-playbook">
 <section className="panel"><div className="sectionhead"><div><p className="eyebrow">LONE STAR • FIVE-WEEK INSTRUCTOR OPERATIONS</p><h2>25-Day Driver Development Playbook</h2><p className="muted">Instructor-led daily checklist for each student, with FMCSA lesson mapping, the school's licensed J. J. Keller material references, and smiley feedback for areas needing coaching. Covers all {ALL_FEDERAL_CODES.length} federally listed Class A theory, range and road subjects plus practical driver readiness.</p></div><BookOpen size={27}/></div>
 <div className="formgrid"><label>Location<select value={campus?.id||''} onChange={e=>{setCampusId(e.target.value);setStudentId('');setResults({});setStepMoods({});}}>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label>Student<select value={student?.id||''} onChange={e=>{setStudentId(e.target.value);setResults({});setStepMoods({});setNotes('');setNextSteps('');}}>{!students.length&&<option value="">No Class A students</option>}{students.map(s=><option key={s.id} value={s.id}>{s.name} • {s.status}</option>)}</select></label>
 <label>Teaching day<select value={dayNumber} onChange={e=>{setDayNumber(Number(e.target.value));setResults({});setNotes('');setNextSteps('');}}>{dayOptions.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}</select></label>
 <label>Actual date of instruction<input type="date" value={date} max={today()} onChange={e=>setDate(e.target.value)}/></label></div>
 <div className="curriculum-metrics"><div><strong>30</strong><small>FMCSA Class A theory subjects mapped</small></div><div><strong>7</strong><small>Required range competencies mapped</small></div><div><strong>12</strong><small>Public-road topics mapped</small></div><div><strong>{inspected?.daysReviewed??0}/25</strong><small>Student instructional day reviews recorded</small></div></div>
 <p className="notice"><ShieldAlert size={17}/> Recorded “covered” steps are <b>not</b> verified proficiency. Federal BTW evaluations, theory assessment, observed driving/observation hours and school-required daily logs must be separately documented with real evidence.</p>
 {demo&&<p className="notice">Practice data only: sample instructor reviews save temporarily in this browser session, without creating actual student records or files.</p>}
 </section>
 <section className="panel"><div className="sectionhead"><div><p className="eyebrow">INSTRUCTOR CLASSROOM COVERAGE</p><h2>Every student · Day {dayNumber} checklist</h2><p className="muted">Select each student above to record their individual outcomes. This overview identifies students with missing daily reviews and those marked as needing coaching. Smiley observations do not prove theory completion or BTW proficiency.</p></div></div>
 <div className="tablewrap"><table><thead><tr><th>Student</th><th>Day {dayNumber} review</th><th>Smiley feedback</th><th>Follow-up</th></tr></thead><tbody>
 {students.map(s=>{const r=counts(records,s,dayNumber);const ratings=Object.values(r?.stepMoods||{});const concerns=ratings.filter(m=>m==='yellow'||m==='red').length;return <tr key={s.id}><td><button type="button" onClick={()=>{setStudentId(s.id);setResults({});setStepMoods({});setNotes('');setNextSteps('');}}>{s.name}</button></td><td>{r?'Recorded '+r.date:'Not reviewed'}</td><td>{!r?'—':(ratings.length?ratings.map(m=>m==='green'?'☺':m==='yellow'?'😐':'☹').join(' '):'No smileys recorded')}</td><td>{r?.nextSteps|| (concerns?'Coaching required':'—')}</td></tr>})}
 </tbody></table></div>{students.length===0&&<p className="notice">No current Class A students are visible for this campus. Check the active campus and student assignments.</p>}
 </section>
 {student&&<section className="panel"><div className="sectionhead"><div><p className="eyebrow">WEEK {current.week} • DAY {dayNumber} • {current.phase.toUpperCase()}</p><h2>{current.heading}</h2><p className="muted">{current.objective}</p></div><ClipboardCheck size={25}/></div>
 <div className="daily-review-context"><span className="badge">{student.name} · {student.status}</span><span className="badge">{active.length} saved attendance session(s) for {date}</span><span className="badge">{completed} steps marked in this review</span><span className="badge">{Object.values(stepMoods).filter(m=>m==='yellow'||m==='red').length} topics need coaching</span></div>
 {history&&<p className="notice"><CheckCircle2 size={16}/> Previous saved review from {history.date}: {Object.values(history.results||{}).filter(x=>x!=='Not covered').length} steps. A new submission is an auditable correction; the previous entry remains in the school history.</p>}
 <div className="daily-checklist-items">{current.steps.map((step,index)=><section className="daily-checklist-item" key={step.id}><div className="daily-step-heading"><div><span className="badge">STEP {index+1} • {step.method}</span><h3>{step.title}</h3>{step.fmcsCodes.length>0&&<small>49 CFR Part 380 Appendix A: {step.fmcsCodes.join(', ')}</small>}</div><CheckCircle2 size={21}/></div>
 <p><b>Instructor actions:</b> {step.guidance}</p><p><b>What to collect:</b> {step.verification}</p>
 <label>Individual student outcome<select value={results[step.id]||'Not covered'} onChange={e=>setResults(x=>({...x,[step.id]:e.target.value}))}><option>Not covered</option>{choices.filter(x=>x!=='Not covered').map(x=><option key={x}>{x}</option>)}</select></label>
 <div className="moodbuttons" role="group" aria-label={'Student performance for '+step.title}>
 <span><b>Instructor smiley:</b> </span>
 {([['green','☺','Understands / on track'],['yellow','😐','Needs extra practice'],['red','☹','Struggling / intervention needed']] as const).map(([mood,face,description])=><button type="button" key={mood} className={stepMoods[step.id]===mood?'active '+mood:''} aria-pressed={stepMoods[step.id]===mood} title={description} onClick={()=>{setStepMoods(old=>({...old,[step.id]:mood}));setResults(old=>({...old,[step.id]:mood==='green'?'Student explains':'Needs practice'}));}}>{face} {description}</button>)}
 </div>
 {stepMoods[step.id]&&<p className="muted">Marked {stepMoods[step.id]==='green'?'on track':stepMoods[step.id]==='yellow'?'for further practice':'for instructor intervention'}. Add the specific weak concept and follow-up below. This is an instructional observation, not a skill certification.</p>}
 </section>)}</div>
 <div className="daily-review-footer"><label>Instructor's individual observations and missed concepts<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="The student correctly identified the air pressure limits but could not independently explain the low-pressure warning..."/></label><label>Specific next action / remediation<textarea value={nextSteps} onChange={e=>setNextSteps(e.target.value)} placeholder="Repeat the air-brake knowledge check at the beginning of tomorrow's session..."/></label>
 <p className="footnote">A 15-minute daily coaching recap is optional if actual time and school staffing permit. It must not be automatically counted toward student training hours or employee overtime. Use Take Attendance for verified start/end, breaks, phase, driving vs. observation and night hours.</p>
 <div className="reportactions"><button disabled={busy||!canSign||!student} className="primary" onClick={saveReview}><ClipboardCheck size={17}/> Save individual instructor review</button><button onClick={printChecklist}>Print daily checklist</button></div></div>
 {error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="notice" role="status">{notice}</p>}
 </section>}
 {student&&<section className="panel"><div className="sectionhead"><div><p className="eyebrow">DAILY DOCUMENTATION • PAPER + DIGITAL</p><h2>Daily student log reconciliation</h2></div><FileText size={25}/></div>
 <p className="muted">Both paper and electronic records belong to the student file. The signed paper copy can be photographed or scanned into restricted storage; check the saved structured attendance separately. Do not add training hours merely by uploading a file.</p>
 <div className="curriculum-metrics"><div><strong>{active.length}</strong><small>Training sessions saved {date}</small></div><div><strong>{active.reduce((n:number,s:any)=>n+Number(s.hours||0),0)}</strong><small>Recorded hours for matching phases</small></div><div><strong>{actualEvidence.filter((d:any)=>d.key).length}</strong><small>Encrypted daily log attachments</small></div><div><strong>{dailyFile?'Attached':'Missing'}</strong><small>Signed log scanned for selected date</small></div></div>
 {active.map((entry:any)=><p className="reportrow" key={entry.id}><b>{entry.phase} · {entry.date}</b><span>{entry.start||'—'}–{entry.end||'—'} · {entry.mode||'Instruction'} · {entry.hours}h · {entry.instructor||'—'}</span></p>)}
 {actualEvidence.slice(-10).reverse().map((d:any,i:number)=><div className="vault-doc-row" key={d.key||i}><div><b>{d.name}</b><small>{d.trainingDate||d.uploadedAt?.slice(0,10)||'Date pending'} · {d.verified?'Verified':'Review pending'}</small></div>{d.key&&<a href={'/api/files?key='+encodeURIComponent(d.key)}>Open</a>}</div>)}
 {canSign&&<form className="vault-upload" onSubmit={uploadLog}><h3><Upload size={17}/> Attach signed paper daily training log</h3><label>Photo or PDF of signed daily training log<input type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={e=>setLogFile(e.target.files?.[0]||null)}/></label><button disabled={!logFile||busy} className="primary" type="submit">Upload secure log for {date}</button></form>}
 <div className="reportactions"><button onClick={()=>location.assign('/')} type="button" style={{display:'none'}}>Open</button></div>
 <p className="footnote">Instructor/admin daily log uploads are encrypted and private to the student's campus. If file uploads remain locked pending school security approval, collect paper originals and use existing attendance until secure recovery and retention controls are approved.</p>
 </section>}
 {student&&<section className="panel"><div className="sectionhead"><div><p className="eyebrow">STUDENT SKILL GAP REPORT</p><h2>Every FMCSA unit, even after advancement to road</h2></div><Truck size={25}/></div>
 <p className="muted">{inspected?.federalTopicsNotYetReviewed.length} of {ALL_FEDERAL_CODES.length} topics still lack a recorded positive daily review. Keep checking earlier theory and range areas while a student is on the road.</p>
 {['A1','A2','A3'].map(prefix=><details className="classroom-coverage" key={prefix} open={prefix==='A3'&&current.week>=4}><summary>{names[prefix]} · {ALL_FEDERAL_CODES.filter(code=>code.startsWith(prefix)&&!inspected?.federalTopicsNotYetReviewed.includes(code)).length}/{ALL_FEDERAL_CODES.filter(code=>code.startsWith(prefix)).length} positive daily-review tags</summary><div className="daily-code-grid">{ALL_FEDERAL_CODES.filter(code=>code.startsWith(prefix)).map(code=><span className={'badge '+(inspected?.federalTopicsNotYetReviewed.includes(code)?'warn':'good')} key={code}>{code} · {inspected?.federalTopicsNotYetReviewed.includes(code)?'Follow up':'Reviewed'}</span>)}</div></details>)}
 <p className="footnote">Performance and regulatory completion must additionally be supported by J. J. Keller theory results, signed range/road skill rubrics, road HOS practical proficiency, and separately recorded training hours. Do not infer proficiency from classroom discussion.</p></section>}
 <section className="panel"><h2>Students needing a daily follow-up at {campus?.name}</h2><div className="tablewrap"><table><thead><tr><th>Student</th><th>Stage</th><th>Daily reviews</th><th>Follow-up topics</th></tr></thead><tbody>{programCounts.slice(0,120).map(row=>{const person=students.find(s=>s.id===row.id)!;return <tr key={row.id}><td>{person.name}</td><td>{person.status}</td><td>{row.progress.daysReviewed}/25</td><td>{row.progress.federalTopicsNotYetReviewed.length} awaiting documented review</td></tr>;})}</tbody></table></div></section>
 </div>;
}
