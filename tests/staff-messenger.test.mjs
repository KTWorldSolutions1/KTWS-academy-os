import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {schoolSections} from '../lib/simple-navigation.ts';
import {DEMO_SCENES} from '../lib/presentation-demo.ts';
import {EXECUTIVE_SCENE_IDS} from '../lib/demo-showcase.ts';
import {PREVIEW_ROLES,rolePreviewPageAllowed} from '../lib/role-previews.ts';

const section=schoolSections.find(x=>x.id==='team');
assert.ok(section?.pages.some(x=>x.id==='staff-messenger'),'Staff Messenger must be in staff navigation');
for(const role of PREVIEW_ROLES)assert.ok(rolePreviewPageAllowed(role,'staff-messenger'),role+' should see internal messaging in preview');
assert.ok(DEMO_SCENES.some(x=>x.id==='staff-chat'&&x.destination==='staff-messenger'),'Full owner film must demonstrate messenger');
assert.ok(EXECUTIVE_SCENE_IDS.includes('staff-chat'),'Short executive film must demonstrate messenger');
const schema=readFileSync(new URL('../cloudflare/schema.sql',import.meta.url),'utf8');
const db=new DatabaseSync(':memory:');db.exec(schema);
for(const table of ['academy_team_channels','academy_team_messages','academy_team_reads'])
 assert.ok(db.prepare('SELECT name FROM sqlite_master WHERE name=?').get(table),'D1 needs '+table);
db.close();

