import type {RecordData as R} from './training.ts';
import {DRIVER_TRAINING_DAYS} from './driver-training-plan.ts';

/**
 * Fully synthetic presentation sandbox. Do not persist these records into the
 * school's records API. Workspace adds its two pre-existing sample students.
 * 98 additional students + 2 existing = exactly 100 total sample students.
 * Plus 50 fictional applicants awaiting funding across three campuses.
 */
export const PRESENTATION_DEMO_TARGETS={studentsTotal:100,baseStudents:2,generatedStudents:98,fundingPending:50};
export const DEMO_STATUSES=['Enrollment pending','Classroom','Yard','Road','Test preparation','Graduated','Withdrawn'] as const;
export const DEMO_CAMPUSES=[
 {id:'demo-campus-1',name:'Greensboro',city:'Greensboro',state:'NC',students:32,pending:17},
 {id:'demo-campus-dallas',name:'Dallas',city:'Dallas',state:'TX',students:33,pending:17},
 {id:'demo-campus-mansfield',name:'Mansfield',city:'Mansfield',state:'TX',students:33,pending:16}
] as const;
const firstNames=['Amari','Avery','Jordan','Cameron','Riley','Morgan','Dakota','Taylor','Sidney','Devin','Blake','Kendall','Jamie','Leslie','Alex','Quinn','Parker','Remy','Rowan','Sage','Drew','Kasey','Ellis','Jamie','Harper','Ari','Reese','Adrian','Hayden','Skylar','Milan','Nico','Emerson','Tatum'];
const lastNames=['Brooks','Carter','Fields','Johnson','Reed','Morris','Ellis','Harper','Benton','Ross','Mitchell','Cooper','Jones','Price','King','Hayes','Turner','Bell','Rivera','Parker','Brown','Lewis','Stone','Porter','Douglas','Hudson','Sutton','Diaz','Mason','Green','Bailey','Perry','Vega','Owens'];
const funding=['Cash','WIOA','WRLP','Vocational Rehabilitation','Employer-sponsored','Scholarship','Other outside funding'];
const studyAreas=['General Knowledge','Combination Vehicles','Air Brakes'] as const;
const objectives=['Safe stopping distance and sight distance','Trailer hookup and coupling checks','Air pressure warning and service-brake checks'];
const starts=['2026-11-16','2026-11-02','2026-10-19','2026-10-05','2026-09-28','2026-09-14','2026-09-07'];
const ends=['2026-12-18','2026-12-04','2026-11-20','2026-11-06','2026-10-30','2026-10-16','2026-10-09'];
const cls=(campus:number,stage:number)=>'demo-mega-class-'+campus+'-'+stage;
function mockName(idx:number,site:number){
 // deterministic combinations, not personal data.
 return firstNames[(idx*7+site*11)%firstNames.length]+' '+lastNames[(idx*5+site*13+Math.floor(idx/firstNames.length))%lastNames.length];
}
function fakeDiagnostic(id:string,studentIndex:number,siteIndex:number){
 const items=studyAreas.flatMap((subject,subjectIndex)=>Array.from({length:6},(_,questionIndex)=>{
  const correct=((studentIndex+siteIndex+subjectIndex*3+questionIndex*2)%7)<(studentIndex%5===0?3:studentIndex%5===1?4:studentIndex%5===2?5:6);
  return {questionId:id+'-'+subjectIndex+'-'+questionIndex,subject,objective:objectives[subjectIndex],correct};
 }));
 const correct=items.filter(x=>x.correct).length,total=items.length,score=Math.round(correct/total*10000)/100;
 return {id:'demo-assessment-'+id,assessmentId:'sample-friday-check',name:'DEMO · Friday permit readiness',type:'Quiz',week:1,date:'2026-11-06',
  correct,total,score,studentPractice:true,instructor:'Fictional instructor',itemResults:items,
  remediation:score<80?'Fictional targeted coaching for missed CDL concepts':''};
}
export function megaCampusDemoRecords():R[]{
 const output:R[]=[];
 for(const [ci,campus] of DEMO_CAMPUSES.entries()){
  for(let stage=0;stage<DEMO_STATUSES.length;stage++)output.push({
   id:cls(ci,stage),kind:'classes',campusId:campus.id,name:campus.name+' · Class A · '+starts[stage],
   status:stage>=5?'Complete':stage===0?'Open for enrollment':'In progress',program:'Class A',
   startDate:starts[stage],endDate:ends[stage],capacity:36,schedule:'Weekdays · five-week training',
   fundingOptions:funding,tuition:3000,theoryHours:50,yardHours:50,roadHours:60
  });
  for(let index=0;index<campus.students;index++){
   const stage=(index+ci)%DEMO_STATUSES.length,id='demo-mega-student-'+ci+'-'+String(index+1).padStart(3,'0');
   const name=mockName(index,ci),status=DEMO_STATUSES[stage],diagnostic=fakeDiagnostic(id,index,ci);
   const needsDocument=index%4!==0;
   output.push({
    id,kind:'students',campusId:campus.id,classId:cls(ci,stage),cohort:campus.name+' · Class A · '+starts[stage],
    name,status,program:'Class A',studentNumber:'DEMO-'+campus.name.toUpperCase().slice(0,3)+'-'+String(index+1).padStart(3,'0'),
    fundingType:funding[(index+ci)%funding.length],fundingStatus:index%5===0?'Funding review':'Demo funding recorded',
    sponsor:index%3===1?'Fictional workforce sponsor':'',targetTheory:50,targetYard:50,targetRoad:60,
    dob:'1999-01-01',licenseNumber:'DEMO-NOT-REAL',phone:'555-010-'+String(1000+ci*100+index),
    address:'FAKE TRAINING ADDRESS',city:campus.city,state:campus.state,zip:'00000',
    notes:[],documents:[],documentRequests:needsDocument?[{category:'Enrollment agreement',status:'Requested',requestedAt:'2026-11-07T10:00:00Z',requestedBy:'Demo administrator',
      message:'Demonstration: signed agreement is missing. Upload securely in the student portal.'}]:[],
    assessments:[diagnostic],
    sessions:stage>=2&&stage<=5?[{id:'demo-session-'+id,date:'2026-11-04',phase:stage>=3?'Yard':'Classroom',start:'08:00',end:'12:00',breakMinutes:0,hours:4,attendance:'Present',mode:'Instruction',
     mood:diagnostic.score<80?'yellow':'green',skill:'Knowledge / pre-trip readiness',notes:'Fictional school progress; for walkthrough only.',instructor:'Demo instructor'}]:[],
    evaluations:[],demoOnly:true
   });
  }
  // Synthetic signed-looking coach progress is still explicitly DEMO-only.
  // Only a few days per student are prepopulated so the owner can see
  // realistic missing topics and open each student's daily training checklist.
  for(const student of output.filter(r=>r.kind==='students'&&r.campusId===campus.id)){
   if(['Enrollment pending','Withdrawn'].includes(student.status))continue;
   const milestones=student.status==='Classroom'?[1,3]
    :student.status==='Yard'?[1,3,6,11]
    :student.status==='Road'?[1,4,6,11,16,17]
    :[1,3,4,6,11,16,17,18,19,20,21];
   for(const day of milestones){
    const blueprint=DRIVER_TRAINING_DAYS[day-1];
    const results=Object.fromEntries(blueprint.steps.map((step,j)=>[step.id,(j+day)%6===0?'Needs practice':step.method==='Road discussion'?'Discussed':'Reviewed']));
    output.push({id:'demo-daily-review-'+student.id+'-'+day,kind:'daily-lesson-reviews',name:student.name+' · DEMO Day '+day,
     studentId:student.id,campusId:student.campusId,day,week:blueprint.week,phase:blueprint.phase,
     date:'2026-11-05',status:'Reviewed',results,
     notes:'Synthetic student-specific instructor observations. One review objective needs additional practice.',
     nextSteps:'Demo follow-up: re-teach this weak concept in the next suitable lesson.',
     recordedBy:'demo-instructor@example.invalid',recordedAt:'2026-11-05T16:00:00Z',demoOnly:true});
   }
  }
    for(let index=0;index<campus.pending;index++){
   const id='demo-funding-lead-'+ci+'-'+String(index+1).padStart(3,'0');
   output.push({
    id,kind:'leads',campusId:campus.id,name:mockName(index+15,ci)+' · DEMO',
    status:'Funding pending',program:'Class A',source:['NCWorks / WIOA','Career Center','Community partner','Website inquiry','School referral'][index%5],
    fundingType:funding[1+(index+ci)%(funding.length-1)],fundingStatus:'Awaiting third-party authorization',
    nextStartDate:'2026-11-16',phone:'555-010-'+String(1400+ci*100+index),
    owner:'Fictional enrollment specialist',followUp:'2026-11-12',
    notes:[{text:'Synthetic applicant. Demonstration records contain no real identity or eligibility claims.',at:'2026-11-07T10:00:00Z'}],
    demoOnly:true
   });
  }
  output.push(
   {id:'demo-mega-staff-'+ci,kind:'staff',campusIds:[campus.id],name:'Fictional '+campus.name+' coordinator',status:'Active',accessRole:'Admin assistant',email:'demo-'+campus.name.toLowerCase()+'@example.invalid',demoOnly:true},
   {id:'demo-mega-task-'+ci,kind:'tasks',campusId:campus.id,name:'Prepare November 16 funding and DMV preflight · DEMO',status:'Open',owner:'Sample coordinator',
    assignedTo:'demo-mega-staff-'+ci,priority:'High',due:'2026-11-13',demoOnly:true},
   {id:'demo-mega-appointment-'+ci,kind:'appointments',campusId:campus.id,name:'Intake and missing-paperwork review · DEMO',status:'Scheduled',type:'Document review',
    date:'2026-11-12',start:'10:00',end:'10:30',owner:'Fictional coordinator',assignedTo:'demo-mega-staff-'+ci,demoOnly:true}
  );
 }
 return output;
}
