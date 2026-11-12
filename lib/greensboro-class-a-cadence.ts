/**
 * Proposed Greensboro Class A cadence. Planned/DMV/actual time stay separate.
 * Standard 160-hour course: 50 classroom (including qualifying school tests),
 * 50 field, 20 highway BTW and 40 highway observation.
 * Never count offsite DMV permit testing as instruction without written approval.
 */
export const GREENSBORO_CLASS_A_CADENCE = {
 id: 'gso-class-a-40-8-2-permit-buffer',
 title:'Greensboro Class A — classroom bridge and yard preparation',
 status:'Proposed — management and NCDMV hour-classification review required',
 requiredHours:{classroom:50,field:50,highwayDriving:20,highwayObservation:40},
 stages:[
  {calendarWeek:1,label:'Classroom foundation',days:'Monday–Friday',schoolHours:40,dmvHours:0,notes:'07:00–16:00, 60-minute noninstructional break each day; actual attendance required'},
  {calendarWeek:2,label:'Classroom completion',days:'Monday',schoolHours:8,dmvHours:0,notes:'Final teaching, guided HOS/ELD/atlas exercises, remediation, approved theory assessment'},
  {calendarWeek:2,label:'Final school assessment and DMV permit testing',days:'Tuesday',schoolHours:2,dmvHours:2,notes:'Schedule two separate actual school instructional/testing hours and a DMV appointment. DMV time never auto-counts.'},
  {calendarWeek:2,label:'Student release / staff preparation',days:'Wednesday–Friday',schoolHours:0,dmvHours:0,notes:'No invented student hours; yard setup, truck inspection, instructor planning, permit follow-up'},
  {calendarWeek:3,label:'Range / pretrip / backing',days:'Monday–Friday',schoolHours:0,dmvHours:0,notes:'Record actual field instruction hours only, subject to permit and safety gates'},
  {calendarWeek:4,label:'Range and highway practice',days:'Monday–Friday',schoolHours:0,dmvHours:0,notes:'Track field, highway driving and highway observation separately'},
  {calendarWeek:5,label:'Road proficiency, completion and testing',days:'Monday–Friday',schoolHours:0,dmvHours:0,notes:'Complete remaining required categories and testing; do not guarantee exam dates'}
 ] as const
} as const;
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
