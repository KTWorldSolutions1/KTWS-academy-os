/**
 * Proposed Greensboro Class A cadence. Planned/DMV/actual time stay separate.
 * Standard 160-hour course: 50 classroom (including qualifying school tests),
 * 50 field, 20 highway BTW and 40 highway observation.
 * Offsite DMV permit testing and celebrations never automatically count toward instructional hours.
 */
export const GREENSBORO_CLASS_A_CADENCE = {
 id: 'gso-class-a-40-8-2-permit-buffer',
 title:'Greensboro Class A — classroom bridge and yard preparation',
 status:'Management-proposed schedule — subject to school approval and recorded instructional evidence',
 requiredHours:{classroom:50,field:50,highwayDriving:20,highwayObservation:40},
 stages:[
  {calendarWeek:1,label:'Classroom foundation',days:'Monday–Friday',schoolHours:40,dmvHours:0,notes:'07:00–16:00, 60-minute noninstructional break each day; actual attendance required'},
  {calendarWeek:2,label:'Classroom completion',days:'Monday',schoolHours:8,dmvHours:0,notes:'Final teaching, guided HOS/ELD/atlas exercises, remediation, approved theory assessment'},
  {calendarWeek:2,label:'DMV permit testing, return to campus for 2-hour lesson and celebrate',days:'Tuesday',schoolHours:2,dmvHours:0,notes:'DMV in morning (appointment length varies). Return to campus for an instructor-led 2-hour classroom lesson or school assessment, record real attendance and content, then celebrate. DMV and celebration time do not earn classroom credit.'},
  {calendarWeek:2,label:'Student release / staff preparation',days:'Wednesday–Friday',schoolHours:0,dmvHours:0,notes:'No invented student hours; yard setup, truck inspection, instructor planning, permit follow-up'},
  {calendarWeek:3,label:'Range / pretrip / backing',days:'Monday–Friday',schoolHours:0,dmvHours:0,notes:'Record actual field instruction hours only, subject to permit and safety gates'},
  {calendarWeek:4,label:'Range and highway practice',days:'Monday–Friday',schoolHours:0,dmvHours:0,notes:'Track field, highway driving and highway observation separately'},
  {calendarWeek:5,label:'Road proficiency, completion and testing',days:'Monday–Friday',schoolHours:0,dmvHours:0,notes:'Complete remaining required categories and testing; do not guarantee exam dates'}
 ] as const
} as const;
/** Split 25 existing two-hour instructional blocks into the actual 40+8+2
 * Greensboro calendar. A planned block is not a completed teaching session. */
import {CLASSROOM_WEEK_ONE,CLASS_A_THEORY_TOPICS} from './classroom-curriculum.ts';
export const GREENSBORO_CLASSROOM_DAYS = [
 {index:1,calendarWeek:1,label:'Week 1 · Monday',hours:8},
 {index:2,calendarWeek:1,label:'Week 1 · Tuesday',hours:8},
 {index:3,calendarWeek:1,label:'Week 1 · Wednesday',hours:8},
 {index:4,calendarWeek:1,label:'Week 1 · Thursday',hours:8},
 {index:5,calendarWeek:1,label:'Week 1 · Friday',hours:8},
 {index:6,calendarWeek:2,label:'Week 2 · Monday',hours:8},
 {index:7,calendarWeek:2,label:'Week 2 · Tuesday · after DMV',hours:2}
] as const;
export function greensboroClassroomTeachingDays(){
 const blocks=CLASSROOM_WEEK_ONE.flatMap(day=>day.blocks.map(block=>({
  ...block,sourceDay:day.day,
  topicCodes:CLASS_A_THEORY_TOPICS.filter(t=>t.day===day.day).map(t=>t.code)
 })));
 let pointer=0;
 const days=GREENSBORO_CLASSROOM_DAYS.map(day=>{
  const count=day.hours/2;
  const assigned=blocks.slice(pointer,pointer+count).map((block,i)=>({
   ...block,
   proposedTime:day.index===7?'After DMV — set actual two-hour start/end':String(7+i*2+(i>=2?1:0)).padStart(2,'0')+':00–'+String(9+i*2+(i>=4?1:0)).padStart(2,'0')+':00'
  }));
  pointer+=count;
  return {...day,blocks:assigned};
 });
 if(pointer!==blocks.length)throw Error('The 50-hour Class A lesson content does not match the Greensboro calendar.');
 return days;
}
export type ClassroomEvidence={date:string;category:'Classroom instruction'|'School theory test'|'DMV permit test'|'Break'|'Off';minutes:number;verified:boolean};
export function qualifyingClassroomMinutes(events:ReadonlyArray<ClassroomEvidence>){
 return events.filter(e=>e.verified&&(e.category==='Classroom instruction'||e.category==='School theory test'))
 .reduce((sum,e)=>sum+Math.max(0,Number.isFinite(e.minutes)?e.minutes:0),0);
}
export function classroomBridgeStatus(events:ReadonlyArray<ClassroomEvidence>){
 const countedMinutes=qualifyingClassroomMinutes(events);
 return {countedHours:countedMinutes/60,remainingHours:Math.max(0,(3000-countedMinutes)/60),readyForClassroomSignoff:countedMinutes>=3000,
 excludedDmvHours:events.filter(e=>e.category==='DMV permit test').reduce((n,e)=>n+Math.max(0,e.minutes||0),0)/60};
}
