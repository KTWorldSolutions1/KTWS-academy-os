/** Read-only partner disclosure policy. Default deny; no records are exposed without explicit grants. */
export type PartnerGrant={partnerId:string;studentId:string;campusId:string;expiresAt:string;consentAt:string;approvedBy:string;fields:string[];revokedAt?:string};
export const PARTNER_FIELDS=['name','status','cohort','program','attendanceSummary','trainingProgress','graduationDate'] as const;
const allowed=new Set<string>(PARTNER_FIELDS);
export function authorizedPartnerView(student:Record<string,any>,grant:PartnerGrant,request:{partnerId:string;campusId:string;now:string}){
 if(!grant||grant.revokedAt||!grant.consentAt||!grant.approvedBy||!grant.expiresAt||!request.now)return null;
 if(grant.partnerId!==request.partnerId||grant.studentId!==student.id||grant.campusId!==request.campusId||student.campusId!==request.campusId)return null;
 if(!Number.isFinite(Date.parse(grant.expiresAt))||Date.parse(grant.expiresAt)<=Date.parse(request.now))return null;
 const result:Record<string,unknown>={id:student.id};
 for(const field of grant.fields||[])if(allowed.has(field)&&Object.hasOwn(student,field))result[field]=student[field];
 return result;
}
