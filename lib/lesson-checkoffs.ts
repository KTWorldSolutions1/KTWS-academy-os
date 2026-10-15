import {activeSessions,type RecordData as R} from './training.ts';

export const lessonPhases=['Classroom','Yard','Road'] as const;
export const lessonStates=['Draft','Approved','Retired'] as const;
export const checkoffStates=['Needs practice','Completed'] as const;
export const checkoffSources=['Daily attendance','Skill evaluation','Assessment'] as const;
const validDate=(v:any)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;

/** A school-approved curriculum map and separate, signed progress events.
 * This does not implement FMCSA certification or award additional BTW hours. */
export function validateLessonRecord(r:R):string|null {
 if(r.kind==='curriculum-units'){
  if(!lessonStates.includes(r.status))return 'Choose Draft, Approved, or Retired.';
  if(!r.campusId||!lessonPhases.includes(r.phase))return 'Select a campus and classroom, yard or road.';
  if(typeof r.program!=='string'||r.program.trim().length<2||r.program.length>120)return 'Enter the school training program.';
  if(typeof r.code!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._-]{1,29}$/.test(r.code))return 'Use a short lesson code with letters, numbers or dashes.';
  if(!Number.isInteger(Number(r.version))||Number(r.version)<1||Number(r.version)>99)return 'Lesson version must be between 1 and 99.';
  if(!Number.isInteger(Number(r.sequence))||Number(r.sequence)<1||Number(r.sequence)>9999)return 'Lesson order must be between 1 and 9999.';
  if(typeof r.objective!=='string'||r.objective.trim().length<12||r.objective.length>2000)return 'Describe the student learning goal in 12 to 2,000 characters.';
  if(r.notes!=null&&(typeof r.notes!=='string'||r.notes.length>3000))return 'Keep optional instructor guidance under 3,000 characters.';
  return null;
 }
 if(r.kind==='unit-evidence'){
  if(!checkoffStates.includes(r.status))return 'Choose Needs practice or Completed.';
  if(!r.campusId||!r.studentId||!r.unitId)return 'Select a student, campus and approved lesson.';
  if(!validDate(r.date))return 'Enter the date the student actually completed the lesson activity.';
  if(!checkoffSources.includes(r.sourceType)||typeof r.sourceId!=='string'||!r.sourceId)return 'Select a saved instructor training entry as evidence.';
  if(typeof r.notes!=='string'||r.notes.trim().length<12||r.notes.length>3000)return 'Enter at least 12 characters describing what was observed.';
  if(r.correctionOf!=null&&(typeof r.correctionOf!=='string'||!r.correctionOf||r.correctionOf===r.id))return 'Choose a valid earlier checkoff to correct.';
  return null;
 }
 return null;
}
export function activeLessonCheckoffs(all:R[],studentId:string,unitId?:string):R[]{
 const entries=all.filter(r=>r.kind==='unit-evidence'&&r.studentId===studentId);
 const superseded=new Set(entries.map(r=>r.correctionOf).filter(Boolean));
 return entries.filter(r=>!superseded.has(r.id)&&(!unitId||r.unitId===unitId)).sort((a,b)=>(b.date+(b.recordedAt||'')).localeCompare(a.date+(a.recordedAt||'')));
}
export function lessonProgress(all:R[],student:R,includeDrafts=false){
 const units=all.filter(x=>x.kind==='curriculum-units'&&x.campusId===student.campusId&&x.program===student.program&&(x.status==='Approved'||includeDrafts&&x.status==='Draft')).sort((a,b)=>Number(a.sequence)-Number(b.sequence)||a.name.localeCompare(b.name));
 return units.map(u=>{
  const active=activeLessonCheckoffs(all,student.id,u.id)[0];
  const sourceStillValid=active?.status==='Completed'&&!validateLessonLinks(active,all,'Instructor','9999-12-31');
  const status=active?.status==='Completed'&&!sourceStillValid?'Needs review':active?.status||'Not started';
  return {unitId:u.id,name:u.name,phase:u.phase,sequence:u.sequence,version:u.version,status,completedOn:status==='Completed'?active!.date:null,reviewedAt:active?.recordedAt||null};
 });
}
export function validateLessonLinks(r:R,all:R[],role:string,today:string):{status:number;error:string}|null{
 if(r.kind==='curriculum-units'){
  const campus=all.find(x=>x.kind==='campuses'&&x.id===r.campusId&&x.status==='Active');
  if(!campus)return {status:400,error:'Select an active campus for this curriculum.'};
  const duplicate=all.find(x=>x.kind==='curriculum-units'&&x.id!==r.id&&x.campusId===r.campusId&&x.program===r.program&&x.code===r.code&&Number(x.version)===Number(r.version));
  if(duplicate)return {status:409,error:'A lesson with this program, code and version already exists at the campus.'};
  if(r.status==='Retired'&&!r.approvedBy)return {status:400,error:'Only an already approved lesson may be retired.'};
  if(r.status==='Approved'&&all.some(x=>x.kind==='curriculum-units'&&x.id!==r.id&&x.campusId===r.campusId&&x.program===r.program&&x.code===r.code&&x.status==='Approved'))return {status:409,error:'Retire the previously approved version before approving a replacement lesson.'};
  return null;
 }
 if(r.kind!=='unit-evidence')return null;
 if(r.date>today)return {status:400,error:'Do not record future lesson completion.'};
 const student=all.find(x=>x.kind==='students'&&x.id===r.studentId);
 const unit=all.find(x=>x.kind==='curriculum-units'&&x.id===r.unitId);
 if(!student||student.campusId!==r.campusId||['Withdrawn','Enrollment pending'].includes(student.status))return {status:400,error:'Select an eligible student from your campus.'};
 if(!unit||unit.campusId!==r.campusId||unit.program!==student.program||unit.status!=='Approved')return {status:400,error:'Select an approved lesson for the student’s actual campus and program.'};
 if(r.correctionOf){
  const original=all.find(x=>x.kind==='unit-evidence'&&x.id===r.correctionOf);
  if(!original||original.studentId!==r.studentId||original.unitId!==r.unitId||original.campusId!==r.campusId)return {status:400,error:'Correction must reference a previous checkoff for the same student and lesson.'};
  if(all.some(x=>x.kind==='unit-evidence'&&x.correctionOf===original.id&&x.id!==r.id))return {status:409,error:'This checkoff was already corrected. Correct the latest entry instead.'};
 }
 let source:any;
 if(r.sourceType==='Daily attendance')source=activeSessions(student).find((x:any)=>x.id===r.sourceId&&x.phase===unit.phase&&['Present','Late','Left early'].includes(x.attendance)&&Number(x.hours)>0&&x.instructor?.trim());
 else if(r.sourceType==='Skill evaluation')source=(student.evaluations||[]).find((x:any)=>x.id===r.sourceId&&x.phase===unit.phase&&x.instructor?.trim());
 else source=(student.assessments||[]).find((x:any)=>x.id===r.sourceId&&unit.phase==='Classroom'&&x.instructor?.trim());
 if(!source)return {status:400,error:'Choose an actual existing instructor entry for this student and training area.'};
 if(r.sourceType==='Daily attendance'&&source.date&&r.date<source.date)return {status:400,error:'Completion cannot be dated before the recorded training.'};
 if(r.status==='Completed'&&r.sourceType==='Skill evaluation'&&(source.level!=='Proficient'||source.signed!==true))return {status:400,error:'Skill completion requires the signed, proficient instructor evaluation.'};
 if(r.status==='Completed'&&r.sourceType==='Assessment'&&Number(source.score)<80)return {status:400,error:'A theory assessment below the school passing threshold needs additional practice, not completion.'};
 return null;
}
