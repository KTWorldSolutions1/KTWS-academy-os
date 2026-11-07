import {getWorkspaceAccess} from '../../../../lib/workspace-access';
import {database,bucket} from '../../../../lib/storage';
import {decrypt} from '../../../../lib/encryption';
import {campusAllowed} from '../../../../lib/enterprise';
import {latestEvidence} from '../../../../lib/student-documents';
import {rosterGaps,studentRosterCsv,enrolledForClass} from '../../../../lib/compliance-roster';
import {createZip} from '../../../../lib/zip-packet';

const h={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const answer=(body:any,status=200)=>Response.json(body,{status,headers:h});
const enc=new TextEncoder();
export async function GET(req:Request){
 const access=await getWorkspaceAccess();
 if(!access||!['Owner','Regional admin','Campus manager'].includes(access.role))return answer({error:'Campus management authorization required.'},403);
 const url=new URL(req.url),classId=url.searchParams.get('classId'),download=url.searchParams.get('download')==='1';
 if(!classId||classId.length>100)return answer({error:'Select an existing class.'},400);
 try{
  const db=database(),rows:any=await db.prepare("SELECT payload FROM records WHERE owner=? AND kind IN ('classes','students','campuses')").bind(access.scope).all();
  const records=rows.results.map((r:any)=>JSON.parse(r.payload)),klass=records.find((r:any)=>r.id===classId&&r.kind==='classes');
  if(!klass||!campusAllowed(access.role,access.campusIds,klass,records))return answer({error:'Class is outside authorized campus.'},403);
  const campus=records.find((r:any)=>r.id===klass.campusId&&r.kind==='campuses');
  if(String(campus?.state||'').toUpperCase()!=='NC')return answer({error:'This is the North Carolina DMV roster template. Texas regulatory packet configuration requires separate approval.'},400);
  const students=records.filter((r:any)=>enrolledForClass(r,klass)).sort((a:any,b:any)=>a.name.localeCompare(b.name));
  const status=students.map((s:any)=>({studentId:s.id,name:s.name,gaps:rosterGaps(s,klass)}));
  const incomplete=status.filter((s:any)=>s.gaps.length>0);
  const now=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'}),draft=!klass.startDate||now<klass.startDate;
  if(!download)return answer({campus:campus.name,klass:{id:klass.id,name:klass.name,startDate:klass.startDate,endDate:klass.endDate},draft,count:students.length,ready:incomplete.length===0&&students.length>0,students:status,
   note:draft?'Pre-start review only. The school must validate the actual roster as of the FIRST day of class under 19A NCAC 03J .0308.':'Review actual student enrollment and contracts before submitting; this software does not transmit to NCDMV.'});
  if(!students.length||incomplete.length)return answer({error:'Roster packet blocked until all included student records and signed enrollment agreements are complete.',students:incomplete},409);
  if(draft)return answer({error:'The first-day roster cannot be issued as final before '+klass.startDate+'. Use the preview now, then download after verifying the actual opening roster.'},409);
  const files:{name:string;data:Uint8Array}[]=[
   {name:'NC_DMV_FIRST_DAY_ROSTER_'+klass.startDate+'.csv',data:enc.encode(studentRosterCsv(klass,students))},
   {name:'READ_ME.txt',data:enc.encode('LONE STAR NC DMV SCHOOL REPORTING PACKET\n'+campus.name+'\n'+klass.name+'\nClass start: '+klass.startDate+'\nClass end: '+klass.endDate+
    '\nGenerated: '+new Date().toISOString()+'\n\nContains sensitive personal data and executed agreements. Secure transfer to the authorized NCDMV CDL Compliance Section only. Never email this archive without approved transport and recipient validation.\nNC 19A NCAC 03J .0308 requires a class roster as of the first day of class including student name, address, telephone and driver license number and a copy of each student contract. DOB and funding details were requested by the school in addition to the specified roster fields. Verify recipient and required forms before sending. This packet has NOT been submitted by Academy OS.\n')}
  ];
  for(let index=0;index<students.length;index++){
   const student=students[index];
   const agreements=(student.documents||[]).filter((d:any)=>['Enrollment agreement','Signed contract'].includes(d.category)&&d.key&&d.verified);
   if(!agreements.length)return answer({error:'Signed agreement missing.'},409);
   for(let j=0;j<agreements.length;j++){
    const agreement=agreements[j];
    const meta:any=await db.prepare("SELECT * FROM school_files WHERE key=? AND owner=? AND student=? AND campus=?").bind(agreement.key,access.scope,student.id,klass.campusId).first();
    if(!meta||!['Enrollment agreement','Signed contract'].includes(meta.category))return answer({error:'Agreement file ownership requires review for '+student.name},409);
    const object=await bucket().get(meta.key);if(!object)return answer({error:'Verified agreement missing from protected storage. Packet blocked.'},503);
    const bytes=new Uint8Array(await decrypt(await object.arrayBuffer()));
    if(bytes.length>11000000)return answer({error:'An agreement exceeds the secure packet attachment limit.'},413);
    const mimeExt=meta.mime==='application/pdf'?'.pdf':meta.mime==='image/png'?'.png':meta.mime==='image/jpeg'?'.jpg':'.txt';
    files.push({name:'agreements/student_'+String(index+1).padStart(3,'0')+'_'+String(j+1)+'_'+meta.category.replace(/[^a-z]+/gi,'_')+mimeExt,data:bytes});
   }
  }
  const zip=createZip(files);
  await db.prepare('INSERT INTO audit(id,owner,record_id,action,at,payload,actor) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),access.scope,classId,'NC DMV first-day roster downloaded',new Date().toISOString(),JSON.stringify({count:students.length,agreements:files.length-2,containsDOB:true,containsDL:true,submitted:false}),access.user.email).run();
  return new Response(zip as any,{headers:{...h,'Content-Type':'application/zip','Content-Disposition':'attachment; filename="LoneStar_NC_DMV_Roster_'+klass.startDate+'.zip"','Content-Security-Policy':'sandbox'}});
 }catch(e){return answer({error:'The secured compliance packet could not be prepared. No submission was made.'},503);}
}
