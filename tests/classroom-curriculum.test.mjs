import assert from 'node:assert/strict';
import {CLASS_A_THEORY_TOPICS,CLASSROOM_WEEK_ONE,CLASSROOM_HOURS_TARGET,createClassroomWeekPlans,suggestedClassroomHours,theoryTopicGaps} from '../lib/classroom-curriculum.ts';

assert.equal(CLASS_A_THEORY_TOPICS.length,30,'Class A standard ELDT must cover 30 subjects');
assert.equal(new Set(CLASS_A_THEORY_TOPICS.map(t=>t.code)).size,30,'No repeated federal unit');
assert.equal(theoryTopicGaps().length,0,'No orphan federal subject');
assert.equal(CLASSROOM_WEEK_ONE.length,5);
assert.equal(suggestedClassroomHours(),CLASSROOM_HOURS_TARGET);
for(const day of CLASSROOM_WEEK_ONE){
 assert.equal(day.blocks.length,5,'Each day needs five teaching blocks');
 assert.equal(day.blocks.reduce((sum,b)=>sum+b.hours,0),10,'Daily planning time is ten net hours');
 assert.equal(CLASS_A_THEORY_TOPICS.some(t=>t.day===day.day),true,'Each day must cover federal theory');
}
const scoped=createClassroomWeekPlans([], 'campus-1', 'Instructor');
assert.equal(scoped.length,5);
assert.ok(scoped.every(p=>p.kind==='lessons'&&p.status==='Planned'&&p.campusId==='campus-1'&&p.phase==='Classroom'));
assert.deepEqual(scoped.flatMap(p=>p.topicCodes).sort(),CLASS_A_THEORY_TOPICS.map(t=>t.code).sort());
assert.equal(createClassroomWeekPlans(scoped,'campus-1').length,0,'Seeding same campus twice must not overwrite plans');
assert.equal(createClassroomWeekPlans(scoped,'campus-2').length,5,'Other campuses retain independent lesson plans');
assert.throws(()=>createClassroomWeekPlans([],''),/Choose an actual campus/);
assert.ok(scoped.every(p=>Object.keys(p.jjKellerModuleMap).length===0&&p.jjKellerMappingVerified===false),'Never pretend to know licensed vendor mapping or mark it verified');
console.log('Week 1 Class A curriculum checks passed');
