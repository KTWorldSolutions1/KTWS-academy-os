import assert from 'node:assert/strict';
import {PREVIEW_ROLES,ROLE_FOCUS,rolePreviewNavigation,rolePreviewStart,rolePreviewPageAllowed,scopePreviewRecords} from '../lib/role-previews.ts';
import {roleModules,moduleAllowed} from '../lib/roles.ts';
assert.deepEqual(new Set(PREVIEW_ROLES),new Set(['Owner',...Object.keys(roleModules)]));
for(const role of PREVIEW_ROLES){
 assert.ok(rolePreviewPageAllowed(role,rolePreviewStart(role)));
 for(const page of rolePreviewNavigation(role).flatMap(s=>s.pages))assert.ok(moduleAllowed(role,page.id));
 for(const page of ROLE_FOCUS[role].pages)assert.ok(rolePreviewPageAllowed(role,page));
}
for(const role of ['Instructor','Front desk','Enrollment specialist'])assert.equal(rolePreviewPageAllowed(role,'payroll-report'),false);
assert.equal(rolePreviewPageAllowed('Front desk','courses'),false);
const rows=[{id:'a',kind:'campuses'},{id:'b',kind:'campuses'},{id:'staffA',kind:'staff',campusIds:['a']},{id:'staffB',kind:'staff',campusIds:['b']},{id:'studentA',kind:'students',campusId:'a'},{id:'studentB',kind:'students',campusId:'b'},{id:'classA',kind:'classes',campusId:'a'},{id:'linked',kind:'students',classId:'classA'}];
assert.deepEqual(scopePreviewRecords(rows,'a').map(r=>r.id),['a','staffA','studentA','classA','linked']);
assert.equal(scopePreviewRecords(rows,'All campuses').length,rows.length);
console.log('PASS: all configured employee roles, permitted start screens, shortcuts, navigation and fictional campus isolation.');
