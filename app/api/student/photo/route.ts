import {getWorkspaceAccess} from '../../../../lib/workspace-access';
import {self as studentSession} from '../route';
import {database,bucket} from '../../../../lib/storage';
import {decrypt} from '../../../../lib/encryption';
import {campusAllowed} from '../../../../lib/enterprise';
import {profilePhotoKey,STUDENT_PHOTO_CATEGORY} from '../../../../lib/student-documents';

const privateHeaders={'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"};
const allowedStaff=new Set(['Owner','Regional admin','Campus manager','Admin assistant','Enrollment specialist','Instructor','Front desk']);
const reject=(status:number)=>new Response(null,{status,headers:privateHeaders});
/** One authorized and verified portrait, used by school ID, staff/student profile,
 * and student portal. No unverified document or file key is exposed to the caller.
 * The generic file vault remains behind its separate production acceptance gate.
 */
export async function GET(req:Request){
 const access=await getWorkspaceAccess(),studentAuth=!access?await studentSession():null;
 if(!access&&!studentAuth)return reject(401);
 if(access&&!allowedStaff.has(access.role))return reject(403);
 const id=new URL(req.url).searchParams.get('studentId');
 if(!id||!/^[a-zA-Z0-9_-]{1,100}$/.test(id))return reject(400);
 const db=database(),owner=access?.scope||'academy-owner';
 const row:any=await db.prepare("SELECT payload FROM records WHERE owner=? AND kind='students' AND id=?").bind(owner,id).first();
 if(!row)return reject(404);
 const student=JSON.parse(row.payload);
 if(access&&!campusAllowed(access.role,access.campusIds,student,[student]))return reject(403);
 if(studentAuth&&(studentAuth.student.id!==student.id||studentAuth.student.campusId!==student.campusId))return reject(403);
 const key=profilePhotoKey(student);if(!key)return reject(404);
 const file:any=await db.prepare('SELECT key,category,mime,student,campus FROM school_files WHERE key=? AND owner=? AND student=? AND campus=?')
  .bind(key,owner,student.id,student.campusId).first();
 if(!file||file.category!==STUDENT_PHOTO_CATEGORY||!['image/jpeg','image/png'].includes(file.mime))return reject(404);
 try{
  const encrypted=await bucket().get(key);if(!encrypted)return reject(404);
  const clear=new Uint8Array(await decrypt(await encrypted.arrayBuffer()));
  // The stored file remains AES-GCM encrypted; the verified image is decoded
  // only for a currently authenticated, school-authorized viewer.
  return new Response(clear,{status:200,headers:{...privateHeaders,'Content-Type':file.mime}});
 }catch{return reject(503);}
}
