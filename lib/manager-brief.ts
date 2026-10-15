import type {RecordData as R} from './training';
import {studentOperationalFlags} from './academy-scenarios';

export function weeklyManagerBrief(records:R[],asOf:string){
 const date=/^\d{4}-\d{2}-\d{2}$/.test(asOf)?asOf:new Date().toISOString().slice(0,10);
 const plus=(days:number)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
 const students=records.filter(r=>r.kind==='students'),leads=records.filter(r=>r.kind==='leads');
 const active=students.filter(r=>!['Graduated','Withdrawn'].includes(r.status));
 const classes=records.filter(r=>r.kind==='classes'),tasks=records.filter(r=>r.kind==='tasks');
 const campus=records.filter(r=>r.kind==='campuses'&&r.status!=='Inactive').map(r=>r.name);
 const counts=(rows:R[],statuses:string[])=>statuses.map(s=>s+': '+rows.filter(r=>r.status===s).length).join('  |  ');
 const upcoming=records.filter(r=>r.kind==='appointments'&&r.outreachEvent&&r.date>=date&&r.date<=plus(30));
 const pendingFunding=students.filter(r=>r.fundingStatus==='Pending authorization').length+records.filter(r=>r.kind==='enrollments'&&r.fundingMethod==='Pending authorization').length;
 const openTasks=tasks.filter(r=>r.status!=='Complete'),overdue=openTasks.filter(r=>r.due&&r.due<date),upcomingTasks=openTasks.filter(r=>r.due&&r.due>=date&&r.due<=plus(7));
 const attention=students.flatMap(s=>studentOperationalFlags(s,date)),missingAttendance=attention.filter(a=>a.code==='ATTENDANCE_MISSING').length;
 const fleet=records.filter(r=>r.kind==='fleet'),staff=records.filter(r=>r.kind==='staff'&&r.status==='Active');
 const partner=records.filter(r=>r.kind==='partners'),readyVehicles=fleet.filter(r=>r.status==='Ready').length;
 const gaps:string[]=[];
 if(pendingFunding)gaps.push(pendingFunding+' saved funding authorization item(s) still awaiting confirmation');
 if(missingAttendance)gaps.push(missingAttendance+' currently active student(s) without recorded attendance on the selected day (not classified as absent)');
 if(overdue.length)gaps.push(overdue.length+' assigned follow-up(s) past the recorded due date');
 if(!readyVehicles)gaps.push('No training vehicle is explicitly marked Ready in the current record scope; confirm fleet status');
 if(!staff.length)gaps.push('No active employee record appears in the current scope; confirm staffing and credentials');
 if(!classes.some(r=>['Open for enrollment','In progress'].includes(r.status)))gaps.push('No open or in-progress class records appear; confirm current cohort dates');
 const report=[
  'LONE STAR TRUCK DRIVING ACADEMY — WEEKLY CAMPUS MANAGER BRIEF',
  'As of: '+date,'Campuses in this report: '+(campus.join(', ')||'No active campus records in current scope'),
  'Prepared from saved Academy OS records; figures are not externally verified.',
  '',
  'Hello Alisha and Manny,',
  'Here is a summary of the school activity currently documented in Academy OS, along with the areas where additional coordination may be helpful.',
  '',
  'STUDENT ENROLLMENT & TRAINING',
  'Active student records: '+active.length+'  |  Total student records: '+students.length,
  counts(students,['Enrollment pending','Classroom','Yard','Road','Test preparation','Graduated']),
  'Lead records: '+leads.length+'  |  '+counts(leads,['New inquiry','Contacted','Tour scheduled','Funding pending','Ready to enroll','Enrolled']),
  'Classes currently open or in progress: '+classes.filter(r=>['Open for enrollment','In progress'].includes(r.status)).length,
  'Upcoming classes (next 21 days): '+classes.filter(r=>r.startDate>=date&&r.startDate<=plus(21)).length,
  '',
  'OPERATIONS & STUDENT SUPPORT',
  'Active employees in current scope: '+staff.length,
  'Training vehicles marked Ready: '+readyVehicles+' of '+fleet.length+' records',
  'Open assigned follow-ups: '+openTasks.length+'  |  Due within 7 days: '+upcomingTasks.length+'  |  Past due: '+overdue.length,
  'Student-support attention flags: '+attention.length+'  |  Attendance not yet recorded today: '+missingAttendance,
  '',
  'PARTNERSHIPS, FUNDING & OUTREACH',
  'Saved partner/vendor relationships: '+partner.length,
  'Funding authorizations recorded as pending: '+pendingFunding,
  'Outreach events in next 30 days: '+upcoming.length+(upcoming.length?' ('+upcoming.map(r=>r.name+' — '+r.date).join('; ')+')':''),
  '',
  'AREAS WHERE SUPPORT OR FOLLOW-UP MAY HELP',
  ...(gaps.length?gaps.map(g=>'• '+g):['• No automated exception flags from the saved records. Continue normal operational and regulatory review.']),
  '',
  'LOOKING AHEAD',
  'I will continue coordinating student progress, campus readiness, training support, admissions follow-up and community/employer outreach. Items requiring approvals will be brought forward with their supporting details.',
  '',
  'Thank you for your continued support.',
  '',
  'Internal draft — verify the underlying records, event details, approvals and results before sharing. Missing entries are not proof an activity did not occur.'
 ].join('\n');
 return {text:report,stats:{activeStudents:active.length,leads:leads.length,pendingFunding,overdue:overdue.length,missingAttendance,upcomingEvents:upcoming.length},attention:gaps};
}
