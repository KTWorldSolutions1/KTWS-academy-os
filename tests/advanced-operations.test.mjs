import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,createPublicKey,webcrypto} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {reviewCandidates} from '../lib/scheduled-workflows.ts';
import {overtimeEstimate} from '../lib/payroll-overtime.ts';
import {trainingBody,validateTrainingForm,signedJwt} from '../lib/fmcsa-tpr-webservice.ts';
const schema=readFileSync(new URL('../cloudflare/schema.sql',import.meta.url),'utf8');
const db=new DatabaseSync(':memory:');db.exec(schema);
for(const name of ['employee_punch_corrections','academy_workflow_rules','academy_workflow_runs','tpr_webservice_submissions'])assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name=?").get(name));
db.close();
const rows=[
 {kind:'students',id:'s',campusId:'g',status:'Classroom'},
 {kind:'tpr',id:'t',campusId:'g',status:'Review pending'},
 {kind:'leads',id:'l',campusId:'g',status:'New',followUp:'2026-11-01'},
 {kind:'fleet',id:'f',campusId:'g',status:'Out of service'},
 {kind:'students',id:'other',campusId:'d',status:'Classroom'}
];
assert.equal(reviewCandidates('permit','g',rows,'2026-11-08').length,1);
assert.equal(reviewCandidates('tpr','g',rows,'2026-11-08').length,1);
assert.equal(reviewCandidates('admissions','g',rows,'2026-11-08').length,1);
assert.equal(reviewCandidates('fleet','g',rows,'2026-11-08').length,1);
const time=(s)=>s+'.000Z';
const punches=[{action:'clock_in',at:time('2026-11-02T13:00:00'),campus_id:'g'},{action:'clock_out',at:time('2026-11-06T21:00:00'),campus_id:'g'}];
const estimate=overtimeEstimate(punches,'2026-11-02',{g:2000});
assert.equal(estimate.totalHours,104);
assert.equal(estimate.overtimeHours,64);
assert.equal(estimate.byCampus.g.regularMinutes,2400);
assert.equal(estimate.byCampus.g.grossCents,272000);
const missing=overtimeEstimate(punches,'2026-11-02',{});
assert.ok(missing.missingRateCampuses.includes('g'));
const payload={firstName:'Alex',lastName:'Example',number:'S123456',state:'NC',dateOfBirth:'1997-04-19',
 classCode:'A',applicationType:'New',trainingType:'Theory',completionDate:'2026-11-06',trainingMethod:'Inperson',score:95};
const location='cc1d6ad9-f83c-4257-8e23-b1369ee09e8f';
assert.equal(validateTrainingForm(payload,location),null);
assert.equal(trainingBody(payload,location,'sample').TrainingElements[0].Score,95);
assert.equal(validateTrainingForm({...payload,score:79},location).includes('Theory'),true);
const pair=generateKeyPairSync('rsa',{modulusLength:2048});
const token=await signedJwt('test-issuer',pair.privateKey.export({format:'pem',type:'pkcs8'}),'1783600000'*1);
const parts=token.split('.');assert.equal(parts.length,3);
const tokenPayload=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));assert.equal(tokenPayload.iss,'test-issuer');assert.equal(tokenPayload.exp-tokenPayload.nbf,600);
const key=await webcrypto.subtle.importKey('spki',pair.publicKey.export({format:'der',type:'spki'}),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
assert.equal(await webcrypto.subtle.verify('RSASSA-PKCS1-v1_5',key,Buffer.from(parts[2],'base64url'),new TextEncoder().encode(parts[0]+'.'+parts[1])),true);
console.log('PASS: scheduled review candidates, correction and TPR persistence, RS256 signed transport and provisional overtime.');
