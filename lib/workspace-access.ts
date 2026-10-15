import {identity} from '../server/context';
import {database} from './storage';
import {restrictedCategories} from './enterprise';
export async function getWorkspaceAccess(){const user=identity.getStore();if(!user)return null;if(user.userId.startsWith('external-')||user.userId.startsWith('student-'))return null;if(user.userId==='academy-owner')return {user,scope:'academy-owner',role:'Owner',campusIds:[]};const row:any=await database().prepare("SELECT payload FROM records WHERE owner = 'academy-owner' AND kind = 'staff' AND lower(json_extract(payload,'$.email')) = ? AND json_extract(payload,'$.status') = 'Active'").bind(user.email.toLowerCase()).first();if(!row)return null;const p=JSON.parse(row.payload);if(!['Campus manager','Enrollment specialist','Admin assistant','Front desk','Instructor'].includes(p.accessRole))return null;return {user,scope:'academy-owner',role:p.accessRole,campusIds:p.campusIds||[]};}
export function canWrite(role:string,kind:string){if(role==='Owner')return true;if(['staff','settings','campuses','templates'].includes(kind))return false;if(kind==='shifts')return role==='Campus manager';if(kind==='training-assignments')return role==='Campus manager';if(kind==='vehicle-checks')return ['Campus manager','Instructor'].includes(role);if(kind==='employment-offers')return ['Campus manager','Enrollment specialist'].includes(role);if(kind==='sponsorships')return ['Campus manager','Enrollment specialist'].includes(role);if(kind==='campus-readiness')return role==='Campus manager';if(kind==='staff-credentials')return role==='Campus manager';if(role==='Campus manager')return true;if(role==='Instructor')return ['students','quizzes','lessons','schedules'].includes(kind);if(role==='Front desk')return ['leads','appointments','tasks'].includes(kind);return ['students','leads','tasks','funding','finance','classes','appointments','enrollments','partners','mous','contracts','messages','tpr','referrals'].includes(kind);}
export function canRead(role:string,kind:string){if(kind==='training-assignments'||kind==='vehicle-checks')return ['Owner','Campus manager','Instructor'].includes(role);if(kind==='employment-offers')return ['Owner','Campus manager','Enrollment specialist'].includes(role);if(kind==='sponsorships')return ['Owner','Campus manager','Enrollment specialist'].includes(role);if(kind==='campus-readiness')return ['Owner','Campus manager','Enrollment specialist','Admin assistant'].includes(role);if(kind==='staff-credentials')return ['Owner','Campus manager'].includes(role);if(kind==='shifts')return ['Owner','Campus manager'].includes(role);if(role==='Instructor')return ['students','courses','quizzes','lessons','schedules','classes','tasks','campuses','fleet','staff'].includes(kind);if(role==='Front desk')return ['students','leads','appointments','classes','tasks','campuses','templates'].includes(kind);return true;}
/** Server-side projection is enforced on API reads, not just hidden in the UI. */
export function projectRecord(r:any,role:string){
 // Roles that may coordinate with staff require directory information, not
 // private credential files, personal contact details or personnel notes.
 if(r.kind==='staff'&&!['Owner','Campus manager'].includes(role)){
  const {id,kind,name,status,revision,accessRole,campusIds,position,department}=r;
  return {id,kind,name,status,revision,accessRole,campusIds,position,department};
 }
 if(r.kind!=='students')return r;
 if(role==='Front desk'){
  const {id,kind,name,status,revision,campusId,classId,cohort,program,email,phone}=r;
  return {id,kind,name,status,revision,campusId,classId,cohort,program,email,phone};
 }
 if(role==='Instructor'){
  const {id,kind,name,status,revision,campusId,classId,cohort,program,startDate,targetTheory,targetYard,targetRoad,sessions,evaluations,assessments,theorySignoff,testResult}=r;
  return {id,kind,name,status,revision,campusId,classId,cohort,program,startDate,targetTheory,targetYard,targetRoad,sessions:sessions||[],evaluations:evaluations||[],assessments:assessments||[],theorySignoff,testResult};
 }
 if(!['Owner','Campus manager'].includes(role)){
  const restricted=new Set(restrictedCategories);
  const {ssn,ssnLast4,drugScreen,dob,medical,medicalQualification,licenseNumber,clpNumber,driverRecordDate,...safe}=r;
  return {...safe,documents:(r.documents||[]).filter((d:any)=>!restricted.has(d.category))};
 }
 return r;
}
