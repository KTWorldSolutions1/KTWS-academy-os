import assert from 'node:assert/strict';
import {studentOperationalFlags} from '../lib/academy-scenarios.ts';
const student={id:'s1',kind:'students',status:'Road',sessions:[],assessments:[]};
assert.ok(studentOperationalFlags(student,'2026-10-14').some(f=>f.code==='ATTENDANCE_MISSING'));
assert.ok(!studentOperationalFlags(student,'2026-10-17').some(f=>f.code==='ATTENDANCE_MISSING'));
assert.equal(studentOperationalFlags({...student,status:'Graduated'},'2026-10-14').length,0);
console.log('Scenario tests passed');
