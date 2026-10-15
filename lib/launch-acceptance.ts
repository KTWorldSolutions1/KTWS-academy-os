import type {RecordData as R} from './training.ts';
import {campusReadinessSnapshot} from './campus-readiness.ts';
export const launchAreas=[
 {id:'key-recovery',label:'Recover our protected documents',scope:'school',why:'Two authorized custodians must prove the existing encryption key can be recovered without exposing it.',proof:'Vault receipt, key custody approvals and recovery demonstration; never paste the key.'},
 {id:'restore',label:'Restore a school backup',scope:'school',why:'Test the original D1 database, encrypted R2 objects and permissions in an isolated environment.',proof:'Signed independent restore report, counts, test date, second witness and recovery time.'},
 {id:'policies',label:'Approve student privacy rules',scope:'school',why:'Approve collection, release forms, retention, data ownership, incidents and account access.',proof:'Approved policy version and date, responsible officer, and exact storage location.'},
 {id:'staff',label:'Test employee access',scope:'campus',why:'Test each live staff role with fictional students, negative campus checks and proper sign-out.',proof:'Per-role test results, tester, sign-off and test date (no real student identities).'},
 {id:'students',label:'Practice the full student journey',scope:'campus',why:'Practice inquiry, enrollment, class, theory, yard, road, corrections, week-five test and graduation.',proof:'Fictional student test checklist and evaluator sign-off without actual student personal details.'},
 {id:'licensing',label:'Verify campus approvals',scope:'campus',why:'Review the correct state agency, classroom, yard, trucks, instructor qualifications, insurance and FMCSA location.',proof:'Official issuing agency, source identifier, date checked and license/site scope; a manager review alone is insufficient.'},
 {id:'training',label:'Approve the course and testing rules',scope:'campus',why:'Confirm the school's curriculum, instructional delivery, 80% theory assessment, documented driving and test handoff.',proof:'Versioned school curriculum and approved source references, instructor and testing sign-offs.'}
] as const;
export type LaunchAreaId=typeof launchAreas[number]['id'];
const validDate=(s:any)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function validateLaunchEvidence(r:R){
 if(r.kind!=='launch-acceptance')return null;
 const section=launchAreas.find(x=>x.id===r.area);
 if(!section)return 'Choose a recognized school acceptance item.';
 if(!['Not checked','Needs follow-up','Evidence reviewed'].includes(r.status))return 'Choose a valid school review status.';
 if(section.scope==='school'&&r.campusId!=='__school__')return 'Schoolwide acceptance items do not belong to one campus.';
 if(section.scope==='campus'&&(!r.campusId||r.campusId==='__school__'))return 'Choose the campus being reviewed.';
 if(r.status==='Evidence reviewed'){
  if(typeof r.sourceReference!=='string'||r.sourceReference.trim().length<12||r.sourceReference.length>400)return 'Describe the original verification source in 12–400 characters.';
  if(!validDate(r.sourceCheckedOn))return 'Enter when the actual source was checked.';
  if(r.attestedByOwner!==true)return 'School owner must explicitly attest to reviewing the source.';
  if((section.id==='restore'||section.id==='key-recovery')&&(!r.secondCustodian||r.secondCustodian.trim().length<3||r.secondCustodian.length>120))return 'Name an authorized second custodian for disaster recovery.';
 }
 if(r.notes!=null&&(typeof r.notes!=='string'||r.notes.length>3500))return 'Keep review notes below 3,500 characters.';
 if(r.correctionReason!=null&&(typeof r.correctionReason!=='string'||r.correctionReason.length>1500))return 'Keep the correction reason below 1,500 characters.';
 if(r.sourceCheckedOn&&!validDate(r.sourceCheckedOn))return 'Choose a valid evidence review date.';
 return null;
}
export function launchStatus(records:R[],asOf:string){
 const campuses=records.filter(x=>x.kind==='campuses'&&x.status==='Active');
 const requiredCampuses=['Greensboro','Mansfield','Dallas'];
 const found=requiredCampuses.map(city=>campuses.find(c=>c.name?.toLowerCase().includes(city.toLowerCase())));
 const missingCampuses=requiredCampuses.filter((city,i)=>!found[i]);
 const reviews=records.filter(x=>x.kind==='launch-acceptance');
 const schoolItems=launchAreas.filter(x=>x.scope==='school').map(area=>({area,campus:null,record:reviews.find(x=>x.area===area.id&&x.campusId==='__school__')}));
 const campusItems=found.flatMap((campus,i)=>launchAreas.filter(x=>x.scope==='campus').map(area=>({area,campus:{id:campus?.id||'',name:requiredCampuses[i]},record:campus?reviews.find(x=>x.area===area.id&&x.campusId===campus.id):undefined})));
 const items=[...schoolItems,...campusItems].map(({area,campus,record})=>({
  id:area.id+(campus?'@'+campus.id:'@school'),area:area.id,label:area.label,scope:area.scope,explanation:area.why,proof:area.proof,campusId:campus?.id||'__school__',campusName:campus?.name||'Whole school',
  record:record||null,reviewed:record?.status==='Evidence reviewed'&&!!record.reviewedBy&&!!record.reviewedAt,needsAttention:record?.status==='Needs follow-up'
 }));
 const reviewed=items.filter(x=>x.reviewed).length;
 const unreviewed=items.length-reviewed;
 const campusReviews=found.map(c=>c?campusReadinessSnapshot(records,c.id,asOf):null);
 const campusChecks=campusReviews.map(x=>({reviewed:x?.reviewed||0,total:x?.checks.length||8,blocked:x?.blocked||0}));
 const blockers=[
  ...(missingCampuses.length?['Missing active campuses: '+missingCampuses.join(', ')]:[]),
  ...(unreviewed?['School acceptance evidence still needs owner review for '+unreviewed+' item(s).']:[]),
  ...(!campusReviews.every(c=>c?.allInternallyReviewed)?['Each campus needs documented manager readiness checks.']:[]),
  'Protected document uploads and student invitations must remain disabled until the independent restore, key custody and privacy approvals are verified by the school.'
 ];
 return {items,reviewed,total:items.length,remaining:unreviewed,missingCampuses,campusChecks,
  canClaimProductionAcceptance:false,
  blockers,
  notice:'This is a record of owner-reviewed school evidence, not third-party verification. Completing the checklist cannot enable uploads, accounts, FMCSA submissions or certify lawful operation.'};
}
