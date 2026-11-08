import {bindings,database,env} from './runtime';
import {identity} from '../server/context';
import {activate,authenticate,activation,allowedOrigin,sessionUser,sessionCookie,digest} from './auth';
import {getWorkspaceAccess} from '../lib/workspace-access';
import * as records from '../app/api/records/route';
import * as timeclock from '../app/api/timeclock/route';
import * as payrollReport from '../app/api/payroll-report/route';
import * as files from '../app/api/files/route';
import * as communications from '../app/api/communications/route';
import * as communicationBatch from '../app/api/communications/batch/route';
import * as calendarExport from '../app/api/calendar/export/route';
import * as integrations from '../app/api/integrations/route';
import * as tprConnection from '../app/api/tpr/connection/route';
import * as tprSubmit from '../app/api/tpr/submit/route';
import * as corrections from '../app/api/punch-corrections/route';
import * as scheduledWorkflows from '../app/api/scheduled-workflows/route';
import * as academySearch from '../app/api/academy-search/route';
import {runScheduledReviews} from '../lib/scheduled-workflows';
import * as intelligence from '../app/api/intelligence/route';
import * as ai from '../app/api/ai/route';
import * as readiness from '../app/api/readiness/route';
import * as diagnostics from '../app/api/diagnostics/route';
import * as changePassword from '../app/api/password/route';
import * as partnerPortal from '../app/api/partner/route';
import * as studentPortal from '../app/api/student/route';
import * as studentDocumentRequests from '../app/api/student/requests/route';
import * as studentExams from '../app/api/student/exams/route';
import * as complianceRoster from '../app/api/compliance/roster/route';
import * as billing from '../app/api/billing/route';
import * as billingWebhook from '../app/api/billing/webhook/route';
import * as studentBilling from '../app/api/student/billing/route';
const worker={async fetch(req:Request,e:any){return bindings.run(e,async()=>{try{const u=new URL(req.url),ip=req.headers.get('CF-Connecting-IP')||'unknown';if(u.pathname==='/api/health'&&req.method==='GET')return Response.json({ok:true,service:'academy-os',release:__ACADEMY_RELEASE_SHA__},{headers:{'Cache-Control':'no-store'}});if(u.pathname==='/api/auth/me'&&req.method==='GET'&&!req.headers.get('cookie')?.match(/(?:^|;\s*)academy_session=/))return Response.json({error:'Sign in required'},{status:401,headers:{'Cache-Control':'no-store'}});const db=database();if(req.method==='POST'&&u.pathname!=='/api/billing/webhook'&&!allowedOrigin(req))return Response.json({error:'Invalid origin'},{status:403});if(Number(req.headers.get('Content-Length')||0)>12_000_000)return new Response('Too large',{status:413});
if(u.pathname==='/api/auth/login'&&req.method==='POST')return authenticate(req,ip);
if(u.pathname==='/api/auth/activate'&&req.method==='POST')return activate(req,ip);
if(u.pathname==='/api/auth/logout'&&req.method==='POST'){const raw=req.headers.get('cookie')?.match(/(?:^|;\s*)academy_session=([^;]+)/)?.[1];if(raw)await db.prepare('DELETE FROM sessions WHERE token=?').bind(digest(raw)).run();return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie('',0)}});}
return identity.run(await sessionUser(req)||undefined as any,async()=>{const access=await getWorkspaceAccess();if(u.pathname==='/api/auth/me')return access?Response.json({email:access.user.email,role:access.role}):Response.json({error:'Sign in required'},{status:401});
if(u.pathname==='/api/accounts/invite'&&req.method==='POST'){if(access?.role!=='Owner')return Response.json({error:'Owner access required'},{status:403});const b:any=await req.json(),row=await db.prepare("SELECT payload FROM records WHERE id=? AND owner='academy-owner' AND kind='staff'").bind(b.staffId).first(),s=row?JSON.parse(row.payload):null;if(!s||s.status!=='Active'||!s.accessRole||(!s.campusIds?.length&&s.accessRole!=='School owner')||!/^\S+@\S+\.\S+$/.test(s.email||''))return Response.json({error:'Save an active employee with email, role and campuses.'},{status:400});const email=s.email.toLowerCase();let account=await db.prepare('SELECT id FROM accounts WHERE email=?').bind(email).first();if(account?.id==='academy-owner')return Response.json({error:'Cannot reset owner here.'},{status:400});if(!account){account={id:crypto.randomUUID()};await db.prepare('INSERT INTO accounts(id,email) VALUES(?,?)').bind(account.id,email).run();}return Response.json({link:new URL('/activate',env.PUBLIC_ORIGIN).href+'#token='+await activation(account.id),expiresMinutes:30},{headers:{'Cache-Control':'no-store'}});}
const routes:any={'/api/tpr/submit':tprSubmit,'/api/academy-search':academySearch,'/api/punch-corrections':corrections,'/api/scheduled-workflows':scheduledWorkflows,'/api/tpr/connection':tprConnection,'/api/payroll-report':payrollReport,'/api/timeclock':timeclock,'/api/records':records,'/api/files':files,'/api/communications':communications,'/api/communications/batch':communicationBatch,'/api/calendar/export':calendarExport,'/api/integrations':integrations,'/api/intelligence':intelligence,'/api/ai':ai,'/api/readiness':readiness,'/api/diagnostics':diagnostics,'/api/account/password':changePassword,'/api/partner/admin':partnerPortal,'/api/partner/me':partnerPortal,'/api/partner/portal':partnerPortal,'/api/student/admin':studentPortal,'/api/student/me':studentPortal,'/api/student/portal':studentPortal,'/api/student/requests':studentDocumentRequests,'/api/student/exams':studentExams,'/api/student/resources':studentPortal,'/api/compliance/roster':complianceRoster,'/api/billing':billing,'/api/billing/webhook':billingWebhook,'/api/student/billing':studentBilling};if(routes[u.pathname])return routes[u.pathname][req.method]?routes[u.pathname][req.method](req):new Response('Method not allowed',{status:405});if(u.pathname.startsWith('/api/'))return new Response('Not found',{status:404});const result=await env.ASSETS.fetch(req),headers=new Headers(result.headers);headers.set('Referrer-Policy','no-referrer');headers.set('X-Content-Type-Options','nosniff');headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'");return new Response(result.body,{status:result.status,headers});});}catch{return Response.json({error:'Request unavailable.'},{status:503});}});}};

export default {
 ...worker,
 async scheduled(_event:any,e:any,ctx:any){
  ctx.waitUntil(bindings.run(e,async()=>{
   const day=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
   const result=await runScheduledReviews(database(),day);
   console.log('Scheduled campus workflow review completed',result.created);
  }));
 }
};
