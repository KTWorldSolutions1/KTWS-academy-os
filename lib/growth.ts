import type {RecordData as R} from './training.ts';
import {campusOf} from './enterprise.ts';
export const relationshipStages=['Prospect','Contacted','Meeting scheduled','Proposal sent','Agreement review','Active partnership','Paused','Closed'];
export const partnerTypes=['Employer','Workforce agency','Community referral','Training customer','Vendor','Other'];
export const referralStages=['Received','Contact attempted','Connected to lead','Closed'];
export function validGrowthDate(v:any){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;}
export function contactAvailability(r:R,day:string){
 const away=!!(r.awayFrom&&r.awayThrough&&r.awayFrom<=day&&day<=r.awayThrough);
 return {away,label:away?'Out of office through '+r.awayThrough:r.awayFrom&&r.awayFrom>day?'Away '+r.awayFrom+' through '+r.awayThrough:'No current absence recorded'};
}
export function partnershipQueue(records:R[],day:string){return records.filter(r=>r.kind==='partners'&&r.status!=='Inactive'&&!['Closed','Paused'].includes(r.relationshipStage)).map(r=>({record:r,availability:contactAvailability(r,day),state:!r.owner?'Unassigned':!r.nextContact?'Date needed':r.nextContact<=day?'Due':'Upcoming'})).sort((a,b)=>(a.record.nextContact||'0000').localeCompare(b.record.nextContact||'0000')||a.record.name.localeCompare(b.record.name));}
export function validateGrowth(r:R){
 if(r.kind==='partners'){
  for(const key of ['awayFrom','awayThrough'])if(r[key]&&!validGrowthDate(r[key]))return 'Choose valid contact absence dates.';
  if(!!r.awayFrom!==!!r.awayThrough||r.awayFrom&&r.awayFrom>r.awayThrough)return 'Contact absence needs a start and end date in order.';
  for(const key of ['backupContact','backupEmail','backupPhone','contactAvailabilityNote','relationshipNotes'])if(r[key]!=null&&(typeof r[key]!=='string'||r[key].length>(['relationshipNotes','contactAvailabilityNote'].includes(key)?4000:200)))return 'Contact and relationship notes exceed the field limit.';
  if(r.backupEmail&&!/^\S+@\S+\.\S+$/.test(r.backupEmail))return 'Enter a valid backup contact email.';
 }

 if(r.kind==='leads'&&r.referralIds!=null&&(!Array.isArray(r.referralIds)||r.referralIds.length>500||r.referralIds.some((id:any)=>typeof id!=='string')))return 'Invalid linked referrals.';
 if(r.kind==='partners'&&r.relationshipStage){
  if(!relationshipStages.includes(r.relationshipStage))return 'Choose a valid partnership stage.';
  if(typeof r.owner!=='string'||!r.owner.trim()||r.owner.length>200)return 'Assign a partnership owner.';
  if(r.nextContact&&!validGrowthDate(r.nextContact))return 'Choose a valid partnership follow-up date.';
  if(r.estimatedSeats!==''&&r.estimatedSeats!=null&&(!Number.isInteger(Number(r.estimatedSeats))||Number(r.estimatedSeats)<0||Number(r.estimatedSeats)>10000))return 'Potential seats must be a whole number from 0 to 10,000.';
 }
 if(r.touchpoints!=null){if(r.kind!=='partners'||!Array.isArray(r.touchpoints)||r.touchpoints.length>1000)return 'Invalid partnership contact history.';const ids=new Set();for(const t of r.touchpoints){if(!t.id||ids.has(t.id)||!validGrowthDate(t.date)||!['Call','Email','Visit','Meeting','Other'].includes(t.channel)||typeof t.summary!=='string'||!t.summary.trim()||t.summary.length>4000)return 'Contacts require a unique ID, valid date, channel and summary.';ids.add(t.id);}}
 if(r.kind==='referrals'){
  if(!referralStages.includes(r.status)||!r.partnerId||typeof r.owner!=='string'||!r.owner.trim()||!validGrowthDate(r.followUp))return 'Referrals need a source organization, owner, valid follow-up and status.';
  if(r.email&&!/^\S+@\S+\.\S+$/.test(r.email))return 'Enter a valid referral email.';
  if(r.phone&&String(r.phone).length>40)return 'Phone must be at most 40 characters.';
  if(typeof r.permissionNote!=='string'||!r.permissionNote.trim()||r.permissionNote.length>2000)return 'Record the source and contact permission context.';
  if(r.status==='Connected to lead'&&(!r.leadId||r.contactPermission!==true||(!r.email&&!r.phone)))return 'Confirm contact permission and contact information before connecting a referral to admissions.';
 }
 if(r.kind==='appointments'&&r.outreachEvent){
  if(!['Scheduled','Confirmed','Completed','Cancelled'].includes(r.status)||r.type!=='Recruiting event')return 'Choose a valid recruiting event status.';
  for(const f of ['budget','actualCost','expectedAttendance','actualAttendance'])if(r[f]!==''&&r[f]!=null&&(!Number.isFinite(Number(r[f]))||Number(r[f])<0||(['expectedAttendance','actualAttendance'].includes(f)&&!Number.isInteger(Number(r[f])))))return 'Event costs and attendance must be nonnegative; attendance must be whole numbers.';
  if(r.followUp&&!validGrowthDate(r.followUp))return 'Choose a valid event follow-up date.';
  if(r.status==='Completed'&&(typeof r.outcome!=='string'||!r.outcome.trim()||r.outcome.length>4000))return 'Record the event outcome before completing it.';
 }
 return null;
}
export function preserveGrowth(old:R,next:R){if(old.outreachEvent&&!next.outreachEvent)return 'A saved recruiting event cannot be changed into another appointment type.';const before=old.touchpoints||[],after=next.touchpoints||[];if(before.length>after.length||before.some((t:any,i:number)=>JSON.stringify(t)!==JSON.stringify(after[i])))return 'Saved outreach history cannot be changed or deleted. Add another contact note.';
 if(old.kind==='referrals'&&old.leadId&&(next.leadId!==old.leadId||next.partnerId!==old.partnerId||next.campusId!==old.campusId||next.status!=='Connected to lead'))return 'A saved referral handoff cannot be reset or reassigned. Keep its linked admissions history.';
 if(old.kind==='leads'&&((old.sourceReferral&&next.sourceReferral!==old.sourceReferral)||(old.referralIds||[]).some((id:string)=>!(next.referralIds||[]).includes(id))))return 'Saved referral links cannot be removed from an admissions lead.';
 return null;}
