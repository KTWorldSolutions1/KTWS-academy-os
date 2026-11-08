/** Pure, read-only analytics used by Innovation Studio.
 * Input records have already been restricted by server-side campus permissions.
 * No inference here changes regulated student state or payroll.
 */
export type StudioRecord={id:string;kind:string;name?:string;status?:string;campusId?:string;campusIds?:string[];[key:string]:any};
export type SimState='out'|'working'|'break';
export type PunchEvent={action:'clock_in'|'break_start'|'break_end'|'clock_out';minute:number};
export const simulatedTime=(events:PunchEvent[],at:number)=>{
 let start:number|null=null,breakStart:number|null=null,paid=0,breaks=0,state:SimState='out';
 for(const e of events){
  if(e.action==='clock_in'&&state==='out'){state='working';start=e.minute;}
  else if(e.action==='break_start'&&state==='working'&&start!==null){paid+=Math.max(0,e.minute-start);start=null;breakStart=e.minute;state='break';}
  else if(e.action==='break_end'&&state==='break'&&breakStart!==null){breaks+=Math.max(0,e.minute-breakStart);breakStart=null;start=e.minute;state='working';}
  else if(e.action==='clock_out'&&state==='working'&&start!==null){paid+=Math.max(0,e.minute-start);start=null;state='out';}
 }
 if(state==='working'&&start!==null)paid+=Math.max(0,at-start);
 if(state==='break'&&breakStart!==null)breaks+=Math.max(0,at-breakStart);
 return {state,paid,breaks};
};
export function innovationCounts(records:StudioRecord[],today=new Date().toISOString().slice(0,10)){
 const students=records.filter(r=>r.kind==='students'&&r.status!=='Withdrawn');
 const leads=records.filter(r=>r.kind==='leads'&&!['Closed','Enrolled','Lost'].includes(r.status||''));
 const trucks=records.filter(r=>r.kind==='fleet');
 const tpr=records.filter(r=>r.kind==='tpr');
 const pendingTpr=tpr.filter(r=>r.status!=='Confirmed');
 const clpWaiting=students.filter(r=>!r.clpNumber&&!r.licenseNumber&&!['Graduated','Withdrawn'].includes(r.status||''));
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const missingTprCampus=campuses.filter(r=>!String(r.tprLocationId||'').trim());
 const credentials=records.filter(r=>r.kind==='staff-credentials');
 const expiredCredentials=credentials.filter(r=>typeof r.expiry==='string'&&r.expiry<today&&r.status!=='Inactive');
 return {students,leads,trucks,tpr,pendingTpr,clpWaiting,campuses,missingTprCampus,expiredCredentials};
}
export const studentPhases=['Enrollment','Classroom','Permit & Pretrip','Yard Maneuvers','Road & Testing','Graduated'];
export function phaseOf(s:StudioRecord){const status=(s.status||'').toLowerCase();
 if(status.includes('grad'))return 5;
 if(status.includes('road')||status.includes('test'))return 4;
 if(status.includes('yard')||status.includes('range'))return 3;
 if(status.includes('permit')||status.includes('pretrip'))return 2;
 if(status.includes('class')||status.includes('theory'))return 1;
 return 0;
}
