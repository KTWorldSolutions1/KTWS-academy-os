'use client';
import {useState} from 'react';
import {ArrowRight,CalendarDays,CheckCircle2,ClipboardCheck,Clock3,GraduationCap,PhoneCall,ShieldAlert,Sparkles,Truck} from 'lucide-react';
import type {RecordData} from '../lib/training';
import {dailyFocusItems,dailyFocusCounts,type FocusItem} from '../lib/daily-focus';

type Props={records:RecordData[];role:string;campusName:string;date:string;onNavigate:(page:string,recordId?:string)=>void};
export default function TodayFocus({records,role,campusName,date,onNavigate}:Props){
 const items=dailyFocusItems(records,role,date),counts=dailyFocusCounts(items),[all,setAll]=useState(false);
 const shown=all?items:items.slice(0,6);
 const humanDate=new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'UTC'});
 const any=(page:string)=>role==='Owner'||({
  'Campus manager':['students','courses','leads','tasks'],
  'Enrollment specialist':['students','leads','tasks'],
  'Admin assistant':['students','leads','tasks'],
  'Front desk':['students','leads','tasks'],
  'Instructor':['students','courses','tasks']
 } as Record<string,string[]>)[role]?.includes(page);
 const shortcuts=[
  {page:'students',label:'Find student',icon:GraduationCap},
  {page:'courses',label:'Take attendance',icon:ClipboardCheck},
  {page:'leads',label:'Follow up',icon:PhoneCall},
  {page:'tasks',label:'My to-do list',icon:CheckCircle2}
 ].filter(s=>any(s.page));
 return <section className="today-product" aria-labelledby="school-focus-title">
  <div className="today-product-hero">
   <div className="today-hero-content">
    <div className="today-eyebrow"><span className="today-live-dot" aria-hidden="true"/> YOUR DAILY WORKSPACE <span className="today-eyebrow-line"/> {campusName}</div>
    <h2 id="school-focus-title">Your school, in focus.</h2>
    <p>{humanDate} · Everything you need to start the day, in one place.</p>
    <div className="today-hero-pills" aria-label="Daily activity summary">
     <span><ShieldAlert size={16} aria-hidden="true"/><strong>{counts.urgent}</strong> needs follow-up</span>
     <span><Clock3 size={16} aria-hidden="true"/><strong>{counts.today}</strong> for today</span>
     <span><CheckCircle2 size={16} aria-hidden="true"/><strong>{counts.reviews}</strong> to check</span>
    </div>
   </div>
   <div className="today-hero-decoration" aria-hidden="true"><div><GraduationCap size={50}/></div><Sparkles size={22}/></div>
  </div>
  {shortcuts.length>0&&<div className="today-shortcuts" aria-label="Quickly start common school tasks">{shortcuts.map(s=>{const Icon=s.icon;return <button type="button" key={s.page} onClick={()=>onNavigate(s.page)}><span className="today-shortcut-icon"><Icon size={20}/></span><span>{s.label}</span><ArrowRight size={17} className="today-shortcut-arrow"/></button>})}</div>}
  <section className="today-action-panel" aria-labelledby="today-action-heading">
   <div className="today-section-header"><div><p className="today-mini-label">WORK THAT NEEDS A LOOK</p><h3 id="today-action-heading">What needs your attention</h3></div><span className="today-count">{items.length} items</span></div>
   {items.length===0?<div className="today-empty"><CheckCircle2 size={29}/><div><strong>Nothing flagged from the saved records.</strong><p>That does not confirm all attendance, paperwork or approvals are complete. Continue your normal checks.</p></div></div>:<div className="today-action-list">{shown.map((item:FocusItem)=>{
    const Icon=item.page==='calendar'?CalendarDays:item.page==='courses'?GraduationCap:item.page==='fleet'?Truck:item.page==='leads'?PhoneCall:item.page==='tasks'?ClipboardCheck:Clock3;
    return <button className="today-action" type="button" key={item.id} onClick={()=>onNavigate(item.page,item.recordId)}><span className={'today-status-dot '+item.urgency}/><span className="today-action-icon"><Icon size={19}/></span><span className="today-action-description"><strong>{item.title}</strong><small>{item.detail}</small></span><span className={'today-action-badge '+item.urgency}>{item.urgency==='now'?'Follow up':item.urgency==='soon'?'Today':'Review'}</span><ArrowRight size={16} className="today-action-arrow"/></button>;
   })}</div>}
   {items.length>6&&<button className="today-show-all" type="button" onClick={()=>setAll(v=>!v)}>{all?'Show fewer':'Show all '+items.length+' items'} <ArrowRight size={16}/></button>}
   <p className="today-data-notice">Based only on saved school records you can access. Items are reminders, not proof of absence, licensing approval, or service completion.</p>
  </section>
 </section>;
}
