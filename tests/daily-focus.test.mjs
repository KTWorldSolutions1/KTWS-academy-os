import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dailyFocusItems,dailyFocusCounts} from '../lib/daily-focus.ts';
const date='2026-10-14';
const records=[
 {id:'student1',kind:'students',name:'Fictional Student One',status:'Yard',campusId:'gso',sessions:[]},
 {id:'student2',kind:'students',name:'Fictional Student Two',status:'Road',campusId:'gso',sessions:[{id:'s1',date,attendance:'Present',phase:'Road',hours:2}]},
 {id:'student3',kind:'students',name:'Fictional Graduate',status:'Graduated',campusId:'gso',sessions:[]},
 {id:'lead1',kind:'leads',name:'Fictional Prospect',status:'Contacted',campusId:'gso',followUp:'2026-10-13'},
 {id:'lead2',kind:'leads',name:'Closed Prospect',status:'Closed',campusId:'gso',followUp:'2026-10-01'},
 {id:'task1',kind:'tasks',name:'Check program supply order',status:'Open',priority:'High',campusId:'gso',due:date},
 {id:'task2',kind:'tasks',name:'Completed action',status:'Complete',campusId:'gso',due:date},
 {id:'appointment1',kind:'appointments',name:'Fictional campus tour',status:'Scheduled',type:'Tour',campusId:'gso',date,start:'11:00'},
 {id:'fleet1',kind:'fleet',name:'Training truck 01',status:'Out of service',campusId:'gso'},
 {id:'class1',kind:'classes',name:'Next class',status:'Open for enrollment',campusId:'gso',startDate:'2026-10-19'}
];
const manager=dailyFocusItems(records,'Campus manager',date);
assert.ok(manager.some(x=>x.id==='lead-lead1'&&x.urgency==='now'));
assert.ok(manager.some(x=>x.id==='attendance-student1'&&x.urgency==='review'));
assert.equal(manager.some(x=>x.id==='attendance-student2'),false,'Recorded attendance is not flagged as missing');
assert.equal(manager.some(x=>x.id==='attendance-student3'),false,'Graduates not flagged');
assert.ok(manager.some(x=>x.id==='fleet-fleet1'));
assert.ok(manager.some(x=>x.id==='cohort-class1'));
assert.ok(manager.some(x=>x.id==='task-task1'));
assert.equal(manager.some(x=>x.id==='task-task2'),false);
assert.ok(manager.some(x=>x.id==='visit-appointment1'));
assert.ok(manager.every(x=>['now','soon','review'].includes(x.urgency)));
const totals=dailyFocusCounts(manager);
assert.equal(totals.urgent+totals.today+totals.reviews,manager.length);
const instructor=dailyFocusItems(records,'Instructor',date);
assert.ok(instructor.some(x=>x.id==='attendance-student1'));
assert.ok(instructor.every(x=>!x.id.startsWith('lead-')&&!x.id.startsWith('visit-')&&!x.id.startsWith('fleet-')));
const front=dailyFocusItems(records,'Front desk',date);
assert.equal(front.some(x=>x.id==='attendance-student1'),false,'Front desk cannot access instructor attendance');
assert.ok(front.some(x=>x.id==='lead-lead1'));
assert.equal(dailyFocusItems(records,'Instructor','2026-10-17').some(x=>x.id.startsWith('attendance-')),false,'No attendance gap automatically inferred on weekends');
const page=readFileSync('index.html','utf8');
assert.match(page,/viewport-fit=cover/);
assert.match(page,/manifest.webmanifest/);
const manifest=JSON.parse(readFileSync('public/manifest.webmanifest','utf8'));
assert.equal(manifest.display,'standalone');
assert.ok(!('service_worker' in manifest),'Never silently enable offline storage of student data');
console.log('PASS: school daily focus is honest, staff-role scoped, and mobile app metadata does not cache private records offline.');
