import type {RecordData as R} from './training';
export const employmentOfferStages=['Requested','Employer reviewing','Letter received','Verified contingent','Expired','Withdrawn'] as const;
export const recruitingStages=['Contacted','Screening scheduled','Screening completed','Employer declined','Employer approved'] as const;
export const agencyReviewStages=['Not submitted','Submitted to WIOA','Accepted by WIOA','Rejected by WIOA'] as const;
const validDate=(s:any)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
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
 if(r.recruitingStage!=null&&!recruitingStages.includes(r.recruitingStage))return 'Choose a valid recruiter screening stage.';
 if(r.agencyReviewStage!=null&&!agencyReviewStages.includes(r.agencyReviewStage))return 'Choose a valid WIOA review stage.';
 for(const field of ['screeningDate','followUpDate','agencyReviewDate'])if(r[field]&&!validDate(r[field]))return 'Choose a valid '+field+' date.';
 if(r.recruiterEmail!=null&&(typeof r.recruiterEmail!=='string'||r.recruiterEmail.length>254||r.recruiterEmail&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(r.recruiterEmail)))return 'Enter a valid recruiter email.';
 if(r.recruiterPhone!=null&&(typeof r.recruiterPhone!=='string'||r.recruiterPhone.length>40))return 'Enter a valid recruiter phone number.';
 if(r.agencyReviewStage==='Accepted by WIOA'&&r.status!=='Verified contingent')return 'A WIOA-accepted offer must first be verified against the employer-issued letter.';
 if(r.agencyReviewStage==='Accepted by WIOA'&&!r.agencyReviewDate)return 'Record the WIOA acceptance date.';
 if(r.agencyReviewStage==='Rejected by WIOA'&&(!r.agencyReviewNotes||String(r.agencyReviewNotes).trim().length<5))return 'Document why WIOA rejected this letter.';
 if(r.studentContactConsent!=null&&typeof r.studentContactConsent!=='boolean')return 'Student contact permission must be explicitly recorded.';
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

/** Facts-only summary for staff dashboards; never treats outreach as an issued offer. */
export function employmentOfferPipeline(offers:R[],documentsByStudent:Record<string,any[]>,asOf:string){
 const counts={contacted:0,screening:0,letterReceived:0,verified:0,acceptedByWioa:0,overdue:0};
 for(const offer of offers.filter(o=>o.kind==='employment-offers')){
  counts.contacted++;
  if(['Screening scheduled','Screening completed'].includes(offer.recruitingStage||''))counts.screening++;
  if(['Letter received','Verified contingent'].includes(offer.status))counts.letterReceived++;
  const evidence=offerEvidenceStatus(offer,documentsByStudent[offer.studentId]||[],asOf);
  if(evidence==='Documented contingent opportunity')counts.verified++;
  if(evidence==='Documented contingent opportunity'&&offer.agencyReviewStage==='Accepted by WIOA')counts.acceptedByWioa++;
  if(offer.followUpDate&&offer.followUpDate<asOf&&!['Withdrawn','Expired'].includes(offer.status)&&offer.agencyReviewStage!=='Accepted by WIOA')counts.overdue++;
 }
 return counts;
}
