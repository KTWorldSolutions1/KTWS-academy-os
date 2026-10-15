import assert from 'node:assert/strict';
import {weeklyManagerBrief} from '../lib/manager-brief.ts';
const date='2026-10-14';
const records=[
 {id:'c1',kind:'campuses',name:'Greensboro',status:'Active'},
 {id:'s1',kind:'students',name:'Private Example Student',status:'Classroom',campusId:'c1',sessions:[],fundingStatus:'Pending authorization'},
 {id:'s2',kind:'students',name:'Graduated Private Person',status:'Graduated',campusId:'c1',sessions:[]},
 {id:'l1',kind:'leads',name:'Private Prospect',status:'New inquiry',campusId:'c1'},
 {id:'t1',kind:'tasks',name:'Follow-up',status:'Open',due:'2026-10-13',campusId:'c1'},
 {id:'e1',kind:'appointments',name:'Community resource fair',outreachEvent:true,date:'2026-10-20',status:'Scheduled',campusId:'c1'},
 {id:'f1',kind:'fleet',name:'Training truck',status:'Ready',campusId:'c1'},
 {id:'p1',kind:'partners',name:'Community employer',status:'Prospect',campusId:'c1'}
];
const data=weeklyManagerBrief(records,date);
assert.equal(data.stats.activeStudents,1);
assert.equal(data.stats.leads,1);
assert.equal(data.stats.pendingFunding,1);
assert.equal(data.stats.overdue,1);
assert.equal(data.stats.upcomingEvents,1);
assert.equal(data.stats.missingAttendance,1);
assert.match(data.text,/Hello Alisha and Manny/);
assert.match(data.text,/where additional coordination may be helpful/);
assert.match(data.text,/not classified as absent/);
for(const name of ['Private Example Student','Graduated Private Person','Private Prospect'])assert.ok(!data.text.includes(name));
assert.match(data.text,/Missing entries are not proof/);
const empty=weeklyManagerBrief([],date);assert.equal(empty.stats.activeStudents,0);assert.match(empty.text,/No active campus records/);
console.log('PASS: private-name exclusion, factual report counts, funding and attendance wording, overdue follow-ups and evidence caveats.');
