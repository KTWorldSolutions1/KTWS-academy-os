import assert from 'node:assert/strict';
import {writeFileSync,rmSync} from 'node:fs';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const entry=resolve('tests/.academy-render-check.mjs'),out=resolve('tests/.render-check');
writeFileSync(entry,`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import Growth from '../app/growth-center.tsx';import TrainingCenter from '../app/training-center.tsx';import Operations from '../app/operations-center.tsx';import StaffScheduler from '../app/staff-scheduler.tsx';import EnterpriseCenter from '../app/enterprise-center.tsx';import Academy from '../app/workspace.tsx';import {WorkspaceRecovery} from '../app/workspace-error-boundary.tsx';import VehicleFamiliarization from '../app/vehicle-familiarization.tsx';import DriverPracticeLab from '../app/driver-practice-lab.tsx';export const renderRecovery=()=>renderToStaticMarkup(React.createElement(WorkspaceRecovery,{onRetry:()=>{}}));export const renderVehicle=()=>renderToStaticMarkup(React.createElement(VehicleFamiliarization));export const renderPractice=()=>renderToStaticMarkup(React.createElement(DriverPracticeLab));import DashboardAlertCards from '../app/dashboard-alert-cards.tsx';import {deriveAttentionAlerts} from '../lib/attention-alerts.ts';export const renderDashboardAlerts=(records)=>renderToStaticMarkup(React.createElement(DashboardAlertCards,{alerts:deriveAttentionAlerts(records,'2026-11-08'),onNavigate:()=>{}}));import PhoneDock from '../app/phone-dock.tsx';import QuickFind from '../app/quick-find.tsx';import StudentCommunications from '../app/student-communications.tsx';import SchoolKnowledgeHub from '../app/school-knowledge-hub.tsx';import {availableSchoolSections} from '../lib/simple-navigation.ts';export const renderSchoolKnowledge=(records,role)=>renderToStaticMarkup(React.createElement(SchoolKnowledgeHub,{records,role,demo:false,busy:false,saveMany:async()=>true,onNavigate:()=>{}}));export const renderPhone=(role)=>renderToStaticMarkup(React.createElement(PhoneDock,{navigation:availableSchoolSections(role),activeSection:'home',onNavigate:()=>{},onMore:()=>{}}));export const renderQuickFind=(role)=>renderToStaticMarkup(React.createElement(QuickFind,{records:[{id:'secret',kind:'students',name:'PRIVATE STUDENT RECORD',status:'Road'}],navigation:availableSchoolSections(role),onClose:()=>{},onNavigate:()=>{}}));export const renderAttendance=(records)=>renderToStaticMarkup(React.createElement(TrainingCenter,{records,demo:false,busy:false,readOnly:false,saveMany:async()=>true}));export const renderWorkspace=()=>renderToStaticMarkup(React.createElement(Academy));export const renderMessaging=(records)=>renderToStaticMarkup(React.createElement(StudentCommunications,{records,role:'Owner',demo:false,initialStudentId:'student',onStudent:()=>{},busy:false,saveMany:async()=>true}));export const renderStaffCalendar=(records)=>renderToStaticMarkup(React.createElement(StaffScheduler,{records,reload:async()=>true}));export const render=(kind,props)=>renderToStaticMarkup(React.createElement(kind==='enterprise'?EnterpriseCenter:kind==='growth'?Growth:kind==='shifts'?StaffScheduler:Operations,props));`);
try{
 const result=await build({build:{ssr:entry,outDir:out,rollupOptions:{input:entry}}});
 const chunk=result.output.find(x=>x.type==='chunk'&&x.isEntry),{renderRecovery,renderVehicle,renderPractice,renderDashboardAlerts,render,renderWorkspace,renderPhone,renderQuickFind,renderMessaging,renderStaffCalendar,renderAttendance,renderSchoolKnowledge}=await import(pathToFileURL(resolve(out,chunk.fileName)).href);
 const day=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'}),records=[
  {id:'campus',kind:'campuses',name:'Sample campus',status:'Active'},
  {id:'partner',kind:'partners',name:'Sample training employer',status:'Prospect',campusId:'campus',relationshipStage:'Contacted',owner:'Admissions',awayFrom:day,awayThrough:day,backupContact:'Backup rep',contactAvailabilityNote:'Contact away today',relationshipNotes:'Agency paperwork pending'},
  {id:'ref',kind:'referrals',name:'Sample referred applicant',status:'Connected to lead',campusId:'campus',partnerId:'partner',leadId:'lead',followUp:day,owner:'Admissions'},
  {id:'lead',kind:'leads',name:'Sample referred applicant',status:'Enrolled',campusId:'campus',partnerId:'partner',eventId:'event'},
  {id:'class',kind:'classes',name:'Sample class',status:'In progress',campusId:'campus',startDate:day,endDate:day,capacity:8},
  {id:'student',kind:'students',name:'Sample student',status:'Yard',campusId:'campus',classId:'class',sourceLead:'lead',targetTheory:50,targetYard:50,targetRoad:60,sessions:[{id:'session',date:day,phase:'Yard',hours:2,attendance:'Present',instructor:'Trainer',skill:'Straight-line backing',notes:'Practice mirror checks.',mood:'yellow'}]},
  {id:'task',kind:'tasks',name:'Saved student coaching plan',status:'Open',campusId:'campus',studentId:'student',owner:'Trainer',due:day,operationsCase:true,plan:'Practice independently under supervision.'},
  {id:'event',kind:'appointments',name:'Sample recruiting open house',status:'Scheduled',campusId:'campus',outreachEvent:true,type:'Recruiting event',date:day,start:'16:00',end:'17:00',owner:'Events',personId:'lead'}
 ];
 const alertCards=renderDashboardAlerts(records);assert.match(alertCards,/Enrollment file needs review/);assert.match(alertCards,/Sample student/);assert.doesNotMatch(alertCards,/undefined/);assert.equal(renderDashboardAlerts([]),'');
 assert.match(renderRecovery(),/Try again/);assert.match(renderRecovery(),/records have not been cleared/);assert.match(renderVehicle(),/Component 7/);assert.match(renderPractice(),/Download my practice worksheet/);
 const base={records,role:'Owner',busy:false,saveMany:async()=>true,onNavigate:()=>{},onStudent:()=>{}};
 for(const view of ['Partnership pipeline','Contact follow-ups','Referral desk','Recruiting events','Growth results']){const html=render('growth',{...base,initialView:view});assert.match(html,/ADMISSIONS GROWTH ENGINE/);assert.ok(html.includes(({'Partnership pipeline':'Partners','Contact follow-ups':'Who to Call','Referral desk':'Referrals','Recruiting events':'Events','Growth results':'Results'}[view]||view).replaceAll('&','&amp;')));assert.ok(render('growth',{...base,records:[],initialView:view}).length>100);}
 for(const view of ['Daily operations','Student plans','Support cases','Skill matrix','Capacity & campuses','Career outcomes','Progress reports']){const html=render('operations',{...base,initialView:view});assert.match(html,/CONNECTED SCHOOL OPERATIONS/);assert.ok(html.includes(({'Daily operations':'Today','Support cases':'Help Requests','Skill matrix':'Driving Skills','Capacity & campuses':'Seats & Locations','Career outcomes':'Jobs After School','Progress reports':'Reports','Student plans':'Student Plans'}[view]||view).replaceAll('&','&amp;')));assert.ok(render('operations',{...base,records:[],initialView:view}).length>100);}
 const contactDesk=render('growth',{...base,initialView:'Contact follow-ups'});assert.match(contactDesk,/Out of office through/);assert.match(contactDesk,/Backup rep/);assert.match(contactDesk,/Contact away today/);assert.match(contactDesk,/Date needed/);
 const plan=render('operations',{...base,initialView:'Student plans'});assert.match(plan,/Practice mirror checks/);assert.match(plan,/Saved student coaching plan/);assert.match(plan,/Sample recruiting open house/);
 assert.doesNotMatch(render('operations',{...base,role:'Instructor',initialView:'Career outcomes'}),/The journey continues after graduation|>Career outcomes</);
 const scheduling=render('shifts',{records:[...records,{id:'staff',kind:'staff',name:'Sample instructor',status:'Active',role:'Instructor',campusIds:['campus']}],reload:async()=>true});assert.match(scheduling,/Staff scheduling/);assert.match(scheduling,/40 paid hours/);assert.match(scheduling,/Save weekly staffing plan/);
 const federal=render('enterprise',{...base,view:'tpr',demo:false});
 assert.match(federal,/not required federally/);
 assert.match(federal,/second business day/);
 assert.match(federal,/does not submit it to FMCSA/);
 const messaging=renderMessaging(records);
 assert.match(messaging,/Email &amp; text students/);
 assert.match(messaging,/Message composer/);
 assert.match(messaging,/Approved wording templates/);
 assert.match(messaging,/Custom message template name/);
 assert.match(messaging,/Sample student/);
 const calendar=renderStaffCalendar([...records,{id:'shift',kind:'shifts',name:'Sample instructor',status:'Approved',employeeId:'staff',campusId:'campus',date:day,start:'08:00',end:'17:00',breakMinutes:60},{id:'staff',kind:'staff',name:'Sample instructor',status:'Active',campusIds:['campus'],weeklyTargetHours:40}]);
 assert.match(calendar,/Staff work calendar/);
 assert.match(calendar,/Week starting Monday/);
 assert.match(calendar,/No shifts scheduled|Sample instructor/);
 const attendance=renderAttendance([...records,{id:'permit-student',kind:'students',name:'Permit-waiting sample student',status:'Waiting for permit',program:'Class A',campusId:'campus',cohort:'Sample class',sessions:[]}]);
 assert.match(attendance,/Bulk attendance &amp; smiley performance/);
 assert.match(attendance,/7:00 AM–4:00 PM/);
 assert.match(attendance,/Prepare 1 student records/);
 assert.match(attendance,/Permit-waiting sample student/);
 assert.match(attendance,/60-minute unpaid break/);
 const library=renderSchoolKnowledge([...records,{id:'demo-school-policy',kind:'school-knowledge',campusId:'campus',name:'Classroom attendance and permit guidance',status:'Published',category:'Policies & procedures',audience:'All staff',documentVersion:'1.0',body:'Actual instructor attendance records are reviewed each day and never created from reported historic hours.',effectiveDate:day}], 'Owner');
 assert.match(library,/School Document Center/);
 assert.match(library,/Classroom attendance and permit guidance/);
 assert.match(library,/New school document or procedure/);
 assert.match(library,/OneDrive/);
 const instructorLibrary=renderSchoolKnowledge(records,'Instructor');
 assert.doesNotMatch(instructorLibrary,/New school document or procedure/);
 assert.match(instructorLibrary,/School Document Center/);
 const workspace=renderWorkspace();
 assert.match(workspace,/School navigation/);
 assert.doesNotMatch(workspace,/Import \/ DMV rosters/);
 assert.match(workspace,/SCHOOL SECTIONS/);
 assert.match(workspace,/Classes &amp; Training/);
 assert.match(workspace,/LONE STAR/);
 assert.match(workspace,/Today/);
 assert.match(workspace,/Find a tool or student/);
 assert.doesNotMatch(workspace,/sidebar-shortcuts/);
 assert.match(workspace,/phone-dock/);
 assert.match(renderPhone('Instructor'),/Training/);
 assert.doesNotMatch(renderPhone('Instructor'),/Admissions/);
 assert.match(renderPhone('Front desk'),/Admissions/);
 assert.doesNotMatch(renderPhone('Front desk'),/Training/);
 assert.match(renderQuickFind('Instructor'),/Search your school|SEARCH YOUR SCHOOL/);
 assert.doesNotMatch(renderQuickFind('Instructor'),/PRIVATE STUDENT RECORD/); // Don't print student names until someone searches.
 
 assert.ok((workspace.match(/aria-current="page"/g)||[]).length>=1,'At least one navigation item must identify the active page');
  console.log('PASS: all growth/operations views render with populated and empty records, connected student plans and instructor-limited navigation.');
}finally{rmSync(entry,{force:true});rmSync(out,{recursive:true,force:true});}
