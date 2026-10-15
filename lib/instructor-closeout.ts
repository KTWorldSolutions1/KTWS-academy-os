import type {RecordData as R} from './training.ts';
import {activeSessions} from './training.ts';
import {completedLessonEvidence,unresolvedVehicleDefects} from './training-dispatch.ts';

export type CloseoutCheck={id:string;title:string;detail:string;kind:'attention'|'recorded'|'info';studentId?:string;lessonId?:string;page:'courses'|'dispatch'|'fleet'};
export type CloseoutSummary={day:string;campusId:string;planned:number;withTrainingEvidence:number;withoutTrainingEvidence:number;recordedStudents:number;vehicleHolds:number;checks:CloseoutCheck[];notice:string};

/** Read-only end-of-day worklist. No attendance, skill or credited hour is
 * created from scheduled lessons, and absence is never inferred. */
export function instructorDailyCloseout(records:R[],campusId:string,day:string,employeeId?:string):CloseoutSummary{
 const inCampus=(r:R)=>r.campusId===campusId;
 const schoolStudents=records.filter(r=>r.kind==='students'&&inCampus(r));
 const plans=records.filter(r=>r.kind==='training-assignments'&&inCampus(r)&&r.date===day&&r.status!=='Cancelled'&&(!employeeId||r.employeeId===employeeId));
 const instructor=employeeId?records.find(r=>r.kind==='staff'&&r.id===employeeId):null;
 const instructorName=String(instructor?.name||'').trim().toLowerCase();
 const checks:CloseoutCheck[]=[];
 const plannedIds=new Set(plans.map(p=>p.studentId));
 let withTrainingEvidence=0;
 for(const lesson of plans){
  const student=schoolStudents.find(s=>s.id===lesson.studentId);
  if(!student){
   checks.push({id:'student-missing-'+lesson.id,title:'Review unlinked lesson',detail:'Scheduled student is not in the selected campus. Ask a manager to review the assignment.',kind:'attention',lessonId:lesson.id,page:'dispatch'});
   continue;
  }
  const attested=completedLessonEvidence(lesson,records);
  if(attested){
   withTrainingEvidence++;
   checks.push({id:'lesson-recorded-'+lesson.id,title:student.name+' · '+lesson.phase,detail:'A matching instructor-recorded training entry exists. Independently review hour and skills evidence.',kind:'recorded',lessonId:lesson.id,studentId:student.id,page:'courses'});
  }else {
   checks.push({id:'lesson-unreviewed-'+lesson.id,title:'Check '+student.name+' · '+lesson.phase,detail:lesson.start+'–'+lesson.end+' scheduled. No matching actual instructor training entry is recorded; this does not mean absent.',kind:'attention',lessonId:lesson.id,studentId:student.id,page:'courses'});
  }
 }
 const recorded=schoolStudents.filter(s=>activeSessions(s).some(x=>x.date===day&&['Present','Late','Left early','Absent','Excused'].includes(x.attendance)&&(!employeeId||String(x.instructor||'').trim().toLowerCase()===instructorName)));
 for(const student of recorded.filter(s=>!plannedIds.has(s.id))){
  checks.push({id:'unplanned-entry-'+student.id,title:student.name+' · attendance recorded',detail:'A dated training/attendance entry exists without a matching scheduled lesson in this view. Review schedule and evidence; do not delete recorded history.',kind:'info',studentId:student.id,page:'courses'});
 }
 const units=records.filter(r=>r.kind==='fleet'&&inCampus(r));
 const holds=units.flatMap(u=>unresolvedVehicleDefects(records,u.id).map(defect=>({unit:u,defect})));
 for(const {unit,defect} of holds){
  checks.push({id:'hold-'+defect.id,title:unit.name+' · safety hold',detail:'Reported '+defect.date+'. Manager repair verification is needed before future training using this vehicle.',kind:'attention',page:'fleet'});
 }
 const order={attention:0,info:1,recorded:2};
 checks.sort((a,b)=>order[a.kind]-order[b.kind]||a.title.localeCompare(b.title));
 return {day,campusId,planned:plans.length,withTrainingEvidence,withoutTrainingEvidence:plans.length-withTrainingEvidence,recordedStudents:recorded.length,vehicleHolds:holds.length,checks,notice:'This is a read-only worklist. A missing entry is not an absence. A planned lesson is not completed ELDT training or FMCSA TPR evidence.'};
}
