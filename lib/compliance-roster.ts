import {latestEvidence} from './student-documents.ts';
export const FUNDING_TYPES=['Cash','WIOA','WRLP','Vocational Rehabilitation','Employer-sponsored','Scholarship','Other outside funding'] as const;
export function dateAddDays(iso:string,days:number){const d=new Date(iso+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)||!Number.isFinite(d.getTime()))throw Error('Invalid ISO date');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export function proposedBiweeklyStarts(start='2026-11-16',count=6){return Array.from({length:Math.min(20,Math.max(0,count))},(_,i)=>dateAddDays(start,14*i));}
export function classEnding(start:string){return dateAddDays(start,32);} // Five weeks, Monday start → Friday end.
export function enrolledForClass(s:any,klass:any){return s?.kind==='students'&&s?.classId===klass.id&&s?.campusId===klass.campusId&&s?.status!=='Withdrawn';}
export function rosterGaps(student:any,klass:any){
 const missing:string[]=[];
 if(!student.name?.trim())missing.push('full name');
 if(!student.licenseNumber?.trim())missing.push('driver license number');
 if(!student.dob||!/^(19|20)\d{2}-\d{2}-\d{2}$/.test(student.dob))missing.push('valid DOB');
 if(!student.phone?.trim())missing.push('telephone');
 if(!student.address?.trim()||!student.city?.trim()||!student.state?.trim()||!student.zip?.trim())missing.push('mailing address');
 if(!klass.startDate||!klass.endDate)missing.push('class start/end dates');
 const agreement=latestEvidence(student,'Enrollment agreement');
 if(!agreement?.key||agreement.verified!==true)missing.push('verified signed enrollment agreement');
 // Regulations require any student contract(s). Do not mistake a signed contract template for student executed evidence.
 return missing;
}
export function safeCsvField(value:any){
 let s=String(value??'').replace(/[\r\n\t]/g,' ').trim();
 if(/^[=+@-]/.test(s))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
export function studentRosterCsv(klass:any,students:any[]){
 const headings=['Student name','Driver license number','Date of birth','Telephone','Street address','City','State','ZIP','Class start date','Class end date','Payment / funding type','Funding agency','Student ID','Agreement filename'];
 return [headings,...students.map(s=>[s.name,s.licenseNumber,s.dob,s.phone,s.address,s.city,s.state,s.zip,klass.startDate,klass.endDate,s.fundingType||'',s.fundingAgency||'',s.studentNumber||'',latestEvidence(s,'Enrollment agreement')?.name||''])].map(row=>row.map(safeCsvField).join(',')).join('\r\n')+'\r\n';
}
