import type {RecordData as R} from './training.ts';
export type MessagingDecision={ok:boolean;status:number;message?:string;campusTime?:string};
const localTime=(date:Date,zone:string)=>{
 const segments=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour:'2-digit',minute:'2-digit',weekday:'short',hourCycle:'h23'}).formatToParts(date);
 const get=(name:string)=>segments.find(x=>x.type===name)?.value||'';
 return {weekday:get('weekday'),hour:Number(get('hour')),minute:Number(get('minute'))};
};
export function campusTimeZone(campus:R|undefined):string|null{
 if(!campus)return null;
 const state=String(campus.state||'').trim().toUpperCase();
 if(['NC','NORTH CAROLINA'].includes(state)||/greensboro/i.test(campus.name||'')&&state!=='TX')return 'America/New_York';
 if(['TX','TEXAS'].includes(state)||/(mansfield|dallas)/i.test(campus.name||'')&&state!=='NC')return 'America/Chicago';
 return null;
}
/** Conservative outreach policy, not a legal determination. SMS only in
 * campus-local 9am–6pm Monday–Saturday and with recorded affirmative consent.
 * Messages are not queued or automatically rescheduled. */
export function messagePolicy(channel:string,recipient:R,campus:R|undefined,at:Date):MessagingDecision{
 if(!['SMS','Email'].includes(channel))return {ok:false,status:400,message:'Choose email or text.'};
 if((channel==='SMS'&&recipient.smsOptOut===true)||(channel==='Email'&&recipient.emailOptOut===true))return {ok:false,status:403,message:'The student opted out of this contact method. No message was sent.'};
 if(channel==='Email'){
  if(recipient.emailConsent!==true)return {ok:false,status:403,message:'Ask the student to explicitly approve email updates first.'};
  return {ok:true,status:200};
 }
 if(recipient.smsConsent!==true||!(recipient.consentRecordedAt||recipient.smsConsentAt||recipient.smsConsentSource))return {ok:false,status:403,message:'Record affirmative text-message consent and where or when it was obtained before sending.'};
 const zone=campusTimeZone(campus);
 if(!zone)return {ok:false,status:403,message:'Campus local time cannot be verified. Review the campus state before sending SMS.'};
 const time=localTime(at,zone);
 if(time.weekday==='Sun'||time.hour<9||time.hour>=18)return {ok:false,status:409,message:'Text messages are limited to Monday–Saturday, 9 a.m.–6 p.m. campus local time. Send during approved hours.',campusTime:time.weekday+' '+String(time.hour).padStart(2,'0')+':'+String(time.minute).padStart(2,'0')};
 return {ok:true,status:200,campusTime:time.weekday+' '+String(time.hour).padStart(2,'0')+':'+String(time.minute).padStart(2,'0')};
}
