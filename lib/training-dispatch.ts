import {activeSessions,type RecordData as R} from './training.ts';
import {instructorCredentialWarnings} from './staff-credentials';
const validDate=(value:any)=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
const validTime=(value:any)=>typeof value==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const statuses=['Planned','Confirmed','Completed','Cancelled'];
const phases=['Classroom','Yard','Road'];
export function validateTrainingDispatch(r:R){
 if(r.kind==='training-assignments'){
  if(!statuses.includes(r.status))return 'Select Planned, Confirmed, Completed or Cancelled.';
  if(!validDate(r.date)||!validTime(r.start)||!validTime(r.end)||r.start>=r.end)return 'Use a valid date and start/end time on the same day.';
  if(!phases.includes(r.phase))return 'Select classroom, yard or road.';
  if(!r.campusId||!r.studentId||!r.employeeId)return 'Select a campus, student and instructor.';
  if(r.phase!=='Classroom'&&!r.unitId)return 'Yard or road training needs a specific training vehicle.';
  if(typeof r.lessonObjective!=='string'||r.lessonObjective.trim().length<4||r.lessonObjective.length>500)return 'Enter a clear lesson goal (4 to 500 characters).';
  if(r.routeName!=null&&(typeof r.routeName!=='string'||r.routeName.length>300))return 'Route or practice area is too long.';
  if(r.notes!=null&&(typeof r.notes!=='string'||r.notes.length>3000))return 'Keep plan notes under 3,000 characters.';
  return null;
 }
 if(r.kind==='vehicle-checks'){
  if(!['Passed','Defect reported','Cleared'].includes(r.status))return 'Choose a valid truck check result.';
  if(!r.campusId||!r.unitId||!validDate(r.date))return 'Choose a campus, vehicle and valid check date.';
  if(r.status==='Defect reported'&&(!r.notes?.trim()||r.notes.trim().length<8))return 'Describe the defect and training safety concern.';
  if(r.status==='Passed'&&(!r.notes?.trim()||r.notes.trim().length<10))return 'Describe which approved truck check was completed. Do not claim a government inspection was passed.';
  if(r.status==='Cleared'&&(!r.defectId||!r.notes?.trim()||r.notes.trim().length<8))return 'Identify the original defect and document the repairs and approval.';
  if(r.notes!=null&&(typeof r.notes!=='string'||r.notes.length>3000))return 'Keep safety notes under 3,000 characters.';
 }
 return null;
}
export function unresolvedVehicleDefects(all:R[],unitId:string):R[]{
 const cleared=new Set(all.filter(x=>x.kind==='vehicle-checks'&&x.status==='Cleared'&&x.defectId).map(x=>x.defectId));
 return all.filter(x=>x.kind==='vehicle-checks'&&x.unitId===unitId&&x.status==='Defect reported'&&!cleared.has(x.id));
}
export function dispatchOverlap(r:R,all:R[]){
 if(r.status==='Cancelled')return null;
 return all.find(x=>['training-assignments','schedules'].includes(x.kind)&&x.id!==r.id&&['Planned','Confirmed','Completed','Scheduled'].includes(x.status)&&x.date===r.date&&r.start<x.end&&r.end>x.start&&(
  (!!r.employeeId&&x.employeeId===r.employeeId)|| (!!r.studentId&&x.studentId===r.studentId)||
  (!!r.unitId&&x.unitId===r.unitId)
 ))||null;
}
export function completedLessonEvidence(assignment:R,records:R[]){
 const student=records.find(s=>s.kind==='students'&&s.id===assignment.studentId);
 const instructor=records.find(s=>s.kind==='staff'&&s.id===assignment.employeeId);
 if(!student||!instructor)return null;
 const match=String(instructor.name||'').trim().toLowerCase();
 return activeSessions(student).find(entry=>
  entry.date===assignment.date&&entry.phase===assignment.phase&&
  ['Present','Late','Left early'].includes(entry.attendance)&&Number(entry.hours)>0&&
  String(entry.instructor||'').trim().toLowerCase()===match&&
  (!entry.start||!entry.end||entry.start<assignment.end&&entry.end>assignment.start)
 )||null;
}
export function sameDayVehicleCheck(r:R,all:R[]){
 return all.find(x=>x.kind==='vehicle-checks'&&x.unitId===r.unitId&&x.campusId===r.campusId&&x.status==='Passed'&&x.date===r.date)||null;
}
export function dispatchRecordProblem(r:R,all:R[],role:string,date:string){
 if(r.kind==='vehicle-checks'){
  const vehicle=all.find(x=>x.kind==='fleet'&&x.id===r.unitId&&x.campusId===r.campusId);
  if(!vehicle)return {status:400,error:'Select a training vehicle assigned to this campus.'};
  if(r.status==='Cleared'){
   if(!['Owner','Campus manager'].includes(role))return {status:403,error:'Only campus management can sign off a repaired vehicle.'};
   const source=all.find(x=>x.kind==='vehicle-checks'&&x.id===r.defectId&&x.status==='Defect reported'&&x.unitId===r.unitId&&x.campusId===r.campusId);
   if(!source||source.id===r.id||!unresolvedVehicleDefects(all,r.unitId).some(x=>x.id===source.id))return {status:400,error:'Select an unresolved defect on this specific vehicle.'};
   if(r.date<source.date)return {status:400,error:'Repair sign-off cannot predate the original defect.'};
  }
  return null;
 }
 if(r.kind!=='training-assignments')return null;
 const student=all.find(x=>x.kind==='students'&&x.id===r.studentId);
 const instructor=all.find(x=>x.kind==='staff'&&x.id===r.employeeId);
 if(!student||student.campusId!==r.campusId||['Withdrawn','Graduated'].includes(student.status))return {status:400,error:'Choose an active student from this campus.'};
 if(!instructor||instructor.status!=='Active'||!instructor.campusIds?.includes(r.campusId)||!['Instructor','Campus manager'].includes(instructor.accessRole))return {status:400,error:'Choose an active, campus-assigned instructor.'};
 if(instructor.expiry&&instructor.expiry<r.date)return {status:409,error:'Instructor credential expiration needs review before training is scheduled.'};
 const adverse=instructorCredentialWarnings(all,instructor.id,r.campusId,r.date);if(adverse.length&&r.status!=='Cancelled')return {status:409,error:'A recorded instructor qualification needs review before training: '+adverse.map(c=>c.name+' ('+c.state+')').join(', ')};
 if(r.unitId){
  const unit=all.find(x=>x.kind==='fleet'&&x.id===r.unitId&&x.campusId===r.campusId);
  if(!unit)return {status:400,error:'Training vehicle is not assigned to this campus.'};
  if(unit.status!=='Ready'&&r.status!=='Cancelled')return {status:409,error:'Training vehicle is not marked ready.'};
  if(r.status!=='Cancelled'&&unresolvedVehicleDefects(all,r.unitId).some(x=>x.date<=r.date))return {status:409,error:'Training vehicle has an unresolved safety defect. Campus management must record a repair clearance before scheduling.'};
 }
 if(r.status!=='Cancelled'&&r.date<date&&r.status==='Planned')return {status:400,error:'Past training must be documented from actual attendance, not newly planned.'};
 if(r.status==='Completed'){
  if(r.date>date)return {status:400,error:'A future lesson cannot be marked complete.'};
  if(!completedLessonEvidence(r,all))return {status:409,error:'First record actual training attendance for this student, date, phase and assigned instructor. A planned lesson is not a driving-hours record.'};
  if(r.unitId&&!sameDayVehicleCheck(r,all))return {status:409,error:'Before completing a yard or road lesson, record the school truck check for that same day. This is not a DOT or DMV inspection.'};
 }
  const conflict=dispatchOverlap(r,all);
 if(conflict)return {status:409,error:'Another training lesson overlaps for this instructor, student or vehicle: '+conflict.name};
 return null;
}
export function scheduleForStudent(studentId:string,all:R[]){return all.filter(x=>x.kind==='training-assignments'&&x.studentId===studentId&&x.status!=='Cancelled').sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));}
