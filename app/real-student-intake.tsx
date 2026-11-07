'use client';
import {useMemo,useState} from 'react';
import {AlertTriangle,CheckCircle2,ClipboardCheck,FileText,LockKeyhole,Upload,Users} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {parseDmvEnrollmentRoster,intakeMatch,buildIntakeStudent} from '../lib/nc-roster-intake';
type Props={records:R[];role:string;demo:boolean;busy:boolean;saveMany:(rows:R[])=>Promise<boolean>;onNavigate:(page:string)=>void;};
export default function RealStudentIntake({records,role,demo,busy,saveMany,onNavigate}:Props){
 const [raw,setRaw]=useState(''),[campusId,setCampusId]=useState(''),[confirmed,setConfirmed]=useState(false),
  [working,setWorking]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const authorized=['Owner','Regional admin','Campus manager'].includes(role);
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active'&&String(r.state||'').toUpperCase()==='NC');
 const campus=campuses.find(r=>r.id===campusId)||campuses.find(r=>/greensboro/i.test(r.name))||campuses[0];
 const parsed=useMemo(()=>raw.trim()?parseDmvEnrollmentRoster(raw):{rows:[],issues:[]},[raw]);
 const learners=records.filter(r=>r.kind==='students'&&r.campusId===campus?.id);
 const matches=useMemo(()=>parsed.rows.map(row=>({...row,match:intakeMatch(row,learners,campus?.id||'')})),[parsed,campus?.id,records]);
 const dates=new Set(parsed.rows.map(x=>x.startDate+'|'+x.endDate));
 const start=parsed.rows[0]?.startDate||'',end=parsed.rows[0]?.endDate||'';
 const classFor=records.find(r=>r.kind==='classes'&&r.campusId===campus?.id&&r.startDate===start&&r.endDate===end&&r.program==='Class A');
 const newRows=matches.filter(r=>r.match.type==='new'&&!r.issues.length);
 const duplicates=matches.filter(r=>r.match.type==='existing');
 const blocked=matches.filter(r=>r.match.type==='conflict'||r.issues.length);
 const classEnrollment=records.filter(r=>r.kind==='students'&&r.classId===classFor?.id).length;
 const noRoom=!!classFor&&Number(classFor.capacity||0)<newRows.length+classEnrollment;
 const ready=authorized&&!demo&&!!campus&&parsed.rows.length>0&&!parsed.issues.length&&!blocked.length&&dates.size===1&&!noRoom&&newRows.length>0;
 async function selectFile(event:React.ChangeEvent<HTMLInputElement>){
  const f=event.currentTarget.files?.[0];if(!f)return;
  setError('');setMessage('');setConfirmed(false);
  if(f.size>500_000||!(/\.(csv|tsv|txt|md)$/i.test(f.name))){setError('Choose a CSV, TSV, TXT or Markdown roster under 500 KB.');return;}
  setRaw(await f.text());event.currentTarget.value='';
 }
 async function importRoster(){
  if(!ready||!confirmed||working)return;
  setWorking(true);setError('');setMessage('');
  try{
   const classId=classFor?.id||crypto.randomUUID();
   const cls:R|null=classFor?null:{id:classId,kind:'classes',campusId:campus.id,name:'Class A • '+start,
    program:'Class A',status:'In progress',startDate:start,endDate:end,capacity:Math.max(11,parsed.rows.length),
    schedule:'Weekdays • classroom, range, road and testing',theoryHours:50,yardHours:50,roadHours:60,
    capacityNote:'Created from the initial DMV enrollment roster. Management must independently verify approved capacity.',
    rosterSource:'Office-confirmed NCDMV intake'};
   const updates:R[]=[...(cls?[cls]:[]),...newRows.map(r=>buildIntakeStudent(r,campus.id,classId,crypto.randomUUID()))];
   if(!await saveMany(updates))throw Error('The school did not confirm the import. Review the error and retry after checking saved records.');
   setMessage('Imported '+newRows.length+' students into '+campus.name+' • '+start+' through '+end+'. '+duplicates.length+
    ' duplicate(s) were preserved unchanged. No agreement was assumed signed or uploaded. Use Cohort Agreement Intake to attach each signed original securely.');
   setRaw('');setConfirmed(false);
  }catch(e:any){setError(e.message||'Could not save the school intake.');}finally{setWorking(false);}
 }
 return <div className="private-roster-import"><section className="panel">
  <div className="sectionhead"><div><p className="eyebrow">ENROLLMENT OPERATIONS • RESTRICTED IDENTITIES</p><h2><Users size={24}/> Import the real Class A enrollment roster</h2>
   <p className="muted">For authorized Greensboro campus management only. Paste your DMV table or select a CSV/TSV file. The preview is processed only in this browser and is not uploaded until you confirm the import.</p></div><LockKeyhole size={27}/></div>
  {!authorized&&<p className="error">Driver license and DOB imports require Owner, Regional Admin or Campus Manager access.</p>}
  {demo&&<p className="error">Leave synthetic demo mode before importing any real learner identity. Real student information must never be mixed into the 100-person sample dataset.</p>}
  <div className="formgrid"><label>Enrolling campus<select value={campus?.id||''} onChange={e=>{setCampusId(e.target.value);setConfirmed(false);}}>{campuses.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
   <label>Open a local roster file<input type="file" accept=".csv,.tsv,.txt,.md,text/csv,text/tab-separated-values,text/plain" onChange={selectFile} disabled={!authorized||demo}/></label></div>
  <label>Paste confidential NCDMV enrollment table<textarea rows={8} autoComplete="off" spellCheck={false} value={raw} onChange={e=>{setRaw(e.target.value);setConfirmed(false);}} placeholder="Paste the original FIRST_NAME | LAST_NAME | DL_NUMBER | DL_STATE | DATE_OB | START_DATE | END_DATE | Phone Number | Address table here. Never place the contents in GitHub." disabled={!authorized||demo}/></label>
  <p className="footnote"><LockKeyhole size={14}/> No roster data is saved to browser localStorage, analytics or GitHub. The authenticated school API creates student profiles only after management confirmation. Full DOB and driver license fields are management restricted.</p>
 </section>
 {parsed.rows.length>0&&<section className="panel"><div className="sectionhead"><div><p className="eyebrow">PRE-IMPORT REVIEW</p><h3>{parsed.rows.length} students parsed for {campus?.name||'campus'}</h3></div><ClipboardCheck/></div>
  <div className="curriculum-metrics"><div><strong>{newRows.length}</strong><small>New student accounts</small></div><div><strong>{duplicates.length}</strong><small>Existing — skipped</small></div><div><strong>{blocked.length}</strong><small>Resolve before import</small></div><div><strong>{start||'—'}</strong><small>Reported start date</small></div></div>
  {parsed.issues.map((x,i)=><p className="error" key={i}>{x}</p>)}
  {noRoom&&<p className="error">The existing class capacity is {classFor?.capacity} with {classEnrollment} assigned students. Management must review and approve capacity before enrolling {newRows.length} more.</p>}
  {!classFor&&<p className="notice">No matching class exists. The importer will create a Greensboro Class A class dated {start} through {end} with capacity matching the imported roster. Confirm training capacity separately.</p>}
  <div className="tablewrap"><table><thead><tr><th>Student</th><th>Campus</th><th>DOB</th><th>License</th><th>Class dates</th><th>Action</th></tr></thead>
   <tbody>{matches.map((r,i)=><tr key={i}><td><b>{r.name}</b></td><td>{campus?.name}</td><td>{r.dob||'Needs review'}</td><td>{r.licenseState} ••••{r.licenseNumber.slice(-4)}</td><td>{r.startDate} – {r.endDate}</td>
    <td><span className={'badge '+(r.issues.length||r.match.type==='conflict'?'warn':r.match.type==='existing'?'':'good')}>{r.issues.length?r.issues.join(' / '):r.match.reason}</span></td></tr>)}</tbody></table></div>
  <label className="checkboxlabel"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} disabled={!ready}/>
   I have verified the identity data, roster dates, authority to use these student records, campus and class capacity. I understand signed agreements must be uploaded and checked separately.</label>
  <div className="reportactions"><button className="primary" disabled={!ready||!confirmed||busy||working} onClick={importRoster}><Upload size={16}/> {working?'Importing securely…':'Import '+newRows.length+' verified roster entries'}</button>
   <button onClick={()=>onNavigate('cohort-agreements')}><FileText size={16}/> Go to agreement uploads</button></div>
  <p className="footnote">Students are conservatively marked Enrollment pending until their real classroom/yard/road evidence is entered. No fictional hours, exam scores, graduation status or signed agreements are created. Duplicates are skipped rather than overwriting prior student history.</p>
 </section>}
 {error&&<p className="error" role="alert">{error}</p>}
 {message&&<p className="notice" role="status">{message}</p>}
 </div>;
}
