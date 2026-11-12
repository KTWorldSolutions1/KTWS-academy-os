import assert from 'node:assert/strict';
import {GREENSBORO_CLASS_A_CADENCE,qualifyingClassroomMinutes,classroomBridgeStatus,greensboroClassroomTeachingDays} from '../lib/greensboro-class-a-cadence.ts';
const plannedDays=greensboroClassroomTeachingDays();
assert.equal(plannedDays.length,7);
assert.deepEqual(plannedDays.map(d=>d.hours),[8,8,8,8,8,8,2]);
assert.equal(plannedDays.flatMap(d=>d.blocks).length,25);
assert.equal(plannedDays[0].blocks[2].proposedTime,'12:00–14:00');
assert.equal(plannedDays[6].blocks[0].proposedTime,'After DMV — set actual two-hour start/end');
assert.equal(GREENSBORO_CLASS_A_CADENCE.stages.reduce((n,s)=>n+s.schoolHours,0),50);
assert.equal(GREENSBORO_CLASS_A_CADENCE.stages.filter(s=>s.calendarWeek===2).reduce((n,s)=>n+s.schoolHours,0),10);
assert.ok(GREENSBORO_CLASS_A_CADENCE.stages.some(s=>s.days==='Wednesday–Friday'&&s.schoolHours===0));
const entries=[
 {date:'2026-11-16',category:'Classroom instruction',minutes:2400,verified:true},
 {date:'2026-11-23',category:'Classroom instruction',minutes:480,verified:true},
 {date:'2026-11-24',category:'DMV permit test',minutes:120,verified:true}
];
assert.equal(qualifyingClassroomMinutes(entries),2880);
assert.equal(classroomBridgeStatus(entries).remainingHours,2);
assert.equal(classroomBridgeStatus(entries).readyForClassroomSignoff,false);
const complete=[...entries,{date:'2026-11-24',category:'School theory test',minutes:120,verified:true}];
assert.equal(classroomBridgeStatus(complete).countedHours,50);
assert.equal(classroomBridgeStatus(complete).excludedDmvHours,2);
assert.equal(classroomBridgeStatus(complete).readyForClassroomSignoff,true);
assert.equal(classroomBridgeStatus([...entries,{date:'2026-11-24',category:'School theory test',minutes:120,verified:false}]).readyForClassroomSignoff,false);
console.log('PASS: Greensboro 40+8+2 cadence keeps DMV testing, breaks and undocumented time out of school classroom hours.');
