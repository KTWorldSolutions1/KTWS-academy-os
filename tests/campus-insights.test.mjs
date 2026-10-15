import assert from 'node:assert/strict';
import {campusInsights,combinedSchoolInsights} from '../lib/campus-insights.ts';
const date='2026-10-15';
const a={id:'gso',kind:'campuses',name:'Greensboro',status:'Active'};
const b={id:'mf',kind:'campuses',name:'Mansfield',status:'Active'};
const c={id:'dl',kind:'campuses',name:'Dallas',status:'Active'};
const rows=[
 a,b,c,
 {id:'lead1',kind:'leads',name:'Greensboro lead',status:'Contacted',campusId:'gso',followUp:'2026-10-12'},
 {id:'lead2',kind:'leads',name:'Greensboro new lead',status:'New inquiry',campusId:'gso',followUp:'2026-10-18'},
 {id:'lead3',kind:'leads',name:'Mansfield lead',status:'Enrolled',campusId:'mf'},
 {id:'student1',kind:'students',name:'Greensboro Trainee',campusId:'gso',status:'Classroom',program:'Class A',sourceLead:'lead1',classId:'classG',sessions:[]},
 {id:'student2',kind:'students',name:'Greensboro Graduate',campusId:'gso',status:'Graduated',career:{stage:'Placed',employer:'Fictional Trucking',startDate:date}},
 {id:'student3',kind:'students',name:'Mansfield Graduate',campusId:'mf',status:'Graduated',sourceLead:'lead3',career:{stage:'Not started'}},
 {id:'student4',kind:'students',name:'Dallas student',campusId:'dl',status:'Road',sessions:[{id:'attended',date,attendance:'Present',phase:'Road',hours:2}]},
 {id:'classG',kind:'classes',name:'Class A group',campusId:'gso',status:'Open for enrollment',startDate:'2026-10-19',capacity:4},
 {id:'truckG',kind:'fleet',name:'Truck A',campusId:'gso',status:'Ready'},
 {id:'truckB',kind:'fleet',name:'Truck B',campusId:'mf',status:'Ready'},
 {id:'truckC',kind:'fleet',name:'Truck C',campusId:'dl',status:'Out of service'},
 {id:'defectB',kind:'vehicle-checks',name:'Reported problem',campusId:'mf',unitId:'truckB',status:'Defect reported',date},
 {id:'sponsor',kind:'sponsorships',name:'Authorized agency',status:'Authorized',campusId:'gso',studentId:'student1',authorizedAmount:3000},
 {id:'finance',kind:'finance',name:'Tuition due',status:'Outstanding',campusId:'gso',amount:500}
];
const output=campusInsights(rows,date);
assert.equal(output.length,3);
const g=output.find(x=>x.campusId==='gso'),m=output.find(x=>x.campusId==='mf'),d=output.find(x=>x.campusId==='dl');
assert.deepEqual([g.leads,g.linkedEnrollments,g.conversionPct],[2,1,50]);
assert.equal(g.activeStudents,1);
assert.equal(g.openSeats,3);
assert.equal(g.graduated,1);
assert.equal(g.recordedPlacements,1);
assert.equal(g.placementPct,100);
assert.equal(g.followupsOverdue,1);
assert.equal(g.truckReady,1);
assert.equal(g.fundingApprovals,1);
assert.equal(g.authorizedFunding,3000);
assert.equal(g.outstandingLedger,500);
assert.equal(m.truckHolds,1);
assert.equal(m.truckReady,0);
assert.equal(m.linkedEnrollments,1);
assert.equal(m.placementPct,0);
assert.equal(d.leads,0);
assert.equal(d.conversionPct,null);
assert.equal(d.truckHolds,1);
assert.equal(d.activeStudents,1);
assert.equal(d.studentsWithAttendanceToday,1);
const all=combinedSchoolInsights(output);
assert.equal(all.leads,3);
assert.equal(all.linkedEnrollments,2);
assert.equal(all.conversionPct,66.7);
assert.equal(all.authorizedFunding,3000);
assert.equal(all.outstandingLedger,500);
const onlyGreensboro=campusInsights(rows.filter(x=>x.campusId==='gso'||x.id==='gso'),date);
assert.equal(onlyGreensboro.length,1);
assert.equal(onlyGreensboro[0].campusId,'gso');
const empty=combinedSchoolInsights([]);
assert.equal(empty.conversionPct,null);
assert.equal(empty.placementPct,null);
assert.equal(campusInsights(rows,'2026-10-18').find(x=>x.campusId==='gso').studentsWithAttendanceToday,0,'Sunday does not presume school attendance');
assert.equal(JSON.stringify(output).includes('Fictional Trucking'),false,'Aggregated management view contains no employer or student names');
console.log('PASS: honest multi-campus funnel denominators, linked enrollments, graduates, safe truck status, manual funding/tuition and role-scoped input.');
