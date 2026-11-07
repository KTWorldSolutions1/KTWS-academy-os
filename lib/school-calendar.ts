import type {RecordData as R} from './training.ts';
export type CalendarEntry={id:string;date:string;label:string;category:string;campusId:string;status:string;private?:boolean;description?:string;endDate?:string};
export const ANNOUNCEMENT_LEVELS=['Information','Important','Urgent'] as const;
export const ANNOUNCEMENT_AUDIENCES=['Students','Staff','Everyone'] as const;
export const CLOSURE_REASONS=['Holiday','Weather','Maintenance','Emergency','Staff development','Other'] as const;
const validDay=(value:string)=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
export function monthDay(value:unknown):string|null{
 if(typeof value!=='string')return null;
 const text=value.trim(), match=/^(?:\d{4}-)?(\d{2})-(\d{2})$/.exec(text);
 if(!match)return null;
 const m=Number(match[1]),d=Number(match[2]);
 if(m<1||m>12||d<1||d>31)return null;
 // February 29 is preserved for leap-year birthdays; it only appears in leap years.
 const year=Number(text.length===10?text.slice(0,4):2024);
 const check=new Date(Date.UTC(year,m-1,d));
 return check.getUTCMonth()===m-1&&check.getUTCDate()===d?match[1]+'-'+match[2]:null;
}
export function validateCalendarRecord(r:R):string|null{
 if(r.kind==='announcements'){
  if(!['Draft','Published','Archived'].includes(r.status)||!ANNOUNCEMENT_LEVELS.includes(r.priority)||!ANNOUNCEMENT_AUDIENCES.includes(r.audience))return 'Choose announcement status, priority and audience.';
  if(!r.campusId||r.campusId==='__legacy__')return 'Choose a campus for every announcement.';
  if(typeof r.body!=='string'||r.body.trim().length<8||r.body.length>2500)return 'Announcements need a message between 8 and 2,500 characters.';
  if(!validDay(r.startDate)||!validDay(r.endDate)||r.endDate<r.startDate)return 'Select a valid start and end date.';
  if(r.publishOnPortal!==true&&r.publishOnPortal!==false)return 'Choose whether students may see this announcement.';
 }
 if(r.kind==='closures'){
  if(!['Planned','Confirmed','Cancelled'].includes(r.status)||!CLOSURE_REASONS.includes(r.reason))return 'Choose a valid closure status and reason.';
  if(!r.campusId||r.campusId==='__legacy__')return 'Choose a campus for school closure.';
  if(!validDay(r.startDate)||!validDay(r.endDate)||r.endDate<r.startDate)return 'Choose a valid closure period.';
  if(typeof r.body!=='string'||r.body.trim().length<8||r.body.length>1500)return 'Closure notices require a short explanation.';
  if(r.publishOnPortal!==true&&r.publishOnPortal!==false)return 'Choose whether students may see the closure.';
 }
 if(r.kind==='staff'&&r.birthdayMonthDay!=null&&r.birthdayMonthDay!==''){
  if(!monthDay(r.birthdayMonthDay))return 'Use MM-DD format for a staff birthday; no birth year is required.';
  if(typeof r.birthdayCalendarOptIn!=='boolean')return 'Record staff consent before showing a birthday on the management calendar.';
 }
 return null;
}
export function withinNoticeRange(r:R,asOf:string){
 return r.startDate<=asOf&&asOf<=r.endDate;
}
export function studentFacingNotices(records:R[],campusId:string,asOf:string){
 return records.filter(r=>r.campusId===campusId&&r.publishOnPortal===true&&withinNoticeRange(r,asOf)&&
 ((r.kind==='announcements'&&r.status==='Published'&&['Students','Everyone'].includes(r.audience))||(r.kind==='closures'&&r.status==='Confirmed')))
 .sort((a,b)=>(a.kind==='closures'?-1:0)-(b.kind==='closures'?-1:0)||(['Urgent','Important','Information'].indexOf(a.priority||'Information')-['Urgent','Important','Information'].indexOf(b.priority||'Information'))||String(b.startDate).localeCompare(String(a.startDate)))
 .slice(0,20)
 .map(r=>({id:r.id,kind:r.kind,title:r.name,body:r.body,priority:r.kind==='closures'?'Urgent':r.priority,startDate:r.startDate,endDate:r.endDate,reason:r.kind==='closures'?r.reason:null}));
}
export function calendarEntries(records:R[],year:number,month:number):CalendarEntry[]{
 const ym=String(year)+'-'+String(month).padStart(2,'0'),result:CalendarEntry[]=[];
 const dateInMonth=(v:string)=>v?.slice(0,7)===ym;
 const add=(r:R,date:string,label:string,category:string,privateValue=false,endDate?:string)=>{
  if(dateInMonth(date))result.push({id:r.id+':'+category,date,label,category,campusId:r.campusId||'',status:r.status,description:r.body||r.description,endDate,private:privateValue});
 };
 for(const r of records){
  if(r.kind==='closures'&&r.status!=='Cancelled'){
   for(let dt=r.startDate;validDay(dt)&&dt<=r.endDate&&dt.slice(0,7)<=ym;){
    add(r,dt,r.name,'Closure');
    const next=new Date(dt+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);dt=next.toISOString().slice(0,10);
   }
  }else if(r.kind==='announcements'&&r.status==='Published')add(r,r.startDate,r.name,'Announcement');
  else if(r.kind==='classes'){add(r,r.startDate,r.name+' starts','Class start');add(r,r.endDate,r.name+' ends','Class end');}
  else if(r.kind==='appointments'||r.kind==='schedules')add(r,r.date,r.name,'Appointment');
  else if(r.kind==='tasks'&&!['Complete','Cancelled'].includes(r.status))add(r,r.due,r.name,'Task');
  else if(r.kind==='students'&&r.dob){
   const md=monthDay(r.dob);
   if(md&&Number(md.slice(0,2))===month)add(r,ym+'-'+md.slice(3),r.name+' — birthday','Student birthday',true);
  }else if(r.kind==='staff'&&r.birthdayCalendarOptIn===true){
   const md=monthDay(r.birthdayMonthDay);
   if(md&&Number(md.slice(0,2))===month)add(r,ym+'-'+md.slice(3),r.name+' — birthday','Staff birthday',true);
  }
 }
 return result.sort((a,b)=>a.date.localeCompare(b.date)||a.category.localeCompare(b.category));
}
