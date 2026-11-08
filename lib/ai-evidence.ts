/** Whitelisted anonymous fields only. Never send arbitrary saved text
 * from school records to an external model.
 */
const safeStatus=new Set(['Active','Inactive','Open','New','Classroom','Yard','Road','Graduated','Waiting for permit','In progress','Review pending','Submitted externally','Confirmed','Correction needed','Ready','Out of service','Scheduled','Planned','Completed','Cancelled','Closed','Enrolled','Prospect','Draft','Pending']);
const safePhase=new Set(['Classroom','Yard','Road','Theory','Range','Public road','Testing']);
export function anonymousEvidence(rows:{kind?:string;status?:string;phase?:string}[]){
 return rows.map((r,i)=>({
  citation:'R'+(i+1),
  kind:String(r.kind||'Record'),
  status:safeStatus.has(r.status||'')?r.status:'Other',
  phase:safePhase.has(r.phase||'')?r.phase:'Other'
 }));
}
