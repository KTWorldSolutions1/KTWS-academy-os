import type {RecordData as R} from './training.ts';
export const safetyTypes=['Hazard','Near miss','Vehicle damage','Injury reported','Other'] as const;
export const safetyLocations=['Yard','Classroom','Road','Office or facility','Other'] as const;
export const safetyReviewStatuses=['In review','Escalated','Resolved','Reopened'] as const;
function validDate(value:any){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
export function validateSafetyRecord(r:R){
 if(r.kind==='safety-incidents'){
  if(r.status!=='Reported')return 'An incident report must start as Reported. Management decisions belong in a separate review record.';
  if(!safetyTypes.includes(r.category)||!safetyLocations.includes(r.location))return 'Choose a valid concern type and where it happened.';
  if(!r.campusId||!validDate(r.date))return 'Select the campus and correct incident date.';
  if(typeof r.description!=='string'||r.description.trim().length<12||r.description.length>3000)return 'Describe what happened in 12 to 3,000 characters. Do not enter confidential medical details or identity numbers.';
  if(r.urgent!==true&&r.urgent!==false)return 'Record whether the concern needs immediate attention.';
  return null;
 }
 if(r.kind==='safety-reviews'){
  if(!safetyReviewStatuses.includes(r.status)||!r.campusId||!r.incidentId||!validDate(r.date))return 'Choose a source incident, campus, review date and valid decision.';
  if(typeof r.notes!=='string'||r.notes.trim().length<12||r.notes.length>3000)return 'Explain the management review in 12 to 3,000 characters.';
  if(r.status==='Resolved'&&(!r.resolution||r.resolution.trim().length<20||!r.sourceReference||r.sourceReference.trim().length<8))return 'A resolution needs a reviewed remedy and source reference. This does not certify legal or safety compliance.';
  if(r.resolution!=null&&(typeof r.resolution!=='string'||r.resolution.length>3000))return 'The resolution notes are too long.';
  if(r.sourceReference!=null&&(typeof r.sourceReference!=='string'||r.sourceReference.length>300))return 'Check the original source reference.';
 }
 return null;
}
export function safetyCaseSummary(records:R[],campusId:string){
 const incidents=records.filter(x=>x.kind==='safety-incidents'&&x.campusId===campusId).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 return incidents.map(item=>{
  const reviews=records.filter(x=>x.kind==='safety-reviews'&&x.incidentId===item.id&&x.campusId===campusId).sort((a,b)=>String(b.reviewedAt||b.date).localeCompare(String(a.reviewedAt||a.date)));
  const last=reviews[0];
  return {incident:item,lastReview:last,open:!last||last.status!=='Resolved',urgent:item.urgent===true&&(!last||last.status!=='Resolved')};
 });
}
