'use client';
import {useState} from 'react';
import {ArrowRight,Bell,CheckCircle2,FileCheck2,LockKeyhole,RotateCcw,Upload,UserRound} from 'lucide-react';
const states=[
 {name:'Open student file',staff:'Enrollment agreement missing. Campus manager can see the required-file checklist.',student:'The fictional student's private portal has not received a new request.',next:'Request agreement'},
 {name:'Send the missing-item alert',staff:'In-app request recorded for this student. Not an email or SMS.',student:'Portal alert: Please submit your signed enrollment agreement.',next:'Show student upload'},
 {name:'Student reviews request',staff:'The manager sees an outstanding document request.',student:'The student signs in under their own authorization and chooses the requested file.',next:'Simulate secure upload'},
 {name:'Secure upload for review',staff:'An encrypted uploaded file would be attached to this student and marked review pending.',student:'Submitted — awaiting management verification. The student can track the status.',next:'Verify submitted agreement'},
 {name:'Manager verifies evidence',staff:'A manager reviews the real signed contract and marks it verified. Audit entry retained.',student:'Enrollment agreement shows Verified in the personal portal.',next:'Review DMV packet'},
 {name:'Clear one first-day blocker',staff:'The signed-agreement requirement is cleared. The NC roster still needs valid identity data, the correct first-day class list and an approved secure delivery channel.',student:'The student can continue viewing attendance and knowledge-check results.',next:'Replay the experience'}
];
export default function SampleEnrollmentWalkthrough(){
 const [step,setStep]=useState(0);
 const item=states[step];
 return <section className="sample-enrollment-flow" aria-label="Simulated student portal and enrollment agreement lifecycle">
  <div className="sectionhead"><div><p className="eyebrow">CLICK-THROUGH PRESENTATION • DEMONSTRATION ONLY</p><h3>Try the private student-document journey</h3><p className="muted">No actual file, SSN, account, message or agreement is created. This walkthrough explains the staff and student views while protected uploads remain gated.</p></div><LockKeyhole size={24}/></div>
  <div className="sample-flow-progress">{states.map((s,i)=><button key={i} title={s.name} type="button" className={i<=step?'active':''} aria-current={i===step?'step':undefined} onClick={()=>setStep(i)}>{i<step?<CheckCircle2 size={17}/>:i+1}</button>)}</div>
  <h4><span className="badge">Step {step+1} of {states.length}</span> {item.name}</h4>
  <div className="sample-flow-cards"><article><div className="sample-flow-label"><FileCheck2 size={20}/> CAMPUS MANAGER</div><p>{item.staff}</p><small>Management-only protected file overview</small></article><article><div className="sample-flow-label"><UserRound size={20}/> STUDENT PORTAL</div><p>{item.student}</p><small>Personal student-authorized view</small></article></div>
  <div className="reportactions"><button className="primary" type="button" onClick={()=>setStep(s=>s===states.length-1?0:s+1)}>{step===states.length-1?<RotateCcw size={17}/>:step===2?<Upload size={17}/>:step===0?<Bell size={17}/>:<ArrowRight size={17}/>} {item.next}</button>
  <button type="button" onClick={()=>setStep(0)}>Reset</button></div>
 </section>;
}
