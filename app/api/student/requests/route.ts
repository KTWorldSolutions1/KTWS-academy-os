import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {database} from '../../../lib/storage';
import {REQUESTABLE_DOCUMENTS,STUDENT_PHOTO_CATEGORY} from '../../../lib/student-documents';
import {campusAllowed} from '../../../lib/enterprise';
const noStore={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const respond=(body:any,status=200)=>Response.json(body,{status,headers:noStore});
export async function POST(req:Request){
 const access=await getWorkspaceAccess();
 if(!access||!['Owner','Campus manager'].includes(access.role))return respond({error:'School management authorization required.'},403);
 if(req.headers.get('origin')!==new URL(req.url).origin)return respond({error:'Invalid origin.'},403);
 let data:any;try{data=await req.json();}catch{return respond({error:'Invalid request.'},400);}
 const studentId=String(data.studentId||''),action=String(data.action||'');
 const db=database(),row:any=await db.prepare("SELECT payload,revision FROM records WHERE id=? AND owner=? AND kind='students'").bind(studentId,access.scope).first();
 if(!row)return respond({error:'Student record not found.'},404);
 const student=JSON.parse(row.payload);
 if(!campusAllowed(access.role,access.campusIds,student,[student]))return respond({error:'Campus access denied.'},403);
 const at=new Date().toISOString(),next={...student};
 if(action==='request'){
  const categories=Array.isArray(data.categories)?[...new Set(data.categories)]:[];
  if(!categories.length||categories.length>18||categories.some(c=>!REQUESTABLE_DOCUMENTS.includes(c)))return respond({error:'Select supported enrollment items.'},400);
  const note=String(data.message||'Please sign in to upload the requested school document.').slice(0,350);
  // Re-requesting a document produces a new notice; never invent an email or SMS delivery event.
  next.documentRequests=[...(student.documentRequests||[]).filter((r:any)=>!categories.includes(r.category)),...categories.map(category=>({category,status:'Requested',requestedAt:at,requestedBy:access.user.email,message:note}))];
 }else if(action==='verify'){
  const key=String(data.key||'');
  const proof:any=await db.prepare('SELECT key,category FROM school_files WHERE key=? AND owner=? AND student=? AND campus=?').bind(key,access.scope,student.id,student.campusId).first();
  if(!proof)return respond({error:'Only documents uploaded for this student can be verified.'},400);
  if(!Array.isArray(student.documents)||!student.documents.some((d:any)=>d.key===key&&d.category===proof.category))return respond({error:'Document has not been attached to this student.'},400);
  next.documents=student.documents.map((d:any)=>d.key===key?{...d,verified:true,reviewedBy:access.user.email,reviewedAt:at}:d);
 }else return respond({error:'Unsupported document action.'},400);
 const result=await db.prepare('UPDATE records SET payload=?,revision=revision+1,updated=? WHERE id=? AND owner=? AND revision=?').bind(JSON.stringify(next),at,student.id,access.scope,row.revision).run();
 if(!result.meta?.changes)return respond({error:'Student was updated by another user. Reload and retry.'},409);
 await db.prepare('INSERT INTO audit(id,owner,record_id,action,at,payload,actor) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),access.scope,student.id,action==='request'?'Student document requested in portal':'Student document verified',at,JSON.stringify(action==='request'?{categories:data.categories,delivery:'in-app only'}:{key:String(data.key||'')}),access.user.email).run();
 return respond({updated:true,notice:action==='request'?'Missing-item alerts are available in the student portal. No email or SMS was sent.':'Document marked verified.',revision:row.revision+1});
}