process.env.ACADEMY_TEST='true';
process.env.PUBLIC_ORIGIN='https://academy.test';
process.env.RECORDS_ENCRYPTION_KEY='bc'.repeat(32);
process.env.ACADEMY_DATA_DIR=mkdtempSync(join(tmpdir(),'academy-staff-chat-'));
const {handle}=await import('../dist-server/index.js');
const send=(path,data,cookie)=>handle(new Request('https://academy.test'+path,{
 method:data?'POST':'GET',
 headers:{Origin:'https://academy.test','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},
 ...(data?{body:JSON.stringify(data)}:{})
}));
const json=async p=>{const r=await p;return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
try{
 const setup=spawnSync(process.execPath,['dist-server/setup-owner.js','owner@test.example'],{env:process.env,encoding:'utf8'});
 assert.equal(setup.status,0,setup.stderr);
 const owner=await json(send('/api/auth/activate',{token:setup.stdout.split('#token=')[1].trim(),password:'a unique and very strong test password'}));
 assert.equal(owner.status,200);
 assert.equal((await json(send('/api/team-chat'))).status,401,'No anonymous conversation listing');
 const north={id:crypto.randomUUID(),kind:'campuses',name:'Greensboro',status:'Active'};
 const south={id:crypto.randomUUID(),kind:'campuses',name:'Dallas',status:'Active'};
 const staff=[
  {id:crypto.randomUUID(),kind:'staff',name:'Sample front desk',status:'Active',accessRole:'Front desk',email:'frontdesk@test.example',campusIds:[north.id]},
  {id:crypto.randomUUID(),kind:'staff',name:'Sample instructor',status:'Active',accessRole:'Instructor',email:'instructor@test.example',campusIds:[north.id]},
  {id:crypto.randomUUID(),kind:'staff',name:'Sample Dallas instructor',status:'Active',accessRole:'Instructor',email:'dallas@test.example',campusIds:[south.id]},
  {id:crypto.randomUUID(),kind:'staff',name:'Sample campus manager',status:'Active',accessRole:'Campus manager',email:'manager@test.example',campusIds:[north.id]}
 ];
 const created=await json(send('/api/records',{records:[north,south,...staff]},owner.cookie));
 assert.equal(created.status,200,JSON.stringify(created.body));
 const users=[];
 for(const employee of staff){
  const link=await json(send('/api/accounts/invite',{staffId:employee.id},owner.cookie));assert.equal(link.status,200,JSON.stringify(link.body));
  const logged=await json(send('/api/auth/activate',{token:link.body.link.split('#token=')[1],password:'another very strong unique testing password'}));
  assert.equal(logged.status,200);users.push(logged.cookie);
 }
 const [desk,teacher,dallas,manager]=users;
 const ids=[];
 for(const c of users){
  const res=await json(send('/api/team-chat',null,c));assert.equal(res.status,200);
  assert.equal(res.body.me.name.startsWith('Sample'),true);
  ids.push(res.body.me.id);
 }
 const [deskId,teacherId,dallasId,managerId]=ids;
 assert.equal((await json(send('/api/team-chat',{action:'create',kind:'school',name:'Illegal all campus channel'},desk))).status,403);
 assert.equal((await json(send('/api/team-chat',{action:'create',kind:'campus',name:'Illegal campus',campusId:north.id},desk))).status,403);
 assert.equal((await json(send('/api/team-chat',{action:'create',kind:'direct',to:dallasId},desk))).status,403,'Campus-bound front desk cannot DM unrelated campus');
 const school=await json(send('/api/team-chat',{action:'create',kind:'school',name:'Schoolwide updates'},owner.cookie));
 assert.equal(school.status,201);
 assert.ok((await json(send('/api/team-chat',null,dallas))).body.channels.some(x=>x.id===school.body.id),'Schoolwide channel reaches authorized Dallas employee');
 const campus=await json(send('/api/team-chat',{action:'create',kind:'campus',campusId:north.id,name:'Greensboro operations'},manager));
 assert.equal(campus.status,201,JSON.stringify(campus.body));
 assert.equal((await json(send('/api/team-chat?channel='+campus.body.id,null,dallas))).status,404,'Dallas staff cannot read Greensboro channel');
 assert.ok((await json(send('/api/team-chat',null,desk))).body.channels.some(x=>x.id===campus.body.id));
 const direct=await json(send('/api/team-chat',{action:'create',kind:'direct',to:teacherId},desk));
 assert.equal(direct.status,201,JSON.stringify(direct.body));
 assert.equal((await json(send('/api/team-chat?channel='+direct.body.id,null,dallas))).status,404,'Third party cannot read private DM');
 assert.equal((await json(send('/api/team-chat',{action:'send',channelId:direct.body.id,text:'Intruder'},dallas))).status,404);
 const dmId=crypto.randomUUID();
 const posted=await json(send('/api/team-chat',{action:'send',channelId:direct.body.id,text:'Review the fictional schedule before tomorrow.',messageId:dmId,authorId:dallasId},desk));
 assert.equal(posted.status,201,JSON.stringify(posted.body));
 assert.equal((await json(send('/api/team-chat',{action:'send',channelId:direct.body.id,text:'Review the fictional schedule before tomorrow.',messageId:dmId},desk))).body.duplicate,true,'Retry should not duplicate a message');
 const list=await json(send('/api/team-chat',null,teacher));
 assert.equal(list.body.channels.find(x=>x.id===direct.body.id).unread,1);
 const thread=await json(send('/api/team-chat?channel='+direct.body.id,null,teacher));
 assert.equal(thread.status,200);
 assert.equal(thread.body.messages.length,1);
 assert.equal(thread.body.messages[0].authorId,deskId,'Cannot forge author identity');
 assert.equal(thread.body.messages[0].body,'Review the fictional schedule before tomorrow.');
 const seq=thread.body.messages[0].seq;
 assert.equal((await json(send('/api/team-chat',{action:'read',channelId:direct.body.id,lastSeq:seq},teacher))).status,200);
 assert.equal((await json(send('/api/team-chat',null,teacher))).body.channels.find(x=>x.id===direct.body.id).unread,0);
 assert.equal((await json(send('/api/team-chat',{action:'read',channelId:direct.body.id,lastSeq:99999},teacher))).status,400,'Cannot forge read cursor outside conversation');
 assert.equal((await json(send('/api/team-chat',{action:'send',channelId:campus.body.id,text:'Unapproved priority',priority:'important'},desk))).status,403);
 const priority=await json(send('/api/team-chat',{action:'send',channelId:campus.body.id,text:'The training team should review tomorrow’s yard plan.',priority:'important'},manager));
 assert.equal(priority.status,201);
 assert.equal((await json(send('/api/team-chat?channel='+campus.body.id,null,desk))).body.messages[0].priority,'important');
 assert.equal((await json(send('/api/team-chat',{action:'create',kind:'group',name:'Invalid cross campus',participants:[teacherId,dallasId]},desk))).status,403);
 const group=await json(send('/api/team-chat',{action:'create',kind:'group',name:'Greensboro team',participants:[teacherId,managerId]},desk));
 assert.equal(group.status,201);
 assert.equal((await json(send('/api/team-chat?channel='+group.body.id,null,dallas))).status,404);
 assert.equal((await json(send('/api/team-chat',{action:'send',channelId:group.body.id,text:'Reply to different channel',replyTo:dmId},manager))).status,400);
 assert.equal((await json(send('/api/team-chat',{action:'send',channelId:group.body.id,text:'Team group is ready.'},teacher))).status,201);
 console.log('PASS: Messenger D1 schema, all staff roles, presentation demo, identity-bound chats, campus isolation, school channels, authorization, unread cursors and idempotent messages.');
}finally{rmSync(process.env.ACADEMY_DATA_DIR,{recursive:true,force:true});}
