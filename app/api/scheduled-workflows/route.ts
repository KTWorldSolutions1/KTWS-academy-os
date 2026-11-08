import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {database} from '../../../lib/storage';
import {reviewCandidates} from '../../../lib/scheduled-workflows';
const ok=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const kinds=new Set(['permit','tpr','admissions','fleet']);
const manager=new Set(['Owner','Regional admin','Campus manager']);
const allowed=(a:any,c:string)=>a.role==='Owner'||a.role==='Regional admin'||a.campusIds.includes(c);
export async function GET(){
 try{const a=await getWorkspaceAccess();if(!a)return ok({error:'Sign in required'},401);if(!manager.has(a.role))return ok({error:'Management required'},403);
 const db=database(),rules:any=await db.prepare('SELECT id,campus_id,kind,enabled,updated_at FROM academy_workflow_rules ORDER BY campus_id,kind').all();
 const visible=rules.results.filter((r:any)=>allowed(a,r.campus_id));
 const runs:any=await db.prepare('SELECT scheduled_for,rule_id,created_count,completed_at FROM academy_workflow_runs ORDER BY completed_at DESC LIMIT 100').all();
 const ids=new Set(visible.map((r:any)=>r.id));
 return ok({rules:visible,runs:runs.results.filter((r:any)=>ids.has(r.rule_id)),automation:'Daily review tasks only; no notifications, certifications or payroll changes'});
 }catch{return ok({error:'Scheduled workflows unavailable'},503);}
}
export async function POST(req:Request){
 try{const a=await getWorkspaceAccess();if(!a)return ok({error:'Sign in required'},401);if(!manager.has(a.role))return ok({error:'Management required'},403);
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return ok({error:'Invalid origin'},403);
 const b:any=await req.json(),campus=String(b.campusId||''),kind=String(b.kind||'');
 if(!kinds.has(kind)||!campus||typeof b.enabled!=='boolean')return ok({error:'Select a campus, rule and enabled status'},400);
 if(!allowed(a,campus))return ok({error:'Campus access denied'},403);
 const db=database(),row:any=await db.prepare("SELECT payload FROM records WHERE owner='academy-owner' AND kind='campuses' AND id=?").bind(campus).first();
 if(!row||JSON.parse(row.payload).status!=='Active')return ok({error:'Active campus required'},400);
 await db.prepare('INSERT INTO academy_workflow_rules(id,campus_id,kind,enabled,created_by,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(campus_id,kind) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at')
  .bind(crypto.randomUUID(),campus,kind,b.enabled?1:0,a.user.email,new Date().toISOString()).run();
 return ok({ok:true,enabled:b.enabled,note:'Rule evaluated daily; new tasks require school staff review'});
 }catch{return ok({error:'Unable to configure scheduled workflow'},503);}
}
