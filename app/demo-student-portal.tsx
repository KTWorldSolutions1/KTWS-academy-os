'use client';
import {useState} from 'react';
import {StudentCareerJourneyDemo} from './student-career-journey';
import {studentFacingNotices} from '../lib/school-calendar';
import type {RecordData as R} from '../lib/training';
import {documentChecklist} from '../lib/student-documents';
import {summarizeKnowledgeAssessments} from '../lib/learning-diagnostics';
import {Bell,BookOpen,CheckCircle2,FileText,GraduationCap,LockKeyhole,Upload,UserRound,ClipboardCheck,ShieldCheck} from 'lucide-react';

type Props={records:R[];demo:boolean;saveMany:(updates:R[])=>Promise<boolean>};
type SampleQuestion={id:string;subject:string;objective:string;prompt:string;options:string[];correct:number};
const QUESTIONS:SampleQuestion[]=[
 {id:'demo-q1',subject:'General Knowledge',objective:'Safe vehicle inspections',prompt:'During a pre-trip inspection, you discover a serious safety defect. What is the appropriate response?',options:['Report it and do not operate until the vehicle is safe','Ignore it if the delivery is urgent','Tell the next driver only'],correct:0},
 {id:'demo-q2',subject:'General Knowledge',objective:'Speed management',prompt:'Road conditions become slippery. What driving adjustment is safest?',options:['Increase speed to spend less time on the road','Slow down and increase following distance','Keep the same speed regardless of traction'],correct:1},
 {id:'demo-q3',subject:'Combination Vehicles',objective:'Coupling verification',prompt:'Before moving a coupled tractor-trailer, the driver should:',options:['Rely on the audible coupling click alone','Inspect the coupling and verify secure connection','Skip the inspection when the trailer is empty'],correct:1},
 {id:'demo-q4',subject:'Combination Vehicles',objective:'Trailer tracking',prompt:'When turning with a tractor-trailer, which issue requires special attention?',options:['Rear trailer wheels may follow a different path','The trailer always follows exactly in the tractor tracks','Mirrors are not needed at slow speeds'],correct:0},
 {id:'demo-q5',subject:'Air Brakes',objective:'Low air pressure warning',prompt:'An air-brake low-pressure warning appears while driving. What should the driver do?',options:['Continue until the next delivery','Stop safely and investigate the air-system problem','Disconnect the warning buzzer'],correct:1},
 {id:'demo-q6',subject:'Air Brakes',objective:'Air-system checks',prompt:'Why must a driver inspect and test the air-brake system before driving?',options:['To meet safety and defect detection responsibilities','Only because it improves fuel mileage','Because empty vehicles do not need brakes'],correct:0}
];
export default function DemoStudentPortal({records,demo,saveMany}:Props){
 const [studentId,setStudentId]=useState(''),[answers,setAnswers]=useState<Record<string,number>>({}),[result,setResult]=useState<{score:number;incorrect:string[]}|null>(null),[notice,setNotice]=useState(''),[activeTab,setActiveTab]=useState<'Home'|'Documents'|'Practice'>('Home');
 if(!demo)return <section className="panel"><div className="sectionhead"><div><p className="eyebrow">STUDENT SELF-SERVICE</p><h2>Student portal sandbox</h2></div><LockKeyhole/></div><p className="muted">This preview is intentionally available only in synthetic sample mode. Real students must activate their separately authorized, authenticated portal before using private document uploads and school-published practice checks.</p></section>;
 const students=records.filter(r=>r.kind==='students'&&r.id.startsWith('demo-'));
 const student=students.find(r=>r.id===studentId)||students[0];
 if(!student)return <div className="notice">No sample students in your authorized school scope. Ask the school owner to assign a demo campus.</div>;
 const reqs=documentChecklist(student),pending=reqs.filter(r=>r.requested&&r.status!=='Verified'),mastery=summarizeKnowledgeAssessments(student);
 const demoNotices=studentFacingNotices(records,student.campusId,new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'}));
 const initials=student.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
 const stages=['Enrollment pending','Waiting for permit','Classroom','Yard','Road','Test preparation','Graduated'];
 const current=Math.max(0,stages.indexOf(student.status));
 async function simulateUpload(category:string){
  const attachment={key:'demo-'+crypto.randomUUID(),category,name:'SAMPLE_'+category.replace(/\W+/g,'_')+'.pdf',uploadedAt:new Date().toISOString(),uploadedBy:'Demo student',verified:false,demoOnly:true};
  if(await saveMany([{...student,documents:[...(student.documents||[]),attachment]}]))setNotice('Fictional '+category+' uploaded to the sample queue. Campus review is required. No personal data or file bytes were collected.');
 }
 async function submitTest(){
  if(Object.keys(answers).length!==QUESTIONS.length){setNotice('Answer all six sample questions.');return;}
  const scored=QUESTIONS.map(q=>({questionId:q.id,subject:q.subject,objective:q.objective,correct:answers[q.id]===q.correct}));
  const correct=scored.filter(q=>q.correct).length,score=Math.round(correct/scored.length*100);
  const assessment={id:crypto.randomUUID(),assessmentId:'demo-portal-'+new Date().toISOString(),name:'DEMO self-check — CDL knowledge areas',type:'Quiz',studentPractice:true,week:1,date:new Date().toISOString().slice(0,10),score,correct,total:scored.length,remediation:score<80?'Instructor review: '+scored.filter(q=>!q.correct).map(q=>q.objective).join('; '):'',itemResults:scored,instructor:'Fictional student practice'};
  if(await saveMany([{...student,assessments:[...(student.assessments||[]),assessment]}])){
   setResult({score,incorrect:scored.filter(q=>!q.correct).map(q=>q.objective)});
   setNotice('Demo result saved only to local sample data. Review the Knowledge Diagnostics staff dashboard to see the same subject errors.');
  }
 }
 return <div className="demo-student-portal"><section className="panel"><div className="sectionhead"><div><p className="eyebrow">OWNER PRESENTATION • SELF-SERVICE SIMULATOR</p><h2>Walk through a student's portal</h2><p className="muted">Choose one of the fictional students. Explore what an actual authorized student would see, simulate a requested document and answer a mini knowledge check. This preview never calls the private live upload or student portal API.</p></div><ShieldCheck size={26}/></div><label>Fictional student<select value={student.id} onChange={e=>{setStudentId(e.target.value);setResult(null);setAnswers({});setNotice('');}}>{students.slice(0,100).map(s=><option key={s.id} value={s.id}>{s.name} · {s.status} · {records.find(c=>c.id===s.campusId)?.name||'Campus'}</option>)}</select></label></section>
 <section className="demo-student-shell">
  <div className="demo-student-sidebar"><div className="demo-student-crest">★</div><strong>LONE STAR</strong><small>STUDENT PORTAL · SIMULATED</small><span>MY LEARNING</span>{(['Home','Documents','Practice'] as const).map(n=><button key={n} className={activeTab===n?'active':''} onClick={()=>setActiveTab(n)}>{n==='Home'?<GraduationCap size={16}/>:n==='Documents'?<FileText size={16}/>:<BookOpen size={16}/>} {n}</button>)}
  <div className="demo-student-identity"><span>{initials}</span><div><b>{student.name}</b><small>{student.studentNumber||'Sample student'}</small></div></div></div>
  <div className="demo-student-main"><div className="student-portal-announcements">{demoNotices.map(n=><article className={'student-portal-banner '+(n.priority==='Urgent'?'urgent':'important')} key={n.id}><b>{n.kind==='closures'?'FICTIONAL CLOSURE':'FICTIONAL SCHOOL ANNOUNCEMENT'}</b><h2>{n.title}</h2><p>{n.body}</p></article>)}</div><div className="demo-student-header"><div><p className="eyebrow">MY TRAINING RECORD</p><h2>Welcome, {student.name.split(' ')[0]}.</h2><p>Class A · {student.cohort||'Training'} · <b>{student.status}</b></p></div><span className="badge warn"><Bell size={15}/> {pending.length} item(s) requested</span></div>
  {activeTab==='Home'&&<><StudentCareerJourneyDemo student={student} records={records} onDocuments={()=>setActiveTab('Documents')} onPractice={()=>setActiveTab('Practice')}/><h3>My training journey</h3><div className="demo-student-stages">{stages.map((st,i)=><span key={st} className={i===current?'current':i<current?'complete':''}>{i<current?<CheckCircle2 size={13}/>:null} {st}</span>)}</div><div className="demo-student-metrics"><div><strong>{student.assessments?.length||0}</strong><small>Knowledge checks</small></div><div><strong>{pending.length}</strong><small>Pending requests</small></div><div><strong>{student.fundingType||'Review'}</strong><small>Funding category</small></div></div><p className="notice">Sample only: school completion, training hours, TPR and testing results must be verified from real records. Click Documents or Practice on the left to walk through self-service.</p><button className="primary" onClick={()=>setActiveTab('Documents')}>Review my missing documents</button></>}
  {activeTab==='Documents'&&<><h3>My secure enrollment checklist</h3><p className="muted">Staff requests appear as notices. A real student would upload only to their protected school account, and the submission would await human verification.</p>{reqs.map(d=><div className="vault-doc-row" key={d.category}><div><b>{d.category}</b><small>{d.status}{d.requested?' · Requested by your school':''}</small></div>{d.requested&&d.status!=='Verified'&&<button onClick={()=>simulateUpload(d.category)}><Upload size={15}/> Simulate upload</button>}</div>)}{pending.length===0&&<p className="notice">No outstanding requested documents in this synthetic profile. Choose another sample student to see pending notices.</p>}</>}
  {activeTab==='Practice'&&<><h3>My practice quiz</h3><p className="muted">Six fictional questions, covering General Knowledge, Combination Vehicles and Air Brakes. Not FMCSA or DMV official test items.</p>{QUESTIONS.map((q,i)=><fieldset key={q.id} className="demo-student-question"><legend><b>{i+1}. {q.prompt}</b><small>{q.subject} · {q.objective}</small></legend>{q.options.map((o,j)=><label key={j}><input type="radio" name={q.id} checked={answers[q.id]===j} onChange={()=>{setAnswers(v=>({...v,[q.id]:j}));setResult(null);}}/>{String.fromCharCode(65+j)}. {o}</label>)}</fieldset>)}<button className="primary" disabled={Object.keys(answers).length!==QUESTIONS.length} onClick={submitTest}><ClipboardCheck size={16}/> Submit practice quiz</button>{result&&<p className={result.score<80?'error':'notice'}><b>Score {result.score}%</b>{result.incorrect.length?' · Review: '+result.incorrect.join(', '):' · No concepts missed in this short practice.'}</p>}{mastery.length>0&&<details><summary>My previous subject performance</summary>{mastery.map(area=><p key={area.subject}>{area.subject}: {area.percent}% · {area.correct}/{area.total} correct</p>)}</details>}</>}
  {notice&&<p className="notice" role="status">{notice}</p>}
  </div>
 </section></div>;
}
