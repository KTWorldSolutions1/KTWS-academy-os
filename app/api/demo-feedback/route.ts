import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {database} from '../../../lib/storage';
import {REVIEW_STATUSES,validateOwnerReview} from '../../../lib/owner-demo-review';
const respond=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private,no-store'}});
const reviewers=new Set(['Owner','Regional admin','Campus manager']);
export async function GET(){
 try{
  const a=await getWorkspaceAccess();
  if(!a)return respond({error:'Sign in required'},401);
  if(!reviewers.has(a.role))return respond({error:'Leadership review access required'},403);
  const db=database();
  const rows:any=await db.prepare('SELECT id,chapter,type,priority,comment,reviewer,status,created_at,updated_at FROM academy_demo_feedback ORDER BY created_at DESC LIMIT 400').all();
  const data=a.role==='Owner'||a.role==='Regional admin'?rows.results:rows.results.filter((x:any)=>x.reviewer.toLowerCase()===a.user.email.toLowerCase());
  return respond({reviews:data,canManage:a.role==='Owner'||a.role==='Regional admin',visibility:a.role==='Campus manager'?'Your submissions':'Leadership review board'});
 }catch(e){console.error('Demo feedback read failed',e);return respond({error:'Review board unavailable'},503);}
}
export async function POST(req:Request){
 try{
  const a=await getWorkspaceAccess();
  if(!a)return respond({error:'Sign in required'},401);
  if(!reviewers.has(a.role))return respond({error:'Leadership review access required'},403);
  if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return respond({error:'Invalid request origin'},403);
  if(Number(req.headers.get('content-length')||0)>6000)return respond({error:'Review is too large'},413);
  const body:any=await req.json();
  const db=database(),now=new Date().toISOString();
  if(body.action==='create'){
   const problem=validateOwnerReview(body);
   if(problem)return respond({error:problem},400);
   const id=crypto.randomUUID();
   await db.prepare('INSERT INTO academy_demo_feedback(id,chapter,type,priority,comment,reviewer,status,created_at,updated_at,updated_by) VALUES(?,?,?,?,?,? ,\'New\',?,?,?)')
    .bind(id,body.chapter,body.type,body.priority,body.comment.trim(),a.user.email,now,now,a.user.email).run();
   return respond({ok:true,id,status:'New'});
  }
  if(body.action==='status'){
   if(!['Owner','Regional admin'].includes(a.role))return respond({error:'Only school ownership or regional leadership can decide the disposition'},403);
   const id=String(body.id||''),status=String(body.status||'');
   if(!/^[0-9a-f-]{36}$/i.test(id)||!REVIEW_STATUSES.includes(status as any))return respond({error:'Invalid feedback decision'},400);
   const result:any=await db.prepare('UPDATE academy_demo_feedback SET status=?,updated_at=?,updated_by=? WHERE id=?')
    .bind(status,now,a.user.email,id).run();
   if(!Number(result.meta?.changes??result.changes??0))return respond({error:'Feedback item not found'},404);
   return respond({ok:true,status});
  }
  return respond({error:'Unsupported review action'},400);
 }catch(e){console.error('Demo feedback save failed',e);return respond({error:'Could not save executive feedback'},503);}
}
