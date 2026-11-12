import {CLASSROOM_WEEK_ONE,CLASS_A_THEORY_TOPICS} from './classroom-curriculum.ts';

/**
 * Read-only instructor planning preview, never attendance or completion evidence.
 * Uses the school's 07:00–16:00 default as a *nine-hour clock window* and
 * explicitly reports any mismatch against planned teaching hours.
 */
export type InstructorBlock={start:string;end:string;title:string;method:string;hours:number;status:'Planned'};
export type InstructorDayPlan={
 day:number;label:string;title:string;blocks:InstructorBlock[];
 topicCodes:string[];materials:string[];evidence:string[];
 plannedTeachingHours:number;availableClockHours:number;overflowHours:number;
 warnings:string[];generatedFrom:'Class A theory proposal';
};
function minutes(hhmm:string){const parts=hhmm.split(':').map(Number);if(parts.length!==2||parts[0]<0||parts[0]>23||parts[1]<0||parts[1]>59)throw new Error('Invalid school clock time');return parts[0]*60+parts[1];}
function format(value:number){return String(Math.floor(value/60)).padStart(2,'0')+':'+String(value%60).padStart(2,'0');}
export function instructorDayPlan(dayNumber:number,shiftStart='07:00',shiftEnd='16:00',breakMinutes=60):InstructorDayPlan{
 const day=CLASSROOM_WEEK_ONE.find(d=>d.day===dayNumber);
 if(!day)throw new Error('Choose a valid classroom day (1–5).');
 const start=minutes(shiftStart),end=minutes(shiftEnd);
 if(start>=end||!Number.isInteger(breakMinutes)||breakMinutes<0||breakMinutes>=end-start)throw new Error('Enter a valid teaching shift and break.');
 let cursor=start;
 const blocks=day.blocks.map(b=>{
  const minutesRequired=b.hours*60, begin=cursor;
  cursor+=minutesRequired;
  return {start:format(begin),end:format(cursor),title:b.title,method:b.method,hours:b.hours,status:'Planned' as const};
 });
 const plannedTeachingHours=day.blocks.reduce((sum,b)=>sum+b.hours,0);
 const availableClockHours=(end-start-breakMinutes)/60;
 const overflowHours=Math.max(0,plannedTeachingHours-availableClockHours);
 const warnings:string[]=[];
 if(overflowHours>0)warnings.push('This day plans '+plannedTeachingHours+' net teaching hours, but the '+shiftStart+'–'+shiftEnd+' shift with '+breakMinutes+' minutes of breaks permits only '+availableClockHours+' net hours. Rebalance the timetable; do not record unworked hours.');
 warnings.push('Schedule is a draft. J. J. Keller licensed lessons must be assigned and instructor-verified; planned blocks do not prove completion.');
 return {day:day.day,label:day.label,title:day.title,blocks,
 topicCodes:CLASS_A_THEORY_TOPICS.filter(t=>t.day===dayNumber).map(t=>t.code),
 materials:day.materials,evidence:day.evidence,plannedTeachingHours,
 availableClockHours,overflowHours,warnings,generatedFrom:'Class A theory proposal'};
}
export function instructorWeekPlan(start='07:00',end='16:00',breakMinutes=60){
 const days=CLASSROOM_WEEK_ONE.map(d=>instructorDayPlan(d.day,start,end,breakMinutes));
 return {days,plannedHours:days.reduce((sum,d)=>sum+d.plannedTeachingHours,0),
 availableHours:days.reduce((sum,d)=>sum+d.availableClockHours,0),
 unallocatedRequiredHours:Math.max(0,50-days.reduce((sum,d)=>sum+d.availableClockHours,0)),
 completeTopicCoverage:new Set(days.flatMap(d=>d.topicCodes)).size===CLASS_A_THEORY_TOPICS.length};
}
