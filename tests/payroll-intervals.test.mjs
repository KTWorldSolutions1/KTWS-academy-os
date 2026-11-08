import assert from 'node:assert/strict';
import {workIntervals,weeklyCampusMinutes} from '../lib/payroll-intervals.ts';
const iso=(date)=>date+'.000Z';
let rows=[
 {id:'a',action:'clock_in',campus_id:'greensboro',at:iso('2026-11-02T13:00:00')},
 {id:'b',action:'break_start',campus_id:'greensboro',at:iso('2026-11-02T17:00:00')},
 {id:'c',action:'break_end',campus_id:'greensboro',at:iso('2026-11-02T17:30:00')},
 {id:'d',action:'clock_out',campus_id:'greensboro',at:iso('2026-11-02T21:30:00')}
];
assert.equal(weeklyCampusMinutes(rows,'2026-11-02').totals.greensboro,480,'Eight-hour shift with unpaid 30-minute break');
assert.equal(workIntervals(rows).issues.length,0);
rows=[
 {id:'a',action:'clock_in',campus_id:'greensboro',at:iso('2026-11-08T23:00:00')},
 {id:'b',action:'clock_out',campus_id:'greensboro',at:iso('2026-11-09T07:00:00')}
];
assert.equal(weeklyCampusMinutes(rows,'2026-11-02').totals.greensboro,360,'Sunday-to-Monday shift apportions six hours to prior local week');
assert.equal(weeklyCampusMinutes(rows,'2026-11-09').totals.greensboro,120,'Sunday-to-Monday shift apportions two hours to new local week');
rows=[
 {id:'a',action:'clock_in',campus_id:'greensboro',at:iso('2026-11-02T14:00:00')},
 {id:'b',action:'clock_out',campus_id:'dallas',at:iso('2026-11-02T22:00:00')}
];
assert.equal(weeklyCampusMinutes(rows,'2026-11-02').totals.greensboro,480,'Always assign shift minutes to originating campus');
assert.ok(weeklyCampusMinutes(rows,'2026-11-02').issues.includes('Campus changed during shift'));
rows=[
 {id:'a',action:'clock_in',campus_id:'greensboro',at:iso('2026-11-01T04:00:00')},
 {id:'b',action:'clock_out',campus_id:'greensboro',at:iso('2026-11-01T09:00:00')}
];
assert.equal(weeklyCampusMinutes(rows,'2026-10-26').totals.greensboro,300,'DST fall-back week ends at correct Eastern time, not fixed offset');
assert.equal(weeklyCampusMinutes(rows,'2026-11-02').totals.greensboro,undefined);
console.log('PASS: campus payroll attribution, breaks, week boundary and daylight saving rollover.');
