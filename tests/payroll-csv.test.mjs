import assert from 'node:assert/strict';
import {payrollCsvCell} from '../lib/payroll-csv.ts';
assert.equal(payrollCsvCell('Sample "Name"'),'"Sample ""Name"""');
for(const input of ['=1+1',' +SUM(A1:A2)','\t@SUM(A1)','\r-1+1'])assert.ok(payrollCsvCell(input).startsWith('"\''));
assert.equal(payrollCsvCell(20.25),'"20.25"');
console.log('PASS: payroll CSV formulas escaped, quotes preserved and numbers retained.');
