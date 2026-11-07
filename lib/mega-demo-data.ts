import type {RecordData as R} from './training.ts';
const mockNames=[
 ['Nia Brooks','Marcus Fields','Avery Johnson','Damon Reed','Taylor Benton','Milan Park'],
 ['Kendall Carter','Jesse Harper','Robin Vega','Alex Monroe','Cameron Price','Devon Walker'],
 ['Sydney Ellis','Jordan Bell','Casey West','Elliot Ross','Riley Cooper','Hayden Brooks']
];
const mockSubjects=['General Knowledge','Combination Vehicles','Air Brakes'] as const;
export function megaCampusDemoRecords():R[]{
 const sites=[
  {id:'demo-campus-1',city:'Greensboro',state:'NC'},
  {id:'demo-campus-dallas',city:'Dallas',state:'TX'},
  {id:'demo-campus-mansfield',city:'Mansfield',state:'TX'}
 ];
 const output:R[]=[];
 sites.forEach((site,campusIndex)=>{
  const classId='demo-mega-class-'+site.city.toLowerCase();
  output.push({id:classId,kind:'classes',campusId:site.id,name:'November 16 • Class A • '+site.city,status:'Open for enrollment',program:'Class A',startDate:'2026-11-16',endDate:'2026-12-18',capacity:15,tuition:3000});
  output.push({id:'demo-mega-class-next-'+site.city.toLowerCase(),kind:'classes',campusId:site.id,name:'November 30 • Class A • '+site.city,status:'Open for enrollment',program:'Class A',startDate:'2026-11-30',endDate:'2027-01-01',capacity:15});
  mockNames[campusIndex].forEach((name,i)=>{
   const studentId='demo-mega-student-'+campusIndex+'-'+i,categoryScore=(i+campusIndex)%3;
   const itemResults=mockSubjects.flatMap((subject,sj)=>Array.from({length:4},(_,q)=>({
     questionId:studentId+'-'+sj+'-'+q,subject,objective:(['Safe stopping distance','Combination trailer control','Brake system air pressure'][sj]),correct:q<(categoryScore===2?4:categoryScore===1?2:1)||sj===categoryScore
    })));
   const total=itemResults.length,correct=itemResults.filter(item=>item.correct).length,score=Math.round(correct/total*10000)/100;
   const assessments=[{id:'demo-mega-quiz-'+studentId,name:'Fictional Friday CDL knowledge check',type:'Quiz',studentPractice:true,week:1,date:'2026-11-06',
    correct,total,score,instructor:'Sample instructor',remediation:score>=80?'':'Review subject learning objectives with instructor.',itemResults}];
   output.push({id:studentId,kind:'students',campusId:site.id,classId,cohort:'November 16 • Class A • '+site.city,name,status:'Classroom',program:'Class A',
    studentNumber:'TEST-'+site.city.toUpperCase()+'-'+String(i+1).padStart(2,'0'),address:'DEMO STUDENT ADDRESS',city:site.city,state:site.state,zip:'00000',phone:'555-010-'+String(1000+campusIndex*100+i),
    licenseNumber:'TEST LICENSE — NOT REAL',dob:'2000-01-01',fundingType:['Cash','WIOA','WRLP','Vocational Rehabilitation','Employer-sponsored','Other outside funding'][i],
    documents:[],documentRequests:[{category:'Enrollment agreement',status:'Requested',requestedAt:'2026-11-07T10:00:00Z',requestedBy:'Demo instructor',message:'Sample demonstration: please upload your enrollment agreement.'}],
    assessments,sessions:[{id:'demo-mega-session-'+studentId,date:'2026-11-02',phase:'Classroom',start:'08:00',end:'12:00',breakMinutes:0,hours:4,attendance:'Present',mode:'Instruction',mood:i%3===0?'yellow':'green',skill:'Vehicle systems',notes:'Fictional learning scenario',instructor:'Sample instructor'}],
    targetTheory:50,targetYard:50,targetRoad:60});
  });
  output.push({id:'demo-mega-task-'+campusIndex,kind:'tasks',campusId:site.id,name:'Review November 16 roster readiness — DEMO',status:'Open',owner:'Sample coordinator',assignedTo:'demo-mega-staff-'+campusIndex,due:'2026-11-13',priority:'High'});
  output.push({id:'demo-mega-appt-'+campusIndex,kind:'appointments',campusId:site.id,name:'Test student file intake — DEMO',status:'Scheduled',type:'Document review',date:'2026-11-12',start:'10:00',end:'10:30',owner:'Sample admin',assignedTo:'demo-mega-staff-'+campusIndex});
  output.push({id:'demo-mega-staff-'+campusIndex,kind:'staff',campusIds:[site.id],name:'Sample '+site.city+' coordinator',status:'Active',position:'Admissions coordinator',accessRole:'Admin assistant',email:'sample-'+site.city.toLowerCase()+'@example.invalid'});
 });
 return output;
}
