import type {RecordData as R} from './training.ts';
import {latestDaily} from './training.ts';

export type AttentionAlert={id:string;recordId:string;recordName:string;recordKind:string;title:string;detail:string;resolution:string;priority:'High'|'Review'|'Today';page:string;blockedByConfiguration?:boolean};

/** Live, derived, non-dismissable attention items. They disappear only when the
 * saved evidence or operational state actually meets its resolution condition.
 * A resolved task is not proof a missing compliance document was verified.
 */
export function deriveAttentionAlerts(records:R[],asOf:string):AttentionAlert[]{
 const alerts:AttentionAlert[]=[];
 const append=(r:R,code:string,title:string,detail:string,resolution:string,priority:AttentionAlert['priority'],page:string,blockedByConfiguration=false)=>
  alerts.push({id:r.id+':'+code,recordId:r.id,recordName:r.name||'Unnamed record',recordKind:r.kind,title,detail,resolution,priority,page,blockedByConfiguration});
 for(const r of records){
  if(r.kind==='students'){
   if((r.assessments||[]).some((a:any)=>a?.score!==''&&a?.score!=null&&Number(a.score)<80))
    append(r,'assessment','Assessment remediation required','At least one saved assessment result is below 80%.','Review each failed attempt and save the required passing retake and documented remediation. Historical failed attempts remain visible.', 'High','students');
   if(['Classroom','Yard','Road'].some(p=>latestDaily(r,p)?.mood==='red'))
    append(r,'training','Training intervention required','The most recently saved classroom, yard or road review includes a red performance flag.','Instructor records an actual subsequent improvement and follow-up review; simply completing a task does not erase the red training observation.','High','students');
   if(!(r.documents||[]).some((d:any)=>d.verified===true))
    append(r,'documents','Enrollment file needs review','No verified document is recorded on this student profile.','Upload the required enrollment evidence securely and have an authorized campus reviewer verify it. This alert cannot clear while encrypted uploads remain disabled.','High','document-center',true);
   if((r.sessions||[]).some((s:any)=>s.score!==''&&s.score!=null&&Number(s.score)<80))
    append(r,'session-score','Assessment support needed','At least one recorded training score is below 80%.','Review that assessment, provide remediation and record a genuine passing retake; do not overwrite the original history.','Review','students');
  }else if(r.kind==='fleet'&&r.status!=='Ready')
   append(r,'fleet','Training vehicle unavailable','Vehicle status is '+r.status+'.','Complete the necessary repair/inspection and update the saved vehicle status to Ready.','High','fleet');
  else if(r.kind==='leads'&&r.followUp&&r.followUp<=asOf&&r.status!=='Enrolled'&&r.status!=='Closed')
   append(r,'lead','Admissions follow-up due','Follow-up date '+r.followUp+' has passed or is today.','Record the actual outreach outcome and move the follow-up date forward, or close/enroll the lead as appropriate.','Today','leads');
  else if(r.kind==='staff'&&r.status==='Pending credential')
   append(r,'credential','Staff credential verification pending','Staff status is Pending credential.','Authorized management must verify credentials and update the staff record accordingly.','High','credentials');
 }
 return alerts;
}
