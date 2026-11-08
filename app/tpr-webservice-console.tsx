'use client';
import {useEffect,useState} from 'react';
type Student={id:string;name?:string;campusId?:string};
type Campus={id:string;name?:string;tprLocationId?:string;status?:string};
type Kind='Theory'|'Range'|'PublicRoad';
export default function TprWebServiceConsole({students,campuses,role}:{students:Student[];campuses:Campus[];role:string}){
 const [campus,setCampus]=useState(''),[student,setStudent]=useState(''),[kind,setKind]=useState<Kind>('Theory'),[classCode,setClassCode]=useState('A'),[appType,setAppType]=useState('New'),
 [first,setFirst]=useState(''),[last,setLast]=useState(''),[dob,setDob]=useState(''),[number,setNumber]=useState(''),[state,setState]=useState('NC'),
 [completed,setCompleted]=useState(''),[score,setScore]=useState(''),[hours,setHours]=useState(''),[method,setMethod]=useState('Inperson'),
 [verified,setVerified]=useState(false),[busy,setBusy]=useState(false),[result,setResult]=useState(''),[error,setError]=useState('');
 const currentCampus=campus||campuses.find(c=>c.status==='Active')?.id||'';
 const currentStudents=students.filter(s=>s.campusId===currentCampus);
 const currentStudent=currentStudents.some(s=>s.id===student)?student:currentStudents[0]?.id||'';
 function form(){return {firstName:first.trim(),lastName:last.trim(),dateOfBirth:dob,number:number.trim(),state:state.trim().toUpperCase(),classCode,
   applicationType:['A','B'].includes(classCode)?appType:undefined,trainingType:kind,completionDate:completed,trainingMethod:kind==='Theory'?method:undefined,score:kind==='Theory'?Number(score):undefined,hours:kind==='Theory'?undefined:Number(hours)};}
 async function check(action:'preview'|'submit'){
  if(!currentCampus||!currentStudent)return;setBusy(true);setResult('');setError('');
  if(action==='submit'&&!window.confirm('This will submit an actual driver training certification to the federal FMCSA registry. Confirm that you verified the official student identity, training evidence, hours and completion date. Continue?')){setBusy(false);return;}
  try{const r=await fetch('/api/tpr/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,campusId:currentCampus,studentId:currentStudent,training:form(),...(action==='submit'?{confirm:'I verified this official training certification'}:{})})});
   const j=await r.json();
   if(!r.ok)throw Error(j.error||(j.issues||[]).join('; ')||'FMCSA review failed');
   if(action==='preview'){setVerified(!!j.ready);setResult(j.ready?'Readiness checks passed. No federal data sent.':'Additional verification required: '+(j.issues||[]).join('; '));}
   else{setVerified(false);setResult(j.accepted?'FMCSA returned 201 Created. Submission ID: '+j.submissionId:'Transmission status: '+j.status+'. Verify via the authorized portal.');}
  }catch(e:any){setVerified(false);setError(e.message||'Federal service unavailable');}
  finally{setBusy(false);}
 }
 return <section className="panel" aria-label="Official TPR Web Service certification">
  <h3>FMCSA certification review & secure submission</h3>
  <p className="muted">Authorized management only. This form contains student identifiers: they are transmitted solely to the official FMCSA endpoint after human approval and only when the school's server credentials and acceptance flags are enabled. Fields are not saved in this form.</p>
  {error&&<p className="error" role="alert">{error}</p>}{result&&<p className="notice" role="status">{result}</p>}
  <div className="formgrid">
   <label>Training location<select value={currentCampus} onChange={e=>{setCampus(e.target.value);setStudent('');setVerified(false)}}>{campuses.filter(c=>c.status==='Active').map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <label>Student<select value={currentStudent} onChange={e=>{setStudent(e.target.value);setVerified(false)}}>{currentStudents.map(s=><option key={s.id} value={s.id}>{s.name||'Student record'}</option>)}</select></label>
   <label>First name (as verified)<input autoComplete="off" value={first} onChange={e=>{setFirst(e.target.value);setVerified(false)}} maxLength={100}/></label>
   <label>Last name (as verified)<input autoComplete="off" value={last} onChange={e=>{setLast(e.target.value);setVerified(false)}} maxLength={100}/></label>
   <label>Date of birth<input type="date" value={dob} onChange={e=>{setDob(e.target.value);setVerified(false)}}/></label>
   <label>CLP/CDL number<input autoComplete="off" value={number} onChange={e=>{setNumber(e.target.value);setVerified(false)}} maxLength={50}/></label>
   <label>Issuing state code<input value={state} onChange={e=>{setState(e.target.value);setVerified(false)}} maxLength={5}/></label>
   <label>Class / endorsement<select value={classCode} onChange={e=>{setClassCode(e.target.value);setVerified(false)}}>{['A','B','P','S','H'].map(x=><option key={x}>{x}</option>)}</select></label>
   {['A','B'].includes(classCode)&&<label>Application<select value={appType} onChange={e=>{setAppType(e.target.value);setVerified(false)}}><option>New</option><option>Upgrade</option></select></label>}
   <label>Training area<select value={kind} onChange={e=>{setKind(e.target.value as Kind);setVerified(false)}}><option value="Theory">Theory</option><option value="Range">Behind the wheel — Range</option><option value="PublicRoad">Behind the wheel — Public road</option></select></label>
   <label>Actual completion date<input type="date" value={completed} onChange={e=>{setCompleted(e.target.value);setVerified(false)}}/></label>
   {kind==='Theory'?<><label>Method<select value={method} onChange={e=>{setMethod(e.target.value);setVerified(false)}}><option value="Inperson">In person</option><option value="Online">Online (only if allowed and accurate)</option></select></label><label>Verified final exam score<input type="number" min="80" max="100" value={score} onChange={e=>{setScore(e.target.value);setVerified(false)}}/></label></>:<label>Verified actual BTW clock hours<input type="number" min="0.01" max="1000" step="0.01" value={hours} onChange={e=>{setHours(e.target.value);setVerified(false)}}/></label>}
  </div>
  <div className="reportactions"><button type="button" disabled={busy||!currentStudent} onClick={()=>check('preview')}>Validate training certification</button>
   {role==='Owner'&&<button type="button" className="primary" disabled={busy||!verified} onClick={()=>check('submit')}>Authorize official FMCSA submission</button>}
  </div>
  <p className="muted">The federal submit action is locked server-side unless a school owner enables it after official Web Service credential installation and successful test acceptance. An HTTP 201 is recorded as accepted; unknown outcomes require manual reconciliation before retrying.</p>
 </section>;
}
