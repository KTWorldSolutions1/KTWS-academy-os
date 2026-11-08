/** FMCSA TPR Training Provider Web Service v1.2 payload and signing.
 * Source: https://tpr.fmcsa.dot.gov/Learn/DeveloperToolkit
 * This library NEVER sends anything on its own. Only approved server-side
 * action with school-owned FMCSA Web Service secrets may transmit.
 */
export type TrainingKind='Theory'|'Range'|'PublicRoad';
export type TrainingForm={
 firstName:string;lastName:string;dateOfBirth:string;number:string;state:string;
 classCode:'A'|'B'|'P'|'S'|'H';applicationType?:'New'|'Upgrade';
 trainingType:TrainingKind;completionDate:string;
 trainingMethod?:'Inperson'|'Online';score?:number;hours?:number;
};
const realDate=(d:any)=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
export function validateTrainingForm(f:TrainingForm,providerId:string){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerId))return 'Registered TPR training-location GUID is required';
 if(!f||typeof f!=='object')return 'Training data required';
 if(!f.firstName?.trim()||f.firstName.length>100||!f.lastName?.trim()||f.lastName.length>100)return 'Verify driver first and last name against official documents';
 if(!f.number?.trim()||f.number.length>50||!realDate(f.dateOfBirth)||!realDate(f.completionDate))return 'Verify learner permit/license, date of birth and training completion date';
 if(!/^(?:US-)?[A-Z]{2}$/.test(f.state||''))return 'State must be a valid US state code (e.g. NC)';
 if(!['A','B','P','S','H'].includes(f.classCode)||!['Theory','Range','PublicRoad'].includes(f.trainingType))return 'Valid ELDT class/endorsement and training type required';
 if(['A','B'].includes(f.classCode)&&!['New','Upgrade'].includes(f.applicationType||''))return 'Class A/B submissions require New or Upgrade application type';
 if(f.trainingType==='Theory'){
  if(!['Inperson','Online'].includes(f.trainingMethod||'')||!Number.isInteger(f.score)||Number(f.score)<80||Number(f.score)>100)return 'Theory requires a verified training method and final score of 80–100';
 }else if(typeof f.hours!=='number'||!Number.isFinite(f.hours)||f.hours<=0||f.hours>1000)return 'Range/PublicRoad requires verified actual behind-the-wheel hours';
 if(Date.parse(f.completionDate+'T12:00:00Z')>Date.now()+86400000)return 'Completion date cannot be in the future';
 return null;
}
export function trainingBody(f:TrainingForm,providerLocationId:string,internalId:string){
 const problem=validateTrainingForm(f,providerLocationId);if(problem)throw Error(problem);
 return {
  Number:f.number.trim(),State:f.state.startsWith('US-')?f.state:'US-'+f.state,
  FirstName:f.firstName.trim(),LastName:f.lastName.trim(),DateOfBirth:f.dateOfBirth,
  ClassEndorsementCode:f.classCode,
  ...(['A','B'].includes(f.classCode)?{ApplicationType:f.applicationType}:{}),
  ProviderLocationId:providerLocationId,
  TrainingElements:[{
   TrainingType:f.trainingType,CompletionDate:f.completionDate,
   ...(f.trainingType==='Theory'?{TrainingMethod:f.trainingMethod,Score:f.score}:{Hours:String(f.hours)}),
   InternalId:internalId.slice(0,255)
  }]
 };
}
function b64(bytes:Uint8Array){let s='';for(const x of bytes)s+=String.fromCharCode(x);return btoa(s).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');}
export async function signedJwt(issuer:string,pem:string,nowSeconds=Math.floor(Date.now()/1000)){
 if(!issuer||issuer.length>200||!/-----BEGIN PRIVATE KEY-----/.test(pem)||!/-----END PRIVATE KEY-----/.test(pem))throw Error('Authorized FMCSA credential ID and PKCS8 private key required');
 const stripped=pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');
 const raw=atob(stripped),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 const key=await crypto.subtle.importKey('pkcs8',bytes,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const h=b64(new TextEncoder().encode(JSON.stringify({alg:'RS256',typ:'JWT'})));
 const p=b64(new TextEncoder().encode(JSON.stringify({nbf:nowSeconds,exp:nowSeconds+600,iss:issuer})));
 const input=h+'.'+p;
 const signature=new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(input)));
 return input+'.'+b64(signature);
}
