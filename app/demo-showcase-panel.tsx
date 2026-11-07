'use client';
import {BarChart3,BookOpen,CalendarClock,ChevronRight,FileCheck2,GraduationCap,Play,ShieldCheck,Users} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
type Props={records:R[];onPlay:()=>void;onNavigate:(page:string)=>void};
const statuses=['Enrollment pending','Enrolled','Waiting for permit','Classroom','Yard','Road','Test preparation','Graduated','Withdrawn'];
export default function DemoShowcasePanel({records,onPlay,onNavigate}:Props){
 const students=records.filter(r=>r.kind==='students'),pending=records.filter(r=>r.kind==='leads'&&r.status==='Funding pending');
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const groups=statuses.map(status=>({status,number:students.filter(s=>s.status===status).length})),max=Math.max(1,...groups.map(r=>r.number));
 return <section className="demo-showcase-panel" aria-label="Fictional pilot network overview">
  <div className="demo-showcase-hero"><div className="demo-showcase-inner"><p className="eyebrow">LONE STAR · OWNERSHIP PRESENTATION</p><span className="badge">100% SYNTHETIC TRAINING RECORDS</span><h2>Experience the entire academy<br/><em>from one screen.</em></h2><p>Admissions, enrollment, secure records, a central school document center, staff scheduling, daily attendance, instructor lesson plans, training, messaging, funding and campus oversight—connected through one academy.</p>
   <div className="demo-showcase-actions"><button className="primary" onClick={onPlay}><Play size={18}/> Watch the student lifecycle walkthrough</button><button onClick={()=>onNavigate('student-portal-preview')}><GraduationCap size={18}/> Try the Student Portal <ChevronRight size={14}/></button></div></div>
   <div className="demo-showcase-stats"><div><strong>{students.length}</strong><small>Fictional students in all stages</small></div><div><strong>{pending.length}</strong><small>Funding-pending applicants</small></div><div><strong>{campuses.length}</strong><small>Connected demo campuses</small></div></div></div>
  <div className="demo-showcase-columns">
   <div className="demo-showcase-section"><div className="sectionhead"><h3><BarChart3 size={18}/> Student lifecycle by status</h3><span className="badge">All stages</span></div>{groups.map(g=><div className="demo-showcase-bar" key={g.status}><span>{g.status}</span><div><i style={{width:Math.round(g.number/max*100)+'%'}}/></div><b>{g.number}</b></div>)}</div>
   <div className="demo-showcase-section"><div className="sectionhead"><h3><Users size={18}/> School network</h3><span className="badge">Campus scope</span></div>{campuses.map(c=><div className="demo-showcase-campus" key={c.id}><span><strong>{c.name}</strong><small>{c.city||''}{c.state?' · '+c.state:''}</small></span><div><b>{students.filter(s=>s.campusId===c.id).length}</b><small>students</small></div><div><b>{pending.filter(x=>x.campusId===c.id).length}</b><small>funding</small></div></div>)}</div>
  </div>
  <section className="panel" aria-label="Full presentation feature and readiness breakdown"><div className="sectionhead"><div><p className="eyebrow">FULL ACADEMY OS FEATURE INVENTORY</p><h3>Everything included in the school presentation</h3><p className="muted">Tap a feature to see its actual screen. A feature listed here may still need provider credentials, privacy acceptance or genuine instructor evidence. This is a synthetic walkthrough—not a statement that every real campus is configured.</p></div><BookOpen size={24}/></div>
 <div className="tablewrap"><table><thead><tr><th>School workflow</th><th>What the demo demonstrates</th><th>Current rollout boundary</th><th>Open</th></tr></thead><tbody>
 {([
 ['Owner dashboard & reports','Three campuses, alerts, weekly reports, expansion','Live records require account access','overview'],
 ['Lead intake & referrals','Inquiries, outreach, appointments, events, WIOA/WRLP','External agencies are not auto-synced','growth'],
 ['Classes, calendars & enrollments','Class start dates, enrollment pending and active cohorts','Live cohort setup required','rosters'],
 ['Student Records & Student 360','Enrollment, contacts, permit stage and graduation journey','Historic reported hours remain unverified','students'],
 ['Private enrollment files','Bulk signed agreements matched to the right student','Encrypted private uploads require recovery approval','document-center'],
 ['School Document Center','Procedures, staff forms, versioned guides and external links','Policy text works; file uploads gated','school-knowledge'],
 ['School calendar & announcements','School closures, meetings and student-facing notices','Published notices follow campus visibility','school-notices'],
 ['Staff work calendar','Shift view, staffing by campus, weekly print and conflicts','Not a payroll time clock','shifts'],
 ['Whole-class attendance & smileys','7AM–4PM instruction, breaks, daily checks and exceptions','Verified hours require actual instructor logs','courses'],
 ['Instructor 25-day lesson playbook','30 FMCSA theory subjects, licensed J. J. Keller mapping, HOS and atlas practice','Vendor-specific lessons need licensed mapping','driver-playbook'],
 ['Individual skill checkoffs','Classroom, yard and road competency coaching','Regulatory proficiency requires evidence','lesson-checkoffs'],
 ['Classroom 40/50-hour readiness','Pending carry-forward versus verified hours','No fictional training evidence','rosters'],
 ['Automatic classroom-to-yard gate','50 verified hours, CLP, drug-screen clearance','Requires verified uploads and management clearance','students'],
 ['Knowledge tests & grades','Theory exams, practice quizzes and 80% threshold','External training portal not auto-synced','learning-diagnostics'],
 ['Daily training dispatch','Vehicle, staff, timesheet and schedule coordination','Fleet and real dispatch source must be checked','dispatch'],
 ['Road, skills & training reports','Driving versus observation, night and practice progress','Instructor logs and state approvals are separate','courses'],
 ['Student portal and Driver Pulse','Self-service training stage, files, progress, job transition','External Driver Pulse account separate','student-portal-preview'],
 ['Student email/SMS & templates','Consent-aware drafts and reusable templates','Twilio and Resend credentials required','student-communications'],
 ['Payments, invoices & employer letters','Cash, WIOA, WRLP, tuition and conditional offers','Bank, agency and Stripe verification separate','student-payments'],
 ['Agency partners & career outcomes','Reentry, workforce, employers and follow-ups','Do not imply partner API connection','partners'],
 ['User access, roles & oversight','Staff sign-in, role access and campus scopes','School staff accounts must be provisioned','pilot-access'],
 ['Integrations & launch acceptance','Microsoft, email, SMS, storage, backup/privacy readiness','Unconfigured items are explicitly shown','integrations']
 ] as const).map(([name,description,limit,page])=><tr key={name}><td><b>{name}</b></td><td>{description}</td><td><small>{limit}</small></td><td><button type="button" onClick={()=>onNavigate(page)}>Open</button></td></tr>)}
 </tbody></table></div></section>
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
