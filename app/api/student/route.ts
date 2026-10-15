import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {identity} from '../../../server/context';
import {database} from '../../../lib/storage';
import {env} from '../../../lib/env';
import {allowedStudentAccount,studentSelfView} from '../../../lib/student-self';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(v:any,status=200)=>Response.json(v,{status,headers});
const error=(message:string,status:number)=>reply({error:message},status);
const isEnabled=()=>String((env as any).STUDENT_PORTAL_ENABLED||'').toLowerCase()==='true';
const secureToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
async function tokenDigest(value:string){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');}
async function markAudit(db:any,recordId:string,action:string,actor:string,details:any={}){
 await db.prepare('INSERT INTO audit(id,owner,record_id,action,at,payload,actor) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),'academy-owner',recordId,action,new Date().toISOString(),JSON.stringify(details),actor).run();
}
async function self(){
 const user=identity.getStore();if(!user||!user.userId.startsWith('student-')||!isEnabled())return null;
 const db=database();
 const link:any=await db.prepare('SELECT account,student,campus,consent_key,active FROM student_accounts WHERE account=? AND active=1').bind(user.userId).first();
 if(!link)return null;
 const studentRow:any=await db.prepare("SELECT payload FROM records WHERE id=? AND owner='academy-owner' AND kind='students'").bind(link.student).first();
 const campusRow:any=await db.prepare("SELECT payload FROM records WHERE id=? AND owner='academy-owner' AND kind='campuses'").bind(link.campus).first();
 if(!studentRow||!campusRow)return null;
 const student=JSON.parse(studentRow.payload),campus=JSON.parse(campusRow.payload);
 if(!allowedStudentAccount(student,link)||campus.status!=='Active'||student.campusId!==campus.id)return null;
 if(!(student.documents||[]).some((d:any)=>d.key===link.consent_key&&d.category==='Student portal authorization'&&d.verified===true))return null;
 const proof:any=await db.prepare("SELECT key FROM school_files WHERE key=? AND owner='academy-owner' AND student=? AND campus=? AND category='Student portal authorization'").bind(link.consent_key,student.id,campus.id).first();
 if(!proof)return null;
 return {user,link,student,campus,db};
}
export async function GET(req:Request){
 const path=new URL(req.url).pathname;
 if(path==='/api/student/me'){
  const found=await self();
  if(!found)return error('Student portal sign-in or access is unavailable',401);
  return reply({email:found.user.email,role:'Student',name:found.student.name,campus:found.campus.name});
 }
 if(path==='/api/student/portal'){
  const found=await self();
  if(!found)return error('Student portal access unavailable',401);
  const rows:any=await found.db.prepare("SELECT payload FROM records WHERE owner='academy-owner' AND kind IN ('campuses','classes','training-assignments')").all();
  const records=rows.results.map((r:any)=>JSON.parse(r.payload));
  const view=studentSelfView(found.student,records);
  await markAudit(found.db,found.student.id,'Own progress portal viewed',found.user.email,{account:found.link.account,fields:'limited student progress'});
  return reply({student:view});
 }
 const admin=await getWorkspaceAccess();
 if(!admin||admin.role!=='Owner')return error('Owner access required',403);
 const db=database(),rows:any=await db.prepare('SELECT x.account,x.student,x.campus,x.active,x.invited_at,x.activated_at,a.email FROM student_accounts x JOIN accounts a ON a.id=x.account').all();
 return reply({enabled:isEnabled(),accounts:rows.results});
}
export async function POST(req:Request){
 if(new URL(req.url).pathname!=='/api/student/admin')return error('Unsupported student portal action',404);
 const user=await getWorkspaceAccess();
 if(!user||user.role!=='Owner')return error('Owner authorization required',403);
 if(req.headers.get('origin')!==new URL(req.url).origin)return error('Invalid origin',403);
 if(Number(req.headers.get('Content-Length')||0)>8000)return error('Too much information',413);
 let body:any;try{body=await req.json();}catch{return error('Invalid input',400);}
 const action=String(body.action||'');
 const db=database();
 if(action==='deactivate'){
  const accountId=String(body.accountId||'');
  const linked:any=await db.prepare('SELECT * FROM student_accounts WHERE account=?').bind(accountId).first();
  if(!linked)return error('Student portal account not found',404);
  await db.batch([db.prepare('UPDATE student_accounts SET active=0 WHERE account=?').bind(accountId),db.prepare('UPDATE accounts SET active=0 WHERE id=?').bind(accountId),db.prepare('DELETE FROM sessions WHERE account=?').bind(accountId),db.prepare('DELETE FROM activations WHERE account=?').bind(accountId)]);
  await markAudit(db,linked.student,'Student portal access disabled',user.user.email,{account:accountId,campus:linked.campus});
  return reply({disabled:true});
 }
 if(action!=='invite')return error('Unsupported student access action',400);
 if(!isEnabled())return error('Student portal invitation is disabled pending school policy and security acceptance.',503);
 if(body.approvedAuthorization!==true)return error('Owner must explicitly approve the specific student authorization before inviting.',400);
 const studentId=String(body.studentId||''),fileKey=String(body.consentKey||'');
 const studentRow:any=await db.prepare("SELECT payload FROM records WHERE id=? AND owner='academy-owner' AND kind='students'").bind(studentId).first();
 const student=studentRow?JSON.parse(studentRow.payload):null;
 const email=String(student?.email||'').trim().toLowerCase();
 if(!student||!student.campusId||student.status==='Withdrawn'||!/^\S+@\S+\.\S+$/.test(email)||email.length>200)return error('Choose an eligible student with a verified email and assigned campus.',400);
 const campusRow:any=await db.prepare("SELECT payload FROM records WHERE id=? AND owner='academy-owner' AND kind='campuses'").bind(student.campusId).first();
 if(!campusRow||JSON.parse(campusRow.payload).status!=='Active')return error('Student campus must be active.',400);
 if(!(student.documents||[]).some((d:any)=>d.key===fileKey&&d.category==='Student portal authorization'&&d.verified===true))return error('Verify and attach the student portal authorization before inviting.',403);
 const proof:any=await db.prepare("SELECT key FROM school_files WHERE key=? AND owner='academy-owner' AND student=? AND campus=? AND category='Student portal authorization'").bind(fileKey,student.id,student.campusId).first();
 if(!proof)return error('Original verified student authorization file is missing.',403);
 if(await db.prepare('SELECT account FROM student_accounts WHERE student=?').bind(student.id).first())return error('Student already has a portal account. Disable it before requesting changes through school administration.',409);
 if(await db.prepare('SELECT id FROM accounts WHERE email=?').bind(email).first())return error('This email is already used by a different school account. Ask the owner to resolve it.',409);
 const account='student-'+crypto.randomUUID(),now=new Date().toISOString(),raw=secureToken(),hash=await tokenDigest(raw);
 await db.batch([db.prepare('INSERT INTO accounts(id,email) VALUES(?,?)').bind(account,email),
  db.prepare('INSERT INTO student_accounts(account,student,campus,consent_key,active,invited_at) VALUES(?,?,?,?,1,?)').bind(account,student.id,student.campusId,fileKey,now),
  db.prepare('INSERT INTO activations(token,account,expires) VALUES(?,?,?)').bind(hash,account,Date.now()+30*60000)]);
 await markAudit(db,student.id,'Student portal invitation approved',user.user.email,{account,campus:student.campusId,consentKey:fileKey});
 return reply({activationLink:new URL('/activate',String((env as any).PUBLIC_ORIGIN||req.url)).href+'#token='+raw,expiresMinutes:30});
}
