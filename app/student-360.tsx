'use client';
import {ArrowRight,BookOpen,CalendarDays,CheckCircle2,ClipboardCheck,FileCheck2,GraduationCap,ShieldAlert,Truck,UserRound} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {activeSessions,skills,theoryState,instructionHours,latestSkill} from '../lib/training';
import {drivingTimeSummary} from '../lib/attendance';
import {studentPlan} from '../lib/operations';
import {scheduleForStudent,unresolvedVehicleDefects} from '../lib/training-dispatch';
import {graduationReadiness} from '../lib/enterprise';
import {lessonProgress} from '../lib/lesson-checkoffs';
import {moduleAllowed} from '../lib/roles';
type Props={student:R;records:R[];role:string;onPage:(page:string)=>void};
const stepLabels=['Enrollment pending','Classroom','Yard','Road','Test preparation','Graduated'];
function percent(achieved:number,target:number){return target>0?Math.min(100,Math.max(0,Math.round(achieved/target*100))):0;}
export default function Student360({student:s,records,role,onPage}:Props){
 const date=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
 if(!moduleAllowed(role,'courses'))return <div className="student-360"><div className="s360-hero"><div className="s360-mark"><GraduationCap size={26}/></div><div><h3>Student at a glance</h3><p>{s.name} · {s.program||'Program not specified'} · {s.status}</p></div></div><div className="s360-block"><h3>Basic school information</h3><p>Class: {records.find(r=>r.id===s.classId)?.name||s.cohort||'Not assigned'}</p><p>Campus: {records.find(r=>r.id===s.campusId)?.name||'Assigned campus'}</p><small>Open the student's permitted contact details in Overview. Training, funding and restricted documents are available only to authorized school roles.</small></div></div>;
  const plan=studentPlan(s,records,date),theory=theoryState(s),ready=graduationReadiness(s);
 const road=drivingTimeSummary(s),sessions=activeSessions(s);
 const assigned=scheduleForStudent(s.id,records).filter(x=>x.date>=date&&['Planned','Confirmed'].includes(x.status)).slice(0,5);
 const checklist=Array.isArray(s.documents)?s.documents:[];
 const className=plan.cls?.name||s.cohort||'Not assigned';
 const training=[
  {key:'Classroom',label:'Classroom',value:instructionHours(s,'Classroom'),target:Number(s.targetTheory||0)},
  {key:'Yard',label:'Practice yard',value:instructionHours(s,'Yard'),target:Number(s.targetYard||0)},
  {key:'Road',label:'Road training',value:instructionHours(s,'Road'),target:Number(s.targetRoad||0)}
 ];
 const skillList=[...skills.Yard,...skills.Road],proficient=skillList.filter(name=>latestSkill(s,name)?.level==='Proficient').length;
 const currentStep=stepLabels.indexOf(s.status);
 const nextSteps:string[]=[];
 if(!plan.cls)nextSteps.push('Assign a class and confirm its dates.');
 if(!checklist.some((d:any)=>d.verified===true))nextSteps.push('Have the office check the documents it is authorized to review.');
 if(s.status==='Classroom'&&!theory.signed)nextSteps.push('Complete the theory final, planned hours and instructor sign-off.');
 if(s.status==='Yard'&&proficient<skills.Yard.length)nextSteps.push('Practice and have the instructor check the remaining yard skills.');
 if(s.status==='Road'&&proficient<skillList.length)nextSteps.push('Continue the recorded road skill evaluations.');
 if(s.status==='Test preparation'&&!ready.ready)nextSteps.push('Review training and testing requirements before graduation.');
 const units=lessonProgress(records,s);const unitsCompleted=units.filter(x=>x.status==='Completed').length;
 const viewSupport=moduleAllowed(role,'operations');
 const viewPayments=moduleAllowed(role,'finance');
 return <div className="student-360">
  <div className="s360-hero"><div className="s360-mark"><GraduationCap size={26}/></div><div><p className="eyebrow">ONE STUDENT · COMPLETE JOURNEY</p><h3>Student 360</h3><p>{className} · {s.program||'Program not specified'} · {s.status}</p></div></div>
  <section className="s360-block"><h3>Where the student is now</h3><div className="s360-timeline">{stepLabels.map((step,index)=><span key={step} className={index===currentStep?'current':currentStep>index?'past':''}>{index<currentStep?<CheckCircle2 size={13}/>:index===currentStep?<span aria-hidden="true">●</span>:null}{step.replace('Enrollment pending','Getting started').replace('Test preparation','Testing')}</span>)}</div><small>The stage shows the saved class location. Earlier steps are not proof of completion.</small></section>
  <section className="s360-block"><h3>Training hours recorded</h3><div className="s360-hours">{training.map(row=><div key={row.key} className="s360-hour"><div><strong>{row.label}</strong><span>{row.value} hrs {row.target>0?' / '+row.target+' planned':' recorded'}</span></div><div className="s360-progress"><span style={{width:percent(row.value,row.target)+'%'}}/></div></div>)}</div><div className="s360-mini-stats"><span><BookOpen size={15}/> Theory: {theory.label}</span><span><Truck size={15}/> Student driving: {road.studentDrivingHours} hrs</span><span><UserRound size={15}/> Riding along: {road.observationHours} hrs</span><span><ClipboardCheck size={15}/> Skills checked: {proficient} of {skillList.length}</span></div><small>Road observation and instruction are tracked separately. Hours are not regulatory certification.</small></section>
  {units.length>0&&<section className="s360-block"><h3><BookOpen size={18}/> Approved lessons</h3><p>{unitsCompleted} of {units.length} approved lessons recorded complete. Missing checkoffs do not mean the student was absent.</p>{units.slice(0,6).map(unit=><div className="s360-next" key={unit.unitId}><div><strong>{unit.name}</strong><small>{unit.phase} · {unit.status}{unit.completedOn?' · '+unit.completedOn:''}</small></div></div>)}{units.length>6&&<p className="muted">{units.length-6} more lessons in the school plan.</p>}<button onClick={()=>onPage('lesson-checkoffs')}>Open lesson checkoffs</button><small>Lesson checkoffs point to saved instructor evidence; they do not add attendance or constitute FMCSA certification.</small></section>}
   {assigned.length>0&&<section className="s360-block"><h3><CalendarDays size={18}/> Next training lessons</h3>{assigned.map(a=>{const instructor=records.find(r=>r.id===a.employeeId)?.name||'Instructor not available',vehicle=records.find(r=>r.id===a.unitId),held=!!a.unitId&&unresolvedVehicleDefects(records,a.unitId).length>0;return <div className="s360-next" key={a.id}><div><strong>{a.date} · {a.start}–{a.end}</strong><small>{a.phase} · {instructor}{vehicle?' · '+vehicle.name:''}</small><small>{a.lessonObjective||'Lesson goal pending'}</small>{held&&<small className="s360-alert">Truck defect needs manager review before training.</small>}</div><span className="badge">{a.status}</span></div>;})}</section>}
  <section className="s360-block"><h3>Paperwork and next steps</h3><div className="s360-mini-stats"><span><FileCheck2 size={15}/> {checklist.length} file(s) visible to your role</span><span><CheckCircle2 size={15}/> {checklist.filter((d:any)=>d.verified===true).length} reviewed</span></div>{nextSteps.length?<div className="s360-todo">{nextSteps.map((step,index)=><p key={index}><span>○</span>{step}</p>)}</div>:<p className="muted">No additional automatic next steps from the available records. The school still needs its full manual review.</p>}{viewSupport&&plan.tasks.length>0&&<><h4>Open help requests</h4>{plan.tasks.slice(0,5).map(task=><p key={task.id} className="s360-next"><strong>{task.name}</strong><small>Due {task.due||'Not recorded'} · {task.status}</small></p>)}</>}{viewPayments&&s.fundingStatus&&<p className="muted">Funding status: {s.fundingStatus} — confirm original source documentation.</p>}</section>
  <section className="s360-block"><h3><ShieldAlert size={19}/> Before graduation</h3><p>{ready.ready?'School training checklist has no recorded gaps.':'School checklist still shows '+ready.gaps.length+' item(s) needing review.'}</p>{ready.gaps.length>0&&<details><summary>View school training checklist</summary><div className="s360-todo">{ready.gaps.map((gap,i)=><p key={i}><span>○</span>{gap}</p>)}</div></details>}<small>Not a CDL eligibility decision, state inspection clearance, or FMCSA TPR submission.</small></section>
  <div className="s360-actions">{moduleAllowed(role,'courses')&&<button onClick={()=>onPage('courses')}><ClipboardCheck size={17}/> Go to training <ArrowRight size={15}/></button>}{viewSupport&&<button onClick={()=>onPage('operations')}>View student help <ArrowRight size={15}/></button>}</div>
 </div>;
}
