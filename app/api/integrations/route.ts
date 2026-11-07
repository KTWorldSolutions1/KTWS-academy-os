import {env as local} from '../../../lib/env';
import {env as cloud} from '../../../cloudflare/runtime';
import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {INTEGRATION_CATALOG,integrationClientView} from '../../../lib/integration-catalog';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function GET(){
 const access=await getWorkspaceAccess();if(!access)return Response.json({error:'Sign in required'},{status:401,headers});
 const c:any=cloud||{},l:any=local||{};
 const pick=(key:string)=>c[key]??l[key]??null;
 const basic={sms:!!(pick('TWILIO_ACCOUNT_SID')&&pick('TWILIO_AUTH_TOKEN')&&pick('TWILIO_FROM_NUMBER')),
  email:!!(pick('RESEND_API_KEY')&&pick('SCHOOL_EMAIL_FROM')),encryptedStorage:!!pick('RECORDS_ENCRYPTION_KEY'),
  ai:!!pick('OPENAI_API_KEY'),tpr:false,eSignature:false};
 if(!['Owner','Regional admin'].includes(access.role))return Response.json(basic,{headers});
 const allowed=new Set(['DB','BUCKET','TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_FROM_NUMBER',
  'RESEND_API_KEY','SCHOOL_EMAIL_FROM','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_PAYMENTS_ENABLED',
  'M365_TENANT_ID','M365_CLIENT_ID','M365_CLIENT_SECRET','OPENAI_API_KEY']);
 const statuses:Record<string,unknown>={};for(const name of allowed)statuses[name]=name==='DB'||name==='BUCKET'?Boolean(pick(name)):name==='STRIPE_PAYMENTS_ENABLED'?String(pick(name)).toLowerCase()==='true':Boolean(pick(name));
 const connectors=INTEGRATION_CATALOG.map(row=>integrationClientView(row,statuses));
 return Response.json({...basic,integrations:connectors,notes:['Listed connectors are not installed in third-party accounts or connected automatically.',
 'Never enter vendor API secrets into a student profile or ordinary Academy OS form.',
 'Only school administrators with vendor authority can configure Cloudflare secrets/OAuth connections.',
 'Staging and demo records remain separate from production student information.']},{headers});
}
