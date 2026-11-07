/** Privacy-minimized ICS export for staff Outlook or Google Calendar imports.
 * Never export student DOB, individual student names, private tasks,
 * instructor/student appointments, PII or restricted files.
 */
export type PublicCalendarEvent={id:string;summary:string;description?:string;start:string;end:string;kind:string};
const escape=(value:string)=>String(value||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;').slice(0,350);
const valid=(date:string)=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T12:00:00Z'));
function plusOne(date:string){const dt=new Date(date+'T12:00:00Z');dt.setUTCDate(dt.getUTCDate()+1);return dt.toISOString().slice(0,10);}
const icsDay=(date:string)=>date.replaceAll('-','');
export function publicCampusEvents(records:any[],campusId:string):PublicCalendarEvent[]{
 const list:PublicCalendarEvent[]=[];
 for(const r of records){
  if(r.campusId!==campusId)continue;
  if(r.kind==='classes'&&valid(r.startDate)&&valid(r.endDate)&&r.endDate>=r.startDate){
   list.push({id:r.id+'-class',summary:'CDL class: '+String(r.name||'Class schedule').slice(0,90),start:r.startDate,end:plusOne(r.endDate),kind:'class'});
  }
  if(r.kind==='closures'&&r.status==='Confirmed'&&valid(r.startDate)&&valid(r.endDate)&&r.endDate>=r.startDate){
   list.push({id:r.id+'-closure',summary:'Campus closure: '+String(r.name||'School closed').slice(0,90),description:String(r.body||'').slice(0,250),start:r.startDate,end:plusOne(r.endDate),kind:'closure'});
  }
  if(r.kind==='announcements'&&r.status==='Published'&&['Everyone','Staff'].includes(r.audience)&&valid(r.startDate)&&valid(r.endDate)&&r.endDate>=r.startDate){
   list.push({id:r.id+'-announcement',summary:'School announcement: '+String(r.name||'School notice').slice(0,90),start:r.startDate,end:plusOne(r.endDate),kind:'announcement'});
  }
 }
 return list;
}
export function createPublicCalendarIcs(events:PublicCalendarEvent[],campusName:string){
 const now=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lone Star Academy OS//Campus Operations//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:'+escape('Lone Star · '+campusName),'X-WR-TIMEZONE:America/New_York'];
 for(const r of events){
  if(!valid(r.start)||!valid(r.end)||r.end<=r.start)continue;
  lines.push('BEGIN:VEVENT','UID:'+r.id.replace(/[^a-zA-Z0-9_.-]/g,'')+'@academy.ktworldsolutions.com','DTSTAMP:'+now,
   'DTSTART;VALUE=DATE:'+icsDay(r.start),'DTEND;VALUE=DATE:'+icsDay(r.end),
   'SUMMARY:'+escape(r.summary),'DESCRIPTION:'+escape(r.description||'School-managed calendar event. Confirm time with your campus.'),'CATEGORIES:'+escape(r.kind.toUpperCase()),'END:VEVENT');
 }
 return lines.join('\r\n')+'\r\n';
}
