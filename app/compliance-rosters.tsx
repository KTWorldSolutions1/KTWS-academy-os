'use client';
import {useState} from 'react';
import type {RecordData as R} from '../lib/training';
import {classEnding,proposedBiweeklyStarts,FUNDING_TYPES} from '../lib/compliance-roster';
import {CalendarDays,Download,FileCheck2,ShieldCheck,AlertTriangle} from 'lucide-react';
type Props={records:R[];role:string;demo:boolean;busy:boolean;saveMany:(rows:R[])=>Promise<boolean>};
export default function ComplianceRosters({records,role,demo,busy,saveMany}:Props){
 const campuses=records.filter(c=>c.kind==='campuses'&&c.status==='Active');
 const [selectedCampus,setSelectedCampus]=useState(''),[selectedClass,setSelectedClass]=useState(''),[preview,setPreview]=useState<any>(null),[loading,setLoading]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const campus=campuses.find(c=>c.id===selectedCampus)||campuses[0];
 const classes=records.filter(c=>c.kind==='classes'&&c.campusId===campus?.id).sort((a,b)=>String(b.startDate||'').localeCompare(String(a.startDate||'')));
 const klass=classes.find(c=>c.id===selectedClass)||classes[0];
 const students=records.filter(s=>s.kind==='students'&&s.classId===klass?.id&&s.campusId===campus?.id&&s.status!=='Withdrawn');
 const canManage=['Owner','Regional admin','Campus manager'].includes(role);
 async function audit(){
  if(!klass||demo)return;
  setLoading(true);setError('');setPreview(null);
  try{const r=await fetch('/api/compliance/roster?classId='+encodeURIComponent(klass.id),{cache:'no-store'}),body=await r.json();if(!r.ok)throw Error(body.error||'Roster review unavailable');setPreview(body);}
  catch(e:any){setError(e.message);}finally{setLoading(false);}
 }
 async function createDates(){
  if(!campus)return;
  setError('');setMessage('');
  const dates=proposedBiweeklyStarts();
  const existing=new Set(classes.map(c=>c.startDate+'|'+c.program));
  const missing=dates.filter(d=>!existing.has(d+'|Class A')).map(startDate=>({
   id:crypto.randomUUID(),kind:'classes',campusId:campus.id,name:'Class A • '+startDate,
   status:'Open for enrollment',program:'Class A',startDate,endDate:classEnding(startDate),
   schedule:'Monday–Friday • Five-week program • Week 5 testing',capacity:8,tuition:'',pricingStatus:'Pending campus-approved tuition and funding terms',
   theoryHours:50,yardHours:50,roadHours:60,fundingOptions:[...FUNDING_TYPES],
   schedulingNote:'Proposed two-week start cadence; verify staffing, fleet availability, state approval, holidays and training calendar.'
  }));
  if(!missing.length){setMessage('These biweekly Class A start dates are already configured.');return;}
  if(await saveMany(missing))setMessage('Created '+missing.length+' proposed biweekly class dates. Review calendars and capacity before accepting students.');
  else setError('Could not save proposed class dates.');
 }
 return <div className="compliance-rosters"><section className="panel"><div className="sectionhead"><div><p className="eyebrow">REGULATORY REPORTS • LIMITED ACCESS</p><h2>First-day class rosters & enrollment agreements</h2><p className="muted">NC 19A NCAC 03J .0308 requires a roster as of the first day of class and copies of each student's signed contracts. Academy OS prepares a restricted ZIP packet containing the roster CSV and actual verified enrollment agreements. No automatic NCDMV submission is performed.</p></div><ShieldCheck size={26}/></div>
 <div className="formgrid"><label>Campus<select value={campus?.id||''} onChange={e=>{setSelectedCampus(e.target.value);setSelectedClass('');setPreview(null);}}>{campuses.map(c=><option value={c.id} key={c.id}>{c.name}{c.state?' • '+c.state:''}</option>)}</select></label><label>Class/select roster<select value={klass?.id||''} onChange={e=>{setSelectedClass(e.target.value);setPreview(null);}}>{!classes.length&&<option value="">No scheduled classes</option>}{classes.map(c=><option key={c.id} value={c.id}>{c.name} • {c.startDate||'Start pending'}</option>)}</select></label></div>
 {klass&&<div className="curriculum-metrics"><div><strong>{students.length}</strong><small>Students assigned to the class</small></div><div><strong>{klass.startDate||'—'}</strong><small>Class start date</small></div><div><strong>{klass.endDate||'—'}</strong><small>Class end date</small></div><div><strong>{klass.capacity||'—'}</strong><small>Planned capacity</small></div></div>}
 <div className="reportactions"><button disabled={!klass||busy||demo||loading||!canManage} onClick={audit}><FileCheck2 size={16}/> Check first-day packet readiness</button>
 <button disabled={!klass||busy||demo||!canManage||!preview?.ready||preview.draft} className="primary" onClick={()=>{if(!klass||!window.confirm('This download contains unredacted DOBs, driver license numbers, addresses and signed contracts. Store and deliver only through the approved secure compliance channel. Continue?'))return;window.location.assign('/api/compliance/roster?download=1&classId='+encodeURIComponent(klass.id));}}><Download size={16}/> Download restricted compliance ZIP</button></div>
 {demo&&<p className="notice">Sample-mode students are fictional. Actual identity data and agreement downloads are disabled in demo mode.</p>}
 {preview&&<><p className={preview.ready?'notice':'error'}>{preview.ready?'All '+preview.count+' class records passed the packet preflight check.':'Missing data or agreements must be resolved before generating the packet.'}</p>{preview.draft&&<p className="notice">Before the class start date this is a planning preview; verify who is actually enrolled on the first instructional day before issuing the final report.</p>}
 {preview.students?.map((s:any)=><div className="vault-doc-row" key={s.studentId}><div><b>{s.name}</b><small>{s.gaps?.length?s.gaps.join(' • '):'Roster and signed agreement verified'}</small></div><span className={'badge '+(s.gaps?.length?'warn':'good')}>{s.gaps?.length?'Needs review':'Ready'}</span></div>)}</>}
 {!klass&&<p className="muted">Create a class from the calendar or add proposed class dates below.</p>}
 {message&&<p className="notice">{message}</p>}{error&&<p className="error" role="alert">{error}</p>}
 <p className="footnote">Regulatory roster fields: legal name, driver license number, postal address, telephone and enrollment agreement(s); school-requested extras: DOB, class dates and funding type. SSNs and drug screening records are deliberately excluded. Do not transmit unencrypted ZIPs over ordinary email. Texas reports need a separate Texas-specific approval and template.</p></section>
 <section className="panel"><div className="sectionhead"><div><p className="eyebrow">ADMISSIONS PLANNING</p><h2>Class start calendar • every two weeks</h2><p className="muted">Suggested Class A starts begin Monday, November 16, 2026. Dates are proposals, not a promise that a campus has available instructors, trucks or approved capacity. Five-week end dates assume a Monday start and Friday of Week 5.</p></div><CalendarDays size={25}/></div>
 <div className="biweekly-grid">{proposedBiweeklyStarts().map(d=><div className="biweekly-date" key={d}><b>{d}</b><small>Testing week ends {classEnding(d)}</small><span className="badge">{classes.some(c=>c.startDate===d&&c.program==='Class A')?'Configured':'Proposed'}</span></div>)}</div>
 <button disabled={busy||!canManage||!campus||demo} onClick={createDates} className="primary">Add missing biweekly start dates to this campus</button>
 <p className="footnote">Each class supports cash, WIOA, WRLP, Vocational Rehabilitation, scholarships, employer-funded training and an additional outside-funding category. Authorization, funding amounts and approval still require their own verified records.</p></section></div>;
}
