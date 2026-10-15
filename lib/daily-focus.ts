import type {RecordData} from './training.ts';
import {activeSessions} from './training.ts';
import {moduleAllowed} from './roles.ts';
export type FocusItem={id:string;title:string;detail:string;page:string;recordId?:string;urgency:'now'|'soon'|'review';date?:string};
/** Derived from records the signed-in employee may already read. No
 * background alerts are sent and missing data never means an absence. */
export function dailyFocusItems(records:RecordData[],role:string,referenceDate:string):FocusItem[]{
 const show=(kind:string)=>moduleAllowed(role,kind);
 const out:FocusItem[]=[];
 const push=(item:FocusItem)=>out.push(item);
 const dayOfWeek=new Date(referenceDate+'T12:00:00Z').getUTCDay();
 const schoolDay=dayOfWeek>0&&dayOfWeek<6;
 if(show('leads')){
  for(const r of records.filter(x=>x.kind==='leads'&&x.followUp&&x.followUp<=referenceDate&&!['Closed','Enrolled'].includes(x.status))){
   push({id:'lead-'+r.id,title:'Call or message '+r.name,detail:r.followUp<referenceDate?'Follow-up date has passed':'Follow up today',page:'leads',recordId:r.id,urgency:r.followUp<referenceDate?'now':'soon',date:r.followUp});
  }
 }
 if(show('tasks')){
  for(const r of records.filter(x=>x.kind==='tasks'&&x.status!=='Complete'&&x.status!=='Cancelled'&&x.due&&x.due<=referenceDate)){
   push({id:'task-'+r.id,title:r.name,detail:r.due<referenceDate?'To-do item past its due date':'To-do item due today',page:'tasks',recordId:r.id,urgency:r.due<referenceDate||r.priority==='High'?'now':'soon',date:r.due});
  }
 }
 if(show('calendar')){
  for(const r of records.filter(x=>x.kind==='appointments'&&x.date===referenceDate&&['Scheduled','Confirmed'].includes(x.status))){
   push({id:'visit-'+r.id,title:r.name,detail:'On the calendar today'+(r.start?' · '+r.start:''),page:'calendar',recordId:r.id,urgency:'soon',date:r.date});
  }
 }
 if(show('courses')&&schoolDay){
  for(const r of records.filter(x=>x.kind==='students'&&['Classroom','Yard','Road'].includes(x.status))){
   if(!activeSessions(r).some(s=>s.date===referenceDate)){
    push({id:'attendance-'+r.id,title:'Check attendance for '+r.name,detail:'No attendance entry recorded today. This does not mean absent.',page:'courses',recordId:r.id,urgency:'review',date:referenceDate});
   }
  }
 }
 if(show('fleet')){
  for(const r of records.filter(x=>x.kind==='fleet'&&x.status==='Out of service')){
   push({id:'fleet-'+r.id,title:r.name+' needs attention',detail:'Training vehicle recorded as out of service',page:'fleet',recordId:r.id,urgency:'now'});
  }
 }
 if(show('classes')){
  const next7=new Date(referenceDate+'T12:00:00Z');next7.setUTCDate(next7.getUTCDate()+7);
  const until=next7.toISOString().slice(0,10);
  for(const r of records.filter(x=>x.kind==='classes'&&x.startDate&&x.startDate>=referenceDate&&x.startDate<=until&&x.status==='Open for enrollment')){
   push({id:'cohort-'+r.id,title:r.name+' starts soon',detail:'Class start: '+r.startDate+' · Check seats and student paperwork',page:'classes',recordId:r.id,urgency:'review',date:r.startDate});
  }
 }
 const rank={'now':0,'soon':1,'review':2};
 return out.sort((a,b)=>rank[a.urgency]-rank[b.urgency]||(a.date||'9999').localeCompare(b.date||'9999')||a.title.localeCompare(b.title));
}
export function dailyFocusCounts(items:FocusItem[]){return {
 urgent:items.filter(i=>i.urgency==='now').length,
 today:items.filter(i=>i.urgency==='soon').length,
 reviews:items.filter(i=>i.urgency==='review').length
};}
