import type {RecordData as R} from './training.ts';
/** Tasks and appointments are always bound to one campus, and the assignee
 * must have access to that campus. Multi-campus staff can receive assignments
 * in any of their authorized campuses; only owner/regional-admin roles can
 * create cross-campus work outside their own assigned campus IDs. */
export function assignmentIssue(r:R,records:R[]){
 if(!['tasks','appointments'].includes(r.kind)||!r.assignedTo)return null;
 if(!r.campusId||r.campusId==='__legacy__')return 'Choose a real campus for staff-assigned work.';
 const campus=records.find(x=>x.id===r.campusId&&x.kind==='campuses');
 if(!campus||campus.status!=='Active')return 'Choose an active campus for this assignment.';
 const assigned=records.find(x=>x.id===r.assignedTo&&x.kind==='staff');
 if(!assigned||assigned.status!=='Active')return 'Assign an active school employee.';
 if(!(assigned.campusIds||[]).includes(r.campusId))return 'This employee does not have access to the assignment campus. Ask the school owner to approve that campus first.';
 if(r.kind==='appointments'&&(!/^\d{4}-\d{2}-\d{2}$/.test(r.date||'')||r.end<=r.start))return 'Appointments need a valid date and an end time after their start.';
 return null;
}
export function dueWorkForStaff(records:R[],staffId:string,asOf:string){
 return records.filter(x=>['tasks','appointments'].includes(x.kind)&&x.assignedTo===staffId
 &&(x.kind==='tasks'?!['Complete','Cancelled'].includes(x.status):!['Cancelled','Completed'].includes(x.status))
 &&String(x.kind==='tasks'?x.due:x.date||'')<=asOf).sort((a,b)=>String(a.kind==='tasks'?a.due:a.date).localeCompare(String(b.kind==='tasks'?b.due:b.date)));
}
