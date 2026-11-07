/** Client-only, privacy-preserving validation of a user-selected CSV.
 * Never put real students, DL numbers, addresses, DOBs or agreements in source control,
 * demo fixtures, analytics, storage, or browser persistence.
 */
export const DMV_IMPORT_COLUMNS=['FIRST_NAME','LAST_NAME','DL_NUMBER','DL_STATE','DATE_OB','START_DATE','END_DATE','Phone Number:','Address:'] as const;
export type Candidate={name:string;licenseNumber:string;licenseState:string;dob:string;startDate:string;endDate:string;phone:string;address:string;city:string;state:string;zip:string};
function normalize(s:string){return s.toUpperCase().replace(/[^A-Z0-9]/g,'');}
export function parseCsv(csv:string):string[][]{
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 csv=csv.replace(/^\uFEFF/,'');
 for(let i=0;i<csv.length;i++){const ch=csv[i];
  if(quoted){if(ch==='"'&&csv[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}
  else if(ch==='"'){if(cell.length)throw Error('Malformed CSV quotation');quoted=true;}
  else if(ch===','){row.push(cell);cell='';}
  else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&csv[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}
  else cell+=ch;
 }
 if(quoted)throw Error('Unterminated quoted CSV value');
 row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 if(rows.length>501)throw Error('Import previews support at most 500 students');
 return rows;
}
function iso(s:string){
 const m=s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
 if(m){const [,mm,dd,yyyy]=m;const out=yyyy+'-'+mm.padStart(2,'0')+'-'+dd.padStart(2,'0');if(new Date(out+'T12:00:00Z').toISOString().slice(0,10)!==out)throw Error('Invalid calendar date');return out;}
 const named=Date.parse(s.trim()+' 12:00:00 GMT');
 if(!Number.isFinite(named))throw Error('Invalid date');
 return new Date(named).toISOString().slice(0,10);
}
export function previewDmvCsv(csv:string){
 const rows=parseCsv(csv);if(rows.length<2)throw Error('CSV needs a header and student rows');
 const keys=rows[0].map(normalize);
 const aliases:Record<string,string[]>={FIRST_NAME:['FIRSTNAME'],LAST_NAME:['LASTNAME'],DL_NUMBER:['DLNUMBER'],DL_STATE:['DLSTATE'],DATE_OB:['DATEOB','DOB','DATEOFBIRTH'],START_DATE:['STARTDATE'],END_DATE:['ENDDATE'],PHONE:['PHONENUMBER','PHONE'],ADDRESS:['ADDRESS']};
 const columns=Object.fromEntries(Object.entries(aliases).map(([k,a])=>[k,keys.findIndex(x=>a.includes(x))])) as Record<string,number>;
 const missing=Object.entries(columns).filter(([,index])=>index<0).map(([key])=>key);
 if(missing.length)throw Error('Missing CSV columns: '+missing.join(', '));
 const candidates:Candidate[]=[];const warnings:string[]=[];const seen=new Set<string>();
 for(const [ix,row] of rows.slice(1).entries()){
  const get=(k:string)=>(row[columns[k]]||'').trim();
  if(row.length!==rows[0].length)throw Error('Line '+(ix+2)+' has an unexpected number of columns');
  const name=(get('FIRST_NAME')+' '+get('LAST_NAME')).trim();
  const licenseNumber=get('DL_NUMBER'),licenseState=get('DL_STATE').toUpperCase();
  if(!name||!licenseNumber||!/^\d{5,18}$/.test(licenseNumber))throw Error('Line '+(ix+2)+' has missing/invalid name or DL number');
  if(!/^[A-Z]{2}$/.test(licenseState))throw Error('Line '+(ix+2)+' has invalid license state');
  const addr=get('ADDRESS');const match=addr.match(/^(.*?)\s+([A-Z]{2})\s+(\d{5})(?:-\d{4})?$/i);
  const startDate=iso(get('START_DATE')),endDate=iso(get('END_DATE')),dob=iso(get('DATE_OB'));
  if(startDate>endDate)throw Error('Line '+(ix+2)+' ends before it starts');
  const unique=licenseState+'|'+licenseNumber;if(seen.has(unique))throw Error('Repeated driver license in CSV, line '+(ix+2));seen.add(unique);
  if(!match)warnings.push('Row '+(ix+2)+': confirm address/city/state/ZIP in student profile');
  if(!/^\d{3}[- .]?\d{3}[- .]?\d{4}$/.test(get('PHONE')))warnings.push('Row '+(ix+2)+': confirm telephone');
  candidates.push({name,licenseNumber,licenseState,dob,startDate,endDate,phone:get('PHONE'),address:addr,city:'',state:match?.[2]?.toUpperCase()||'',zip:match?.[3]||''});
 }
 if(!candidates.length)throw Error('No student records found');
 const dates=new Set(candidates.map(r=>r.startDate+'|'+r.endDate));
 if(dates.size>1)warnings.push('Multiple class date ranges found; review assignments before enrolling');
 return {count:candidates.length,candidates,warnings,dates:[...dates]};
}

/** Minimal school roster for authenticated profile creation.
 * Contains names and optional school-issued student numbers only; never
 * assumes compliance fields, financial approval, licenses or training evidence.
 */
export function previewBasicCohortCsv(csv:string){
 const rows=parseCsv(csv);
 if(rows.length<2)throw Error('CSV needs a heading and at least one student.');
 const keys=rows[0].map(normalize);
 const col=(...names:string[])=>keys.findIndex(k=>names.includes(k));
 const first=col('FIRSTNAME'),last=col('LASTNAME'),studentId=col('STUDENTID','STUDENTNUMBER');
 if(first<0||last<0)throw Error('Roster must contain FIRST_NAME and LAST_NAME columns.');
 const get=(row:string[],...names:string[])=>{const i=col(...names);return i<0?'':row[i]?.trim()||'';};
 const seenNames=new Set<string>(),seenIds=new Set<string>(),warnings:string[]=[],candidates:(Candidate&{studentNumber?:string;email?:string})[]=[];
 rows.slice(1).forEach((row,i)=>{
  if(row.length!==rows[0].length)throw Error('Line '+(i+2)+' has an unexpected number of columns');
  const name=(row[first].trim()+' '+row[last].trim()).trim(),number=studentId<0?'':row[studentId].trim();
  if(!name||name.split(/\s+/).length<2)throw Error('Line '+(i+2)+' must contain a first and last name.');
  const key=normalize(name);
  if(seenNames.has(key))throw Error('Duplicate student name in line '+(i+2));seenNames.add(key);
  if(number){if(!/^[A-Za-z0-9-]{3,32}$/.test(number))throw Error('Invalid school student ID on line '+(i+2));
   if(seenIds.has(number))throw Error('Duplicate school student ID in line '+(i+2));seenIds.add(number);}
  const phone=get(row,'PHONE','PHONENUMBER'),zip=get(row,'ZIP','ZIPCODE'),state=get(row,'STATE').toUpperCase();
  const email=get(row,'EMAIL','EMAILADDRESS');
  if(phone&&!/^[0-9()+ .-]{7,24}$/.test(phone))throw Error('Invalid telephone on line '+(i+2));
  if(zip&&!/^\d{5}(?:-\d{4})?$/.test(zip))throw Error('Invalid ZIP on line '+(i+2));
  if(state&&!/^[A-Z]{2}$/.test(state))throw Error('Invalid state on line '+(i+2));
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Invalid email on line '+(i+2));
  candidates.push({name,studentNumber:number,licenseNumber:'',licenseState:'',dob:'',startDate:'',endDate:'',
   phone,address:get(row,'ADDRESS','STREETADDRESS'),city:get(row,'CITY'),state,zip,email});
 });
 warnings.push('Unsigned/unverified documents, DOB, driver license, permit, attendance and funding remain unverified. Review handwritten entries against source agreements.');
 return {count:candidates.length,candidates,warnings,dates:[] as string[]};
}

/** Updates existing class students without fabricating attendance or signed agreements.
 * No customer data is ever bundled with the app.
 */
export function previewStudentReconciliationCsv(csv:string){
 const rows=parseCsv(csv);if(rows.length<2)throw Error('Reconciliation CSV must include a header and student rows.');
 const headers=rows[0].map(normalize),index=(key:string)=>headers.indexOf(key);
 if(index('STUDENTID')<0||index('FIRSTNAME')<0||index('LASTNAME')<0)throw Error('Use STUDENT_ID,FIRST_NAME,LAST_NAME columns to match existing student accounts.');
 const get=(row:string[],key:string)=>index(key)<0?'':String(row[index(key)]||'').trim();
 const seen=new Set<string>();
 const candidates=rows.slice(1).map((row,i)=>{
  if(row.length!==headers.length)throw Error('Line '+(i+2)+' has a wrong column count.');
  const studentNumber=get(row,'STUDENTID'),name=(get(row,'FIRSTNAME')+' '+get(row,'LASTNAME')).trim();
  if(!studentNumber||!name||seen.has(studentNumber))throw Error('Line '+(i+2)+' is missing student ID/name or has a duplicate student ID.');seen.add(studentNumber);
  const fundingType=get(row,'FUNDINGTYPE').toUpperCase(),status=get(row,'STATUS'),registrationStatus=get(row,'REGISTRATIONSTATUS');
  if(fundingType&&!['WIOA','WRLP','CASH','SELF-PAY','EMPLOYER-SPONSORED','SCHOLARSHIP','VOCATIONAL REHABILITATION','OTHER'].includes(fundingType))throw Error('Unrecognized funding type, line '+(i+2));
  if(status&&!['Enrollment pending','Enrolled','Waiting for permit','Classroom','Yard','Road','Test preparation','Graduated','Withdrawn'].includes(status))throw Error('Unrecognized student stage, line '+(i+2));
  if(registrationStatus&&!['Enrolled','Enrollment pending'].includes(registrationStatus))throw Error('Unrecognized registration status, line '+(i+2));
  const reported=get(row,'REPORTEDCLASSROOMHOURS');
  if(reported&&(!/^\\d+(?:\\.\\d+)?$/.test(reported)||Number(reported)>160))throw Error('Invalid reported classroom hours, line '+(i+2));
  const phone=get(row,'PHONE'),email=get(row,'EMAIL'),state=get(row,'STATE').toUpperCase(),zip=get(row,'ZIP');
  if(phone&&!/^[0-9()+ .-]{7,24}$/.test(phone))throw Error('Invalid telephone, line '+(i+2));
  if(email&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))throw Error('Invalid email, line '+(i+2));
  if(state&&!/^[A-Z]{2}$/.test(state))throw Error('Invalid state, line '+(i+2));
  if(zip&&!/^\\d{5}(?:-\\d{4})?$/.test(zip))throw Error('Invalid ZIP, line '+(i+2));
  return {studentNumber,name,fundingType,status,registrationStatus,reportedClassroomHours:reported===''?null:Number(reported),phone,email,address:get(row,'ADDRESS'),city:get(row,'CITY'),state,zip};
 });
 return {candidates,count:candidates.length};
}
