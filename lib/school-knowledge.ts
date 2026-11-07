import type {RecordData as R} from './training.ts';

export const SCHOOL_LIBRARY_CATEGORIES=['Policies & procedures','Instructor guides','HR & staff','Forms & templates','Announcements','Campus operations','Training & compliance'] as const;
export const SCHOOL_LIBRARY_AUDIENCES=['All staff','Management','Instructors','Admissions & administration'] as const;
export const SCHOOL_LIBRARY_STATUSES=['Draft','Published','Archived'] as const;
const validDate=(s:any)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function validateSchoolKnowledge(r:R):string|null{
 if(r.kind!=='school-knowledge')return null;
 if(!r.campusId)return 'Choose a campus or schoolwide location for this item.';
 if(!SCHOOL_LIBRARY_CATEGORIES.includes(r.category))return 'Choose a school library category.';
 if(!SCHOOL_LIBRARY_AUDIENCES.includes(r.audience))return 'Choose an authorized audience.';
 if(!SCHOOL_LIBRARY_STATUSES.includes(r.status))return 'Select Draft, Published, or Archived.';
 if(typeof r.name!=='string'||r.name.trim().length<4||r.name.length>160)return 'Enter a document title with 4–160 characters.';
 if(typeof r.body!=='string'||r.body.trim().length<20||r.body.length>18000)return 'Provide a school document summary or procedure (20–18,000 characters).';
 if(!/^\d+(?:\.\d+){0,2}$/.test(String(r.documentVersion||'')))return 'Use a version such as 1.0 or 2.1.';
 if(r.effectiveDate&& !validDate(r.effectiveDate))return 'Enter a valid effective date.';
 if(r.reviewDate&&!validDate(r.reviewDate))return 'Enter a valid review date.';
 if(r.externalUrl&&(!/^https:\/\/[^\s<>"']{4,800}$/i.test(String(r.externalUrl))||String(r.externalUrl).includes('@')))return 'Use a valid HTTPS-only external document link.';
 if(r.status==='Published'&&!r.approvedBy)return 'School management approval is required before publishing.';
 if(r.status==='Published'&&!r.effectiveDate)return 'Published procedures require an effective date.';
 if(r.ackRequired!==undefined&&typeof r.ackRequired!=='boolean')return 'Acknowledgment must be yes or no.';
 if(r.history!==undefined&&(!Array.isArray(r.history)||r.history.length>60))return 'Invalid policy revision history.';
 return null;
}
/** Draft and archived content is restricted to school management. */
export function canViewSchoolKnowledge(role:string,r:R){
 if(r.status!=='Published')return ['Owner','Regional admin','Campus manager'].includes(role);
 if(['Owner','Regional admin','Campus manager'].includes(role))return true;
 if(r.audience==='Management')return false;
 if(r.audience==='Instructors')return role==='Instructor';
 if(r.audience==='Admissions & administration')return ['Enrollment specialist','Admin assistant','Front desk'].includes(role);
 return ['Instructor','Enrollment specialist','Admin assistant','Front desk'].includes(role);
}
export function schoolKnowledgeNeedsReview(r:R,asOf:string){return r.status==='Published'&&!!r.reviewDate&&r.reviewDate<=asOf;}
