import type {RecordData as R} from './training.ts';

/**
 * Private DMV enrollment roster parser. No personally identifiable data is
 * embedded in the repository or transmitted while the office previews the file.
 * Import requires explicit campus-manager approval in authenticated Academy OS.
 */
export type IntakeRow={
 line:number;name:string;firstName:string;lastName:string;licenseNumber:string;licenseState:string;
 dob:string;startDate:string;endDate:string;phone:string;address:string;city:string;state:string;zip:string;
 issues:string[];
};
export type IntakePreview={rows:IntakeRow[];issues:string[]};
const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
const CITY_CHOICES=['Greensboro','High Point','Sandy Ridge','Winston Salem','Winston-Salem','Burlington','Lexington','Asheboro','Reidsville','Kernersville','Henderson','Eden','Charlotte','Durham','Raleigh','Gibsonville','Archdale','Summerfield','Jamestown','Whitsett','Thomasville','Rockingham'];
const addressPattern=/^(.*?)\s+(NC|SC|VA|TN|TX|GA|FL)\s+(\d{5})(?:-\d{4})?$/i;
function clean(s:any){return String(s??'').replace(/\u00a0/g,' ').trim().replace(/\s+/g,' ');}
function title(s:string){return clean(s).toLowerCase().replace(/(^|[\s'-])([a-z])/g,(_whole,p:string,l:string)=>p+l.toUpperCase());}
function canonicalHeader(s:string){return clean(s).replace(/[^A-Za-z0-9]/g,'').toUpperCase();}
export function parseSchoolDate(v:string){
 const raw=clean(v);
 const iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
 if(iso){const test=new Date(raw+'T12:00:00Z');return Number.isFinite(test.getTime())&&test.toISOString().slice(0,10)===raw?raw:'';}
 const mdy=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
 if(mdy)return parseSchoolDate(mdy[3]+'-'+mdy[1].padStart(2,'0')+'-'+mdy[2].padStart(2,'0'));
 const text=raw.match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i);
 if(text){const idx=months.indexOf(text[1].toLowerCase());return idx<0?'':parseSchoolDate(text[3]+'-'+String(idx+1).padStart(2,'0')+'-'+text[2].padStart(2,'0'));}
 return '';
}
export function parseNorthCarolinaAddress(input:string){
 const text=clean(input),m=text.match(addressPattern);
 if(!m)return {address:'',city:'',state:'',zip:'',issue:'Street, city, state and ZIP could not be separated.'};
 const left=clean(m[1]),state=m[2].toUpperCase(),zip=m[3];
 // Only exact, known city endings are automatically split. Others require a human review.
 const city=CITY_CHOICES.filter(c=>left.toLowerCase().endsWith(' '+c.toLowerCase())||left.toLowerCase()===c.toLowerCase()).sort((a,b)=>b.length-a.length)[0];
 if(!city)return {address:'',city:'',state,zip,issue:'City is unrecognized. Edit the address before saving.'};
 const address=clean(left.slice(0,-city.length));
 if(!address)return {address:'',city,state,zip,issue:'Missing street address.'};
 return {address,city,state,zip,issue:''};
}
function lineFields(line:string){
 if(line.includes('|'))return line.split('|').slice(1,-1).map(clean);
 if(line.includes('\t'))return line.split('\t').map(clean);
 // RFC 4180 basic CSV, supporting commas inside double-quoted fields.
 const fields:string[]=[];let part='',quoted=false;
 for(let i=0;i<line.length;i++){const ch=line[i];
  if(ch==='"'){if(quoted&&line[i+1]==='"'){part+='"';i++;}else quoted=!quoted;}
  else if(ch===','&&!quoted){fields.push(clean(part));part='';}
  else part+=ch;
 }
 fields.push(clean(part));return fields;
}
function cell(row:string[],names:string[],header:string[]){
 for(const n of names){const idx=header.indexOf(n);if(idx>=0)return row[idx]||'';}
 return '';
}
export function parseDmvEnrollmentRoster(text:string):IntakePreview{
 const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/);
 const headerAt=lines.findIndex(line=>{const h=lineFields(line).map(canonicalHeader);return h.includes('FIRSTNAME')&&h.includes('LASTNAME')&&(h.includes('DLNUMBER')||h.includes('DRIVERSLICENSENUMBER'));});
 if(headerAt<0)return {rows:[],issues:['Could not find the FIRST_NAME, LAST_NAME and DL_NUMBER column headers. Paste the full DMV roster table or upload a CSV/TSV export.']};
 const headers=lineFields(lines[headerAt]).map(canonicalHeader),rows:IntakeRow[]=[],issues:string[]=[];
 for(let i=headerAt+1;i<lines.length;i++){
  const raw=lines[i].trim();if(!raw||/^\|?\s*[-:|\s]+$/.test(raw))continue;
  const cells=lineFields(lines[i]);if(cells.length<7||cells.every(c=>!c||/^[-:]+$/.test(c)))continue;
  const firstName=title(cell(cells,['FIRSTNAME','GIVENNAME'],headers)),lastName=title(cell(cells,['LASTNAME','SURNAME'],headers));
  const licenseNumber=clean(cell(cells,['DLNUMBER','DRIVERSLICENSENUMBER','LICENSENUMBER'],headers));
  const licenseState=clean(cell(cells,['DLSTATE','LICENSINGSTATE'],headers)).toUpperCase();
  const dob=parseSchoolDate(cell(cells,['DATEOB','DOB','DATEOFBIRTH'],headers));
  const startDate=parseSchoolDate(cell(cells,['STARTDATE','CLASSSTARTDATE'],headers));
  const endDate=parseSchoolDate(cell(cells,['ENDDATE','CLASSENDDATE'],headers));
  const phone=clean(cell(cells,['PHONENUMBER','PHONE','TELEPHONE'],headers));
  const fullAddress=clean(cell(cells,['ADDRESS','MAILINGADDRESS','STREETADDRESS'],headers));
  const parsedAddress=parseNorthCarolinaAddress(fullAddress),rowIssues:string[]=[];
  if(!firstName||!lastName)rowIssues.push('Missing legal name.');
  if(!/^\d{5,20}$/.test(licenseNumber))rowIssues.push('Driver license number needs verification.');
  if(!/^[A-Z]{2}$/.test(licenseState))rowIssues.push('Driver license issuing state missing.');
  if(!dob)rowIssues.push('Date of birth invalid or missing.');
  if(!startDate||!endDate||endDate<startDate)rowIssues.push('Class start/end dates invalid.');
  if(!/^\d{3}-?\d{3}-?\d{4}$/.test(phone))rowIssues.push('Telephone format needs review.');
  if(parsedAddress.issue)rowIssues.push(parsedAddress.issue);
  rows.push({line:i+1,firstName,lastName,name:clean(firstName+' '+lastName),licenseNumber,licenseState,
   dob,startDate,endDate,phone,address:parsedAddress.address,city:parsedAddress.city,state:parsedAddress.state,zip:parsedAddress.zip,issues:rowIssues});
  if(rows.length>60){issues.push('Import limited to 60 students per batch. Split the roster into separate files.');break;}
 }
 const keySet=new Set<string>();
 for(const row of rows){const key=row.licenseState+':'+row.licenseNumber;if(keySet.has(key))row.issues.push('Repeated driver license in the imported roster.');keySet.add(key);}
 if(!rows.length)issues.push('No valid data rows were found below the header.');
 const classDates=new Set(rows.map(r=>r.startDate+'|'+r.endDate));
 if(classDates.size>1)issues.push('Multiple class start/end periods detected. Import each cohort separately.');
 return {rows,issues};
}
export function intakeMatch(row:IntakeRow,students:R[],campusId:string){
 const inCampus=students.filter(s=>s.kind==='students'&&s.campusId===campusId);
 const sameLicense=inCampus.filter(s=>s.licenseNumber&&s.licenseState===row.licenseState&&s.licenseNumber===row.licenseNumber);
 if(sameLicense.length===1&&sameLicense[0].dob&&sameLicense[0].dob!==row.dob)return {type:'conflict',existing:sameLicense[0],reason:'License matches but DOB differs. Manual verification required.'} as const;
 if(sameLicense.length===1)return {type:'existing',existing:sameLicense[0],reason:'Student already exists with this license.'} as const;
 if(sameLicense.length>1)return {type:'conflict',existing:null,reason:'Multiple school records share this license. Resolve duplicates.'} as const;
 const named=inCampus.filter(s=>clean(s.name).toLowerCase()===row.name.toLowerCase()&&s.dob===row.dob);
 if(named.length===1&&named[0].licenseNumber&&named[0].licenseNumber!==row.licenseNumber)return {type:'conflict',existing:named[0],reason:'Name and DOB match another license. Verify identity before import.'} as const;
 if(named.length===1)return {type:'existing',existing:named[0],reason:'Student already exists by legal name and DOB.'} as const;
 if(named.length>1)return {type:'conflict',existing:null,reason:'Multiple students share this name and DOB. Resolve duplicates.'} as const;
 return {type:'new',existing:null,reason:'New student record will be created.'} as const;
}
export function buildIntakeStudent(row:IntakeRow,campusId:string,classId:string,recordId:string):R{
 if(row.issues.length)throw Error('Cannot import an unresolved DMV roster row.');
 return {id:recordId,kind:'students',campusId,classId,name:row.name,firstName:row.firstName,lastName:row.lastName,
  status:'Enrollment pending',program:'Class A',cohort:'Class A • '+row.startDate,
  dob:row.dob,licenseNumber:row.licenseNumber,licenseState:row.licenseState,phone:row.phone,
  address:row.address,city:row.city,state:row.state,zip:row.zip,startDate:row.startDate,endDate:row.endDate,
  fundingType:'',fundingStatus:'Needs funding verification',targetTheory:50,targetYard:50,targetRoad:60,
  notes:[],assessments:[],sessions:[],evaluations:[],documents:[],
  documentRequests:[{category:'Enrollment agreement',status:'Requested',requestedAt:new Date().toISOString(),requestedBy:'Campus admissions import',
   message:'Please upload your signed enrollment agreement for campus verification.'}],
  enrollmentSource:'Authorized school roster import',enrollmentDocumentStatus:'Awaiting actual signed agreement',showBirthdayOnCalendar:false};
}
