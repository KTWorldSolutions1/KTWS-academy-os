import type {RecordData as R} from './training.ts';
import {classSeats} from './admissions.ts';

export type WaitingApplicant={application:R;lead:R|null;position:number;date:string|null};
export function waitingApplicants(all:R[],classId:string):WaitingApplicant[]{
 const leads=new Map(all.filter(r=>r.kind==='leads').map(r=>[r.id,r]));
 return all.filter(r=>r.kind==='enrollments'&&r.status==='Waitlisted'&&r.classId===classId)
  .sort((a,b)=>(a.waitlistedAt||'9999').localeCompare(b.waitlistedAt||'9999')||a.id.localeCompare(b.id))
  .map((application,index)=>({application,lead:leads.get(application.leadId)||null,position:index+1,date:application.waitlistedAt||null}));
}
export function waitlistClassOverview(all:R[],classId:string){
 const klass=all.find(r=>r.kind==='classes'&&r.id===classId);
 if(!klass)return null;
 const queue=waitingApplicants(all,classId);
 return {classId,capacity:Number(klass.capacity),seatsAvailable:classSeats(all,klass),waiting:queue.length,next:queue[0]||null};
}
/** Class and lead references are rechecked by the authenticated records API.
 * No waitlist entry ever reserves a seat or overrides funding eligibility. */
export function validateWaitlist(r:R):string|null{
 if(r.kind!=='enrollments'||r.status!=='Waitlisted')return null;
 if(typeof r.leadId!=='string'||!r.leadId||typeof r.classId!=='string'||!r.classId)
  return 'Choose an existing lead and a class before saving the waitlist.';
 if(r.campusId!=null&&(typeof r.campusId!=='string'||!r.campusId))
  return 'Choose the class campus.';
 if(r.waitlistedAt!=null&&(typeof r.waitlistedAt!=='string'||Number.isNaN(Date.parse(r.waitlistedAt))))
  return 'The waitlist date is invalid.';
 return null;
}
