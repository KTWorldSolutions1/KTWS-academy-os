'use client';
import {BarChart3,BookOpen,CalendarClock,ChevronRight,FileCheck2,GraduationCap,Play,ShieldCheck,Users} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
type Props={records:R[];onPlay:()=>void;onNavigate:(page:string)=>void};
const statuses=['Enrollment pending','Waiting for permit','Classroom','Yard','Road','Test preparation','Graduated','Withdrawn'];
export default function DemoShowcasePanel({records,onPlay,onNavigate}:Props){
 const students=records.filter(r=>r.kind==='students'),pending=records.filter(r=>r.kind==='leads'&&r.status==='Funding pending');
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const groups=statuses.map(status=>({status,number:students.filter(s=>s.status===status).length})),max=Math.max(1,...groups.map(r=>r.number));
 return <section className="demo-showcase-panel" aria-label="Fictional pilot network overview">
  <div className="demo-showcase-hero"><div className="demo-showcase-inner"><p className="eyebrow">LONE STAR · OWNERSHIP PRESENTATION</p><span className="badge">100% SYNTHETIC TRAINING RECORDS</span><h2>Experience the entire academy<br/><em>from one screen.</em></h2><p>Admissions, funding, secure document requests, student ID cards, theory, daily driver training, permit readiness and compliance—all linked to the right campus.</p>
   <div className="demo-showcase-actions"><button className="primary" onClick={onPlay}><Play size={18}/> Watch the student lifecycle walkthrough</button><button onClick={()=>onNavigate('student-portal-preview')}><GraduationCap size={18}/> Try the Student Portal <ChevronRight size={14}/></button></div></div>
   <div className="demo-showcase-stats"><div><strong>{students.length}</strong><small>Fictional students in all stages</small></div><div><strong>{pending.length}</strong><small>Funding-pending applicants</small></div><div><strong>{campuses.length}</strong><small>Connected demo campuses</small></div></div></div>
  <div className="demo-showcase-columns">
   <div className="demo-showcase-section"><div className="sectionhead"><h3><BarChart3 size={18}/> Student lifecycle by status</h3><span className="badge">All stages</span></div>{groups.map(g=><div className="demo-showcase-bar" key={g.status}><span>{g.status}</span><div><i style={{width:Math.round(g.number/max*100)+'%'}}/></div><b>{g.number}</b></div>)}</div>
   <div className="demo-showcase-section"><div className="sectionhead"><h3><Users size={18}/> School network</h3><span className="badge">Campus scope</span></div>{campuses.map(c=><div className="demo-showcase-campus" key={c.id}><span><strong>{c.name}</strong><small>{c.city||''}{c.state?' · '+c.state:''}</small></span><div><b>{students.filter(s=>s.campusId===c.id).length}</b><small>students</small></div><div><b>{pending.filter(x=>x.campusId===c.id).length}</b><small>funding</small></div></div>)}</div>
  </div>
  <div className="demo-showcase-quick">
   {[
    {title:'Private enrollment vault',help:'Simulate missing-file alerts and ID cards',page:'document-center',Icon:ShieldCheck},
    {title:'DMV first-day roster',help:'Review missing signed agreements',page:'rosters',Icon:FileCheck2},
    {title:'CDL knowledge gaps',help:'Discover missed General, Air and Combination concepts',page:'learning-diagnostics',Icon:BookOpen},
    {title:'Staff assignments',help:'Coordinate a team member and location',page:'tasks',Icon:CalendarClock}
   ].map(({title,help,page,Icon})=><button key={page} onClick={()=>onNavigate(page)}><Icon size={22}/><span><b>{title}</b><small>{help}</small></span><ChevronRight size={17}/></button>)}
  </div>
  <p className="footnote">This presentation never inserts its fictitious students, documents, appointments or grades into production school records. Test-mode files contain no Social Security numbers, real driver licenses or real signed agreements. Secure real-student uploads and portal access remain gated until owner security acceptance.</p>
 </section>;
}
