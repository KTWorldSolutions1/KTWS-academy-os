import assert from 'node:assert/strict';
import {attendanceRoster,attendancePhase,attendanceForDay} from '../lib/attendance.ts';
import {weekDates,weekStart,plannedPaidHours} from '../lib/staff-scheduling.ts';
import {cleanMessageTemplate,expandMessageTemplate,MESSAGE_TEMPLATES} from '../lib/student-messaging.ts';
const classroomStudents=[
 {kind:'students',id:'a',name:'Sample One',status:'Enrolled',sessions:[],reportedClassroomHours:40},
 {kind:'students',id:'b',name:'Sample Two',status:'Waiting for permit',sessions:[],reportedClassroomHours:40},
 {kind:'students',id:'c',name:'Sample Three',status:'Enrollment pending',sessions:[]},
 {kind:'students',id:'d',name:'Sample Four',status:'Classroom',sessions:[]},
 {kind:'students',id:'e',name:'Sample Five',status:'Yard',sessions:[]},
 {kind:'students',id:'f',name:'Sample Six',status:'Graduated',sessions:[]}
];
assert.deepEqual(attendanceRoster(classroomStudents,'Classroom').map(x=>x.id),['a','b','c','d']);
assert.deepEqual(attendanceRoster(classroomStudents,'All students').map(x=>x.id),['a','b','c','d','e']);
assert.equal(attendancePhase(classroomStudents[1],'All students'),'Classroom');
assert.equal(attendanceForDay(classroomStudents[1],'2026-11-02'),'Not recorded','Reported planning hours must not create attendance evidence');
assert.equal(weekStart('2026-11-07'),'2026-11-02');
assert.equal(weekDates('2026-11-02').length,7);
assert.equal(plannedPaidHours([{kind:'shifts',id:'s1',employeeId:'s',date:'2026-11-02',status:'Approved',start:'08:00',end:'17:00',breakMinutes:60}], 's', '2026-11-02'),8);
assert.ok(MESSAGE_TEMPLATES.some(x=>x.channel==='Email')&&MESSAGE_TEMPLATES.some(x=>x.channel==='SMS'));
assert.equal(expandMessageTemplate('Hi {{firstName}}.',{name:'Sample Learner'},undefined),'Hi Sample.');
assert.ok(!cleanMessageTemplate('Hi {{driverLicense}}').includes('driverLicense'));
console.log('PASS: classroom permit-waiting rosters, weekly staff schedule totals, and safe messaging templates.');
