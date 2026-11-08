import {getWorkspaceAccess} from '../../../../lib/workspace-access';
import {database} from '../../../../lib/storage';
import {env as cloud} from '../../../../cloudflare/runtime';
import {env as local} from '../../../../lib/env';
export async function GET(){
 const access=await getWorkspaceAccess();
 if(!access)return Response.json({error:'Sign in required'},{status:401});
 if(!['Owner','Regional admin','Campus manager'].includes(access.role))return Response.json({error:'Management-only reporting configuration'},{status:403});
 try{
  const env:any=cloud||local||{};
  const rows:any=await database().prepare("SELECT id,payload FROM records WHERE owner='academy-owner' AND kind='campuses'").all();
  const campuses=rows.results.map((r:any)=>({...JSON.parse(r.payload),id:r.id})).filter((r:any)=>r.status==='Active'&&(access.role==='Owner'||access.role==='Regional admin'||access.campusIds.includes(r.id))).map((r:any)=>({id:r.id,name:r.name,tprLocationConfigured:Boolean(typeof r.tprLocationId==='string'&&r.tprLocationId.trim())}));
  const credentialsConfigured=Boolean(env.TPR_CREDENTIAL_ID&&env.TPR_PRIVATE_KEY);
  return Response.json({
   mode:'MANUAL_HANDOFF',connected:false,submissionEnabled:false,credentialsConfigured,
   campuses,
   testingComplete:false,
   message:'Academy OS has not been approved to transmit training certifications to FMCSA. Manual official reporting and actual confirmation references remain required.',
   toolkit:'https://tpr.fmcsa.dot.gov/Learn/DeveloperToolkit'
  },{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch(e){console.error('TPR readiness unavailable',e);return Response.json({error:'Could not verify TPR configuration'},{status:503});}
}
