import type {RecordData as R} from './training.ts';

/**
 * Owner's actual-workspace guided operator tour.
 * No script accesses network, browser credentials, production student data,
 * external services, TPR or DMV; writes are ONLY to the in-memory demo list.
 * The parent must enforce demo mode before calling applyOperatorExample.
 */
export type OperatorStep={
 id:string;page:string;stage:string;title:string;operatorAction:string;
 evidence:string;voice:string;selector:string;action?:string;campus?:'Greensboro'|'Dallas'|'Mansfield'|'All';
 tourRole?:'Owner';studentDrawer?:boolean;trainingView?:string;cssLabel?:string;
};
export const TOUR_STUDENT_ID='demo-mega-student-0-001';
export const OPERATOR_STEPS:OperatorStep[]=[
 {id:'dashboard',page:'overview',stage:'01 · Command center',title:'Start in the real Academy OS dashboard',operatorAction:'The operator opens the multi-campus command center and checks 100 fictional student records plus 50 pending funding leads.',evidence:'Live school dashboard, status distribution and real campus filters.',selector:'.demo-showcase-panel',campus:'All',voice:'First I open the real Academy O S dashboard. Here are one hundred fictional students, fifty applicants waiting on funding, and our three campus locations.'},
 {id:'inquiry',page:'leads',stage:'02 · Admissions',title:'Enter a brand-new applicant',operatorAction:'The operator creates a fictional Class A inquiry for the same student we will follow through training.',evidence:'A new sample inquiry appears in the live New Inquiries list.',selector:'.toolbar',action:'inquiry',campus:'Greensboro',voice:'I enter a new Class A applicant, assign Greensboro as the location, and record the funding interest. This changes the sample admissions pipeline.'},
 {id:'funding-pending',page:'leads',stage:'03 · Admissions',title:'Set a follow-up and funding-pending status',operatorAction:'The operator updates the applicant from New inquiry to Funding pending and saves a next-contact date.',evidence:'Saved lead status and next admissions action.',selector:'.kanban',action:'funding-pending',voice:'When a workforce authorization has not arrived, I mark the application funding pending and set the next follow up. No seat is falsely counted as funded.'},
 {id:'payer',page:'sponsorships',stage:'04 · Funding',title:'Track a WIOA funding request',operatorAction:'The operator links a fictional WIOA category to the student, explicitly marked awaiting authorization.',evidence:'Funding request recorded on the actual synthetic student profile; not an agency approval.',selector:'.titlebar',action:'payer',voice:'Here I select WIOA funding. The school can track the request, and nobody mistakes this sample record for a confirmed authorization.'},
 {id:'appointment',page:'calendar',stage:'05 · Appointments',title:'Schedule intake with an assigned coordinator',operatorAction:'The operator creates a fictional intake appointment for November 12 with a campus staff member.',evidence:'The sample appointment joins the school\'s saved calendar records.',selector:'.titlebar',action:'appointment',voice:'Next I schedule the admissions appointment and assign it to an approved Greensboro employee. A team calendar means we can see who has a follow up.'},
 {id:'school-announcement',page:'calendar',stage:'05B · Campus messages',title:'Publish a real example of a student announcement',operatorAction:'The operator publishes a fictional orientation update for Greensboro. The student portal should show the banner only during its scheduled dates.',evidence:'Calendar announcement plus student-facing notice, with campus and audience restrictions.',selector:'.academy-calendar-page',action:'demo-announcement',campus:'Greensboro',voice:'In the school calendar I publish an important student announcement, choosing the dates, student audience and Greensboro campus. This example appears in the fictional student portal.'},
 {id:'school-closure',page:'calendar',stage:'05C · Emergency calendar',title:'Publish a school closure and student banner',operatorAction:'The operator creates a fictional weather closure and checks the protected student portal notice preview.',evidence:'A confirmed campus closure blocks the date and publishes only the approved school notice.',selector:'.academy-calendar-page',action:'demo-closure',voice:'When weather closes the yard, the manager records the closure once. The calendar marks the date and the student portal shows the safety announcement.'},
 {id:'staff-birthday',page:'calendar',stage:'05D · Birthday calendar',title:'Show an opted-in staff birthday on the calendar',operatorAction:'The operator records a fictional employee birthday preference without showing a full birth date to students.',evidence:'The authorized school calendar displays the staff birthday without transmitting DOB to students.',selector:'.academy-calendar-page',action:'demo-birthday',voice:'A staff member can opt into the birthday calendar. Management sees the celebration, but student accounts do not get access to a colleague’s date of birth.'},
 {id:'start-dates',page:'classes',stage:'06 · Cohorts',title:'See every-two-week school start dates',operatorAction:'The operator opens the real class schedule and checks the November 16 start and subsequent cohorts.',evidence:'Cohorts, dates, seats and assigned locations; these remain planning dates.',selector:'.toolbar',voice:'I choose the November sixteenth Class A cohort. Our program starts every two weeks, with the training schedule kept by location.'},
 {id:'student-file',page:'students',stage:'07 · Enrollment',title:'Open the actual student file',operatorAction:'The operator opens the fictional enrollment-pending student and reviews their record.',evidence:'Real Student 360 record drawer with class and progress fields.',selector:'.drawer',studentDrawer:true,voice:'Now I open the student record. One file follows this driver through documents, classroom training, the yard, road training and completion.'},
 {id:'request-files',page:'document-center',stage:'08 · Encrypted documents',title:'Flag required enrollment paperwork as missing',operatorAction:'The operator requests an agreement, a driver license and SSN evidence in the simulated checklist.',evidence:'In-app missing-document notices appear in the fictional student file. No text messages are sent.',selector:'.vault-doc-grid',action:'request-files',voice:'Enrollment staff mark the agreement and identity items as missing. This creates a private portal notice for the student; it does not email or text anyone.'},
 {id:'portal-upload',page:'student-portal-preview',stage:'09 · Student self-service',title:'Go inside the student portal and respond',operatorAction:'The operator opens the real student-portal simulator, then adds a fictional signed-agreement entry to the school review queue.',evidence:'Student-side Documents view and staff-visible pending-review status; no actual sensitive file bytes.',selector:'.demo-student-shell',action:'portal-upload',voice:'I switch to the student side. They can see what is missing and submit an agreement securely. This sample upload contains no real personal information.'},
 {id:'review',page:'document-center',stage:'10 · Staff verification',title:'Approve the submitted agreement after review',operatorAction:'The operator verifies only the simulated agreement; driver license and SSN requirements stay outstanding.',evidence:'Agreement moves from Submitted to Verified in the sample vault.',selector:'.vault-doc-grid',action:'review',voice:'Back in the office, I verify the fictional enrollment agreement, without marking all the other outstanding documents complete.'},
 {id:'photo-id',page:'student-id-studio',stage:'11 · Student identification',title:'Prepare a photo ID card',operatorAction:'The operator adds a fictional verified portrait reference and unique student ID; the live Print ID action is displayed.',evidence:'Preview-ready student ID with no SSN or driver-license number.',selector:'.student-badge-studio',action:'photo-id',voice:'Next I prepare the student badge using a demo portrait and school-issued student ID. The social security number is never printed on it.'},
 {id:'first-day',page:'rosters',stage:'12 · DMV compliance',title:'Check first-day roster readiness',operatorAction:'The operator runs the actual sample NC roster preflight for the class and reviews missing contracts and roster fields.',evidence:'Real roster readiness report—export remains blocked when requirements are missing.',selector:'.compliance-rosters',cssLabel:'preflight',voice:'Here is the North Carolina first-day compliance checklist. It flags missing information and verified signed agreements instead of creating an incomplete packet.'},
 {id:'week-one',page:'courses',stage:'13 · FMCSA theory',title:'Teach all 30 Class A theory subjects',operatorAction:'The operator opens the real 50-hour proposal and the structured lesson blocks in the Week-one planner.',evidence:'FMCSA subject crosswalk and hands-on logging, ELD, map and trip planning workshops.',selector:'.classroom-curriculum',trainingView:'Week-one planner',voice:'In Week One, students cover every required Class A federal theory topic, plus planned workshops for logging, hours of service, map reading and trip planning. J J Keller course mapping still needs approval.'},
 {id:'daily-plan',page:'driver-playbook',stage:'14 · Instructor plan',title:'Inspect the 25-day instructor playbook',operatorAction:'The operator reviews classroom, pre-trip, maneuvers, road and testing week lesson guidance.',evidence:'Instructor-facing day-by-day training workflow and rubric documentation.',selector:'.titlebar',voice:'Our instructors also have a twenty five day teaching and coaching playbook, so training quality is visible from the first day through testing.'},
 {id:'knowledge-test',page:'student-portal-preview',stage:'15 · Practice assessment',title:'Student takes a subject-based knowledge check',operatorAction:'The operator opens the working student quiz and records a realistic, fictional six-question assessment.',evidence:'School practice score with exact General Knowledge, Air Brakes and Combination Vehicles objectives.',selector:'.demo-student-shell',action:'knowledge-test',voice:'Now the student works through a knowledge check. It grades each response by the exact CDL subject and objective, not just the overall percentage.'},
 {id:'knowledge-report',page:'learning-diagnostics',stage:'16 · Intervention',title:'See what the student missed before Friday',operatorAction:'The operator opens the classwide dashboard for a low-scoring sample assessment (four of six correct).',evidence:'Below-threshold subject percentage, incorrect objectives and required instructor coaching.',selector:'.learning-diagnostics',voice:'The instructor can immediately see the concepts a student missed, including air brakes or combination vehicles. We can reteach them before Friday, instead of guessing who was listening.'},
 {id:'knowledge-retest',page:'learning-diagnostics',stage:'17 · Mastery recovery',title:'Record an improved diagnostic after coaching',operatorAction:'The operator stores a second fictional six-of-six practice result, without treating it as an official FMCSA exam.',evidence:'Two separate assessment attempts and updated student knowledge mastery.',selector:'.learning-diagnostics',action:'knowledge-retest',voice:'After coaching we retest the same learning objectives. Both attempts are kept, showing exactly how the student improved. A local quiz is not a federal completion certification.'},
 {id:'daily-log',page:'courses',stage:'18 · Daily logs',title:'Record a classroom session and instructor note',operatorAction:'The operator adds a clearly fictional, time-matched classroom log and points out the difference between actual hours and target hours.',evidence:'Student-specific classroom session with instructor, time and coaching note.',selector:'.titlebar',action:'classroom-log',trainingView:'Daily board',voice:'This is the daily instructor record. We track attendance, instructional time and what the student practiced, rather than relying only on a total-hours number.'},
 {id:'yard',page:'courses',stage:'19 · Range training',title:'Move the student to the yard with real skill categories',operatorAction:'The operator updates the sample student to Yard and records a two-hour backing/coaching session.',evidence:'A fictional range training entry and an instructor note; not a claim of proficiency.',selector:'.titlebar',action:'yard-log',trainingView:'Daily board',voice:'When the student enters yard training, we track backing, pre-trip and other practical skills. Coaching notes identify what still needs work.'},
 {id:'dispatch',page:'dispatch',stage:'20 · Training assignments',title:'See instructor, truck and student assignments',operatorAction:'The operator opens the real training-dispatch screen to show scheduling and safety checks.',evidence:'Training assignment board with vehicle and instructor availability rules.',selector:'.titlebar',voice:'In the dispatch board, we coordinate instructor availability, training vehicles and students. It helps prevent conflicting assignments.'},
 {id:'road',page:'courses',stage:'21 · Road work',title:'Record a road-driving training session',operatorAction:'The operator changes the sample student\'s training location to Road and adds a fictional student-driving session.',evidence:'Separate, labeled student-operating record and coaching note. Observation is not falsely credited as driving.',selector:'.titlebar',action:'road-log',trainingView:'Daily board',voice:'Next is on-road driving. The record distinguishes who actually operated the vehicle from ride-along observation and stores the instructor note.'},
 {id:'student-progress',page:'students',stage:'22 · Student 360',title:'Open the same student’s full progress timeline',operatorAction:'The operator opens the same fictional student after their recorded milestones and diagnostic retest.',evidence:'Live student detail screen with attendance, grades and remaining completion gaps.',selector:'.drawer',studentDrawer:true,voice:'Here is the same student record with their notes and practice attempts. Remaining requirements are still visible; the school does not mark graduation early.'},
 {id:'graduation',page:'students',stage:'23 · Testing & graduation',title:'Review graduation tracking without false certification',operatorAction:'The operator displays the student list and existing fictional advanced-stage students, including graduates.',evidence:'Testing, results and graduation workflow—real skills evidence requires separate verification.',selector:'.toolbar',voice:'At the end of the program, approved records show testing and graduation progress. The sandbox includes graduates, but it does not claim the real student has satisfied federal or state requirements.'},
 {id:'student-career',page:'student-portal-preview',stage:'24B · Career readiness',title:'Open the student journey and Driver Pulse career handoff',operatorAction:'The fictional student checks current milestones and follows a clearly labeled link to set up their own external job profile. No private Academy OS data is transferred automatically.',evidence:'A student-only progress rail, practice and paperwork shortcuts, and verified external Driver Pulse options.',selector:'.demo-student-portal',voice:'Before the student graduates, the portal shows exactly what they have completed and what is next. Driver Pulse opens separately so they can create a job profile and explore carriers without sending their private school record.'},
 {id:'billing',page:'funding-invoices',stage:'24 · Payer billing',title:'Review funding invoices and payer evidence',operatorAction:'The operator opens WIOA, WRLP and outside-payer invoice preparation and approval workflow.',evidence:'School billing interface; no real charge or agency authorization is created.',selector:'.titlebar',voice:'We also prepare payer documentation, invoices and funding records. The finance process connects to enrollment while remaining separate from actual payment collection.'},

 {id:'tuition-charge',page:'student-payments',stage:'25 · Tuition billing',title:'Create a tuition charge in the real student ledger',
 operatorAction:'The operator opens Student Payment Center and posts a fictional Class A $3,000 charge to the enrolled student.',
 evidence:'One new tuition charge, its due date, funding source, and a $3,000 fictional balance.',selector:'.student-payment-center',action:'tuition-charge',
 voice:'Now I create a tuition charge for the same student, on their actual Academy O S sample account. The school can use the listed funding category, but creating an invoice never means we received the money.'},
 {id:'remittance',page:'student-payments',stage:'26 · Payment processing',title:'Record a partial $750 cash payment for approval',
 operatorAction:'The operator records a synthetic cash remittance against the tuition charge. The balance stays unchanged until verification.',
 evidence:'A pending $750 receipt, tied to the specific charge and student, with a sample receipt reference.',selector:'.student-payment-center',action:'payment-remit',
 voice:'Here we log a seven hundred fifty dollar cash payment. The system requires a receipt reference and a second manager to verify actual remittances. Until then, it does not credit the account.'},
 {id:'reconcile',page:'student-payments',stage:'27 · Payment review',title:'Verify payment evidence and adjust the remaining balance',
 operatorAction:'The operator simulates second-manager approval of the fictional cash receipt.',
 evidence:'The confirmed $750 payment reduces the demo balance to $2,250; history remains auditable.',selector:'.student-payment-center',action:'payment-verify',
 voice:'Now a separate finance reviewer verifies that fictional receipt. The ledger subtracts seven hundred fifty dollars and preserves the approval history.'},
 {id:'stripe',page:'student-payments',stage:'28 · Online checkout',title:'Connect Stripe to each individual student account',
 operatorAction:'The operator demonstrates a signed, synthetic Stripe payment of the $2,250 remainder—no provider call or credit card charge.',
 evidence:'The student ledger shows two payment sources and a zero outstanding demo balance.',selector:'.student-payment-center',action:'stripe-sim',
 voice:'For online payments, Stripe hosted Checkout confirms a payment by a signed webhook. Here we simulate the verified event, with no real customer card and no money movement.'},
 {id:'student-balance',page:'student-portal-preview',stage:'29 · Student self-service',title:'The student checks their own tuition balance',
 operatorAction:'The operator opens the fictional student portal to connect tuition and training in the same experience.',
 evidence:'Student-side experience; live authorized accounts see only their own school-posted balance.',selector:'.demo-student-shell',
 voice:'Students can check their own school posted balance, follow their training progress, upload missing documents, practice for knowledge tests and open Driver Pulse without calling the campus every time.'},
 {id:'team',page:'tasks',stage:'30 · Work assignments',title:'Assign a campus task to the team',operatorAction:'The operator creates a fictional document-follow-up task for an authorized employee.',evidence:'Saved task appears in the school\'s staff-assignment board.',selector:'.team-assignments',action:'assign-task',voice:'Now I assign a follow up task to a real role at a single campus. Team members get their own work list and permissions.'},
 {id:'staff',page:'pilot-access',stage:'31 · Staff access',title:'Invite Texas or Greensboro staff without sharing a login',operatorAction:'The operator displays owner-only activation tools and campus-scoped access settings; it does not issue a live invite.',evidence:'Role and campus access controls with regional leadership permissions.',selector:'.pilot-access',tourRole:'Owner',voice:'School leadership can invite an employee with their own login and only the campuses they are permitted to see. Nobody has to share the owner password.'},
 {id:'dallas',page:'insights',stage:'32 · Texas campuses',title:'Switch to Dallas and compare campus results',operatorAction:'The operator switches the global campus filter to Dallas, keeping Greensboro students out of the local view.',evidence:'Campus-filtered schoolwide reporting.',selector:'.campusbar',campus:'Dallas',voice:'Now we switch to Dallas. Site managers see their own student records, and approved regional leadership can compare multiple campuses.'},
 {id:'mansfield',page:'insights',stage:'33 · Texas campuses',title:'Switch to Mansfield and review training results',operatorAction:'The operator switches to Mansfield without any record transfer between schools.',evidence:'Another campus filtered from the same operating system.',selector:'.campusbar',campus:'Mansfield',voice:'Then we review Mansfield with the same toolset, but a different location scope.'},
 {id:'leadership',page:'manager-brief',stage:'34 · Leadership',title:'Generate a manager-ready campus report',operatorAction:'The operator displays the real weekly reporting and management briefing workspace.',evidence:'Leadership summary tied to saved school records.',selector:'.titlebar',campus:'All',voice:'Finally, management gets a weekly picture of enrollment, classroom progress, funding work and operational risks, instead of having to chase spreadsheets.'},
 {id:'staff-calendar',page:'shifts',stage:'35 · Staffing',title:'Open the printable seven-day staff calendar',operatorAction:'Review scheduled and approved shifts by week and campus without changing payroll.',evidence:'Weekly calendar, shift assignments, availability conflicts and print option.',selector:'.titlebar',voice:'Here is the work calendar, not just a form for assigning shifts. It shows employees and their start and end times by campus and alerts us to staffing conflicts.'},
 {id:'bulk-attendance',page:'courses',stage:'36 · Whole-class instruction',title:'Review bulk classroom attendance and smiley performance',operatorAction:'Open the working attendance board for the fictional class; no attendance is submitted automatically.',evidence:'Seven A M to four P M schedule with one hour break and per-student exceptions.',selector:'.trainingcenter',trainingView:'Daily board',voice:'The instructor can stage attendance and performance for a whole class. Each learner can be adjusted before actual time and smiley coaching results are signed and saved.'},
 {id:'hours-audit',page:'rosters',stage:'37 · Historic classroom hours',title:'Audit pending reported hours against verified instruction',operatorAction:'View the actual reporting distinction without generating fictitious sessions.',evidence:'November second student roster and pending versus recorded classroom hour fields.',selector:'.titlebar',voice:'Our prior hour reporting is separate from verified instructor sessions. This prevents the school from accidentally claiming federally compliant training evidence it does not yet have.'},
 {id:'instructor-checklist',page:'driver-playbook',stage:'38 · Lesson plan',title:'Check individual student learning through the five-week playbook',operatorAction:'Inspect the daily instructor teaching script and student-specific smiley checklist.',evidence:'Federal theory subjects, J J Keller crosswalk, vehicle labs and remedial follow-up.',selector:'.daily-playbook',voice:'The classroom instructor can follow the plan, verify coverage of each subject, and flag individual students with green, yellow or red learning notes.'},
 {id:'school-library',page:'school-knowledge',stage:'39 · Staff knowledge',title:'Find the school document center and policy history',operatorAction:'View the school policy library without publishing a sample file or accessing private records.',evidence:'Category filter, policy versions, effective date, review date and access by campus and audience.',selector:'.school-knowledge-hub',voice:'Our central document center holds approved school procedures, instructor guides, announcements and reference links to OneDrive or SharePoint. Student records stay in their own secure vault.'},
 {id:'text-email',page:'student-communications',stage:'40 · Messaging',title:'Prepare a reusable email or SMS reminder',operatorAction:'Review message composer, templates and consent-based recipients. Do not send any live outreach.',evidence:'Template editor, recipient selection, Twilio and Resend connection status.',selector:'.titlebar',voice:'The campus team can prepare consistent reminder emails and text messages. The interface works without pretending a provider is live; actual delivery requires consent and connected school accounts.'},
 {id:'school-connections',page:'integrations',stage:'41 · Connections',title:'Inspect the exact production connection requirements',operatorAction:'Open the school integrations page and identify unconnected providers.',evidence:'One school place for Microsoft, Twilio, Resend, secure vault and launch checks.',selector:'.titlebar',voice:'Here we show which integrations are supported and which remain unconfigured. A successful demonstration never claims an email, text, payment or private file upload happened without proof.'},
 {id:'finish',page:'overview',stage:'42 · Owner handoff',title:'The owner has now watched the system operate',operatorAction:'The operator returns to the live Academy OS demo dashboard with the fictional changes visible.',evidence:'100 fictional enrolled student records, 50 pending funding leads plus one new simulated inquiry, real menus and a guided click-by-click tour.',selector:'.demo-showcase-panel',campus:'All',voice:'That is the full Academy O S journey from a real interface walkthrough, using sample data. Before switching the school, we still verify secure file storage, staff permissions, regulatory evidence and owner acceptance.'}
];
export const OPERATOR_ACTION_IDS=new Set(OPERATOR_STEPS.flatMap(s=>s.action?[s.action]:[]));

