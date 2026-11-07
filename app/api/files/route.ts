import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {self as studentSession} from '../student/route';
import {bucket,database} from '../../../lib/storage';
import {campusOf,campusAllowed,docCategories,restrictedCategories} from '../../../lib/enterprise';
import {STUDENT_PHOTO_CATEGORY,PUBLIC_RESOURCE_CATEGORY,REQUESTABLE_DOCUMENTS} from '../../../lib/student-documents';
import {encrypt,decrypt} from '../../../lib/encryption';
import {env} from '../../../lib/env';

const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function respond(v:any,status=200){return Response.json(v,{status,headers});}
function openUploads(){return String(env.SCHOOL_FILE_UPLOADS_ENABLED||'')==='true'||String(env.ACADEMY_TEST||'')==='true';}
function validSignature(bytes:Uint8Array,mime:string){
 if(mime==='application/pdf')return bytes.length>=5&&String.fromCharCode(...bytes.slice(0,5))==='%PDF-';
 if(mime==='image/png')return bytes.length>=8&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
 if(mime==='image/jpeg')return bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(mime==='text/plain')return bytes.length<1000000&&!bytes.includes(0);
 return false;
}
function cleanName(value:string){return value.replace(/[\u0000-\u001f\\/]/g,'').slice(0,150)||'School file';}
export async function POST(req:Request){
 const admin=await getWorkspaceAccess(),student=!admin?await studentSession():null;
 if(!admin&&!student)return respond({error:'Sign in required'},401);
 if(req.headers.get('origin')!==new URL(req.url).origin)return respond({error:'Invalid origin'},403);
 if(!openUploads())return respond({error:'Private file uploads remain paused pending the school encryption, recovery and privacy acceptance checks. Nothing has been stored.'},503);
 if(admin&&['Instructor','Front desk'].includes(admin.role))return respond({error:'Private student files require authorized administrative access.'},403);
 try{
  const data=await req.formData(),file=data.get('file'),studentId=String(data.get('studentId')||''),category=String(data.get('category')||'Other');
  const publicResource=category===PUBLIC_RESOURCE_CATEGORY;
  if(!(file instanceof File)||!file.size||file.size>10000000)return respond({error:'Choose a file smaller than 10 MB.'},400);
  if(!docCategories.includes(category))return respond({error:'Invalid document category.'},400);
  if(!['application/pdf','image/jpeg','image/png','text/plain'].includes(file.type))return respond({error:'Only PDF, JPG, PNG or text documents are accepted.'},400);
  if(category===STUDENT_PHOTO_CATEGORY&&(!['image/jpeg','image/png'].includes(file.type)||file.size>2000000))return respond({error:'ID photos must be JPG or PNG, under 2 MB.'},400);
  if(student&&(publicResource||category!==STUDENT_PHOTO_CATEGORY&&!REQUESTABLE_DOCUMENTS.includes(category)))return respond({error:'Students may only submit requested enrollment documents or profile photos.'},403);
  if(student&&category!=='Student profile photo'&&!(student.student.documentRequests||[]).some((r:any)=>r.status==='Requested'&&r.category===category))return respond({error:'Ask your campus to request this document before uploading.'},403);
  if(publicResource&&(!admin||!['Owner','Regional admin','Campus manager'].includes(admin.role)||studentId))return respond({error:'Only school management can publish a campus resource.'},403);
  if(admin&&restrictedCategories.includes(category)&&!['Owner','Regional admin','Campus manager'].includes(admin.role))return respond({error:'Restricted enrollment records require campus management access.'},403);
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(!validSignature(bytes,file.type))return respond({error:'File contents did not match the selected type.'},400);
  const db=database(),owner=admin?.scope||'academy-owner',person=student?.student;
  const targetStudentId=student?person.id:studentId;
  const rows:any=await db.prepare('SELECT payload FROM records WHERE owner=?').bind(owner).all();
  const records=rows.results.map((r:any)=>JSON.parse(r.payload));
  const target=publicResource?null:records.find((r:any)=>r.id===targetStudentId&&r.kind==='students');
  if(!publicResource&&(!target||student&&target.id!==person.id))return respond({error:'Select an authorized student.'},403);
  if(target&&admin&&!campusAllowed(admin.role,admin.campusIds,target,records))return respond({error:'Student is outside your campus.'},403);
  const campus=publicResource?String(data.get('campusId')||''):target?.campusId||campusOf(target,records);
  if(!campus||campus==='__legacy__'||!records.some((r:any)=>r.kind==='campuses'&&r.id===campus&&r.status==='Active'))return respond({error:'Choose an active school campus.'},400);
  if(publicResource&&!['Owner','Regional admin'].includes(admin.role)&&!admin.campusIds.includes(campus))return respond({error:'Resource campus is outside your access.'},403);
  const key=owner+'/'+crypto.randomUUID(),at=new Date().toISOString(),name=cleanName(file.name);
  await bucket().put(key,await encrypt(bytes.buffer),{httpMetadata:{contentType:'application/octet-stream'}});
  try{
   await db.prepare('INSERT INTO school_files (key,owner,campus,student,category,name,mime,actor,created) VALUES (?,?,?,?,?,?,?,?,?)').bind(key,owner,campus,target?.id||null,category,name,file.type,admin?.user.email||student.user.email,at).run();
   if(student){
    // A student's upload is attached to their own record immediately, pending campus review.
    const row:any=await db.prepare("SELECT payload,revision FROM records WHERE id=? AND owner=? AND kind='students'").bind(target.id,owner).first();
    const current=JSON.parse(row.payload);
    const docs=[...(current.documents||[]),{key,category,name,uploadedAt:at,uploadedBy:'Student portal',verified:false}];
    const updated=await db.prepare('UPDATE records SET payload=?,revision=revision+1,updated=? WHERE id=? AND owner=? AND revision=?')
     .bind(JSON.stringify({...current,documents:docs}),at,target.id,owner,row.revision).run();
    if(!updated.meta?.changes)throw Error('Concurrent student record update');
   }
   await db.prepare('INSERT INTO audit(id,owner,record_id,action,at,payload,actor) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),owner,target?.id||campus,'Encrypted file uploaded',at,JSON.stringify({category,publicResource,studentId:target?.id||null}),admin?.user.email||student.user.email).run();
  }catch(e){await db.prepare('DELETE FROM school_files WHERE key=?').bind(key).run();await bucket().delete(key);throw e;}
  return respond({key,name,category,encrypted:true,uploadedAt:at,uploadedBy:admin?.user.email||'Student portal',verified:false});
 }catch{return respond({error:'Secure upload unavailable; no attachment was confirmed. Please retry.'},503);}
}
export async function GET(req:Request){
 const admin=await getWorkspaceAccess(),student=!admin?await studentSession():null;
 if(!admin&&!student)return new Response('Sign in required',{status:401,headers});
 const url=new URL(req.url),key=url.searchParams.get('key'),list=url.searchParams.get('list')==='1';
 const owner=admin?.scope||'academy-owner',db=database();
 if(list){
  const campusId=student?.student.campusId||String(url.searchParams.get('campusId')||'');
  if(!campusId||(admin&&admin.role!=='Owner'&&!admin.campusIds.includes(campusId)))return respond({error:'Campus access denied.'},403);
  const resourceOnly=student||url.searchParams.get('category')===PUBLIC_RESOURCE_CATEGORY;
  const rows:any=await db.prepare('SELECT key,name,category,mime,created,campus,student FROM school_files WHERE owner=? AND campus=? ORDER BY created DESC').bind(owner,campusId).all();
  return respond({files:rows.results.filter((r:any)=>resourceOnly?r.category===PUBLIC_RESOURCE_CATEGORY:admin&&['Owner','Campus manager'].includes(admin.role)||r.category===PUBLIC_RESOURCE_CATEGORY).map((r:any)=>({key:r.key,name:r.name,category:r.category,created:r.created,studentId:r.student||null}))});
 }
 if(!key?.startsWith(owner+'/'))return new Response('Forbidden',{status:403,headers});
 try{
  const meta:any=await db.prepare('SELECT * FROM school_files WHERE key=? AND owner=?').bind(key,owner).first();
  if(!meta)return new Response('Document not found',{status:404,headers});
  if(student&&(meta.campus!==student.student.campusId||(meta.category!==PUBLIC_RESOURCE_CATEGORY&&meta.student!==student.student.id)))return new Response('Forbidden',{status:403,headers});
  // The student may retrieve shared resources, a file uploaded through their own portal,
  // or a school-verified profile photo. Other internal school evidence is staff-only.
  if(student&&meta.category!==PUBLIC_RESOURCE_CATEGORY&&meta.actor!==student.user.email&&!(meta.category===STUDENT_PHOTO_CATEGORY&&(student.student.documents||[]).some((d:any)=>d.key===meta.key&&d.verified===true)))return new Response('Student document unavailable',{status:403,headers});
  if(admin&&(!['Owner','Regional admin'].includes(admin.role)&&!admin.campusIds.includes(meta.campus)||restrictedCategories.includes(meta.category)&&!['Owner','Campus manager'].includes(admin.role)||['Instructor','Front desk'].includes(admin.role)))return new Response('Forbidden',{status:403,headers});
  const file=await bucket().get(key);if(!file)return new Response('Not found',{status:404,headers});
  const body=await decrypt(await file.arrayBuffer());
  await db.prepare('INSERT INTO audit(id,owner,record_id,action,at,payload,actor) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),owner,key,'Document accessed',new Date().toISOString(),JSON.stringify({category:meta.category,kind:'files'}),admin?.user.email||student?.user.email).run();
  const responseHeaders=new Headers({...headers,'Content-Type':meta.mime||'application/octet-stream','Content-Disposition':'attachment; filename="school-document"','Content-Security-Policy':'sandbox'});
  return new Response(body,{headers:responseHeaders});
 }catch{return new Response('Document unavailable',{status:503,headers});}
}
