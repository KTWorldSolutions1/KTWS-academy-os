'use client';
import {useEffect,useState} from 'react';
import {weekStart} from '../lib/staff-scheduling';

type ClockData={self:boolean;employee:{id:string;name:string};current:{state:string};assignedCampuses:{id:string;name:string}[]};
const thisWeek=()=>weekStart(new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'}));
export default function QuickTimeClock({onDetails,demo}:{onDetails:()=>void;demo:boolean}){
 const [data,setData]=useState<ClockData|null>(null),[campus,setCampus]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[profileMissing,setProfileMissing]=useState(false);
 async function refresh(){
  try{
   const r=await fetch('/api/timeclock?'+new URLSearchParams({week:thisWeek(),self:'1'}),{cache:'no-store'});
   const d:any=await r.json();
   if(!r.ok){setProfileMissing(r.status===409);setData(null);throw Error(d.error||'Unable to load your clock');}
   setProfileMissing(false);setData(d);setCampus(prev=>d.assignedCampuses?.some((c:any)=>c.id===prev)?prev:d.assignedCampuses?.[0]?.id||'');setError('');
  }catch(e:any){setError(e.message||'Clock unavailable');}
 }
 useEffect(()=>{if(!demo)void refresh();},[demo]);
 async function punch(action:string){
  if(!data||!campus||demo)return;
  setBusy(true);setError('');setNotice('');
  try{
   const r=await fetch('/api/timeclock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,campusId:campus})});
   const d:any=await r.json();if(!r.ok)throw Error(d.error||'Clock action failed');
   setNotice(action.replace('_',' ')+' recorded at server time.');await refresh();
  }catch(e:any){setError(e.message||'Clock action failed');}finally{setBusy(false);}
 }
 const state=data?.current.state||'out';
 return <section className="panel" aria-label="Employee quick time clock" style={{marginBottom:'1rem'}}>
  <div className="sectionhead"><div><p className="eyebrow">EMPLOYEE SELF-SERVICE</p><h3>My Time Clock</h3><p className="muted">{demo?'Practice mode: actual punches are disabled.':data?'Signed in as '+data.employee.name+' · '+(state==='working'?'CLOCKED IN':state==='break'?'ON BREAK':'CLOCKED OUT'):'A personal active employee record is required to punch.'}</p></div><button type="button" onClick={onDetails}>Timesheet & payroll details</button></div>
  {error&&<p role="alert" className="error">{profileMissing?'Your account is not linked to an active employee time-clock profile. An owner must assign your email and work campus.':error}</p>}
  {notice&&<p role="status" className="notice">{notice}</p>}
  {!demo&&data&&<><div className="formgrid"><label>Working location<select aria-label="Clock-in campus" value={campus} onChange={e=>setCampus(e.target.value)}>{data.assignedCampuses.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label></div>
  <div className="reportactions" aria-label="Time clock actions">
  <button type="button" className="primary" disabled={busy||!campus||state!=='out'} onClick={()=>punch('clock_in')}>Clock In</button>
  <button type="button" disabled={busy||state!=='working'} onClick={()=>punch('break_start')}>Start Unpaid Meal</button>
  <button type="button" disabled={busy||state!=='break'} onClick={()=>punch('break_end')}>End Unpaid Meal</button>
  <button type="button" disabled={busy||state!=='working'} onClick={()=>punch('clock_out')}>Clock Out</button>
  <button type="button" disabled={busy} onClick={refresh}>Refresh status</button>
  </div></>}
  <p className="muted">Unpaid meals stop paid time. Stay clocked in for paid breaks; no meal is deducted automatically.</p>
  {demo&&<p className="muted">Return to saved school records to use the real employee time clock.</p>}
 </section>;
}
