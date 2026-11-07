import assert from 'node:assert/strict';
import {INTEGRATION_CATALOG,integrationClientView,integrationIsReady,integrationCategoryNames} from '../lib/integration-catalog.ts';
import {publicCampusEvents,createPublicCalendarIcs} from '../lib/calendar-ics.ts';

const byId=new Map(INTEGRATION_CATALOG.map(x=>[x.id,x]));
assert.ok(INTEGRATION_CATALOG.length>=15,'All requested connection choices must be discoverable');
assert.equal(byId.size,INTEGRATION_CATALOG.length,'Every integration ID must be unique');
for(const id of ['cloudflare-d1','cloudflare-r2','m365-outlook','m365-sharepoint','m365-teams','polischool','jj-keller','fmcsa-tpr','nc-dmv','texas-dmv','twilio','resend','stripe','quickbooks','tenstreet','openai','esign'])assert.ok(byId.has(id),id);
assert.ok(integrationCategoryNames().length>=5);
assert.ok(INTEGRATION_CATALOG.every(x=>x.officialUrl.startsWith('https://')&&x.currentImplementation&&x.nextAction));
assert.equal(integrationIsReady(byId.get('stripe'),{STRIPE_SECRET_KEY:true,STRIPE_WEBHOOK_SECRET:true,STRIPE_PAYMENTS_ENABLED:false}),false);
assert.equal(integrationIsReady(byId.get('stripe'),{STRIPE_SECRET_KEY:true,STRIPE_WEBHOOK_SECRET:true,STRIPE_PAYMENTS_ENABLED:true}),true);
assert.equal(integrationClientView(byId.get('cloudflare-r2'),{}).status,'Storage binding missing');
assert.equal(integrationClientView(byId.get('cloudflare-r2'),{BUCKET:true}).configured,true);
assert.equal(integrationClientView(byId.get('m365-sharepoint'),{}).configured,false);
const rows=[
 {id:'class1',kind:'classes',campusId:'nc',name:'Class A Nov 16',startDate:'2026-11-16',endDate:'2026-12-18'},
 {id:'closure1',kind:'closures',campusId:'nc',name:'Winter closure',body:'No scheduled class',startDate:'2026-12-25',endDate:'2026-12-25',status:'Confirmed'},
 {id:'notice1',kind:'announcements',campusId:'nc',name:'Instructor meeting',status:'Published',audience:'Staff',startDate:'2026-11-13',endDate:'2026-11-13'},
 {id:'student1',kind:'students',campusId:'nc',name:'Fictional Student',dob:'2000-02-16'},
 {id:'task1',kind:'tasks',campusId:'nc',name:'Private call about SSN',due:'2026-11-09'},
 {id:'notice2',kind:'announcements',campusId:'tx',name:'Unrelated Texas school event',status:'Published',audience:'Everyone',startDate:'2026-11-14',endDate:'2026-11-14'},
 {id:'notice3',kind:'announcements',campusId:'nc',name:'Hidden draft',status:'Draft',audience:'Everyone',startDate:'2026-11-14',endDate:'2026-11-14'},
];
const list=publicCampusEvents(rows,'nc');assert.equal(list.length,3);
const calendar=createPublicCalendarIcs(list,'Greensboro');
assert.ok(calendar.startsWith('BEGIN:VCALENDAR'));
assert.ok(calendar.includes('BEGIN:VEVENT')&&calendar.includes('20261116')&&calendar.includes('20261219'));
assert.ok(!calendar.includes('Fictional Student')&&!calendar.includes('SSN')&&!calendar.includes('Texas'));
assert.ok(!calendar.includes('Hidden draft'));
assert.ok(calendar.includes('END:VCALENDAR'));
console.log('Integration catalog and privacy-minimized Outlook/Google ICS export passed.');
