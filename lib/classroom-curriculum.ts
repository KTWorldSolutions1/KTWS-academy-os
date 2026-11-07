/**
 * Lone Star Class A standard-curriculum planning crosswalk.
 * Source: 49 CFR Part 380 Appendix A, standard theory A1.1–A1.5.
 * Planning material ONLY. A suggested day is not proof instruction happened.
 * J. J. Keller course/module IDs are intentionally unmapped pending the school's
 * licensed course export; do not infer that a vendor course was completed.
 */
export type TheoryTopic = { code:string; title:string; category:string; day:number };
export type ClassroomBlock = { title:string; hours:number; method:string };
export type ClassroomDay = {
 day:number; label:string; title:string; focus:string; blocks:ClassroomBlock[];
 materials:string[]; evidence:string[]; instructorNotes:string; workshop?:{
 title:string; objectives:string[]; steps:string[]; scenario:string; assessment:string;
 };
};
const topics: Array<[string,string,number,string]> = [
 ['A1.1.1','Orientation',1,'Basic Operation'],
 ['A1.1.2','Control Systems/Dashboard',1,'Basic Operation'],
 ['A1.1.3','Pre- and Post-Trip Inspections',1,'Basic Operation'],
 ['A1.1.4','Basic Control',1,'Basic Operation'],
 ['A1.1.5','Shifting/Operating Transmissions',1,'Basic Operation'],
 ['A1.1.6','Backing and Docking',1,'Basic Operation'],
 ['A1.1.7','Coupling and Uncoupling',1,'Basic Operation'],
 ['A1.2.1','Visual Search',2,'Safe Operating Procedures'],
 ['A1.2.2','Communication',2,'Safe Operating Procedures'],
 ['A1.2.3','Distracted Driving',2,'Safe Operating Procedures'],
 ['A1.2.4','Speed Management',2,'Safe Operating Procedures'],
 ['A1.2.5','Space Management',2,'Safe Operating Procedures'],
 ['A1.2.6','Night Operation',2,'Safe Operating Procedures'],
 ['A1.2.7','Extreme Driving Conditions',2,'Safe Operating Procedures'],
 ['A1.3.1','Hazard Perception',2,'Advanced Operating Practices'],
 ['A1.3.2','Skid Control/Recovery, Jackknifing, and Other Emergencies',2,'Advanced Operating Practices'],
 ['A1.3.3','Railroad-Highway Grade Crossings',2,'Advanced Operating Practices'],
 ['A1.4.1','Identification and Diagnosis of Malfunctions',3,'Vehicle Systems and Reporting Malfunctions'],
 ['A1.4.2','Roadside Inspections',3,'Vehicle Systems and Reporting Malfunctions'],
 ['A1.4.3','Maintenance',3,'Vehicle Systems and Reporting Malfunctions'],
 ['A1.5.1','Handling and Documenting Cargo',4,'Non-Driving Activities'],
 ['A1.5.2','Environmental Compliance Issues',4,'Non-Driving Activities'],
 ['A1.5.3','Hours of Service Requirements',3,'Non-Driving Activities'],
 ['A1.5.4','Fatigue and Wellness Awareness',3,'Non-Driving Activities'],
 ['A1.5.5','Post-Crash Procedures',5,'Non-Driving Activities'],
 ['A1.5.6','External Communications',5,'Non-Driving Activities'],
 ['A1.5.7','Whistleblower/Coercion',5,'Non-Driving Activities'],
 ['A1.5.8','Trip Planning',4,'Non-Driving Activities'],
 ['A1.5.9','Drugs/Alcohol',5,'Non-Driving Activities'],
 ['A1.5.10','Medical Requirements',5,'Non-Driving Activities']
];
export const CLASS_A_THEORY_TOPICS:TheoryTopic[]=topics.map(([code,title,day,category])=>({code,title,day,category}));
export const CLASSROOM_WEEK_ONE:ClassroomDay[]=[
 {day:1,label:'Monday',title:'Orientation & tractor-trailer fundamentals',
  focus:'Six-hour Lone Star orientation, industry expectations, combination vehicle basics and FMCSA basic-operation theory.',
  blocks:[
   {title:'School orientation, safety and expectations',hours:2,method:'Policies, program flow, attendance and professional responsibilities'},
   {title:'FMCSA/NC rules and CDL career orientation',hours:2,method:'Regulations, consequences, licensing pathway and first-job expectations'},
   {title:'Orientation application & industry vocabulary',hours:2,method:'Student discussion, scenario checks and program paperwork'},
   {title:'J. J. Keller: systems, controls and inspections',hours:2,method:'Instructor-led approved modules and vehicle diagrams'},
   {title:'J. J. Keller: backing, shifting, coupling and basic control',hours:2,method:'Approved theory modules, GOAL and guided Q&A'}
  ],
  materials:['J. J. Keller course access','School handbook and orientation forms','Tractor-trailer diagrams','FMCSA/NC training objectives'],
  evidence:['Orientation attendance and policy acknowledgment','Assigned J. J. Keller module completions','Basic-operation knowledge check'],
  instructorNotes:'Orientation occupies six of the proposed ten net instructional hours. Confirm the J. J. Keller basic-operation lessons fit the remaining time; rebalance the week before approval.'
 },
 {day:2,label:'Tuesday',title:'Safe driving, hazard awareness & emergencies',
  focus:'FMCSA safe-operation and advanced-operating theory with real incident and judgment scenarios.',
  blocks:[
   {title:'Visual search, communication and distractions',hours:2,method:'J. J. Keller + narrated driving hazards'},
   {title:'Speed/space management and braking judgment',hours:2,method:'J. J. Keller + safe following-distance scenarios'},
   {title:'Night operation and extreme conditions',hours:2,method:'J. J. Keller + weather/grade decision exercise'},
   {title:'Hazards, skids, recovery and emergencies',hours:2,method:'J. J. Keller + facilitated risk response'},
   {title:'Railroad crossings & decision challenge',hours:2,method:'J. J. Keller + clearance/railroad problem set'}
  ],
  materials:['J. J. Keller assigned modules','Photos/videos of road conditions','Railroad-crossing diagram'],
  evidence:['Assigned J. J. Keller module completions','Hazard recognition worksheet','Instructor-led review of incorrect decisions'],
  instructorNotes:'Do not treat a discussion or video as actual behind-the-wheel proficiency. Record roadway competencies during the separate required training phase.'
 },
 {day:3,label:'Wednesday',title:'Hours-of-service clock, ELD & daily logs',
  focus:'Complete vehicle-system theory and HOS/fatigue requirements; dedicate a practical workshop to actual clock and log calculations.',
  blocks:[
   {title:'Vehicle malfunctions, inspections and maintenance',hours:2,method:'J. J. Keller + out-of-service examples'},
   {title:'Hours-of-service rules and fatigue',hours:2,method:'J. J. Keller + 11/14, breaks, cycles and exceptions'},
   {title:'Paper daily logs and cycle recaps',hours:2,method:'Students record four duty statuses and total time'},
   {title:'ELD clock, duty changes and log corrections',hours:2,method:'ELD training environment / demonstration (not live driving)'}, 
   {title:'Driver-clock calculation assessment',hours:2,method:'Three individual scenarios + instructor review'}
  ],
  workshop:{title:'Professional logbook & HOS lab',
   objectives:['Distinguish 11-hour drive limit from 14-hour driving window','Calculate remaining drive, window and 60/70-hour cycle availability','Complete paper/ELD logs, annotations and recap','Identify rest, break and sleeper-berth conditions without assuming every exception applies'],
   steps:['Give each student a blank paper log and a sample ELD clock','Run a 06:00 on-duty / 06:30 drive scenario and identify the standard 20:00 driving-window endpoint','Include a shipper delay and determine why ordinary on-duty waiting does not pause the 14-hour window','Calculate an eight-day recap and a 34-hour-restart example','Score independent work; reteach missed legal limits'],
   scenario:'Start on-duty at 6:00 a.m.; complete 30 minutes of pre-trip work; begin driving at 6:30 a.m.; later spend two hours at a shipper. Students calculate the standard 14-hour driving-window deadline, driving and break constraints, and legal next actions.',
   assessment:'Individual log sheet + ELD status review + calculated clock/recap. Use an 80% local practice threshold and require correction of any unsafe time calculation.'
  },
  materials:['Blank 24-hour paper logs','HOS rules reference','ELD demo or training screenshots','8-day recap worksheet','Calculators'],
  evidence:['HOS rules quiz','Scored daily log, ELD exercise and recap','Remediation notes for time-limit errors'],
  instructorNotes:'FMCSA HOS instruction includes electronic and paper logs, timesheets and recaps as appropriate. These classroom exercises do not substitute for A3.7 road-training proficiency.'
 },
 {day:4,label:'Thursday',title:'Trip planning, atlas & route compliance',
  focus:'Cargo/documentation, environmental regulations and FMCSA trip planning, reinforced with a real-world atlas/dispatch workshop.',
  blocks:[
   {title:'Cargo securement, weight and shipping paperwork',hours:2,method:'J. J. Keller + sample bill of lading / axle weights'},
   {title:'Environmental compliance and trip rules',hours:2,method:'J. J. Keller + permits, vehicle dimensions and restrictions'},
   {title:'Trip planning regulations and navigation',hours:2,method:'J. J. Keller + GPS limitations and safe route selection'},
   {title:'Truck atlas & map-reading lab',hours:2,method:'Student map route: low bridges, grades, restricted routes and scales'},
   {title:'Greensboro → Dallas dispatch exercise',hours:2,method:'Plan route, HOS breaks, safe parking, fuel and appointment with time zone'}
  ],
  workshop:{title:'Truck atlas & dispatch route-planning lab',
   objectives:['Find interstate routes on a truck atlas','Spot bridge, axle/weight, vehicle-size and restricted-route issues','Estimate trip time with HOS, rest, traffic and time zones','Explain why ordinary car GPS routes may not be suitable for a tractor-trailer'],
   steps:["Distribute a trucker's atlas and a fictional load tender",'Choose a legal route from Greensboro, NC to Dallas, TX; verify truck restrictions with current sources','Mark fuel, weigh stations, parking and breaks','Calculate a realistic ETA from the supplied driver clock; account for time-zone differences','Introduce an earlier delivery request and have students explain when to reject an illegal dispatch'],
   scenario:'53-foot dry van, Greensboro to Dallas, fictional pickup/delivery appointment and supplied hours available. Do not provide assumed mileage: students must research and document the selected safe route.',
   assessment:'Completed route worksheet, stop plan, ETA and a written communication to dispatch. Instructor reviews restricted routes and HOS compliance.'
  },
  materials:["Current trucker's atlas",'Sample load confirmation','Truck-safe routing reference','HOS/ETA worksheet','Calculator'],
  evidence:['Signed trip plan','Map-reading worksheet','Dispatch-delay response and practical rubric'],
  instructorNotes:'All routes, permits and parking must be verified from current authoritative road information; do not use illustrative routes for real dispatch.'
 },
 {day:5,label:'Friday',title:'Remaining FMCSA topics & professional readiness',
  focus:'Complete all assigned theory modules, address required driver rights and administrative topics, conduct a combined scenario and theory assessments.',
  blocks:[
   {title:'Post-crash and external communications',hours:2,method:'J. J. Keller + roadside inspection role play'},
   {title:'Coercion protections, drugs/alcohol and medical qualification',hours:2,method:'J. J. Keller + reporting and compliance scenarios'},
   {title:'Vendor module completion and remediation',hours:2,method:'Finish any remaining approved theory content; review weak subjects'},
   {title:'Lone Star professional driver challenge',hours:2,method:'Integrated clock/log/map/load and dispatcher scenario'},
   {title:'Theory exams and guided closeout',hours:2,method:'J. J. Keller assessments + local practical review; document gaps'}
  ],
  workshop:{title:'Professional driver readiness challenge',
   objectives:['Tie together a legal route, ELD clock and load documents','Understand driver pay terms and employer communications','Recognize unrealistic dispatch expectations and driver safety rights'],
   steps:['Give students load confirmation, truck specifications, current driver clock and route materials','Require paper or simulated ELD logs, compliant ETA and parking/fuel plan','Add a simulated delay and require communication to dispatch','Review driver pay basics (CPM, hourly, percentage, detention, layover)','Record practical rubric, missing J. J. Keller units and a remediation plan'],
   scenario:'Students plan one fictional load, identify legal limits and produce a written message to a dispatcher if the appointment is not achievable.',
   assessment:'School-level readiness rubric (suggested 80%); this is separate from the required vendor/FMCSA theory assessment.'
  },
  materials:['Assigned J. J. Keller theory and final assessment','Sample BOL and load tender','Paper/ELD practice log','Truck atlas and worksheet'],
  evidence:['J. J. Keller assessment results and module evidence','Signed local driver-readiness challenge','Remediation/retake plan'],
  instructorNotes:'Do not sign off federal theory merely because this five-day plan is visible. Verify every module, all thirty topics, actual 50 net classroom hours and assessment performance.'
 }
];
export const CLASSROOM_HOURS_TARGET=50;
export function topicsForDay(day:number){return CLASS_A_THEORY_TOPICS.filter(topic=>topic.day===day);}
export function suggestedClassroomHours(){return CLASSROOM_WEEK_ONE.reduce((total,day)=>total+day.blocks.reduce((sum,block)=>sum+block.hours,0),0);}
export function theoryTopicGaps(days:ReadonlyArray<Pick<ClassroomDay,'day'>>=CLASSROOM_WEEK_ONE){
 const valid=new Set(days.map(d=>d.day));return CLASS_A_THEORY_TOPICS.filter(topic=>!valid.has(topic.day)).map(topic=>topic.code);
}
export function createClassroomWeekPlans(existing:{[key:string]:any}[],campusId:string,instructor=''){
 if(!campusId)throw Error('Choose an actual campus before saving the plan.');
 const keys=new Set(existing.filter(p=>p.kind==='lessons'&&p.campusId===campusId).map(p=>p.curriculumKey));
 return CLASSROOM_WEEK_ONE.filter(day=>!keys.has('class-a-week1-day'+day.day)).map(day=>({
  id:crypto.randomUUID(),kind:'lessons',name:day.title,status:'Planned',
  curriculumKey:'class-a-week1-day'+day.day,curriculumVersion:'2026-11-07-proposal',
  campusId,program:'Class A',week:1,day:day.day,phase:'Classroom',hours:10,
  objectives:day.focus,steps:day.blocks,topicCodes:topicsForDay(day.day).map(t=>t.code),
  jjKellerModuleMap:{},jjKellerMappingVerified:false,
  workshop:day.workshop||null,materials:day.materials,evidence:day.evidence,
  instructorNotes:day.instructorNotes,instructor,assessmentId:''
 }));
}
