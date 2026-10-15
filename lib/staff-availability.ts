import type {RecordData as R} from './training.ts';
export const unavailabilityStates=['Unavailable','Restored'] as const;
const validDay=(day:any)=>typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&!Number.isNaN(Date.parse(day+'T12:00:00Z'))&&new Date(day+'T12:00:00Z').toISOString().slice(0,10)===day;
const minutes=(v:any)=>typeof v==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v)?Number(v.slice(0,2))*60+Number(v.slice(3)):NaN;
/** Records disclose scheduling availability only; never sickness, diagnosis or HR reason. */
export function validateStaffUnavailability(r:R){
 if(r.kind!=='staff-unavailability')return null;
 if(!unavailabilityStates.includes(r.status))return 'Choose an unavailable or restored scheduling record.';
 if(!r.employeeId||!r.campusId)return 'Choose an employee and their campus.';
 if(!validDay(r.date))return 'Choose a valid scheduling date.';
 if(r.reason!=null||r.medical!=null||r.diagnosis!=null||r.healthNotes!=null||r.notes!=null)return 'Do not enter private absence reasons in the shared scheduling board.';
 if(r.status==='Unavailable'){
  if(r.restoresId)return 'A new unavailability entry cannot also restore another entry.';
  if((!!r.start)!=(!!r.end))return 'Enter both start and end for part of a day, or leave both blank for all day.';
  if(r.start&&(Number.isNaN(minutes(r.start))||Number.isNaN(minutes(r.end))||minutes(r.end)<=minutes(r.start)))return 'Choose a valid unavailable time period within the same day.';
 }else{
  if(!r.restoresId||r.start||r.end)return 'Select the existing unavailable entry to restore. Do not change its original time.';
 }
 return null;
}
export function activeUnavailability(records:R[],employeeId:string,date:string){
 const restored=new Set(records.filter(x=>x.kind==='staff-unavailability'&&x.status==='Restored'&&x.restoresId).map(x=>x.restoresId));
 return records.filter(x=>x.kind==='staff-unavailability'&&x.status==='Unavailable'&&x.employeeId===employeeId&&x.date===date&&!restored.has(x.id));
}
export function unavailableForLesson(records:R[],employeeId:string,date:string,start:string,end:string){
 const a=minutes(start),b=minutes(end);
 return activeUnavailability(records,employeeId,date).find(x=>!x.start||!x.end||a<minutes(x.end)&&b>minutes(x.start))||null;
}
export function availabilityRecordProblem(r:R,all:R[],today:string){
 if(r.kind!=='staff-unavailability')return null;
 const employee=all.find(x=>x.kind==='staff'&&x.id===r.employeeId&&x.status==='Active'&&x.campusIds?.includes(r.campusId));
 if(!employee)return {status:400,error:'Choose an active employee assigned to this campus.'};
 if(r.date<today)return {status:400,error:'Record schedule changes when they happen; do not backdate a new availability entry.'};
 if(r.status==='Unavailable'){
  const overlaps=activeUnavailability(all,r.employeeId,r.date).some(x=>x.id!==r.id&&(!x.start||!r.start||minutes(x.start)<minutes(r.end)&&minutes(r.start)<minutes(x.end)));
  if(overlaps)return {status:409,error:'The employee already has an overlapping unavailable period. Restore the old entry before replacing it.'};
 }else{
  const original=all.find(x=>x.kind==='staff-unavailability'&&x.id===r.restoresId&&x.status==='Unavailable');
  if(!original||original.employeeId!==r.employeeId||original.campusId!==r.campusId||original.date!==r.date)return {status:400,error:'The restored entry must match the original employee, campus and day.'};
  if(!activeUnavailability(all,r.employeeId,r.date).some(x=>x.id===original.id))return {status:409,error:'This availability entry has already been restored.'};
 }
 return null;
}
export function affectedLessons(records:R[],employeeId:string,date:string){
 return records.filter(x=>x.kind==='training-assignments'&&x.employeeId===employeeId&&x.date===date&&['Planned','Confirmed'].includes(x.status)&&unavailableForLesson(records,employeeId,date,x.start,x.end));
}
