'use client';
import {useState} from 'react';
import type {RecordData as R} from '../lib/training';
import {ANNOUNCEMENT_AUDIENCES,ANNOUNCEMENT_LEVELS,CLOSURE_REASONS,calendarEntries,validateCalendarRecord,studentFacingNotices} from '../lib/school-calendar';
import {Bell,CalendarDays,ChevronLeft,ChevronRight,Gift,LockKeyhole,MapPin,Megaphone,Plus,ShieldCheck,TriangleAlert} from 'lucide-react';

type Props={records:R[];role:string;demo:boolean;busy:boolean;saveMany:(list:R[])=>Promise<boolean>;onNavigate:(page:string)=>void};
const format=(date:Date)=>date.toISOString().slice(0,10);
const initialDay=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
const daysInMonth=(year:number,month:number)=>new Date(Date.UTC(year,month,0)).getUTCDate();
const pretty=(ymd:string)=>new Date(ymd+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
export default function SchoolCalendar({records,role,demo,busy,saveMany,onNavigate}:Props){
 const today=initialDay(),[visibleMonth,setVisibleMonth]=useState(today.slice(0,7)),[selectedDay,setSelectedDay]=useState(today);
 const [campusId,setCampusId]=useState(''),[editor,setEditor]=useState<'Announcement'|'Closure'|'Staff birthday'|null>(null);
 const [editing,setEditing]=useState<R|null>(null),[result,setResult]=useState(''),[error,setError]=useState('');
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const campus=campuses.find(r=>r.id===campusId)||campuses[0];
 const scoped=records.filter(r=>r.kind==='campuses'||r.campusId===campus?.id||r.kind==='staff'&&(r.campusIds||[]).includes(campus?.id));
 const [year,month]=visibleMonth.split('-').map(Number);
 const monthDays=daysInMonth(year,month),startOffset=new Date(Date.UTC(year,month-1,1)).getUTCDay(),cells=Array.from({length:Math.ceil((startOffset+monthDays)/7)*7},(_,i)=>i-startOffset+1);
 const all=calendarEntries(scoped,year,month),byDay=all.filter(x=>x.date===selectedDay);
 const notices=scoped.filter(r=>['announcements','closures'].includes(r.kind)).sort((a,b)=>String(b.startDate).localeCompare(String(a.startDate)));
 const preview=campus?studentFacingNotices(scoped,campus.id,today):[];
 const manage=['Owner','Regional admin','Campus manager'].includes(role);
 function move(offset:number){const d=new Date(Date.UTC(year,month-1+offset,1));const value=d.toISOString().slice(0,7);setVisibleMonth(value);setSelectedDay(value+'-01');}
 function start(kind:'Announcement'|'Closure'|'Staff birthday'){
  setResult('');setError('');setEditor(kind);
  const eventDate=selectedDay||today;
  if(kind==='Staff birthday'){setEditing(null);return;}
  setEditing({id:crypto.randomUUID(),kind:kind==='Announcement'?'announcements':'closures',name:'',campusId:campus?.id||'',status:kind==='Announcement'?'Draft':'Planned',
   priority:'Information',audience:'Students',reason:'Weather',startDate:eventDate,endDate:eventDate,body:'',publishOnPortal:true,notes:[]});
 }
 function update(value:Partial<R>){setEditing(e=>e?{...e,...value}:e);}
 async function save(){
  if(!editing)return;
  const issue=validateCalendarRecord(editing);
  if(issue){setError(issue);return;}
  if(await saveMany([editing])){setResult('Saved '+(editing.kind==='closures'?'campus closure':'school announcement')+' for '+campus?.name+'. Students see only notices that are published and in their current date window.');setEditor(null);setEditing(null);}
  else setError('Could not save. Check the workspace error above.');
 }
 async function saveBirthday(staffId:string,mmdd:string,permission:boolean){
  const staff=records.find(r=>r.id===staffId&&r.kind==='staff');
  if(!staff){setError('Select a staff member.');return;}
  const record={...staff,birthdayMonthDay:mmdd,birthdayCalendarOptIn:permission};
  const issue=validateCalendarRecord(record);
  if(issue){setError(issue);return;}
  if(await saveMany([record])){setResult('Birthday preference saved for '+staff.name+'. It is visible only to authorized campus management.');setEditor(null);}
  else setError('Could not save staff birthday preference.');
 }
 const first=visibleMonth+'-01';
 return <div className="academy-calendar-page">
  <section className="panel"><div className="sectionhead"><div><p className="eyebrow">SCHOOLWIDE CALENDAR • CAMPUS OPERATIONS</p><h2>School calendar & important dates</h2><p className="muted">Appointments, start and end dates, task deadlines, holidays, closures and birthdays in one place. Student birthdays are management-only and are never shown in public or student-portal announcements.</p></div><CalendarDays size={25}/></div>
   <div className="calendar-toolbar"><label>Campus<select value={campus?.id||''} onChange={e=>{setCampusId(e.target.value);setEditor(null);setResult('');}}>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <div className="calendar-month-switch"><button type="button" aria-label="Previous month" onClick={()=>move(-1)}><ChevronLeft size={20}/></button><h3>{new Date(first+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'})}</h3><button type="button" aria-label="Next month" onClick={()=>move(1)}><ChevronRight size={20}/></button><button onClick={()=>{setVisibleMonth(today.slice(0,7));setSelectedDay(today);}}>Today</button></div></div>
   <div className="academy-calendar-key">{['Class start','Class end','Appointment','Task','Closure','Announcement','Student birthday','Staff birthday'].map(x=><span key={x} className={'calendar-key '+x.toLowerCase().replace(/ /g,'-')}>{x}</span>)}</div>
   <div className="academy-calendar-grid">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} className="academy-calendar-weekday">{d}</div>)}
    {cells.map((d,i)=>{const active=d>=1&&d<=monthDays,date=active?visibleMonth+'-'+String(d).padStart(2,'0'):'';const entries=all.filter(e=>e.date===date);return <button type="button" key={i} className={'academy-calendar-cell '+(!active?'empty':'')+(date===selectedDay?' selected':'')+(date===today?' today':'')} disabled={!active} onClick={()=>setSelectedDay(date)}><strong>{active?d:''}</strong>{entries.slice(0,3).map(e=><span key={e.id} className={'calendar-pill '+e.category.toLowerCase().replace(/ /g,'-')} title={e.label}>{e.category.includes('birthday')?<Gift size={12}/>:null}{e.label}</span>)}{entries.length>3&&<small>+{entries.length-3} more</small>}</button>;})}
   </div>
   <div className="calendar-detail"><div className="sectionhead"><h3>{selectedDay?pretty(selectedDay):'Select a day'}</h3><span className="badge">{byDay.length} events</span></div>
    {byDay.length?byDay.map(item=><div key={item.id} className="vault-doc-row"><div><b>{item.label}</b><small>{item.category} {item.category==='Student birthday'||item.category==='Staff birthday'?' · private management view':''} · {item.status||'Scheduled'}{item.description?' · '+item.description:''}</small></div><span className="badge">{item.date}</span></div>):<p className="muted">No recorded events for this day.</p>}</div>
  </section>
  <section className="panel calendar-publishing"><div className="sectionhead"><div><p className="eyebrow">ANNOUNCEMENTS • STUDENT PORTAL BANNERS</p><h2>Publish campus notices and closures</h2><p className="muted">Send only current, published announcements to students assigned to this campus. Confirmed closures also appear as a prominent portal banner. Posting here does not send an SMS/email or reschedule instructors.</p></div><Megaphone size={27}/></div>
   {manage&&<div className="reportactions"><button className="primary" onClick={()=>start('Announcement')}><Plus size={16}/> New announcement</button><button onClick={()=>start('Closure')}><TriangleAlert size={16}/> Record closure</button><button onClick={()=>start('Staff birthday')}><Gift size={16}/> Add staff birthday</button></div>}
   {!manage&&<p className="notice"><LockKeyhole size={16}/> Only management can publish schoolwide announcements or change closure records.</p>}
   {editor==='Staff birthday'&&manage&&<StaffBirthdayEditor campusStaff={scoped.filter(r=>r.kind==='staff')} save={saveBirthday} cancel={()=>setEditor(null)}/>}
   {editor!==null&&editor!=='Staff birthday'&&editing&&manage&&<form className="vault-upload" onSubmit={e=>{e.preventDefault();save();}}>
    <h3>{editor==='Closure'?'School closure notice':'Campus announcement'}</h3>
    <label>Title<input required maxLength={200} value={editing.name} onChange={e=>update({name:e.target.value})} placeholder={editor==='Closure'?'Weather closure — campus closed':'Orientation reminder'}/></label>
    <div className="formgrid"><label>Start date<input type="date" value={editing.startDate} onChange={e=>update({startDate:e.target.value})}/></label><label>End date<input type="date" value={editing.endDate} onChange={e=>update({endDate:e.target.value})}/></label>
    {editor==='Announcement'?<><label>Priority<select value={editing.priority} onChange={e=>update({priority:e.target.value})}>{ANNOUNCEMENT_LEVELS.map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Audience<select value={editing.audience} onChange={e=>update({audience:e.target.value})}>{ANNOUNCEMENT_AUDIENCES.map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Publishing status<select value={editing.status} onChange={e=>update({status:e.target.value})}><option>Draft</option><option>Published</option><option>Archived</option></select></label></>:
    <><label>Closure reason<select value={editing.reason} onChange={e=>update({reason:e.target.value})}>{CLOSURE_REASONS.map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Closure status<select value={editing.status} onChange={e=>update({status:e.target.value})}><option>Planned</option><option>Confirmed</option><option>Cancelled</option></select></label></>}</div>
    <label>Message for the school<textarea required maxLength={editor==='Announcement'?2500:1500} rows={4} value={editing.body} onChange={e=>update({body:e.target.value})} placeholder={editor==='Closure'?'The training yard and classroom are closed on the listed dates. Check with the campus for adjusted instruction.':'Please see your class instructor for details.'}/></label>
    <label className="checkboxlabel"><input type="checkbox" checked={editing.publishOnPortal===true} onChange={e=>update({publishOnPortal:e.target.checked})}/> Show in the authenticated student portal while active</label>
    <div className="reportactions"><button className="primary" disabled={busy} type="submit">Save {editor==='Closure'?'closure':'announcement'}</button><button type="button" onClick={()=>{setEditor(null);setEditing(null);}}>Cancel</button></div>
   </form>}
   {result&&<p className="notice" role="status">{result}</p>}{error&&<p className="error" role="alert">{error}</p>}
   <h3>Currently visible to enrolled students</h3>{preview.length?preview.map(n=><article className={'portal-notice-preview '+(n.priority==='Urgent'?'urgent':'')} key={n.id}><span>{n.kind==='closures'?'CAMPUS CLOSURE':n.priority.toUpperCase()+' ANNOUNCEMENT'}</span><h3>{n.title}</h3><p>{n.body}</p><small>{n.startDate} – {n.endDate} · {campus?.name}</small></article>):<p className="muted">Nothing published to the student portal for today's date.</p>}
   <h3>Saved notices and closure history</h3>{notices.map(n=><div key={n.id} className="vault-doc-row"><div><b>{n.name}</b><small>{n.kind==='closures'?'Closure':'Announcement'} · {n.startDate} to {n.endDate} · {n.status} {n.publishOnPortal?'· Portal eligible':'· Internal'}</small></div>{manage&&<button onClick={()=>{setEditor(n.kind==='closures'?'Closure':'Announcement');setEditing({...n});setError('');}}>Edit</button>}</div>)}
   <p className="footnote"><ShieldCheck size={15}/> Confirmed closures require a manager to reconcile class start/end dates, instructor shifts, student attendance and state minimum instructional hours separately. Publishing a portal banner does not alter training hours or automatically message students.</p>
  </section>
 </div>;
}
function StaffBirthdayEditor({campusStaff,save,cancel}:{campusStaff:R[];save:(id:string,mmdd:string,permission:boolean)=>Promise<void>;cancel:()=>void}){
 const [id,setId]=useState(campusStaff[0]?.id||''),staff=campusStaff.find(s=>s.id===id);
 const [md,setMd]=useState(staff?.birthdayMonthDay||''),[permission,setPermission]=useState(staff?.birthdayCalendarOptIn===true);
 return <form className="vault-upload" onSubmit={e=>{e.preventDefault();save(id,md,permission);}}><h3>Private staff birthday</h3><p className="muted">Record month/day only, and only after an employee approves it being shown to authorized school managers. Do not publish another person's birthday in the student portal.</p>
 <label>Employee<select value={id} onChange={e=>{const r=campusStaff.find(s=>s.id===e.target.value);setId(e.target.value);setMd(r?.birthdayMonthDay||'');setPermission(r?.birthdayCalendarOptIn===true);}}>{campusStaff.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
 <label>Birthday (MM-DD)<input value={md} onChange={e=>setMd(e.target.value)} placeholder="MM-DD" pattern="[0-1][0-9]-[0-3][0-9]" required/></label>
 <label className="checkboxlabel"><input type="checkbox" checked={permission} onChange={e=>setPermission(e.target.checked)}/> Employee approved staff-calendar birthday display</label>
 <div className="reportactions"><button className="primary" disabled={!id||!permission}>Save approved birthday</button><button type="button" onClick={cancel}>Cancel</button></div></form>;
}
