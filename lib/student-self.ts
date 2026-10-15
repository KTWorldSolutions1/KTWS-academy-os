import {activeSessions,instructionHours,latestSkill,skills,theoryState,type RecordData as R} from './training.ts';
import {drivingTimeSummary} from './attendance.ts';

/** Privacy-minimized, student-owned training view. Never expose enrollment
 * identifiers, financial information, private staff notes, R2 metadata, raw
 * tests, agency releases, or other students' names. */
export function studentSelfView(s:R,records:R[]){
 const campus=records.find(x=>x.kind==='campuses'&&x.id===s.campusId);
 const klass=records.find(x=>x.kind==='classes'&&x.id===s.classId&&x.campusId===s.campusId);
 const latest=activeSessions(s).filter(x=>x.date&&['Classroom','Yard','Road'].includes(x.phase))
   .sort((a,b)=>(b.date+(b.createdAt||'')).localeCompare(a.date+(a.createdAt||''))).slice(0,40);
 const driving=drivingTimeSummary(s),theory=theoryState(s);
 return {
  id:s.id,name:s.name,program:s.program||null,status:s.status,campus:campus?.name||'Assigned campus',
  trainingClass:klass?{name:klass.name,startDate:klass.startDate||null,endDate:klass.endDate||null}:null,
  hours:{classroom:instructionHours(s,'Classroom'),yard:instructionHours(s,'Yard'),roadInstruction:instructionHours(s,'Road'),actualDriving:driving.studentDrivingHours,observation:driving.observationHours,unclassified:driving.unclassifiedRoadHours},
  targets:{classroom:Number(s.targetTheory||0),yard:Number(s.targetYard||0),road:Number(s.targetRoad||0)},
  theory:{label:theory.label,finalScore:theory.final?Number(theory.final.score):null},
  skillCounts:{yardProficient:skills.Yard.filter(name=>latestSkill(s,name)?.level==='Proficient').length,yardTotal:skills.Yard.length,roadProficient:skills.Road.filter(name=>latestSkill(s,name)?.level==='Proficient').length,roadTotal:skills.Road.length},
  attendance:latest.map(x=>({date:x.date,phase:x.phase,attendance:x.attendance,hours:Number(x.hours)||0,mode:x.mode||'Instruction'})),
  nextLessons:records.filter(x=>x.kind==='training-assignments'&&x.campusId===s.campusId&&x.studentId===s.id&&x.status!=='Cancelled'&&x.date>=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'}))
    .sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)).slice(0,8)
    .map(x=>({date:x.date,start:x.start,end:x.end,phase:x.phase,status:x.status,topic:x.lessonObjective||'Lesson planned'})),
  notice:'Read-only student progress from saved school records. Recorded training hours are not FMCSA certification, and planned lessons are not attendance. Contact your campus to correct or discuss an entry.'
 };
}
export function allowedStudentAccount(student:R,link:{student:string;campus:string;active:number}){
 return !!student&&student.kind==='students'&&student.id===link.student&&student.campusId===link.campus&&link.active===1&&student.status!=='Withdrawn';
}
