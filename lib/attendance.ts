import type {RecordData} from './training';
export const attendanceLocations=['Classroom','Yard','Road','All students'] as const;
export function attendanceRoster(students:RecordData[],location:string){return students.filter(s=>s.kind==='students'&&!['Graduated','Withdrawn'].includes(s.status)&&(location==='All students'||s.status===location));}
export function attendancePhase(student:RecordData,location:string,override?:string){return override|| (location==='All students'?(['Classroom','Yard','Road'].includes(student.status)?student.status:''):location);}

/** Daily attendance must be explicitly marked; a blank is never an absence. */
export function attendanceForDay(student:RecordData,day:string,phase?:string){
 const entries=(student.sessions||[]).filter((s:any)=>s.date===day&&(!phase||s.phase===phase));
 const superseded=new Set(entries.map((s:any)=>s.correctionOf).filter(Boolean));
 const active=entries.filter((s:any)=>!superseded.has(s.id));
 return active.length?active.at(-1).attendance:'Not recorded';
}
/** Observation is tracked separately from time operating the vehicle. */
export function drivingTimeSummary(student:RecordData){
 const superseded=new Set((student.sessions||[]).map((s:any)=>s.correctionOf).filter(Boolean));
 const active=(student.sessions||[]).filter((s:any)=>!superseded.has(s.id)&&s.phase==='Road'&&['Present','Late','Left early'].includes(s.attendance));
 return {studentDrivingHours:active.filter((s:any)=>s.mode==='Student driving'&&s.studentOperatedVehicle===true).reduce((n:number,s:any)=>n+Number(s.hours||0),0),nightDrivingHours:active.filter((s:any)=>s.mode==='Student driving'&&s.studentOperatedVehicle===true).reduce((n:number,s:any)=>n+Number(s.nightDrivingHours||0),0),observationHours:active.filter((s:any)=>s.mode==='Observation').reduce((n:number,s:any)=>n+Number(s.hours||0),0),unclassifiedRoadHours:active.filter((s:any)=>s.mode!=='Observation'&&!(s.mode==='Student driving'&&s.studentOperatedVehicle===true)).reduce((n:number,s:any)=>n+Number(s.hours||0),0)};
}
