import assert from 'node:assert/strict';
import {attendanceRoster,attendancePhase,attendanceForDay} from '../lib/attendance.ts';
import {weekDates,weekStart,plannedPaidHours} from '../lib/staff-scheduling.ts';
import {yardEntryReadiness,promoteEligibleStudent} from '../lib/yard-promotion.ts';
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

const evidence=(category)=>({category,key:'encrypted-object-'+category,verified:true});
const validSessions=Array.from({length:5},(_,i)=>({id:'session-'+i,date:'2026-11-0'+(i+2),phase:'Classroom',hours:10,attendance:'Present',mode:'Instruction',instructor:'Instructor',start:'08:00',end:'18:00'}));
const ready={kind:'students',name:'Fictional Student',status:'Waiting for permit',campusId:'c',sessions:validSessions,documents:[evidence('Commercial learner permit'),evidence('Drug screen result')],yardClearance:'Cleared'};
assert.equal(yardEntryReadiness(ready).ready,true);
assert.equal(promoteEligibleStudent(ready,'2026-11-07T12:00:00Z','school@example.com').status,'Yard');
assert.equal(promoteEligibleStudent({...ready,sessions:[],reportedClassroomHours:50},'2026-11-07T12:00:00Z','school@example.com').status,'Waiting for permit','Reported hours do not trigger graduation to Yard');
assert.equal(promoteEligibleStudent({...ready,documents:[]},'2026-11-07T12:00:00Z','school@example.com').status,'Waiting for permit','A document needs secure uploaded and verified evidence');
assert.equal(promoteEligibleStudent({...ready,yardClearance:''},'2026-11-07T12:00:00Z','school@example.com').status,'Waiting for permit','An unclear drug-screen result blocks yard transition');
assert.equal(promoteEligibleStudent({...ready,status:'Road'},'2026-11-07T12:00:00Z','school@example.com').status,'Road','Do not change advanced statuses retroactively');
console.log('PASS: gated automatic classroom-to-yard transition requires genuine hours, verified permit, verified drug screen and administrative clearance.');

const {availableSchoolSections}=await import('../lib/simple-navigation.ts');
const campusConnections=availableSchoolSections('Campus manager').find(x=>x.id==='school');
assert.ok(campusConnections,'Campus manager must have Settings & Connections section');
assert.ok(campusConnections.pages.some(x=>x.id==='integrations'),'Campus manager must see integrations setup and owner-only connection notice');
assert.ok(campusConnections.pages.some(x=>x.id==='settings'),'Campus manager must be able to reach school details');
console.log('PASS: Settings & Connections has navigable pages for a campus manager.');
