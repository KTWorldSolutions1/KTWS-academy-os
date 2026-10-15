import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {identity} from '../../../server/context';
import {database} from '../../../lib/storage';
import {campusAllowed,campusOf} from '../../../lib/enterprise';
import {authorizedPartnerView,PARTNER_FIELDS} from '../../../lib/wioa-portal-access';
import {activeSessions,instructionHours} from '../../../lib/training';
import {env} from '../../../lib/env';
const allowed=new Set<string>(PARTNER_FIELDS);
const responses={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const bad=(error:string,status:number)=>Response.json({error},{status,headers:responses});
const fresh=(value:any)=>Response.json(value,{headers:responses});
async function representative(){
 const user=identity.getStore();
 if(!user)return null;
 const db=database();
 const link:any=await db.prepare('SELECT account,partner,campus FROM partner_accounts WHERE account=? AND active=1').bind(user.userId).first();
 if(!link)return null;
 const partner:any=await db.prepare("SELECT payload FROM records WHERE owner='academy-owner' AND kind='partners' AND id=?").bind(link.partner).first();
 const campus:any=await db.prepare("SELECT payload FROM records WHERE owner='academy-owner' AND kind='campuses' AND id=?").bind(link.campus).first();
 if(!partner||!campus||JSON.parse(partner.payload).status!=='Active'||JSON.parse(campus.payload).status!=='Active')return null;
 if(campusOf(JSON.parse(partner.payload),[])!==link.campus)return null;
 return {db,user,link,partner:JSON.parse(partner.payload),campus:JSON.parse(campus.payload)};
}
async function audit(db:any,recordId:string,action:string,actor:string,details:any={}){
 await db.prepare('INSERT INTO audit(id,owner,record_id,action,at,payload,actor) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),'academy-owner',recordId,action,new Date().toISOString(),JSON.stringify(details),actor).run();
}
export async function GET(req:Request){
 const path=new URL(req.url).pathname;
 if(path==='/api/partner/me'){
  const rep=await representative();
  if(!rep)return bad('Partner sign-in required',401);
  return fresh({email:rep.user.email,role:'Agency representative',partner:rep.partner.name,campus:rep.campus.name});
 }
 if(path==='/api/partner/portal'){
  const rep=await representative();if(!rep)return bad('Partner sign-in required',401);
  const {db,link,user}=rep;
  const grants:any=await db.prepare('SELECT id,student,partner,campus,fields,expires,approved_by,approved_at,revoked_at,consent_key FROM partner_grants WHERE account=? AND partner=? AND campus=? AND revoked_at IS NULL AND expires>?').bind(user.userId,link.partner,link.campus,Date.now()).all();
  const views:any[]=[];
  for(const grant of grants.results){
   const row:any=await db.prepare("SELECT payload FROM records WHERE owner='academy-owner' AND kind='students' AND id=?").bind(grant.student).first();
   if(!row)continue;
   const s=JSON.parse(row.payload);
   if(s.campusId!==link.campus)continue;
   if(!(s.documents||[]).some((d:any)=>d.key===grant.consent_key&&d.category==='Information release authorization'&&d.verified===true))continue;
   const sessions=activeSessions(s);
   const attend=sessions.filter((x:any)=>x.attendance==='Present'||x.attendance==='Late'||x.attendance==='Left early').length;
   const enriched={...s,attendanceSummary:{recordedSessions:sessions.length,attendedSessions:attend,unrecordedSessions:'Not automatically inferred'},trainingProgress:{classroomHours:instructionHours(s,'Classroom'),yardHours:instructionHours(s,'Yard'),roadInstructionHours:instructionHours(s,'Road'),phase:s.status}};
   const fields=JSON.parse(grant.fields);
   const v=authorizedPartnerView(enriched,{partnerId:grant.partner,studentId:grant.student,campusId:grant.campus,fields,consentAt:grant.approved_at,approvedBy:grant.approved_by,expiresAt:new Date(grant.expires).toISOString(),revokedAt:grant.revoked_at},{partnerId:link.partner,campusId:link.campus,now:new Date().toISOString()});
   if(v){views.push({grantId:grant.id,...v});await audit(db,grant.student,'Agency progress viewed',user.email,{partnerId:link.partner,grantId:grant.id,fields});}
  }
  return fresh({partner:rep.partner.name,campus:rep.campus.name,students:views,notice:'Read-only consent-restricted reporting. Verify with the school before relying on eligibility or completion claims.'});
 }
 const a=await getWorkspaceAccess();if(!a||!['Owner','Campus manager'].includes(a.role))return bad('School management access required',403);
 const db=database();
 const accounts:any=await db.prepare('SELECT p.account,p.partner,p.campus,p.active,a.email FROM partner_accounts p JOIN accounts a ON a.id=p.account').all();
 const grants:any=await db.prepare('SELECT * FROM partner_grants ORDER BY approved_at DESC LIMIT 500').all();
 const visible= (campus:string)=>a.role==='Owner'||a.campusIds.includes(campus);
 return fresh({accounts:accounts.results.filter((x:any)=>visible(x.campus)),grants:grants.results.filter((x:any)=>visible(x.campus)).map((x:any)=>({id:x.id,account:x.account,student:x.student,partner:x.partner,campus:x.campus,fields:JSON.parse(x.fields),expiresAt:new Date(x.expires).toISOString(),approvedAt:x.approved_at,approvedBy:x.approved_by,revokedAt:x.revoked_at}))});
}
export async function POST(req:Request){
 const a=await getWorkspaceAccess();
 if(!a||!['Owner','Campus manager'].includes(a.role))return bad('School management access required',403);
 if(req.headers.get('origin')!==new URL(req.url).origin)return bad('Invalid origin',403);
 if(Number(req.headers.get('Content-Length')||0)>12000)return bad('Request too large',413);
 let body:any;try{body=await req.json();}catch{return bad('Invalid JSON',400);}
 const db=database();
 const all:any=await db.prepare("SELECT payload FROM records WHERE owner=? AND kind IN ('partners','campuses','students')").bind(a.scope).all();
 const rows=all.results.map((x:any)=>JSON.parse(x.payload));
 const partner=rows.find((x:any)=>x.kind==='partners'&&x.id===body.partnerId);
 const campus=rows.find((x:any)=>x.kind==='campuses'&&x.id===body.campusId);
 if(!partner||partner.status!=='Active'||!campus||campus.status!=='Active'||campusOf(partner,rows)!==campus.id||!campusAllowed(a.role,a.campusIds,partner,rows)||!campusAllowed(a.role,a.campusIds,campus,rows))return bad('Select an active partner and campus within your authority',403);
 if(body.action==='invite'){
  if(a.role!=='Owner')return bad('Owner must approve external portal accounts',403);
  const email=String(body.email||'').toLowerCase().trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>200)return bad('Valid representative email required',400);
  // Avoid accidentally attaching partner permissions to an existing employee or owner account.
  const exists:any=await db.prepare('SELECT id FROM accounts WHERE email=?').bind(email).first();
  if(exists)return bad('This email already has an account. Contact the owner for reassignment; no access was changed.',409);
  const id='external-'+crypto.randomUUID();
  await db.batch([db.prepare('INSERT INTO accounts(id,email) VALUES (?,?)').bind(id,email),db.prepare('INSERT INTO partner_accounts(account,partner,campus,active) VALUES (?,?,?,1)').bind(id,partner.id,campus.id)]);
  await audit(db,id,'External representative invited',a.user.email,{partnerId:partner.id,campusId:campus.id});
  // Activation uses the same one-use flow as employees, but never gives school employee access.
  const raw=crypto.getRandomValues(new Uint8Array(32));
  const token=Array.from(raw,b=>b.toString(16).padStart(2,'0')).join('');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
  const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  await db.prepare('INSERT INTO activations(token,account,expires) VALUES (?,?,?)').bind(hash,id,Date.now()+1800000).run();
  return fresh({activationLink:new URL('/activate',String((env as any).PUBLIC_ORIGIN||req.url)).href+'#token='+token,expiresMinutes:30});
 }
 if(body.action==='grant'){
  const userId=String(body.accountId||''),studentId=String(body.studentId||''),fileKey=String(body.consentKey||''),fields=body.fields,exp=Date.parse(String(body.expiresAt||''));
  if(!Array.isArray(fields)||!fields.length||fields.length>PARTNER_FIELDS.length||new Set(fields).size!==fields.length||fields.some((x:any)=>!allowed.has(x))||!Number.isFinite(exp)||exp<=Date.now()||exp>Date.now()+366*86400000)return bad('Choose approved report fields and an expiration within 366 days',400);
  const link:any=await db.prepare('SELECT * FROM partner_accounts WHERE account=? AND partner=? AND campus=? AND active=1').bind(userId,partner.id,campus.id).first();
  const student=rows.find((x:any)=>x.kind==='students'&&x.id===studentId&&x.campusId===campus.id);
  if(!link||!student||!fileKey)return bad('Choose an active representative and student in the same campus',400);
  const file:any=await db.prepare("SELECT key FROM school_files WHERE key=? AND owner=? AND student=? AND category='Information release authorization'").bind(fileKey,a.scope,student.id).first();
  if(!file||(student.documents||[]).some((d:any)=>d.key===fileKey&&d.category==='Information release authorization'&&d.verified===true)!==true)return bad('A reviewed and verified student information-release authorization is required',403);
  const duplicate:any=await db.prepare('SELECT id FROM partner_grants WHERE account=? AND student=? AND revoked_at IS NULL AND expires>?').bind(userId,student.id,Date.now()).first();
  if(duplicate)return bad('Revoke the existing grant before issuing a replacement',409);
  const id=crypto.randomUUID(),now=new Date().toISOString();
  await db.prepare('INSERT INTO partner_grants(id,account,partner,student,campus,fields,consent_key,expires,approved_by,approved_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,userId,partner.id,student.id,campus.id,JSON.stringify(fields),fileKey,exp,a.user.email,now).run();
  await audit(db,student.id,'Agency disclosure granted',a.user.email,{grantId:id,partnerId:partner.id,fields,expiresAt:body.expiresAt});
  return fresh({grantId:id,expiresAt:new Date(exp).toISOString()});
 }
 if(body.action==='revoke'){
  const grantId=String(body.grantId||'');
  const grant:any=await db.prepare('SELECT * FROM partner_grants WHERE id=? AND campus=? AND partner=?').bind(grantId,campus.id,partner.id).first();
  if(!grant)return bad('Grant not found for this campus',404);
  await db.prepare('UPDATE partner_grants SET revoked_at=? WHERE id=? AND revoked_at IS NULL').bind(new Date().toISOString(),grantId).run();
  await audit(db,grant.student,'Agency disclosure revoked',a.user.email,{grantId});
  return fresh({revoked:true});
 }
 if(body.action==='deactivate'){
  if(a.role!=='Owner')return bad('Owner approval required',403);
  const userId=String(body.accountId||'');
  const link:any=await db.prepare('SELECT account FROM partner_accounts WHERE account=? AND partner=? AND campus=?').bind(userId,partner.id,campus.id).first();
  if(!link)return bad('Representative account not found',404);
  await db.batch([db.prepare('UPDATE partner_accounts SET active=0 WHERE account=?').bind(userId),db.prepare('UPDATE accounts SET active=0 WHERE id=?').bind(userId),db.prepare('UPDATE partner_grants SET revoked_at=? WHERE account=? AND revoked_at IS NULL').bind(new Date().toISOString(),userId),db.prepare('DELETE FROM sessions WHERE account=?').bind(userId)]);
  await audit(db,userId,'External representative deactivated',a.user.email,{partnerId:partner.id,campusId:campus.id});
  return fresh({deactivated:true});
 }
 return bad('Unsupported partner administration action',400);
}
