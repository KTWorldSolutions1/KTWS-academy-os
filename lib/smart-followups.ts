import type {RecordData as R} from './training.ts';
import {campusOf} from './enterprise.ts';
import {operationsSignals,relatedCase,makeCase,type Signal} from './operations.ts';
export type FollowupSuggestion={key:string;signal:Signal;campusId:string;candidateStaff:R[];suggestedStaffId:string};
const preferred:Record<string,string[]>={'Training support':['Instructor','Campus manager'],'Attendance support':['Instructor','Campus manager'],'Vehicle service':['Campus manager','Instructor'],'Enrollment review':['Enrollment specialist','Campus manager'],'Funding follow-up':['Enrollment specialist','Campus manager'],'Career support':['Enrollment specialist','Campus manager'],'General follow-up':['Enrollment specialist','Admin assistant','Front desk','Campus manager']};
function candidates(signal:Signal,records:R[]){
 const campusId=campusOf(signal.record,records),choices=records.filter(r=>r.kind==='staff'&&r.status==='Active'&&r.campusIds?.includes(campusId)&&r.accessRole);
 const priority=preferred[signal.category]||['Campus manager'];
 return choices.sort((a,b)=>((priority.indexOf(a.accessRole)<0?100:priority.indexOf(a.accessRole))-(priority.indexOf(b.accessRole)<0?100:priority.indexOf(b.accessRole)))||a.name.localeCompare(b.name));
}
/** Generates only suggestions. Every resulting work item requires explicit
 * acceptance by the human reviewer; this function has no side effects. */
export function proposedSchoolFollowups(records:R[],date:string):FollowupSuggestion[]{
 return operationsSignals(records,date).filter(signal=>!relatedCase(records,signal)).map(signal=>{
  const campusId=campusOf(signal.record,records),candidateStaff=candidates(signal,records);
  return {key:signal.key,signal,campusId,candidateStaff,suggestedStaffId:candidateStaff[0]?.id||''};
 });
}
export function approvedSchoolFollowup(suggestion:FollowupSuggestion,staff:R,records:R[],date:string,uuid:string):R{
 if(!staff||staff.kind!=='staff'||staff.status!=='Active'||!staff.campusIds?.includes(suggestion.campusId))throw Error('Assign the follow-up to an active employee at the same campus.');
 if(!suggestion.candidateStaff.some(s=>s.id===staff.id))throw Error('The employee is not approved for this campus follow-up.');
 if(relatedCase(records,suggestion.signal))throw Error('This attention item already has an active follow-up.');
 const work=makeCase(suggestion.signal,records,date,uuid);
 return {...work,owner:staff.name,staffId:staff.id,plan:'Review the documented '+suggestion.signal.category.toLowerCase()+' issue, verify the source evidence, contact the responsible party when authorized, and record the resolution or next review.',due:date,priority:suggestion.signal.priority,signalKey:suggestion.key,campusId:suggestion.campusId};
}
