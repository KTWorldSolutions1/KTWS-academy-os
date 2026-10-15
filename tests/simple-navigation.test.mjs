import assert from 'node:assert/strict';
import {schoolSections,availableSchoolSections,sectionForPage,displayNameForPage} from '../lib/simple-navigation.ts';
import {moduleAllowed,roleModules,startModule} from '../lib/roles.ts';

assert.equal(schoolSections.length,8,'Exactly eight top-level navigation choices');
assert.deepEqual(schoolSections.map(s=>s.label),['Home','Students','Admissions','Training','Team','Partners','Payments','School Setup']);
const everyPage=schoolSections.flatMap(s=>s.pages.map(p=>p.id));
assert.equal(everyPage.length,new Set(everyPage).size,'Each previous workspace route must appear exactly once');
assert.equal(everyPage.length,34,'Do not remove any existing school workflow');
for(const page of everyPage){
 assert.ok(sectionForPage(page),'Page '+page+' belongs to a discoverable section');
 assert.ok(displayNameForPage(page).length>2,'Every page has a short readable title');
}
for(const [role,pages] of Object.entries(roleModules)){
 const groups=availableSchoolSections(role);
 const visible=groups.flatMap(x=>x.pages.map(p=>p.id));
 assert.deepEqual([...visible].sort(),[...pages].sort(),'Role '+role+' must see all and only its authorized pages');
 assert.ok(visible.includes(startModule(role)),'Starting screen accessible to '+role);
 assert.ok(groups.every(s=>s.pages.length>0),'No empty category shown to '+role);
 assert.ok(groups.every(s=>s.pages.every(p=>moduleAllowed(role,p.id))),'Menu does not expose disallowed routes to '+role);
}
assert.deepEqual(availableSchoolSections('Owner').flatMap(s=>s.pages.map(p=>p.id)),everyPage);
assert.deepEqual(
 availableSchoolSections('Owner','Instructor').flatMap(s=>s.pages.map(p=>p.id)),
 availableSchoolSections('Instructor').flatMap(s=>s.pages.map(p=>p.id)),
 'Owner role preview limits navigation without modifying saved role permissions'
);
for(const forbidden of ['staff','finance','agency','employment-offers','audit']){
 assert.equal(availableSchoolSections('Instructor').some(s=>s.pages.some(p=>p.id===forbidden)),false,'Instructor must not see '+forbidden);
}
assert.equal(sectionForPage('event-intake')?.label,'Admissions');
assert.equal(sectionForPage('employment-offers')?.label,'Partners');
assert.equal(sectionForPage('manager-brief')?.label,'Home');
assert.equal(sectionForPage('campuses')?.label,'School Setup');
console.log('PASS: 34 connected school tasks are preserved in eight human-friendly sections; role and campus security navigation unchanged.');
