import type {RecordData as R} from './training.ts';
import {activeSessions} from './training.ts';
import {unresolvedVehicleDefects} from './training-dispatch.ts';
export type SchoolInsight={
 campusId:string;campus:string;leads:number;linkedEnrollments:number;conversionPct:number|null;
 activeStudents:number;graduated:number;recordedPlacements:number;placementPct:number|null;
 upcomingClasses:number;enrolledInClasses:number;openSeats:number;
 followupsOverdue:number;truckReady:number;truckHolds:number;
 studentsWithAttendanceToday:number;activeStudentsWithoutEntry:number;
 authorizedFunding:number;fundingApprovals:number;outstandingLedger:number;
};
const activeStatuses=['Classroom','Yard','Road','Test preparation'];
const percent=(part:number,whole:number)=>whole>0?Math.round(Math.min(100,Math.max(0,part/whole*100))*10)/10:null;
const amount=(x:any)=>Number.isFinite(Number(x))&&Number(x)>0?Number(x):0;
/** Campus totals use only supplied, already-authorized school records.
 * Rates show explicit denominators; financial entries are NOT bank receipts.
 * Unrecorded attendance is not an absence or claim of failed instruction. */
export function campusInsights(all:R[],date:string):SchoolInsight[]{
 const schoolDay=new Date(date+'T12:00:00Z').getUTCDay();
 return all.filter(x=>x.kind==='campuses'&&x.status==='Active').map(c=>{
  const campusId=c.id;
  const of=(kind:string)=>all.filter(x=>x.kind===kind&&x.campusId===campusId);
  const leads=of('leads'),students=of('students'),classes=of('classes'),trucks=of('fleet');
  const leadIds=new Set(leads.map(x=>x.id));
  const enrolledLeadIds=new Set(students.filter(x=>x.sourceLead&&leadIds.has(x.sourceLead)).map(x=>x.sourceLead));
  const active=students.filter(x=>activeStatuses.includes(x.status));
  const graduates=students.filter(x=>x.status==='Graduated');
  const placements=graduates.filter(x=>x.career?.stage==='Placed'&&x.career?.employer?.trim()&&x.career?.startDate);
  const upcoming=classes.filter(x=>x.startDate>=date&&['Open for enrollment','Scheduled','In progress'].includes(x.status));
  const enrolled=students.filter(x=>x.classId&&classes.some(c=>c.id===x.classId)&&x.status!=='Withdrawn');
  const openSeats=upcoming.reduce((n,k)=>n+Math.max(0,Number(k.capacity||0)-enrolled.filter(s=>s.classId===k.id).length),0);
  const hasToday=(s:R)=>activeSessions(s).some((v:any)=>v.date===date&&['Classroom','Yard','Road'].includes(v.phase)&&v.attendance);
  const present=active.filter(hasToday).length;
  const sponsor=of('sponsorships').filter(x=>x.status==='Authorized');
  return {
   campusId,campus:c.name,leads:leads.length,linkedEnrollments:enrolledLeadIds.size,conversionPct:percent(enrolledLeadIds.size,leads.length),
   activeStudents:active.length,graduated:graduates.length,recordedPlacements:placements.length,placementPct:percent(placements.length,graduates.length),
   upcomingClasses:upcoming.length,enrolledInClasses:enrolled.length,openSeats,
   followupsOverdue:leads.filter(x=>x.followUp&&x.followUp<date&&!['Enrolled','Closed'].includes(x.status)).length,
   truckReady:trucks.filter(x=>x.status==='Ready'&&!unresolvedVehicleDefects(all,x.id).length).length,
   truckHolds:trucks.filter(x=>unresolvedVehicleDefects(all,x.id).length>0||x.status==='Out of service').length,
   studentsWithAttendanceToday:schoolDay===0||schoolDay===6?0:present,
   activeStudentsWithoutEntry:schoolDay===0||schoolDay===6?0:active.length-present,
   authorizedFunding:sponsor.reduce((n,x)=>n+amount(x.authorizedAmount),0),
   fundingApprovals:sponsor.length,
   outstandingLedger:of('finance').filter(x=>x.status==='Outstanding').reduce((n,x)=>n+amount(x.amount),0)
  };
 }).sort((a,b)=>a.campus.localeCompare(b.campus));
}
export function combinedSchoolInsights(rows:SchoolInsight[]){
 const keys=['leads','linkedEnrollments','activeStudents','graduated','recordedPlacements','upcomingClasses','enrolledInClasses','openSeats','followupsOverdue','truckReady','truckHolds','studentsWithAttendanceToday','activeStudentsWithoutEntry','authorizedFunding','fundingApprovals','outstandingLedger'] as const;
 const totals:Record<string,number>={};
 for(const key of keys)totals[key]=rows.reduce((n,r)=>n+r[key],0);
 return {...totals,conversionPct:percent(totals.linkedEnrollments,totals.leads),placementPct:percent(totals.recordedPlacements,totals.graduated)};
}
