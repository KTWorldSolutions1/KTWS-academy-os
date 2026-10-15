import type {RecordData as R} from './training.ts';
import {activeSessions,latestSkill,skills,theoryState} from './training.ts';
import {drivingTimeSummary} from './attendance.ts';
export type TprArea='Theory'|'Range'|'Public road';
export type PreflightItem={id:string;label:string;present:boolean;detail:string};
export type TprReview={area:TprArea;studentId:string;campusId:string;checks:PreflightItem[];openItems:number;readyForStaffReview:boolean;warning:string};
const validDate=(v:any)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
/** Deliberately an internal evidence checklist, not the FMCSA schema or a
 * submission authorization. Each school's policies/ELDT applicability still
 * require independent review; no regulatory thresholds are invented. */
export function tprEvidenceReview(s:R,campus:R|undefined,area:TprArea):TprReview{
 const checks:PreflightItem[]=[];
 const add=(id:string,label:string,present:boolean,detail:string)=>checks.push({id,label,present,detail});
 add('campus','Training location',!!campus&&campus.status==='Active'&&campus.id===s.campusId,'Student and registered campus records must match.');
 add('provider','Provider location identifier',!!campus?.tprLocationId&&typeof campus.tprLocationId==='string','Verify the exact ID against the official registry.');
 add('person','Student name',!!s.name?.trim(),'Review identity against official supporting documents.');
 add('license','Commercial learner permit / license reference',!!(s.clpNumber||s.licenseNumber),'Do not print identifiers in this checklist. Verify through authorized enrollment records.');
 add('state','Issuing state',!!(s.clpState||s.licenseState),'Confirm state of issuance and currently valid credentials.');
 add('program','Applicable training program',!!s.program,'Check ELDT applicability, class/endorsement and campus-specific requirements.');
 const enrolled=s.status!=='Withdrawn'&&s.status!=='Enrollment pending';
 add('active','Enrollment stage reviewed',enrolled,'Confirm enrollment and training eligibility; a stage label alone is not proof.');
 if(area==='Theory'){
  const state=theoryState(s);
  add('score','Theory final at the configured threshold',state.passed,'The school checks the recorded answers, score and applicable standard.');
  add('theory-signoff','Instructor theory completion sign-off',state.signed,'Instructor attestation and planned classroom hours require verification.');
 }
 if(area==='Range'||area==='Public road'){
  const phase=area==='Range'?'Yard':'Road';
  const missing=skills[phase].filter(skill=>latestSkill(s,skill)?.level!=='Proficient');
  add('skills','School-approved '+(area==='Range'?'yard':'road')+' skill review',missing.length===0,missing.length?'Skills without a recorded proficient evaluation: '+missing.join(', '):'Each local rubric item has an instructor evaluation. Verify the required federal units separately.');
  const done=activeSessions(s).some(x=>x.phase===phase&&['Present','Late','Left early'].includes(x.attendance)&&Number(x.hours)>0&&x.instructor);
  add('instructor','Actual instructor-attested training entries',done,'Planned lessons, observations and missing attendance do not automatically count.');
  if(area==='Public road'){
   const sum=drivingTimeSummary(s);
   add('driving','Actual student-operated road time',sum.studentDrivingHours>0,'Observation hours are separate; do not invent a federal minimum-hour target.');
   add('classification','Road observation and driving separated',sum.unclassifiedRoadHours===0,'Correct old unclassified road entries before using evidence for certification.');
  }
 }
 const openItems=checks.filter(x=>!x.present).length;
 return {area,studentId:s.id,campusId:s.campusId,checks,openItems,readyForStaffReview:openItems===0,warning:'School review checklist only. This does NOT submit to FMCSA, prove ELDT compliance, certify training, or determine CDL testing eligibility.'};
}
export function validateTprTracking(r:R){
 if(r.kind!=='tpr')return null;
 if(!['Theory','Range','Public road'].includes(r.trainingType))return 'Select the recorded type of training.';
 if(!['Review pending','Submitted externally','Confirmed','Correction needed'].includes(r.status))return 'Select a valid manual reporting status.';
 if(!r.studentId||!r.campusId)return 'TPR tracking must identify a real student and campus.';
 if(!validDate(r.completionDate))return 'Choose a valid date of actual training completion.';
 if(r.confirmationReference!=null&&(typeof r.confirmationReference!=='string'||r.confirmationReference.length>200))return 'Check the official confirmation reference.';
 if(r.status==='Confirmed'&&!r.confirmationReference?.trim())return 'An official submission confirmation reference is required.';
 return null;
}
