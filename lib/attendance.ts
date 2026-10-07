import type {RecordData} from './training';
export const attendanceLocations=['Classroom','Yard','Road','All students'] as const;
export function attendanceRoster(students:RecordData[],location:string){return students.filter(s=>s.kind==='students'&&!['Graduated','Withdrawn'].includes(s.status)&&(location==='All students'||s.status===location));}
export function attendancePhase(student:RecordData,location:string,override?:string){return override|| (location==='All students'?(['Classroom','Yard','Road'].includes(student.status)?student.status:''):location);}
