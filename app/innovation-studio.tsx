'use client';
import {useMemo,useState} from 'react';
import {Activity,ArrowRight,BookOpen,CheckCircle2,ClipboardList,Clock3,GraduationCap,Lock,Play,RotateCcw,ShieldAlert,Sparkles,Truck,Users,WandSparkles} from 'lucide-react';
import {simulatedTime,innovationCounts,studentPhases as phases,phaseOf,type StudioRecord as Rec,type SimState,type PunchEvent} from '../lib/innovation-analytics';
type Props={records:Rec[];onNavigate:(page:string)=>void};
const tabs=['Safe Playground','Command Center','Student Journey','Yard & Fleet','Admissions Autopilot','Compliance Tower','Workflow Studio','Ask Academy OS'] as const;
type Tab=typeof tabs[number];
const fmt=(n:number)=>{const h=Math.floor(n/60),m=n%60;return h+':'+String(m).padStart(2,'0');};
const roleHelp:Record<string,string>={
 'Owner':'All campuses; school configuration and approvals',
 'Campus manager':'Campus operations, training and management reviews',
 'Admin assistant':'Rosters, scheduling, student and office records',
 'Instructor':'Instruction, attendance and training evidence',
 'Front desk':'Appointments, student intake and calendars',
 'Student':'My own program milestones and learning resources'
};
function MiniStat({label,value,hint}:{label:string;value:number;hint:string}){return <div className="panel" style={{padding:18,flex:'1 1 145px',minWidth:145}}><p className="eyebrow">{label}</p><h2 style={{margin:'8px 0'}}>{value}</h2><p className="muted">{hint}</p></div>;}
export default function InnovationStudio({records,onNavigate}:Props){
 const [tab,setTab]=useState<Tab>('Safe Playground'),[role,setRole]=useState('Campus manager'),[student,setStudent]=useState(''),[events,setEvents]=useState<PunchEvent[]>([]),[clock,setClock]=useState(8*60),[query,setQuery]=useState(''),[question,setQuestion]=useState(''),[workflows,setWorkflows]=useState<string[]>([]);
 const counts=useMemo(()=>innovationCounts(records),[records]);
 const sim=simulatedTime(events,clock);
 const activeStudent=counts.students.find(s=>s.id===student)||counts.students[0];
 const actions:Record<SimState,PunchEvent['action'][]>= {out:['clock_in'],working:['break_start','clock_out'],break:['break_end']};
 function perform(action:PunchEvent['action']){if(actions[sim.state].includes(action))setEvents(p=>[...p,{action,minute:clock}]);}
 const rules=[{id:'permit',name:'Permit follow-up',description:'Create a review queue for students without permit/license reference',count:counts.clpWaiting.length,destination:'students'},
  {id:'tpr',name:'Federal reporting review',description:'Route unconfirmed TPR records to the compliance manager; never auto-submit',count:counts.pendingTpr.length,destination:'tpr'},
  {id:'admissions',name:'Admissions contact queue',description:'Review open leads for follow-up rather than claiming messages were sent',count:counts.leads.length,destination:'leads'},
  {id:'truck',name:'Vehicle readiness check',description:'Send fleet availability for instructor review before assignments',count:counts.trucks.length,destination:'dispatch'}];
 const answer=(()=>{const q=question.toLowerCase();if(!q)return '';
  if(q.includes('permit')||q.includes('clp'))return counts.clpWaiting.length+' visible students lack a recorded CLP/license reference. This is a data-entry flag, not proof that they lack a permit.';
  if(q.includes('tpr')||q.includes('fmcsa'))return counts.pendingTpr.length+' visible TPR tracking records are not marked Confirmed. Academy OS does not submit to FMCSA automatically.';
  if(q.includes('truck')||q.includes('fleet'))return counts.trucks.length+' fleet records are visible. Check the Daily Training Plan and vehicle inspection status before dispatch.';
  if(q.includes('lead')||q.includes('admission'))return counts.leads.length+' open leads appear in your permitted campus records. The admissions team should check next-contact dates.';
  if(q.includes('student')||q.includes('graduat'))return counts.students.length+' non-withdrawn students are visible to your account. Review individual progression for verified completion.';
  return 'I can answer saved-record questions about permits, TPR, trucks, admissions leads and students. I cannot infer missing facts or access records outside your permissions.';
 })();
 return <div className="panel" style={{display:'grid',gap:16}}>
  <div className="sectionhead"><div><p className="eyebrow">ACADEMY OS · PRODUCT INNOVATION</p><h2>Innovation Studio</h2><p className="muted">One place to test, inspect and design faster workflows. School records remain governed by your existing campus permissions.</p></div></div>
  <nav aria-label="Innovation Studio tools" style={{display:'flex',flexWrap:'wrap',gap:8}}>{tabs.map(t=><button key={t} type="button" aria-current={tab===t?'page':undefined} className={tab===t?'primary':''} onClick={()=>setTab(t)}>{t}</button>)}</nav>
  {tab==='Safe Playground'&&<section aria-label="Isolated time clock simulation" style={{display:'grid',gap:12}}>
   <p className="notice"><strong>SAFE SIMULATION ONLY</strong> — All punches, clock advances and role previews on this screen exist only in this browser session. Nothing is written to live payroll, D1, staff records or FMCSA.</p>
   <label>Preview a fictional employee role <select value={role} onChange={e=>setRole(e.target.value)}>{Object.keys(roleHelp).map(r=><option key={r}>{r}</option>)}</select></label>
   <p className="muted">{roleHelp[role]} · Display preview only; your real permissions do not change.</p>
   <div className="formgrid"><MiniStat label="Simulated time" value={clock} hint={'Shift clock '+fmt(clock)}/><MiniStat label="Paid minutes" value={sim.paid} hint={(sim.paid/60).toFixed(2)+' paid hours'}/><MiniStat label="Unpaid break" value={sim.breaks} hint="Simulated minutes only"/></div>
   <p><strong>Current clock state:</strong> {sim.state==='out'?'Clocked out':sim.state==='working'?'Clocked in and working':'Unpaid break'}</p>
   <div className="reportactions">
    <button type="button" className="primary" disabled={!actions[sim.state].includes('clock_in')} onClick={()=>perform('clock_in')}>Clock In</button>
    <button type="button" disabled={!actions[sim.state].includes('break_start')} onClick={()=>perform('break_start')}>Start Break</button>
    <button type="button" disabled={!actions[sim.state].includes('break_end')} onClick={()=>perform('break_end')}>End Break</button>
    <button type="button" disabled={!actions[sim.state].includes('clock_out')} onClick={()=>perform('clock_out')}>Clock Out</button>
    <button type="button" onClick={()=>setClock(x=>x+15)}>Advance 15 min</button>
    <button type="button" onClick={()=>setClock(x=>x+60)}>Advance 1 hour</button>
    <button type="button" onClick={()=>{setClock(480);setEvents([]);}}>Reset test</button>
   </div>
   <h3>Simulated punch audit</h3>
   {events.length===0?<p className="muted">Clock in to see your fictional shift history.</p>:<ol>{events.map((e,i)=><li key={i}>{e.action.replaceAll('_',' ')} · {fmt(e.minute)}</li>)}</ol>}
   <button type="button" onClick={()=>onNavigate('timeclock')}>Go to actual employee time clock <ArrowRight size={16}/></button>
  </section>}
  {tab==='Command Center'&&<section style={{display:'grid',gap:12}}>
   <p className="muted">Live read-only summaries of the records returned for your account. Counts are not guarantees of regulatory compliance or payroll correctness.</p>
   <div className="formgrid"><MiniStat label="Visible students" value={counts.students.length} hint="Not withdrawn"/><MiniStat label="Active leads" value={counts.leads.length} hint="Admissions queue"/><MiniStat label="Fleet records" value={counts.trucks.length} hint="Not necessarily available"/><MiniStat label="Open TPR reviews" value={counts.pendingTpr.length} hint="Confirmation pending"/></div>
   <div className="reportactions"><button onClick={()=>onNavigate('insights')}>School analytics</button><button onClick={()=>onNavigate('manager-brief')}>Weekly report</button><button onClick={()=>onNavigate('payroll-report')}>Campus payroll</button><button onClick={()=>onNavigate('attention')}>Resolve alerts</button></div>
  </section>}
  {tab==='Student Journey'&&<section style={{display:'grid',gap:12}}>
   <p className="muted">Preview how saved student stages appear in a milestone journey. No training hours or certifications are awarded by this display.</p>
   {counts.students.length?<><label>Student <select value={activeStudent?.id||''} onChange={e=>setStudent(e.target.value)}>{counts.students.map(s=><option value={s.id} key={s.id}>{s.name||'Unnamed student'}</option>)}</select></label>
   <div style={{display:'flex',flexWrap:'wrap',gap:8}}>{phases.map((p,i)=><div key={p} style={{padding:'12px',border:'1px solid var(--border,#d1d5db)',borderRadius:12,minWidth:130,flex:'1 1 130px',opacity:i>phaseOf(activeStudent)?0.48:1}}><div>{i<=phaseOf(activeStudent)?'✓':'○'}</div><strong>{p}</strong><p className="muted">{i===phaseOf(activeStudent)?'Recorded stage':'Stage preview'}</p></div>)}</div>
   <p className="muted">Stages reflect the saved status field, not a verified completion or graduation decision. Final progression must pass existing course, permit and instructor checks.</p></>:<p className="muted">No students available in your permitted records.</p>}
   <button onClick={()=>onNavigate('students')}>Open student records</button>
  </section>}
  {tab==='Yard & Fleet'&&<section style={{display:'grid',gap:12}}>
   <p className="muted">Visible fleet entries. A vehicle cannot be presumed available solely because its status says Active; use inspection and dispatch controls.</p>
   {counts.trucks.slice(0,15).map(t=><div key={t.id} className="notice"><Truck size={18}/><strong>{t.name||'Truck'}</strong> · {t.status||'Status not recorded'}</div>)}
   {!counts.trucks.length&&<p className="muted">No fleet entries are currently visible.</p>}
   <div className="reportactions"><button onClick={()=>onNavigate('dispatch')}>Daily Training Plan</button><button onClick={()=>onNavigate('fleet')}>Truck inspections</button></div>
  </section>}
  {tab==='Admissions Autopilot'&&<section style={{display:'grid',gap:12}}>
   <div className="formgrid"><MiniStat label="Leads needing review" value={counts.leads.length} hint="Open pipeline"/></div>
   {counts.leads.slice(0,12).map(l=><div key={l.id} className="notice"><Users size={17}/><strong>{l.name||'Prospect'}</strong> · {l.status||'Unclassified'}</div>)}
   <p className="muted">Review queue only. No email, text, or applicant outreach is sent from this screen. Automated messaging requires opt-in and a separate verified provider connection.</p>
   <button onClick={()=>onNavigate('leads')}>Manage leads and next contacts</button>
  </section>}
  {tab==='Compliance Tower'&&<section style={{display:'grid',gap:12}}>
   <p className="notice"><strong>Review flags, not compliance findings.</strong> These checks reveal missing internal fields only; the official FMCSA/DMV records and authorized reviewers remain authoritative.</p>
   <div className="formgrid"><MiniStat label="Permit fields absent" value={counts.clpWaiting.length} hint="Review student profiles"/><MiniStat label="TPR not confirmed" value={counts.pendingTpr.length} hint="Verify actual federal receipt"/><MiniStat label="TPR campus IDs absent" value={counts.missingTprCampus.length} hint="Verify registrations"/><MiniStat label="Expired credential fields" value={counts.expiredCredentials.length} hint="Review individual records"/></div>
   <div className="reportactions"><button onClick={()=>onNavigate('tpr')}>FMCSA / ELDT Reporting</button><button onClick={()=>onNavigate('credentials')}>Staff licenses</button><button onClick={()=>onNavigate('compliance')}>School readiness</button></div>
  </section>}
  {tab==='Workflow Studio'&&<section style={{display:'grid',gap:12}}>
   <p className="notice"><strong>PREVIEW MODE</strong> — These templates calculate what a rule would flag; they do not automatically edit student records, transmit federal data, contact people or trigger actions.</p>
   {rules.map(r=><div key={r.id} className="panel" style={{padding:12}}><label><input type="checkbox" checked={workflows.includes(r.id)} onChange={e=>setWorkflows(x=>e.target.checked?[...x,r.id]:x.filter(z=>z!==r.id))}/> <strong>{r.name}</strong></label><p className="muted">{r.description}</p><p>{r.count} visible record(s) would enter this review queue.</p><button type="button" onClick={()=>onNavigate(r.destination)}>Open source workflow <ArrowRight size={14}/></button></div>)}
   <p className="muted">{workflows.length} template(s) selected for local preview. Nothing scheduled or saved. Production automations require rule ownership, idempotence, opt-in checks, rollback design and an auditable job runner.</p>
  </section>}
  {tab==='Ask Academy OS'&&<section style={{display:'grid',gap:12}}>
   <p className="notice">Record-grounded question preview; deterministic answers from your visible records. This is not a connected generative AI service.</p>
   <div className="reportactions">{['Who needs a permit review?','Which TPR entries are pending?','How many trucks are listed?','How many admissions leads?','How many students?'].map(q=><button key={q} type="button" onClick={()=>setQuestion(q)}>{q}</button>)}</div>
   <label>Ask about permits, TPR, fleet, leads or students <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Example: Who needs a permit review?"/></label>
   <button type="button" className="primary" onClick={()=>setQuestion(query.trim())} disabled={!query.trim()}>Ask records</button>
   {question&&<div className="notice" role="status"><Sparkles size={18}/><strong>{question}</strong><p>{answer}</p></div>}
   <p className="muted">Answers intentionally avoid exposing personal identifiers, proprietary files and information not returned by your existing campus permissions.</p>
  </section>}
 </div>;
}
