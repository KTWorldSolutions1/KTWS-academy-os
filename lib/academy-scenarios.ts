import type {RecordData} from './training';
export type OperationalFlag={code:string;priority:'High'|'Medium';studentId:string;message:string;action:string};
export function studentOperationalFlags(student:RecordData,referenceDate:string):OperationalFlag[]{
 if(student.kind!=='students'||['Graduated','Withdrawn'].includes(student.status))return [];
 const flags:OperationalFlag[]=[];
 const add=(code:string,priority:'High'|'Medium',message:string,action:string)=>flags.push({code,priority,studentId:student.id,message,action});
 const corrected=new Set((student.sessions||[]).map((s:any)=>s.correctionOf).filter(Boolean));
 const active=(student.sessions||[]).filter((s:any)=>!corrected.has(s.id));
 const sessions=active.filter((s:any)=>s.date===referenceDate);
 const weekday=new Date(referenceDate+'T12:00:00Z').getUTCDay();
 const isTrainingDay=weekday>=1&&weekday<=5;
 if(isTrainingDay&&['Classroom','Yard','Road'].includes(student.status)&&!sessions.length)add('ATTENDANCE_MISSING','Medium','Attendance not recorded for the selected date','Ask the instructor to confirm attendance; do not infer absence.');
 const latest=(student.assessments||[]).filter((a:any)=>a.type==='Theory final').at(-1);
 if(latest&&Number(latest.score)<80)add('THEORY_REMEDIATION','High','Latest theory final below the school threshold','Assign targeted coaching and reassessment; verify testing rules.');
 if(student.fundingStatus==='Pending authorization')add('FUNDING_PENDING','High','Funding authorization pending','Contact assigned case manager and verify written approval before confirming sponsored enrollment.');
 if(student.status==='Road'&&active.some((s:any)=>s.phase==='Road'&&s.mode==='Instruction'))add('ROAD_HOURS_UNCLASSIFIED','Medium','Historical road entries have unclassified instruction mode','Verify whether the student operated the vehicle; preserve correction history.');
 if(student.testResult==='Failed')add('RETEST_REVIEW','High','Skills test marked failed','Document remediation and verify retest eligibility with testing authority.');
 return flags;
}
export function campusOperationalFlags(records:RecordData[],date:string){return records.filter(r=>r.kind==='students').flatMap(r=>studentOperationalFlags(r,date));}
