import {DEMO_SCENES,type DemoScene} from './presentation-demo.ts';
import {schoolSections} from './simple-navigation.ts';
import {chapterDetail} from './owner-demo-review.ts';

export type DemoMode='executive'|'complete';
/** Eight connected outcomes rather than an exhausting 27-chapter monologue.
 * Complete review still exposes every chapter and all existing workspace modules.
 */
export const EXECUTIVE_SCENE_IDS=['network','lead','portal','theory','road','testing','staff-chat','payments','finale'] as const;
export function scenesForMode(mode:DemoMode):DemoScene[]{
 return mode==='executive'?EXECUTIVE_SCENE_IDS.map(id=>DEMO_SCENES.find(s=>s.id===id)!).filter(Boolean):DEMO_SCENES;
}
const pitches:Record<string,string>={
 network:'Imagine opening one dashboard and seeing all three campuses, enrollment progress, and unresolved problems. This is the schoolwide command center.',
 lead:'One inquiry becomes an assigned follow-up, an appointment, and an enrollment opportunity. No more scattered spreadsheets or forgotten prospects.',
 funding:'Keep funding status, agency contacts, and written approvals connected, without confusing expected money with money received.',
 docs:'Check what paperwork is missing and who must review it. Sensitive student uploads remain gated until security acceptance.',
 portal:'A student opens their own portal to see progress, practice knowledge questions, and track paperwork. Less guesswork for everyone.',
 portrait:'One verified student ID picture becomes their profile photo and school badge. Private image uploads still require security acceptance.',
 roster:'Prepare student rosters and spot missing requirements before class starts, with different state rules where required.',
 theory:'Give instructors a structured thirty-topic classroom plan, attendance evidence, and practical driver-readiness exercises.',
 test:'Spot weak knowledge topics immediately and assign targeted review before a student falls behind.',
 yard:'Track actual backing, inspections, coaching notes, and earned proficiency, rather than trusting a verbal update.',
 road:'Assign a qualified instructor, student, and available truck together, then record driving time, observation, and equipment defects.',
 testing:'See each student’s theory, range, road, and document gaps in one place before a CDL testing decision.',
 career:'Keep the journey going through graduation, employer connections, and measurable student outcomes.',
 payments:'Manage tuition charges, funding, verified receipts, and auditable corrections in the same student record.',
 notices:'Reach students with accurate campus notices and closures while keeping external messaging approval separate.',
 'staff-chat':'School staff can coordinate with direct messages, campus channels, and private groups. Notifications and important updates stay inside Academy OS.',
 team:'Delegate tasks and preview all seven staff roles, from front desk and instructor to campus manager and owner, using fictional practice workflows.',
 'staff-calendar':'See who is scheduled and whether instructors can cover the school’s training workload.',
 'classroom-roster':'Track who actually attended each day and separate verified instruction from planned hours.',
 'classroom-carryforward':'Move a student to the next phase only after required evidence is complete.',
 'instructor-plan':'Give instructors a daily plan and a consistent place to record progress, observations, and exceptions.',
 'automatic-yard':'Require classroom evidence, permit records, and verified clearance before a student enters the range.',
 'staff-knowledge':'Put approved policies, guides, and procedures where staff can find the right version.',
 'student-messaging':'Prepare targeted student communications with consent controls. Delivery integrations require configuration.',
 'student-support':'Flag stalled students early and give staff an accountable follow-up workflow.',
 partnerships:'Track workforce agencies, employers, agreements, and conditional offers alongside student outcomes.',
 configuration:'Show exactly which security, recovery, and integration checks remain before moving real student records.',
 finale:'This is not just an enrollment tracker. It connects recruiting, training, staff, equipment, compliance, and leadership. Which three gaps must we close before a pilot?'
};
export function spokenPitch(scene:DemoScene):string{
 return pitches[scene.id]||scene.narration.split(/(?<=[.!?])\s+/).slice(0,2).join(' ');
}
export function spokenDurationMs(scene:DemoScene):number{
 const count=spokenPitch(scene).trim().split(/\s+/).length;
 return Math.max(11000,Math.ceil(count/2.65*1000)+2200);
}
export function timelineForMode(mode:DemoMode){
 const scenes=scenesForMode(mode);
 const durations=scenes.map(spokenDurationMs);
 const starts=durations.map((_,i)=>durations.slice(0,i).reduce((a,b)=>a+b,0));
 return {scenes,durations,starts,total:durations.reduce((a,b)=>a+b,0)};
}
export const CAPABILITY_SECTIONS=schoolSections.map(section=>({
 id:section.id,title:section.label,
 capabilities:section.pages.map(page=>{
  const existing=DEMO_SCENES.find(scene=>scene.destination===page.id);
  const status=existing?chapterDetail(existing.id).status:'Module available — validate workflow' as const;
  return {id:page.id,label:page.label,description:page.help,status,chapter:existing?.id||null};
 })
}));
export const CAPABILITY_COUNT=CAPABILITY_SECTIONS.reduce((sum,section)=>sum+section.capabilities.length,0);

/** Outcomes are qualitative: Academy OS does not fabricate time-savings metrics. */
const impact:Record<string,{today:string;academy:string;proof:string}>={
 network:{today:'Campus updates scattered across emails, reports and separate tools',academy:'One access-scoped command view for all three locations',proof:'Compare campus filters, enrollment counts and active alerts'},
 lead:{today:'Leads and agency referrals may be followed up in different places',academy:'Each lead can have a stage, owner, next action and funding route',proof:'Open New Inquiries and the appointments queue'},
 portal:{today:'Students call staff to ask what is missing or what comes next',academy:'A student can review their own milestones, notices and practice material',proof:'Open the fictional Student Portal Demo'},
 theory:{today:'Class materials, lesson hours and diagnostic results need manual reconciliation',academy:'Daily theory lesson plans, attendance and knowledge gaps stay connected',proof:'Open the Week-one planner and Knowledge Checks'},
 road:{today:'Staff coordinate truck, instructor and student separately',academy:'Dispatch review checks vehicle readiness and training assignments together',proof:'Open Daily Training Plan and report an equipment hold'},
 testing:{today:'Readiness requires checking several logs and paperwork folders',academy:'Student 360 brings together validated training evidence and outstanding steps',proof:'Open Student List and inspect the training timeline'},
 payments:{today:'Incorrect receipts can distort an active student balance until reconciled',academy:'Auditable corrections restore ledger accuracy across staff and student views',proof:'Open Student Payment Center and inspect the correction workflow'},
 'staff-chat':{today:'Campus updates require separate texts or a third-party team messaging tool',academy:'Authorized school staff share direct, private and campus channels with unread counts and reply context',proof:'Open Staff Messenger in fictional demo mode and try a reply or create a group'},
 finale:{today:'A transition could happen without an agreed scope or owner decision record',academy:'Leadership can flag launch blockers and approve phased pilot criteria',proof:'Open the Owner Feedback & Launch Decisions board'}
};
export function operationalImpact(scene:DemoScene){
 return impact[scene.id]||{today:'This workflow may depend on disconnected manual checks',academy:'Academy OS provides a dedicated role-scoped module and task context',proof:'Open the linked school module and verify the workflow'};
}
