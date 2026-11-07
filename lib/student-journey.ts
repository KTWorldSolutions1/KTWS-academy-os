import type {RecordData as R} from './training.ts';
import {activeSessions,instructionHours,latestFinal,skills,latestSkill} from './training.ts';
import {drivingTimeSummary} from './attendance.ts';
import {latestEvidence} from './student-documents.ts';
import {graduationReadiness} from './enterprise.ts';
export const STUDENT_JOURNEY_STAGES=[
 {id:'Enrolling',title:'Joining Lone Star',short:'Enrollment',emoji:'🪪',description:'Your school team is collecting documents, confirming funding and securing your seat.'},
 {id:'Permit',title:'Permit preparation',short:'Permit',emoji:'📖',description:'Study for General Knowledge, Combination Vehicles and Air Brakes, then provide your valid commercial learner permit.'},
 {id:'Classroom',title:'Professional driver classroom',short:'Theory',emoji:'🎓',description:'Complete instructor-led federal Class A theory, logging, hours of service, map reading and trip planning.'},
 {id:'Yard',title:'Range & pre-trip training',short:'Yard',emoji:'🚚',description:'Practice vehicle inspections, backing, docking and instructor-evaluated range skills.'},
 {id:'Road',title:'Behind-the-wheel road training',short:'Road',emoji:'🛣️',description:'Build real road-driving skills and recorded driving hours with an instructor.'},
 {id:'Testing',title:'Final preparation & CDL testing',short:'Testing',emoji:'📝',description:'Verify required training, prepare for your state skills test and review outstanding requirements.'},
 {id:'Graduated',title:'Lone Star graduate',short:'Graduate',emoji:'🏅',description:'Your school has recorded graduation, subject to the final training and state/CDL evidence.'},
] as const;
export type JourneyStage=typeof STUDENT_JOURNEY_STAGES[number];
export function currentJourneyStage(s:R){
 if(s.status==='Graduated')return 6;
 if(s.status==='Test preparation'||s.status==='Testing')return 5;
 if(s.status==='Road')return 4;
 if(s.status==='Yard')return 3;
 if(['Classroom','Theory'].includes(s.status))return s.permitStatus==='Waiting for permit'||s.status==='Waiting for permit'?1:2;
 if(s.status==='Waiting for permit'||s.permitStatus==='Waiting for permit'||s.status==='Permit pending')return 1;
 return 0;
}
export function studentJourney(s:R,records:R[]){
 const now=currentJourneyStage(s),klass=records.find(r=>r.kind==='classes'&&r.id===s.classId),theoryFinal=latestFinal(s),drive=drivingTimeSummary(s);
 const docFlags=['Enrollment agreement','Driver license','Commercial learner permit'].filter(x=>!latestEvidence(s,x)?.verified);
 const theoryHours=instructionHours(s,'Classroom'),rangeHours=instructionHours(s,'Yard'),roadHours=drive.studentDrivingHours;
 const rangeCount=skills.Yard.filter(x=>latestSkill(s,x)?.level==='Proficient').length,roadCount=skills.Road.filter(x=>latestSkill(s,x)?.level==='Proficient').length;
 const graduated=s.status==='Graduated',ready=graduationReadiness(s,records);
 const stages=STUDENT_JOURNEY_STAGES.map((p,i)=>{
  let verified=false,evidence='';
  if(i===0){verified=!!s.classId&&!!latestEvidence(s,'Enrollment agreement')?.verified;evidence=verified?'Class assignment and signed agreement reviewed':'Class assignment and verified agreement required';}
  if(i===1){verified=!!latestEvidence(s,'Commercial learner permit')?.verified||s.permitStatus==='Verified';evidence=verified?'Permit evidence verified':'Commercial learner permit pending school review';}
  if(i===2){verified=!!theoryFinal&&Number(theoryFinal.score)>=80&&theoryHours>=50;evidence=theoryHours+' classroom hours recorded'+(theoryFinal?' • Final score '+theoryFinal.score+'%':' • Theory final not recorded');}
  if(i===3){verified=rangeCount===skills.Yard.length&&rangeHours>=50;evidence=rangeHours+' range hours • '+rangeCount+'/'+skills.Yard.length+' skills rated proficient';}
  if(i===4){verified=roadCount===skills.Road.length&&roadHours>=20;evidence=roadHours+' student-driving hours • '+roadCount+'/'+skills.Road.length+' road skills rated proficient';}
  if(i===5){verified=graduated&&ready.ready;evidence=ready.ready?'School readiness checklist shows no missing items':'Outstanding training checklist: '+ready.gaps.length+' item(s)';}
  if(i===6){verified=graduated;evidence=graduated?'Graduation status recorded by school':'Graduation not yet recorded';}
  return {...p,index:i,selected:i===now,completed:verified,evidence};
 });
 const pace=stages.filter(x=>x.completed).length;
 let callout='Your school has not assigned a class yet. Contact admissions about the next start date.';
 if(now===0)callout=docFlags.length?'Start with your enrollment checklist: '+docFlags.join(', '):'Ask admissions to confirm your class and funding authorization.';
 if(now===1)callout='Continue studying for General Knowledge, Combination Vehicles and Air Brakes, and arrange your CLP knowledge tests.';
 if(now===2)callout='Review your theory lessons and practice questions. Check what your instructor wants you to revisit before Friday.';
 if(now===3)callout='Check your next yard assignment and practice the range skills your instructor has flagged.';
 if(now===4)callout='Review your instructor notes, road lesson times and your hours toward completion.';
 if(now===5)callout='Review your school completion checklist, upcoming tests and any missing items before graduation.';
 if(now===6)callout='Congratulations on your graduation! Build your Driver Pulse profile and explore CDL employment opportunities.';
 return {stageIndex:now,stageName:stages[now].title,stageLabel:stages[now].short,stages,verifiedMilestones:pace,totalMilestones:stages.length,callout,
  className:klass?.name||s.cohort||null,classStart:klass?.startDate||s.startDate||null,classEnd:klass?.endDate||null,permitStatus:s.permitStatus||'Not verified',
  enrollmentGaps:docFlags,theoryHours,rangeHours,roadDrivingHours:roadHours,percent:Math.round((now/6)*100),
  note:'Stage placement comes from the campus record. A stage label does not prove hours, permit eligibility, instructor proficiency or FMCSA TPR certification.'};
}
