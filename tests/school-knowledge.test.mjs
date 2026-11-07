import assert from 'node:assert/strict';
import {validateSchoolKnowledge,canViewSchoolKnowledge,schoolKnowledgeNeedsReview} from '../lib/school-knowledge.ts';
import {canWrite,canRead} from '../lib/workspace-access.ts';
import {availableSchoolSections} from '../lib/simple-navigation.ts';
import {DEMO_SCENES,DEMO_RUNTIME_SECONDS} from '../lib/presentation-demo.ts';
import {OPERATOR_STEPS} from '../lib/operator-demo.ts';

const row={id:'synthetic',kind:'school-knowledge',name:'Classroom emergency procedures',status:'Published',category:'Policies & procedures',audience:'All staff',campusId:'campus',body:'Instructors review attendance and notify campus management of any safety issue.',documentVersion:'1.0',effectiveDate:'2026-11-07',reviewDate:'2026-12-07',approvedBy:'Campus manager',ackRequired:false};
assert.equal(validateSchoolKnowledge(row),null);
assert.match(validateSchoolKnowledge({...row,externalUrl:'http://unencrypted.example/test'}),/HTTPS/);
assert.match(validateSchoolKnowledge({...row,body:'x'}),/summary or procedure/);
assert.match(validateSchoolKnowledge({...row,status:'Published',approvedBy:''}),/approval/);
assert.equal(canViewSchoolKnowledge('Instructor',row),true);
assert.equal(canViewSchoolKnowledge('Instructor',{...row,status:'Draft'}),false);
assert.equal(canViewSchoolKnowledge('Enrollment specialist',{...row,audience:'Instructors'}),false);
assert.equal(canViewSchoolKnowledge('Instructor',{...row,audience:'Management'}),false);
assert.equal(canViewSchoolKnowledge('Enrollment specialist',{...row,audience:'Admissions & administration'}),true);
assert.equal(canRead('Instructor','school-knowledge'),true);
assert.equal(canWrite('Instructor','school-knowledge'),false);
assert.equal(canWrite('Campus manager','school-knowledge'),true);
assert.equal(schoolKnowledgeNeedsReview({...row,reviewDate:'2026-11-01'},'2026-11-07'),true);
for(const role of ['Owner','Campus manager','Instructor','Enrollment specialist']){
 const nav=availableSchoolSections(role);
 assert.ok(nav.some(s=>s.pages.some(p=>p.id==='school-knowledge')),role+' cannot navigate to the school knowledge hub');
}
const sceneIds=new Set(DEMO_SCENES.map(x=>x.id)),tourIds=new Set(OPERATOR_STEPS.map(x=>x.id));
for(const id of ['staff-knowledge','staff-calendar','classroom-roster','classroom-carryforward','instructor-plan','automatic-yard','student-messaging','configuration'])
 assert.ok(sceneIds.has(id),'Demo film lacks feature '+id);
for(const id of ['school-library','bulk-attendance','hours-audit','instructor-checklist','staff-calendar','text-email','school-connections'])
 assert.ok(tourIds.has(id),'Operator demo lacks feature '+id);
assert.equal(DEMO_SCENES.at(-1).id,'finale');
assert.equal(OPERATOR_STEPS.at(-1).id,'finish');
assert.equal(DEMO_RUNTIME_SECONDS,Math.round(DEMO_SCENES.length*13500/1000));
console.log('PASS: school knowledge permission gates, content validation, review dates, navigation, film and operator walkthrough coverage.');
