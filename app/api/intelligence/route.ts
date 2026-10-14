import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {campusAllowed} from '../../../lib/enterprise';
import {database} from '../../../lib/storage';
const permitted=new Set(['WIOA intake','Carrier partnership','CLP remediation','Community event','Marketing campaign']);
export async function POST(req:Request){
 const access=await getWorkspaceAccess();
 if(!access)return Response.json({error:'Sign in required'},{status:401});
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 let body:any;try{body=await req.json();}catch{return Response.json({error:'Invalid JSON'},{status:400});}
 const {scenario,campusId,organization,context}=body||{};
 if(!permitted.has(scenario)||typeof campusId!=='string'||campusId.length>100||typeof organization!=='string'||organization.length>200||typeof context!=='string'||context.length>2500)return Response.json({error:'Invalid request'},{status:400});
 const db=database();const row:any=await db.prepare("SELECT payload FROM records WHERE owner=? AND kind='campuses' AND id=?").bind(access.scope,campusId).first();
 if(!row)return Response.json({error:'Select a saved campus'},{status:404});
 if(!campusAllowed(access.role,access.campusIds,{...JSON.parse(row.payload),id:campusId,kind:'campuses'},[]))return Response.json({error:'Campus access denied'},{status:403});
 return Response.json({approved:true,scenario,campusId,organization,context,notice:'Campus and role authorization verified. This endpoint does not call a generative AI provider or expose student records.'},{headers:{'Cache-Control':'no-store'}});
}
