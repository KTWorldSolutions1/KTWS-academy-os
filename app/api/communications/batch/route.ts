import {getWorkspaceAccess} from '../../../../lib/workspace-access';
import {database} from '../../../../lib/storage';
import {campusAllowed,campusOf} from '../../../../lib/enterprise';
import {messagePolicy} from '../../../../lib/communication-policy';
import {checkBatchRequest,expandMessageTemplate,OUTREACH_ROLES} from '../../../../lib/student-messaging';
import {POST as deliverSingle} from '../route';

const noStore={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(v:any,status=200)=>Response.json(v,{status,headers:noStore});
function maskRecipient(value:string,channel:string){
 if(channel==='Email'){const at=value.indexOf('@');return at>0?value.slice(0,1)+'***'+value.slice(at):'Email missing';}
 return value?value.slice(0,3)+'*****'+value.slice(-3):'Phone missing';
}
async function digest(text:string){
 const b=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));
 return [...b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
export async function POST(req:Request){
 const access=await getWorkspaceAccess();
 if(!access)return reply({error:'Sign in required.'},401);
 if(!OUTREACH_ROLES.includes(access.role))return reply({error:'Only authorized enrollment and school management staff may send student communications.'},403);
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Invalid origin.'},403);
 if(Number(req.headers.get('Content-Length')||0)>12000)return reply({error:'Too many recipients or message too long.'},413);
 let body:any;try{body=await req.json();}catch{return reply({error:'Invalid message request.'},400);}
 const problem=checkBatchRequest(body);if(problem)return reply({error:problem},400);
 const db=database(),rows:any=await db.prepare("SELECT payload FROM records WHERE owner=? AND kind IN ('students','campuses')").bind(access.scope).all();
 const records=rows.results.map((x:any)=>JSON.parse(x.payload));
 const campusById=new Map(records.filter((r:any)=>r.kind==='campuses').map((r:any)=>[r.id,r]));
 const recipientRows:any[]=body.studentIds.map((id:string)=>records.find((r:any)=>r.kind==='students'&&r.id===id));
 if(recipientRows.some((s:any)=>!s||!campusAllowed(access.role,access.campusIds,s,records)))return reply({error:'Selected students must all belong to campuses you are authorized to contact.'},403);
 const summary=recipientRows.map((student:any)=>{
  const campus:any=campusById.get(campusOf(student,records));
  const emailOrPhone=String(body.channel==='Email'?student.email||'':student.phone||'');
  const decision=student.status==='Withdrawn'?{ok:false,message:'Withdrawn students require an individual authorized review.'}:messagePolicy(body.channel,student,campus,new Date());
  const addressValid=body.channel==='Email'?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone):/^\+[1-9]\d{7,14}$/.test(emailOrPhone);
  const allowed=decision.ok&&addressValid;
  return {studentId:student.id,name:student.name,campusId:campus?.id||null,maskedRecipient:maskRecipient(emailOrPhone,body.channel),status:allowed?'Ready':'Excluded',
    reason:allowed?'Consent and sending window verified.':!decision.ok?decision.message:'Missing or invalid contact details.',
    message:allowed?expandMessageTemplate(body.body,student,campus):null,
    student};
 });
 // Include readiness and campus in preview hash so a changed consent or campus needs a fresh preview.
 const snapshot=summary.map(x=>({studentId:x.studentId,campusId:x.campusId,status:x.status,reason:x.reason}));
 const hash=await digest(JSON.stringify({batchId:body.batchId,channel:body.channel,subject:body.subject||'',body:body.body,ids:body.studentIds,readiness:snapshot}));
 const canSend=summary.filter(x=>x.status==='Ready');
 if(body.action==='preview')return reply({previewHash:hash,selected:summary.length,eligible:canSend.length,excluded:summary.length-canSend.length,
  recipients:summary.map(({student,...rest})=>rest),warning:'Only eligible opt-in recipients can be contacted. Preview is not a delivery. Messages cannot include sensitive enrollment files.'});
 if(body.previewHash!==hash)return reply({error:'Recipients, consent or message changed. Run Preview again before sending.'},409);
 if(canSend.length===0)return reply({error:'No eligible recipients. Nothing was sent.'},409);
 // Guard against unbounded high-volume outreach. School should use a dedicated
 // verified provider for large distribution lists rather than bypass this limit.
 const countRows:any=await db.prepare("SELECT COUNT(*) AS count FROM records WHERE owner=? AND kind='messages' AND json_extract(payload,'$.actor')=? AND json_extract(payload,'$.createdAt')>=?").bind(access.scope,access.user.email,new Date().toISOString().slice(0,10)+'T00:00:00Z').first();
 if(Number(countRows?.count||0)+canSend.length>150)return reply({error:'Daily outreach cap (150 attempted messages per staff account) reached. Ask a campus manager to review before any further outreach.'},429);
 const results:any[]=[];
 for(const entry of summary){
  if(entry.status!=='Ready'){results.push({studentId:entry.studentId,name:entry.name,status:'Excluded',reason:entry.reason});continue;}
  const singleId='message-'+(await digest(body.batchId+':'+entry.studentId)).slice(0,64);
  const outgoing={id:singleId,studentId:entry.studentId,channel:body.channel,subject:body.subject||'',body:entry.message,confirmSend:true};
  const forwarded=new Request(new URL('/api/communications',req.url),{method:'POST',headers:{Origin:new URL(req.url).origin,'Content-Type':'application/json'},body:JSON.stringify(outgoing)});
  try{
   const response=await deliverSingle(forwarded),json:any=await response.json();
   results.push({studentId:entry.studentId,name:entry.name,status:json.record?.status||'Not sent',reason:json.error||json.warning||null,messageRecordId:json.record?.id||null});
  }catch{
   results.push({studentId:entry.studentId,name:entry.name,status:'Outcome unknown',reason:'Could not confirm delivery. Check the provider and message history before retrying.'});
  }
 }
 return reply({batchId:body.batchId,selected:summary.length,accepted:results.filter(x=>x.status==='Accepted').length,
  unknown:results.filter(x=>x.status==='Outcome unknown').length,results,
  warning:'Provider Accepted is not proof of delivery. Do not retry Outcome unknown messages before checking the provider.'});
}
