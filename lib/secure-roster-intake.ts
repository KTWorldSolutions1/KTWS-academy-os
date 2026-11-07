/** Browser-only parser for school manager-authorized class intake.
 * PII stays in the admin browser until the manager confirms the protected API
 * write; never embed supplied DMV roster values in source code or demo data.
 */
export type IntakeRow={firstName:string;lastName:string;licenseNumber:string;licenseState:string;dob:string;startDate:string;endDate:string;phone:string;address:string;line:number};
export type IntakeParse={rows:IntakeRow[];errors:string[]};
const columns={
 firstName:['FIRST_NAME','FIRST NAME','FIRSTNAME','GIVEN NAME'],
 lastName:['LAST_NAME','LAST NAME','LASTNAME','SURNAME'],
 licenseNumber:['DL_NUMBER','DL NUMBER','DRIVER LICENSE','DRIVERS LICENSE NUMBER'],
 licenseState:['DL_STATE','DL STATE','LICENSE STATE'],
 dob:['DATE_OB','DOB','DATE OF BIRTH','BIRTHDATE'],
 startDate:['START_DATE','START DATE','CLASS START'],
 endDate:['END_DATE','END DATE','CLASS END'],
 phone:['PHONE NUMBER','PHONE','PHONE NUMBER:','MOBILE'],
 address:['ADDRESS','ADDRESS:','STREET ADDRESS']
} as const;
function normalize(v:string){return v.toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();}
function csvLine(line:string):string[]{
 const fields:string[]=[];let field='',quoted=false;
 for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){fields.push(field.trim());field='';}else field+=c;}
 fields.push(field.trim());return fields;
}
function isoDate(raw:string){
 const v=raw.trim();if(!v)return '';
 const iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
 if(iso){const d=new Date(Date.UTC(Number(iso[1]),Number(iso[2])-1,Number(iso[3])));return d.toISOString().slice(0,10)===v?v:'';}
 const us=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
 if(us){const m=Number(us[1]),day=Number(us[2]),year=Number(us[3]);const d=new Date(Date.UTC(year,m-1,day));return d.getUTCMonth()===m-1&&d.getUTCDate()===day?d.toISOString().slice(0,10):'';}
 const long=/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/.exec(v);
 if(long){const months=['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  const m=months.findIndex(x=>x===long[1].toUpperCase());if(m<0)return '';
  const year=Number(long[3]),day=Number(long[2]),d=new Date(Date.UTC(year,m,day));
  return d.getUTCMonth()===m&&d.getUTCDate()===day?d.toISOString().slice(0,10):'';
 }
 return '';
}
function cells(line:string,separator:'pipe'|'tab'|'csv'){
 if(separator==='pipe')return line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(x=>x.trim().replaceAll('\u00a0',' '));
 return separator==='tab'?line.split('\t').map(x=>x.trim()):csvLine(line);
}
export function parseEnrollmentRoster(input:string):IntakeParse{
 const errors:string[]=[],rows:IntakeRow[]=[];
 if(input.length>120000)return {rows:[],errors:['The roster exceeds the 120 KB paste limit. Use a separate class batch.']};
 const lines=input.split(/\r?\n/).map((line,i)=>({line,index:i+1})).filter(x=>x.line.trim());
 if(!lines.length)return {rows,errors:['Paste your DMV enrollment table, a CSV or tab-separated spreadsheet rows.']};
 const sep: 'pipe'|'tab'|'csv'=lines.filter(x=>x.line.trim().startsWith('|')).length>=2?'pipe':lines[0].line.includes('\t')?'tab':'csv';
 let headerIndex=-1,map:Record<string,number>={};
 for(let i=0;i<lines.length;i++){
  const h=cells(lines[i].line,sep).map(normalize);
  const candidate:Record<string,number>={};
  for(const [key,aliases] of Object.entries(columns)){const idx=h.findIndex(x=>aliases.some(a=>normalize(a)===x));if(idx>=0)candidate[key]=idx;}
  if(candidate.firstName!==undefined&&candidate.lastName!==undefined&&candidate.licenseNumber!==undefined){headerIndex=i;map=candidate;break;}
 }
 if(headerIndex<0)return {rows,errors:['Could not find FIRST_NAME, LAST_NAME and DL_NUMBER column headings. Use the existing DMV roster format.']};
 const required=['firstName','lastName','licenseNumber','licenseState','dob','startDate','endDate','phone','address'];
 for(const key of required)if(map[key]===undefined)errors.push('Missing required roster column: '+key+'.');
 if(errors.length)return {rows,errors};
 for(const {line,index} of lines.slice(headerIndex+1)){
  const data=cells(line,sep);
  if(data.every(x=>!x)||data.every(x=>/^[-:\s]+$/.test(x)))continue;
  const get=(key:string)=>(data[map[key]]||'').trim().replaceAll('\u00a0',' ');
  if(!get('firstName')&&!get('lastName'))continue;
  const row:IntakeRow={firstName:get('firstName'),lastName:get('lastName'),licenseNumber:get('licenseNumber'),
   licenseState:get('licenseState').toUpperCase(),dob:isoDate(get('dob')),startDate:isoDate(get('startDate')),
   endDate:isoDate(get('endDate')),phone:get('phone'),address:get('address'),line:index};
  const name=/^[\p{L} .'-]{1,90}$/u;
  if(!name.test(row.firstName)||!name.test(row.lastName)){errors.push('Line '+index+': invalid first or last name.');continue;}
  if(!/^[A-Za-z0-9-]{3,30}$/.test(row.licenseNumber)){errors.push('Line '+index+': invalid driver license number.');continue;}
  if(!/^[A-Z]{2}$/.test(row.licenseState)){errors.push('Line '+index+': invalid driver license state.');continue;}
  if(!row.dob||!row.startDate||!row.endDate||row.endDate<row.startDate){errors.push('Line '+index+': invalid DOB or class dates.');continue;}
  if(!row.phone||!row.address){errors.push('Line '+index+': missing telephone or mailing address.');continue;}
  rows.push(row);
 }
 if(rows.length>60)errors.push('Import up to 60 students at one time.');
 if(!rows.length&&!errors.length)errors.push('No student rows were found after the heading.');
 const dates=new Set(rows.map(r=>r.startDate+'|'+r.endDate));
 if(dates.size>1)errors.push('The roster contains multiple start/end date pairs. Separate each class and review the dates.');
 const seen=new Set<string>();
 for(const row of rows){
  const key=row.licenseState+'|'+row.licenseNumber;
  if(seen.has(key))errors.push('Duplicate driver license in pasted roster (line '+row.line+').');
  seen.add(key);
 }
 return {rows,errors};
}
export function nameKey(v:string){return v.toUpperCase().replace(/[^A-Z0-9]/g,'');}
export function rosterMatch(existing:any[],r:IntakeRow){
 const name=nameKey(r.firstName+' '+r.lastName);
 return existing.find(s=>s.kind==='students'&&(
  (!!s.licenseNumber&&String(s.licenseNumber).toUpperCase()===r.licenseNumber.toUpperCase()&&String(s.licenseState||s.dlState||'NC').toUpperCase()===r.licenseState)||
  (nameKey(String(s.name||''))===name&&s.dob===r.dob)
 ));
}
export function safeReference(license:string){return '•••• '+license.slice(-4);}