export function sampleOperatorStudent(records:R[]):R|undefined{
 return records.find(r=>r.id===TOUR_STUDENT_ID&&r.kind==='students')
 ||records.find(r=>r.kind==='students'&&r.status==='Enrollment pending')
 ||records.find(r=>r.kind==='students');
}
function sampleStaff(records:R[],campusId:string){return records.find(r=>r.kind==='staff'&&r.status==='Active'&&(r.campusIds||[]).includes(campusId));}
function assessment(studentId:string,pass:boolean):any{
 const subject=['General Knowledge','General Knowledge','Combination Vehicles','Combination Vehicles','Air Brakes','Air Brakes'];
 const objective=['Safe stopping distance','Highway space management','Coupling inspection','Trailer tracking','Low air warning','Air system inspection'];
 const correct=pass?[true,true,true,true,true,true]:[true,true,false,true,false,true];
 const items=correct.map((value,i)=>({questionId:'op-knowledge-'+studentId+'-'+i+(pass?'-repeat':''),subject:subject[i],objective:objective[i],correct:value}));
 const count=correct.filter(Boolean).length;
 return {id:'operator-'+(pass?'retest':'test')+'-'+studentId,assessmentId:'operator-school-practice-'+(pass?'repeat':'first'),name:pass?'DEMO practice retest after coaching':'DEMO pre-Friday knowledge check',type:'Quiz',studentPractice:true,week:1,date:'2026-11-06',correct:count,total:6,score:Math.round(count/6*10000)/100,
  instructor:'Fictional Lone Star Instructor',remediation:pass?'':'Reteach coupling inspection and low air warning before retesting.',itemResults:items,demoOnly:true};
}
function session(id:string,phase:'Classroom'|'Yard'|'Road',date:string,skill:string,notes:string){
 return {id:'operator-'+phase.toLowerCase()+'-session-'+id,date,phase,start:'08:00',end:'10:00',hours:2,breakMinutes:0,attendance:'Present',instructor:'DEMO · Lone Star Instructor',
  skill,mood:phase==='Classroom'?'yellow':'green',notes,mode:phase==='Road'?'Student driving':'Instruction',studentOperatedVehicle:phase==='Road',demoOnly:true};
}
export type OperatorExample={updates:R[];message:string;studentId?:string};
/** This transforms demo data only; caller must verify sample-mode state before saving. */
export function applyOperatorExample(action:string,records:R[]):OperatorExample{
 const person=sampleOperatorStudent(records);
 if(!person)return {updates:[],message:'No permitted synthetic student in this demo campus. Select the owner test view.'};
 const c=person.campusId,leadId='operator-lead-'+person.id,appointmentId='operator-appointment-'+person.id,taskId='operator-task-'+person.id;
 const lead=records.find(r=>r.id===leadId);
 const owner=sampleStaff(records,c);
 if(action==='inquiry'){
  if(lead)return {updates:[],message:'The fictional inquiry is already in the sample admissions board.'};
  return {updates:[{id:leadId,kind:'leads',name:person.name,status:'New inquiry',campusId:c,program:'Class A',
   source:'Demo website inquiry',fundingInterest:'WIOA / workforce assistance',fundingType:'WIOA',phone:'555-010-0200',
   owner:owner?.name||'DEMO Enrollment specialist',followUp:'2026-11-12',notes:[],demoOnly:true}],message:'Created a real sample lead with WIOA interest and follow-up date.'};
 }
 if(action==='funding-pending'){
  if(!lead)return {updates:[],message:'Create the fictional inquiry first.'};
  if(lead.status==='Funding pending')return {updates:[],message:'The applicant is already waiting for funding approval.'};
  return {updates:[{...lead,status:'Funding pending',fundingStatus:'Awaiting agency authorization',followUp:'2026-11-12'}],message:'Saved lead as Funding pending; follow-up remains November 12.'};
 }
 if(action==='payer')return {updates:[{...person,fundingType:'WIOA',fundingStatus:'Awaiting third-party authorization',fundingAgency:'Fictional workforce agency',sourceLead:leadId}],message:'Linked WIOA category to the existing sample student. No funding was approved.',studentId:person.id};
 if(action==='appointment'){
  if(records.some(r=>r.id===appointmentId))return {updates:[],message:'The fictional intake appointment is already scheduled.'};
  return {updates:[{id:appointmentId,kind:'appointments',campusId:c,name:'DEMO · '+person.name+' intake meeting',status:'Scheduled',
    type:'Enrollment document review',date:'2026-11-12',start:'10:00',end:'10:30',owner:owner?.name||'Demo coordinator',assignedTo:owner?.id||'',
    description:'Synthetic Class A intake follow-up. No messages were sent.',demoOnly:true}],message:'Created a sample intake appointment for November 12.'};
 }
 if(action==='demo-announcement'){
  const id='operator-demo-announcement-'+c;
  if(records.some(r=>r.id===id))return {updates:[],message:'Fictional announcement already present on the campus calendar.'};
  return {updates:[{id,kind:'announcements',campusId:c,name:'DEMO · Classroom and orientation reminder',status:'Published',priority:'Important',audience:'Students',
    startDate:'2026-11-07',endDate:'2026-12-04',body:'DEMO ONLY: Bring your study materials and check the calendar before coming to school.',publishOnPortal:true,demoOnly:true}],
   message:'Published a fictional, time-limited Greensboro student notice in the sample calendar and portal.'};
 }
 if(action==='demo-closure'){
  const id='operator-demo-closure-'+c;
  if(records.some(r=>r.id===id))return {updates:[],message:'Fictional closure already present on the campus calendar.'};
  return {updates:[{id,kind:'closures',campusId:c,name:'DEMO · Weather-related campus closure',status:'Confirmed',reason:'Weather',
    startDate:'2026-11-12',endDate:'2026-11-12',body:'DEMO ONLY: The campus is closed for training due to unsafe weather. Contact your instructor for an approved updated schedule.',
    publishOnPortal:true,demoOnly:true}],
    message:'Created a fictitious confirmed campus closure and student portal alert. No real classes were cancelled.'};
 }
 if(action==='demo-birthday'){
  const member=owner;
  if(!member)return {updates:[],message:'No fictional campus staff member available to demonstrate birthday opt-in.'};
  return {updates:[{...member,birthdayMonthDay:'11-18',birthdayCalendarOptIn:true,demoOnly:true}],
   message:'Opted a fictional staff member into the Nov 18 campus birthday calendar; no private full date of birth was disclosed.'};
 }
 if(action==='request-files'){
  const categories=['Enrollment agreement','Driver license','SSN evidence'];
  const prior=person.documentRequests||[];
  const preserved=prior.filter((r:any)=>!categories.includes(r.category));
  return {updates:[{...person,documentRequests:[...preserved,...categories.map(category=>({category,status:'Requested',requestedAt:'2026-11-07T17:00:00Z',requestedBy:'DEMO Campus manager',message:'Please upload this missing item securely in your student portal.'}))]}],
    message:'Requested agreement, driver license and SSN evidence. Alerts exist only inside this sample portal.',studentId:person.id};
 }
 if(action==='portal-upload'){
  const key='demo-operator-signed-agreement-'+person.id;
  if((person.documents||[]).some((d:any)=>d.key===key))return {updates:[],message:'The fictional agreement is already in the school review queue.',studentId:person.id};
  const evidence={key,category:'Enrollment agreement',name:'DEMO_SIGNED_ENROLLMENT_AGREEMENT.pdf',uploadedAt:'2026-11-07T17:05:00Z',uploadedBy:'Student portal · simulated',verified:false,demoOnly:true};
  return {updates:[{...person,documents:[...(person.documents||[]),evidence]}],message:'Student submitted a simulated signed agreement. Staff review is pending; no file bytes were stored.',studentId:person.id};
 }
 if(action==='review'){
  const latest=(person.documents||[]).filter((d:any)=>d.category==='Enrollment agreement'&&d.demoOnly===true&&d.key).at(-1)?.key;
  const docs=(person.documents||[]).map((d:any)=>d.key===latest?{...d,verified:true,reviewedBy:'DEMO manager',reviewedAt:'2026-11-07T17:08:00Z'}:d);
  return {updates:[{...person,documents:docs}],message:'Verified the synthetic agreement only. The license and SSN evidence remain missing.',studentId:person.id};
 }
 if(action==='photo-id'){
  const key='demo-operator-portrait-'+person.id;
  const found=(person.documents||[]).some((d:any)=>d.key===key);
  return {updates:[{...person,studentNumber:person.studentNumber||'DEMO-STUDENT-0001',
   documents:found?person.documents:[...(person.documents||[]),{key,category:'Student profile photo',name:'DEMO_PROFILE_PHOTO.png',uploadedAt:'2026-11-07T17:09:00Z',uploadedBy:'DEMO registrar',verified:true,demoOnly:true}]}],
   message:'Verified a fictional portrait and assigned a student ID. A badge can now be previewed without sensitive numbers.',studentId:person.id};
 }
 if(action==='knowledge-test'||action==='knowledge-retest'){
  const a=assessment(person.id,action==='knowledge-retest');
  if((person.assessments||[]).some((item:any)=>item.id===a.id))return {updates:[],message:'That sample practice assessment was already recorded.',studentId:person.id};
  return {updates:[{...person,assessments:[...(person.assessments||[]),a]}],
   message:action==='knowledge-test'?'Saved 4/6 (66.67%) practice exam, with missed coupling and air-pressure concepts.':'Saved separate 6/6 retest after fictional coaching; original missed answers remain in history.',studentId:person.id};
 }
 if(['classroom-log','yard-log','road-log'].includes(action)){
  const phase=action==='classroom-log'?'Classroom':action==='yard-log'?'Yard':'Road';
  const date=phase==='Classroom'?'2026-11-16':phase==='Yard'?'2026-11-17':'2026-11-18';
  const skill=phase==='Classroom'?'Hours of service calculations':phase==='Yard'?'Straight-line backing':'Lane control';
  const note=phase==='Classroom'?'DEMO: review logbook calculations.':phase==='Yard'?'DEMO: repeat backing setup with spotter.':'DEMO: coach lane positioning on sample route.';
  const s=session(person.id,phase,date,skill,note);
  const exists=(person.sessions||[]).some((row:any)=>row.id===s.id);
  return {updates:[{...person,status:phase,sessions:exists?person.sessions:[...(person.sessions||[]),s]}],
    message:'Recorded a fictional 2-hour '+phase.toLowerCase()+' session. It is NOT real ELDT instruction evidence.',studentId:person.id};
 }
 if(['tuition-charge','payment-remit','payment-verify','stripe-sim'].includes(action)){
  const base={charges:[...(person.demoBilling?.charges||[])],payments:[...(person.demoBilling?.payments||[])]};
  const id='operator-tuition-'+person.id,receiptId='operator-receipt-'+person.id,stripeId='operator-stripe-'+person.id;
  if(action==='tuition-charge'&&!base.charges.some((x:any)=>x.id===id)){
   base.charges.push({id,owner:'academy-owner',student:person.id,campus:person.campusId,description:'Class A CDL tuition · fictional',category:'Tuition',
    amount_cents:300000,due_date:'2026-11-16',funding_type:'Cash',status:'Open',created:'2026-11-07T17:30:00Z',demoOnly:true});
  }
  if(action==='payment-remit'&&!base.payments.some((x:any)=>x.id===receiptId)){
   base.payments.push({id:receiptId,owner:'academy-owner',student:person.id,campus:person.campusId,charge_id:id,provider:'Cash',source:'Demo',
    amount_cents:75000,refunded_cents:0,disputed_cents:0,status:'Pending',external_ref:'DEMO-RECEIPT-0750',created:'2026-11-07T17:32:00Z',demoOnly:true});
  }
  if(action==='payment-verify'){
   base.payments=base.payments.map((x:any)=>x.id===receiptId?{...x,status:'Confirmed',verified_at:'2026-11-07T17:34:00Z',verified_by:'Fictional separate manager'}:x);
  }
  if(action==='stripe-sim'&&!base.payments.some((x:any)=>x.id===stripeId)){
   base.payments.push({id:stripeId,owner:'academy-owner',student:person.id,campus:person.campusId,charge_id:id,provider:'Stripe',source:'Demo',
    amount_cents:225000,refunded_cents:0,disputed_cents:0,status:'Confirmed',external_ref:'DEMO-ONLY-PI',created:'2026-11-07T17:35:00Z',demoOnly:true});
  }
  return {updates:[{...person,demoBilling:base}],message:action==='tuition-charge'?'Posted a $3,000 fictional tuition charge.':
   action==='payment-remit'?'Receipt for $750 awaiting verification; no credit was posted.':
   action==='payment-verify'?'Confirmed $750 fictional cash receipt; remaining tuition is $2,250.':
   'A fictional signed Stripe payment paid the remaining $2,250. No real charge.',studentId:person.id};
 }
 if(action==='assign-task'){
  if(records.some(r=>r.id===taskId))return {updates:[],message:'Demo team task already saved.'};
  if(!owner)return {updates:[],message:'No campus-authorized demo staff member is available.'};
  return {updates:[{id:taskId,kind:'tasks',name:'DEMO · follow up with '+person.name, status:'Open',campusId:c,assignedTo:owner.id,owner:owner.name,
   priority:'High',due:'2026-11-13',description:'Review fictional identity documents and plan additional CDL subject coaching.',demoOnly:true}],message:'Assigned a sample task to an employee who is authorized for this campus.'};
 }
 return {updates:[],message:'Displayed the actual workspace; no data changes were needed for this chapter.'};
}
