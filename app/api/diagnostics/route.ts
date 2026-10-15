import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {database,bucket} from '../../../lib/storage';
import {encrypt,decrypt} from '../../../lib/encryption';

/** Safe owner-only encrypted R2 round-trip using random non-personal test data.
 * A successful check is technical evidence, not regulatory/operational certification. */
export async function POST(req:Request) {
 const access=await getWorkspaceAccess();
 if(!access)return Response.json({error:'Sign in required'},{status:401});
 if(access.role!=='Owner')return Response.json({error:'Owner access required'},{status:403});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 const id=crypto.randomUUID(),key=access.scope+'/'+id;
 let uploaded=false;
 const checkedAt=new Date().toISOString();
 const result:any={checkedAt,encryptedRoundTrip:false,bucketRoundTrip:false,temporaryObjectRemoved:false,databaseRead:false};
 try {
  const databaseRow:any=await database().prepare('SELECT COUNT(*) AS count FROM records WHERE owner=?').bind(access.scope).first();
  result.databaseRead=databaseRow!=null;
  const bytes=crypto.getRandomValues(new Uint8Array(48));
  const plain=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
  const encrypted=await encrypt(plain);
  if(encrypted.byteLength<=plain.byteLength)throw Error('Encryption unavailable');
  const restored=new Uint8Array(await decrypt(encrypted.buffer as ArrayBuffer));
  if(restored.length!==bytes.length||restored.some((v,i)=>v!==bytes[i]))throw Error('Encryption validation failed');
  result.encryptedRoundTrip=true;
  await bucket().put(key,encrypted,{httpMetadata:{contentType:'application/octet-stream'}});
  uploaded=true;
  const download=await bucket().get(key);
  if(!download)throw Error('Storage read unavailable');
  const cipher=await download.arrayBuffer();
  const reloaded=new Uint8Array(await decrypt(cipher));
  if(reloaded.length!==bytes.length||reloaded.some((v,i)=>v!==bytes[i]))throw Error('Storage round-trip failed');
  result.bucketRoundTrip=true;
 }catch(e){
  result.error='Technical storage diagnostic did not complete. Verify the configured encryption secret and R2 binding.';
 }finally{
  if(uploaded){try{await bucket().delete(key);result.temporaryObjectRemoved=true;}catch{result.error='Temporary non-personal diagnostic object could not be removed; contact school administrator.';}}
 }
 const passed=result.encryptedRoundTrip&&result.bucketRoundTrip&&result.temporaryObjectRemoved&&result.databaseRead;
 // No keys, payloads, secrets, or student records are returned or logged.
 try{await database().prepare('INSERT INTO audit(id,owner,record_id,action,at,payload,actor) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),access.scope,'__diagnostics__',passed?'Storage diagnostic passed':'Storage diagnostic failed',checkedAt,JSON.stringify({passed,encryptedRoundTrip:result.encryptedRoundTrip,bucketRoundTrip:result.bucketRoundTrip,temporaryObjectRemoved:result.temporaryObjectRemoved}),access.user.email).run();}catch{return Response.json({error:'Unable to retain diagnostic audit evidence.'},{status:503});}
 return Response.json({ok:passed,...result,notice:'This technical check does not verify real student uploads, cross-campus staff access, retention, backups, or regulatory approval.'},{status:passed?200:503,headers:{'Cache-Control':'no-store'}});
}
