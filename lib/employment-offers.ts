import type {RecordData as R} from './training';
export const employmentOfferStages=['Requested','Employer reviewing','Letter received','Verified contingent','Expired','Withdrawn'] as const;
const validDate=(s:any)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function validateEmploymentOffer(r:R){
 if(r.kind!=='employment-offers')return null;
 if(!employmentOfferStages.includes(r.status))return 'Choose a valid employment offer status.';
 if(typeof r.studentId!=='string'||!r.studentId||typeof r.campusId!=='string'||!r.campusId)return 'Select the student and campus.';
 if(typeof r.employerName!=='string'||r.employerName.trim().length<2||r.employerName.length>200)return 'Enter the real prospective employer name.';
 if(r.roleTitle!=null&&(typeof r.roleTitle!=='string'||r.roleTitle.length>200))return 'Job title is too long.';
 if(r.contactName!=null&&(typeof r.contactName!=='string'||r.contactName.length>200))return 'Contact name is too long.';
 if(r.requestDate&&!validDate(r.requestDate))return 'Choose a valid request date.';
 if(r.letterDate&&!validDate(r.letterDate))return 'Choose a valid letter issue date.';
 if(r.expiryDate&&!validDate(r.expiryDate))return 'Choose a valid letter expiration date.';
 if(r.expiryDate&&r.letterDate&&r.expiryDate<r.letterDate)return 'Expiration must follow the letter issue date.';
 if(r.notes!=null&&(typeof r.notes!=='string'||r.notes.length>4000))return 'Offer notes exceed the 4,000 character limit.';
 if(r.status==='Verified contingent'&&!r.letterDocumentKey)return 'A verified employer-issued letter is required before recording a contingent offer.';
 return null;
}
export function offerEvidenceStatus(offer:R,documents:any[],asOf:string){
 if(offer.status==='Withdrawn')return 'Withdrawn';
 if(offer.status==='Expired'||offer.expiryDate&&offer.expiryDate<asOf)return 'Expired';
 if(offer.status!=='Verified contingent')return 'Not verified';
 if(!offer.letterDocumentKey||!documents.some(d=>d.key===offer.letterDocumentKey&&d.category==='Conditional employment offer'&&d.verified===true))return 'Evidence missing';
 return 'Documented contingent opportunity';
}
