/**
 * Lone Star Class A instructor daily playbook — five-week planning guide.
 * Covers all 30 FMCSA Appendix A standard theory topics, 7 BTW-range topics
 * and 12 BTW-public-road topics. The daily ORDER is a campus proposal; it
 * does not replace approved curricula, class schedules, hours or evidence.
 * Federal subjects A3.8–A3.12 require road-training discussion, not
 * necessarily actual demonstrations (see 49 CFR Part 380 Appendix A).
 */
import {CLASS_A_THEORY_TOPICS} from './classroom-curriculum.ts';
export type TrainingStep={
 id:string;title:string;fmcsCodes:string[];method:'Theory'|'Range proficiency'|'Road proficiency'|'Road discussion'|'Career readiness'|'Daily records';
 guidance:string;verification:string;mandatory:boolean;
};
export type InstructorDay={
 day:number;week:number;weekday:string;phase:'Classroom'|'Yard'|'Road'|'Combined';
 heading:string;objective:string;steps:TrainingStep[];
};
const make=(day:number,index:number,title:string,method:TrainingStep['method'],codes:string[],guidance:string,verification:string,mandatory=true):TrainingStep=>({
 id:'LS-A-D'+String(day).padStart(2,'0')+'-S'+String(index+1).padStart(2,'0'),
 title,method,fmcsCodes:codes,guidance,verification,mandatory
});
const ROAD_TOPICS=[
 ['A3.1','Vehicle controls: turns, lane changes, highway curves, ramps'],
 ['A3.2','Shifting/transmission and fuel efficiency'],
 ['A3.3','Communications and signals'],
 ['A3.4','Visual search and scanning'],
 ['A3.5','Speed and space management'],
 ['A3.6','Safe driver behavior'],
 ['A3.7','HOS compliance, ELD/paper logs and recaps'],
 ['A3.8','Hazard perception'],
 ['A3.9','Railroad-highway crossings'],
 ['A3.10','Night operation'],
 ['A3.11','Extreme driving conditions'],
 ['A3.12','Skid avoidance, jackknifing and emergencies']
] as const;
export const REQUIRED_RANGE=[
 ['A2.1','Pre-trip, enroute and post-trip inspection'],
 ['A2.2','Straight-line backing'],
 ['A2.3','45/90-degree alley docking'],
 ['A2.4','Offset backing — both sides'],
 ['A2.5','Blind-side parallel parking'],
 ['A2.6','Sight-side parallel parking'],
 ['A2.7','Coupling, inspecting and uncoupling']
] as const;
export const REQUIRED_ROAD=ROAD_TOPICS;
const weekdays=['Monday','Tuesday','Wednesday','Thursday','Friday'];
export const DRIVER_TRAINING_DAYS:InstructorDay[]=Array.from({length:25},(_,i)=>{
 const day=i+1,week=Math.floor(i/5)+1,wday=i%5,weekday=weekdays[wday];
 const phase:InstructorDay['phase']=week===1?'Classroom':week===2||week===3?'Yard':week===4?'Road':'Combined';
 let heading='',objective='',steps:TrainingStep[]=[];
 const add=(title:string,method:TrainingStep['method'],codes:string[],guidance:string,verification:string,required=true)=>
  steps.push(make(day,steps.length,title,method,codes,guidance,verification,required));
 if(week===1){
  const theme=['Orientation, controls and basic operation','Safe vehicle operation and hazard prevention','Vehicle malfunctions, HOS clock and paper/electronic logs','Map reading, load paperwork and real-world trip planning','Professional driver challenge, remaining federal subjects and assessment'][wday];
  heading=theme;objective='Teach and verify actual J. J. Keller lesson coverage; do not replace federal theory modules with supplemental labs.';
  if(day===1)add('Student orientation, attendance and program expectations','Theory',[], 'Six-hour school orientation; review program sequence, CDL obligations, conduct, attendance, signature policies and how daily training logs work.','Obtain orientation acknowledgments and record actual time.');
  CLASS_A_THEORY_TOPICS.filter(topic=>topic.day===day).forEach(topic=>
   add('FMCSA '+topic.code+' — '+topic.title,'Theory',[topic.code],
    'Teach the school-assigned, licensed J. J. Keller theory module; ask the student to explain the major safety decision independently.',
    'Record the actual module ID, score, questions missed and instructor observations. A checkbox does not certify vendor completion.'));
  if(day===3){add('Logbook and driver clock workshop','Career readiness',[], 'Have student compute 11/14-hour limitations, breaks, 60/70-hour cycle, restart and a paper/ELD log recap.','Collect a corrected log sheet and signed calculation worksheet.');}
  if(day===4){add('Road atlas and trip planning workshop','Career readiness',[], 'Use a truck atlas to verify a legal Greensboro–Dallas route; calculate HOS, stops, fuel, time zones and legal ETA.','Collect trip plan, marked route and dispatch delay message.');}
  if(day===5){add('Knowledge diagnostic by permit subject','Career readiness',[], 'Individually review General Knowledge, Air Brakes and Combination Vehicles item-level misses before permitting.','Assign specific practice/reteach goals; keep official J. J. Keller ELDT theory exam separate.');}
 }else if(week===2){
  heading=['Safety briefing and full vehicle walkaround','Under-hood, cab and brake systems','Air-brake checks and coupling sequence','Pre-trip verbal explanation and inspection defects','Independent inspection rehearsal and permit-readiness check'][wday];
  objective='Build an independent vehicle inspection routine before training maneuvers.';
  add('Pre-trip, enroute and post-trip inspection','Range proficiency',['A2.1'],'Demonstrate safe inspection sequence, defect reporting, tires, brakes, fluids, steering, coupling and trailer condition.','Record individual inspection proficiency through an instructor-signed practical evaluation.');
  if(wday>=2)add('Couple, inspect and uncouple tractor and trailer','Range proficiency',['A2.7'],'Demonstrate proper fifth-wheel positioning, safety checks, air/electrical connections, tug test and release sequence.','Observe and grade each student independently.');
  add('Introduce GOAL, spotters and backing hazard zones','Career readiness',[],'Before maneuvering, teach Get Out And Look, safe spotter positions, clear commands and stopping for uncertainty.','Student verbalizes stop-work decision and blind-zone hazards.');
 }else if(week===3){
  heading=['Straight-line backing and GOAL','Offset left/right and setup geometry','45°/90° alley dock and correction strategy','Sight-side and blind-side parallel parking','Seven-unit range proficiency review'][wday];
  objective='Practice every Appendix A range maneuver including both parallel parking directions; check proficiency individually.';
  const codeGroups=[['A2.2'],['A2.4'],['A2.3'],['A2.5','A2.6'],REQUIRED_RANGE.map(x=>x[0])];
  for(const code of codeGroups[wday]){
   const unit=REQUIRED_RANGE.find(x=>x[0]===code)!;
   add(unit[1],'Range proficiency',[code],'Demonstrate a safe setup, GOAL as applicable, mirror control, correct pull-ups and spotter communication. Re-teach without time pressure.','Complete an individual, instructor-signed proficiency rubric for this maneuver.');
  }
  if(wday===4)add('Full range inspection and coupling review','Range proficiency',['A2.1','A2.7'],'Verify pre/post-trip inspection and coupling skills remain independent while maneuvering.','Record independent proficiency and any deficiencies needing remediation.');
 }else if(week===4){
  heading=['Urban driving fundamentals and scanning','Turns, shifting and highway merging','Managing speed/space and communications','HOS road application, rail crossings and hazards','Road proficiency review and emergency discussions'][wday];
  objective='Give supervised public-road training in an appropriate Class A CMV; ensure active two-way instructor communication throughout.';
  const groups=[['A3.1','A3.4'],['A3.1','A3.2','A3.3'],['A3.5','A3.6'],['A3.7','A3.8','A3.9'],['A3.10','A3.11','A3.12']];
  for(const code of groups[wday]){
   const unit=ROAD_TOPICS.find(x=>x[0]===code)!;
   const discussion=['A3.8','A3.9','A3.10','A3.11','A3.12'].includes(code);
   add(unit[1],discussion?'Road discussion':'Road proficiency',[code],
    discussion?'Discuss realistic road hazards and safe decisions during supervised road training. Do not deliberately expose students to dangerous weather, emergencies or night driving solely for an exercise.':'Coach and observe actual vehicle control during supervised road training; stop for unsafe actions.',
    discussion?'Record what was discussed and whether the student could identify appropriate preventive actions.':'Record independently observed driving performance in the school-signed skill rubric.');
  }
 }else{
  heading=['Skills readiness inventory and individual practice','Targeted yard and pre-trip remediation','Supervised road refresh and HOS review','Mock testing, missing document and log audit','Final testing, career orientation and closeout'][wday];
  objective='Address student-specific gaps; no one earns a proficiency checkoff merely by reaching Week 5.';
  add('Review missing federal skills and practice gaps','Career readiness',[],
   'Use the full A1/A2/A3 progress matrix to find incomplete concepts, low knowledge scores, unassessed maneuvers, missing logbook and road discussions.',
   'Assign individualized remediation and keep prior evidence intact.');
  if(wday===1)add('Range skill remediation','Range proficiency',['A2.1','A2.2','A2.3','A2.4','A2.5','A2.6','A2.7'],'Coach only approved maneuvers on a safe range with a credentialed instructor.','Record a fresh independent assessment; do not automatically mark proficient.');
  if(wday===2)add('Road skill remediation','Road proficiency',['A3.1','A3.2','A3.3','A3.4','A3.5','A3.6','A3.7'],'Review safe driving and legal HOS on-road during an approved supervised lesson.','Record actual time, road skill rubric and discussions.');
  if(wday===3)add('Mock state test and records audit','Career readiness',[],'Rehearse applicable inspection, maneuver and road procedures; distinguish school mock results from actual DMV scores.','Retain school practice results; audit every student daily log and existing license/permit documents.');
  if(wday===4)add('Professional driver transition','Career readiness',[],'Discuss company policies, route planning, load documents, lawful dispatch decisions, and employer onboarding.','Review unresolved milestones and prepare student graduation evidence for authorized signoff.');
 }
 add('Daily learning recap and missed-item coaching','Daily records',[],
  'Check each student’s specific weak topics. Optional 15-minute recap may be held if the schedule permits; never invent or automatically add instructional or payroll hours.',
  'Write who needs practice and the first item to revisit next training day.');
 add('Collect daily training log and reconcile hours','Daily records',[],
  'Verify dates, student and instructor, phase, attendance, training category, start/end, breaks, observation versus student-operated driving, and any applicable night hours. Upload scanned signed paper log if one exists.',
  'A separate saved attendance entry and daily log or scan are required to prove recorded time. Daily checklist itself creates zero training hours.');
 return {day,week,weekday,phase,heading,objective,steps};
});
export const FEDERAL_THEORY_CODES=CLASS_A_THEORY_TOPICS.map(x=>x.code);
export const FEDERAL_RANGE_CODES=REQUIRED_RANGE.map(x=>x[0]);
export const FEDERAL_ROAD_CODES=REQUIRED_ROAD.map(x=>x[0]);
export const ALL_FEDERAL_CODES=[...FEDERAL_THEORY_CODES,...FEDERAL_RANGE_CODES,...FEDERAL_ROAD_CODES];
export function dayFromDate(start:string,when:string){
 const a=new Date(start+'T12:00:00Z'),b=new Date(when+'T12:00:00Z');
 if(!Number.isFinite(+a)||!Number.isFinite(+b))return null;
 const weekdaysPassed=Math.round((+b-+a)/86400000),wholeWeeks=Math.floor(weekdaysPassed/7);
 const remainder=weekdaysPassed%7;
 const index=wholeWeeks*5+remainder+1;
 return weekdaysPassed>=0&&index>=1&&index<=25?index:null; // assumes school Mon–Fri; adjust holidays manually
}
export type StepResult='Not covered'|'Reviewed'|'Needs practice'|'Student explains'|'Performed with coaching'|'Discussed';
export function reviewProgress(records:any[],student:any){
 const valid=records.filter(r=>r.kind==='daily-lesson-reviews'&&r.studentId===student.id&&r.campusId===student.campusId);
 const corrected=new Set(valid.map(r=>r.correctionOf).filter(Boolean));
 const latest=valid.filter(x=>!corrected.has(x.id)).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 const covered=new Set<string>(),gaps=new Set<string>(),days=new Set<number>(),reviewedSteps=new Set<string>();
 for(const entry of latest){
  days.add(Number(entry.day));
  for(const [id,choice] of Object.entries(entry.results||{})){
   if(choice==='Not covered')continue;
   reviewedSteps.add(id);
   const task=DRIVER_TRAINING_DAYS.find(d=>d.day===entry.day)?.steps.find(s=>s.id===id);
   if(!task)continue;
   if(choice==='Needs practice')task.fmcsCodes.forEach(c=>gaps.add(c));
   else task.fmcsCodes.forEach(c=>covered.add(c));
  }
 }
 return {daysReviewed:days.size,stepsReviewed:reviewedSteps.size,federalTopicsTouched:covered.size,
  openGaps:[...gaps],federalTopicsNotYetReviewed:ALL_FEDERAL_CODES.filter(c=>!covered.has(c)),
  // Cannot infer actual proficiency from the student-facing daily review.
  note:'Covered/discussed checkpoints do not substitute for signed theory assessments or BTW proficiency evaluations.'};
}
export function validateDailyReview(record:any,all:any[],asOf:string){
 if(record.kind!=='daily-lesson-reviews')return null;
 if(!Number.isInteger(record.day)||record.day<1||record.day>25)return 'Choose an official school day from 1–25.';
 const day=DRIVER_TRAINING_DAYS[record.day-1];
 if(record.phase!==day.phase)return 'Daily checklist phase must match the chosen instructional day.';
 if(!/^(19|20)\d\d-\d\d-\d\d$/.test(record.date||'')||record.date>asOf)return 'Daily training reviews must use an actual date not in the future.';
 const student=all.find(x=>x.kind==='students'&&x.id===record.studentId&&x.campusId===record.campusId);
 if(!student)return 'Daily progress must be linked to a student at the assigned campus.';
 if(student.program!=='Class A')return 'The Class A instructor guide is not the approved curriculum for this student program.';
 const ids=new Set(day.steps.map(s=>s.id));
 if(!record.results||typeof record.results!=='object'||Array.isArray(record.results)
   ||Object.entries(record.results).some(([key,value])=>!ids.has(key)||!['Not covered','Reviewed','Needs practice','Student explains','Performed with coaching','Discussed'].includes(String(value))))
  return 'Only valid daily lesson step results may be saved.';
 if(!Object.keys(record.results).length)return 'Record a result for at least one student learning step.';
 if(record.stepMoods!==undefined){
  if(!record.stepMoods||typeof record.stepMoods!=='object'||Array.isArray(record.stepMoods)||Object.entries(record.stepMoods).some(([id,value])=>!ids.has(id)||!['green','yellow','red'].includes(String(value))))return 'Choose a valid green, yellow or red lesson rating for each scored step.';
  if(Object.values(record.stepMoods).some(value=>value==='red')&&!record.nextSteps?.trim())return 'A red lesson rating requires a specific remediation or intervention action.';
 }
 if(typeof record.notes!=='string'||record.notes.trim().length<12||record.notes.length>3000)return 'Describe observations and next actions in at least 12 characters.';
 if(Object.values(record.results).includes('Needs practice')&&!record.nextSteps?.trim())return 'When practice is needed, specify the next coaching action.';
 if(record.correctionOf&&(!all.some(x=>x.kind==='daily-lesson-reviews'&&x.id===record.correctionOf&&x.studentId===student.id&&x.day===record.day)||all.some(x=>x.kind==='daily-lesson-reviews'&&x.correctionOf===record.correctionOf)))return 'Only a matching, uncorrected daily review can be corrected.';
 // Instructor can cover skill concepts before the formal skill evaluation, but cannot claim proficiency here.
 return null;
}