export function possibleDuplicate(records:R[],person:R){const email=String(person.email||'').trim().toLowerCase(),phone=String(person.phone||'').replace(/\D/g,'');return records.filter(r=>['leads','students'].includes(r.kind)&&r.id!==person.leadId&&((email&&String(r.email||'').trim().toLowerCase()===email)||(phone.length>=7&&String(r.phone||'').replace(/\D/g,'')===phone)));}
export function referralBundle(referral:R,partner:R,day:string,ids:string[]):R[]{
 const lead:R={id:ids[0],kind:'leads',name:referral.name,status:'New inquiry',campusId:referral.campusId,email:referral.email||'',phone:referral.phone||'',owner:referral.owner,program:referral.program||'Class A',followUp:referral.followUp||day,source:partner.name,partnerId:partner.id,sourceReferral:referral.id,preferredClassId:referral.preferredClassId||'',notes:[{at:new Date().toISOString(),channel:'Referral intake',text:'Referred by '+partner.name+'. Contact permission recorded in referral.'}]};
 return [{...referral,status:'Connected to lead',leadId:lead.id},lead,{id:ids[1],kind:'tasks',name:'Contact referred applicant — '+referral.name,status:'Open',campusId:referral.campusId,personId:lead.id,partnerId:partner.id,owner:referral.owner,due:lead.followUp,priority:'Normal',referralId:referral.id}];
}
export function linkReferralBundle(referral:R,lead:R,day:string,taskId:string):R[]{return [{...referral,status:'Connected to lead',leadId:lead.id},{...lead,referralIds:[...new Set([...(lead.referralIds||[]),referral.id])]}, {id:taskId,kind:'tasks',name:'Review additional referral — '+referral.name,status:'Open',campusId:referral.campusId,personId:lead.id,partnerId:referral.partnerId,owner:referral.owner,due:referral.followUp||day,priority:'Normal',referralId:referral.id}];}
export function growthLinkProblem(r:R,all:R[]){
 if(r.kind==='referrals'){
  const p=all.find(x=>x.id===r.partnerId&&x.kind==='partners');if(!p||campusOf(p,all)!==campusOf(r,all))return 'Referral organization must exist in the same campus.';
  if(r.status==='Connected to lead'){const l=all.find(x=>x.id===r.leadId&&x.kind==='leads');if(!l||(l.sourceReferral!==r.id&&!(l.referralIds||[]).includes(r.id))||campusOf(l,all)!==campusOf(r,all))return 'Use the referral handoff to create or link the admissions lead.';if(all.some(x=>x.kind==='leads'&&x.id!==l.id&&(x.sourceReferral===r.id||(x.referralIds||[]).includes(r.id))))return 'This referral already has an admissions lead.';}
 }
 if(r.kind==='leads'&&r.sourceReferral){const ref=all.find(x=>x.id===r.sourceReferral&&x.kind==='referrals');if(!ref||ref.leadId!==r.id||ref.status!=='Connected to lead')return 'Lead must match its connected referral.';if(all.some(x=>x.kind==='leads'&&x.id!==r.id&&x.sourceReferral===r.sourceReferral))return 'This referral already has an admissions lead.';}
 if(r.kind==='leads'&&r.referralIds){if(!Array.isArray(r.referralIds)||r.referralIds.length>500)return 'Invalid linked referrals.';for(const id of r.referralIds){const ref=all.find(x=>x.id===id&&x.kind==='referrals');if(!ref||ref.leadId!==r.id||ref.status!=='Connected to lead'||campusOf(ref,all)!==campusOf(r,all))return 'Linked referral must match its admissions lead and campus.';}}
 if(r.preferredClassId){const c=all.find(x=>x.id===r.preferredClassId&&x.kind==='classes');if(!c||campusOf(c,all)!==campusOf(r,all))return 'Preferred class must exist in the same campus.';}
 if(r.eventId){const event=all.find(x=>x.id===r.eventId&&x.kind==='appointments'&&x.outreachEvent);if(!event||campusOf(event,all)!==campusOf(r,all))return 'Lead event must exist in the same campus.';}
 if(r.kind==='appointments'&&r.outreachEvent&&r.partnerId){const p=all.find(x=>x.id===r.partnerId&&x.kind==='partners');if(!p||campusOf(p,all)!==campusOf(r,all))return 'Event organization must exist in the same campus.';}
 return null;
}
export function sourcePerformance(records:R[],partnerId?:string,eventId?:string){const leads=records.filter(r=>r.kind==='leads'&&(partnerId?r.partnerId===partnerId:true)&&(eventId?r.eventId===eventId:true)),ids=new Set(leads.map(l=>l.id)),students=records.filter(s=>s.kind==='students'&&ids.has(s.sourceLead));return {leads:leads.length,enrolled:students.length,open:leads.filter(l=>!['Enrolled','Closed'].includes(l.status)).length,conversion:leads.length?Math.round(students.length/leads.length*100):null};}
export function dueGrowth(records:R[],day:string){return records.filter(r=>(r.kind==='partners'&&r.status!=='Inactive'&&!['Closed','Paused'].includes(r.relationshipStage)&&r.nextContact&&r.nextContact<=day)||(r.kind==='referrals'&&['Received','Contact attempted'].includes(r.status)&&r.followUp<=day)||(r.kind==='appointments'&&r.outreachEvent&&r.status==='Completed'&&r.followUp&&r.followUp<=day));}
