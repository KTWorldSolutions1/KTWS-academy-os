import type {RecordData as R} from './training.ts';
export const credentialTypes=[
 'Instructor license',
 'CDL class and endorsements',
 'DOT medical qualification',
 'ELDT instructor qualifications',
 'Recruiter authorization',
 'DMV examiner authorization',
 'Background screening',
 'School safety training'
] as const;
export const credentialStatuses=['Pending','Source reviewed','Blocked','Expired','Not applicable'] as const;
export const drivingCredentialTypes=['Instructor license','CDL class and endorsements','DOT medical qualification','ELDT instructor qualifications'];
const dateValid=(s:any)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function validateStaffCredential(r:R){
 if(r.kind!=='staff-credentials')return null;
 if(!credentialTypes.includes(r.credentialType))return 'Select the license, approval or training item being reviewed.';
 if(!credentialStatuses.includes(r.status))return 'Choose a valid credential review status.';
 if(!r.staffId||!r.campusId)return 'Choose the employee and the campus where they work.';
 if(r.sourceReference!=null&&(typeof r.sourceReference!=='string'||r.sourceReference.length>240))return 'Source reference must be under 240 characters.';
 if(r.notes!=null&&(typeof r.notes!=='string'||r.notes.length>2500))return 'Review notes are limited to 2,500 characters.';
 for(const field of ['reviewDate','expiresAt','nextCheck'])if(r[field]&&!dateValid(r[field]))return 'Choose valid credential dates.';
 if(r.status==='Source reviewed'&&(!r.reviewDate||!r.sourceReference?.trim()||r.sourceReference.trim().length<8))return 'Record the date and original approval source before marking an item reviewed.';
 if(r.status==='Not applicable'&&(!r.notes?.trim()||r.notes.trim().length<12))return 'Explain why this requirement does not apply to this employee at this campus.';
 if(r.status==='Not applicable'&&r.credentialType==='Instructor license')return 'Do not waive an instructor authorization using this internal checklist.';
 if(r.expiresAt&&r.reviewDate&&r.expiresAt<r.reviewDate)return 'Expiration date cannot precede the date source was checked.';
 return null;
}
export function staffCredentialStatus(r:R,asOf:string){
 if(r.expiresAt&&r.expiresAt<asOf)return 'Expired';
 if(r.status==='Source reviewed'&&r.nextCheck&&r.nextCheck<asOf)return 'Review overdue';
 return r.status;
}
/** Recorded adverse qualifications block lesson assignments when the school
 * has entered that credential. This does NOT assume credentials absent from
 * the internal tracker are legally valid. */
export function instructorCredentialWarnings(records:R[],employeeId:string,campusId:string,lessonDay:string){
 const relevant=records.filter(x=>x.kind==='staff-credentials'&&x.staffId===employeeId&&x.campusId===campusId&&drivingCredentialTypes.includes(x.credentialType));
 return relevant.filter(x=>!['Source reviewed'].includes(staffCredentialStatus(x,lessonDay))).map(x=>({
  name:x.credentialType,
  state:staffCredentialStatus(x,lessonDay)
 }));
}
export function campusStaffCredentialSnapshot(records:R[],campusId:string,asOf:string){
 const staff=records.filter(r=>r.kind==='staff'&&r.campusIds?.includes(campusId)&&['Active','Pending credential'].includes(r.status));
 const checks=records.filter(r=>r.kind==='staff-credentials'&&r.campusId===campusId);
 const pending=checks.filter(r=>!['Source reviewed','Not applicable'].includes(staffCredentialStatus(r,asOf))).length;
 const expiring=checks.filter(r=>r.expiresAt&&r.expiresAt>=asOf&&r.expiresAt<=new Date(new Date(asOf+'T12:00:00Z').getTime()+30*86400000).toISOString().slice(0,10)).length;
 return {campusId,staffCount:staff.length,recordedChecks:checks.length,pending,expiring,withoutAnyCheck:staff.filter(e=>!checks.some(c=>c.staffId===e.id)).length,
  disclaimer:'Internal source review. Legal instructor licensing, FMCSA training-provider qualification and state certification must be confirmed with the issuing authority.'};
}
