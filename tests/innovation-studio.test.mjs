import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {innovationCounts,simulatedTime,phaseOf} from '../lib/innovation-analytics.ts';
import {moduleAllowed} from '../lib/roles.ts';
import {sectionForPage} from '../lib/simple-navigation.ts';
const source=readFileSync(new URL('../app/innovation-studio.tsx',import.meta.url),'utf8');
assert.equal(sectionForPage('innovation-studio')?.label,'Dashboard & Reports');
for(const role of ['Owner','Regional admin','Campus manager'])assert.equal(moduleAllowed(role,'innovation-studio'),true,role+' may use protected innovation tools');
for(const role of ['Front desk','Instructor','Enrollment specialist','Admin assistant'])assert.equal(moduleAllowed(role,'innovation-studio'),false,role+' must not see manager-wide readout');
assert.ok(source.includes('SAFE SIMULATION ONLY'),'Payroll sandbox must distinguish simulated from real records');
assert.ok(source.includes('PREVIEW MODE'),'Automation templates cannot imply that they execute');
assert.ok(!source.includes("fetch('/api/timeclock'"),'Sandbox must never call live clock endpoint');
assert.ok(!source.includes("fetch('/api/records'"),'Sandbox must never write training records');
let events=[];
assert.deepEqual(simulatedTime(events,480),{state:'out',paid:0,breaks:0});
events=[{action:'clock_in',minute:480}];
assert.deepEqual(simulatedTime(events,540),{state:'working',paid:60,breaks:0});
events.push({action:'break_start',minute:540});
assert.deepEqual(simulatedTime(events,555),{state:'break',paid:60,breaks:15});
events.push({action:'break_end',minute:570},{action:'clock_out',minute:660});
assert.deepEqual(simulatedTime(events,800),{state:'out',paid:150,breaks:30});
const rows=[
 {id:'g',kind:'campuses',name:'Greensboro',status:'Active'},
 {id:'p',kind:'students',name:'Fiction Student',status:'Classroom',campusId:'g'},
 {id:'q',kind:'students',name:'Fiction Graduate',status:'Graduated',licenseNumber:'SAMPLE'},
 {id:'l',kind:'leads',name:'Fiction Lead',status:'New'},
 {id:'f',kind:'fleet',name:'Truck'},
 {id:'t',kind:'tpr',status:'Review pending'},
 {id:'c',kind:'staff-credentials',expiry:'2025-01-01',status:'Active'}
];
const counts=innovationCounts(rows,'2026-11-08');
assert.equal(counts.clpWaiting.length,1);
assert.equal(counts.missingTprCampus.length,1);
assert.equal(counts.pendingTpr.length,1);
assert.equal(counts.expiredCredentials.length,1);
assert.equal(phaseOf(rows[1]),1);assert.equal(phaseOf(rows[2]),5);
console.log('PASS: isolated time clock, student stage, compliance counters, role navigation and preview-only automations.');
