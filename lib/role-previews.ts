import {moduleAllowed,startModule} from './roles.ts';
import {schoolSections} from './simple-navigation.ts';
export const PREVIEW_ROLES=['Owner','Regional admin','Campus manager','Admin assistant','Enrollment specialist','Front desk','Instructor'] as const;
export type PreviewRole=typeof PREVIEW_ROLES[number];
export const ROLE_FOCUS:Record<PreviewRole,{purpose:string;pages:string[]}>={
 Owner:{purpose:'Review the school network, financial oversight, staffing and launch decisions.',pages:['overview','insights','payroll-report','staff','staff-messenger','compliance']},
 'Regional admin':{purpose:'Compare campuses, support local managers and review operational exceptions.',pages:['overview','manager-brief','insights','dispatch','payroll-report','staff-messenger']},
 'Campus manager':{purpose:'Run today’s campus: student progress, instructor coverage, equipment and payroll review.',pages:['overview','manager-brief','dispatch','students','payroll-report','staff-messenger']},
 'Admin assistant':{purpose:'Keep student paperwork, rosters, school notices and daily records organized.',pages:['overview','document-center','rosters','school-notices','student-id-studio','staff-messenger']},
 'Enrollment specialist':{purpose:'Move inquiries through appointments, funding and enrollment follow-up.',pages:['leads','calendar','students','sponsorships','tasks','staff-messenger']},
 'Front desk':{purpose:'Handle arrivals, appointments, inquiries and assigned follow-ups.',pages:['calendar','leads','students','tasks','timeclock','staff-messenger']},
 Instructor:{purpose:'Teach the class, record attendance, review skills and close out training evidence.',pages:['courses','dispatch','lesson-checkoffs','closeout','timeclock','staff-messenger']}
};
export function rolePreviewNavigation(role:string){return schoolSections.map(s=>({...s,pages:s.pages.filter(p=>moduleAllowed(role,p.id))})).filter(s=>s.pages.length);}
export function rolePreviewStart(role:PreviewRole){return startModule(role);}
export function rolePreviewPageAllowed(role:string,page:string){return rolePreviewNavigation(role).some(s=>s.pages.some(p=>p.id===page));}
/** Only receives fictional fixtures. This is a demonstration scope, not server authorization. */
export function scopePreviewRecords<T extends {id:string;kind:string;campusId?:string;campusIds?:string[];classId?:string}>(rows:T[],campus:string){
 if(campus==='All campuses')return rows;
 return rows.filter(r=>r.kind==='campuses'?r.id===campus:r.kind==='staff'?(r.campusIds||[]).includes(campus):r.campusId?r.campusId===campus:r.classId?rows.some(c=>c.id===r.classId&&c.campusId===campus):true);
}
