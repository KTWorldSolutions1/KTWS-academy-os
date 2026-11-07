'use client';
import {useState} from 'react';
import {ArrowUpRight,BookOpen,BriefcaseBusiness,CheckCircle2,ClipboardCheck,ExternalLink,GraduationCap,LockKeyhole,MapPin,ShieldCheck,Star,Truck} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {STUDENT_JOURNEY_STAGES,studentJourney} from '../lib/student-journey';
type Journey=ReturnType<typeof studentJourney>;
type Props={journey:Journey;studentName:string;demo?:boolean;onDocuments?:()=>void;onPractice?:()=>void};
const PULSE_URL='https://pulse.tenstreet.com/';
export default function StudentCareerJourney({journey,studentName,demo=false,onDocuments,onPractice}:Props){
 const [opened,setOpened]=useState(false),[checked,setChecked]=useState(false);
 const stage=journey.stages[journey.stageIndex];
 return <section className="student-career-journey" aria-label="My Lone Star CDL journey">
  <div className="journey-hero">
   <div><p className="eyebrow">YOUR ROAD TO A CDL · LONE STAR</p><h2>{journey.stageIndex===6?'You made it, '+studentName.split(' ')[0]+'!':'Your future is taking shape, '+studentName.split(' ')[0]+'.'}</h2>
   <p className="journey-sub">Right now: <strong>{stage.title}</strong></p><p className="muted">{stage.description}</p></div>
   <div className="journey-hero-icon" aria-hidden="true">{stage.emoji}</div>
  </div>
  <div className="journey-rail" role="list" aria-label="Training stages">{journey.stages.map((p,i)=><div role="listitem" key={p.id} className={'journey-stop '+(p.selected?'active':p.completed?'complete':'future')}>
   <span className="journey-stop-icon">{p.completed?<CheckCircle2 size={21}/>:p.emoji}</span>
   <b>{p.short}</b><small>{p.selected?'You are here':p.completed?'Verified':'Next steps'}</small>
  </div>)}</div>
  <div className="journey-progress-grid">
   <div><small>Current stage</small><strong>{journey.stageIndex+1} <span>/ 7</span></strong><p>{journey.stageLabel}</p></div>
   <div><small>Evidence-verified milestones</small><strong>{journey.verifiedMilestones} <span>/ {journey.totalMilestones}</span></strong><p>Reviewed by your campus</p></div>
   <div><small>Scheduled class</small><strong className="journey-class-name">{journey.classStart||'Pending'}</strong><p>{journey.className||'Speak with admissions'}</p></div>
  </div>
  <div className="journey-today"><div><Star size={22}/><div><b>Your next move</b><p>{journey.callout}</p></div></div>
   <div className="journey-today-actions">{onDocuments&&<button onClick={onDocuments}><ClipboardCheck size={16}/> My paperwork</button>}{onPractice&&<button onClick={onPractice}><BookOpen size={16}/> My CDL practice</button>}</div></div>
  <details className="journey-detail" open><summary><MapPin size={18}/> Your seven-stage training checklist</summary><div className="journey-stage-list">{journey.stages.map(x=><article key={x.id} className={x.selected?'active':''}>
   <span className="journey-stage-emoji">{x.emoji}</span><div><h3>{x.title}</h3><p>{x.description}</p><small>{x.evidence}</small></div><span className={'badge '+(x.completed?'good':x.selected?'warn':'')}>{x.completed?'Verified':x.selected?'Current stage':'Not verified'}</span></article>)}</div></details>
  <section className="journey-career"><div className="journey-career-brand"><BriefcaseBusiness size={26}/><div><p className="eyebrow">NEXT CHAPTER · CDL CAREERS</p><h3>Get job-ready with Driver Pulse</h3></div></div><p>Start your driver profile, prepare an employment history, build your reusable Tenstreet IntelliApp application, find CDL jobs and apply directly to carriers. You control what you share with employers.</p>
   <div className="journey-job-steps"><span>1 <b>Create your free driver profile</b></span><span>2 <b>Complete experience & employment history</b></span><span>3 <b>Search carriers & apply</b></span></div>
   <div className="journey-pulse-actions">
   <a href="https://apps.apple.com/us/app/driver-pulse-by-tenstreet/id996176201" target="_blank" rel="noopener noreferrer" onClick={()=>setOpened(true)} className="journey-driverpulse-link"><ExternalLink size={17}/> Driver Pulse for iPhone</a>
   <a href="https://play.google.com/store/apps/details?id=com.mobile.tenstreet.driverpulse" target="_blank" rel="noopener noreferrer" onClick={()=>setOpened(true)} className="journey-driverpulse-link"><ExternalLink size={17}/> Driver Pulse for Android</a>
   <a href={PULSE_URL} target="_blank" rel="noopener noreferrer" onClick={()=>setOpened(true)} className="journey-driverpulse-link"><ExternalLink size={18}/> Open on desktop <ArrowUpRight size={16}/></a>
   </div>
   <p className="footnote">Driver Pulse is a separate Tenstreet service. It opens outside Academy OS. Your school documents, grades, SSN and enrollment data are never sent there automatically. Applications and hiring status are managed by Driver Pulse and the carrier, not by this portal.</p>
   <label className="checkboxlabel"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/> I have started my Driver Pulse profile (personal planning only; not verified by school).</label>
   {opened&&<p className="notice">Driver Pulse opened in a new tab. On iPhone or Android, follow its instructions to use the mobile app; Tenstreet recommends its mobile app on iPhone and Android; use Chrome or Firefox for the web version rather than Safari.</p>}
  </section>
  <p className="footnote">{journey.note}</p>
 </section>;
}
export function StudentCareerJourneyDemo({student,records,onDocuments,onPractice}:{student:R;records:R[];onDocuments:()=>void;onPractice:()=>void;}){
 return <StudentCareerJourney journey={studentJourney(student,records)} studentName={student.name} demo onDocuments={onDocuments} onPractice={onPractice}/>;
}
