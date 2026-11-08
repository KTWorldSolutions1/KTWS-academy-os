import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {runScheduledReviews} from '../lib/scheduled-workflows.ts';
const sql=readFileSync(new URL('../cloudflare/schema.sql',import.meta.url),'utf8');
const raw=new DatabaseSync(':memory:');raw.exec(sql);
const d1={
 prepare(query){
  const statement=raw.prepare(query);
  const bindings=(...values)=>({
   async all(){return {results:statement.all(...values)};},
   async first(){return statement.get(...values)||null;},
   async run(){const info=statement.run(...values);return {meta:{changes:info.changes}};}
  });
  return {...bindings(),bind(...values){return bindings(...values);}};
 },
 async batch(statements){
  raw.exec('BEGIN IMMEDIATE');
  try{const out=[];for(const statement of statements)out.push(await statement.run());raw.exec('COMMIT');return out;}
  catch(e){raw.exec('ROLLBACK');throw e;}
 }
};
const add=r=>raw.prepare("INSERT INTO records(id,owner,kind,payload,revision,updated) VALUES(?,'academy-owner',?,?,1,'2026-11-08T00:00:00Z')").run(r.id,r.kind,JSON.stringify(r));
add({id:'g',kind:'campuses',name:'Greensboro',status:'Active'});
add({id:'d',kind:'campuses',name:'Dallas',status:'Active'});
add({id:'student-one',kind:'students',name:'Fictional learner',status:'Classroom',campusId:'g'});
add({id:'student-two',kind:'students',name:'Different campus',status:'Classroom',campusId:'d'});
add({id:'lead-one',kind:'leads',name:'Future applicant',status:'New',campusId:'g',followUp:'2026-12-01'});
raw.prepare("INSERT INTO academy_workflow_rules(id,campus_id,kind,enabled,created_by,updated_at) VALUES('permit-g','g','permit',1,'manager','2026-11-08')").run();
assert.deepEqual(await runScheduledReviews(d1,'2026-11-08'),{created:1});
assert.deepEqual(await runScheduledReviews(d1,'2026-11-08'),{created:0},'Same-day rerun must be idempotent');
assert.deepEqual(await runScheduledReviews(d1,'2026-11-09'),{created:0},'Following day must not duplicate existing open task');
const tasks=raw.prepare("SELECT payload FROM records WHERE kind='tasks'").all();
assert.equal(tasks.length,1);
const task=JSON.parse(tasks[0].payload);
assert.equal(task.campusId,'g');
assert.equal(task.studentId,'student-one');
assert.equal(task.status,'Open');
assert.equal(raw.prepare("SELECT COUNT(*) AS n FROM audit WHERE action='Created by scheduled workflow'").get().n,1);
assert.equal(raw.prepare("SELECT COUNT(*) AS n FROM academy_workflow_runs").get().n,2);
assert.equal(raw.prepare("SELECT COUNT(*) AS n FROM records WHERE kind='messages'").get().n,0);
raw.close();
console.log('PASS: true scheduled workflow writes idempotent audit tasks only for authorized campus and does not send messages.');
