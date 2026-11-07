import {moduleAllowed} from './roles.ts';

export type SchoolPage={id:string;label:string;help:string};
export type SchoolSection={id:string;label:string;help:string;pages:SchoolPage[]};

/** Navigation labels only. The existing routes, records, API permissions and
 * campus protections are unchanged. No pages are deleted or duplicated. */
export const schoolSections:SchoolSection[]=[
 {id:'home',label:'Home',help:'See what needs attention today.',pages:[
  {id:'overview',label:'Today',help:'Your school at a glance'},
  {id:'school-notices',label:'Announcements & Closures',help:'Publish student portal banners and emergency closures'},
  {id:'operations',label:'Student Help',help:'Follow up when someone needs support'},
  {id:'manager-brief',label:'Weekly Report',help:'A summary for school leaders'},
  {id:'insights',label:'School Numbers',help:'Compare student progress, inquiries, and campuses'},
  {id:'intelligence',label:'Writing Help',help:'Create drafts; AI connection may be off'}
 ]},
 {id:'students',label:'Students',help:'Find students and check their records.',pages:[
  {id:'students',label:'Student List',help:'Profiles, paperwork and progress'},
  {id:'document-center',label:'Secure Document Vault',help:'Enrollment agreements, licenses and private student paperwork'},
  {id:'student-id-studio',label:'Student Photos & Badges',help:'Upload, review, save portraits and print student ID cards'},
  {id:'student-communications',label:'Email & Text Students',help:'Message one student or an opt-in class group'},
  {id:'student-access',label:'Student Portal Access',help:'Owner-approved private student logins'},
  {id:'student-portal-preview',label:'Student Portal Demo',help:'Fictional student document requests and knowledge practice'}
 ]},
 {id:'admissions',label:'Admissions',help:'Handle new inquiries and appointments.',pages:[
  {id:'leads',label:'New Inquiries',help:'Follow up with future students'},
  {id:'calendar',label:'School Calendar',help:'Appointments, birthdays, class dates and closures'},
  {id:'event-intake',label:'Event Signups',help:'Save contacts from fairs and events'},
  {id:'rosters',label:'DMV Roster Packets',help:'First-day class rosters and signed enrollment agreements'}
 ]},
 {id:'training',label:'Training',help:'Classes, attendance, trucks and training records.',pages:[
  {id:'closeout',label:'Daily Training Review',help:'Check lessons, logs and truck reports before going home'},
  {id:'dispatch',label:'Daily Training Plan',help:'Assign students, instructors, trucks and training areas'},
  {id:'courses',label:'Take Attendance',help:'Daily training, driving hours and tests'},
  {id:'lesson-checkoffs',label:'Lesson Checkoffs',help:'Approved lessons and student progress'},
  {id:'driver-playbook',label:'25-Day Instructor Playbook',help:'Daily instructor steps, student coverage and log checks'},
  {id:'learning-diagnostics',label:'Knowledge Diagnostics',help:'Detect weak CDL subjects before Friday testing'},
  {id:'classes',label:'Classes & Dates',help:'Start dates, schedules and class lists'},
  {id:'fleet',label:'Trucks & Equipment',help:'Training vehicles and maintenance'},
  {id:'tpr',label:'Federal Training Records',help:'Track required reporting; verify submissions'}
 ]},
 {id:'team',label:'Team',help:'Give assignments and manage staff.',pages:[
  {id:'tasks',label:'Tasks & Appointments',help:'Assign work to employees by campus'},
  {id:'safety',label:'Safety Concerns',help:'Report a concern and review campus action'},
  {id:'staff',label:'Employees',help:'Staff accounts and roles'},
  {id:'credentials',label:'Staff Licenses',help:'Instructor approvals and renewal dates'},
  {id:'shifts',label:'Work Schedules',help:'Plan coverage and paid hours'}
 ]},
 {id:'partners',label:'Partners',help:'Work with employers and funding agencies.',pages:[
  {id:'growth',label:'Outreach',help:'Calls, meetings, referrals and events'},
  {id:'partners',label:'Partner List',help:'Employers, agencies and contacts'},
  {id:'employment-offers',label:'Job Offer Letters',help:'Track conditional letters from employers'},
  {id:'funding',label:'Funding Agencies',help:'School funding contacts and requirements'},
  {id:'sponsorships',label:'Funding Approvals',help:'Agency approvals, amounts and student progress drafts'},
  {id:'agency',label:'Agency Access',help:'Control what case managers may view'},
  {id:'mous',label:'Agreements',help:'Partnership documents and terms'}
 ]},
 {id:'payments',label:'Payments',help:'Review tuition amounts and balances.',pages:[
  {id:'finance',label:'Tuition & Balances',help:'Manual payment records, not a bank connection'},
  {id:'funding-invoices',label:'Funding Invoices',help:'Draft school invoices for WIOA, WRLP and authorized funding'}
 ]},
 {id:'school',label:'School Setup',help:'Manage campuses and school settings.',pages:[
  {id:'setup',label:'Get Started',help:'Complete the school setup checklist'},
  {id:'pilot-access',label:'Pilot User Access',help:'Owner creates staff logins and pilot access'},
  {id:'integrations',label:'Integrations & Connections',help:'Configure Microsoft, school systems, messaging, payments and career links'},
  {id:'campuses',label:'Campus Locations',help:'Greensboro, Mansfield and Dallas'},
  {id:'templates',label:'Saved Forms',help:'Message and agreement templates'},
  {id:'compliance',label:'School Readiness',help:'Review missing items and approvals'},
  {id:'audit',label:'Change History',help:'See who updated school records'},
  {id:'settings',label:'School Details',help:'Basic information and programs'}
 ]}
];
export function sectionForPage(pageId:string){return schoolSections.find(section=>section.pages.some(page=>page.id===pageId));}
export function displayNameForPage(pageId:string){return schoolSections.flatMap(section=>section.pages).find(page=>page.id===pageId)?.label||pageId;}
/** UI navigation is role-limited; the server separately enforces permissions. */
export function availableSchoolSections(actualRole:string,selectedWorkspaceRole=actualRole){
 return schoolSections.map(section=>({
  ...section,
  pages:section.pages.filter(page=>moduleAllowed(actualRole,page.id)&&(actualRole!=='Owner'||selectedWorkspaceRole==='Owner'||moduleAllowed(selectedWorkspaceRole,page.id)))
 })).filter(section=>section.pages.length>0);
}
