/** Investor/owner presentation story, using invented student identities only.
 * Each scene explicitly distinguishes built workflows from integration gates. */
export type TourScene={
 id:string;eyebrow:string;title:string;subtitle:string;metric:string;metricLabel:string;
 bullets:string[];tag:string;featurePage:string;narration:string;seconds:number;
};
export const ACADEMY_OWNER_TOUR:TourScene[]=[
 {id:'network',eyebrow:'01 / SCHOOL-WIDE CONTROL',title:'One school. Three campuses. One command center.',
  subtitle:'Greensboro • Dallas • Mansfield • ready for the next location',
  metric:'100',metricLabel:'Fictional students across seven stages',
  bullets:['100 practice students — 34 Greensboro / 33 Dallas / 33 Mansfield','50 additional fictional applicants waiting on funding','Campus filters, role-restricted records and schoolwide oversight'],
  tag:'LIVE INTERACTIVE DEMO • SYNTHETIC DATA',featurePage:'overview',seconds:9,
  narration:'Introducing Academy O S: one operational command center across Greensboro, Dallas, and Mansfield. Our test school holds one hundred fictional students and fifty funding-pending applicants.'},
 {id:'leads',eyebrow:'02 / LEAD TO ENROLLMENT',title:'Every inquiry has a clear next action.',
  subtitle:'From first phone call to application, funding, and an actual seat',
  metric:'50',metricLabel:'Fictional funding-pending applicants',
  bullets:['Lead intake, follow-ups and calendar appointments','Funding paths: cash, WIOA, WRLP and other approved sponsors','Student seat linked to a real campus and class start date'],
  tag:'DEMO WORKFLOW • NO LIVE STUDENT INFORMATION',featurePage:'leads',seconds:8,
  narration:'When a student calls, we save the lead, assign follow-ups, coordinate WIOA or cash funding, and place the student in a confirmed class. We can track the fifty fictional applicants awaiting funding.'},
 {id:'starts',eyebrow:'03 / BIWEEKLY STARTS',title:'November 16 is on the admissions calendar.',
  subtitle:'Class A start dates every two weeks, per campus',
  metric:'11/16',metricLabel:'Next planned Class A start in 2026',
  bullets:['November 16 → November 30 → December 14 → December 28','Five-week program with campus-level capacity planning','Actual schedule, holidays and pricing still require approval'],
  tag:'DRAFT SCHEDULES • NO AUTO-ENROLLMENT',featurePage:'rosters',seconds:8,
  narration:'Starting November sixteenth, the class calendar proposes a new group every two weeks. Each location controls its seats, funding sources, staff coverage and training dates.'},
 {id:'documents',eyebrow:'04 / SECURED STUDENT FILE',title:'Missing agreements no longer hide in email.',
  subtitle:'Private records, verified uploads, student ID portraits and notices',
  metric:'🔒',metricLabel:'Encrypted restricted student evidence',
  bullets:['Request a missing enrollment agreement or driver license','Student uploads through their authorized private portal','Managers verify documents; ID cards use approved portraits'],
  tag:'UPLOADS REQUIRE SECURITY GATE & STUDENT CONSENT',featurePage:'document-center',seconds:9,
  narration:'The campus flags a missing enrollment agreement. The student sees a private portal notice and uploads directly to their protected record. Authorized staff verify the file before it is accepted.'},
 {id:'dmv',eyebrow:'05 / COMPLIANCE HANDOFF',title:'A first-day roster with the signed contracts.',
  subtitle:'NC DMV reporting packet — manager-only preflight and export',
  metric:'1 ZIP',metricLabel:'Roster CSV plus executed enrollment agreements',
  bullets:['Name, license number, DOB, phone, address and class dates','Block the packet if required records or signed contracts are missing','No automatic DMV submission; secure recipient verification required'],
  tag:'NC TEMPLATE • TEXAS REQUIREMENTS SEPARATE',featurePage:'rosters',seconds:8,
  narration:'On day one, the North Carolina compliance coordinator reviews the class roster, including contact and license details. The system blocks incomplete packets and gathers verified student agreements.'},
 {id:'theory',eyebrow:'06 / WEEK-ONE CLASSROOM',title:'Teach the driver — not just the test.',
  subtitle:'J. J. Keller + 30 FMCSA theory units + Lone Star readiness labs',
  metric:'30',metricLabel:'Class A FMCSA standard theory subjects mapped',
  bullets:['Driver-clock calculations and paper/electronic logbook labs','Truck atlas, restricted routes and trip planning','Final lesson evidence and instructor-led assessments'],
  tag:'VENDOR MODULES & HOURS MUST BE VERIFIED',featurePage:'courses',seconds:9,
  narration:'Our theory week keeps J J Keller and all thirty required federal Class A subjects, while adding professional workshops in electronic logs, hours of service, atlas reading and trip planning.'},
 {id:'quiz',eyebrow:'07 / FIND GAPS BEFORE FRIDAY',title:'Know who is struggling — and exactly why.',
  subtitle:'General Knowledge • Air Brakes • Combination Vehicles',
  metric:'80%',metricLabel:'Local reteaching trigger, not an official state score',
  bullets:['Instructor-reviewed quizzes tag each learning objective','Individual scores and cohort-wide missed-topic patterns','Targeted remediation before Friday knowledge testing'],
  tag:'PRACTICE ONLY • NOT DMV/FMCSA EXAMS',featurePage:'learning-diagnostics',seconds:9,
  narration:'Instead of discovering on Friday that students failed general knowledge, air brakes or combinations, the instructor gives an early diagnostic and sees the specific concepts that need reteaching.'},
 {id:'progress',eyebrow:'08 / STUDENT 360',title:'A visible path from classroom to graduation.',
  subtitle:'Every hour, assessment, skill and instructor note in context',
  metric:'360°',metricLabel:'One student record across the five-week journey',
  bullets:['Week-one lessons and attendance documented separately','Yard and road competencies tracked with instructor evidence','Testing readiness and graduation gaps before sign-off'],
  tag:'TRAINING PROGRESS ≠ FMCSA CERTIFICATION',featurePage:'students',seconds:8,
  narration:'Open any student to see progress from orientation through classroom, yard, road and skills testing. Hours and checkoffs come from real documented instruction, not a percentage we made up.'},
 {id:'teams',eyebrow:'09 / PEOPLE & LOCATIONS',title:'School leadership sees everything. Staff see their campus.',
  subtitle:'Assigned tasks, appointments, campus permissions and pilot accounts',
  metric:'3',metricLabel:'Pilot locations, unlimited future campuses by setup',
  bullets:['Owner-approved regional access for authorized leadership','Employee tasks and appointments tied to an approved campus','Private student records never visible to unrelated campuses'],
  tag:'ROLE-BASED ACCESS • PILOT INVITATIONS',featurePage:'pilot-access',seconds:8,
  narration:'Greensboro employees see Greensboro students. Texas employees see their assigned campus. Approved regional leadership can step in across locations, and every task has a responsible team member.'},
 {id:'decision',eyebrow:'10 / THE OWNER DECISION',title:'One platform. Measurable outcomes. A safer pilot.',
  subtitle:'Use the practice school now; approve real-data access only after testing',
  metric:'150',metricLabel:'Fictional people to explore in the demo',
  bullets:['100 sample students + 50 fictional funding-pending applicants','Pilot controls and private uploads remain gated for security review','Retire duplicate tools only after acceptance, migration and training'],
  tag:'DEMONSTRATE THE IDEA • DO NOT CLAIM GO-LIVE',featurePage:'overview',seconds:10,
  narration:'This is a working demonstration of a single multi-campus academy operating system. The next decision is a controlled pilot, testing roles, data privacy, compliance and migration before any permanent system switch.'}
];
export const TOUR_DURATION_SECONDS=ACADEMY_OWNER_TOUR.reduce((n,s)=>n+s.seconds,0);
export function tourAtTime(seconds:number){
 let t=Math.min(Math.max(0,seconds),Math.max(0,TOUR_DURATION_SECONDS-0.0001));
 for(let i=0;i<ACADEMY_OWNER_TOUR.length;i++){if(t<ACADEMY_OWNER_TOUR[i].seconds)return {index:i,scene:ACADEMY_OWNER_TOUR[i],within:t,progress:t/ACADEMY_OWNER_TOUR[i].seconds};t-=ACADEMY_OWNER_TOUR[i].seconds;}
 return {index:ACADEMY_OWNER_TOUR.length-1,scene:ACADEMY_OWNER_TOUR.at(-1)!,within:0,progress:1};
}
export function tourStart(index:number){return ACADEMY_OWNER_TOUR.slice(0,Math.max(0,index)).reduce((t,s)=>t+s.seconds,0);}
