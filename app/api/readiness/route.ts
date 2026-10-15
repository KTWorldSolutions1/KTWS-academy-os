import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {database} from '../../../lib/storage';
import {env} from '../../../lib/env';

/** Owner-only operational evidence. Does not certify legal or data-security compliance. */
export async function GET(){
 const a=await getWorkspaceAccess();
 if(!a)return Response.json({error:'Sign in required'},{status:401});
 if(a.role!=='Owner')return Response.json({error:'Owner access required'},{status:403});
 try{
  const db=database();
  const rows=await db.prepare('SELECT kind,payload FROM records WHERE owner=?').bind(a.scope).all();
  const records=rows.results.map((r:any)=>({...JSON.parse(r.payload),kind:r.kind}));
  const campuses=records.filter((r:any)=>r.kind==='campuses');
  const missing=['Greensboro','Mansfield','Dallas'].filter(city=>!campuses.some((c:any)=>c.name?.toLowerCase().includes(city.toLowerCase())&&c.status==='Active'));
  const e:any=env, encrypted=/^[0-9a-f]{64}$/i.test(String(e.RECORDS_ENCRYPTION_KEY||''));
  const checks=[
   {code:'DATABASE',label:'Record database',state:'pass',detail:'Authenticated record query completed.'},
   {code:'ENCRYPTION',label:'Document encryption key',state:encrypted?'pass':'blocker',detail:encrypted?'A valid AES-256 key is configured. File round-trip remains to be tested.':'Configure a 64-hex-character RECORDS_ENCRYPTION_KEY before accepting private documents.'},
   {code:'STORAGE',label:'Document bucket binding',state:e.BUCKET?'pass':'blocker',detail:e.BUCKET?'Storage binding exists; encrypted upload/download test still required.':'R2 bucket binding is not available.'},
   {code:'CAMPUSES',label:'Three-campus configuration',state:missing.length?'blocker':'pass',detail:missing.length?'Missing active campuses: '+missing.join(', '):'Greensboro, Mansfield and Dallas have active records.'},
   {code:'STAFF',label:'Staff roles and campus scopes',state:records.some((r:any)=>r.kind==='staff'&&r.status==='Active'&&r.accessRole&&r.campusIds?.length)?'pass':'attention',detail:'Review credentials and test actual role-isolation with staff accounts before access is granted.'},
   {code:'CLASSES',label:'Scheduled Class A cohorts',state:records.some((r:any)=>r.kind==='classes'&&['Open for enrollment','In progress'].includes(r.status))?'pass':'attention',detail:'Check each live cohort date, capacity, campus assignment and week-five testing.'},
   {code:'AI',label:'OpenAI provider',state:e.OPENAI_API_KEY?'attention':'optional',detail:e.OPENAI_API_KEY?'API key detected; a real authorized, non-sensitive provider call still needs verification.':'OpenAI drafting remains disabled until the API key and billing are set.'},
   {code:'COMMUNICATIONS',label:'Outbound messaging',state:e.TWILIO_ACCOUNT_SID&&e.TWILIO_AUTH_TOKEN&&e.TWILIO_FROM_NUMBER&&e.RESEND_API_KEY&&e.SCHOOL_EMAIL_FROM?'attention':'optional',detail:'Credentials alone do not establish delivery or consent. Test opted-in recipients.'},
   {code:'SIGNATURES',label:'External e-signature provider',state:'manual',detail:'No independent e-signature integration or signed workflow audit has been verified.'},
   {code:'TPR',label:'FMCSA TPR and NC/TX regulatory approval',state:'manual',detail:'Verify location registration, training records, instructor and yard authority, permit/testing rules with authorities. No live TPR submission.'},
   {code:'BACKUP',label:'Data backup and restore drill',state:'manual',detail:'Document and test recovery from D1/R2 backups before treating the platform as production-ready for protected student data.'},
   {code:'ACCEPTANCE',label:'Signed operational acceptance',state:'manual',detail:'Complete student, instructor, campus-scope, upload, attendance, and audit tests without real personal information.'}
  ];
  const blockers=checks.filter(x=>x.state==='blocker').length;
  const manual=checks.filter(x=>x.state==='manual').length;
  return Response.json({checkedAt:new Date().toISOString(),readyForStudentPII:!blockers&&!manual,blockers,manualChecks:manual,campusCount:campuses.length,checks,disclaimer:'Automated signals are not licensing, privacy or regulatory certification.'},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Readiness checks unavailable'},{status:503});}
}
