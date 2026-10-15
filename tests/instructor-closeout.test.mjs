import assert from 'node:assert/strict';
import {instructorDailyCloseout} from '../lib/instructor-closeout.ts';
const day='2026-10-15';
const campus='Greensboro';
const records=[
 {id:'g',kind:'campuses',name:campus,status:'Active'},
 {id:'t',kind:'campuses',name:'Dallas',status:'Active'},
 {id:'i',kind:'staff',name:'Fictional Instructor',status:'Active',accessRole:'Instructor',campusIds:['g']},
 {id:'s1',kind:'students',campusId:'g',name:'Training Student A',status:'Road',sessions:[{id:'entry',date:day,phase:'Road',attendance:'Present',hours:2,instructor:'Fictional Instructor',start:'09:00',end:'11:00'}]},
 {id:'s2',kind:'students',campusId:'g',name:'Training Student B',status:'Yard',sessions:[]},
 {id:'s3',kind:'students',campusId:'t',name:'Private Dallas Student',status:'Yard',sessions:[]},
 {id:'l1',kind:'training-assignments',campusId:'g',studentId:'s1',employeeId:'i',name:'Fictional road session',status:'Confirmed',date:day,phase:'Road',start:'09:00',end:'11:00'},
 {id:'l2',kind:'training-assignments',campusId:'g',studentId:'s2',employeeId:'i',name:'Fictional yard session',status:'Planned',date:day,phase:'Yard',start:'12:00',end:'14:00'},
 {id:'l3',kind:'training-assignments',campusId:'t',studentId:'s3',employeeId:'i',name:'Other campus lesson',status:'Planned',date:day,phase:'Yard',start:'13:00',end:'15:00'},
 {id:'v1',kind:'fleet',campusId:'g',name:'Truck A',status:'Out of service'},
 {id:'v2',kind:'fleet',campusId:'t',name:'Truck B',status:'Out of service'},
 {id:'d1',kind:'vehicle-checks',campusId:'g',name:'Tire report',unitId:'v1',status:'Defect reported',date:day,notes:'Fictional tire damage'},
 {id:'d2',kind:'vehicle-checks',campusId:'t',name:'Brakes report',unitId:'v2',status:'Defect reported',date:day,notes:'Fictional brake damage'}
];
const summary=instructorDailyCloseout(records,'g',day);
assert.equal(summary.planned,2);
assert.equal(summary.withTrainingEvidence,1);
assert.equal(summary.withoutTrainingEvidence,1);
assert.equal(summary.recordedStudents,1);
assert.equal(summary.vehicleHolds,1);
assert.ok(summary.checks.some(x=>x.id==='lesson-unreviewed-l2'&&x.detail.includes('does not mean absent')));
assert.ok(summary.checks.some(x=>x.id==='lesson-recorded-l1'));
assert.ok(!JSON.stringify(summary).includes('Private Dallas Student'));
assert.ok(!summary.checks.some(x=>x.id==='hold-d2'));
const onlyOne=instructorDailyCloseout(records,'g',day,'i');
assert.equal(onlyOne.planned,2);
assert.equal(instructorDailyCloseout(records,'g','2026-10-16').planned,0);
assert.equal(records.find(r=>r.id==='s2').sessions.length,0,'Read-only checks must not create attendance');
const fixed=instructorDailyCloseout([...records,{id:'repair',kind:'vehicle-checks',campusId:'g',unitId:'v1',name:'Repaired',status:'Cleared',defectId:'d1',date:day}], 'g',day);
assert.equal(fixed.vehicleHolds,0);
console.log('PASS: daily review checks recorded training without inventing attendance, filters campuses, and clears repaired truck reminders.');
