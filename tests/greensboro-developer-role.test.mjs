import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const schema=readFileSync(new URL('../cloudflare/schema.sql',import.meta.url),'utf8');
const campus={id:'campus-greensboro',kind:'campuses',name:'Greensboro Training Center',city:'Greensboro',status:'Active'};
const create=()=>{const db=new DatabaseSync(':memory:');db.exec(schema);return db;};
const insert=(db,record)=>db.prepare('INSERT INTO records(id,owner,kind,payload,revision,updated) VALUES(?,?,?,?,1,?)').run(record.id,'academy-owner',record.kind,JSON.stringify(record),'2026-11-08T00:00:00.000Z');
{
 const db=create();insert(db,campus);db.exec(schema);
 const r=db.prepare("SELECT * FROM records WHERE kind='staff' AND json_extract(payload,'$.email')=?").get('ktworldsolutionsllc@outlook.com');
 assert.ok(r,'User gets an individual staff record');
 const profile=JSON.parse(r.payload);assert.equal(profile.accessRole,'Campus manager');assert.deepEqual(profile.campusIds,[campus.id]);
 assert.match(profile.position,/Academy OS Developer/);assert.equal(profile.status,'Active');
 const login=db.prepare("SELECT id,password FROM accounts WHERE email=?").get('ktworldsolutionsllc@outlook.com');
 assert.ok(login);assert.notEqual(login.id,'academy-owner');assert.equal(login.password,null,'No password stored in a migration');
 const before=r.revision;db.exec(schema);
 assert.equal(db.prepare('SELECT revision FROM records WHERE id=?').get(r.id).revision,before,'Repeated releases do not churn the record');
 db.close();
}
{
 const db=create();
 insert(db,{id:'existing-profile',kind:'staff',name:'Travis Existing',email:'ktworldsolutionsllc@outlook.com',accessRole:'Instructor',campusIds:['old-campus'],status:'Inactive'});
 insert(db,campus);db.exec(schema);
 const records=db.prepare("SELECT id,payload FROM records WHERE kind='staff' AND lower(json_extract(payload,'$.email'))=?").all('ktworldsolutionsllc@outlook.com');
 assert.equal(records.length,1,'Existing staff identity must be reused for employee payroll history');
 assert.equal(records[0].id,'existing-profile');
 assert.equal(JSON.parse(records[0].payload).accessRole,'Campus manager');
 assert.deepEqual(JSON.parse(records[0].payload).campusIds,[campus.id]);
 db.close();
}
{
 const db=create();
 insert(db,{id:'protected-owner',kind:'staff',name:'Owner',email:'ktworldsolutionsllc@outlook.com',accessRole:'School owner',campusIds:[],status:'Active'});
 insert(db,campus);db.exec(schema);
 assert.equal(JSON.parse(db.prepare('SELECT payload FROM records WHERE id=?').get('protected-owner').payload).accessRole,'School owner','Never demote school ownership through deployment');
 db.close();
}
{
 const db=create();insert(db,campus);insert(db,{...campus,id:'second-greensboro',name:'Greensboro Annex'});
 db.exec(schema);
 assert.equal(db.prepare("SELECT COUNT(*) AS total FROM records WHERE kind='staff' AND lower(json_extract(payload,'$.email'))=?").get('ktworldsolutionsllc@outlook.com').total,0,'Ambiguous campus matching must not assign unintended access');
 db.close();
}
console.log('PASS: Greensboro campus manager/developer assignment, owner preservation, idempotence, ambiguity guard and password safety.');
