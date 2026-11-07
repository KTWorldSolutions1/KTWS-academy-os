/** Enrollment packet checklist and protected-document presentation helpers.
 * References to uploaded evidence (not the sensitive file bytes) are stored on
 * the student record. All private files remain encrypted in private R2.
 */
export const REQUIRED_ENROLLMENT_CATEGORIES=[
 'Enrollment agreement','Driver license','SSN evidence','Medical qualification evidence',
 'Drug screen authorization','Commercial learner permit'
] as const;
export const OPTIONAL_ENROLLMENT_CATEGORIES=[
 'Driver record','Drug screen result','Funding authorization','Signed contract',
 'Information release authorization','Student portal authorization',
 'Conditional employment offer','Other'
] as const;
export const STUDENT_PHOTO_CATEGORY='Student profile photo';
export const PUBLIC_RESOURCE_CATEGORY='Public school resource';
export const REQUESTABLE_DOCUMENTS=[...REQUIRED_ENROLLMENT_CATEGORIES,...OPTIONAL_ENROLLMENT_CATEGORIES] as string[];
export type DocumentRequest={category:string;status:'Requested'|'Satisfied';requestedAt:string;requestedBy:string;message?:string};
export function latestEvidence(student:any,category:string){
 const docs=(Array.isArray(student?.documents)?student.documents:[]).filter((d:any)=>d?.category===category&&d?.key);
 return docs.at(-1)||null;
}
export function missingDocumentCategories(student:any){
 return REQUIRED_ENROLLMENT_CATEGORIES.filter(category=>!latestEvidence(student,category)?.verified);
}
export function requestedDocumentCategories(student:any){
 return (student?.documentRequests||[]).filter((r:any)=>r?.status==='Requested'&&REQUESTABLE_DOCUMENTS.includes(r.category) && !latestEvidence(student,r.category)?.verified).map((r:any)=>r.category);
}
export function documentChecklist(student:any){
 const requests=(student?.documentRequests||[]).filter((r:any)=>r?.status==='Requested');
 const names=[...new Set([...REQUIRED_ENROLLMENT_CATEGORIES,...requests.map((r:any)=>r.category).filter((n:any)=>REQUESTABLE_DOCUMENTS.includes(n)),...(latestEvidence(student,STUDENT_PHOTO_CATEGORY)?[STUDENT_PHOTO_CATEGORY]:[])])];
 return names.map(category=>{
  const evidence=latestEvidence(student,category);
  return {category,required:REQUIRED_ENROLLMENT_CATEGORIES.includes(category as any),requested:requests.some((r:any)=>r.category===category)&&!evidence?.verified,status:evidence?.verified?'Verified':evidence?.key?'Submitted — review pending':'Missing',key:evidence?.key||null,uploadedAt:evidence?.uploadedAt||null};
 });
}
export function safeStudentDocuments(student:any){
 return documentChecklist(student).map(({category,required,requested,status,uploadedAt})=>({category,required,requested,status,uploadedAt}));
}
export function profilePhotoKey(student:any){const rows=(Array.isArray(student?.documents)?student.documents:[]).filter((d:any)=>d?.category===STUDENT_PHOTO_CATEGORY&&d?.key&&d?.verified===true);return rows.at(-1)?.key||null;}
