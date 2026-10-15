import type {RecordData as R} from './training.ts';
import {attendanceEvidence} from './operations.ts';
import {activeSessions} from './training.ts';

export const fundingStages=['Draft','Awaiting authorization','Authorized','Closed','Denied','Expired'] as const;
const validDate=(s:any)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;

export function validateSponsorship(r:R){
 if(r.kind!=='sponsorships')return null;
 if(!fundingStages.includes(r.status))return 'Choose a valid funding approval status.';
 if(!r.studentId||!r.campusId||!r.agencyId)return 'Choose a student, campus and sponsoring organization.';
 const amount=Number(r.authorizedAmount);
 if(!Number.isFinite(amount)||amount<0||amount>1_000_000||Math.abs(amount*100-Math.round(amount*100))>1e-6)return 'Enter a nonnegative authorized amount with no more than two decimal places (up to $1 million).';
 if(!r.approvalDate&&r.status==='Authorized')return 'Enter the date of the written funding authorization.';
 for(const date of ['requestDate','approvalDate','expiresAt','startDate','endDate'])if(r[date]&&!validDate(r[date]))return 'Enter valid funding dates.';
 if(r.expiresAt&&r.approvalDate&&r.expiresAt<r.approvalDate)return 'Authorization cannot expire before it was issued.';
 if(r.endDate&&r.startDate&&r.endDate<r.startDate)return 'Covered training dates cannot end before they begin.';
 if(r.authorizationNumber!=null&&(typeof r.authorizationNumber!=='string'||r.authorizationNumber.length>160))return 'Authorization reference must be under 160 characters.';
 if(r.notes!=null&&(typeof r.notes!=='string'||r.notes.length>4000))return 'Funding notes must be under 4,000 characters.';
 if(r.status==='Authorized'&&(!r.authorizationNumber?.trim()||!r.authorizationDocumentKey))return 'Official authorization reference and verified agency document are required.';
 return null;
}
export function fundingEvidence(r:R,student:R,asOf:string){
 if(r.status==='Denied')return {status:'Denied',verified:false};
 if(r.status==='Closed')return {status:'Closed',verified:false};
 if(r.status==='Expired'||r.expiresAt&&r.expiresAt<asOf)return {status:'Expired',verified:false};
 const valid=r.status==='Authorized'&&!!r.approvalDate&&!!r.authorizationNumber&&!!r.authorizationDocumentKey&&
 (student.documents||[]).some((d:any)=>d.key===r.authorizationDocumentKey&&d.category==='Funding authorization'&&d.verified===true);
 return {status:valid?'Documented authorization':r.status==='Authorized'?'Authorization evidence missing':r.status,verified:!!valid};
}
export function sponsorProgressPacket(s:R,r:R,agency:R|undefined,from:string,to:string,asOf:string){
 if(!validDate(from)||!validDate(to)||to<from)throw Error('Choose valid report dates in order.');
 if(s.id!==r.studentId||s.campusId!==r.campusId)throw Error('Student and funding campus must match.');
 const evidence=fundingEvidence(r,s,asOf);
 const attendance=attendanceEvidence(s,from,to);
 const selected=activeSessions(s).filter(x=>x.date>=from&&x.date<=to);
 const counted=(phase:string)=>selected.filter(x=>x.phase===phase&&['Present','Late','Left early'].includes(x.attendance)).reduce((n,x)=>n+Number(x.hours||0),0);
 const driving=selected.filter(x=>x.phase==='Road'&&x.mode==='Student driving'&&x.studentOperatedVehicle===true).reduce((n,x)=>n+Number(x.hours||0),0);
 const observed=selected.filter(x=>x.phase==='Road'&&x.mode==='Observation').reduce((n,x)=>n+Number(x.hours||0),0);
 const dollars=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(r.authorizedAmount||0));
 const line=[
  'LONE STAR TRUCK DRIVING ACADEMY — INTERNAL SPONSOR PROGRESS DRAFT',
  'NOT AN INVOICE, PAYMENT RECEIPT, ELDT CERTIFICATE OR FMCSA REPORT',
  'Generated: '+asOf,
  'Student: '+s.name+' | Training program: '+(s.program||'Not entered'),
  'Campus ID: '+s.campusId+' | Class: '+(s.cohort||'Not assigned'),
  'Sponsor: '+(agency?.name||'Agency not available'),
  'Recorded funding stage: '+r.status+' | Evidence: '+evidence.status,
  'Authorization reference: '+(r.authorizationNumber||'Not recorded'),
  'Approved maximum amount: '+dollars+' (not proof that funds were received)',
  'Covered training dates: '+(r.startDate||'Not recorded')+' to '+(r.endDate||'Not recorded'),
  'Authorized through: '+(r.expiresAt||'Not entered'),
  'Requested progress period: '+from+' to '+to,
  'Recorded attendance entries: '+attendance.recorded+'; attendance recorded as present/late/left early: '+attendance.attended+'; recorded absent: '+attendance.absent+'; excused: '+attendance.excused,
  'Classroom instruction hours from entries: '+counted('Classroom').toFixed(2),
  'Yard instruction hours from entries: '+counted('Yard').toFixed(2),
  'Road instruction hours from entries: '+counted('Road').toFixed(2),
  'Actual student-operated road driving hours from entries: '+driving.toFixed(2),
  'Road observation hours from entries: '+observed.toFixed(2),
  'Missing dates are NOT treated as absences. A recorded entry is not an agency-verified payable service.',
  'Draft must be checked by campus management against original instructor records and the signed funding approval.',
  'No report is transmitted or shared automatically. Agency release and its permitted fields must be reviewed separately.'
 ];
 return {text:line.join('\n'),attendance,evidence,counts:{classroom:counted('Classroom'),yard:counted('Yard'),road:counted('Road'),driving,observation:observed}};
}
