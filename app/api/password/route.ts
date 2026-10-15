import {identity} from '../../../server/context';
import {database} from '../../../lib/storage';
import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {hashPassword,verifyPassword} from '../../../server/password';
import {env} from '../../../lib/env';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const answer=(error:string,status:number)=>Response.json({error},{status,headers});
async function digest(input:string){const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input));return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function stillAuthorized(user:{userId:string;email:string},db:any){
 if(user.userId==='academy-owner')return true;
 if(user.userId.startsWith('external-'))return !!await db.prepare('SELECT account FROM partner_accounts WHERE account=? AND active=1').bind(user.userId).first();
 if(user.userId.startsWith('student-'))return String((env as any).STUDENT_PORTAL_ENABLED||'').toLowerCase()==='true'&&!!await db.prepare('SELECT account FROM student_accounts WHERE account=? AND active=1').bind(user.userId).first();
 const access=await getWorkspaceAccess();
 return !!access&&access.user.userId===user.userId;
}
/** Fully authenticated self-service change. No email reset, secret recovery
 * or token in the URL. Revoke ALL old sessions after an auditable change. */
export async function POST(req:Request){
 const user=identity.getStore();
 if(!user)return answer('Sign in first to update your password.',401);
 if(req.headers.get('origin')!==new URL(req.url).origin)return answer('Invalid origin.',403);
 const length=Number(req.headers.get('Content-Length')||0);
 if(length>2048)return answer('Password update request too large.',413);
 let body:any;try{body=await req.json();}catch{return answer('Enter your current password and a new password.',400);}
 const current=body.currentPassword,next=body.newPassword;
 if(typeof current!=='string'||current.length<1||current.length>256||typeof next!=='string'||next.length<14||next.length>256||next===current)return answer('Use your current password and a different new password with 14–256 characters.',400);
 const db=database(),key='pw-change:'+await digest(user.userId),now=Date.now();
 try{
  if(!await stillAuthorized(user,db))return answer('School account access is inactive.',403);
  await db.prepare('INSERT INTO attempts(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<? THEN excluded.expires ELSE expires END').bind(key,now+15*60*1000,now,now).run();
  const limit:any=await db.prepare('SELECT count FROM attempts WHERE key=?').bind(key).first();
  if(Number(limit?.count||0)>5)return answer('Too many attempts. Try again after 15 minutes or contact the school administrator.',429);
  const account:any=await db.prepare('SELECT id,password FROM accounts WHERE id=? AND active=1').bind(user.userId).first();
  if(!account?.password||!await verifyPassword(current,account.password))return answer('Current password could not be verified.',403);
  if(await verifyPassword(next,account.password))return answer('Choose a password you have not used for this account.',400);
  const hashed=await hashPassword(next);
  const at=new Date().toISOString();
  await db.batch([
   db.prepare('UPDATE accounts SET password=? WHERE id=? AND active=1').bind(hashed,user.userId),
   db.prepare('DELETE FROM sessions WHERE account=?').bind(user.userId),
   db.prepare('DELETE FROM activations WHERE account=?').bind(user.userId),
   db.prepare('DELETE FROM attempts WHERE key=?').bind(key),
   db.prepare('INSERT INTO audit(id,owner,record_id,action,at,payload,actor) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),'academy-owner','account-security-'+user.userId,'Password changed',at,JSON.stringify({allSessionsRevoked:true}),user.email)
  ]);
  const cookie='academy_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'+(new URL(req.url).protocol==='https:'?'; Secure':'');
  return Response.json({ok:true,reloginRequired:true,message:'Password updated. Sign in again on each device.'},{headers:{...headers,'Set-Cookie':cookie}});
 }catch{return answer('Password update could not be completed. Your previous password remains in effect unless the server confirms success.',503);}
}
