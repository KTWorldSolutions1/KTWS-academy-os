import {activeSessions,instructionHours,latestDaily,latestSkill,phases,skills,theoryState,type RecordData as R} from './training.ts';
import {campusOf,graduationReadiness} from './enterprise.ts';
import {classRoster,classSeats} from './admissions.ts';

export const careerStages=['Not started','Career coaching','Applications submitted','Interview scheduled','Offer received','Placed','Seeking another role'] as const;
export const caseCategories=['Training support','Attendance support','Enrollment review','Funding follow-up','Vehicle service','Career support','General follow-up'];
export type Signal={key:string;record:R;category:string;priority:string;title:string;detail:string;sourceEntry?:string};
export const activeStudent=(s:R)=>s.kind==='students'&&!['Graduated','Withdrawn'].includes(s.status);
export function dayOffset(day:string,days:number){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export function attendanceEvidence(s:R,from:string,to:string){
 const sessions=activeSessions(s).filter((x:any)=>x.date>=from&&x.date<=to);
 const slots=new Map<string,any>();for(const x of [...sessions].sort((a:any,b:any)=>(a.date+(a.createdAt||'')).localeCompare(b.date+(b.createdAt||''))))slots.set(x.date+':'+x.phase,x);
 const entries=[...slots.values()],attended=entries.filter(x=>['Present','Late','Left early'].includes(x.attendance)).length,excused=entries.filter(x=>x.attendance==='Excused').length;
 return {sessions,recorded:entries.length,attended,absent:entries.filter(x=>x.attendance==='Absent').length,excused,late:entries.filter(x=>x.attendance==='Late').length,rate:entries.length-excused?Math.round(attended/(entries.length-excused)*100):null};
}
export function operationsSignals(records:R[],day:string):Signal[]{
 const out:Signal[]=[];const add=(r:R,code:string,category:string,priority:string,title:string,detail:string,sourceEntry?:string)=>out.push({key:r.id+':'+code,record:r,category,priority,title,detail,sourceEntry});
 for(const r of records){
  if(activeStudent(r)){
   const bounded={...r,sessions:activeSessions(r).filter((x:any)=>x.date<=day)};
   for(const phase of phases){const x=latestDaily(bounded,phase);if(x?.mood==='red'||x?.mood==='yellow')add(r,'progress:'+phase,'Training support',x.mood==='red'?'High':'Normal',phase+' — '+(x.mood==='red'?'intervention':'coaching'),(x.date||'')+' • '+(x.skill||'Focus not recorded')+' • '+(x.notes||'Review instructor feedback.'),x.id);}
   const a=attendanceEvidence(r,dayOffset(day,-6),day);if(a.absent||a.late>=2)add(r,'attendance','Attendance support',a.absent>=2?'High':'Normal','Attendance follow-up',a.absent+' recorded absences and '+a.late+' late marks in the last seven days. Excused marks are separate.');
   const finals=(r.assessments||[]).filter((x:any)=>x.type==='Theory final'&&(!x.date||x.date<=day)),f=finals.at(-1);if(f&&Number(f.score)<80)add(r,'theory','Training support','High','Theory retake needs follow-through',f.score+'% • '+(f.remediation||'Review remediation plan.'),f.id);
   if(r.status==='Enrollment pending')add(r,'enrollment','Enrollment review','Normal','Enrollment is still pending','Review the enrollment checklist, funding and assigned class before advancing.');
   for(const [field,title] of [['clpExpiry','CLP'],['licenseExpiry','Driver license']])if(r[field]&&r[field]<=dayOffset(day,30))add(r,field,'Enrollment review',r[field]<day?'High':'Normal',title+' expiration review',title+' expiration recorded as '+r[field]+'. Verify source documents; staff determines the next step.');
   const c=records.find(x=>x.id===r.classId&&x.kind==='classes');if(c?.endDate&&c.endDate<=dayOffset(day,7)&&!graduationReadiness(r).ready)add(r,'graduation','Training support','High','Graduation target needs a review',c.name+' ends '+c.endDate+' • '+graduationReadiness(r).gaps.length+' evidence gaps.');
  }
  if(r.kind==='leads'&&!['Closed','Enrolled'].includes(r.status)&&r.followUp&&r.followUp<=day)add(r,'sales','General follow-up','Normal','Admissions follow-up due',r.followUp+' • '+r.status+' • Assigned to '+(r.owner||'Unassigned'));
  if(r.kind==='finance'&&r.status==='Outstanding'&&r.due&&r.due<=day)add(r,'balance','Funding follow-up','Normal','Recorded balance due',r.due+' • '+Number(r.amount||0).toLocaleString('en-US',{style:'currency',currency:'USD'})+' • Manual ledger; confirm payment records.');
  if(r.kind==='fleet'){
   if(r.status!=='Ready')add(r,'unavailable','Vehicle service','High','Training vehicle unavailable',r.unit+' • '+r.status);
   for(const field of ['inspectionDue','maintenanceDue'])if(r[field]&&r[field]<=dayOffset(day,7))add(r,field,'Vehicle service',r[field]<=day?'High':'Normal',field==='inspectionDue'?'Inspection due':'Maintenance due',r.unit+' • '+r[field]);
  }
  if(['mous','funding','staff'].includes(r.kind)){const expiry=r.expiry||r.renewal;if(expiry&&expiry<=dayOffset(day,30)&&r.status!=='Inactive')add(r,'renewal','General follow-up',expiry<day?'High':'Normal','Agreement / credential renewal',expiry+' • '+r.status);}
  if(r.kind==='students'&&r.status!=='Withdrawn'&&r.career?.followUp&&r.career.followUp<=day)add(r,'career','Career support','Normal','Career follow-up due',r.career.followUp+' • '+(r.career.stage||'Not started'));
 }
 return out.sort((a,b)=>(a.priority==='High'?0:1)-(b.priority==='High'?0:1)||a.record.name.localeCompare(b.record.name));
}
export function relatedCase(records:R[],signal:Signal){return records.find(r=>r.kind==='tasks'&&r.status!=='Complete'&&(r.signalKey===signal.key||(signal.sourceEntry&&r.sourceEntry===signal.sourceEntry)));}
export function makeCase(signal:Signal,records:R[],day:string,id:string):R{return {id,kind:'tasks',name:signal.title+' — '+signal.record.name,status:'Open',campusId:campusOf(signal.record,records),studentId:signal.record.kind==='students'?signal.record.id:signal.record.studentId,personId:signal.record.kind==='leads'?signal.record.id:undefined,unitId:signal.record.kind==='fleet'?signal.record.id:undefined,student:signal.record.kind==='students'?signal.record.name:signal.record.student,owner:signal.record.owner||'',due:day,priority:signal.priority,operationsCase:true,category:signal.category,signalKey:signal.key,sourceEntry:signal.sourceEntry,plan:'',outcome:'',notes:[{text:signal.detail,channel:'Operations review',at:new Date().toISOString()}]};}
export function campusSnapshot(records:R[],day:string){
 const campuses=records.filter(r=>r.kind==='campuses'),ids=new Set(records.filter(r=>!['staff','templates','courses','quizzes','lessons'].includes(r.kind)).map(r=>campusOf(r,records)));
 return [...ids].map(id=>{const scoped=records.filter(r=>campusOf(r,records)===id),students=scoped.filter(activeStudent),classes=scoped.filter(r=>r.kind==='classes'&&['Open for enrollment','In progress'].includes(r.status)),signals=operationsSignals(scoped,day);return {id,name:campuses.find(c=>c.id===id)?.name||'Unassigned campus',students:students.length,seats:classes.reduce((n,c)=>n+classSeats(records,c),0),vehicles:scoped.filter(r=>r.kind==='fleet'&&r.status==='Ready').length,high:signals.filter(s=>s.priority==='High').length,overdue:scoped.filter(r=>r.kind==='tasks'&&r.status!=='Complete'&&r.due&&r.due<day).length};});
}
export function cohortSnapshot(records:R[],c:R){const roster=classRoster(records,c.id),active=roster.filter(activeStudent);return {roster,active,seats:classSeats(records,c),ready:active.filter(s=>graduationReadiness(s).ready).length,theory:active.filter(s=>theoryState(s).signed).length};}
export function studentProgressReport(s:R,records:R[],from:string,to:string,includeNotes=false){
 const c=records.find(r=>r.kind==='classes'&&r.id===s.classId),a=attendanceEvidence(s,from,to),bounded={...s,sessions:activeSessions(s).filter((x:any)=>x.date<=to),assessments:(s.assessments||[]).filter((x:any)=>!x.date||x.date<=to),evaluations:(s.evaluations||[]).filter((x:any)=>!x.date||x.date<=to)},theory=theoryState(bounded);
 const lines=['KTWS ACADEMY — STUDENT PROGRESS REVIEW','Prepared from saved school records. Staff review required before sharing.','Student: '+s.name,'Campus: '+(records.find(r=>r.id===campusOf(s,records))?.name||'Unassigned'),'Class: '+(c?.name||s.cohort||'Not assigned'),'Current location / status: '+s.status,'Reporting period: '+from+' through '+to,'','ATTENDANCE EVIDENCE','Recorded date/location marks: '+a.recorded,'Attended: '+a.attended+' | Absent: '+a.absent+' | Excused: '+a.excused+' | Late: '+a.late,'Attendance among recorded non-excused marks: '+(a.rate==null?'Not available':a.rate+'%'),'Unrecorded days are not counted as absences.','', 'TRAINING'];
 for(const phase of phases){const x=latestDaily(bounded,phase);lines.push(phase+': '+instructionHours(bounded,phase)+' instruction hours through '+to+'; '+instructionHours({...s,sessions:a.sessions},phase)+' in this period.', 'Latest focus: '+(x?x.date+' • '+(x.skill||'Not recorded')+' • '+(x.mood||'No rating'):'No record'));if(includeNotes&&x?.notes)lines.push('Instructor note: '+x.notes);}
 lines.push('','THEORY',theory.label,'Latest final: '+(theory.final?theory.final.score+'%':'Not recorded'),'Required theory final threshold: 80%','', 'SKILL EVIDENCE');
 for(const phase of ['Yard','Road'] as const)for(const skill of skills[phase]){const e=latestSkill(bounded,skill);lines.push(phase+' — '+skill+': '+(e?.level||'Not evaluated')+(e?' • '+e.date+' • '+e.instructor:''));}
 lines.push('','RECORDED ASSESSMENTS IN PERIOD');for(const x of bounded.assessments.filter((x:any)=>x.date>=from&&x.date<=to))lines.push(x.date+' • '+x.name+' • '+x.score+'%');
 lines.push('','Graduation evidence gaps as of '+to+': '+(graduationReadiness(bounded).gaps.join('; ')||'None in training checklist'),'','This report excludes identity numbers, screening results, private uploads, payments and private support case notes. Current status and skills-test result reflect the current profile. This is not a state certification or a TPR submission.');return lines.join('\n');
}
