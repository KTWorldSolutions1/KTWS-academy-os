/** Narrow daily workflows: opt-in review tasks only.
 * No outgoing messages, payroll modifications, status changes or federal reporting.
 */
const supported=new Set(['permit','tpr','admissions','fleet']);
type R={id:string;kind:string;status?:string;name?:string;campusId?:string;clpNumber?:string;licenseNumber?:string;followUp?:string;tprLocationId?:string;[key:string]:any};
export function reviewCandidates(kind:string,campusId:string,rows:R[],day:string){
 if(!supported.has(kind))return [];
 return rows.filter(r=>r.campusId===campusId).filter(r=>{
  if(kind==='permit')return r.kind==='students'&&!['Graduated','Withdrawn'].includes(r.status||'')&&!r.clpNumber&&!r.licenseNumber;
  if(kind==='tpr')return r.kind==='tpr'&&r.status!=='Confirmed';
  if(kind==='admissions')return r.kind==='leads'&&!['Closed','Enrolled','Lost'].includes(r.status||'')&&typeof r.followUp==='string'&&r.followUp<=day;
  return r.kind==='fleet'&&r.status==='Out of service';
 });
}
export async function runScheduledReviews(db:any,day:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Invalid calendar day');
 const rules:any=await db.prepare('SELECT * FROM academy_workflow_rules WHERE enabled=1').all();
 const records:any=await db.prepare("SELECT id,kind,payload FROM records WHERE owner='academy-owner'").all();
 const rows:R[]=records.results.map((r:any)=>({...JSON.parse(r.payload),id:r.id,kind:r.kind}));
 let created=0;
 for(const rule of rules.results){
  if(!supported.has(rule.kind))continue;
  const active=rows.some(r=>r.kind==='campuses'&&r.id===rule.campus_id&&r.status==='Active');
  if(!active)continue;
  const prior:any=await db.prepare('SELECT id FROM academy_workflow_runs WHERE rule_id=? AND scheduled_for=?').bind(rule.id,day).first();
  if(prior)continue;
  let count=0;
  const candidates=reviewCandidates(rule.kind,rule.campus_id,rows,day).slice(0,40);
  for(const r of candidates){
   const signal='scheduled:'+rule.kind+':'+r.id;
   const already:any=await db.prepare("SELECT id FROM records WHERE owner='academy-owner' AND kind='tasks' AND json_extract(payload,'$.signalKey')=? AND json_extract(payload,'$.status') NOT IN ('Complete','Cancelled') LIMIT 1").bind(signal).first();
   if(already)continue;
   const id=crypto.randomUUID(),now=new Date().toISOString();
   const title=(rule.kind==='permit'?'Review CLP evidence: ':rule.kind==='tpr'?'Verify TPR receipt: ':rule.kind==='admissions'?'Contact prospective student: ':'Review out-of-service vehicle: ')+(r.name||'Saved record').slice(0,90);
   const task={id,kind:'tasks',name:title,status:'Open',campusId:rule.campus_id,category:'Scheduled follow-up',owner:'Campus operations',due:day,operationsCase:true,signalKey:signal,
    plan:'System-generated review item only. Verify source evidence and document resolution before closing.'};
   if(r.kind==='students')Object.assign(task,{studentId:r.id});
   if(r.kind==='fleet')Object.assign(task,{unitId:r.id});
   await db.batch([
    db.prepare("INSERT INTO records(id,owner,kind,payload,revision,updated) VALUES(?,'academy-owner','tasks',?,1,?)").bind(id,JSON.stringify(task),now),
    db.prepare("INSERT INTO audit(id,owner,record_id,action,at,payload,revision,actor,snapshot) VALUES(?,'academy-owner',?,'Created by scheduled workflow',?,?,1,'academy-scheduler',?)")
     .bind(crypto.randomUUID(),id,now,JSON.stringify({ruleId:rule.id,sourceId:r.id}),JSON.stringify(task))
   ]);
   count++;created++;
  }
  await db.prepare('INSERT OR IGNORE INTO academy_workflow_runs(id,scheduled_for,completed_at,rule_id,created_count) VALUES(?,?,?,?,?)')
   .bind(crypto.randomUUID(),day,new Date().toISOString(),rule.id,count).run();
 }
 return {created};
}
