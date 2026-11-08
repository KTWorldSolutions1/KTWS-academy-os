import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {calculateStudentLedger,creditedPayment,manualReversalIssue,chargeVoidIssue} from '../lib/student-payments.ts';
const sql=readFileSync(new URL('../cloudflare/schema.sql',import.meta.url),'utf8');
const db=new DatabaseSync(':memory:');db.exec(sql);
const d='2026-11-08T13:00:00Z';
const charge={id:'charge-test',student:'fictional-nimmons',campus:'greensboro',amount_cents:300000,description:'Class A tuition',category:'Tuition',due_date:'2026-11-16',status:'Open'};
const payment={id:'receipt-test',student:charge.student,campus:charge.campus,charge_id:charge.id,provider:'Cash',source:'Manual',amount_cents:120000,refunded_cents:0,disputed_cents:0,status:'Confirmed',created:d,created_by:'manager@example.test'};
assert.equal(calculateStudentLedger([charge],[payment]).paid_cents,120000);
assert.equal(manualReversalIssue(payment,'Test entry recorded in error, no real funds received.'),null);
assert.match(manualReversalIssue({...payment,source:'Stripe'},'Test entry recorded in error, no real funds received.'),/Stripe/);
assert.match(manualReversalIssue({...payment,status:'Pending'},'Test entry recorded in error, no real funds received.'),/confirmed manual/);
assert.match(manualReversalIssue(payment,'test'),/reason/);
const paymentInsert=db.prepare("INSERT INTO billing_payments(id,owner,campus,student,charge_id,provider,source,amount_cents,status,external_ref,notes,created,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)");
db.prepare("INSERT INTO billing_charges(id,owner,campus,student,amount_cents,description,category,due_date,status,created,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
 .run(charge.id,'academy-owner',charge.campus,charge.student,charge.amount_cents,charge.description,charge.category,charge.due_date,'Open',d,'owner@example.test');
paymentInsert.run(payment.id,'academy-owner',payment.campus,payment.student,payment.charge_id,payment.provider,payment.source,payment.amount_cents,payment.status,'TEST-123','',d,payment.created_by);
db.prepare("INSERT INTO billing_payment_reversals(id,owner,campus,student,payment_id,charge_id,reason,reversed_by,reversed_at) VALUES(?,?,?,?,?,?,?,?,?)")
 .run('reversal-one','academy-owner',charge.campus,charge.student,payment.id,charge.id,'Incorrect test receipt; no funds were received','owner@example.test',d);
const joined=db.prepare("SELECT p.*,CASE WHEN v.id IS NOT NULL THEN 1 ELSE 0 END AS voided FROM billing_payments p LEFT JOIN billing_payment_reversals v ON v.payment_id=p.id WHERE p.id=?").get(payment.id);
assert.equal(joined.voided,1);
assert.equal(creditedPayment(joined),0,'Reversed receipt must no longer credit a real student balance');
assert.equal(calculateStudentLedger([charge],[joined]).outstanding_cents,300000);
assert.throws(()=>db.prepare("INSERT INTO billing_payment_reversals(id,owner,campus,student,payment_id,charge_id,reason,reversed_by,reversed_at) VALUES(?,?,?,?,?,?,?,?,?)")
 .run('duplicate','academy-owner',charge.campus,charge.student,payment.id,charge.id,'repeat','owner@example.test',d),/UNIQUE/);
assert.equal(db.prepare("SELECT status FROM billing_payments WHERE id=?").get(payment.id).status,'Confirmed','Original receipt remains unchanged');
assert.match(chargeVoidIssue(charge,[payment],0,'This charge was a sample entry and should be removed.'),/credited/);
assert.equal(chargeVoidIssue(charge,[joined],0,'This charge was a sample entry and should be removed.'),null);
assert.match(chargeVoidIssue(charge,[joined],1,'This charge was a sample entry and should be removed.'),/Stripe/);
db.prepare("UPDATE billing_charges SET status='Voided' WHERE id=?").run(charge.id);
db.prepare("INSERT INTO billing_charge_voids(id,owner,campus,student,charge_id,reason,voided_by,voided_at) VALUES(?,?,?,?,?,?,?,?)")
 .run('void-one','academy-owner',charge.campus,charge.student,charge.id,'Erroneous training demonstration charge','owner@example.test',d);
assert.equal(calculateStudentLedger([],[joined]).outstanding_cents,0,'Voided test charge is excluded from active tuition');
assert.equal(db.prepare("SELECT status FROM billing_charges WHERE id=?").get(charge.id).status,'Voided');
const endpoint=readFileSync(new URL('../app/api/billing/route.ts',import.meta.url),'utf8');
const ui=readFileSync(new URL('../app/student-payment-center.tsx',import.meta.url),'utf8');
assert.ok(endpoint.includes("action==='reverse-manual'")&&endpoint.includes("if(!manager)"),'Reversal requires campus management access');
assert.ok(endpoint.includes("p.source='Manual'")||endpoint.includes("source='Manual'"),'Manual-only reversal guard');
assert.ok(endpoint.includes('REVERSE INCORRECT MANUAL PAYMENT'));
assert.ok(endpoint.includes('VOID INCORRECT CHARGE'));
assert.ok(ui.includes('Reverse incorrect payment')&&ui.includes('Confirm charge void'));
assert.ok(endpoint.includes('billing_payment_reversals')&&endpoint.includes('billing_charge_voids'));
console.log('PASS: manual test payment reversed without erasure, balance restored, audited charge void and owner safety boundaries.');
db.close();
