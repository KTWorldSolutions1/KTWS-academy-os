import type {RecordData as R} from './training.ts';
export const readinessAreas=[
 {id:'Yard and practice space',description:'Confirm training yard access, cones, maneuver space and any required agency/site approvals.'},
 {id:'Training trucks',description:'Confirm eligible trucks, maintenance status, safety inspection procedures and access to approved equipment.'},
 {id:'Instructor credentials',description:'Verify actual required instructor approval and valid qualifications for the campus.'},
 {id:'FMCSA training location',description:'Check FMCSA training provider registration/location and local submission procedures.'},
 {id:'Classroom and curriculum',description:'Review actual approved training plan, teaching materials and classrooms.'},
 {id:'Student privacy and files',description:'Confirm protected document handling, key recovery, access controls and retention policy.'},
 {id:'Emergency and safety plan',description:'Review actual emergency contacts, incident procedures and training staff roles.'},
 {id:'Insurance and permissions',description:'Review current policy documents and required state/site authorizations.'}
] as const;
export const readinessStates=['Not started','In progress','Blocked','Ready for manager review','Manager reviewed'] as const;
const validDate=(s:any)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function validateCampusReadiness(r:R){
 if(r.kind!=='campus-readiness')return null;
 if(!readinessAreas.some(a=>a.id===r.area))return 'Select a recognized readiness section.';
 if(!readinessStates.includes(r.status))return 'Select a valid internal progress status.';
 if(typeof r.campusId!=='string'||!r.campusId)return 'Choose a specific campus.';
 if(r.notes!=null&&(typeof r.notes!=='string'||r.notes.length>4000))return 'Readiness notes must be under 4,000 characters.';
 if(r.sourceReference!=null&&(typeof r.sourceReference!=='string'||r.sourceReference.length>300))return 'Keep the original record reference under 300 characters.';
 for(const field of ['sourceCheckedOn','reviewDue'])if(r[field]&&!validDate(r[field]))return 'Enter a valid review date.';
 if(r.status==='Manager reviewed'&&(!r.sourceReference?.trim()||r.sourceReference.trim().length<8||!validDate(r.sourceCheckedOn)))return 'Manager review must include an identified original source and the date that source was checked.';
 return null;
}
export function campusReadinessSnapshot(records:R[],campusId:string,asOf:string){
 const rows=records.filter(r=>r.kind==='campus-readiness'&&r.campusId===campusId);
 const checks=readinessAreas.map(a=>{
  const latest=rows.find(r=>r.area===a.id);
  const overdue=!!latest?.reviewDue&&latest.reviewDue<asOf;
  return {area:a.id,detail:a.description,record:latest,status:latest?.status||'Not started',overdue,reviewed:latest?.status==='Manager reviewed'&&!overdue};
 });
 return {campusId,checks,reviewed:checks.filter(x=>x.reviewed).length,blocked:checks.filter(x=>x.status==='Blocked').length,overdue:checks.filter(x=>x.overdue).length,unrecorded:checks.filter(x=>!x.record).length,
  allInternallyReviewed:checks.every(x=>x.reviewed),
  notice:'Internal school review only. Does not prove NCDMV, Texas DPS, FMCSA or any licensing, insurance, fire or regulatory approval.'};
}
