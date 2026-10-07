import assert from 'node:assert/strict';
import {writeFileSync,rmSync} from 'node:fs';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const entry=resolve('tests/.academy-render-check.mjs'),out=resolve('tests/.render-check');
writeFileSync(entry,`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import Growth from '../app/growth-center.tsx';import Operations from '../app/operations-center.tsx';export const render=(kind,props)=>renderToStaticMarkup(React.createElement(kind==='growth'?Growth:Operations,props));`);
try{
 const result=await build({build:{ssr:entry,outDir:out,rollupOptions:{input:entry}}});
 const chunk=result.output.find(x=>x.type==='chunk'&&x.isEntry),{render}=await import(pathToFileURL(resolve(out,chunk.fileName)).href);
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
 const base={records,role:'Owner',busy:false,saveMany:async()=>true,onNavigate:()=>{},onStudent:()=>{}};
 for(const view of ['Partnership pipeline','Contact follow-ups','Referral desk','Recruiting events','Growth results']){const html=render('growth',{...base,initialView:view});assert.match(html,/ADMISSIONS GROWTH ENGINE/);assert.ok(html.includes(view.replaceAll('&','&amp;')));assert.ok(render('growth',{...base,records:[],initialView:view}).length>100);}
 for(const view of ['Daily operations','Student plans','Support cases','Skill matrix','Capacity & campuses','Career outcomes','Progress reports']){const html=render('operations',{...base,initialView:view});assert.match(html,/CONNECTED SCHOOL OPERATIONS/);assert.ok(html.includes(view.replaceAll('&','&amp;')));assert.ok(render('operations',{...base,records:[],initialView:view}).length>100);}
 const contactDesk=render('growth',{...base,initialView:'Contact follow-ups'});assert.match(contactDesk,/Out of office through/);assert.match(contactDesk,/Backup rep/);assert.match(contactDesk,/Contact away today/);assert.match(contactDesk,/Date needed/);
 const plan=render('operations',{...base,initialView:'Student plans'});assert.match(plan,/Practice mirror checks/);assert.match(plan,/Saved student coaching plan/);assert.match(plan,/Sample recruiting open house/);
 assert.doesNotMatch(render('operations',{...base,role:'Instructor',initialView:'Career outcomes'}),/The journey continues after graduation|>Career outcomes</);
 console.log('PASS: all growth/operations views render with populated and empty records, connected student plans and instructor-limited navigation.');
}finally{rmSync(entry,{force:true});rmSync(out,{recursive:true,force:true});}
